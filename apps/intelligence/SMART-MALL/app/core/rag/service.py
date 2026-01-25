"""
RAG Service 核心服务模块

本模块是智能商城 RAG（Retrieval-Augmented Generation）系统的核心服务层。

主要功能：
- 店铺语义搜索：基于自然语言查询搜索相关店铺
- 商品语义搜索：基于自然语言查询搜索相关商品
- 位置语义搜索：基于位置信息进行空间检索
- LLM 上下文生成：为大语言模型生成增强的上下文信息

技术栈：
- Milvus：向量数据库，用于存储和检索向量化的店铺/商品信息
- Embedding Service：文本向量化服务，将自然语言转换为向量表示
- LangChain Retriever：检索器，封装了检索逻辑

设计模式：
- 单例模式：全局共享一个 RAGService 实例
- 懒加载：Milvus 和 Embedding 服务按需初始化
- 依赖注入：支持外部注入客户端，便于测试

使用示例：
    ```python
    # 获取服务实例
    service = get_rag_service()
    await service.initialize()
    
    # 搜索店铺
    stores = await service.search_stores("咖啡店", floor=2)
    
    # 搜索商品
    products = await service.search_products("运动鞋", brand="Nike")
    
    # 生成 LLM 上下文
    context = await service.get_context_for_query("我想买一双跑鞋")
    ```
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass
import logging

# Milvus 向量数据库客户端
from app.core.rag.milvus_client import MilvusClient, get_milvus_client
# 文本向量化服务
from app.core.rag.embedding import EmbeddingService, get_embedding_service
# 检索器和过滤表达式构建器
from app.core.rag.retriever import SmartMallRetriever, build_filter_expr
# 数据库集合的 Schema 定义
from app.core.rag.schemas import STORES_SCHEMA, PRODUCTS_SCHEMA, LOCATIONS_SCHEMA
# 应用配置
from app.core.config import settings

# 日志记录器
logger = logging.getLogger(__name__)


@dataclass
class StoreSearchResult:
    """
    店铺搜索结果数据类
    
    封装从向量数据库检索到的店铺信息，包含店铺的基本属性和空间位置。
    
    属性说明：
        id: 店铺唯一标识符
        name: 店铺名称（如："星巴克咖啡"）
        category: 店铺分类（如："餐饮"、"服装"、"电子产品"）
        description: 店铺描述信息
        floor: 所在楼层（负数表示地下层，如 -1 表示 B1）
        area: 所在区域（如："A区"、"中庭"）
        position_x: X 轴坐标（3D 空间位置）
        position_y: Y 轴坐标（楼层高度）
        position_z: Z 轴坐标（3D 空间位置）
        score: 相似度得分（0-1 之间，越高表示越相关）
    
    使用示例：
        ```python
        result = StoreSearchResult(
            id="store_001",
            name="星巴克",
            category="餐饮",
            description="全球知名咖啡连锁品牌",
            floor=2,
            area="A区",
            position_x=10.5,
            position_y=8.0,
            position_z=20.3,
            score=0.95
        )
        
        # 转换为字典
        data = result.to_dict()
        ```
    """
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
        """
        将搜索结果转换为字典格式
        
        将 3D 坐标组织为嵌套的 position 对象，便于 JSON 序列化和前端使用。
        
        Returns:
            Dict[str, Any]: 包含所有店铺信息的字典，position 为嵌套对象
            
        示例返回值：
            {
                "id": "store_001",
                "name": "星巴克",
                "category": "餐饮",
                "description": "全球知名咖啡连锁品牌",
                "floor": 2,
                "area": "A区",
                "position": {
                    "x": 10.5,
                    "y": 8.0,
                    "z": 20.3
                },
                "score": 0.95
            }
        """
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
    """
    商品搜索结果数据类
    
    封装从向量数据库检索到的商品信息，包含商品属性和所属店铺信息。
    
    属性说明：
        id: 商品唯一标识符
        name: 商品名称（如："Nike Air Max 270"）
        brand: 品牌名称（如："Nike"、"Adidas"）
        category: 商品分类（如："运动鞋"、"电子产品"）
        description: 商品描述信息
        price: 商品价格（单位：元）
        store_id: 所属店铺 ID
        store_name: 所属店铺名称
        score: 相似度得分（0-1 之间，越高表示越相关）
    
    使用示例：
        ```python
        result = ProductSearchResult(
            id="prod_001",
            name="Nike Air Max 270",
            brand="Nike",
            category="运动鞋",
            description="经典气垫跑鞋",
            price=1299.0,
            store_id="store_001",
            store_name="Nike 旗舰店",
            score=0.92
        )
        
        # 转换为字典
        data = result.to_dict()
        ```
    """
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
        """
        将搜索结果转换为字典格式
        
        Returns:
            Dict[str, Any]: 包含所有商品信息的字典
            
        示例返回值：
            {
                "id": "prod_001",
                "name": "Nike Air Max 270",
                "brand": "Nike",
                "category": "运动鞋",
                "description": "经典气垫跑鞋",
                "price": 1299.0,
                "store_id": "store_001",
                "store_name": "Nike 旗舰店",
                "score": 0.92
            }
        """
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
    RAG（Retrieval-Augmented Generation）核心服务类
    
    这是智能商城 RAG 系统的核心服务，负责协调向量检索和上下文生成。
    
    核心职责：
    1. 语义搜索：将自然语言查询转换为向量，在 Milvus 中检索相似内容
    2. 过滤检索：支持基于分类、楼层、价格等条件的过滤
    3. 上下文生成：为 LLM 生成增强的上下文信息
    4. 导航服务：提供店铺位置查询和导航功能
    
    设计特点：
    - 懒加载：Milvus 和 Embedding 服务按需初始化，减少启动时间
    - 依赖注入：支持外部注入客户端，便于单元测试
    - 异步优先：所有检索操作都是异步的，提高并发性能
    - 单例模式：通过 get_rag_service() 获取全局唯一实例
    
    工作流程：
    1. 用户查询 -> 2. 文本向量化 -> 3. 向量检索 -> 4. 结果过滤 -> 5. 返回结果
    
    使用示例：
        ```python
        # 初始化服务
        service = get_rag_service()
        await service.initialize()
        
        # 搜索店铺（支持过滤）
        stores = await service.search_stores(
            query="咖啡店",
            category="餐饮",
            floor=2,
            top_k=5
        )
        
        # 搜索商品（支持价格区间）
        products = await service.search_products(
            query="运动鞋",
            brand="Nike",
            min_price=500,
            max_price=2000
        )
        
        # 生成 LLM 上下文
        context = await service.get_context_for_query(
            query="我想买一双跑鞋",
            include_stores=True,
            include_products=True
        )
        
        # 导航到店铺
        nav_info = await service.navigate_to_store("星巴克")
        ```
    
    注意事项：
    - 必须先调用 initialize() 才能使用检索功能
    - 所有检索方法都是异步的，需要使用 await
    - 相似度得分范围是 0-1，可通过 score_threshold 过滤低相关结果
    """
    
    def __init__(
        self,
        milvus_client: Optional[MilvusClient] = None,
        embedding_service: Optional[EmbeddingService] = None
    ):
        """
        初始化 RAG 服务
        
        支持依赖注入，便于测试和自定义配置。如果不提供客户端，
        将在首次使用时自动创建默认客户端（懒加载）。
        
        Args:
            milvus_client: Milvus 向量数据库客户端（可选）
                如果为 None，将在首次访问时通过 get_milvus_client() 创建
            embedding_service: 文本向量化服务（可选）
                如果为 None，将在首次访问时通过 get_embedding_service() 创建
        
        示例：
            ```python
            # 使用默认客户端（懒加载）
            service = RAGService()
            
            # 注入自定义客户端（用于测试）
            mock_client = MockMilvusClient()
            mock_embedding = MockEmbeddingService()
            service = RAGService(
                milvus_client=mock_client,
                embedding_service=mock_embedding
            )
            ```
        """
        self._milvus_client = milvus_client
        self._embedding_service = embedding_service
        self._initialized = False  # 初始化标志，防止重复初始化
    
    @property
    def milvus_client(self) -> MilvusClient:
        """
        获取 Milvus 客户端（懒加载）
        
        使用属性装饰器实现懒加载模式。只有在首次访问时才会创建客户端，
        避免不必要的资源消耗。
        
        Returns:
            MilvusClient: Milvus 向量数据库客户端实例
            
        示例：
            ```python
            service = RAGService()
            # 此时 Milvus 客户端还未创建
            
            client = service.milvus_client
            # 首次访问时创建客户端
            
            client2 = service.milvus_client
            # 后续访问返回同一个实例
            ```
        """
        if self._milvus_client is None:
            self._milvus_client = get_milvus_client()
        return self._milvus_client
    
    @property
    def embedding_service(self) -> EmbeddingService:
        """
        获取 Embedding 服务（懒加载）
        
        使用属性装饰器实现懒加载模式。只有在首次访问时才会创建服务，
        避免不必要的模型加载。
        
        Returns:
            EmbeddingService: 文本向量化服务实例
            
        示例：
            ```python
            service = RAGService()
            # 此时 Embedding 服务还未创建
            
            embedding = service.embedding_service
            # 首次访问时创建服务（可能需要加载模型）
            
            embedding2 = service.embedding_service
            # 后续访问返回同一个实例
            ```
        """
        if self._embedding_service is None:
            self._embedding_service = get_embedding_service()
        return self._embedding_service
    
    async def initialize(self) -> bool:
        """
        初始化 RAG 服务
        
        执行以下初始化步骤：
        1. 连接到 Milvus 向量数据库
        2. 创建必要的集合（stores、products、locations）
        3. 设置初始化标志
        
        这个方法是幂等的，多次调用不会重复初始化。
        
        Returns:
            bool: 初始化是否成功
                - True: 初始化成功或已经初始化
                - False: 初始化失败（通常是连接问题）
        
        Raises:
            不会抛出异常，所有错误都会被捕获并记录日志
        
        使用示例：
            ```python
            service = get_rag_service()
            
            # 初始化服务
            success = await service.initialize()
            if not success:
                logger.error("Failed to initialize RAG service")
                return
            
            # 现在可以使用检索功能
            stores = await service.search_stores("咖啡店")
            ```
        
        注意事项：
        - 必须在使用检索功能前调用此方法
        - 如果 Milvus 连接失败，会返回 False 但不会抛出异常
        - 集合创建是幂等的，已存在的集合不会被重复创建
        """
        # 如果已经初始化，直接返回成功
        if self._initialized:
            return True
        
        try:
            # 连接 Milvus（同步方法）
            self.milvus_client.connect()
            
            # 创建集合（如果不存在）
            self._ensure_collections()
            
            # 设置初始化标志
            self._initialized = True
            logger.info("RAG Service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG Service: {e}")
            return False
    
    def _ensure_collections(self):
        """
        确保所有必要的集合存在
        
        检查并创建以下集合：
        - stores: 店铺信息集合
        - products: 商品信息集合
        - locations: 位置信息集合
        
        这是一个内部方法，由 initialize() 调用。
        集合创建是幂等的，已存在的集合不会被重复创建。
        
        工作流程：
        1. 遍历所有需要的集合
        2. 检查集合是否存在
        3. 如果不存在，使用预定义的 Schema 创建集合
        4. 记录创建日志
        
        注意事项：
        - 这是一个同步方法
        - Schema 定义在 schemas.py 中
        - 如果创建失败会抛出异常，由 initialize() 捕获
        """
        # 定义需要创建的集合及其 Schema
        collections = [
            ("stores", STORES_SCHEMA),      # 店铺集合
            ("products", PRODUCTS_SCHEMA),  # 商品集合
            ("locations", LOCATIONS_SCHEMA) # 位置集合
        ]
        
        # 遍历并创建集合
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
        搜索店铺（语义搜索 + 条件过滤）
        
        基于自然语言查询搜索相关店铺，支持按分类和楼层过滤。
        使用向量相似度检索，返回最相关的店铺列表。
        
        工作流程：
        1. 将查询文本转换为向量（通过 Embedding Service）
        2. 在 Milvus 中进行向量相似度搜索
        3. 应用过滤条件（category、floor）
        4. 按相似度得分排序
        5. 返回 top_k 个结果
        
        Args:
            query: 自然语言查询，如：
                - "咖啡店"
                - "卖运动鞋的店"
                - "二楼有什么餐厅"
            category: 店铺分类过滤（可选），如：
                - "餐饮"
                - "服装"
                - "电子产品"
            floor: 楼层过滤（可选），如：
                - 1: 一楼
                - 2: 二楼
                - -1: B1（地下一层）
            top_k: 返回结果数量（可选）
                - 默认值来自配置 settings.RAG_TOP_K
                - 建议范围：1-20
            score_threshold: 相似度阈值（可选）
                - 范围：0.0-1.0
                - 默认值来自配置 settings.RAG_SCORE_THRESHOLD
                - 只返回得分高于此阈值的结果
            
        Returns:
            List[StoreSearchResult]: 店铺搜索结果列表，按相似度降序排列
                每个结果包含店铺的完整信息和相似度得分
        
        使用示例：
            ```python
            # 基础搜索
            stores = await service.search_stores("咖啡店")
            
            # 带分类过滤
            stores = await service.search_stores(
                query="咖啡店",
                category="餐饮"
            )
            
            # 带楼层过滤
            stores = await service.search_stores(
                query="餐厅",
                floor=2,
                top_k=5
            )
            
            # 完整参数
            stores = await service.search_stores(
                query="运动品牌店",
                category="服装",
                floor=3,
                top_k=10,
                score_threshold=0.7
            )
            
            # 处理结果
            for store in stores:
                print(f"{store.name} - {store.floor}楼 - 相似度: {store.score:.2f}")
            ```
        
        注意事项：
        - 查询文本会被向量化，支持语义理解（不仅仅是关键词匹配）
        - 过滤条件是 AND 关系（同时满足所有条件）
        - 如果没有匹配结果，返回空列表
        - 相似度得分越高表示越相关
        """
        # 使用配置的默认值
        top_k = top_k or settings.RAG_TOP_K
        score_threshold = score_threshold or settings.RAG_SCORE_THRESHOLD
        
        # 构建过滤表达式（Milvus 查询语法）
        filter_expr = build_filter_expr(category=category, floor=floor)
        
        # 创建检索器实例
        retriever = SmartMallRetriever(
            milvus_client=self.milvus_client,
            embedding_service=self.embedding_service,
            collection_name="stores",  # 指定店铺集合
            top_k=top_k,
            score_threshold=score_threshold
        )
        
        # 如果有过滤条件，应用到检索器
        if filter_expr:
            retriever.with_filter(filter_expr)
        
        # 执行异步检索
        documents = await retriever._aget_relevant_documents(query)
        
        # 将 LangChain Document 转换为 StoreSearchResult 对象
        results = []
        for doc in documents:
            meta = doc.metadata  # 提取元数据
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
        为 LLM 生成增强上下文（RAG 的核心功能）
        
        这是 RAG（Retrieval-Augmented Generation）的关键方法。
        根据用户查询检索相关的店铺和商品信息，格式化为结构化文本，
        作为上下文提供给大语言模型，增强 LLM 的回答质量。
        
        工作流程：
        1. 根据查询检索相关店铺（如果 include_stores=True）
        2. 根据查询检索相关商品（如果 include_products=True）
        3. 将检索结果格式化为易读的文本
        4. 截断过长的上下文（防止超出 LLM token 限制）
        5. 返回格式化的上下文字符串
        
        Args:
            query: 用户的自然语言查询，如：
                - "我想买一双跑鞋"
                - "哪里有咖啡店"
                - "二楼有什么好吃的"
            include_stores: 是否包含店铺信息（默认 True）
                - True: 检索并包含相关店铺
                - False: 不检索店铺
            include_products: 是否包含商品信息（默认 True）
                - True: 检索并包含相关商品
                - False: 不检索商品
            max_context_length: 最大上下文长度（默认 2000 字符）
                - 超过此长度会被截断
                - 建议根据 LLM 的 token 限制调整
        
        Returns:
            str: 格式化的上下文字符串，包含相关店铺和商品信息
                格式示例：
                ```
                【相关店铺】
                1. 星巴克（餐饮）- 2楼A区
                   全球知名咖啡连锁品牌...
                2. Costa Coffee（餐饮）- 1楼中庭
                   英国连锁咖啡品牌...
                
                【相关商品】
                1. Nike Air Max 270（Nike） - ¥1299 @ Nike 旗舰店
                2. Adidas Ultra Boost（Adidas） - ¥1499 @ Adidas 专卖店
                3. New Balance 990v5（New Balance） - ¥1399 @ 运动世界
                ```
        
        使用示例：
            ```python
            # 基础用法
            context = await service.get_context_for_query("我想买跑鞋")
            
            # 只包含店铺信息
            context = await service.get_context_for_query(
                query="哪里有咖啡店",
                include_stores=True,
                include_products=False
            )
            
            # 只包含商品信息
            context = await service.get_context_for_query(
                query="有什么运动鞋",
                include_stores=False,
                include_products=True
            )
            
            # 自定义上下文长度
            context = await service.get_context_for_query(
                query="推荐一些好吃的",
                max_context_length=1000
            )
            
            # 将上下文提供给 LLM
            from app.core.llm import get_llm_service
            
            llm = get_llm_service()
            response = await llm.chat(
                messages=[
                    {"role": "system", "content": f"参考信息：\n{context}"},
                    {"role": "user", "content": query}
                ]
            )
            ```
        
        注意事项：
        - 上下文会被自动截断，确保不超过 max_context_length
        - 店铺默认返回 top 3，商品默认返回 top 5
        - 如果没有相关结果，对应部分会被省略
        - 描述信息会被截断到 50 字符
        - 上下文格式是为 LLM 优化的，易于理解和解析
        """
        context_parts = []
        
        # 检索并格式化店铺信息
        if include_stores:
            stores = await self.search_stores(query, top_k=3)
            if stores:
                store_context = "【相关店铺】\n"
                for i, store in enumerate(stores, 1):
                    # 格式：序号. 店铺名（分类）- 楼层区域
                    store_context += f"{i}. {store.name}（{store.category}）- {store.floor}楼{store.area}\n"
                    # 添加描述（截断到 50 字符）
                    if store.description:
                        store_context += f"   {store.description[:50]}...\n"
                context_parts.append(store_context)
        
        # 检索并格式化商品信息
        if include_products:
            products = await self.search_products(query, top_k=5)
            if products:
                product_context = "【相关商品】\n"
                for i, product in enumerate(products, 1):
                    # 格式：序号. 商品名（品牌） - 价格 @ 店铺
                    product_context += f"{i}. {product.name}"
                    if product.brand:
                        product_context += f"（{product.brand}）"
                    product_context += f" - ¥{product.price}"
                    if product.store_name:
                        product_context += f" @ {product.store_name}"
                    product_context += "\n"
                context_parts.append(product_context)
        
        # 合并所有上下文部分
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


