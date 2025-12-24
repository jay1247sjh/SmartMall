# 变更日志（CHANGELOG.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端变更日志
> 
> 本文档为 **变更日志（Changelog）**，用于记录版本变更历史，遵循 Keep a Changelog 格式规范。
> 
> 最后更新：2024-12-20

---

## [Unreleased] - 2024-12-20

### Added - 新增功能

#### P0. 项目基础设施

**0.1 依赖安装与配置**
- ✅ 安装核心运行时依赖（three、pinia、vue-router、axios）
- ✅ 安装开发依赖（@types/three、vitest、fast-check、@vue/test-utils）
- ✅ 配置 TypeScript strict 模式
- ✅ 配置 Vite 路径别名（@/、@engine/、@domain/ 等）
- ✅ 配置 ESLint 代码规范（@antfu/eslint-config）
- ✅ 配置 Prettier 代码格式化

**0.2 目录结构创建**
- ✅ 创建核心目录结构（types/、engine/、domain/、orchestrator/ 等）
- ✅ 创建各层入口文件（index.ts）

---

#### P1. 类型系统与数据模型

**1.1 基础类型定义**
- ✅ 创建场景领域类型 (`src/domain/scene/`)
  - scene.types.ts: Vector3D、BoundingBox、Transform
  - scene.enums.ts: SemanticType
  - scene.utils.ts: 几何计算函数
- ✅ 创建领域枚举类型
  - mall.enums.ts: AreaType、AreaStatus、PermissionRequestStatus
  - user.enums.ts: Role、OnlineStatus
  - permission.enums.ts: Capability
  - action.enums.ts: ActionType、ActionSource
  - result.enums.ts: ErrorCode
  - system.enums.ts: SystemMode、TemporalState
- ✅ 创建通用工具类型 (Nullable、Optional、DeepPartial)

**1.2 业务实体类型**
- ✅ 创建商城实体类型 (Mall、Floor、Area、Store、Product)
- ✅ 创建语义对象类型 (SemanticObject)
- ✅ 创建用户与会话类型 (User、Session、OnlineUser)

**1.3 行为与权限类型**
- ✅ 创建 Action 协议类型 (Action、ActionPayload)
- ✅ 创建权限类型 (Context、PermissionResult)
- ✅ 创建领域结果类型 (DomainResult、DomainError)

**1.4 类型导出与验证**
- ✅ 创建各领域索引文件

---

#### P2. 渲染引擎层 (Three Core)

**2.1 核心引擎类**
- ✅ 实现 `ThreeEngine` 核心类 (`src/engine/ThreeEngine.ts`)
  - Scene、Camera、Renderer 完整初始化
  - 渲染循环控制（start/stop）
  - 按需渲染策略（needsRender 标志位 + requestRender 方法）
  - 窗口 resize 自适应处理
  - 完整的资源释放机制（dispose 方法）
  - 支持双相机模式切换（orbit/follow）
  - 每帧回调注册机制（onRender）

**2.2 相机控制**
- ✅ 实现 `OrbitController` 轨道控制器 (`src/engine/camera/OrbitController.ts`)
  - 相机初始化（PerspectiveCamera）
  - 轨道视角控制（鼠标拖拽旋转、滚轮缩放）
  - 相机约束（边界限制、缩放范围限制）
  - 阻尼惯性效果
- ✅ 实现 `CameraController` 第三人称跟随控制器

**2.3 对象管理**
- ✅ 实现基础对象管理功能（ThreeEngine 中）
  - addBox 方法：添加方块到场景
  - addGridHelper 方法：添加地板网格辅助线
  - 对象阴影支持（castShadow/receiveShadow）
- ✅ 实现 `ObjectPool` 对象池 (`src/engine/objects/ObjectPool.ts`)
  - 泛型设计：支持任意 THREE.Object3D 子类
  - 对象复用机制（acquire/release）
  - 容量限制（maxSize）
  - 预创建支持（initialSize）
- ✅ 实现 `GeometryFactory` 几何体工厂 (`src/engine/objects/GeometryFactory.ts`)
  - 基础几何体创建（Box、Plane）
  - 几何体缓存与复用
  - 资源清理（dispose 释放 GPU 资源）

