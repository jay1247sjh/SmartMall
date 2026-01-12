"""
RAG (Retrieval-Augmented Generation) 模块

提供基于 Milvus 向量数据库和 LangChain 的语义检索能力
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

# 延迟导入（避免循环依赖，模块创建后再添加）
def __getattr__(name):
    if name == "SmartMallRetriever":
        from app.core.rag.retriever import SmartMallRetriever
        return SmartMallRetriever
    elif name == "RAGService":
        from app.core.rag.service import RAGService
        return RAGService
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
