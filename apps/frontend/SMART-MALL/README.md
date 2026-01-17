# Smart Mall 前端

Vue 3 + TypeScript + Three.js 构建的智能商城前端应用。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 组合式 API + `<script setup>` |
| TypeScript | 5.x | 严格模式 |
| Vite | 5.x | 构建工具 |
| Element Plus | 2.x | UI 组件库 |
| Three.js | 0.160+ | 3D 渲染引擎 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 1.x | HTTP 客户端 |
| SCSS | - | 样式预处理 |

## 项目结构

```
src/
├── api/                 # API 接口封装
├── builder/             # 商城建模器模块
├── components/          # 通用组件
├── domain/              # 领域模型
├── engine/              # Three.js 渲染引擎
├── router/              # 路由配置
├── stores/              # Pinia 状态管理
├── styles/              # 全局样式
├── views/               # 页面视图
├── agent/               # AI Agent 前端集成
└── utils/               # 工具函数
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build
```

访问 http://localhost:5173

## 功能模块

### 用户认证
- 登录 / 注册 / 忘记密码 / 重置密码
- JWT Token 自动刷新
- 路由权限守卫

### 商城建模器
- 多楼层管理
- 区域绘制（10 种类型）
- 基础设施（12 种模型）
- 漫游模式（WASD 控制）
- 项目持久化

### AI 助手
- Agent 决策流程可视化
- 工具调用状态提示

## 开发规范

- 使用 `<script setup lang="ts">`
- 组件命名：PascalCase
- 文件命名：kebab-case
- 禁止使用 `any`
- engine 层不感知业务概念

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 商家 | merchant | 123456 |
| 用户 | user | 123456 |
