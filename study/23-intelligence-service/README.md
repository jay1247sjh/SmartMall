# 智能服务模块

本文档介绍智能商城导购系统的 Python 智能服务架构与实现。

---

## 1. 概述

智能服务（Intelligence Service）是系统的 AI 核心，负责处理所有与大语言模型相关的功能。

### 1.1 服务定位

```
apps/
├── backend/SMART-MALL/      # Java 后端 - 业务逻辑
├── frontend/SMART-MALL/     # Vue 前端 - 用户界面
└── intelligence/SMART-MALL/ # Python 智能服务 - AI 能力
```

### 1.2 核心职责

| 功能 | 说明 |
|------|------|
| 智能对话 | 自然语言交互，支持图片+文字 |
| Function Calling | 自动调用工具完成任务 |
| 意图理解 | 将自然语言转换为结构化 Action |
| Embedding | 文本向量化，用于 RAG 检索 |
| LLM 调用 | 支持 Qwen / OpenAI / DeepSeek |

### 1.3 架构原则

1. **Python 失败不导致 Java 失败** - 降级运行机制
2. **AI 能力可替换** - 支持多 LLM 提供商切换
3. **安全控制** - 敏感操作（下单）需用户确认
4. **结构化输出** - 返回 Action 协议，Java 不解析自然语言

---

## 2. 目录结构

```
intelligence/SMART-MALL/
├── app/
│   ├── main.py              # FastAPI 入口
│   ├── api/
│   │   ├── health.py        # 健康检查
│   │   ├── intent.py        # 意图理解接口
│   │   ├── embedding.py     # Embedding 接口
│   │   └── chat.py          # 智能对话接口 ⭐
│   ├── core/
│   │   ├── config.py        # 配置管理
│   │   ├── llm/             # LLM 抽象层
│   │   │   ├── base.py      # LLM 基类
│   │   │   ├── factory.py   # LLM 工厂
│   │   │   ├── qwen.py      # Qwen 实现 ⭐
│   │   │   ├── openai.py    # OpenAI 实现
│   │   │   ├── deepseek.py  # DeepSeek 实现
│   │   │   └── local.py     # 本地模型实现
│   │   └── agent/           # Agent 模块 ⭐
│   │       ├── mall_agent.py    # 商城导购 Agent
│   │       └── tools.py         # Function Calling 工具
│   ├── prompts/             # Prompt 模板
│   └── schemas/             # 数据模型
├── docs/
│   ├── canonical/           # 规范文档
│   │   ├── REQUIREMENTS.md
│   │   ├── DESIGN.md
│   │   └── FUNCTION_CALLING.md  # Function Calling 设计 ⭐
│   └── evolving/            # 演进文档
├── .env                     # 环境变量
├── Dockerfile
└── requirements.txt
```

---

## 3. 核心功能

### 3.1 智能对话（Chat API）

支持纯文本和图片+文字两种输入方式。

```python
# 纯文本对话
POST /api/chat
{
    "request_id": "req_001",
    "user_id": "user_001",
    "message": "Nike店在哪里？"
}

# 图片+文字对话
POST /api/chat
{
    "request_id": "req_002",
    "user_id": "user_001",
    "message": "我想吃类似的菜",
    "image_url": "https://example.com/food.jpg"
}
```

### 3.2 Function Calling

Agent 可以自动调用以下工具：

| 工具 | 说明 | 安全级别 |
|------|------|----------|
| navigate_to_store | 导航到店铺 | safe |
| navigate_to_area | 导航到区域 | safe |
| search_products | 搜索商品 | safe |
| search_stores | 搜索店铺 | safe |
| search_by_image | 图片搜索 | safe |
| recommend_products | 推荐商品 | safe |
| recommend_restaurants | 推荐餐厅 | safe |
| add_to_cart | 加购物车 | confirm |
| create_order | 创建订单 | critical |

### 3.3 安全控制

敏感操作需要用户确认：

```python
# 返回需要确认的响应
{
    "type": "confirm",           # 需要确认
    "action": "add_to_cart",     # 要执行的操作
    "args": {"product_id": "xxx"},
    "message": "确认将商品添加到购物车吗？"
}

# 用户确认后调用
POST /api/chat/confirm
{
    "action": "add_to_cart",
    "args": {"product_id": "xxx"},
    "confirmed": true
}
```

---

## 4. 核心代码解析

### 4.1 Qwen LLM 提供商

