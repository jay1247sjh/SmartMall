# 前端目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端目录结构规范
> 
> 本文档为 **目录结构说明文档（Structure Document）**，用于定义代码组织规范与模块职责。
> 
> 最后更新：2026-01-02

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

商城 3D 建模功能的完整实现。

```
builder/
├── index.ts                 # 模块导出入口
├── geometry/                # 几何计算模块
│   ├── index.ts
│   ├── polygon.ts           # 多边形计算（面积、周长、包含检测）
│   └── overlap.ts           # 重叠检测（SAT 分离轴定理）
├── templates/               # 商城模板
│   ├── index.ts
│   └── mall-templates.ts    # 模板生成器（矩形、L形、U形、T形、圆形）
├── tools/                   # 绘图工具
│   ├── index.ts
│   ├── drawing-tools.ts     # 绘图工具状态机
│   └── background-image.ts  # 背景图片管理
├── types/                   # 类型定义
│   ├── index.ts
│   └── mall-project.ts      # 项目类型（MallProject, Floor, Area）
├── objects/                 # 3D 模型模块
│   ├── index.ts             # 模型导出入口
│   ├── elevator-model.ts    # 电梯 3D 模型
│   ├── escalator-model.ts   # 扶梯 3D 模型
│   ├── stairs-model.ts      # 楼梯 3D 模型
│   ├── service-desk-model.ts # 服务台 3D 模型
│   ├── restroom-model.ts    # 洗手间 3D 模型（男/女分区）
│   ├── furniture-models.ts  # 商场家具模型 ⭐ 新增
│   └── character-model.ts   # 角色模型与控制器 ⭐ 新增
├── rendering/               # 渲染模块 ⭐ 新增
│   ├── index.ts             # 渲染导出入口
│   └── roaming-renderer.ts  # 漫游模式渲染器
├── resources/               # 资源管理模块
│   ├── index.ts             # 资源导出入口
│   └── resource-manager.ts  # 材质/几何体缓存管理器
└── __tests__/               # 属性测试
    ├── polygon.test.ts      # 多边形计算测试
    ├── templates.test.ts    # 模板生成测试
    ├── drawing-tools.test.ts # 绘图工具测试
    ├── background-image.test.ts # 背景图片测试
    └── render.test.ts       # 3D 渲染测试
```

**模块职责：**
- `geometry/` - 纯函数几何计算，无副作用
- `templates/` - 商城模板生成，所有模板居中生成
- `tools/` - 绘图工具状态管理
- `types/` - 建模器专用类型定义
- `objects/` - 3D 模型创建函数
  - 垂直连接：电梯、扶梯、楼梯
  - 设施：服务台、洗手间
  - 家具：长椅、路灯、垃圾桶、花盆、指示牌、喷泉、信息亭
  - 角色：小人模型、角色控制器（WASD移动、碰撞检测）
- `rendering/` - 漫游模式渲染
  - 墙壁、地板、天花板渲染
  - PBR 材质（瓷砖、墙面、天花板纹理）
  - 室内照明（多点光源）
  - 家具自动布置
- `resources/` - 材质和几何体缓存管理，复用 engine 层的 MaterialManager 和 GeometryFactory

**设计约束：**
- 几何计算模块为纯函数，便于属性测试
- 模板生成器返回居中的轮廓坐标
- 绘图工具使用状态机模式管理
- 3D 模型使用共享材质和几何体缓存，减少 GPU 内存占用
- 资源管理器在组件卸载时统一清理资源
- 家具模型材质统一从 resource-manager.ts 获取，确保缓存复用

**furniture-models.ts 包含的模型：**
- `createBenchModel()` - 商场长椅（木板座椅、金属支架、扶手）
- `createLampPostModel()` - 路灯（mall/modern/classic 三种风格）
- `createTrashBinModel()` - 垃圾桶（单桶/分类回收）
- `createPlanterModel()` - 花盆绿植（小树/灌木/花朵）
- `createSignPostModel()` - 指示牌（立式/悬挂/墙面）
- `createFountainModel()` - 中庭喷泉
- `createKioskModel()` - 信息亭/服务台

