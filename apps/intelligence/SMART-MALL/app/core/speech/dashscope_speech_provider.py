"""
DashScope 语音 Provider（可降级实现）

说明：
- 当前实现优先使用客户端传入的 hinted_text 作为转写结果；
- 当无可用文本时返回兜底提示，保证语音链路稳定；
- TTS 使用本地生成 WAV 音频作为可运行默认实现。
"""

from __future__ import annotations

import asyncio
import io
import math
import struct
import wave
from dataclasses import dataclass, field
from typing import Any, AsyncIterator, Dict, Optional

from app.core.speech.speech_provider import SpeechProvider


@dataclass
class _SessionBuffer:
    chunks: list[bytes] = field(default_factory=list)
    partial_texts: list[str] = field(default_factory=list)


class DashscopeSpeechProvider(SpeechProvider):
    """
    语音 Provider 默认实现。

    该实现保留统一接口，后续可替换为真实云端流式 ASR/TTS。
    """

    def __init__(self) -> None:
        self._sessions: dict[str, _SessionBuffer] = {}
        self._lock = asyncio.Lock()

    async def reset_session(self, session_id: str) -> None:
        async with self._lock:
            self._sessions[session_id] = _SessionBuffer()

    async def feed_audio_chunk(
        self,
        session_id: str,
        audio_bytes: bytes,
        hinted_text: Optional[str] = None,
        is_final: bool = False,
    ) -> Optional[str]:
        async with self._lock:
            session = self._sessions.setdefault(session_id, _SessionBuffer())
            if audio_bytes:
                session.chunks.append(audio_bytes)
            if hinted_text:
                text = hinted_text.strip()
                if text:
                    session.partial_texts.append(text)
                    return text
        return None

    async def finalize_transcript(self, session_id: str) -> str:
        async with self._lock:
            session = self._sessions.setdefault(session_id, _SessionBuffer())
            if session.partial_texts:
                text = session.partial_texts[-1]
            elif session.chunks:
                text = "已收到语音输入，请继续完善语音识别配置后获得精确转写。"
            else:
                text = ""
            self._sessions[session_id] = _SessionBuffer()
            return text

    async def stream_tts(self, text: str, session_id: Optional[str] = None) -> AsyncIterator[bytes]:
        if not text.strip():
            return

        wav_bytes = self._generate_tone_wav(text)
        chunk_size = 16 * 1024
        for i in range(0, len(wav_bytes), chunk_size):
            yield wav_bytes[i : i + chunk_size]
            await asyncio.sleep(0)

    def _generate_tone_wav(self, text: str) -> bytes:
        sample_rate = 16000
        duration_sec = max(0.4, min(4.0, len(text) * 0.06))
        frequency = 440.0
        amplitude = 9000
        n_samples = int(sample_rate * duration_sec)

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)

            frames = bytearray()
        for i in range(n_samples):
            value = int(amplitude * math.sin(2 * math.pi * frequency * i / sample_rate))
            frames.extend(struct.pack("<h", value))
        wav_file.writeframes(frames)

        return buffer.getvalue()

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "provider": "dashscope-fallback",
            "asr_mode": "browser_hint",
            "tts_mode": "tone_fallback",
            "degraded": True,
            "message": "当前未配置生产级 ASR/TTS Key，正在使用降级语音模式。",
        }