```python
# app/core/llm/qwen.py
class QwenProvider(LLMBase):
    """阿里云百炼 Qwen LLM 提供商"""
    
    # 模型能力映射
    MODEL_CAPABILITIES = {
        "qwen3-vl-plus": {"vision": True, "function_calling": True},
        "qwen-plus": {"vision": False, "function_calling": True},
    }
    
    async def chat_with_vision(self, text: str, image_url: str) -> CompletionResult:
        """视觉理解（图片+文本）"""
        ...
    
    async def chat_with_tools(self, messages: list, tools: list) -> dict:
        """Function Calling"""
        ...
```

### 4.2 商城导购 Agent

```python
# app/core/agent/mall_agent.py
class MallAgent:
    """智能商城导购 Agent"""
    
    async def process(
        self,
        user_input: str,
        image_url: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """处理用户输入"""
        
        if image_url:
            # 图片+文字：先视觉理解，再 Function Calling
            return await self._process_with_vision(user_input, image_url, context)
        else:
            # 纯文本：直接 Function Calling
            return await self._process_text(user_input, context)
```

### 4.3 工具定义

```python
# app/core/agent/tools.py
MALL_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "navigate_to_store",
            "description": "导航到指定店铺。当用户询问某个店铺在哪里时使用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "store_name": {
                        "type": "string",
                        "description": "店铺名称"
                    }
                },
                "required": ["store_name"]
            }
        }
    },
    # ... 更多工具
]

# 操作安全级别
OPERATION_LEVELS = {
    "navigate_to_store": "safe",
    "add_to_cart": "confirm",
    "create_order": "critical",
}
```

---

## 5. API 接口

### 5.1 智能对话

```
POST /api/chat
```

**请求：**
```json
{
    "request_id": "req_001",
    "user_id": "user_001",
    "message": "帮我搜索500元以内的跑鞋",
    "image_url": null,
    "context": {
        "location": {"x": 0, "y": 0, "z": 0}
    }
}
```

**响应：**
```json
{
    "request_id": "req_001",
    "type": "text",
    "content": "为您找到2款500元以内的跑鞋...",
    "tool_results": [{
        "function": "search_products",
        "args": {"keyword": "跑鞋", "max_price": 500},
        "result": {"products": [...], "total": 2}
    }],
    "model": "qwen3-vl-plus",
    "tokens_used": 1723,
    "timestamp": "2026-01-10T07:38:03Z"
}
```

### 5.2 确认操作

```
POST /api/chat/confirm
```

### 5.3 健康检查

```
GET /health
GET /health/ready
GET /health/live
```

---

## 6. 配置说明

### 6.1 环境变量

```bash
# .env
# LLM 配置
LLM_PROVIDER=qwen
QWEN_API_KEY=sk-xxx
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# 备用 LLM
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
```

### 6.2 切换 LLM 提供商

修改 `.env` 文件：
```bash
LLM_PROVIDER=openai  # 或 deepseek
OPENAI_API_KEY=sk-xxx
```

---

## 7. 本地开发

### 7.1 启动服务

```bash
cd apps/intelligence/SMART-MALL

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 API Key

# 启动开发服务器
uvicorn app.main:app --reload --port 9000
```

### 7.2 测试接口

```bash
# 健康检查
curl http://localhost:9000/health

# 智能对话
curl -X POST http://localhost:9000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"request_id":"1","user_id":"u1","message":"Nike店在哪？"}'
```

### 7.3 Docker 部署

```bash
docker build -t smart-mall-intelligence:latest .
docker run -d -p 9000:8000 --env-file .env smart-mall-intelligence:latest
```

---

## 8. 常见问题

### Q1: 如何添加新的工具？

1. 在 `app/core/agent/tools.py` 中添加工具定义
2. 在 `OPERATION_LEVELS` 中设置安全级别
3. 在 `MallAgent._execute_function()` 中实现执行逻辑

### Q2: 如何支持新的 LLM？

1. 在 `app/core/llm/` 下创建新的 Provider 类
2. 继承 `LLMBase` 并实现抽象方法
3. 在 `factory.py` 中注册新 Provider

### Q3: 图片识别不准确怎么办？

1. 确保使用支持视觉的模型（如 qwen3-vl-plus）
2. 优化视觉理解的 Prompt
3. 考虑使用更高分辨率的图片

### Q4: Function Calling 没有调用工具？

1. 检查工具描述是否清晰
2. 检查用户输入是否匹配工具场景
3. 调整 temperature 参数（建议 0.3）

