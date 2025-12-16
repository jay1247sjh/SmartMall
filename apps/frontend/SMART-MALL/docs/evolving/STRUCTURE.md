# 前端目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端目录结构规范
> 
> 本文档为 **目录结构说明文档（Structure Document）**，用于定义代码组织规范与模块职责。
> 
> 最后更新：2024-12-14

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
SMART-MALL/
├── docs/                    # 项目文档
│   ├── canonical/           # 规范文档（不随开发变化）
│   │   ├── DESIGN.md        # 系统设计文档
│   │   ├── PROTOCOL.md      # 协议规范文档
│   │   └── REQUIREMENTS.md  # 需求规格文档
│   └── evolving/            # 演进文档（随开发更新）
│       ├── CHANGELOG.md     # 变更日志
│       ├── KNOWN_ISSUES.md  # 已知问题
│       ├── STRUCTURE.md     # 目录结构说明（本文档）
│       └── TASK.md          # 任务清单
├── public/                  # 静态资源（不经过构建）
├── src/                     # 源代码主目录
│   ├── agent/               # AI Agent 接入模块
│   ├── api/                 # 后端 API 接口
│   ├── assets/              # 静态资源（经过构建处理）
│   ├── builder/             # 建模器模块
│   ├── components/          # 通用 UI 组件
│   ├── domain/              # 领域场景层
│   ├── engine/              # Three.js 渲染引擎层
│   ├── orchestrator/        # 业务协调层
│   ├── protocol/            # 协议定义（Action/Result）
│   ├── router/              # 路由配置
│   ├── shared/              # 共享类型与工具
│   ├── stores/              # Pinia 状态管理
│   ├── three/               # Three.js 导出层（向后兼容）
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── views/               # 页面级视图组件
│   ├── main.ts              # 应用入口
│   └── SmartMall.vue        # 根组件
├── index.html               # HTML 入口
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 项目依赖
```

---

## 3. 核心目录详解

### 3.1 engine/ - 渲染引擎层

Three.js 渲染引擎的封装层，**不包含任何业务逻辑**。

```
engine/
├── index.ts                 # 模块导出入口
├── ThreeEngine.ts           # 核心引擎类
├── camera/                  # 相机控制
│   ├── index.ts
│   ├── CameraController.ts  # 第三人称跟随控制器
│   └── OrbitController.ts   # 轨道控制器
├── effects/                 # 视觉效果
│   ├── index.ts
│   └── HighlightEffect.ts   # 高亮效果管理器
├── grid/                    # 网格辅助（待实现）
├── interaction/             # 交互检测
│   ├── index.ts
│   ├── RaycasterManager.ts  # 射线检测管理器
│   └── SceneEventEmitter.ts # 场景事件发射器
├── materials/               # 材质管理
│   ├── index.ts
│   └── MaterialManager.ts   # 材质管理器
└── objects/                 # 对象管理
    ├── index.ts
    ├── GeometryFactory.ts   # 几何体工厂
    └── ObjectPool.ts        # 对象池
```

**设计约束：**
- 不认识"商城""店铺""用户"等业务概念
- 只暴露通用的 3D 操作接口
- 可被替换为其他渲染引擎

### 3.2 domain/ - 领域场景层

管理商城语义实体，提供业务语义一致的行为接口。

```
domain/
├── index.ts                 # 模块导出入口
├── mall/                    # 商城领域
│   ├── index.ts
│   ├── mall.enums.ts        # 商城枚举（AreaType, AreaStatus 等）
│   └── mall.types.ts        # 商城类型（Mall, Floor, Area, Store 等）
├── permission/              # 权限领域
│   ├── index.ts
│   ├── permission.enums.ts  # 权限枚举（Capability）
│   └── permission.types.ts  # 权限类型（Context, PermissionResult 等）
├── scene/                   # 场景领域
│   ├── index.ts
│   ├── scene.enums.ts       # 场景枚举（SemanticType）
│   ├── scene.model.ts       # 语义对象模型
│   ├── scene.types.ts       # 场景类型（Vector3D, BoundingBox 等）
│   └── scene.utils.ts       # 几何计算工具函数
└── user/                    # 用户领域
    ├── index.ts
    ├── user.enums.ts        # 用户枚举（Role, OnlineStatus）
    └── user.types.ts        # 用户类型（User, Session, OnlineUser）