**2.4 材质与效果**
- ✅ 实现 `MaterialManager` 材质管理器 (`src/engine/materials/MaterialManager.ts`)
  - 标准材质创建（MeshStandardMaterial）
  - 基础材质创建（MeshBasicMaterial）
  - 材质缓存机制（相同配置复用实例）
  - 缓存键生成（配置对象转字符串）
  - 资源清理（dispose 释放 GPU 资源）
  - 缓存统计（getCacheSize）
- ✅ 实现 `HighlightEffect` 高亮效果管理器 (`src/engine/effects/HighlightEffect.ts`)
  - 悬停高亮（setHover/clearHover）- 灰色发光效果
  - 选中高亮（setSelected/clearSelected）- 橙黄色发光效果
  - 原始材质状态保存与恢复
  - 使用 emissive 自发光属性实现高亮
  - 可配置的高亮颜色和强度

**2.5 交互检测**
- ✅ 实现 `RaycasterManager` 射线检测管理器 (`src/engine/interaction/RaycasterManager.ts`)
  - 射线检测核心功能
  - 鼠标点击检测
  - 鼠标悬停检测
- ✅ 实现 `SceneEventEmitter` 事件抽象层 (`src/engine/interaction/SceneEventEmitter.ts`)
  - 发布-订阅模式（on/off 方法）
  - 点击事件处理（handleClick）
  - 悬停事件处理（handleMouseMove）
  - 悬停状态变化检测（hover/hoverEnd）
  - 将 Three.js 底层事件转换为语义化场景事件

**2.6 检查点**
- ✅ 创建 `EngineTestView.vue` 集成测试页面
  - 访问 `/engine-test` 验证渲染引擎功能
  - 测试场景渲染、相机控制、交互检测

---

#### P3. 领域场景层 (Domain Layer) - 2024-12-20

**3.1 语义对象管理**
- ✅ 实现 `SemanticObjectRegistry` 语义对象注册表 (`src/domain/registry/SemanticObjectRegistry.ts`)
  - 语义对象注册/注销（register/unregister）
  - 三种索引实现 O(1) 快速查询：
    - `objectsById`: 按语义 ID 查询
    - `idsByType`: 按类型查询所有对象
    - `idByBusinessId`: 按业务 ID 查询
  - 保证 businessId 唯一性
  - 完整的清理机制（clear）

- ✅ 实现 `SemanticObjectFactory` 语义对象工厂 (`src/domain/factory/SemanticObjectFactory.ts`)
  - `createFromStore()`: 从店铺业务数据创建语义对象
  - `createFromFloor()`: 从楼层业务数据创建语义对象
  - `createFromArea()`: 从区域业务数据创建语义对象
  - 自动计算 BoundingBox
  - 自动注册到 Registry

- ✅ 实现 `MeshRegistry` Mesh 注册表 (`src/domain/registry/MeshRegistry.ts`)
  - 语义对象与 Three.js Mesh 的双向映射
  - `bind()`: 绑定语义对象与 Mesh
  - `unbind()`: 解除绑定
  - `getMesh()`: 通过语义 ID 获取 Mesh（用于高亮、隐藏）
  - `getSemanticId()`: 通过 Mesh 获取语义 ID（用于点击检测）
  - 在 Mesh.userData 中存储 semanticId 便于射线检测

**3.2 商城实体管理**
- ✅ 实现 `StoreManager` 店铺管理器 (`src/domain/mall/StoreManager.ts`)
  - 店铺注册：`addStore()` / `removeStore()`
  - 多种查询：`getStoreById()` / `getStoreByBusinessId()` / `getStoresByArea()` / `getAllStores()`
  - 状态管理：`selectStore()` / `deselectStore()` / `highlightStore()` / `clearHighlight()`
  - 状态检查：`isSelected()` / `isHighlighted()` / `getSelectedStore()` / `getHighlightedStore()`

- ✅ 实现 `FloorManager` 楼层管理器 (`src/domain/mall/FloorManager.ts`)
  - 楼层注册：`addFloor()` / `removeFloor()`
  - 多种查询：`getFloorById()` / `getFloorByBusinessId()` / `getFloorByLevel()` / `getAllFloors()`
  - 可见性控制：`showFloor()` / `hideFloor()` / `setFloorVisibility()` / `isFloorVisible()`
  - 当前楼层：`setCurrentFloor()` / `getCurrentFloor()` / `isCurrentFloor()`

