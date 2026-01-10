# Smart Mall - 智能商城导购系统

> 融合 3D 可视化与 AI 智能的下一代商业空间管理平台

## 项目概述

Smart Mall 是一个现代化的商城管理系统，提供 3D 可视化商城建模、智能导购、多角色权限管理等功能。

## 技术栈

### 前端
- **框架**：Vue 3 + TypeScript + Vite
- **UI 框架**：Element Plus
- **样式系统**：SCSS（嵌套语法 + 设计令牌）
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **3D 引擎**：Three.js
- **HTTP 客户端**：Axios

### 后端
- **框架**：Spring Boot 3.x
- **ORM**：MyBatis-Plus
- **数据库**：PostgreSQL 15+
- **缓存**：Redis 6+
- **安全**：Spring Security + JWT

## 项目结构

```
Smart-Mall/
├── apps/
│   ├── frontend/SMART-MALL/     # 前端项目
│   │   ├── src/
│   │   │   ├── api/             # API 接口
│   │   │   ├── assets/
│   │   │   │   └── styles/scss/ # SCSS 样式系统
│   │   │   ├── components/      # 组件
│   │   │   │   ├── auth/        # 认证组件
│   │   │   │   ├── layouts/     # 布局组件
│   │   │   │   └── shared/      # 共享组件
│   │   │   ├── stores/          # Pinia 状态
│   │   │   ├── views/           # 页面视图
│   │   │   └── router/          # 路由配置
│   │   └── package.json
│   │
│   └── backend/SMART-MALL/      # 后端项目
│       ├── src/main/java/com/smartmall/
│       │   ├── application/     # 应用层
│       │   ├── domain/          # 领域层
│       │   ├── infrastructure/  # 基础设施层
│       │   ├── interfaces/      # 接口层
│       │   └── protocol/        # 协议定义
│       └── pom.xml
│
├── infra/                       # 基础设施配置
│   ├── docker-compose.yml       # Docker 编排
│   └── init-db/                 # 数据库初始化脚本
│
└── study/                       # 学习文档
    ├── 01-login/                # 登录功能
    ├── 02-register/             # 注册功能
    ├── 03-password-reset/       # 密码重置
    └── ...
```

## 快速开始

### 环境要求

- Node.js 18+
- Java 17+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 6+

### 启动基础设施

```bash
cd infra
docker-compose up -d
```

### 启动后端

```bash
cd apps/backend/SMART-MALL
./mvnw spring-boot:run
```

### 启动前端

```bash
cd apps/frontend/SMART-MALL
pnpm install
pnpm run dev
```

## 功能模块

### 已完成

- ✅ 用户认证（登录/注册/密码重置）
- ✅ 多角色权限（管理员/商家/用户）
- ✅ 商城建模器（3D 可视化编辑）
- ✅ 项目持久化（保存/加载/删除）
- ✅ 组件化 UI（Element Plus 集成）
- ✅ 漫游模式（第三人称 3D 漫游）
- ✅ 漫游速度控制（慢速/正常/快速）
- ✅ 基础设施放置（长椅、路灯、垃圾桶等 12 种设施）

### 开发中

- 🚧 AI 智能导购
- 🚧 店铺管理
- 🚧 商品管理

## 前端组件

项目采用高度组件化架构：

### 认证组件 (`@/components/auth/`)

| 组件 | 说明 |
|------|------|
| `AuthLayout` | 认证页面统一布局 |
| `AuthFormCard` | 表单卡片容器 |
| `AuthInput` | 带图标、验证状态的输入框 |
| `AuthButton` | 带加载状态的主按钮 |
| `AlertMessage` | 错误/成功/警告提示 |
| `TypewriterCard` | 打字机效果卡片 |
| `SocialLogin` | 第三方登录按钮组 |
| `FeatureList` | 功能特点列表 |

### 商城建模器 (`@/builder/`)

| 模块 | 说明 |
|------|------|
| `materials/` | 材质系统（预设、类型定义） |
| `objects/` | 3D 模型（电梯、扶梯、楼梯、基础设施等） |
| `rendering/` | 渲染相关（楼层、区域、漫游环境） |
| `geometry/` | 几何计算（面积、周长、碰撞检测） |
| `resources/` | 资源管理（材质缓存、内存释放） |

### 基础设施类型

商城建模器支持以下基础设施的手动放置：

| 类型 | 说明 |
|------|------|
| 长椅 | 供顾客休息的座椅 |
| 路灯 | 照明装饰灯 |
| 垃圾桶 | 分类垃圾桶 |
| 花盆/绿植 | 装饰性绿植 |
| 指示牌 | 导向指示牌 |
| 喷泉 | 装饰喷泉 |
| 售货亭 | 小型售货亭/信息亭 |
| ATM机 | 自动取款机 |
| 自动售货机 | 饮料/零食售货机 |
| 信息屏 | 电子信息显示屏 |
| 时钟 | 装饰时钟 |
| 消防栓 | 消防设备 |

## API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/forgot-password | 忘记密码 |
| POST | /api/auth/reset-password | 重置密码 |

### 建模器接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/mall-builder/projects | 获取项目列表 |
| POST | /api/mall-builder/projects | 创建项目 |
| GET | /api/mall-builder/projects/{id} | 获取项目详情 |
| PUT | /api/mall-builder/projects/{id} | 更新项目 |
| DELETE | /api/mall-builder/projects/{id} | 删除项目 |

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 商家 | merchant | 123456 |
| 用户 | user | 123456 |

## 学习资源

项目包含详细的学习文档，采用苏格拉底式教学法：

- [学习路线](study/README.md)
- [登录功能](study/01-login/README.md)
- [注册功能](study/02-register/README.md)
- [密码重置](study/03-password-reset/README.md)

## 许可证

MIT License
