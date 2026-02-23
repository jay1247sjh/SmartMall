"""
Embedding 服务（旧版兼容层）

新代码应使用 app.core.embedding_provider.get_embeddings()（LangChain 接口）。

本模块保留 EmbeddingService 类供 DataSyncService 等旧模块使用，
内部已改为委托给 LangChain Embedding 提供商。
"""

from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
import logging
import hashlib
import asyncio
from functools import lru_cache

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingError(Exception):
    """Embedding 生成错误"""
    pass


class EmbeddingService:
    """
    Embedding 服务（旧版兼容层）

    内部委托给 LangChain Embedding 提供商（get_embeddings()）。
    保留 chunk_text、缓存等工具方法。
    """

    def __init__(self, provider: str = None):
        self.provider_name = provider or settings.EMBEDDING_PROVIDER
        self._langchain_embeddings = None
        self.cache_enabled = settings.RAG_CACHE_ENABLED
        self._cache: Dict[str, List[float]] = {}
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP

    @property
    def _embeddings(self):
        """懒加载 LangChain Embeddings 实例"""
        if self._langchain_embeddings is None:
            from app.core.embedding_provider import get_embeddings
            self._langchain_embeddings = get_embeddings()
        return self._langchain_embeddings

    @property
    def dimension(self) -> int:
        """Embedding 维度"""
        return settings.EMBEDDING_DIMENSION

    def _get_cache_key(self, text: str) -> str:
        """生成缓存键"""
        return hashlib.md5(text.encode()).hexdigest()

    async def embed_text(self, text: str, use_cache: bool = True) -> List[float]:
        """生成文本 Embedding"""
        if not text or not text.strip():
            raise EmbeddingError("Empty text")

        if use_cache and self.cache_enabled:
            cache_key = self._get_cache_key(text)
            if cache_key in self._cache:
                return self._cache[cache_key]

        embedding = await asyncio.get_event_loop().run_in_executor(
            None, lambda: self._embeddings.embed_query(text)
        )

        if use_cache and self.cache_enabled:
            self._cache[cache_key] = embedding

        return embedding

    async def embed_batch(self, texts: List[str], use_cache: bool = True) -> List[List[float]]:
        """批量生成 Embedding"""
        if not texts:
            return []

        valid_texts = [t for t in texts if t and t.strip()]
        if not valid_texts:
            raise EmbeddingError("All texts are empty")

        results: Dict[int, List[float]] = {}
        texts_to_embed: List[tuple] = []

        if use_cache and self.cache_enabled:
            for i, text in enumerate(valid_texts):
                cache_key = self._get_cache_key(text)
                if cache_key in self._cache:
                    results[i] = self._cache[cache_key]
                else:
                    texts_to_embed.append((i, text))
        else:
            texts_to_embed = list(enumerate(valid_texts))

        if texts_to_embed:
            indices, texts_list = zip(*texts_to_embed)
            embeddings = await asyncio.get_event_loop().run_in_executor(
                None, lambda: self._embeddings.embed_documents(list(texts_list))
            )

            for idx, embedding in zip(indices, embeddings):
                results[idx] = embedding
                if use_cache and self.cache_enabled:
                    cache_key = self._get_cache_key(valid_texts[idx])
                    self._cache[cache_key] = embedding

        return [results[i] for i in range(len(valid_texts))]

    def chunk_text(self, text: str) -> List[str]:
        """将长文本分块"""
        if not text or not text.strip():
            return []

        text = text.strip()
        if len(text) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size

            if end < len(text):
                for sep in ["。", "！", "？", ".", "!", "?", "\n"]:
                    last_sep = text.rfind(sep, start, end)
                    if last_sep > start:
                        end = last_sep + 1
                        break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - self.chunk_overlap if end < len(text) else end

        return chunks

    async def embed_long_text(self, text: str) -> List[float]:
        """处理长文本，分块后取平均"""
        chunks = self.chunk_text(text)

        if len(chunks) == 1:
            return await self.embed_text(chunks[0])

        embeddings = await self.embed_batch(chunks)

        import numpy as np
        avg_embedding = np.mean(embeddings, axis=0)
        norm = np.linalg.norm(avg_embedding)
        if norm > 0:
            avg_embedding = avg_embedding / norm

        return avg_embedding.tolist()

    def clear_cache(self) -> None:
        """清空缓存"""
        self._cache.clear()

    def cache_size(self) -> int:
        """获取缓存大小"""
        return len(self._cache)


_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """获取 Embedding 服务单例"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
