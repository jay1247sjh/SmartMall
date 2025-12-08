# 前端目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端目录结构规范
> 
> 本文档为 **目录结构说明文档（Structure Document）**，用于定义代码组织规范与模块职责。

---

## 1. 总体设计原则

前端目录结构遵循以下核心原则：

- **语义优先于渲染**
- **决策与执行分离**
- **控制流集中，副作用下沉**
- **Three.js 作为底层实现细节，而非业务入口**

目录结构不是"文件分类"，而是**系统分层的直接映射**。

---

## 2. 顶层目录结构概览

```
smart-mall/
├── docs/                    # 项目文档
├── public/                  # 静态资源（不经过构建）
├── src/                     # 源代码主目录
│   ├── assets/              # 静态资源（经过构建处理）
│   ├── components/          # 通用 UI 组件
│   ├── views/               # 页面级视图组件
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia 状态管理
│   ├── orchestrator/        # 业务协调层
│   ├── domain/              # 领域场景层
│   ├── three/               # Three.js 渲染引擎层
│   ├── agent/               # AI Agent 接入模块
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── api/                 # 后端 API 接口
│   ├── App.vue              # 根组件
│   ├── main.ts              # 应用入口
│   └── style.css            # 全局样式
├── index.html               # HTML 入口
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

---
