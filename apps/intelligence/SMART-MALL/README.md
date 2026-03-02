# Smart Mall Intelligence Service

智能商城导购系统 - AI 智能服务

---

## 项目概述

本服务是 Smart Mall 智能商城的 AI 核心，负责自然语言理解、智能导购、商品推荐、商城生成等 AI 能力。

### 核心能力

| 能力 | 说明 | 状态 |
|------|------|------|
| 🗣️ 自然语言对话 | 理解用户意图，生成自然回复 | ✅ |
| 📡 SSE 流式对话 | 逐 token 推送，实时响应 | ✅ |
| 🎙️ 全双工语音会话 | WebSocket 语音输入/回复，支持打断 | ✅ |
| 🔧 Function Calling | 调用工具完成导航、搜索、购物等任务 | ✅ |
| 👁️ 视觉理解 | 识别图片内容，推荐相似商品/美食 | ✅ |
| 🛡️ 安全防护 | 提示词注入检测、敏感内容过滤 | ✅ |
| 🎯 意图识别 | 精准识别用户意图和实体 | ✅ |
| 🔍 RAG 语义检索 | 基于 Milvus + LangChain 的向量检索 | ✅ |
| 🧠 三层记忆系统 | 短期/中期/长期记忆，跨会话上下文 | ✅ |
| 🏗️ 商城布局生成 | LLM + 规则降级的商城楼层/区域生成 | ✅ |
| 💬 商城描述对话 | 多轮对话引导用户生成商城描述 | ✅ |
| 🏪 店铺布局生成 | LLM 驱动的店铺内部 3D 布局生成 | ✅ |
| 🔄 数据同步 | Redis Streams 事件驱动的增量同步 | ✅ |

### 技术栈

- **框架**: FastAPI 0.109+
- **语言**: Python 3.11+
- **LLM**: 阿里云百炼 Qwen（支持 OpenAI 兼容接口）
- **Agent**: LangChain AgentExecutor（支持 OpenAI Tools / ReAct 双模式）
- **向量数据库**: Milvus 2.3+
- **RAG 框架**: LangChain
- **缓存/事件**: Redis 7（连接池 + Streams）
- **类型**: Pydantic 2.x
- **配置**: pydantic-settings + YAML + 环境变量

---

## 快速开始

### 1. 安装依赖

```bash
cd apps/intelligence/SMART-MALL
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 创建本地配置文件（不会被提交到 Git）
cp .env .env.local

# 在 .env.local 中填写敏感信息
# 必需：QWEN_API_KEY（从 https://bailian.console.aliyun.com/ 获取）
```

**配置优先级**: `.env.local` > `.env`

### 3. 启动服务

```bash
# 开发模式（端口 8000，自动重载）
uvicorn app.main:app --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

启动时会显示配置摘要：

```
============================================================
Configuration Loaded
============================================================
Environment: development
Config Source: .env.local + .env
Config Version: 1.0.0
LLM Provider: qwen
LLM Model: qwen3-vl-plus
Embedding Provider: qwen
Embedding Dimension: 1024
Milvus: localhost:19530/smartmall
PostgreSQL: localhost:5433/smartmall
Redis: redis://localhost:6379/0
============================================================
```

### 4. 测试接口

```bash
# 健康检查
curl http://localhost:8000/health

# 就绪检查
curl http://localhost:8000/health/ready

