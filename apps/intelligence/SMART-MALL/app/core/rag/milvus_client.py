"""
Milvus 向量数据库客户端

提供与 Milvus 的连接管理、集合操作、数据操作等功能
"""

from typing import Dict, Any, List, Optional
from pymilvus import (
    connections,
    Collection,
    CollectionSchema,
    FieldSchema,
    DataType,
    utility,
)
import logging
import time

from app.core.config import settings

logger = logging.getLogger(__name__)


class MilvusConnectionError(Exception):
    """Milvus 连接错误"""
    pass


class MilvusOperationError(Exception):
    """Milvus 操作错误"""
    pass


class SearchResult:
    """检索结果"""
    
    def __init__(
        self,
        id: str,
        score: float,
        data: Dict[str, Any]
    ):
        self.id = id
        self.score = score
        self.data = data
    
    def __repr__(self):
        return f"SearchResult(id={self.id}, score={self.score:.4f})"


class MilvusClient:
    """
    Milvus 向量数据库客户端
    
    提供：
    - 连接管理（connect/disconnect）
    - 集合操作（create/drop/list）
    - 数据操作（insert/delete/search）
    - 健康检查
    """
    
    def __init__(
        self,
        host: str = None,
        port: int = None,
        user: str = None,
        password: str = None,
        db_name: str = None,
        alias: str = "default"
    ):
        """
        初始化 Milvus 客户端
        
        Args:
            host: Milvus 主机地址
            port: Milvus 端口
            user: 用户名（可选）
            password: 密码（可选）
            db_name: 数据库名称
            alias: 连接别名
        """
        self.host = host or settings.MILVUS_HOST
        self.port = port or settings.MILVUS_PORT
        self.user = user or settings.MILVUS_USER
        self.password = password or settings.MILVUS_PASSWORD
        self.db_name = db_name or settings.MILVUS_DB_NAME
        self.alias = alias
        self._connected = False
        self._collections: Dict[str, Collection] = {}
    
    def connect(self) -> bool:
        """
        连接到 Milvus
        
        Returns:
            是否连接成功
        """
        try:
            logger.info(f"Connecting to Milvus at {self.host}:{self.port}...")
            
            connect_params = {
                "alias": self.alias,
                "host": self.host,
                "port": self.port,
            }
            
            # 如果有认证信息
            if self.user and self.password:
                connect_params["user"] = self.user
                connect_params["password"] = self.password
            
            connections.connect(**connect_params)
            self._connected = True
            
            logger.info(f"Connected to Milvus successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Milvus: {e}")
            self._connected = False
            raise MilvusConnectionError(f"Failed to connect to Milvus: {e}")
    
    def disconnect(self) -> None:
        """断开 Milvus 连接"""
        try:
            if self._connected:
                connections.disconnect(self.alias)
                self._connected = False
                self._collections.clear()
                logger.info("Disconnected from Milvus")
        except Exception as e:
            logger.warning(f"Error disconnecting from Milvus: {e}")
    
    def is_connected(self) -> bool:
        """检查是否已连接"""
        return self._connected
    
    def health_check(self) -> Dict[str, Any]:
        """
        健康检查
        
        Returns:
            健康状态信息
        """
        try:
            if not self._connected:
                return {
                    "status": "disconnected",
                    "healthy": False,
                    "message": "Not connected to Milvus"
                }
            
            # 尝试列出集合来验证连接
            start_time = time.time()
            collections = utility.list_collections(using=self.alias)
            latency = (time.time() - start_time) * 1000
            
            return {
                "status": "connected",
                "healthy": True,
                "host": f"{self.host}:{self.port}",
                "collections_count": len(collections),
                "latency_ms": round(latency, 2)
            }
            
        except Exception as e:
            return {
                "status": "error",
                "healthy": False,
                "message": str(e)
            }
    
    # ============ 集合操作 ============
    
    def create_collection(
        self,
        name: str,
        schema: CollectionSchema,
        index_params: Optional[Dict] = None
    ) -> Collection:
        """
        创建集合
        
        Args:
            name: 集合名称
            schema: 集合 Schema
            index_params: 索引参数
            
        Returns:
            Collection 对象
        """
        try:
            if utility.has_collection(name, using=self.alias):
                logger.info(f"Collection '{name}' already exists, loading...")
                collection = Collection(name=name, using=self.alias)
            else:
                logger.info(f"Creating collection '{name}'...")
                collection = Collection(
                    name=name,
                    schema=schema,
                    using=self.alias
                )
                
                # 创建向量索引
                if index_params is None:
                    index_params = {
                        "metric_type": "COSINE",
                        "index_type": "IVF_FLAT",
                        "params": {"nlist": 128}
                    }
                
                # 找到向量字段并创建索引
                for field in schema.fields:
                    if field.dtype == DataType.FLOAT_VECTOR:
                        collection.create_index(
                            field_name=field.name,
                            index_params=index_params
                        )
                        logger.info(f"Created index on field '{field.name}'")
                        break
            
            # 加载集合到内存
            collection.load()
            self._collections[name] = collection
            
            logger.info(f"Collection '{name}' ready")
            return collection
            
        except Exception as e:
            logger.error(f"Failed to create collection '{name}': {e}")
            raise MilvusOperationError(f"Failed to create collection: {e}")
    
    def drop_collection(self, name: str) -> bool:
        """
        删除集合
        
        Args:
            name: 集合名称
            
        Returns:
            是否删除成功
        """
        try:
            if utility.has_collection(name, using=self.alias):
                utility.drop_collection(name, using=self.alias)
                self._collections.pop(name, None)
                logger.info(f"Dropped collection '{name}'")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to drop collection '{name}': {e}")
            raise MilvusOperationError(f"Failed to drop collection: {e}")
    
    def list_collections(self) -> List[str]:
        """列出所有集合"""
        return utility.list_collections(using=self.alias)
    
    def has_collection(self, name: str) -> bool:
        """检查集合是否存在"""
        return utility.has_collection(name, using=self.alias)
    
    def get_collection(self, name: str) -> Optional[Collection]:
        """获取集合对象"""
        if name in self._collections:
            return self._collections[name]
        
        if utility.has_collection(name, using=self.alias):
            collection = Collection(name=name, using=self.alias)
            collection.load()
            self._collections[name] = collection
            return collection
        
        return None
    
    # ============ 数据操作 ============
    
    def insert(
        self,
        collection_name: str,
        data: List[Dict[str, Any]]
    ) -> List[str]:
        """
        插入数据
        
        Args:
            collection_name: 集合名称
            data: 数据列表，每个元素是一个字典
            
        Returns:
            插入的 ID 列表
        """
        try:
            collection = self.get_collection(collection_name)
            if collection is None:
                raise MilvusOperationError(f"Collection '{collection_name}' not found")
            
            # 转换数据格式
            if not data:
                return []
            
            # 获取字段名
            fields = list(data[0].keys())
            insert_data = []
            
            for field in fields:
                field_data = [item[field] for item in data]
                insert_data.append(field_data)
            
            result = collection.insert(insert_data)
            
            # 刷新数据
            collection.flush()
            
            logger.info(f"Inserted {len(data)} records into '{collection_name}'")
            return [str(pk) for pk in result.primary_keys]
            
        except Exception as e:
            logger.error(f"Failed to insert data: {e}")
            raise MilvusOperationError(f"Failed to insert data: {e}")
    
    def delete(
        self,
        collection_name: str,
        ids: List[str]
    ) -> int:
        """
        删除数据
        
        Args:
            collection_name: 集合名称
            ids: 要删除的 ID 列表
            
        Returns:
            删除的数量
        """
        try:
            collection = self.get_collection(collection_name)
            if collection is None:
                raise MilvusOperationError(f"Collection '{collection_name}' not found")
            
            expr = f"id in {ids}"
            result = collection.delete(expr)
            
            logger.info(f"Deleted {result.delete_count} records from '{collection_name}'")
            return result.delete_count
            
        except Exception as e:
            logger.error(f"Failed to delete data: {e}")
            raise MilvusOperationError(f"Failed to delete data: {e}")
    
    def search(
        self,
        collection_name: str,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[str] = None,
        output_fields: Optional[List[str]] = None
    ) -> List[SearchResult]:
        """
        向量检索
        
        Args:
            collection_name: 集合名称
            query_vector: 查询向量
            top_k: 返回数量
            filters: 过滤表达式（Milvus 表达式语法）
            output_fields: 输出字段列表
            
        Returns:
            检索结果列表
        """
        try:
            collection = self.get_collection(collection_name)
            if collection is None:
                raise MilvusOperationError(f"Collection '{collection_name}' not found")
            
            # 默认输出所有标量字段
            if output_fields is None:
                output_fields = [
                    field.name for field in collection.schema.fields
                    if field.dtype != DataType.FLOAT_VECTOR
                ]
            
            search_params = {
                "metric_type": "COSINE",
                "params": {"nprobe": 10}
            }
            
            results = collection.search(
                data=[query_vector],
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                expr=filters,
                output_fields=output_fields
            )
            
            search_results = []
            for hits in results:
                for hit in hits:
                    data = {field: getattr(hit.entity, field) for field in output_fields}
                    search_results.append(SearchResult(
                        id=str(hit.id),
                        score=hit.score,
                        data=data
                    ))
            
            return search_results
            
        except Exception as e:
            logger.error(f"Failed to search: {e}")
            raise MilvusOperationError(f"Failed to search: {e}")
    
    def count(self, collection_name: str) -> int:
        """获取集合中的记录数量"""
        collection = self.get_collection(collection_name)
        if collection is None:
            return 0
        return collection.num_entities
    
    # ============ 上下文管理 ============
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()


# 全局客户端实例（懒加载）
_milvus_client: Optional[MilvusClient] = None


def get_milvus_client() -> MilvusClient:
    """获取 Milvus 客户端单例"""
    global _milvus_client
    if _milvus_client is None:
        _milvus_client = MilvusClient()
    return _milvus_client
