"""
RAG Service 核心服务

提供：
- 店铺语义搜索
- 商品语义搜索
- 位置语义搜索
- LLM 上下文生成
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass
import logging

from app.core.rag.milvus_client import MilvusClient, get_milvus_client
from app.core.rag.embedding import EmbeddingService, get_embedding_service
from app.core.rag.retriever import SmartMallRetriever, build_filter_expr
from app.core.rag.schemas import STORES_SCHEMA, PRODUCTS_SCHEMA, LOCATIONS_SCHEMA
from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class StoreSearchResult:
    """店铺搜索结果"""
    id: str
    name: str
    category: str
    description: str
    floor: int
    area: str
    position_x: float
    position_y: float
    position_z: float
    score: float
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "floor": self.floor,
            "area": self.area,
            "position": {
                "x": self.position_x,
                "y": self.position_y,
                "z": self.position_z
            },
            "score": self.score
        }


@dataclass
class ProductSearchResult:
    """商品搜索结果"""
    id: str
    name: str
    brand: str
    category: str
    description: str
    price: float
    store_id: str
    store_name: str
    score: float
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "brand": self.brand,
            "category": self.category,
            "description": self.description,
            "price": self.price,
            "store_id": self.store_id,
            "store_name": self.store_name,
            "score": self.score
        }


class RAGService:
    """
    RAG 核心服务
    
    提供语义搜索和上下文生成能力
    """
    
    def __init__(
        self,
        milvus_client: Optional[MilvusClient] = None,
        embedding_service: Optional[EmbeddingService] = None
    ):
        """
        初始化 RAG 服务
        
        Args:
            milvus_client: Milvus 客户端
            embedding_service: Embedding 服务
        """
        self._milvus_client = milvus_client
        self._embedding_service = embedding_service
        self._initialized = False
    
    @property
    def milvus_client(self) -> MilvusClient:
        """获取 Milvus 客户端（懒加载）"""
        if self._milvus_client is None:
            self._milvus_client = get_milvus_client()
        return self._milvus_client
    
    @property
    def embedding_service(self) -> EmbeddingService:
        """获取 Embedding 服务（懒加载）"""
        if self._embedding_service is None:
            self._embedding_service = get_embedding_service()
        return self._embedding_service
    
    async def initialize(self) -> bool:
        """
        初始化服务
        
        创建必要的集合
        """
        if self._initialized:
            return True
        
        try:
            # 连接 Milvus（同步方法）
            self.milvus_client.connect()
            
            # 创建集合（如果不存在）
            self._ensure_collections()
            
            self._initialized = True
            logger.info("RAG Service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG Service: {e}")
            return False
    
    def _ensure_collections(self):
        """确保所有集合存在"""
        collections = [
            ("stores", STORES_SCHEMA),
            ("products", PRODUCTS_SCHEMA),
            ("locations", LOCATIONS_SCHEMA)
        ]
        
        for name, schema in collections:
            exists = self.milvus_client.has_collection(name)
            if not exists:
                self.milvus_client.create_collection(name, schema)
                logger.info(f"Created collection: {name}")
    
    async def search_stores(
        self,
        query: str,
        category: Optional[str] = None,
        floor: Optional[int] = None,
        top_k: int = None,
        score_threshold: float = None
    ) -> List[StoreSearchResult]:
        """
        搜索店铺
        
        Args:
            query: 搜索查询
            category: 店铺分类过滤
            floor: 楼层过滤
            top_k: 返回数量
            score_threshold: 相似度阈值
            
        Returns:
            店铺搜索结果列表
        """
        top_k = top_k or settings.RAG_TOP_K
        score_threshold = score_threshold or settings.RAG_SCORE_THRESHOLD
        
        # 构建过滤条件
        filter_expr = build_filter_expr(category=category, floor=floor)
        
        # 创建 Retriever
        retriever = SmartMallRetriever(
            milvus_client=self.milvus_client,
            embedding_service=self.embedding_service,
            collection_name="stores",
            top_k=top_k,
            score_threshold=score_threshold
        )
        
        if filter_expr:
            retriever.with_filter(filter_expr)
        
        # 执行检索
        documents = await retriever._aget_relevant_documents(query)
        
        # 转换为结果对象
        results = []
        for doc in documents:
            meta = doc.metadata
            result = StoreSearchResult(
                id=meta.get("id", ""),
                name=meta.get("name", ""),
                category=meta.get("category", ""),
                description=meta.get("description", ""),
                floor=meta.get("floor", 0),
                area=meta.get("area", ""),
                position_x=meta.get("position_x", 0.0),
                position_y=meta.get("position_y", 0.0),
                position_z=meta.get("position_z", 0.0),
                score=meta.get("score", 0.0)
            )
            results.append(result)
        
        return results
    
    async def search_products(
        self,
        query: str,
        category: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        top_k: int = None,
        score_threshold: float = None
    ) -> List[ProductSearchResult]:
        """
        搜索商品
        
        Args:
            query: 搜索查询
            category: 商品分类过滤
            brand: 品牌过滤
            min_price: 最低价格
            max_price: 最高价格
            top_k: 返回数量
            score_threshold: 相似度阈值
            
        Returns:
            商品搜索结果列表
        """
        top_k = top_k or settings.RAG_TOP_K
        score_threshold = score_threshold or settings.RAG_SCORE_THRESHOLD
        
        # 构建过滤条件
        filter_expr = build_filter_expr(
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price
        )
        
        # 创建 Retriever
        retriever = SmartMallRetriever(
            milvus_client=self.milvus_client,
            embedding_service=self.embedding_service,
            collection_name="products",
            top_k=top_k,
            score_threshold=score_threshold
        )
        
        if filter_expr:
            retriever.with_filter(filter_expr)
        
        # 执行检索
        documents = await retriever._aget_relevant_documents(query)
        
        # 转换为结果对象
        results = []
        for doc in documents:
            meta = doc.metadata
            result = ProductSearchResult(
                id=meta.get("id", ""),
                name=meta.get("name", ""),
                brand=meta.get("brand", ""),
                category=meta.get("category", ""),
                description=meta.get("description", ""),
                price=meta.get("price", 0.0),
                store_id=meta.get("store_id", ""),
                store_name=meta.get("store_name", ""),
                score=meta.get("score", 0.0)
            )
            results.append(result)
        
        return results
    
    async def get_context_for_query(
        self,
        query: str,
        include_stores: bool = True,
        include_products: bool = True,
        max_context_length: int = 2000
    ) -> str:
        """
        为 LLM 生成上下文
        
        Args:
            query: 用户查询
            include_stores: 是否包含店铺信息
            include_products: 是否包含商品信息
            max_context_length: 最大上下文长度
            
        Returns:
            格式化的上下文字符串
        """
        context_parts = []
        
        if include_stores:
            stores = await self.search_stores(query, top_k=3)
            if stores:
                store_context = "【相关店铺】\n"
                for i, store in enumerate(stores, 1):
                    store_context += f"{i}. {store.name}（{store.category}）- {store.floor}楼{store.area}\n"
                    if store.description:
                        store_context += f"   {store.description[:50]}...\n"
                context_parts.append(store_context)
        
        if include_products:
            products = await self.search_products(query, top_k=5)
            if products:
                product_context = "【相关商品】\n"
                for i, product in enumerate(products, 1):
                    product_context += f"{i}. {product.name}"
                    if product.brand:
                        product_context += f"（{product.brand}）"
                    product_context += f" - ¥{product.price}"
                    if product.store_name:
                        product_context += f" @ {product.store_name}"
                    product_context += "\n"
                context_parts.append(product_context)
        
        context = "\n".join(context_parts)
        
        # 截断过长的上下文
        if len(context) > max_context_length:
            context = context[:max_context_length] + "..."
        
        return context
    
    async def navigate_to_store(self, store_name: str) -> Optional[Dict[str, Any]]:
        """
        导航到店铺
        
        Args:
            store_name: 店铺名称
            
        Returns:
            店铺信息（包含位置）
        """
        results = await self.search_stores(store_name, top_k=1)
        
        if not results:
            return None
        
        store = results[0]
        return {
            "success": True,
            "store": store.to_dict(),
            "message": f"{store.name} 位于 {store.floor} 楼 {store.area}"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """
        健康检查
        
        Returns:
            健康状态信息
        """
        status = {
            "milvus": False,
            "embedding": False,
            "collections": {}
        }
        
        try:
            # 检查 Milvus 连接（同步方法）
            health = self.milvus_client.health_check()
            status["milvus"] = health.get("healthy", False)
            
            # 检查集合（同步方法）
            for collection in ["stores", "products", "locations"]:
                exists = self.milvus_client.has_collection(collection)
                status["collections"][collection] = exists
            
            # 检查 Embedding 服务
            try:
                test_embedding = await self.embedding_service.embed_text("test")
                status["embedding"] = len(test_embedding) > 0
            except Exception:
                status["embedding"] = False
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
        
        return status


# 全局服务实例（懒加载）
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """获取 RAG 服务单例"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service


async def init_rag_service() -> RAGService:
    """初始化并返回 RAG 服务"""
    service = get_rag_service()
    await service.initialize()
    return service
