"""
数据同步服务

提供：
- 全量同步
- 增量同步
- 同步日志
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime
import logging
import asyncio

from app.core.rag.milvus_client import MilvusClient, get_milvus_client
from app.core.rag.embedding import EmbeddingService, get_embedding_service
from app.core.rag.schemas import (
    StoreDocument,
    ProductDocument,
    LocationDocument,
    STORES_SCHEMA,
    PRODUCTS_SCHEMA,
    LOCATIONS_SCHEMA
)
from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class SyncResult:
    """同步结果"""
    collection: str
    total: int
    inserted: int
    updated: int
    failed: int
    duration_ms: float
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "collection": self.collection,
            "total": self.total,
            "inserted": self.inserted,
            "updated": self.updated,
            "failed": self.failed,
            "duration_ms": self.duration_ms,
            "timestamp": self.timestamp.isoformat()
        }


class DataSyncService:
    """
    数据同步服务
    
    负责将业务数据同步到 Milvus 向量数据库
    """
    
    def __init__(
        self,
        milvus_client: Optional[MilvusClient] = None,
        embedding_service: Optional[EmbeddingService] = None
    ):
        self._milvus_client = milvus_client
        self._embedding_service = embedding_service
        self._sync_history: List[SyncResult] = []
    
    @property
    def milvus_client(self) -> MilvusClient:
        if self._milvus_client is None:
            self._milvus_client = get_milvus_client()
        return self._milvus_client
    
    @property
    def embedding_service(self) -> EmbeddingService:
        if self._embedding_service is None:
            self._embedding_service = get_embedding_service()
        return self._embedding_service
    
    async def full_sync_stores(self, stores: List[StoreDocument]) -> SyncResult:
        """
        全量同步店铺数据
        
        Args:
            stores: 店铺文档列表
            
        Returns:
            同步结果
        """
        start_time = datetime.now()
        inserted = 0
        failed = 0
        
        try:
            # 确保集合存在
            exists = await self.milvus_client.has_collection("stores")
            if not exists:
                await self.milvus_client.create_collection("stores", STORES_SCHEMA)
            
            # 生成 Embedding
            texts = [self._build_store_text(s) for s in stores]
            embeddings = await self.embedding_service.embed_batch(texts)
            
            # 准备数据
            data = []
            for store, embedding in zip(stores, embeddings):
                data.append({
                    "id": store.id,
                    "name": store.name,
                    "category": store.category,
                    "description": store.description,
                    "floor": store.floor,
                    "area": store.area,
                    "position_x": store.position_x,
                    "position_y": store.position_y,
                    "position_z": store.position_z,
                    "tags": store.tags,
                    "embedding": embedding
                })
            
            # 插入数据
            await self.milvus_client.insert("stores", data)
            inserted = len(data)
            
            logger.info(f"Synced {inserted} stores to Milvus")
            
        except Exception as e:
            logger.error(f"Failed to sync stores: {e}")
            failed = len(stores)
        
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        result = SyncResult(
            collection="stores",
            total=len(stores),
            inserted=inserted,
            updated=0,
            failed=failed,
            duration_ms=duration,
            timestamp=datetime.now()
        )
        
        self._sync_history.append(result)
        return result
    
    async def full_sync_products(self, products: List[ProductDocument]) -> SyncResult:
        """
        全量同步商品数据
        
        Args:
            products: 商品文档列表
            
        Returns:
            同步结果
        """
        start_time = datetime.now()
        inserted = 0
        failed = 0
        
        try:
            # 确保集合存在
            exists = await self.milvus_client.has_collection("products")
            if not exists:
                await self.milvus_client.create_collection("products", PRODUCTS_SCHEMA)
            
            # 生成 Embedding
            texts = [self._build_product_text(p) for p in products]
            embeddings = await self.embedding_service.embed_batch(texts)
            
            # 准备数据
            data = []
            for product, embedding in zip(products, embeddings):
                data.append({
                    "id": product.id,
                    "name": product.name,
                    "brand": product.brand,
                    "category": product.category,
                    "description": product.description,
                    "price": product.price,
                    "store_id": product.store_id,
                    "store_name": product.store_name,
                    "tags": product.tags,
                    "embedding": embedding
                })
            
            # 插入数据
            await self.milvus_client.insert("products", data)
            inserted = len(data)
            
            logger.info(f"Synced {inserted} products to Milvus")
            
        except Exception as e:
            logger.error(f"Failed to sync products: {e}")
            failed = len(products)
        
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        result = SyncResult(
            collection="products",
            total=len(products),
            inserted=inserted,
            updated=0,
            failed=failed,
            duration_ms=duration,
            timestamp=datetime.now()
        )
        
        self._sync_history.append(result)
        return result

    async def full_sync_locations(self, locations: List[LocationDocument]) -> SyncResult:
        """
        全量同步位置数据
        
        Args:
            locations: 位置文档列表
            
        Returns:
            同步结果
        """
        start_time = datetime.now()
        inserted = 0
        failed = 0
        
        try:
            # 确保集合存在
            exists = await self.milvus_client.has_collection("locations")
            if not exists:
                await self.milvus_client.create_collection("locations", LOCATIONS_SCHEMA)
            
            # 生成 Embedding
            texts = [self._build_location_text(loc) for loc in locations]
            embeddings = await self.embedding_service.embed_batch(texts)
            
            # 准备数据
            data = []
            for location, embedding in zip(locations, embeddings):
                data.append({
                    "id": location.id,
                    "name": location.name,
                    "type": location.type,
                    "description": location.description,
                    "floor": location.floor,
                    "position_x": location.position_x,
                    "position_y": location.position_y,
                    "position_z": location.position_z,
                    "embedding": embedding
                })
            
            # 插入数据
            await self.milvus_client.insert("locations", data)
            inserted = len(data)
            
            logger.info(f"Synced {inserted} locations to Milvus")
            
        except Exception as e:
            logger.error(f"Failed to sync locations: {e}")
            failed = len(locations)
        
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        result = SyncResult(
            collection="locations",
            total=len(locations),
            inserted=inserted,
            updated=0,
            failed=failed,
            duration_ms=duration,
            timestamp=datetime.now()
        )
        
        self._sync_history.append(result)
        return result
    
    async def full_sync_all(
        self,
        stores: List[StoreDocument],
        products: List[ProductDocument],
        locations: List[LocationDocument]
    ) -> List[SyncResult]:
        """
        全量同步所有数据
        
        Args:
            stores: 店铺列表
            products: 商品列表
            locations: 位置列表
            
        Returns:
            同步结果列表
        """
        results = []
        
        if stores:
            result = await self.full_sync_stores(stores)
            results.append(result)
        
        if products:
            result = await self.full_sync_products(products)
            results.append(result)
        
        if locations:
            result = await self.full_sync_locations(locations)
            results.append(result)
        
        return results
    
    async def incremental_sync_stores(
        self,
        stores: List[StoreDocument],
        operation: str = "upsert"
    ) -> SyncResult:
        """
        增量同步店铺数据
        
        Args:
            stores: 店铺文档列表
            operation: 操作类型 (upsert/delete)
            
        Returns:
            同步结果
        """
        start_time = datetime.now()
        updated = 0
        failed = 0
        
        try:
            if operation == "delete":
                # 删除操作
                ids = [s.id for s in stores]
                await self.milvus_client.delete("stores", ids)
                updated = len(ids)
            else:
                # Upsert 操作：先删除再插入
                ids = [s.id for s in stores]
                await self.milvus_client.delete("stores", ids)
                
                # 生成 Embedding 并插入
                texts = [self._build_store_text(s) for s in stores]
                embeddings = await self.embedding_service.embed_batch(texts)
                
                data = []
                for store, embedding in zip(stores, embeddings):
                    data.append({
                        "id": store.id,
                        "name": store.name,
                        "category": store.category,
                        "description": store.description,
                        "floor": store.floor,
                        "area": store.area,
                        "position_x": store.position_x,
                        "position_y": store.position_y,
                        "position_z": store.position_z,
                        "tags": store.tags,
                        "embedding": embedding
                    })
                
                await self.milvus_client.insert("stores", data)
                updated = len(data)
            
            logger.info(f"Incremental sync: {operation} {updated} stores")
            
        except Exception as e:
            logger.error(f"Failed to incremental sync stores: {e}")
            failed = len(stores)
        
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        result = SyncResult(
            collection="stores",
            total=len(stores),
            inserted=0,
            updated=updated,
            failed=failed,
            duration_ms=duration,
            timestamp=datetime.now()
        )
        
        self._sync_history.append(result)
        return result
    
    def _build_store_text(self, store: StoreDocument) -> str:
        """构建店铺文本用于 Embedding"""
        parts = [store.name]
        if store.category:
            parts.append(store.category)
        if store.description:
            parts.append(store.description)
        if store.tags:
            parts.append(" ".join(store.tags))
        return " ".join(parts)
    
    def _build_product_text(self, product: ProductDocument) -> str:
        """构建商品文本用于 Embedding"""
        parts = [product.name]
        if product.brand:
            parts.append(product.brand)
        if product.category:
            parts.append(product.category)
        if product.description:
            parts.append(product.description)
        if product.tags:
            parts.append(" ".join(product.tags))
        return " ".join(parts)
    
    def _build_location_text(self, location: LocationDocument) -> str:
        """构建位置文本用于 Embedding"""
        parts = [location.name]
        if location.type:
            parts.append(location.type)
        if location.description:
            parts.append(location.description)
        return " ".join(parts)
    
    def get_sync_history(self, limit: int = 10) -> List[SyncResult]:
        """获取同步历史"""
        return self._sync_history[-limit:]
    
    def clear_sync_history(self):
        """清空同步历史"""
        self._sync_history.clear()


# 全局服务实例
_sync_service: Optional[DataSyncService] = None


def get_sync_service() -> DataSyncService:
    """获取数据同步服务单例"""
    global _sync_service
    if _sync_service is None:
        _sync_service = DataSyncService()
    return _sync_service
