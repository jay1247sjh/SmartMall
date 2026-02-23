"""
RAG (Retrieval-Augmented Generation) 模块

提供基于 Milvus 向量数据库和 LangChain 的语义检索能力。

Embedding: 使用 app.core.embedding_provider.get_embeddings()（LangChain 接口）
Retriever: 使用 RAGRetrieverFactory（基于 langchain-milvus）
"""

from app.core.rag.milvus_client import MilvusClient
from app.core.rag.embedding import EmbeddingService, get_embedding_service
from app.core.rag.schemas import (
    StoreDocument,
    ProductDocument,
    LocationDocument,
    STORES_SCHEMA,
    PRODUCTS_SCHEMA,
    LOCATIONS_SCHEMA,
)

__all__ = [
    "MilvusClient",
    "EmbeddingService",
    "get_embedding_service",
    "StoreDocument",
    "ProductDocument",
    "LocationDocument",
    "STORES_SCHEMA",
    "PRODUCTS_SCHEMA",
    "LOCATIONS_SCHEMA",
]


def __getattr__(name):
    if name == "RAGService":
        from app.core.rag.service import RAGService
        return RAGService
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
