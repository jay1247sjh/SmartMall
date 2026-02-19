"""
Embedding 提供商模块

使用 LangChain Embeddings 接口，通过 Ollama 调用本地 bge-m3 模型，
备用 Qwen Embedding（OpenAI 兼容接口），通过 with_fallbacks() 实现自动降级。

提供便捷工厂方法：
- get_embeddings() - 带 fallback 的 Embedding 实例
- get_current_provider_name() - 当前活跃提供商名称
"""

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from langchain_core.embeddings import Embeddings

from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaEmbeddingProvider(Embeddings):
    """基于 Ollama 的本地 Embedding 提供商（bge-m3）"""

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """同步批量 Embedding（LangChain 接口要求）"""
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                settings.OLLAMA_EMBEDDING_URL,
                json={
                    "model": settings.OLLAMA_EMBEDDING_MODEL,
                    "input": texts,
                },
            )
            response.raise_for_status()
            return response.json()["embeddings"]

    def embed_query(self, text: str) -> List[float]:
        """同步单条 Embedding"""
        results = self.embed_documents([text])
        return results[0]

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        """异步批量 Embedding"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.OLLAMA_EMBEDDING_URL,
                json={
                    "model": settings.OLLAMA_EMBEDDING_MODEL,
                    "input": texts,
                },
            )
            response.raise_for_status()
            return response.json()["embeddings"]

    async def aembed_query(self, text: str) -> List[float]:
        """异步单条 Embedding"""
        results = await self.aembed_documents([text])
        return results[0]


class QwenEmbeddingAdapter(Embeddings):
    """Qwen Embedding 适配器（OpenAI 兼容接口）"""

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """同步批量 Embedding"""
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{settings.QWEN_BASE_URL}/embeddings",
                headers={
                    "Authorization": f"Bearer {settings.QWEN_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.QWEN_EMBEDDING_MODEL,
                    "input": texts,
                },
            )
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in data["data"]]

    def embed_query(self, text: str) -> List[float]:
        """同步单条 Embedding"""
        results = self.embed_documents([text])
        return results[0]

    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        """异步批量 Embedding"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.QWEN_BASE_URL}/embeddings",
                headers={
                    "Authorization": f"Bearer {settings.QWEN_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.QWEN_EMBEDDING_MODEL,
                    "input": texts,
                },
            )
            response.raise_for_status()
            data = response.json()
            return [item["embedding"] for item in data["data"]]

    async def aembed_query(self, text: str) -> List[float]:
        """异步单条 Embedding"""
        results = await self.aembed_documents([text])
        return results[0]


class EmbeddingProvider:
    """Embedding 提供商，带自动回退（Ollama → Qwen）"""

    @classmethod
    def get_embeddings(cls) -> Embeddings:
        """
        获取带回退能力的 Embedding 实例。

        主：Ollama bge-m3（本地）
        备：Qwen Embedding（远程）

        Returns:
            带 fallback 的 Embedding 实例
        """
        primary = OllamaEmbeddingProvider()
        fallback = QwenEmbeddingAdapter()

        logger.info(json.dumps({
            "event": "embedding_provider_init",
            "primary": f"ollama/{settings.OLLAMA_EMBEDDING_MODEL}",
            "fallback": f"qwen/{settings.QWEN_EMBEDDING_MODEL}",
        }, ensure_ascii=False))

        return primary.with_fallbacks(
            [fallback],
            exceptions_to_handle=(Exception,),
        )

    @classmethod
    def get_current_provider_name(cls) -> str:
        """
        获取当前活跃的 Embedding 提供商名称（用于元数据标记）。

        通过 Ollama 健康检查判断：可用返回 "ollama"，否则返回 "qwen_fallback"。
        """
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.post(
                    settings.OLLAMA_EMBEDDING_URL,
                    json={
                        "model": settings.OLLAMA_EMBEDDING_MODEL,
                        "input": ["health_check"],
                    },
                )
                response.raise_for_status()
                return "ollama"
        except Exception as e:
            logger.warning(json.dumps({
                "event": "embedding_degradation",
                "reason": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "impact": "fallback_to_qwen",
            }, ensure_ascii=False))
            return "qwen_fallback"


# === 模块级便捷工厂方法 ===

def get_embeddings() -> Embeddings:
    """获取带回退能力的 Embedding 实例"""
    return EmbeddingProvider.get_embeddings()


def get_current_provider_name() -> str:
    """获取当前活跃的 Embedding 提供商名称"""
    return EmbeddingProvider.get_current_provider_name()
