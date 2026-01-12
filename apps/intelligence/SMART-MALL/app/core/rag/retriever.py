"""
LangChain Retriever 实现

基于 Milvus 的自定义 Retriever，支持：
- 语义检索
- 过滤条件
- 相似度阈值
"""

from typing import List, Optional, Dict, Any, Callable
from dataclasses import dataclass
import logging

from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from pydantic import Field

from app.core.rag.milvus_client import MilvusClient
from app.core.rag.embedding import EmbeddingService, get_embedding_service
from app.core.rag.schemas import STORES_SCHEMA, PRODUCTS_SCHEMA, LOCATIONS_SCHEMA
from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """检索结果"""
    id: str
    content: str
    metadata: Dict[str, Any]
    score: float


class SmartMallRetriever(BaseRetriever):
    """
    Smart Mall 自定义 Retriever
    
    支持多集合检索：stores, products, locations
    """
    
    # Pydantic 字段定义
    milvus_client: Optional[MilvusClient] = Field(default=None)
    embedding_service: Optional[EmbeddingService] = Field(default=None)
    collection_name: str = Field(default="stores")
    top_k: int = Field(default=5)
    score_threshold: float = Field(default=0.5)
    filter_expr: Optional[str] = Field(default=None)
    
    class Config:
        arbitrary_types_allowed = True
    
    def __init__(
        self,
        milvus_client: Optional[MilvusClient] = None,
        embedding_service: Optional[EmbeddingService] = None,
        collection_name: str = "stores",
        top_k: int = None,
        score_threshold: float = None,
        **kwargs
    ):
        """
        初始化 Retriever
        
        Args:
            milvus_client: Milvus 客户端
            embedding_service: Embedding 服务
            collection_name: 集合名称
            top_k: 返回结果数量
            score_threshold: 相似度阈值
        """
        super().__init__(**kwargs)
        self.milvus_client = milvus_client
        self.embedding_service = embedding_service or get_embedding_service()
        self.collection_name = collection_name
        self.top_k = top_k or settings.RAG_TOP_K
        self.score_threshold = score_threshold or settings.RAG_SCORE_THRESHOLD
        self.filter_expr = None

    def with_filter(self, filter_expr: str) -> "SmartMallRetriever":
        """
        设置过滤条件
        
        Args:
            filter_expr: Milvus 过滤表达式，如 "floor == 2" 或 "category == '餐饮'"
            
        Returns:
            self，支持链式调用
        """
        self.filter_expr = filter_expr
        return self
    
    def with_collection(self, collection_name: str) -> "SmartMallRetriever":
        """
        切换集合
        
        Args:
            collection_name: 集合名称
            
        Returns:
            self，支持链式调用
        """
        self.collection_name = collection_name
        return self
    
    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun = None
    ) -> List[Document]:
        """
        同步检索（LangChain 要求实现）
        
        内部调用异步方法
        """
        import asyncio
        
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(
            self._aget_relevant_documents(query, run_manager=run_manager)
        )
    
    async def _aget_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun = None
    ) -> List[Document]:
        """
        异步检索相关文档
        
        Args:
            query: 查询文本
            run_manager: 回调管理器
            
        Returns:
            相关文档列表
        """
        if not self.milvus_client:
            logger.error("Milvus client not initialized")
            return []
        
        try:
            # 生成查询向量
            query_embedding = await self.embedding_service.embed_text(query)
            
            # 执行向量检索
            results = await self._search_milvus(query_embedding)
            
            # 转换为 LangChain Document
            documents = []
            for result in results:
                if result.score >= self.score_threshold:
                    doc = Document(
                        page_content=result.content,
                        metadata={
                            **result.metadata,
                            "id": result.id,
                            "score": result.score,
                            "collection": self.collection_name
                        }
                    )
                    documents.append(doc)
            
            logger.info(f"Retrieved {len(documents)} documents for query: {query[:50]}...")
            return documents
            
        except Exception as e:
            logger.error(f"Retrieval error: {e}")
            return []
    
    async def _search_milvus(self, query_embedding: List[float]) -> List[SearchResult]:
        """
        执行 Milvus 检索
        
        Args:
            query_embedding: 查询向量
            
        Returns:
            检索结果列表
        """
        # 获取集合的输出字段
        output_fields = self._get_output_fields()
        
        # 执行检索
        raw_results = await self.milvus_client.search(
            collection_name=self.collection_name,
            query_vectors=[query_embedding],
            top_k=self.top_k,
            filter_expr=self.filter_expr,
            output_fields=output_fields
        )
        
        # 解析结果
        results = []
        for hits in raw_results:
            for hit in hits:
                result = self._parse_hit(hit)
                results.append(result)
        
        # 按分数降序排序
        results.sort(key=lambda x: x.score, reverse=True)
        
        return results[:self.top_k]
    
    def _get_output_fields(self) -> List[str]:
        """获取集合的输出字段"""
        schema_map = {
            "stores": STORES_SCHEMA,
            "products": PRODUCTS_SCHEMA,
            "locations": LOCATIONS_SCHEMA
        }
        
        schema = schema_map.get(self.collection_name)
        if not schema:
            return ["id"]
        
        # 排除向量字段
        return [f["name"] for f in schema["fields"] if f["type"] != "FLOAT_VECTOR"]
    
    def _parse_hit(self, hit: Dict[str, Any]) -> SearchResult:
        """
        解析检索结果
        
        Args:
            hit: Milvus 返回的单条结果
            
        Returns:
            SearchResult 对象
        """
        entity = hit.get("entity", {})
        
        # 根据集合类型构建内容
        if self.collection_name == "stores":
            content = self._build_store_content(entity)
        elif self.collection_name == "products":
            content = self._build_product_content(entity)
        elif self.collection_name == "locations":
            content = self._build_location_content(entity)
        else:
            content = str(entity)
        
        return SearchResult(
            id=entity.get("id", hit.get("id", "")),
            content=content,
            metadata=entity,
            score=hit.get("distance", 0.0)
        )
    
    def _build_store_content(self, entity: Dict[str, Any]) -> str:
        """构建店铺内容文本"""
        parts = []
        
        if entity.get("name"):
            parts.append(f"店铺名称：{entity['name']}")
        if entity.get("category"):
            parts.append(f"分类：{entity['category']}")
        if entity.get("description"):
            parts.append(f"描述：{entity['description']}")
        if entity.get("floor"):
            parts.append(f"楼层：{entity['floor']}楼")
        if entity.get("area"):
            parts.append(f"区域：{entity['area']}")
        
        return "\n".join(parts)
    
    def _build_product_content(self, entity: Dict[str, Any]) -> str:
        """构建商品内容文本"""
        parts = []
        
        if entity.get("name"):
            parts.append(f"商品名称：{entity['name']}")
        if entity.get("brand"):
            parts.append(f"品牌：{entity['brand']}")
        if entity.get("category"):
            parts.append(f"分类：{entity['category']}")
        if entity.get("description"):
            parts.append(f"描述：{entity['description']}")
        if entity.get("price"):
            parts.append(f"价格：¥{entity['price']}")
        if entity.get("store_name"):
            parts.append(f"所属店铺：{entity['store_name']}")
        
        return "\n".join(parts)
    
    def _build_location_content(self, entity: Dict[str, Any]) -> str:
        """构建位置内容文本"""
        parts = []
        
        if entity.get("name"):
            parts.append(f"位置名称：{entity['name']}")
        if entity.get("type"):
            parts.append(f"类型：{entity['type']}")
        if entity.get("description"):
            parts.append(f"描述：{entity['description']}")
        if entity.get("floor"):
            parts.append(f"楼层：{entity['floor']}楼")
        
        return "\n".join(parts)


