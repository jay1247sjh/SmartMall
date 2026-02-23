<p align="center">
  <img src="https://img.shields.io/badge/Smart_Mall-3D_AI_Commerce-blue?style=for-the-badge" alt="Smart Mall" />
</p>

<h1 align="center">Smart Mall</h1>

<p align="center">
  <strong>3D Visualization · Mall Modeling · AI Shopping Guide</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Three.js-r160-000000?logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Milvus-2.3-00A1EA" alt="Milvus" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License" />
</p>

<p align="center">
  融合 3D 沉浸式体验与 AI 智能导购的下一代商业空间管理平台
</p>

---

## Features

- **3D 商城可视化** — 基于 Three.js 的沉浸式 3D 商城浏览与第三人称漫游
- **可视化建模器** — 拖拽式多楼层商城建模，支持区域绘制、基础设施放置、项目持久化
- **AI 智能导购** — LangChain Agent 驱动的自然语言导购，支持 Function Calling 与 SSE 流式对话
- **RAG 知识库** — Milvus 向量检索 + 三类数据隔离（world_facts / reviews / rules）
- **三层记忆系统** — 短期(内存) / 中期(Redis) / 长期(PostgreSQL) 跨会话上下文
- **视觉理解** — 拍照识别商品，推荐相似商品与美食
- **区域权限管理** — RCAC 权限模型，商家申请区域建模权限，管理员审批
- **LLM 商城生成** — 自然语言描述生成商城布局，规则降级兜底
- **多角色体系** — Admin / Merchant / User 三种角色，配置态与运行态分离

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Vue 3)                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Views/UI │→ │ Orchestrator │→ │  Domain  │→ │ Three.js   │  │
│  │          │  │  (RCAC校验)   │  │  Scene   │  │  Engine    │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────┘  │
│       │              │                                          │
│  ┌────┴────┐    ┌────┴────┐                                     │
│  │  Pinia  │    │  Agent  │                                     │
│  │  Store  │    │  (Chat) │                                     │
│  └─────────┘    └────┬────┘                                     │
└──────────────────────┼──────────────────────────────────────────┘
                       │ HTTP / SSE
          ┌────────────┼────────────┐
          ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  Backend (Java)  │    │  Intelligence (Py)   │
│  ┌────────────┐  │    │  ┌────────────────┐  │
│  │ Controller │  │    │  │  FastAPI Routes │  │
│  │ AppService │  │    │  │  Agent + Tools  │  │
│  │   Domain   │  │    │  │  RAG + Memory   │  │
│  │   Infra    │  │    │  │  LLM Provider   │  │
│  └────────────┘  │    │  └────────────────┘  │
└────────┬─────────┘    └──────────┬───────────┘
         │                         │
    ┌────┴────┐    ┌───────┐  ┌────┴────┐
    │ PG 15   │    │ Redis │  │ Milvus  │
    │ :5433   │    │ :6379 │  │ :19530  │
    └─────────┘    └───────┘  └─────────┘
```

| Service | Tech Stack | Port | Directory |
|---------|-----------|------|-----------|
| Frontend | Vue 3 + TypeScript + Three.js | 5173 | `apps/frontend/SMART-MALL` |
| Backend | Spring Boot 3 + MyBatis-Plus | 8080 | `apps/backend/SMART-MALL` |
| Intelligence | FastAPI + LangChain + Qwen | 8000 | `apps/intelligence/SMART-MALL` |
| PostgreSQL | PostgreSQL 15 Alpine | 5433 | `infra/` |
| Redis | Redis 7 Alpine | 6379 | `infra/` |
| Milvus | Milvus 2.3 Standalone | 19530 | `infra/` |

---

## Quick Start

### Prerequisites

- Node.js 18+ & pnpm
- Java 17+ & Maven
- Python 3.11+ & pip
- Docker & Docker Compose

### 1. Clone & Setup Infrastructure

```bash
git clone https://github.com/jay1247sjh/SmartMall.git
cd SmartMall

# Start databases
cd infra
docker-compose up -d postgres redis

# For AI features, also start Milvus
docker-compose up -d
```

### 2. Start Backend

```bash
cd apps/backend/SMART-MALL
./mvnw spring-boot:run
# Running at http://localhost:8080
```

### 3. Start Frontend

```bash
cd apps/frontend/SMART-MALL
pnpm install
pnpm dev
# Running at http://localhost:5173
```

### 4. Start Intelligence Service (Optional)

```bash
cd apps/intelligence/SMART-MALL
pip install -r requirements.txt
cp .env .env.local
# Edit .env.local, add QWEN_API_KEY

uvicorn app.main:app --reload --port 8000
# Running at http://localhost:8000
```

### Test Accounts

| Role | Username | Password |
|------|----------|----------|
|