```

**设计约束：**
- 不关心用户是谁
- 不关心 AI 来源
- 只保证"语义正确性"
- 将语义行为映射为 Three Core 操作

### 3.3 protocol/ - 协议定义

定义系统内部的通信协议。

```
protocol/
├── index.ts                 # 模块导出入口
├── action.enums.ts          # Action 类型枚举
├── action.protocol.ts       # Action 协议定义
├── result.enums.ts          # 错误码枚举
└── result.protocol.ts       # 领域结果协议
```

### 3.4 shared/ - 共享模块

跨层共享的类型和工具。

```
shared/
├── index.ts                 # 模块导出入口
├── system/                  # 系统级定义
│   ├── index.ts
│   └── system.enums.ts      # 系统枚举（SystemMode, TemporalState）
└── types/                   # 通用类型
    ├── index.ts
    └── utils.ts             # 工具类型（Nullable, Optional 等）
```

### 3.5 builder/ - 建模器模块

商家建模功能的实现。

```
builder/
├── BuilderEngine.ts         # 建模器引擎
├── export/                  # 导出功能
├── gizmo/                   # 变换控制器
├── objects/                 # 建模对象
└── tools/                   # 建模工具
```

### 3.6 views/ - 页面视图

页面级 Vue 组件。

```
views/
├── BuilderView.vue          # 建模器页面
└── EngineTestView.vue       # 引擎测试页面
```

---

## 4. 分层架构映射

```
┌─────────────────────────────────────────────────────────────┐
│                    UI 层 (Vue Components)                    │
│                 views/ + components/                         │
├─────────────────────────────────────────────────────────────┤
│                  业务协调层 (Orchestrator)                    │
│                      orchestrator/                           │
├─────────────────────────────────────────────────────────────┤
│                  领域场景层 (Domain Scene)                    │
│                        domain/                               │
├─────────────────────────────────────────────────────────────┤
│                  渲染引擎层 (Three Core)                      │
│                        engine/                               │
└─────────────────────────────────────────────────────────────┘
```

**依赖规则：**
- 上层可以依赖下层
- 下层不能依赖上层
- 同层之间通过协议通信

---

## 5. 模块导入别名

在 `vite.config.ts` 中配置的路径别名：

| 别名 | 路径 | 用途 |
|------|------|------|
| `@/` | `src/` | 通用导入 |
| `@engine/` | `src/engine/` | 渲染引擎层 |
| `@domain/` | `src/domain/` | 领域场景层 |
| `@orchestrator/` | `src/orchestrator/` | 业务协调层 |
| `@protocol/` | `src/protocol/` | 协议定义 |
| `@shared/` | `src/shared/` | 共享模块 |
| `@stores/` | `src/stores/` | 状态管理 |
| `@builder/` | `src/builder/` | 建模器模块 |

---

## 6. 文件命名规范

### 6.1 通用规范

- **目录名**：小写，多词用连字符（kebab-case）
- **组件文件**：大驼峰（PascalCase），如 `StoreInfoPanel.vue`
- **类文件**：大驼峰（PascalCase），如 `ThreeEngine.ts`
- **类型文件**：小写 + 后缀，如 `mall.types.ts`
- **枚举文件**：小写 + 后缀，如 `mall.enums.ts`
- **工具文件**：小写 + 后缀，如 `scene.utils.ts`
- **索引文件**：统一使用 `index.ts`

### 6.2 后缀约定

| 后缀 | 用途 | 示例 |
|------|------|------|
| `.types.ts` | 类型定义 | `mall.types.ts` |
| `.enums.ts` | 枚举定义 | `mall.enums.ts` |
| `.utils.ts` | 工具函数 | `scene.utils.ts` |
| `.model.ts` | 数据模型 | `scene.model.ts` |
| `.protocol.ts` | 协议定义 | `action.protocol.ts` |
| `.test.ts` | 测试文件 | `ThreeEngine.test.ts` |

---

## 7. 当前实现状态

### 7.1 已完成模块

| 模块 | 状态 | 说明 |
|------|------|------|
| `engine/ThreeEngine.ts` | ✅ 完成 | 核心引擎类 |
| `engine/camera/` | ✅ 完成 | 相机控制器 |
| `engine/objects/` | ✅ 完成 | 对象池、几何体工厂 |
| `engine/materials/` | ✅ 完成 | 材质管理器 |
| `engine/effects/` | ✅ 完成 | 高亮效果 |
| `engine/interaction/` | ✅ 完成 | 射线检测、事件发射 |
| `domain/` 类型定义 | ✅ 完成 | 所有领域类型 |
| `protocol/` | ✅ 完成 | Action/Result 协议 |
| `shared/` | ✅ 完成 | 共享类型 |

### 7.2 待实现模块

| 模块 | 状态 | 说明 |
|------|------|------|
| `domain/` 行为实现 | ⏳ 待开始 | 导航、高亮、楼层切换 |
| `orchestrator/` | ⏳ 待开始 | Action 分发、权限校验 |
| `stores/` | ⏳ 待开始 | Pinia 状态管理 |
| `components/` | ⏳ 待开始 | UI 组件 |
| `agent/` | ⏳ 待开始 | AI Agent 集成 |

---
