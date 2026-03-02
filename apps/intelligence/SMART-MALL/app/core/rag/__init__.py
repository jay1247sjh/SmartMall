"""
RAG (Retrieval-Augmented Generation) 模块。

说明：这里采用惰性导出，避免仅导入 `app.core.rag.*` 时立刻触发
Milvus/Pandas/PyArrow 等重量依赖初始化，提升测试与启动弹性。
"""

__all__ = [
    "MilvusClient",
    "EmbeddingService",
    "get_embedding_service",
    "StoreDocument",
    "ProductDocument",
    "LocationDocument",
    "ReviewDocument",
    "STORES_SCHEMA",
    "PRODUCTS_SCHEMA",
    "LOCATIONS_SCHEMA",
    "REVIEWS_SCHEMA",
    "RAGService",
]


def __getattr__(name):
    if name == "MilvusClient":
        from app.core.rag.milvus_client import MilvusClient

        return MilvusClient
    if name in {"EmbeddingService", "get_embedding_service"}:
        from app.core.rag.embedding import EmbeddingService, get_embedding_service

        return {"EmbeddingService": EmbeddingService, "get_embedding_service": get_embedding_service}[
            name
        ]
    if name in {
        "StoreDocument",
        "ProductDocument",
        "LocationDocument",
        "ReviewDocument",
        "STORES_SCHEMA",
        "PRODUCTS_SCHEMA",
        "LOCATIONS_SCHEMA",
        "REVIEWS_SCHEMA",
    }:
        from app.core.rag import schemas as _schemas

        return getattr(_schemas, name)
    if name == "RAGService":
        from app.core.rag.service import RAGService

        return RAGService
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
