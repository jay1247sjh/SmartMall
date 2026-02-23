"""
LangChain Retriever 实现

包含：
- RAGRetrieverFactory: 基于 langchain-milvus 的 Retriever 工厂
- build_filter_expr: Milvus 过滤表达式构建器
"""

from typing import List, Optional, Dict, Any
import logging

from langchain_core.retrievers import BaseRetriever

from app.core.config import settings
from app.core.embedding_provider import get_embeddings

try:
    from langchain_milvus import Milvus
except ImportError:
    Milvus = None
    logging.getLogger(__name__).warning(
        "langchain-milvus not installed. RAGRetrieverFactory will not be available. "
        "Install with: pip install langchain-milvus"
    )

logger = logging.getLogger(__name__)


# ============================================================
# 新版：RAGRetrieverFactory（基于 langchain-milvus）
# ============================================================


class RAGRetrieverFactory:
    """RAG Retriever 工厂

    使用 langchain-milvus 的 Milvus 向量存储创建 Retriever，
    替代自定义 SmartMallRetriever。

    支持：
    - 按 collection_name 创建 Retriever
    - similarity 搜索
    - metadata 过滤（分类、楼层、价格区间、品牌）
    - 统一使用 get_embeddings() 获取 Embedding 实例
    """

    @classmethod
    def create_retriever(
        cls,
        collection_name: str,
        search_kwargs: Optional[Dict[str, Any]] = None,
    ) -> BaseRetriever:
        """
        创建基于 langchain-milvus 的 VectorStoreRetriever。

        Args:
            collection_name: Milvus 集合名称（如 stores, products, locations, reviews, rules）
            search_kwargs: 检索参数，支持 k（返回数量）和 expr（Milvus 过滤表达式）

        Returns:
            VectorStoreRetriever 实例

        Raises:
            RuntimeError: langchain-milvus 未安装时抛出
        """
        if Milvus is None:
            raise RuntimeError(
                "langchain-milvus is required but not installed. "
                "Install with: pip install langchain-milvus"
            )

        embeddings = get_embeddings()

        vector_store = Milvus(
            embedding_function=embeddings,
            collection_name=collection_name,
            connection_args={
                "host": settings.MILVUS_HOST,
                "port": settings.MILVUS_PORT,
            },
        )

        default_kwargs: Dict[str, Any] = {"k": settings.RAG_TOP_K}
        if search_kwargs:
            default_kwargs.update(search_kwargs)

        return vector_store.as_retriever(
            search_type="similarity",
            search_kwargs=default_kwargs,
        )

    @classmethod
    def create_filtered_retriever(
        cls,
        collection_name: str,
        category: Optional[str] = None,
        floor: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        brand: Optional[str] = None,
        top_k: Optional[int] = None,
    ) -> BaseRetriever:
        """
        创建带 metadata 过滤的 Retriever（便捷方法）。

        Args:
            collection_name: Milvus 集合名称
            category: 分类过滤
            floor: 楼层过滤
            min_price: 最低价格过滤
            max_price: 最高价格过滤
            brand: 品牌过滤
            top_k: 返回结果数量

        Returns:
            带过滤条件的 VectorStoreRetriever 实例
        """
        expr = build_filter_expr(
            category=category,
            floor=floor,
            min_price=min_price,
            max_price=max_price,
            brand=brand,
        )

        search_kwargs: Dict[str, Any] = {}
        if top_k is not None:
            search_kwargs["k"] = top_k
        if expr is not None:
            search_kwargs["expr"] = expr

        return cls.create_retriever(
            collection_name=collection_name,
            search_kwargs=search_kwargs if search_kwargs else None,
        )


def build_filter_expr(
    category: Optional[str] = None,
    floor: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    **kwargs
) -> Optional[str]:
    """
    构建 Milvus 过滤表达式
    
    Args:
        category: 分类
        floor: 楼层
        min_price: 最低价格
        max_price: 最高价格
        brand: 品牌
        
    Returns:
        过滤表达式字符串
    """
    conditions = []
    
    if category:
        conditions.append(f'category == "{category}"')
    
    if floor is not None:
        conditions.append(f"floor == {floor}")
    
    if min_price is not None:
        conditions.append(f"price >= {min_price}")
    
    if max_price is not None:
        conditions.append(f"price <= {max_price}")
    
    if brand:
        conditions.append(f'brand == "{brand}"')
    
    if not conditions:
        return None
    
    return " and ".join(conditions)