class MultiCollectionRetriever:
    """
    多集合检索器
    
    支持同时从多个集合检索并合并结果
    """
    
    def __init__(
        self,
        milvus_client: MilvusClient,
        embedding_service: Optional[EmbeddingService] = None,
        top_k: int = None,
        score_threshold: float = None
    ):
        self.milvus_client = milvus_client
        self.embedding_service = embedding_service or get_embedding_service()
        self.top_k = top_k or settings.RAG_TOP_K
        self.score_threshold = score_threshold or settings.RAG_SCORE_THRESHOLD
    
    async def search(
        self,
        query: str,
        collections: List[str] = None,
        filters: Dict[str, str] = None
    ) -> List[Document]:
        """
        多集合检索
        
        Args:
            query: 查询文本
            collections: 要检索的集合列表，默认全部
            filters: 每个集合的过滤条件
            
        Returns:
            合并后的文档列表
        """
        collections = collections or ["stores", "products", "locations"]
        filters = filters or {}
        
        all_documents = []
        
        for collection in collections:
            retriever = SmartMallRetriever(
                milvus_client=self.milvus_client,
                embedding_service=self.embedding_service,
                collection_name=collection,
                top_k=self.top_k,
                score_threshold=self.score_threshold
            )
            
            if collection in filters:
                retriever.with_filter(filters[collection])
            
            docs = await retriever._aget_relevant_documents(query)
            all_documents.extend(docs)
        
        # 按分数排序并截取 top_k
        all_documents.sort(
            key=lambda d: d.metadata.get("score", 0),
            reverse=True
        )
        
        return all_documents[:self.top_k]


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