---

## 9. 相关文档

- [Function Calling 设计](../../apps/intelligence/SMART-MALL/docs/canonical/FUNCTION_CALLING.md)
- [智能服务需求规格](../../apps/intelligence/SMART-MALL/docs/canonical/REQUIREMENTS.md)
- [智能服务设计文档](../../apps/intelligence/SMART-MALL/docs/canonical/DESIGN.md)
- [AI 集成规范](../../apps/backend/SMART-MALL/docs/canonical/AI_INTEGRATION.md)

---

## 10. RAG 知识库系统

### 10.1 概述

RAG（Retrieval-Augmented Generation）知识库系统基于 Milvus 向量数据库和 LangChain 框架，为智能导购提供语义检索能力，显著提升 AI 回答的准确性和相关性。

### 10.2 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| 向量数据库 | Milvus 2.3+ | 高性能向量检索，支持过滤条件 |
| RAG 框架 | LangChain | 自定义 Retriever，灵活的检索链 |
| Embedding | 通义千问 text-embedding-v3 | 1024 维向量，中文优化 |
| 索引类型 | IVF_FLAT | 平衡检索速度和准确性 |

### 10.3 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      RAG 系统架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Agent     │────►│ RAG Service │────►│   Milvus    │   │
│  │ (mall_agent)│     │  (service)  │     │  (向量DB)   │   │
│  └─────────────┘     └──────┬──────┘     └─────────────┘   │
│                             │                               │
│                             ▼                               │
│                      ┌─────────────┐                        │
│                      │  Embedding  │                        │
│                      │  (通义千问)  │                        │
│                      └─────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.4 核心组件

#### 10.4.1 Milvus 客户端

```python
# app/core/rag/milvus_client.py
class MilvusClient:
    """Milvus 向量数据库客户端"""
    
    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self._connection = None
    
    def connect(self) -> None:
        """建立连接"""
        connections.connect(
            alias="default",
            host=self.host,
            port=self.port
        )
    
    def search(
        self,
        collection_name: str,
        query_vectors: List[List[float]],
        filter_expr: Optional[str] = None,
        top_k: int = 10,
        output_fields: List[str] = None
    ) -> List[List[Dict]]:
        """向量检索"""
        collection = Collection(collection_name)
        
        search_params = {
            "metric_type": "COSINE",
            "params": {"nprobe": 10}
        }
        
        results = collection.search(
            data=query_vectors,
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            expr=filter_expr,
            output_fields=output_fields
        )
        
        return self._format_results(results)
```

#### 10.4.2 Embedding 服务

```python
# app/core/rag/embedding.py
class EmbeddingService:
    """Embedding 服务 - 支持多提供商"""
    
    PROVIDERS = {
        "qwen": {
            "model": "text-embedding-v3",
            "dimension": 1024,
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
        },
        "openai": {
            "model": "text-embedding-3-small",
            "dimension": 1536
        }
    }
    
    async def embed_text(self, text: str) -> List[float]:
        """文本向量化"""
        response = await self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding
    
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """批量向量化（支持分块处理）"""
        embeddings = []
        for chunk in self._chunk_texts(texts, batch_size=20):
            batch_embeddings = await self._embed_batch_internal(chunk)
            embeddings.extend(batch_embeddings)
        return embeddings
```

#### 10.4.3 LangChain Retriever

```python
# app/core/rag/retriever.py
class MilvusRetriever(BaseRetriever):
    """自定义 LangChain Retriever"""
    
    collection_name: str
    embedding_service: EmbeddingService
    milvus_client: MilvusClient
    
    def _get_relevant_documents(
        self,
        query: str,
        *,
        filters: Optional[Dict] = None,
        top_k: int = 5
    ) -> List[Document]:
        """检索相关文档"""
        # 1. 查询向量化
        query_embedding = self.embedding_service.embed_text(query)
        
        # 2. 构建过滤表达式
        filter_expr = self._build_filter_expr(filters)
        
        # 3. 向量检索
        results = self.milvus_client.search(
            collection_name=self.collection_name,
            query_vectors=[query_embedding],
            filter_expr=filter_expr,
            top_k=top_k
        )
        
        # 4. 转换为 Document
        return [
            Document(
                page_content=hit["description"],
                metadata=hit
            )
            for hit in results[0]
        ]
    
    def _build_filter_expr(self, filters: Optional[Dict]) -> Optional[str]:
        """构建 Milvus 过滤表达式"""
        if not filters:
            return None
        
        conditions = []
        for key, value in filters.items():
            if key.endswith("_gte"):
                field = key[:-4]
                conditions.append(f"{field} >= {value}")
            elif key.endswith("_lte"):
                field = key[:-4]
                conditions.append(f"{field} <= {value}")
            else:
                conditions.append(f'{key} == "{value}"')
        
        return " and ".join(conditions) if conditions else None
```

