"""
实时语音会话服务
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncIterator, Dict, List, Optional

from app.core.agent.agent import SAFE_RESPONSE, SmartMallAgentFactory, is_unsafe_input
from app.core.config import get_settings
from app.core.errors import parse_llm_error
from app.core.memory.manager import MemoryManager
from app.core.rag.orchestrator import RAGOrchestrator
from app.core.agent.runtime_context import set_agent_context, reset_agent_context
from app.core.speech import get_speech_provider

logger = logging.getLogger(__name__)


class RealtimeVoiceService:
    """处理语音转文本、LLM 推理与 TTS 回传。"""

    def __init__(self) -> None:
        self._speech = get_speech_provider()
        self._settings = get_settings()

    async def reset_session(self, session_id: str) -> None:
        await self._speech.reset_session(session_id)

    async def push_audio(
        self,
        session_id: str,
        audio_bytes: bytes,
        hinted_text: Optional[str] = None,
        is_final: bool = False,
    ) -> Optional[str]:
        return await self._speech.feed_audio_chunk(
            session_id=session_id,
            audio_bytes=audio_bytes,
            hinted_text=hinted_text,
            is_final=is_final,
        )

    async def finalize_transcript(self, session_id: str) -> str:
        return await self._speech.finalize_transcript(session_id)

    def get_voice_capabilities(self) -> Dict[str, Any]:
        return self._speech.get_capabilities()

    async def process_transcript(
        self,
        session_id: str,
        user_id: str,
        transcript: str,
        interrupted: asyncio.Event,
    ) -> AsyncIterator[Dict[str, Any]]:
        transcript = (transcript or "").strip()
        if not transcript:
            yield {"type": "error", "message": "未识别到有效语音内容，请重试。"}
            return

        if is_unsafe_input(transcript):
            async for event in self._stream_answer_with_tts(SAFE_RESPONSE, interrupted):
                yield event
            return

        try:
            memory = MemoryManager(user_id=user_id)
            rag_data = await RAGOrchestrator.augment(transcript, context=None)
            prompt_context = await memory.build_prompt_context(
                transcript,
                rag_context=rag_data.get("rag_context") or None,
            )
            chat_history = [
                msg
                for msg in prompt_context[1:-1]
                if msg.get("role") != "system"
            ]
            system_message = prompt_context[0]["content"] if prompt_context else ""
            short_count = len(await memory.get_short_term_messages())

            agent = SmartMallAgentFactory.create(streaming=False)
            tokens = set_agent_context(user_id=user_id, user_role="USER")
            try:
                result = await agent.ainvoke(
                    {
                        "input": transcript,
                        "system_message": system_message,
                        "chat_history": chat_history,
                    }
                )
            finally:
                reset_agent_context(tokens)

            output = str(result.get("output", "")).strip()
            tool_results = self._extract_tool_results(result.get("intermediate_steps", []))
            confirmation = self._detect_confirmation(tool_results)

            if confirmation:
                logger.info(
                    json.dumps(
                        {
                            "event": "voice_confirmation_required",
                            "user_id": user_id,
                            "rag_used": bool(rag_data.get("rag_used")),
                            "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
                            "memory_short_count": short_count,
                        },
                        ensure_ascii=False,
                    )
                )
                yield {
                    "type": "confirmation_required",
                    "action": confirmation.get("function"),
                    "args": confirmation.get("result", {}).get("args", {}),
                    "message": confirmation.get("result", {}).get("message", "此操作需要确认"),
                }
                return

            await memory.save_turn(transcript, output)
            logger.info(
                json.dumps(
                    {
                        "event": "voice_chat_completed",
                        "user_id": user_id,
                        "rag_used": bool(rag_data.get("rag_used")),
                        "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
                        "memory_short_count": short_count,
                    },
                    ensure_ascii=False,
                )
            )
            async for event in self._stream_answer_with_tts(output, interrupted):
                yield event

        except Exception as e:
            _, error_type, user_message = parse_llm_error(e)
            yield {
                "type": "error",
                "message": user_message,
                "error_type": error_type,
            }

    async def _stream_answer_with_tts(
        self,
        text: str,
        interrupted: asyncio.Event,
    ) -> AsyncIterator[Dict[str, Any]]:
        answer = text.strip()
        if not answer:
            answer = "我暂时没有生成有效回复，请换个说法试试。"

        for delta in self._chunk_text(answer):
            if interrupted.is_set():
                interrupted.clear()
                yield {"type": "done", "status": "interrupted"}
                return
            yield {"type": "assistant_text_delta", "text": delta}
            await asyncio.sleep(0)

        yield {"type": "assistant_text_final", "text": answer}

        async for audio_chunk in self._speech.stream_tts(answer):
            if interrupted.is_set():
                interrupted.clear()
                yield {"type": "done", "status": "interrupted"}
                return
            yield {"type": "tts_chunk", "audio_base64": self._b64(audio_chunk)}

        yield {"type": "done", "status": "ok"}

    def _chunk_text(self, text: str, chunk_size: int = 12) -> List[str]:
        return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]

    def _extract_tool_results(self, intermediate_steps: list) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        if not intermediate_steps:
            return results
        for action, observation in intermediate_steps:
            tool_result = observation if isinstance(observation, dict) else {"result": str(observation)}
            args = action.tool_input if isinstance(action.tool_input, dict) else {"input": str(action.tool_input)}
            results.append(
                {
                    "function": action.tool,
                    "args": args,
                    "result": tool_result,
                }
            )
        return results

    def _detect_confirmation(self, tool_results: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        for item in tool_results:
            result = item.get("result")
            if isinstance(result, dict) and result.get("type") == "confirmation_required":
                return item
        return None

    def _b64(self, data: bytes) -> str:
        import base64

        return base64.b64encode(data).decode("utf-8")

