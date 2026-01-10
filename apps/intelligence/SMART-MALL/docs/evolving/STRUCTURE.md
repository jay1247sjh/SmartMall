# 智能服务目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：Python 智能服务目录结构规范
> 
> 最后更新：2026-01-10

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
└── chat.py                     # 智能对话接口（支持视觉+Function Calling）
```

**说明**：移除了 v1 版本目录，简化结构。

### 2.2 app/core/ - 核心模块

```
core/
├── __init__.py
├── config.py                   # 配置管理
├── llm/                        # LLM 抽象层
│   ├── __init__.py
│   ├── base.py                 # LLM 基类
│   ├── factory.py              # LLM 工厂
│   ├── qwen.py                 # 阿里云百炼 Qwen 实现（推荐）
│   ├── openai.py               # OpenAI 实现
│   ├── deepseek.py             # DeepSeek 实现
│   └── local.py                # 本地模型实现
└── agent/                      # Agent 模块
    ├── __init__.py
    ├── mall_agent.py           # 商城导购 Agent
    └── tools.py                # Function Calling 工具定义
```

### 2.3 app/prompts/ - Prompt 模板

```
prompts/
├── intent.yaml                 # 意图识别 Prompt
└── action.yaml                 # Action 生成 Prompt
```

**说明**：移除了 v1 版本目录，简化结构。如需版本管理，建议使用 Git 分支。

### 2.4 app/schemas/ - 数据模型

```
schemas/
├── __init__.py
├── request.py                  # 请求 Schema（待实现）
└── response.py                 # 响应 Schema（待实现）
```

---

## 3. 待实现模块

### 3.1 app/rag/ - RAG 模块

```
rag/
├── __init__.py
├── retriever.py                # 检索器
└── collections.py              # 向量集合管理
```

---

## 4. 文档目录

```
docs/
├── canonical/                  # 规范文档（不随开发变化）
│   ├── REQUIREMENTS.md         # 需求规格
│   └── DESIGN.md               # 设计文档
└── evolving/                   # 演进文档（随开发更新）
    ├── STRUCTURE.md            # 目录结构说明（本文档）
    ├── TASK.md                 # 任务清单
    └── CHANGELOG.md            # 变更日志
```

---

## 5. 实现状态

| 模块 | 状态 | 说明 |
|------|------|------|
| `app/main.py` | ✅ 完成 | FastAPI 入口 |
| `app/api/health.py` | ✅ 完成 | 健康检查 |
| `app/api/intent.py` | ✅ 完成 | 意图理解接口 |
| `app/api/embedding.py` | ✅ 完成 | Embedding 接口 |
| `app/api/chat.py` | ✅ 完成 | 智能对话接口（视觉+Function Calling） |
| `app/core/config.py` | ✅ 完成 | 配置管理（含 Qwen 配置） |
| `app/core/llm/` | ✅ 完成 | LLM 抽象层 |
| `app/core/llm/qwen.py` | ✅ 完成 | 阿里云百炼 Qwen 提供商 |
| `app/core/agent/` | ✅ 完成 | Agent 模块 |
| `app/core/agent/mall_agent.py` | ✅ 完成 | 商城导购 Agent |
| `app/core/agent/tools.py` | ✅ 完成 | Function Calling 工具定义 |
| `app/prompts/` | ✅ 完成 | Prompt 模板 |
| `app/schemas/` | ⏳ 待完善 | 数据模型 |
| `app/rag/` | ⏳ 待开始 | RAG 模块 |

---

## 6. 版本历史

| 日期 | 变更说明 |
|------|----------|
| 2026-01-10 | 新增 Qwen LLM 提供商、Agent 模块、Chat API |
| 2026-01-10 | 初始版本，移除 prompts/v1 和 api/v1 版本目录 |
