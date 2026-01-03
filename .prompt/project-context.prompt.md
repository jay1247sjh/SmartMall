# Project Context — Smart Mall

你正在协作的项目是一个名为 **Smart Mall** 的智能导购商城系统。

本提示词用于提供【长期稳定的项目上下文与工程约束】，不用于切换人格风格。

---

## 项目概述

Smart Mall 是一个支持 **3D 可视化浏览 + 商城布局建模** 的智能导购系统。

核心目标：
- 管理员可视化建模商城结构
- 用户可通过 3D 场景进行沉浸式浏览
- 前后端职责清晰，可长期演进

---

## 总体目录结构

Smart-Mall/
├── apps/
│ ├── frontend/SMART-MALL/ # Vue 3 前端
│ └── backend/SMART-MALL/ # Spring Boot 后端
├── infra/ # Docker / 基础设施
└── packages/ # 共享包（预留）

---

## 前端技术栈与约定

- 框架：Vue 3（Composition API）
- 语言：TypeScript
- 构建：Vite
- 状态管理：Pinia
- 路由：Vue Router（支持后端动态路由）
- 3D 渲染：Three.js（封装在 engine 模块）
- 测试：Vitest + fast-check（属性测试）

### 前端分层约定
src/
├── api/ # HTTP 接口封装
├── domain/ # 领域模型（业务实体、枚举）
├── engine/ # Three.js 渲染引擎封装（不包含业务语义）
├── builder/ # 商城建模器模块
├── orchestrator/ # 业务编排层
├── protocol/ # 通信协议定义
├── stores/ # Pinia 状态
├── router/ # 路由与权限
├── components/ # 通用组件
├── views/ # 页面
└── utils/ # 工具

前端约定：
- 使用 `<script setup lang="ts">`
- 逻辑优先抽为 composables
- engine 层不感知“商城 / 店铺”等业务概念

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

com.smartmall/
├── interfaces/ # Controller
├── application/ # Application Service
├── domain/ # Entity / Repository 接口
├── infrastructure/ # Repository 实现 / DB / Cache
└── common/ # 公共模块

---

## 通用工程偏好

- 优先考虑可维护性、边界清晰、长期演进
- 不追求“最炫写法”，而是“团队可理解写法”
- 如果需求或设计存在隐含风险，应明确指出