# ============================================================================
# 全局服务实例管理（单例模式）
# ============================================================================

# 全局 RAG 服务实例（懒加载）
# 使用模块级变量实现单例模式，确保整个应用只有一个 RAGService 实例
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """
    获取 RAG 服务单例
    
    使用单例模式确保整个应用共享同一个 RAGService 实例，
    避免重复创建客户端和加载模型，节省资源。
    
    这是一个懒加载实现：
    - 首次调用时创建实例
    - 后续调用返回同一个实例
    - 线程安全（Python GIL 保证）
    
    Returns:
        RAGService: 全局唯一的 RAG 服务实例
    
    使用示例：
        ```python
        # 在任何地方获取服务
        service = get_rag_service()
        
        # 多次调用返回同一个实例
        service1 = get_rag_service()
        service2 = get_rag_service()
        assert service1 is service2  # True
        
        # 使用服务
        await service.initialize()
        stores = await service.search_stores("咖啡店")
        ```
    
    注意事项：
    - 返回的实例可能未初始化，需要调用 initialize()
    - 在测试中可以通过修改 _rag_service 来注入 mock 实例
    """
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service


async def init_rag_service() -> RAGService:
    """
    初始化并返回 RAG 服务
    
    这是一个便捷函数，组合了获取服务和初始化两个步骤。
    适合在应用启动时调用，确保服务可用。
    
    工作流程：
    1. 获取或创建 RAG 服务单例
    2. 调用 initialize() 初始化服务
    3. 返回已初始化的服务实例
    
    Returns:
        RAGService: 已初始化的 RAG 服务实例
    
    使用示例：
        ```python
        # 在应用启动时初始化
        from fastapi import FastAPI
        
        app = FastAPI()
        
        @app.on_event("startup")
        async def startup():
            service = await init_rag_service()
            logger.info("RAG service initialized")
        
        # 在路由中使用
        @app.get("/search/stores")
        async def search_stores(query: str):
            service = get_rag_service()  # 已经初始化
            results = await service.search_stores(query)
            return results
        ```
    
    注意事项：
    - 这是一个异步函数，需要使用 await
    - 如果初始化失败，服务仍然会返回，但功能可能不可用
    - 建议在应用启动时调用，而不是在每个请求中调用
    """
    service = get_rag_service()
    await service.initialize()
    return service