**character-model.ts 包含：**
- `createCharacterModel()` - 小人角色 3D 模型
- `CharacterController` - 角色控制器类
  - WASD 移动控制
  - 角色旋转（面向移动方向）
  - 碰撞检测
  - 楼层高度管理

**roaming-renderer.ts 包含：**
- `createRoamingWalls()` - 创建商城墙壁（带踢脚线）
- `createRoamingFloor()` - 创建地板（PBR 瓷砖材质）
- `createRoamingCeiling()` - 创建天花板
- `createRoamingLights()` - 创建室内照明
- `createMallFurniture()` - 自动布置商场家具

### 3.6 views/ - 页面视图

页面级 Vue 组件。

```
views/
├── BuilderView.vue          # 建模器页面（旧版）
├── EngineTestView.vue       # 引擎测试页面
├── DomainTestView.vue       # 领域层测试页面
├── LoginView.vue            # 登录页面
├── RegisterView.vue         # 注册页面
├── ForgotPasswordView.vue   # 忘记密码页面
├── ResetPasswordView.vue    # 重置密码页面
├── MallView.vue             # 商城主页/仪表盘
├── Mall3DView.vue           # 3D 商城浏览页面
├── layouts/                 # 布局组件
│   ├── AdminLayout.vue      # 管理员布局
│   ├── MerchantLayout.vue   # 商家布局
│   └── MainLayout.vue       # 主布局
├── admin/                   # 管理员页面
│   ├── DashboardView.vue    # 管理员仪表盘
│   ├── LayoutVersionView.vue # 版本管理
│   ├── MallManageView.vue   # 商城管理
│   ├── MallBuilderView.vue  # 商城建模器 ⭐ 新增
│   └── AreaApprovalView.vue # 区域审批
├── merchant/                # 商家页面
│   ├── DashboardView.vue    # 商家仪表盘
│   ├── StoreConfigView.vue  # 店铺配置
│   └── AreaApplyView.vue    # 区域申请
└── user/                    # 用户页面
    └── ProfileView.vue      # 用户资料
```

**MallBuilderView.vue 功能：**
- Three.js 3D 场景渲染
- 项目创建向导（模板选择）
- 楼层管理面板
- 区域绘制工具栏
- 属性编辑面板
- 历史记录（撤销/重做）
- 项目导出/导入
- 场景说明图例

### 3.7 api/ - API 接口层

后端 API 接口封装。

```
api/
├── index.ts                 # 模块导出入口
├── http.ts                  # HTTP 客户端封装
├── auth.api.ts              # 认证相关 API
├── register.api.ts          # 注册相关 API
└── password.api.ts          # 密码管理 API
```

**register.api.ts 职责：**
- 用户注册
- 检查用户名可用性
- 检查邮箱可用性

**password.api.ts 职责：**
- 忘记密码（发送重置链接）
- 验证重置令牌
- 重置密码
- 修改密码

### 3.8 router/ - 路由配置

Vue Router 路由配置。

```
router/
├── index.ts                 # 路由配置入口
└── guards.ts                # 路由守卫（可选）
```

**路由配置包含：**
- `/login` - 登录页面
- `/register` - 注册页面
- `/forgot-password` - 忘记密码页面
- `/reset-password` - 重置密码页面（支持 token 查询参数）
- `/builder` - 建模器页面（旧版）
- `/engine-test` - 引擎测试页面
- `/domain-test` - 领域层测试页面
- `/mall` - 商城主页/仪表盘
- `/mall-3d` - 3D 商城浏览
- `/admin/*` - 管理员页面（使用 AdminLayout）
  - `/admin/dashboard` - 管理员仪表盘
  - `/admin/mall-builder` - 商城建模器 ⭐ 新增
  - `/admin/mall-manage` - 商城管理
  - `/admin/layout-version` - 版本管理
  - `/admin/area-approval` - 区域审批
- `/merchant/*` - 商家页面（使用 MerchantLayout）
- `/user/*` - 用户页面

### 3.9 components/ - 通用组件

可复用的 Vue 组件。

