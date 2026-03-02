"""
语音 Provider 抽象层

定义统一语音接口，支持替换不同 ASR/TTS 服务商实现。
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, AsyncIterator, Dict, Optional

from app.core.config import settings


class SpeechProvider(ABC):
    """语音能力抽象接口"""

    @abstractmethod
    async def reset_session(self, session_id: str) -> None:
        """重置会话缓存"""

    @abstractmethod
    async def feed_audio_chunk(
        self,
        session_id: str,
        audio_bytes: bytes,
        hinted_text: Optional[str] = None,
        is_final: bool = False,
    ) -> Optional[str]:
        """
        写入音频分片并返回可选的 ASR partial 文本。
        """

    @abstractmethod
    async def finalize_transcript(self, session_id: str) -> str:
        """
        结束本轮音频输入，输出最终转写文本。
        """

    @abstractmethod
    async def stream_tts(self, text: str, session_id: Optional[str] = None) -> AsyncIterator[bytes]:
        """
        以流式方式输出 TTS 音频分片。
        """

    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """
        返回当前语音能力信息，用于前端提示当前模式。
        """


_provider: SpeechProvider | None = None


def get_speech_provider() -> SpeechProvider:
    """获取语音 Provider 单例"""
    global _provider
    if _provider is not None:
        return _provider

    if settings.SPEECH_PROVIDER == "dashscope":
        from app.core.speech.dashscope_speech_provider import DashscopeSpeechProvider

        _provider = DashscopeSpeechProvider()
    else:
        from app.core.speech.dashscope_speech_provider import DashscopeSpeechProvider

        _provider = DashscopeSpeechProvider()

    return _provider