# 对话测试
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"request_id":"test-001","user_id":"user-001","message":"Nike 店在哪里？"}'
```

---

## 目录结构

```
intelligence/SMART-MALL/
├── app/
│   ├── main.py                     # FastAPI 入口 + 生命周期管理
│   ├── api/                        # API 路由层
│   │   ├── chat.py                 # 对话接口（非流式）
│   │   ├── chat_stream.py          # SSE 流式对话接口
│   │   ├── voice_ws.py             # 语音 WebSocket 接口
│   │   ├── mall_generator.py       # 商城布局生成 API
│   │   ├── mall_describe.py        # 商城描述多轮对话 API
│   │   ├── store_layout_generator.py # 店铺布局生成 API
│   │   ├── floors.py               # 楼层管理 + Milvus 向量操作
│   │   ├── embedding.py            # Embedding 生成接口
│   │   ├── rag.py                  # RAG 语义检索接口
│   │   ├── sync.py                 # 数据同步状态 + 指标接口
│   │   └── health.py               # 健康/就绪/存活检查
│   ├── core/                       # 核心模块
│   │   ├── config.py               # 配置中心（pydantic-settings）
│   │   ├── prompt_loader.py        # YAML 提示词加载器
│   │   ├── llm_provider.py         # LLM 提供商工厂（含 fallback 链）
│   │   ├── speech/                 # 语音 Provider 抽象层
│   │   ├── embedding_provider.py   # Embedding 提供商
│   │   ├── errors.py               # 统一错误解析
│   │   ├── degradation_handler.py  # LLM 降级日志回调
│   │   ├── redis_pool.py           # Redis 连接池工厂
│   │   ├── agent/                  # Agent 模块
│   │   │   ├── agent.py            # AgentExecutor 工厂 + 安全检查 + 视觉处理
│   │   │   ├── intent_router.py    # 意图路由器
│   │   │   ├── tools.py            # Function Calling 工具定义（OpenAI 格式）
│   │   │   └── tools_langchain.py  # LangChain @tool 实现 + 安全级别包装
│   │   ├── memory/                 # 三层记忆系统
│   │   │   ├── manager.py          # 记忆管理器（协调三层）
│   │   │   ├── short_term.py       # 短期记忆（内存）
│   │   │   ├── mid_term.py         # 中期记忆（Redis）
│   │   │   ├── long_term.py        # 长期记忆（PostgreSQL）
│   │   │   ├── summarizer.py       # 对话摘要生成器（带防抖）
│   │   │   └── session_scanner.py  # 会话超时扫描器
│   │   ├── rag/                    # RAG 模块
│   │   │   ├── milvus_client.py    # Milvus 客户端
│   │   │   ├── embedding.py        # Embedding 服务
│   │   │   ├── retriever.py        # LangChain Retriever
│   │   │   ├── service.py          # RAG 核心服务
│   │   │   ├── sync.py             # 数据同步服务
│   │   │   ├── schemas.py          # 集合 Schema
│   │   │   └── seed_data.py        # 示例数据
│   │   └── sync/                   # 事件驱动同步
│   │       ├── event_bus.py        # Redis Streams 事件总线
│   │       ├── events.py           # 同步事件定义
│   │       ├── sync_service.py     # 同步服务
│   │       ├── retry_queue.py      # 重试队列
│   │       ├── rebuild.py          # 全量重建
│   │       └── consistency_checker.py # 一致性检查
│   ├── services/                   # 业务服务层
│   │   ├── mall_generation_service.py  # 商城生成服务（Config/Parser/Engine 四层）
│   │   └── store_layout_service.py     # 店铺布局 LLM 生成服务
│   │   └── realtime_voice_service.py   # 实时语音编排服务
│   ├── schemas/                    # Pydantic 数据模型
│   │   ├── base.py                 # 基础 Schema
│   │   ├── rag.py                  # RAG API Schema
│   │   └── store_layout.py         # 店铺布局 Schema
│   └── prompts/                    # YAML 提示词配置
│       ├── system.yaml             # 系统级提示词（AI 助手核心行为）
│       ├── intent.yaml             # 意图识别提示词
│       ├── action.yaml             # Action 生成提示词
│       ├── vision.yaml             # 视觉理解提示词
│       ├── safety.yaml             # 安全防护配置（注入检测 + 敏感词）
│       ├── mall_generation.yaml    # LLM 商城生成提示词
│       ├── mall_fallback.yaml      # 规则降级几何配置
│       ├── mall_describe.yaml      # 商城描述多轮对话提示词
│       ├── store_layout.yaml       # 店铺布局生成提示词
│       ├── store_themes.yaml       # 店铺主题预设配置
│       ├── summarize.yaml          # 对话摘要生成提示词
│       ├── chat_messages.yaml      # 对话消息模板
│       └── README.md               # 提示词配置指南
├── tests/                          # 测试
├── docs/                           # 项目文档
│   ├── canonical/                  # 规范文档
│   └── evolving/                   # 演进文档
├── .env                            # 基础环境变量
├── .env.local                      # 本地敏感配置（不提交 Git）
├── requirements.txt                # Python 依赖
└── Dockerfile                      # 容器化
```

---

## 架构设计

### 分层架构

```
API 层（FastAPI Routes）
↓
服务层（Services）          ← 商城生成、店铺布局等业务服务
↓
Agent 层（AgentExecutor）   ← LangChain Agent + 安全级别工具包装
↓
核心层（Core）
├── LLM Provider            ← 多提供商 + fallback 链 + 降级日志
├── Memory Manager          ← 短期(内存) / 中期(Redis) / 长期(PG)
├── RAG Service             ← Milvus 向量检索 + LangChain Retriever
├── Prompt Loader           ← YAML 配置加载 + 缓存 + 热重载
├── Config Center           ← pydantic-settings 统一配置
└── Sync Pipeline           ← Redis Streams 事件驱动同步
```

### 设计原则

- **零硬编码**: 所有提示词、消息模板、主题预设、几何参数均从 YAML 加载
- **配置中心化**: 所有运行时参数通过 `config.py` 统一管理，支持环境变量覆盖
- **降级容错**: LLM 失败 → fallback 链 → 规则降级 → 友好错误提示
- **Python 失败不影响 Java**: AI 服务独立部署，异常不传播到后端
- **安全优先**: 提示词注入检测、工具安全级别分层、敏感操作需确认

---

## 核心模块说明

### 1. 配置中心（config.py）

基于 `pydantic-settings`，支持字段验证、多环境配置、启动摘要日志。

| 配置分类 | 关键配置项 | 说明 |
|----------|-----------|------|
| LLM | `LLM_PROVIDER`, `QWEN_API_KEY`, `LLM_TEMPERATURE` | 支持 qwen/openai/deepseek/local |
| Embedding | `EMBEDDING_PROVIDER`, `EMBEDDING_DIMENSION` | 默认 1024（BGE-M3 / text-embedding-v3） |
| Milvus | `MILVUS_HOST`, `MILVUS_PORT`, `MILVUS_DB_NAME` | 向量数据库连接 |
| PostgreSQL | `PG_HOST`, `PG_PORT`, `PG_DATABASE` | 数据源 |
| Redis | `REDIS_URL`, `REDIS_MAX_CONNECTIONS` | 缓存 + 事件总线 |
| RAG | `RAG_TOP_K`, `RAG_SCORE_THRESHOLD` | 检索参数 |
| Memory | `MEMORY_MAX_TOKEN_LIMIT`, `MEMORY_SUMMARIZE_DEBOUNCE_SECONDS` | 记忆系统 |
| Agent | `AGENT_MAX_ITERATIONS`, `VISION_LLM_TEMPERATURE` | Agent 行为控制 |
| 商城描述 | `MALL_DESCRIBE_MAX_ROUNDS`, `MALL_DESCRIBE_WARN_THRESHOLD` | 多轮对话限制 |

启动时自动验证：端口范围、温度参数、相似度阈值、提供商有效性。

### 2. 提示词系统（PromptLoader）

所有提示词和配置模板统一存放在 `app/prompts/*.yaml`，通过 `PromptLoader` 加载：

```python
from app.core.prompt_loader import PromptLoader

# 获取系统提示词
system_prompt = PromptLoader.get_system_prompt("system")

# 格式化用户提示词
user_prompt = PromptLoader.format_user_prompt("intent", user_input="找运动鞋")

# 获取嵌套配置值
cancel_msg = PromptLoader.get_config_value("chat_messages", "cancel", "message")

# 热重载
PromptLoader.reload("intent")
```

| YAML 文件 | 用途 |
|-----------|------|
| `system.yaml` | AI 助手核心行为定义 |
| `intent.yaml` | 意图分类提示词 |
| `action.yaml` | Action 生成提示词 |
| `vision.yaml` | 视觉理解提示词 |
| `safety.yaml` | 注入检测模式 + 敏感词 + 安全回复 |
| `mall_generation.yaml` | LLM 商城生成提示词 |
| `mall_fallback.yaml` | 规则降级几何参数配置 |
| `mall_describe.yaml` | 商城描述多轮对话提示词 + 控制消息 |
| `store_layout.yaml` | 店铺布局生成提示词 |
| `store_themes.yaml` | 店铺主题预设（4 种主题） |
| `summarize.yaml` | 对话摘要生成提示词 |
| `chat_messages.yaml` | 对话确认/取消消息模板 |

### 3. Agent 系统

基于 LangChain `AgentExecutor`，通过 `SmartMallAgentFactory` 创建：

- **双模式**: 根据 `OPENROUTER_SUPPORTS_TOOLS` 自动选择 OpenAI Tools Agent 或 ReAct Agent
- **安全检查**: 输入经过 `safety.yaml` 注入模式检测
- **视觉处理**: 图片输入走独立视觉 LLM（`get_vision_llm()`），不降级到文本模型
- **工具安全级别**: `SafetyLevelToolWrapper` 按级别包装工具

| 安全级别 | 行为 | 工具示例 |
|---------|------|---------|
| safe | 直接执行 | navigate_to_store, search_products, recommend_products |
| confirm | 中断，返回确认请求 | add_to_cart |
| critical | 中断，返回确认请求 | create_order |

共 12 个工具：导航(2) + 搜索(3) + 详情(2) + 购物(3) + 推荐(2)

### 4. 三层记忆系统

```
┌──────────────┐  溢出   ┌──────────────┐  摘要   ┌──────────────┐
│  短期记忆     │ ──────► │  中期记忆     │ ──────► │  长期记忆     │
│  (内存)       │         │  (Redis)      │         │  (PostgreSQL) │
│  最近 N 轮    │         │  TTL 7 天     │         │  永久存储     │
└──────────────┘         └──────────────┘         └──────────────┘
```

- **MemoryManager**: 协调三层记忆，组装 Prompt 上下文
- **Summarizer**: LLM 驱动的对话摘要，带防抖机制（默认 120s）
- **SessionScanner**: 后台任务，扫描超时会话

### 5. 商城生成服务

`mall_generation_service.py` 采用 Config/Parser/Engine/Entry 四层架构：

```
LLM 生成（mall_generation.yaml 提示词）
  ↓ 失败
规则降级生成（mall_fallback.yaml 几何参数）
  ↓ 配置缺失
抛出异常（不使用内置默认值）
```

- 所有几何参数（楼层高度、区域间距、颜色等）从 `mall_fallback.yaml` 读取
- YAML 缺失时抛出异常，不使用内置默认值
- 区域统一默认颜色，不按分类区分

### 6. 店铺布局服务

`store_layout_service.py` 通过 LLM 生成店铺内部 3D 对象布局：

- 主题预设从 `store_themes.yaml` 加载（日式咖啡馆、现代服装店等）
- LangChain LCEL Chain 调用 LLM
- 射线法（Ray Casting）边界校验
- 无降级策略，LLM 失败返回友好错误

### 7. RAG 语义检索

基于 Milvus + LangChain 的向量检索：

| 集合 | 内容 | 关键字段 |
|------|------|---------|
| stores | 店铺信息 | name, category, floor, area, position, embedding |
| products | 商品信息 | name, brand, price, store_id, embedding |
| locations | 位置信息 | name, type, floor, position, embedding |

### 8. 事件驱动同步

基于 Redis Streams 的增量同步管道：

```
数据变更 → EventBus(Redis Streams) → SyncService → Milvus
                                         ↓ 失败
                                    RetryQueue → 重试
                                         ↓ 持续失败
                                    ConsistencyChecker → 全量重建
```

---

## API 接口

### 对话

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 非流式对话（支持文本 + 图片） |
| POST | `/api/chat/stream` | SSE 流式对话 |
| WS | `/api/voice/ws` | 全双工语音会话（ASR + LLM + TTS） |

### 商城生成

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/mall/generate` | 通过描述生成商城布局 |
| POST | `/api/mall/describe` | 多轮对话引导生成商城描述 |

### 店铺布局

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/store/generate-layout` | 生成店铺内部布局 |
| GET | `/api/store/generate-layout/themes` | 获取可用主题列表 |

### RAG 检索

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/rag/search/stores` | 店铺语义搜索 |
| POST | `/api/rag/search/products` | 商品语义搜索 |
| POST | `/api/rag/sync/trigger` | 触发数据同步 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/embeddings` | 生成 Embedding 向量 |
| GET | `/api/floors` | 楼层管理 |
| GET | `/health` | 健康检查 |
| GET | `/health/ready` | 就绪检查 |
| GET | `/health/live` | 存活检查 |

---

## 配置说明

### 配置文件

| 文件 | 说明 | 提交到 Git |
|------|------|-----------|
| `.env` | 基础配置，不含敏感信息 | ✅ |
| `.env.local` | 本地敏感配置（API Key 等） | ❌ |
| `app/prompts/*.yaml` | 提示词和配置模板 | ✅ |

### LLM 提供商切换

```env
# 使用 Qwen（默认，推荐）
LLM_PROVIDER=qwen
QWEN_API_KEY=your_key

# 使用 OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
EMBEDDING_PROVIDER=openai
EMBEDDING_DIMENSION=1536

# 使用本地 Ollama
LLM_PROVIDER=local
LOCAL_MODEL_URL=http://localhost:11434
LOCAL_MODEL_NAME=llama2
```

### 配置验证

启动时自动验证：
- ✅ 端口号范围（1-65535）
- ✅ 温度参数范围（0.0-2.0）
- ✅ 相似度阈值范围（0.0-1.0）
- ✅ LLM/Embedding 提供商有效性
- ✅ API Key 完整性（缺失时 warning 不阻塞启动）

---

## 生命周期管理

应用启动时按顺序初始化（任一失败不阻塞启动，进入降级模式）：

1. **Redis 连接池** → 缓存 + 事件总线
2. **EventBus Consumer Group** → Redis Streams 消费组
3. **RAG Service** → Milvus 连接 + 集合初始化
4. **Session Scanner** → 后台会话超时扫描

降级服务会记录到 `app.state.degraded_services`，可通过就绪检查接口查询。

---

## 开发指南

### 添加新工具

1. 在 `tools_langchain.py` 中用 `@tool` 装饰器定义工具
2. 在 `SAFETY_LEVELS` 中设置安全级别
3. 添加到 `ALL_TOOLS` 列表
4. 同步更新 `tools.py` 中的 `MALL_TOOLS`（OpenAI 格式定义）

### 修改提示词

1. 编辑 `prompts/*.yaml`
2. 更新 `version` 字段
3. 重启服务或调用 `PromptLoader.reload("name")`

### 添加新配置项

1. 在 `config.py` 的 `Settings` 类中添加字段
2. 在 `.env` 中添加默认值
3. 在代码中通过 `settings.NEW_FIELD` 引用

### 添加新 YAML 配置

1. 在 `prompts/` 目录创建 `{name}.yaml`
2. 通过 `PromptLoader.load("name")` 或 `PromptLoader.get_config_value("name", "key")` 访问
3. 更新 `prompts/README.md`

---

## Docker 部署

```bash
# 构建镜像
docker build -t smart-mall-intelligence:latest .

# 运行容器
docker run -d \
  -p 8000:8000 \
  -e QWEN_API_KEY=your_key \
  -e PG_HOST=host.docker.internal \
  -e MILVUS_HOST=host.docker.internal \
  -e REDIS_URL=redis://host.docker.internal:6379/0 \
  smart-mall-intelligence:latest
```

---

## 相关文档

- [提示词配置指南](app/prompts/README.md)
- [Function Calling 文档](docs/canonical/FUNCTION_CALLING.md)
- [设计文档](docs/canonical/DESIGN.md)
- [需求规格](docs/canonical/REQUIREMENTS.md)

---

## License

MIT