```
components/
├── layouts/                 # 布局组件
│   └── DashboardLayout.vue  # 仪表盘布局（已弃用，使用 views/layouts/）
└── shared/                  # 共享组件
    ├── StatCard.vue         # 统计卡片
    ├── QuickActionCard.vue  # 快捷操作卡片
    ├── DataTable.vue        # 数据表格
    └── Modal.vue            # 模态框
```

**设计规范：**
- 所有组件遵循 Gemini/Linear 风格
- 深色主题优先（`#0a0a0a` 背景）
- 使用 SVG 图标，禁止 emoji
- 支持毛玻璃效果（backdrop-blur）

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
| `engine/camera/` | ✅ 完成 | 相机控制器（Orbit + Follow） |
| `engine/objects/` | ✅ 完成 | 对象池、几何体工厂 |
| `engine/materials/` | ✅ 完成 | 材质管理器 |
| `engine/effects/` | ✅ 完成 | 高亮效果 |
| `engine/interaction/` | ✅ 完成 | 射线检测、事件发射 |
| `domain/` 类型定义 | ✅ 完成 | 所有领域类型 |
| `domain/` 行为实现 | ✅ 完成 | 导航、高亮、楼层切换、场景查询 |
| `domain/` 事件处理 | ✅ 完成 | 领域事件处理器、事件总线 |
| `domain/` 数据加载 | ✅ 完成 | 数据加载器、数据验证器 |
| `protocol/` | ✅ 完成 | Action/Result 协议 |
| `shared/` | ✅ 完成 | 共享类型 |
| `builder/geometry/` | ✅ 完成 | 多边形计算、重叠检测 |
| `builder/templates/` | ✅ 完成 | 商城模板生成器 |
| `builder/tools/` | ✅ 完成 | 绘图工具、背景图片管理 |
| `builder/types/` | ✅ 完成 | 建模器类型定义 |
| `builder/__tests__/` | ✅ 完成 | 属性测试（89个测试全部通过） |
| `builder/objects/` | ✅ 完成 | 3D 模型（电梯、扶梯、楼梯、服务台、洗手间、家具、角色） |
| `builder/rendering/` | ✅ 完成 | 漫游模式渲染器（墙壁、地板、天花板、照明、家具布置） |
| `builder/resources/` | ✅ 完成 | 资源管理器（材质/几何体缓存，含家具材质） |
| `views/LoginView.vue` | ✅ 完成 | 登录页面 |
| `views/RegisterView.vue` | ✅ 完成 | 注册页面 |
| `views/ForgotPasswordView.vue` | ✅ 完成 | 忘记密码页面 |
| `views/ResetPasswordView.vue` | ✅ 完成 | 重置密码页面 |
| `views/MallView.vue` | ✅ 完成 | 商城主页/仪表盘 |
| `views/Mall3DView.vue` | ✅ 完成 | 3D 商城浏览 |
| `views/layouts/AdminLayout.vue` | ✅ 完成 | 管理员布局 |
| `views/layouts/MerchantLayout.vue` | ✅ 完成 | 商家布局 |
| `views/layouts/MainLayout.vue` | ✅ 完成 | 主布局 |
| `views/admin/MallBuilderView.vue` | ✅ 完成 | 商城建模器（完整功能） |
| `views/admin/*` | ✅ 完成 | 管理员页面（仪表盘、版本管理、商城管理、区域审批） |
| `views/merchant/*` | ✅ 完成 | 商家页面（仪表盘、店铺配置、区域申请） |
| `views/user/ProfileView.vue` | ✅ 完成 | 用户资料页面 |
| `components/shared/*` | ✅ 完成 | 共享组件（StatCard、QuickActionCard、DataTable、Modal） |
| `components/common/CustomSelect.vue` | ✅ 完成 | 自定义下拉选择组件 |
| `api/register.api.ts` | ✅ 完成 | 注册 API |
| `api/password.api.ts` | ✅ 完成 | 密码管理 API |
| `api/admin.api.ts` | ✅ 完成 | 管理员 API |
| `api/merchant.api.ts` | ✅ 完成 | 商家 API |
| `api/user.api.ts` | ✅ 完成 | 用户 API |
| `api/mall-manage.api.ts` | ✅ 完成 | 商城管理 API |
| `router/index.ts` | ✅ 完成 | 路由配置（含所有页面路由） |