- ✅ 实现 `MallManager` 商城管理器 (`src/domain/mall/MallManager.ts`)
  - 顶层管理器，协调 FloorManager 和 StoreManager
  - `loadMall()`: 递归加载商城 → 楼层 → 区域 → 店铺层级数据
  - `getFloorManager()` / `getStoreManager()`: 获取子管理器
  - `getMall()` / `isMallLoaded()`: 商城状态查询
  - `clear()`: 清空所有数据
  - `getStats()`: 获取统计信息

---

### Technical Details - 技术细节

**架构设计**
- 采用分层架构，渲染引擎层不包含业务逻辑
- 支持相机模式动态切换（orbit 建模模式 / follow 运行时模式）
- 实现按需渲染优化，静止时暂停渲染节省性能
- 完整的资源生命周期管理，防止内存泄漏

**性能优化**
- 按需渲染策略：只在需要时渲染帧
- 像素比率限制：最大 2x，平衡清晰度和性能
- 阴影优化：使用 PCFSoftShadowMap 柔和阴影
- 几何体/材质缓存复用
- 对象池减少 GC 压力

**代码质量**
- 完整的 TypeScript 类型定义
- 详细的代码注释和文档
- 清晰的职责分离

---

### Progress - 进度统计

**总体进度**: P0-P2 基本完成，P3 进行中 (33%)

| 阶段 | 完成度 | 状态 |
|------|--------|------|
| P0 项目基础设施 | 10/12 | 基本完成 (83%) |
| P1 类型系统 | 11/12 | 基本完成 (92%) |
| P2 渲染引擎层 | 14/16 | 基本完成 (87.5%) |
| P3 领域场景层 | 8/18 | 进行中 (44%) |
| P4 业务协调层 | 0/14 | 未开始 |

**3.3 领域行为实现**
- ✅ 实现 `HighlightBehavior` 高亮行为 (`src/domain/behaviors/HighlightBehavior.ts`)
  - 连接语义层（StoreManager）和渲染层（HighlightEffect）
  - `highlightStore(semanticId)`: 悬停高亮
  - `selectStore(semanticId)`: 选中高亮
  - `clearHighlight()` / `clearSelection()`: 清除高亮
  - 通过 MeshRegistry 获取 Mesh，委托给 HighlightEffect

- ✅ 实现 `NavigationBehavior` 导航行为 (`src/domain/behaviors/NavigationBehavior.ts`)
  - 通过语义对象 ID 导航到店铺/区域
  - `navigateToStore(semanticId, options)`: 导航到店铺
  - `navigateToArea(semanticId, options)`: 导航到区域（更远视角）
  - 支持配置：动画时长、相机距离、俯视角度
  - 使用 easeOutCubic 缓动函数实现平滑动画

---

**P3 领域场景层详细进度** (8/18 任务, 44%):
- ✅ 3.1.1 SemanticObjectRegistry 语义对象注册表
- ✅ 3.1.2 SemanticObjectFactory 语义对象工厂
- ✅ 3.1.3 MeshRegistry Mesh 注册表
- ✅ 3.2.1 MallManager 商城管理器
- ✅ 3.2.2 FloorManager 楼层管理器
- ✅ 3.2.3 StoreManager 店铺管理器
- ✅ 3.3.1 NavigationBehavior 导航行为
- ✅ 3.3.2 HighlightBehavior 高亮行为
- ⏳ 3.3.x 领域行为实现（FloorSwitchBehavior 待完成）
- ⏳ 3.4.x 领域事件处理（待开始）
- ⏳ 3.5.x 数据加载与验证（待开始）

**待完成任务**:
- ⏳ 0.3.x 测试环境配置（暂时跳过）
- ⏳ 1.4.2 类型守卫函数
- ⏳ 2.7.x 测试任务（可选）
- ⏳ 3.3.3 FloorSwitchBehavior 楼层切换行为
- ⏳ 3.3.4 SceneQueryBehavior 场景查询行为
- ⏳ 3.4.x 领域事件处理
- ⏳ 3.5.x 数据加载与验证

---

### Next Steps - 下一步计划

1. **P3.3 领域行为实现** - NavigationBehavior、HighlightBehavior、FloorSwitchBehavior
2. **P3.4 领域事件处理** - DomainEventHandler
3. **P3.5 数据加载与验证** - MallDataLoader、MallDataValidator
4. **P4 业务协调层** - ActionDispatcher、PermissionChecker

---
