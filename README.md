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
- **框架**：Spring Boot 3.2
- **ORM**：MyBatis-Plus 3.5
- **数据库**：PostgreSQL 15
- **缓存**：Redis 7
- **安全**：Spring Security + JWT

### AI 服务
- **框架**：FastAPI
- **LLM**：Qwen（阿里云百炼）
- **向量数据库**：Milvus 2.3
- **RAG 框架**：LangChain

## 项目结构

```
Smart-Mall/
├── apps/
│   ├── frontend/SMART-MALL/     # Vue 3 前端
│   │   ├── src/
│   │   │   ├── api/             # API 接口封装
│   │   │   ├── builder/         # 商城建模器模块
│   │   │   ├── components/      # 通用组件
│   │   │   ├── domain/          # 领域模型
│   │   │   ├── stores/          # Pinia 状态管理
│   │   │   ├── views/           # 页面视图
│   │   │   └── router/          # 路由配置
│   │   └── package.json
│   │
│   ├── backend/SMART-MALL/      # Spring Boot 后端
│   │   ├── src/main/java/com/smartmall/
│   │   │   ├── application/     # 应用服务层
│   │   │   ├── domain/          # 领域层（实体、枚举）
│   │   │   ├── infrastructure/  # 基础设施层（Mapper、配置）
│   │   │   ├── interfaces/      # 接口层（Controller、DTO）
│   │   │   └── common/          # 公共模块
│   │   └── pom.xml
│   │
│   └── intelligence/            # Python AI 服务（开发中）
│
├── packages/                    # 共享包
│   └── shared-types/            # 跨服务共享类型定义
│       ├── src/                 # TypeScript 版本
│       └── python/              # Python 版本
│
├── infra/                       # Docker 基础设施
│   ├── docker-compose.yml       # 容器编排
│   └── init-db/                 # 数据库初始化脚本
│
├── study/                       # 学习文档（01-23）
├── .prompt/                     # AI 提示词模式配置
└── .kiro/steering/              # Kiro 协作约束
```

## 共享类型包

`packages/shared-types` 包含前端、后端、AI 服务共用的类型定义，确保跨服务类型一致性：

- **枚举**：UserRole, AreaType, StoreStatus, ProductStatus, AreaStatus
- **API 类型**：ApiResponse, PageRequest, PageResponse
- **几何类型**：Point2D, Point3D, Polygon, Rectangle

详见 [packages/shared-types/README.md](packages/shared-types/README.md)

## 快速开始

### 环境要求

- Node.js 18+
- Java 17+
- Docker & Docker Compose
- pnpm（推荐）

### 1. 启动基础设施

```bash
cd infra
docker-compose up -d postgres redis
```

> 如需 AI 功能，还需启动 Milvus：`docker-compose up -d`

### 2. 启动后端

```bash
cd apps/backend/SMART-MALL
./mvnw spring-boot:run
```

后端运行在 http://localhost:8080

### 3. 启动前端

```bash
cd apps/frontend/SMART-MALL
pnpm install
pnpm run dev
```

前端运行在 http://localhost:5173

## 功能模块

### ✅ 已完成

| 模块 | 功能 |
|------|------|
| 用户认证 | 登录、注册、密码重置、JWT 认证 |
| 权限管理 | 管理员、商家、用户三种角色 |
| 商城建模器 | 3D 可视化编辑、多楼层管理、区域绘制 |
| 项目持久化 | 保存、加载、删除项目（PostgreSQL JSONB） |
| 漫游模式 | 第三人称 3D 漫游、速度控制 |
| 基础设施 | 12 种设施模型（长椅、路灯、ATM 等） |
| 区域标签 | 3D 场景中显示区域名称 |
| AI 助手 | Agent 决策流程展示、工具调用提示 |

### 🚧 开发中

- AI 智能导购（RAG 知识库）
- 店铺管理
- 商品管理
- 区域审批流程

## 商城建模器功能

### 区域类型

| 类型 | 说明 | 颜色 |
|------|------|------|
| retail | 零售店铺 | 蓝色 |
| food | 餐饮 | 橙色 |
| service | 服务 | 紫色 |
| anchor | 主力店 | 红色 |
| common | 公共区域 | 灰色 |
| corridor | 走廊 | 浅灰 |
| elevator | 电梯 | 绿色 |
| escalator | 扶梯 | 青色 |
| stairs | 楼梯 | 天蓝 |
| restroom | 洗手间 | 粉色 |

### 基础设施

长椅、路灯、垃圾桶、花盆、指示牌、喷泉、售货亭、ATM、自动售货机、信息屏、时钟、消防栓

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/forgot-password | 忘记密码 |
| POST | /api/auth/reset-password | 重置密码 |

### 商城建模器

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/mall-builder/projects | 项目列表 |
| POST | /api/mall-builder/projects | 创建项目 |
| GET | /api/mall-builder/projects/{id} | 项目详情 |
| PUT | /api/mall-builder/projects/{id} | 更新项目 |
| DELETE | /api/mall-builder/projects/{id} | 删除项目 |

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | 123456 |
| 商家 | merchant | 123456 |
| 用户 | user | 123456 |

## 数据库连接

| 参数 | 值 |
|------|------|
| Host | localhost |
| Port | **5433**（非默认 5432） |
| Database | smartmall |
| Username | smartmall |
| Password | smartmall123 |

JDBC 连接字符串：`jdbc:postgresql://localhost:5433/smartmall`

## 学习资源

项目包含 23 个学习模块，采用苏格拉底式教学法：

- [学习路线](study/README.md)
- 前端模块：01-11, 14, 18-19
- 后端模块：12-13, 15-17
- 业务模块：20-22
- AI 模块：23

## 许可证

MIT License
