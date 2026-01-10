# Project Context — Smart Mall

你正在协作的项目是一个名为 **Smart Mall** 的智能导购商城系统。

本提示词用于提供【长期稳定的项目上下文与工程约束】，不用于切换人格风格。

---

## 项目概述

Smart Mall 是一个支持 **3D 可视化浏览 + 商城布局建模 + AI 智能导购** 的智能导购系统。

核心目标：
- 管理员可视化建模商城结构
- 用户可通过 3D 场景进行沉浸式浏览
- AI 智能助手提供自然语言交互、导航、推荐
- 前后端职责清晰，可长期演进

---

## 总体目录结构

```
Smart-Mall/
├── apps/
│   ├── frontend/SMART-MALL/     # Vue 3 前端
│   ├── backend/SMART-MALL/      # Spring Boot 后端
│   └── intelligence/SMART-MALL/ # Python AI 服务 ⭐
├── infra/                       # Docker / 基础设施
├── packages/                    # 共享包（预留）
├── study/                       # 学习文档
└── .prompt/                     # AI 提示词配置
```

---

## 前端技术栈与约定

- 框架：Vue 3（Composition API）
- 语言：TypeScript
- 构建：Vite
- 状态管理：Pinia
- 路由：Vue Router（支持后端动态路由）
- 3D 渲染：Three.js（封装在 engine 模块）
- UI 组件：Element Plus
- 测试：Vitest + fast-check（属性测试）

### 前端分层约定

```
src/
├── api/           # HTTP 接口封装
├── domain/        # 领域模型（业务实体、枚举）
├── engine/        # Three.js 渲染引擎封装（不包含业务语义）
├── builder/       # 商城建模器模块
├── orchestrator/  # 业务编排层
├── protocol/      # 通信协议定义
├── stores/        # Pinia 状态
├── router/        # 路由与权限
├── components/    # 通用组件
├── views/         # 页面
├── agent/         # AI Agent 前端集成
└── utils/         # 工具
```

### 前端约定

- 使用 `<script setup lang="ts">`
- 逻辑优先抽为 composables
- engine 层不感知"商城 / 店铺"等业务概念
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case

---

## 后端技术栈与约定

- 框架：Spring Boot 3.x
- 语言：Java 17
- ORM：MyBatis-Plus
- 数据库：PostgreSQL
- 缓存：Redis
- 认证：Spring Security + JWT
- 架构风格：DDD 分层

### 后端分层约定

```
com.smartmall/
├── interfaces/      # Controller
├── application/     # Application Service
├── domain/          # Entity / Repository 接口
├── infrastructure/  # Repository 实现 / DB / Cache
└── common/          # 公共模块
```

### 后端约定

- RESTful API 设计
- 统一响应格式 `{ code, message, data }`
- 异常统一处理
- 日志规范化

---

## AI 服务技术栈与约定 ⭐

- 框架：FastAPI
- 语言：Python 3.11+
- LLM：阿里云百炼 Qwen（推荐）/ OpenAI / DeepSeek
- 特性：Function Calling、视觉理解、流式输出

### AI 服务分层约定

```
app/
├── api/           # FastAPI 路由
├── core/          # 核心模块
│   ├── config.py  # 配置管理
│   ├── llm/       # LLM 抽象层
│   └── agent/     # Agent 模块
├── prompts/       # Prompt 模板
└── schemas/       # 数据模型
```

### AI 服务约定

- 与 Java 后端分离部署
- 通过 HTTP API 通信
- 敏感操作（下单）需用户确认
- 支持多 LLM 提供商切换

---

## 文档规范

每个服务都有 `docs/` 目录，分为：

```
docs/
├── canonical/     # 规范文档（不随开发变化）
│   ├── REQUIREMENTS.md  # 需求规格
│   ├── DESIGN.md        # 设计文档
│   └── PROTOCOL.md      # 接口协议
└── evolving/      # 演进文档（随开发更新）
    ├── STRUCTURE.md     # 目录结构
    ├── TASK.md          # 任务清单
    └── CHANGELOG.md     # 变更日志
```

---

## 通用工程偏好

- 优先考虑可维护性、边界清晰、长期演进
- 不追求"最炫写法"，而是"团队可理解写法"
- 如果需求或设计存在隐含风险，应明确指出
- 代码注释使用中文
- Git 提交信息使用中文

---

## 关键约束

### 必须遵守

1. **分层边界**：各层职责清晰，不越界调用
2. **类型安全**：TypeScript 严格模式，Java 强类型
3. **错误处理**：统一异常处理，不吞异常
4. **安全优先**：敏感信息不硬编码，输入校验

### 禁止行为

1. 禁止在 engine 层引入业务概念
2. 禁止前端直接访问数据库
3. 禁止硬编码 API Key
4. 禁止跳过代码审查直接合并
