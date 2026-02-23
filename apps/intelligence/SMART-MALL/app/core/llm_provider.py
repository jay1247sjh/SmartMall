"""
LLM 提供商模块

使用 LangChain ChatOpenAI 创建主 LLM（OpenRouter）和备用 LLM（Qwen），
通过 with_fallbacks() 实现自动降级。

提供便捷工厂方法：
- get_llm(streaming) - 带 fallback 的文本 LLM
- get_vision_llm() - 视觉模型（无 fallback）
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional, Union

from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider:
    """LangChain LLM 提供商，带自动回退"""

    @classmethod
    def _create_primary_llm(cls, streaming: bool = False) -> ChatOpenAI:
        """创建主 LLM 实例（OpenRouter）"""
        return ChatOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            model=settings.OPENROUTER_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            streaming=streaming,
        )

    @classmethod
    def _create_fallback_llm(cls, streaming: bool = False) -> ChatOpenAI:
        """创建备用 LLM 实例（Qwen）"""
        return ChatOpenAI(
            api_key=settings.QWEN_API_KEY,
            base_url=settings.QWEN_BASE_URL,
            model=settings.QWEN_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            streaming=streaming,
        )

    @classmethod
    def get_llm(cls, streaming: bool = False) -> BaseChatModel:
        """
        获取带回退能力的 LLM 实例。

        主：OpenRouter (stepfun/step-3.5-flash:free)
        备：Qwen

        Args:
            streaming: 是否启用流式输出

        Returns:
            带 fallback 的 LLM 实例
        """
        primary = cls._create_primary_llm(streaming=streaming)
        fallback = cls._create_fallback_llm(streaming=streaming)

        logger.info(json.dumps({
            "event": "llm_provider_init",
            "primary": settings.OPENROUTER_MODEL,
            "fallback": settings.QWEN_MODEL,
            "streaming": streaming,
        }, ensure_ascii=False))

        return primary.with_fallbacks(
            [fallback],
            exceptions_to_handle=(Exception,),
        )

    @classmethod
    def get_vision_llm(cls) -> ChatOpenAI:
        """
        获取视觉模型实例（多模态，支持图片输入）。

        使用 OpenRouter nvidia/nemotron-nano-12b-v2-vl:free。
        不走 fallback 链，视觉模型无备用。

        Returns:
            视觉 LLM 实例
        """
        logger.info(json.dumps({
            "event": "vision_llm_init",
            "model": settings.OPENROUTER_VISION_MODEL,
        }, ensure_ascii=False))

        return ChatOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL,
            model=settings.OPENROUTER_VISION_MODEL,
            temperature=settings.VISION_LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )


# === 模块级便捷工厂方法 ===

def get_llm(streaming: bool = False) -> BaseChatModel:
    """获取带回退能力的 LLM 实例"""
    return LLMProvider.get_llm(streaming=streaming)


def get_vision_llm() -> ChatOpenAI:
    """获取视觉模型实例"""
    return LLMProvider.get_vision_llm()