### 7.2 待实现模块

| 模块 | 状态 | 说明 |
|------|------|------|
| `orchestrator/` | ⏳ 待开始 | Action 分发、权限校验 |
| `stores/` | ⏳ 待开始 | Pinia 状态管理 |
| `components/scene/` | ⏳ 待开始 | 3D 场景 UI 组件 |
| `components/mall/` | ⏳ 待开始 | 商城信息组件 |
| `components/interaction/` | ⏳ 待开始 | 交互组件（搜索、聊天） |
| `agent/` | ⏳ 待开始 | AI Agent 集成 |

---

## 8. 最近更新

### 2026-01-03 更新

**Builder 资源优化重构：**
- 将 `furniture-models.ts` 中的材质函数迁移到 `resource-manager.ts`
- 新增 6 个家具材质函数（使用 MaterialManager 缓存）：
  - `getFurnitureWoodMaterial()` - 木材材质
  - `getFurnitureMetalMaterial()` - 金属材质
  - `getFurnitureChromeMaterial()` - 铬材质
  - `getFurniturePlasticMaterial(color)` - 塑料材质
  - `getFurnitureLeafMaterial()` - 叶子材质
  - `getFurnitureCeramicMaterial(color)` - 陶瓷材质
- 移除 `furniture-models.ts` 中的本地材质定义
- 所有内联 `new THREE.MeshStandardMaterial()` 改用 `getMaterialManager().getStandardMaterial()`
- 减少 GPU 内存占用，提高材质复用率

**新增模块文档：**
- `builder/objects/furniture-models.ts` - 商场家具模型
- `builder/objects/character-model.ts` - 角色模型与控制器
- `builder/rendering/roaming-renderer.ts` - 漫游模式渲染器

### 2026-01-02 更新

**商城建模器 (Mall Builder) 性能优化与重构：**
- 新增 `builder/objects/` - 3D 模型模块
  - `elevator-model.ts` - 电梯 3D 模型（电梯井、电梯门、指示灯）
  - `escalator-model.ts` - 扶梯 3D 模型（台阶、扶手、玻璃护栏）
  - `stairs-model.ts` - 楼梯 3D 模型（台阶、扶手、柱子）
  - `service-desk-model.ts` - 服务台 3D 模型（柜台、显示器、标识牌）
  - `restroom-model.ts` - 洗手间 3D 模型（隔间、洗手台、镜子）
- 新增 `builder/resources/` - 资源管理模块
  - `resource-manager.ts` - 材质/几何体缓存管理器
  - 复用 engine 层的 MaterialManager 和 GeometryFactory
  - 20+ 种预定义共享材质（墙壁、门、地板、台阶等）
  - 几何体缓存（Box、Cylinder）
  - 统一资源清理函数 `disposeBuilderResources()`

**MallBuilderView.vue 功能增强：**
- 可折叠左侧面板（楼层面板 + 材质面板）
- 场景说明可隐藏
- 第一人称漫游模式（WASD + 鼠标视角）
- 楼层切换时只显示当前楼层内容
- 楼梯必须连接恰好两个相邻楼层
- 垂直连接和设施使用真实 3D 模型渲染
- 区域选择支持 3D 模型（递归查找 areaId）

**商城建模器 (Mall Builder) 完成：**
- 新增 `views/admin/MallBuilderView.vue` - 完整的 3D 建模器页面
- 新增 `builder/` 模块 - 几何计算、模板生成、绘图工具
- 新增 `components/common/CustomSelect.vue` - 自定义下拉选择组件
- 89 个属性测试全部通过

**主要功能：**
- 项目创建向导（5种模板）
- 楼层管理（添加/删除/切换/高亮）
- 区域绘制（矩形/多边形）
- 3D 渲染（Three.js）
- 历史记录（撤销/重做）
- 项目导出/导入

---
