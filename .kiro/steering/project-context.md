---
inclusion: always
---

# Smart Mall 项目上下文

本文档为 Kiro 提供项目元信息，支持渐进式披露调用。

---

## 项目概述

Smart Mall 是一个 **3D 可视化 + 商城建模 + AI 智能导购** 的智能商城系统。

| 服务 | 技术栈 | 端口 | 目录 |
|------|--------|------|------|
| Frontend | Vue 3 + TypeScript + Three.js | 5173 | `apps/frontend/SMART-MALL` |
| Backend | Spring Boot 3 + MyBatis-Plus | 8080 | `apps/backend/SMART-MALL` |
| Intelligence | FastAPI + Qwen LLM | 8000 | `apps/intelligence/SMART-MALL` |
| Database | PostgreSQL 15 | 5433 | `infra/` |
| Cache | Redis 7 | 6379 | `infra/` |
| Vector DB | Milvus 2.3 | 19530 | `infra/` |

---

## 目录结构

```
Smart-Mall/
├── apps/
│   ├── frontend/SMART-MALL/     # Vue 3 前端
│   ├── backend/SMART-MALL/      # Spring Boot 后端
│   └── intelligence/SMART-MALL/ # Python AI 服务
├── infra/                       # Docker 基础设施
├── packages/                    # 共享包（预留）
├── study/                       # 学习文档（01-23）
├── .prompt/                     # AI 提示词模式配置
└── .kiro/steering/              # Kiro 协作约束
```

---

## .prompt 文件夹说明

`.prompt/` 目录包含 AI 协作的模式配置文件：

| 文件 | 用途 | 使用场景 |
|------|------|----------|
| `project-context.prompt.md` | 项目上下文 | 始终加载 |
| `mode-strict-coding.prompt.md` | 严格编码模式 | 生产级代码、AI 服务开发 |
| `mode-progressive-coding.prompt.md` | 渐进式编码 | 教学式开发 |
| `mode-architect-review.prompt.md` | 架构评审 | 设计评审 |
| `mode-debug-detective.prompt.md` | 调试排查 | 问题定位 |
| `mode-socratic-teaching.prompt.md` | 苏格拉底教学 | 概念学习 |

**使用方式**：在对话中引用 `#[[file:.prompt/mode-strict-coding.prompt.md]]`

---

## 前端架构 (Vue 3)

### 分层结构

```
src/
├── api/           # HTTP 接口封装
├── domain/        # 领域模型（业务实体、枚举）
├── engine/        # Three.js 渲染引擎（无业务语义）
├── builder/       # 商城建模器模块
├── orchestrator/  # 业务编排层
├── protocol/      # 通信协议定义
├── stores/        # Pinia 状态管理
├── router/        # 路由与权限
├── components/    # 通用组件
├── views/         # 页面视图
├── agent/         # AI Agent 前端集成
└── utils/         # 工具函数
```

### 技术约定

- 使用 `<script setup lang="ts">`
- 逻辑优先抽为 composables
- engine 层不感知业务概念（商城/店铺）
- 组件命名 PascalCase，文件命名 kebab-case
- 样式使用 SCSS，参考 `#[[file:.kiro/steering/frontend-style-guide.md]]`

---

## 后端架构 (Spring Boot)

### 分层结构

```
com.smartmall/
├── interfaces/      # Controller 层
├── application/     # Application Service
├── domain/          # Entity / Repository 接口
├── infrastructure/  # Repository 实现 / DB / Cache
└── common/          # 公共模块
```

### 技术约定

- RESTful API 设计
- 统一响应格式 `{ code, message, data }`
- 异常统一处理
- JWT 认证 + Spring Security

---

## AI 服务架构 (FastAPI)

### 分层结构

```
app/
├── api/           # FastAPI 路由
├── core/          # 核心模块
│   ├── config.py  # 配置管理
│   ├── llm/       # LLM 抽象层
│   └── agent/     # Agent 模块
├── prompts/       # Prompt 模板
└── schemas/       # Pydantic 数据模型
```

### 技术约定

- 异步优先（async/await）
- 完整类型注解（Pydantic 2.x）
- 支持多 LLM 提供商（Qwen/OpenAI/DeepSeek）
- Function Calling 安全级别：safe / confirm / critical

### LLM 配置

```python
# 推荐使用阿里云百炼 Qwen
LLM_PROVIDER=qwen
QWEN_MODEL=qwen3-vl-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

---

## 关键约束

### 必须遵守

1. **分层边界**：各层职责清晰，不越界调用
2. **类型安全**：TypeScript 严格模式，Java 强类型，Python 类型注解
3. **错误处理**：统一异常处理，不吞异常
4. **安全优先**：敏感信息从环境变量读取

### 禁止行为

- ❌ engine 层引入业务概念
- ❌ 前端直接访问数据库
- ❌ 硬编码 API Key
- ❌ 使用 `any` 类型（除非有充分理由）
- ❌ 同步阻塞调用（AI 服务）

---

## 渐进式披露

当需要深入了解某个模块时，可引用：

- 前端样式：`#[[file:.kiro/steering/frontend-style-guide.md]]`
- 前端详情：`#[[file:apps/frontend/SMART-MALL/README.md]]`
- 后端详情：`#[[file:apps/backend/SMART-MALL/README.md]]`
- AI 服务详情：`#[[file:apps/intelligence/SMART-MALL/README.md]]`
- 基础设施：`#[[file:infra/README.md]]`
- 学习文档：`#[[file:study/README.md]]`
