# 智能服务目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：Python 智能服务目录结构规范
> 
> 最后更新：2026-01-26

---

## 1. 顶层目录结构

```
intelligence/SMART-MALL/
├── app/                        # 源代码主目录
│   ├── main.py                 # FastAPI 入口
│   ├── api/                    # API 接口层
│   ├── core/                   # 核心模块
│   ├── prompts/                # Prompt 模板
│   └── schemas/                # 数据模型
├── docs/                       # 项目文档
│   ├── canonical/              # 规范文档
│   └── evolving/               # 演进文档
├── tests/                      # 测试代码
├── Dockerfile                  # Docker 构建文件
├── requirements.txt            # Python 依赖
├── .env                        # 环境变量（本地）
└── README.md                   # 项目说明
```

---

## 2. 核心目录详解

### 2.1 app/api/ - API 接口层

```
api/
├── __init__.py
├── health.py                   # 健康检查接口
├── intent.py                   # 意图理解接口
├── embedding.py                # Embedding 接口
├── chat.py                     # 智能对话接口（支持视觉+Function Calling）
├── rag.py                      # RAG 检索接口
└── mall_generator.py           # 商城生成接口
```

### 2.2 app/core/ - 核心模块

```
core/
├── __init__.py
├── config.py                   # 配置管理
├── errors.py                   # 错误定义
├── prompt_loader.py            # Prompt 加载器
├── llm/                        # LLM 抽象层
│   ├── __init__.py
│   ├── base.py                 # LLM 基类
│   ├── factory.py              # LLM 工厂
│   ├── qwen.py                 # 阿里云百炼 Qwen 实现（推荐）
│   ├── openai.py               # OpenAI 实现
│   ├── deepseek.py             # DeepSeek 实现
│   └── local.py                # 本地模型实现
├── agent/                      # Agent 模块
│   ├── __init__.py
│   ├── mall_agent.py           # 商城导购 Agent
│   └── tools.py                # Function Calling 工具定义
└── rag/                        # RAG 模块
    ├── __init__.py
    ├── embedding.py            # Embedding 服务
    ├── milvus_client.py        # Milvus 向量数据库客户端
    ├── retriever.py            # 检索器
    ├── schemas.py              # RAG 数据模型
    ├── seed_data.py            # 种子数据
    ├── service.py              # RAG 服务
    └── sync.py                 # 数据同步
```

### 2.3 app/prompts/ - Prompt 模板

```
prompts/
├── README.md                   # Prompt 说明
├── intent.yaml                 # 意图识别 Prompt
├── action.yaml                 # Action 生成 Prompt
├── safety.yaml                 # 安全检查 Prompt
├── system.yaml                 # 系统 Prompt
└── vision.yaml                 # 视觉理解 Prompt
```

### 2.4 app/schemas/ - 数据模型

```
schemas/
├── __init__.py
├── base.py                     # 基础 Schema
└── rag.py                      # RAG 相关 Schema
```

---

## 3. 实现状态

| 模块 | 状态 | 说明 |
|------|------|------|
| `app/main.py` | ✅ 完成 | FastAPI 入口 |
| `app/api/health.py` | ✅ 完成 | 健康检查 |
| `app/api/intent.py` | ✅ 完成 | 意图理解接口 |
| `app/api/embedding.py` | ✅ 完成 | Embedding 接口 |
| `app/api/chat.py` | ✅ 完成 | 智能对话接口（视觉+Function Calling） |
| `app/api/rag.py` | ✅ 完成 | RAG 检索接口 |
| `app/api/mall_generator.py` | ✅ 完成 | 商城生成接口 |
| `app/core/config.py` | ✅ 完成 | 配置管理（含 Qwen 配置） |
| `app/core/errors.py` | ✅ 完成 | 错误定义 |
| `app/core/prompt_loader.py` | ✅ 完成 | Prompt 加载器 |
| `app/core/llm/` | ✅ 完成 | LLM 抽象层 |
| `app/core/llm/qwen.py` | ✅ 完成 | 阿里云百炼 Qwen 提供商 |
| `app/core/llm/openai.py` | ✅ 完成 | OpenAI 提供商 |
| `app/core/llm/deepseek.py` | ✅ 完成 | DeepSeek 提供商 |
| `app/core/llm/local.py` | ✅ 完成 | 本地模型提供商 |
| `app/core/agent/` | ✅ 完成 | Agent 模块 |
| `app/core/agent/mall_agent.py` | ✅ 完成 | 商城导购 Agent |
| `app/core/agent/tools.py` | ✅ 完成 | Function Calling 工具定义 |
| `app/core/rag/` | ✅ 完成 | RAG 模块 |
| `app/core/rag/embedding.py` | ✅ 完成 | Embedding 服务 |
| `app/core/rag/milvus_client.py` | ✅ 完成 | Milvus 客户端 |
| `app/core/rag/retriever.py` | ✅ 完成 | 检索器 |
| `app/core/rag/service.py` | ✅ 完成 | RAG 服务 |
| `app/prompts/` | ✅ 完成 | Prompt 模板 |
| `app/schemas/` | ✅ 完成 | 数据模型 |

---

## 4. API 接口汇总

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/intent` | 意图理解 |
| POST | `/api/embedding` | 文本向量化 |
| POST | `/api/chat` | 智能对话 |
| POST | `/api/chat/confirm` | 确认操作 |
| POST | `/api/rag/query` | RAG 检索 |
| POST | `/api/rag/index` | 索引文档 |
| POST | `/api/mall/generate` | 生成商城布局 |

---

## 5. 版本历史

| 日期 | 变更说明 |
|------|----------|
| 2026-01-26 | 更新文档，对齐实际实现状态，补充 RAG 模块 |
| 2026-01-10 | 新增 Qwen LLM 提供商、Agent 模块、Chat API |
| 2026-01-10 | 初始版本 |