#### 10.4.4 RAG 服务

```python
# app/core/rag/service.py
class RAGService:
    """RAG 核心服务"""
    
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.milvus_client = get_milvus_client()
        self.store_retriever = MilvusRetriever(
            collection_name="stores",
            embedding_service=self.embedding_service,
            milvus_client=self.milvus_client
        )
        self.product_retriever = MilvusRetriever(
            collection_name="products",
            embedding_service=self.embedding_service,
            milvus_client=self.milvus_client
        )
    
    async def search_stores(
        self,
        query: str,
        category: Optional[str] = None,
        floor: Optional[int] = None,
        top_k: int = 5
    ) -> List[Dict]:
        """语义搜索店铺"""
        filters = {}
        if category:
            filters["category"] = category
        if floor:
            filters["floor"] = floor
        
        docs = self.store_retriever.get_relevant_documents(
            query, filters=filters, top_k=top_k
        )
        return [doc.metadata for doc in docs]
    
    async def search_products(
        self,
        query: str,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        brand: Optional[str] = None,
        top_k: int = 10
    ) -> List[Dict]:
        """语义搜索商品"""
        filters = {}
        if min_price is not None:
            filters["price_gte"] = min_price
        if max_price is not None:
            filters["price_lte"] = max_price
        if brand:
            filters["brand"] = brand
        
        docs = self.product_retriever.get_relevant_documents(
            query, filters=filters, top_k=top_k
        )
        return [doc.metadata for doc in docs]
    
    async def navigate_to_store(self, store_name: str) -> Dict:
        """导航到店铺（返回位置信息）"""
        stores = await self.search_stores(store_name, top_k=1)
        if not stores:
            return {"success": False, "message": f"未找到店铺: {store_name}"}
        
        store = stores[0]
        return {
            "success": True,
            "store": store,
            "position": {
                "x": store["position_x"],
                "y": store["position_y"],
                "z": store["position_z"]
            }
        }
```

### 10.5 数据集合设计

#### 10.5.1 店铺集合 (stores)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(64) | 店铺 ID，主键 |
| name | VARCHAR(200) | 店铺名称 |
| category | VARCHAR(100) | 店铺类别 |
| description | VARCHAR(2000) | 店铺描述 |
| floor | INT64 | 所在楼层 |
| area | VARCHAR(100) | 所在区域 |
| position_x/y/z | FLOAT | 3D 位置坐标 |
| tags | VARCHAR(500) | 标签（逗号分隔） |
| embedding | FLOAT_VECTOR(1024) | 语义向量 |

#### 10.5.2 商品集合 (products)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(64) | 商品 ID，主键 |
| name | VARCHAR(200) | 商品名称 |
| brand | VARCHAR(100) | 品牌 |
| category | VARCHAR(100) | 商品类别 |
| description | VARCHAR(2000) | 商品描述 |
| price | FLOAT | 价格 |
| store_id | VARCHAR(64) | 所属店铺 ID |
| store_name | VARCHAR(200) | 所属店铺名称 |
| tags | VARCHAR(500) | 标签 |
| embedding | FLOAT_VECTOR(1024) | 语义向量 |

#### 10.5.3 位置集合 (locations)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(64) | 位置 ID，主键 |
| name | VARCHAR(200) | 位置名称 |
| type | VARCHAR(50) | 位置类型（入口/电梯/洗手间等） |
| description | VARCHAR(1000) | 位置描述 |
| floor | INT64 | 所在楼层 |
| position_x/y/z | FLOAT | 3D 位置坐标 |
| embedding | FLOAT_VECTOR(1024) | 语义向量 |

### 10.6 API 接口

#### 10.6.1 店铺语义搜索

```http
POST /api/rag/search/stores
Content-Type: application/json

{
    "query": "运动品牌",
    "category": "运动",
    "floor": 1,
    "top_k": 5
}
```

**响应：**
```json
{
    "success": true,
    "results": [
        {
            "id": "store_001",
            "name": "Nike 专卖店",
            "category": "运动",
            "description": "全球知名运动品牌...",
            "floor": 1,
            "area": "A区",
            "position_x": 10.5,
            "position_y": 0,
            "position_z": 20.3,
            "score": 0.92
        }
    ],
    "total": 1
}
```

