"""
Embedding 生成服务

支持多种 Embedding 提供商：
- 通义千问 (Qwen) - 推荐，中文效果好
- OpenAI
- 本地模型 (BGE-M3, M3E)
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


class EmbeddingProvider(ABC):
    """Embedding 提供商基类"""
    
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """生成单个文本的 Embedding"""
        pass
    
    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """批量生成 Embedding"""
        pass
    
    @property
    @abstractmethod
    def dimension(self) -> int:
        """Embedding 维度"""
        pass


class QwenEmbeddingProvider(EmbeddingProvider):
    """
    通义千问 Embedding 提供商
    
    使用阿里云百炼 API，中文效果好
    """
    
    def __init__(self):
        self.api_key = settings.QWEN_API_KEY
        self.base_url = settings.QWEN_BASE_URL
        self.model = settings.QWEN_EMBEDDING_MODEL
        self._dimension = settings.EMBEDDING_DIMENSION
        
        if not self.api_key:
            logger.warning("QWEN_API_KEY not set, Qwen embedding will not work")
    
    @property
    def dimension(self) -> int:
        return self._dimension
    
    async def embed_text(self, text: str) -> List[float]:
        """生成单个文本的 Embedding"""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "input": text
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data["data"][0]["embedding"]
                
        except Exception as e:
            logger.error(f"Qwen embedding error: {e}")
            raise EmbeddingError(f"Failed to generate embedding: {e}")
    
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """批量生成 Embedding"""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "input": texts
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                data = response.json()
                return [item["embedding"] for item in data["data"]]
                
        except Exception as e:
            logger.error(f"Qwen batch embedding error: {e}")
            raise EmbeddingError(f"Failed to generate batch embeddings: {e}")


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI Embedding 提供商"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.base_url = settings.OPENAI_BASE_URL
        self.model = settings.OPENAI_EMBEDDING_MODEL
        self._dimension = 1536 if "ada" in self.model else 3072
        
        if not self.api_key:
            logger.warning("OPENAI_API_KEY not set, OpenAI embedding will not work")
    
    @property
    def dimension(self) -> int:
        return self._dimension
    
    async def embed_text(self, text: str) -> List[float]:
        """生成单个文本的 Embedding"""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "input": text
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data["data"][0]["embedding"]
                
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            raise EmbeddingError(f"Failed to generate embedding: {e}")
    
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """批量生成 Embedding"""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "input": texts
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                data = response.json()
                return [item["embedding"] for item in data["data"]]
                
        except Exception as e:
            logger.error(f"OpenAI batch embedding error: {e}")
            raise EmbeddingError(f"Failed to generate batch embeddings: {e}")


class LocalEmbeddingProvider(EmbeddingProvider):
    """
    本地 Embedding 提供商
    
    使用 sentence-transformers 加载本地模型（BGE-M3, M3E 等）
    """
    
    def __init__(self):
        self.model_name = settings.LOCAL_EMBEDDING_MODEL
        self._model = None
        self._dimension = settings.EMBEDDING_DIMENSION
    
    @property
    def dimension(self) -> int:
        return self._dimension
    
    def _load_model(self):
        """懒加载模型"""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading local embedding model: {self.model_name}")
                self._model = SentenceTransformer(self.model_name)
                self._dimension = self._model.get_sentence_embedding_dimension()
                logger.info(f"Model loaded, dimension: {self._dimension}")
            except Exception as e:
                logger.error(f"Failed to load local model: {e}")
                raise EmbeddingError(f"Failed to load local model: {e}")
        return self._model
    
    async def embed_text(self, text: str) -> List[float]:
        """生成单个文本的 Embedding"""
        try:
            model = self._load_model()
            # 在线程池中运行同步代码
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                None,
                lambda: model.encode(text, normalize_embeddings=True).tolist()
            )
            return embedding
        except Exception as e:
            logger.error(f"Local embedding error: {e}")
            raise EmbeddingError(f"Failed to generate embedding: {e}")
    
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """批量生成 Embedding"""
        try:
            model = self._load_model()
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                None,
                lambda: model.encode(texts, normalize_embeddings=True).tolist()
            )
            return embeddings
        except Exception as e:
            logger.error(f"Local batch embedding error: {e}")
            raise EmbeddingError(f"Failed to generate batch embeddings: {e}")


class EmbeddingService:
    """
    Embedding 服务
    
    提供：
    - 多提供商支持
    - 文本分块
    - 缓存机制
    """
    
    def __init__(self, provider: str = None):
        """
        初始化 Embedding 服务
        
        Args:
            provider: 提供商名称 (qwen/openai/local)
        """
        provider = provider or settings.EMBEDDING_PROVIDER
        self.provider_name = provider
        self.provider = self._create_provider(provider)
        self.cache_enabled = settings.RAG_CACHE_ENABLED
        self._cache: Dict[str, List[float]] = {}
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP
    
    def _create_provider(self, provider: str) -> EmbeddingProvider:
        """创建 Embedding 提供商"""
        providers = {
            "qwen": QwenEmbeddingProvider,
            "openai": OpenAIEmbeddingProvider,
            "local": LocalEmbeddingProvider,
        }
        
        if provider not in providers:
            raise ValueError(f"Unknown embedding provider: {provider}")
        
        return providers[provider]()
    
    @property
    def dimension(self) -> int:
        """Embedding 维度"""
        return self.provider.dimension
    
    def _get_cache_key(self, text: str) -> str:
        """生成缓存键"""
        return hashlib.md5(text.encode()).hexdigest()
    
    async def embed_text(self, text: str, use_cache: bool = True) -> List[float]:
        """
        生成文本 Embedding
        
        Args:
            text: 输入文本
            use_cache: 是否使用缓存
            
        Returns:
            Embedding 向量
        """
        if not text or not text.strip():
            raise EmbeddingError("Empty text")
        
        # 检查缓存
        if use_cache and self.cache_enabled:
            cache_key = self._get_cache_key(text)
            if cache_key in self._cache:
                logger.debug(f"Cache hit for embedding")
                return self._cache[cache_key]
        
        # 生成 Embedding
        embedding = await self.provider.embed_text(text)
        
        # 存入缓存
        if use_cache and self.cache_enabled:
            self._cache[cache_key] = embedding
        
        return embedding
    
    async def embed_batch(self, texts: List[str], use_cache: bool = True) -> List[List[float]]:
        """
        批量生成 Embedding
        
        Args:
            texts: 文本列表
            use_cache: 是否使用缓存
            
        Returns:
            Embedding 向量列表
        """
        if not texts:
            return []
        
        # 过滤空文本
        valid_texts = [t for t in texts if t and t.strip()]
        if not valid_texts:
            raise EmbeddingError("All texts are empty")
        
        # 检查缓存，找出需要生成的文本
        results: Dict[int, List[float]] = {}
        texts_to_embed: List[tuple] = []  # (index, text)
        
        if use_cache and self.cache_enabled:
            for i, text in enumerate(valid_texts):
                cache_key = self._get_cache_key(text)
                if cache_key in self._cache:
                    results[i] = self._cache[cache_key]
                else:
                    texts_to_embed.append((i, text))
        else:
            texts_to_embed = list(enumerate(valid_texts))
        
        # 批量生成未缓存的 Embedding
        if texts_to_embed:
            indices, texts_list = zip(*texts_to_embed)
            embeddings = await self.provider.embed_batch(list(texts_list))
            
            for idx, embedding in zip(indices, embeddings):
                results[idx] = embedding
                if use_cache and self.cache_enabled:
                    cache_key = self._get_cache_key(valid_texts[idx])
                    self._cache[cache_key] = embedding
        
        # 按原始顺序返回
        return [results[i] for i in range(len(valid_texts))]
    
    def chunk_text(self, text: str) -> List[str]:
        """
        将长文本分块
        
        Args:
            text: 输入文本
            
        Returns:
            文本块列表
        """
        if not text:
            return []
        
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # 尝试在句子边界分割
            if end < len(text):
                # 查找最近的句子结束符
                for sep in ["。", "！", "？", ".", "!", "?", "\n"]:
                    last_sep = text.rfind(sep, start, end)
                    if last_sep > start:
                        end = last_sep + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # 下一个块的起始位置（考虑重叠）
            start = end - self.chunk_overlap if end < len(text) else end
        
        return chunks
    
    async def embed_long_text(self, text: str) -> List[float]:
        """
        处理长文本，分块后取平均
        
        Args:
            text: 长文本
            
        Returns:
            平均 Embedding 向量
        """
        chunks = self.chunk_text(text)
        
        if len(chunks) == 1:
            return await self.embed_text(chunks[0])
        
        embeddings = await self.embed_batch(chunks)
        
        # 计算平均向量
        import numpy as np
        avg_embedding = np.mean(embeddings, axis=0)
        # 归一化
        norm = np.linalg.norm(avg_embedding)
        if norm > 0:
            avg_embedding = avg_embedding / norm
        
        return avg_embedding.tolist()
    
    def clear_cache(self) -> None:
        """清空缓存"""
        self._cache.clear()
        logger.info("Embedding cache cleared")
    
    def cache_size(self) -> int:
        """获取缓存大小"""
        return len(self._cache)


# 全局服务实例（懒加载）
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """获取 Embedding 服务单例"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
