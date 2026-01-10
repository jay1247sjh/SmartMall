# Smart Mall Intelligence Service

智能商城导购系统 - 智能服务（Python）

## 概述

本服务负责处理所有 AI 相关功能，与 Java 业务系统分离部署。

### 职责

- **大模型调用 (LLM)**：支持 OpenAI / DeepSeek / 本地模型
- **Prompt 工程**：版本化管理的 Prompt 模板
- **Agent / Skills**：导航 Agent、推荐 Agent 等
- **RAG 检索**：基于向量数据库的知识检索
- **Embedding 生成**：文本向量化
- **意图理解**：自然语言意图识别

### 架构原则

1. **Python 失败不导致 Java 失败**
   - 所有接口有超时和降级机制
   - Java 系统可独立运行

2. **AI 能力可版本化、可替换**
   - Prompt 模板版本化管理
   - 支持多种 LLM 提供商切换

3. **Java 不解析 AI 自然语言**
   - 返回结构化 Action 协议
   - Java 只处理确定性数据

## 快速开始

### 环境要求

- Python 3.11+
- pip 或 uv

### 安装依赖

```bash
# 使用 pip
pip install -r requirements.txt

# 或使用 uv
uv pip install -r requirements.txt
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置 API Key 等
```

### 启动服务

```bash
# 开发模式
uvicorn app.main:app --reload --port 8000

# 生产模式
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker 部署

```bash
# 构建镜像
docker build -t smart-mall-intelligence:latest .

# 运行容器
docker run -d -p 8000:8000 --env-file .env smart-mall-intelligence:latest
```

## API 接口

### 健康检查

```
GET /health
GET /health/ready
GET /health/live
```

### 意图理解

```
POST /api/intent/process
GET /api/intent/supported
```

### Embedding

```
POST /api/embedding/generate
GET /api/embedding/models
```

## 目录结构

```
intelligence/SMART-MALL/
├── app/
│   ├── main.py                 # FastAPI 入口
│   ├── api/
│   │   ├── health.py           # 健康检查
│   │   ├── intent.py           # 意图理解接口
│   │   └── embedding.py        # Embedding 接口
│   ├── core/
│   │   ├── config.py           # 配置管理
│   │   └── llm/
│   │       ├── base.py         # LLM 基类
│   │       ├── factory.py      # LLM 工厂
│   │       ├── openai.py       # OpenAI 实现
│   │       ├── deepseek.py     # DeepSeek 实现
│   │       └── local.py        # 本地模型实现
│   ├── prompts/                # Prompt 模板
│   │   ├── intent.yaml         # 意图识别 Prompt
│   │   └── action.yaml         # Action 生成 Prompt
│   └── schemas/                # 数据模型
├── docs/                       # 项目文档
│   ├── canonical/              # 规范文档
│   │   ├── REQUIREMENTS.md     # 需求规格
│   │   └── DESIGN.md           # 设计文档
│   └── evolving/               # 演进文档
│       ├── STRUCTURE.md        # 目录结构说明
│       ├── TASK.md             # 任务清单
│       └── CHANGELOG.md        # 变更日志
├── tests/
├── Dockerfile
├── requirements.txt
└── README.md
```

## 与 Java 系统集成

### 请求示例

```json
POST /api/intent/process
{
  "requestId": "req_uuid_xxx",
  "version": "1.0",
  "context": {
    "userId": "user_001",
    "role": "USER",
    "mallId": "mall_001"
  },
  "input": {
    "type": "NATURAL_LANGUAGE",
    "text": "Nike 店在哪里？",
    "locale": "zh-CN"
  }
}
```

### 响应示例

```json
{
  "requestId": "req_uuid_xxx",
  "status": "SUCCESS",
  "result": {
    "intent": "NAVIGATE_TO_STORE",
    "confidence": 0.95,
    "actions": [
      {
        "action": "NAVIGATE_TO_STORE",
        "target": { "type": "STORE", "id": "store_nike_001" },
        "params": { "highlight": true }
      }
    ],
    "response": {
      "text": "Nike 店位于 2 楼 A 区，我来为您导航。",
      "suggestions": ["查看店铺详情", "搜索其他品牌"]
    }
  }
}
```

## 开发指南

### 添加新的 LLM 提供商

1. 在 `app/core/llm/` 下创建新文件
2. 继承 `LLMBase` 类
3. 在 `factory.py` 中注册

### 修改 Prompt 模板

1. 编辑 `app/prompts/` 下的 YAML 文件
2. 使用 Git 进行版本管理
3. 重启服务生效

## License

MIT