#### 10.6.2 商品语义搜索

```http
POST /api/rag/search/products
Content-Type: application/json

{
    "query": "跑鞋",
    "brand": "Nike",
    "min_price": 500,
    "max_price": 1000,
    "top_k": 10
}
```

#### 10.6.3 触发数据同步

```http
POST /api/rag/sync/trigger
Content-Type: application/json

{
    "collections": ["stores", "products", "locations"]
}
```

**响应：**
```json
{
    "success": true,
    "results": {
        "stores": {"synced": 15, "failed": 0},
        "products": {"synced": 60, "failed": 0},
        "locations": {"synced": 10, "failed": 0}
    },
    "timestamp": "2026-01-11T10:30:00Z"
}
```

#### 10.6.4 健康检查

```http
GET /api/rag/health
```

### 10.7 Agent 集成

Mall Agent 在处理用户查询时，优先使用 RAG 检索获取相关信息：

```python
class MallAgent:
    def __init__(self):
        self.llm = LLMFactory.create("qwen")
        self.rag_service = get_rag_service()
    
    async def process(self, user_input: str, ...) -> Dict[str, Any]:
        # 1. 使用 RAG 获取相关上下文
        try:
            rag_context = await self.rag_service.generate_context(user_input)
        except Exception as e:
            logger.warning(f"RAG failed, fallback: {e}")
            rag_context = ""  # RAG 失败时降级
        
        # 2. 增强系统提示词
        enhanced_prompt = f"{system_prompt}\n\n当前商城信息：\n{rag_context}"
        
        # 3. 调用 LLM 进行 Function Calling
        return await self._process_with_context(user_input, enhanced_prompt)
```

### 10.8 部署配置

#### 10.8.1 Milvus 部署

使用 Docker Compose 部署 Milvus Standalone：

```yaml
# infra/docker-compose.yml
services:
  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
    volumes:
      - etcd_data:/etcd

  minio:
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    volumes:
      - minio_data:/minio_data
    command: minio server /minio_data

  milvus:
    image: milvusdb/milvus:v2.3.3
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    ports:
      - "19530:19530"
    depends_on:
      - etcd
      - minio
```

启动命令：
```bash
cd infra
docker-compose up -d milvus etcd minio
```

#### 10.8.2 环境变量配置

```env
# RAG 配置
MILVUS_HOST=localhost
MILVUS_PORT=19530

# Embedding 配置
EMBEDDING_PROVIDER=qwen
QWEN_EMBEDDING_MODEL=text-embedding-v3
```

### 10.9 示例数据

系统提供了 15 家店铺、60+ 商品的示例数据：

```python
# app/core/rag/seed_data.py
SEED_STORES = [
    {
        "id": "store_001",
        "name": "Nike 专卖店",
        "category": "运动",
        "description": "全球知名运动品牌，提供专业运动装备和休闲服饰",
        "floor": 1,
        "area": "A区",
        "position_x": 10.5,
        "position_y": 0,
        "position_z": 20.3,
        "tags": "运动,跑步,篮球,足球"
    },
    # ... 更多店铺
]

SEED_PRODUCTS = [
    {
        "id": "prod_001",
        "name": "Air Max 270 跑鞋",
        "brand": "Nike",
        "category": "运动鞋",
        "description": "经典气垫跑鞋，舒适透气",
        "price": 899.0,
        "store_id": "store_001",
        "store_name": "Nike 专卖店",
        "tags": "跑鞋,气垫,运动"
    },
    # ... 更多商品
]
```

### 10.10 常见问题

#### Q1: Milvus 连接失败怎么办？

1. 检查 Milvus 服务是否启动：`docker ps | grep milvus`
2. 检查端口是否正确：默认 19530
3. 检查网络连接：`telnet localhost 19530`

#### Q2: Embedding 生成慢怎么办？

1. 启用批量处理：使用 `embed_batch` 而非循环调用 `embed_text`
2. 启用缓存：相同文本不重复计算
3. 考虑本地 Embedding 模型

#### Q3: 检索结果不准确怎么办？

1. 优化文本描述：确保店铺/商品描述包含关键词
2. 调整 top_k：增加候选数量
3. 添加过滤条件：使用 category、floor 等字段过滤
4. 调整索引参数：增加 nlist 和 nprobe
