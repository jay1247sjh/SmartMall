# 学习文档目录

本目录包含项目各模块的学习文档，帮助开发者理解项目架构和实现细节。

---

## 项目概述

Smart Mall 是一个支持 **3D 可视化浏览 + 商城布局建模 + AI 智能导购** 的智能导购系统。

```
┌─────────────────────────────────────────────────────────────┐
│                      Smart Mall 架构                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Frontend   │  │   Backend   │  │   Intelligence      │ │
│  │  (Vue 3)    │──│ (Spring)    │──│   (FastAPI)         │ │
│  │  + Three.js │  │  + MyBatis  │  │   + Qwen LLM        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         │                │                    │             │
│         └────────────────┼────────────────────┘             │
│                          ▼                                  │
│                   ┌─────────────┐                           │
│                   │  PostgreSQL │                           │
│                   │  + Redis    │                           │
│                   └─────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 文档列表

### 🎨 前端模块 (Vue 3 + TypeScript + Three.js)

| 序号 | 模块 | 说明 | 难度 |
|------|------|------|------|
| 01 | [登录模块](./01-login/README.md) | 用户登录功能实现 | ⭐ |
| 02 | [注册模块](./02-register/README.md) | 用户注册功能实现 | ⭐ |
| 03 | [密码重置](./03-password-reset/README.md) | 密码重置功能实现 | ⭐ |
| 04 | [布局系统](./04-layouts/README.md) | 应用布局架构 | ⭐⭐ |
| 05 | [仪表盘](./05-dashboard/README.md) | 仪表盘页面实现 | ⭐⭐ |
| 06 | [Three.js 引擎](./06-three-engine/README.md) | 3D 渲染引擎封装 | ⭐⭐⭐ |
| 07 | [材质系统](./07-materials/README.md) | 3D 材质管理 | ⭐⭐⭐ |
| 08 | [相机控制](./08-camera-controls/README.md) | 3D 相机控制系统 | ⭐⭐⭐ |
| 09 | [商城建模器基础](./09-mall-builder-basics/README.md) | 商城建模器核心功能 | ⭐⭐⭐ |
| 10 | [3D 模型管理](./10-3d-models/README.md) | 3D 模型加载与管理 | ⭐⭐⭐ |
| 11 | [漫游模式](./11-roaming-mode/README.md) | 3D 场景漫游功能 | ⭐⭐⭐ |
| 18 | [Element Plus 组件](./18-element-plus/README.md) | UI 组件库使用 | ⭐⭐ |
| 19 | [商城建模器持久化](./19-mall-builder-persistence/README.md) | 建模数据持久化 | ⭐⭐⭐ |

### ☕ 后端模块 (Spring Boot 3 + MyBatis-Plus)

| 序号 | 模块 | 说明 | 难度 |
|------|------|------|------|
| 12 | [后端架构](./12-backend-architecture/README.md) | 后端整体架构设计 | ⭐⭐⭐ |
| 13 | [API 层](./13-api-layer/README.md) | RESTful API 设计 | ⭐⭐ |
| 14 | [状态管理](./14-state-management/README.md) | 前端状态管理 | ⭐⭐ |
| 15 | [路由系统](./15-routing-system/README.md) | 前后端路由设计 | ⭐⭐⭐ |
| 16 | [领域模型](./16-domain-model/README.md) | DDD 领域模型设计 | ⭐⭐⭐ |
| 17 | [协议层](./17-protocol-layer/README.md) | 前后端通信协议 | ⭐⭐ |

### 📦 业务功能模块

| 序号 | 模块 | 说明 | 难度 |
|------|------|------|------|
| 20 | [店铺管理](./20-store-management/README.md) | 店铺创建、审批、状态管理 | ⭐⭐ |
| 21 | [商品管理](./21-product-management/README.md) | 商品 CRUD、库存、上下架 | ⭐⭐ |
| 22 | [用户管理](./22-user-management/README.md) | 用户列表、搜索筛选、状态管理 | ⭐⭐ |

### 🤖 智能服务模块 (FastAPI + Qwen LLM)

| 序号 | 模块 | 说明 | 难度 |
|------|------|------|------|
| 23 | [智能服务](./23-intelligence-service/README.md) | Python AI 服务架构与实现 | ⭐⭐⭐ |

---

## 学习路径

### 🚀 新手入门（1-2 周）

```
01-登录 → 02-注册 → 03-密码重置 → 04-布局 → 05-仪表盘
```

掌握：Vue 3 基础、Composition API、Element Plus

### 🎮 3D 开发（2-3 周）

```
06-Three引擎 → 07-材质 → 08-相机 → 09-建模器 → 10-模型 → 11-漫游
```

掌握：Three.js 基础、场景管理、交互控制

### ☕ 后端开发（2-3 周）

```
12-架构 → 13-API → 16-领域模型 → 17-协议 → 15-路由
```

掌握：Spring Boot、DDD、RESTful API

### 🤖 AI 开发（1-2 周）

```
23-智能服务
```

掌握：FastAPI、LLM 集成、Function Calling

### 📦 业务功能（1-2 周）

```
20-店铺 → 21-商品 → 22-用户
```

掌握：完整业务流程、前后端联调

---

## 文档规范

每个模块文档应包含：

```markdown
# 模块名称

## 1. 功能概述
简要说明模块的作用和职责

## 2. 核心概念
关键术语和概念解释

## 3. 代码结构
文件组织和模块划分

## 4. 核心代码解析
关键代码片段和解释

## 5. 设计决策
为什么这样设计？有哪些 trade-off？

## 6. 常见问题
FAQ 和踩坑记录
```

---

## 技术栈速查

| 层 | 技术 | 版本 | 文档 |
|---|---|---|---|
| 前端框架 | Vue 3 | 3.4+ | [官方文档](https://vuejs.org/) |
| 前端语言 | TypeScript | 5.x | [官方文档](https://www.typescriptlang.org/) |
| 3D 渲染 | Three.js | 0.160+ | [官方文档](https://threejs.org/) |
| UI 组件 | Element Plus | 2.x | [官方文档](https://element-plus.org/) |
| 状态管理 | Pinia | 2.x | [官方文档](https://pinia.vuejs.org/) |
| 后端框架 | Spring Boot | 3.x | [官方文档](https://spring.io/projects/spring-boot) |
| ORM | MyBatis-Plus | 3.5+ | [官方文档](https://baomidou.com/) |
| AI 框架 | FastAPI | 0.109+ | [官方文档](https://fastapi.tiangolo.com/) |
| LLM | Qwen | - | [阿里云百炼](https://help.aliyun.com/zh/model-studio/) |
