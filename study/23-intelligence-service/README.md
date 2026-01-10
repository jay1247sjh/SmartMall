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
