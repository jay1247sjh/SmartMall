# AI 服务设计文档（DESIGN.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：Python AI 服务架构设计
> 
> 本文档定义 AI 服务的技术架构与设计决策。

---

## 1. 架构概述

### 1.1 系统定位

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端 (Vue 3 + Three.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐  │
│  │   Java 业务系统          │    │   Python AI 服务             │  │
│  │   (Spring Boot 3.x)     │◄──►│   (FastAPI)                  │  │
│  │                         │    │                              │  │
│  │  • 用户认证与权限        │    │  • 大模型调用                 │  │
│  │  • 商城结构管理          │    │  • Prompt 工程               │  │
│  │  • 区域权限审批          │    │  • Agent / Skills            │  │
│  │  • 店铺商品管理          │    │  • RAG 检索                  │  │
│  │  • 布局版本控制          │    │  • Embedding 生成            │  │
│  │  • 审计日志              │    │  • 意图理解                  │  │
│  │                         │    │                              │  │
│  │  【确定性、稳定、可审计】  │    │  【非确定性、可试错、可替换】  │  │
│  └─────────────────────────┘    └─────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 设计原则

1. **Java 系统不依赖 Prompt 逻辑** - Java 只处理结构化 Action
2. **Python 失败不导致 Java 失败** - 降级运行机制
3. **AI 能力可版本化、可替换** - 支持多 LLM 提供商

---

## 2. 目录结构

```
intelligence/SMART-MALL/
├── app/
│   ├── main.py                 # FastAPI 入口
│   ├── api/
│   │   ├── health.py           # 健康检查
│   │   ├── intent.py           # 意图理解接口
│   │   ├── embedding.py        # Embedding 接口
│   │   └── chat.py             # 智能对话接口 ⭐
│   ├── core/
│   │   ├── config.py           # 配置管理
│   │   ├── llm/
│   │   │   ├── base.py         # LLM 基类
│   │   │   ├── factory.py      # LLM 工厂
│   │   │   ├── qwen.py         # Qwen 实现 ⭐
│   │   │   ├── openai.py       # OpenAI 实现
│   │   │   ├── deepseek.py     # DeepSeek 实现
│   │   │   └── local.py        # 本地模型实现
│   │   └── agent/              # Agent 模块 ⭐
│   │       ├── mall_agent.py   # 商城导购 Agent
│   │       └── tools.py        # Function Calling 工具
│   ├── rag/                    # RAG 模块（待实现）
│   │   ├── retriever.py        # 检索器
│   │   └── collections.py      # 向量集合管理
│   ├── prompts/                # Prompt 模板
│   │   ├── intent.yaml         # 意图识别 Prompt
│   │   └── action.yaml         # Action 生成 Prompt
│   └── schemas/                # 数据模型
│       ├── request.py          # 请求 Schema
│       └── response.py         # 响应 Schema
├── docs/
│   ├── canonical/              # 规范文档
│   │   ├── REQUIREMENTS.md     # 需求规格
│   │   ├── DESIGN.md           # 设计文档（本文档）
│   │   └── FUNCTION_CALLING.md # Function Calling 设计 ⭐
│   └── evolving/               # 演进文档
│       ├── STRUCTURE.md        # 目录结构说明
│       ├── TASK.md             # 任务清单
│       └── CHANGELOG.md        # 变更日志
├── tests/                      # 测试
├── .env                        # 环境变量
├── .gitignore                  # Git 忽略
├── Dockerfile
├── requirements.txt
└── README.md
```

---

## 3. 核心模块设计

### 3.1 LLM 抽象层

```python
# app/core/llm/base.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class LLMBase(ABC):
    """LLM 基类，定义统一接口"""
    
    @abstractmethod
    async def complete(self, prompt: str, **kwargs) -> str:
        """文本补全"""
        pass
    
    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """对话补全"""
        pass
    
    @abstractmethod
    async def embed(self, text: str) -> List[float]:
        """文本向量化"""
        pass
```

### 3.2 LLM 工厂

```python
# app/core/llm/factory.py
class LLMFactory:
    """LLM 工厂，支持运行时切换"""
    
    _providers: Dict[str, type] = {}
    
    @classmethod
    def register(cls, name: str, provider: type):
        cls._providers[name] = provider
    
    @classmethod
    def create(cls, provider: str, **kwargs) -> LLMBase:
        if provider not in cls._providers:
            raise ValueError(f"Unknown provider: {provider}")
        return cls._providers[provider](**kwargs)

# 注册提供商
LLMFactory.register("openai", OpenAIProvider)
LLMFactory.register("deepseek", DeepSeekProvider)
LLMFactory.register("local", LocalModelProvider)
```

### 3.3 Prompt 管理

Prompt 模板使用 YAML 格式，支持参数化：

```yaml
# app/prompts/intent.yaml
name: "intent_recognition"
description: "识别用户意图"

system_prompt: |
  你是智能商城导购助手...

user_prompt_template: |
  用户位置: {current_position}
  用户输入: {user_input}

parameters:
  temperature: 0.3
  max_tokens: 200
```

### 3.4 配置管理

```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 服务配置
    app_name: str = "Smart Mall AI Service"
    debug: bool = False
    
    # LLM 配置
    llm_provider: str = "openai"
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    
    # DeepSeek 配置
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-chat"
    
    # 本地模型配置
    local_model_url: str = "http://localhost:11434"
    local_model_name: str = "llama2"
    
    class Config:
        env_file = ".env"
```

---

## 4. API 设计

### 4.1 意图理解接口

```
POST /api/intent/process
```

**请求体**：
```json
{
  "requestId": "req_uuid_xxx",
  "context": {
    "userId": "user_001",
    "mallId": "mall_001",
    "currentPosition": { "x": 10, "y": 0, "z": 10 }
  },
  "input": {
    "type": "NATURAL_LANGUAGE",
    "text": "Nike 店在哪里？"
  }
}
```

**响应体**：
```json
{
  "requestId": "req_uuid_xxx",
  "status": "SUCCESS",
  "result": {
    "intent": "NAVIGATE_TO_STORE",
    "confidence": 0.95,
    "entities": {
      "store_name": "Nike"
    },
    "actions": [...],
    "response": {
      "text": "Nike 店位于 2 楼 A 区",
      "suggestions": ["查看店铺详情"]
    }
  }
}
```

### 4.2 Embedding 接口

```
POST /api/embedding/generate
```

**请求体**：
```json
{
  "texts": ["Nike 运动鞋", "Adidas 运动服"],
  "model": "text-embedding-ada-002"
}
```

**响应体**：
```json
{
  "embeddings": [
    [0.1, 0.2, ...],
    [0.3, 0.4, ...]
  ],
  "model": "text-embedding-ada-002",
  "dimensions": 1536
}
```

### 4.3 健康检查接口

```
GET /health          # 基础健康检查
GET /health/ready    # 就绪检查（含依赖）
GET /health/live     # 存活检查
```

---

## 5. 错误处理

### 5.1 错误分类

| 错误类型 | 错误码 | 可重试 | 处理策略 |
|----------|--------|--------|----------|
| 服务超时 | AI_SERVICE_TIMEOUT | ✅ | 重试 + 降级 |
| 模型限流 | AI_RATE_LIMITED | ✅ | 延迟重试 |
| 输入过长 | AI_INPUT_TOO_LONG | ❌ | 截断重试 |
| 输出解析失败 | AI_OUTPUT_PARSE_ERROR | ✅ | 重新生成 |
| 意图不明确 | AI_INTENT_UNCLEAR | ❌ | 引导用户 |

### 5.2 降级策略

当 LLM 服务不可用时：
1. 尝试备用 LLM 提供商
2. 返回关键词匹配结果
3. 返回降级提示

---

## 6. 部署架构

### 6.1 容器化部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 6.2 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `LLM_PROVIDER` | LLM 提供商 | openai |
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `OPENAI_MODEL` | OpenAI 模型 | gpt-4 |
| `DEEPSEEK_API_KEY` | DeepSeek API Key | - |
| `LOG_LEVEL` | 日志级别 | INFO |

---

## 7. 监控与可观测性

### 7.1 日志格式

```json
{
  "timestamp": "2026-01-10T10:00:00Z",
  "level": "INFO",
  "requestId": "req_xxx",
  "message": "Intent processed",
  "intent": "NAVIGATE_TO_STORE",
  "latencyMs": 800
}
```

### 7.2 监控指标

| 指标名称 | 类型 | 说明 |
|----------|------|------|
| `ai_request_total` | Counter | 请求总数 |
| `ai_request_latency` | Histogram | 请求延迟 |
| `ai_llm_tokens_used` | Counter | Token 使用量 |
| `ai_error_total` | Counter | 错误总数 |

---

## 附录 A：技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| Web 框架 | FastAPI | 异步支持、自动文档、类型安全 |
| 配置管理 | Pydantic Settings | 类型安全、环境变量支持 |
| HTTP 客户端 | httpx | 异步支持、现代 API |
| 向量数据库 | Milvus/Qdrant | 高性能、云原生 |

---

## 附录 B：版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-01-10 | 初始版本 |
