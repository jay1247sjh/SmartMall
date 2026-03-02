"""
语音全双工 WebSocket 接口
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.services.realtime_voice_service import RealtimeVoiceService

router = APIRouter()
logger = logging.getLogger(__name__)


def _now_epoch() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def _expected_sig(session_id: str, user_id: str, exp: int) -> str:
    payload = f"{session_id}:{user_id}:{exp}".encode("utf-8")
    secret = settings.VOICE_SIGNING_SECRET.encode("utf-8")
    return hmac.new(secret, payload, hashlib.sha256).hexdigest()


def _valid_token(session_id: str, user_id: str, exp_str: str, sig: str) -> tuple[bool, str]:
    if not session_id or not user_id or not exp_str or not sig:
        return False, "missing_token_fields"

    try:
        exp = int(exp_str)
    except ValueError:
        return False, "invalid_exp"

    if exp < _now_epoch():
        return False, "expired"

    expected = _expected_sig(session_id, user_id, exp)
    if not hmac.compare_digest(expected, sig):
        return False, "invalid_sig"
    return True, ""


async def _emit_processing(
    websocket: WebSocket,
    service: RealtimeVoiceService,
    session_id: str,
    user_id: str,
    transcript: str,
    interrupted: asyncio.Event,
) -> None:
    async for event in service.process_transcript(
        session_id=session_id,
        user_id=user_id,
        transcript=transcript,
        interrupted=interrupted,
    ):
        await websocket.send_json(event)


@router.websocket("/voice/ws")
async def voice_ws(websocket: WebSocket) -> None:
    if not settings.AI_VOICE_ENABLED:
        await websocket.close(code=4403, reason="AI_VOICE_DISABLED")
        return

    query = websocket.query_params
    session_id = query.get("session_id", "")
    user_id = query.get("user_id", "")
    exp_str = query.get("exp", "")
    sig = query.get("sig", "")

    ok, reason = _valid_token(session_id, user_id, exp_str, sig)
    if not ok:
        close_reason = "AI_VOICE_SESSION_EXPIRED" if reason == "expired" else "AI_VOICE_TOKEN_INVALID"
        await websocket.close(code=4401, reason=close_reason)
        return

    await websocket.accept()
    service = RealtimeVoiceService()
    await service.reset_session(session_id)
    capabilities = service.get_voice_capabilities()
    interrupted = asyncio.Event()
    processing_task: Optional[asyncio.Task] = None

    logger.info("Voice websocket connected: session_id=%s user_id=%s", session_id, user_id)
    await websocket.send_json(
        {
            "type": "session_ready",
            "session_id": session_id,
            "capabilities": capabilities,
        }
    )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message: Dict[str, Any] = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON payload"})
                continue

            msg_type = message.get("type")
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg_type == "start":
                await service.reset_session(session_id)
                await websocket.send_json({"type": "started"})
                continue

            if msg_type == "interrupt":
                interrupted.set()
                await websocket.send_json({"type": "done", "status": "interrupted"})
                continue

            if msg_type == "audio_chunk":
                audio_b64 = message.get("audio_base64")
                hinted_text = message.get("text")
                is_final = bool(message.get("is_final", False))

                audio_bytes = b""
                if isinstance(audio_b64, str) and audio_b64:
                    try:
                        audio_bytes = base64.b64decode(audio_b64)
                    except Exception:
                        await websocket.send_json({"type": "error", "message": "Invalid audio chunk"})
                        continue

                partial = await service.push_audio(
                    session_id=session_id,
                    audio_bytes=audio_bytes,
                    hinted_text=hinted_text if isinstance(hinted_text, str) else None,
                    is_final=is_final,
                )
                if partial:
                    await websocket.send_json({"type": "asr_partial", "text": partial})
                continue

            if msg_type == "stop":
                transcript = await service.finalize_transcript(session_id)
                await websocket.send_json({"type": "asr_final", "text": transcript})

                if processing_task and not processing_task.done():
                    interrupted.set()
                    processing_task.cancel()

                interrupted.clear()
                processing_task = asyncio.create_task(
                    _emit_processing(
                        websocket=websocket,
                        service=service,
                        session_id=session_id,
                        user_id=user_id,
                        transcript=transcript,
                        interrupted=interrupted,
                    )
                )
                continue

            await websocket.send_json({"type": "error", "message": f"Unsupported message type: {msg_type}"})

    except WebSocketDisconnect:
        logger.info("Voice websocket disconnected: session_id=%s", session_id)
    except Exception as e:
        logger.exception("Voice websocket error: %s", e)
        try:
            await websocket.send_json({"type": "error", "message": "AI_ASR_PROVIDER_UNAVAILABLE"})
        except Exception:
            pass
    finally:
        if processing_task and not processing_task.done():
            processing_task.cancel()
