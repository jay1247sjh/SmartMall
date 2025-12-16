# 前端实现任务清单（TASK.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端实现任务清单
> 
> 本文档为 **实现任务清单（Implementation Task List）**，用于指导开发进度与任务追踪。

---

## 任务状态说明

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[*]` 可选任务（测试、文档等）

---

## 阶段概览

| 阶段 | 名称 | 任务数 | 预估时间 | 优先级 | 状态 |
|------|------|--------|----------|--------|------|
| P0 | 项目基础设施 | 12 | 2-4h | 最高 | 基本完成 (83%) |
| P1 | 类型系统与数据模型 | 12 | 3-4h | 最高 | 基本完成 (92%) |
| P2 | 渲染引擎层 (Three Core) | 16 | 4-6h | 最高 | 基本完成 (87.5%) |
| P3 | 领域场景层 (Domain Layer) | 18 | 5-7h | 高 | 未开始 |
| P4 | 业务协调层 (Orchestrator) | 14 | 4-5h | 高 | 未开始 |
| P5 | 状态管理层 (Pinia Stores) | 10 | 3-4h | 高 | 未开始 |
| P6 | UI 层 (Vue Components) | 20 | 6-8h | 中 | 未开始 |
| P7 | AI Agent 模块 | 12 | 3-4h | 中 | 未开始 |
| P8 | 路由与权限系统 | 12 | 4-5h | 中 | 未开始 |
| P9 | 集成与优化 | 12 | 3-4h | 低 | 未开始 |
| P10 | 区域建模权限模块 | 10 | 4-5h | 高 | 未开始 |

**总计**: 约 148 个任务，预估 45-56 小时

---

## P0. 项目基础设施

> 目标：搭建项目骨架，配置开发环境，安装核心依赖

### 0.1 依赖安装与配置

- [x] 0.1.1 安装核心运行时依赖
  - three、pinia、vue-router、axios
  - _Requirements: 技术栈要求_

- [x] 0.1.2 安装开发依赖
  - @types/three、vitest、fast-check、@vue/test-utils
  - _Requirements: 测试策略_

- [x] 0.1.3 配置 TypeScript strict 模式
  - 更新 tsconfig.json，启用 strict、noImplicitAny
  - _Requirements: 13.2 TypeScript 规范_

- [x] 0.1.4 配置 Vite 路径别名
  - 配置 @/、@three/、@domain/、@orchestrator/ 等别名
  - _Requirements: STRUCTURE.md_

- [x] 0.1.5 配置 ESLint 代码规范
  - 安装 ESLint + Vue/TypeScript 插件
  - 配置 eslint.config.js，使用 @antfu/eslint-config
  - _Requirements: 工程化规范_

- [x] 0.1.6 配置 Prettier 代码格式化
  - 安装 Prettier
  - 配置 .prettierrc，统一代码风格
  - 配置 .prettierignore
  - _Requirements: 工程化规范_

### 0.2 目录结构创建

- [x] 0.2.1 创建核心目录结构
  ```
  src/
  ├── types/           # 类型定义
  ├── three/           # 渲染引擎层
  ├── domain/          # 领域场景层
  ├── orchestrator/    # 业务协调层
  ├── stores/          # Pinia 状态管理
  ├── agent/           # AI Agent 模块
  ├── router/          # 路由配置
  ├── components/      # 通用组件
  ├── views/           # 页面视图
  ├── api/             # 后端接口
  └── utils/           # 工具函数
  ```
  - _Requirements: STRUCTURE.md_

- [x] 0.2.2 创建各层入口文件（index.ts）
  - 每个目录创建 index.ts 作为模块导出入口
  - _Requirements: 工程化规范_

### 0.3 测试环境配置 ⏸️ (暂时跳过)

- [ ] 0.3.1 配置 Vitest 
  - 创建 vitest.config.ts，配置测试环境
  - 配置 @vue/test-utils 集成
  - _Requirements: 16. 测试策略_

- [ ] 0.3.2 配置 fast-check 属性测试
  - 创建测试工具函数和通用生成器
  - 配置 numRuns: 100 作为默认迭代次数
  - _Requirements: 16.2 属性测试框架_

### 0.4 基础设施检查点

- [ ] 0.4.0 Checkpoint - 确保基础设施完成
  - 确保项目可以正常启动
  - 确保 TypeScript 编译无错误
  - 确保测试框架配置正确
  - _Requirements: 工程化规范_

---

## P1. 类型系统与数据模型

> 目标：定义系统核心类型，建立类型安全的基础
> 
> **约束**: 所有类型必须在 src/types/ 目录下定义

### 1.1 基础类型定义

- [x] 1.1.1 创建场景领域类型 (src/domain/scene/)
  - scene.types.ts: Vector3D、BoundingBox、Transform
  - scene.enums.ts: SemanticType
  - scene.utils.ts: 几何计算函数
  - _Requirements: 14.1.2 语义对象模型_

- [x] 1.1.2 创建领域枚举类型
  - src/domain/mall/mall.enums.ts: AreaType、AreaStatus、PermissionRequestStatus 等
  - src/domain/user/user.enums.ts: Role、OnlineStatus
  - src/domain/permission/permission.enums.ts: Capability
  - src/protocol/action.enums.ts: ActionType、ActionSource
  - src/protocol/result.enums.ts: ErrorCode
  - src/shared/system/system.enums.ts: SystemMode、TemporalState
  - _Requirements: 14.1.2, 14.1.3_

- [x] 1.1.3 创建通用工具类型 (src/shared/types/utils.ts)
  - Nullable、Optional、DeepPartial
  - _Requirements: TypeScript 规范_

### 1.2 业务实体类型

- [x] 1.2.1 创建商城实体类型 (src/domain/mall/mall.types.ts)
  - Mall、Floor、Area、Store、Product 接口
  - _Requirements: 14.1.1 商城结构模型_

- [x] 1.2.2 创建语义对象类型 (src/domain/scene/scene.model.ts)
  - SemanticObject 接口及其子类型
  - _Requirements: 14.1.2, Requirements 2_

- [x] 1.2.3 创建用户与会话类型 (src/domain/user/user.types.ts)
  - User、Session、OnlineUser 接口
  - _Requirements: 14.1.5_

### 1.3 行为与权限类型

- [x] 1.3.1 创建 Action 协议类型 (src/protocol/action.protocol.ts)
  - Action 接口、ActionPayload 类型映射
  - _Requirements: 14.1.3, Requirements 4_

- [x] 1.3.2 创建权限类型 (src/domain/permission/permission.types.ts)
  - Context、PermissionResult、RCAC 相关类型
  - _Requirements: 14.1.3, Requirements 6_

- [x] 1.3.3 创建领域结果类型 (src/protocol/result.protocol.ts)
  - DomainResult<T>、DomainError 接口
  - _Requirements: 14.1.4, Requirements 16_

### 1.4 类型导出与验证

- [x] 1.4.1 创建各领域索引文件
  - domain/scene/index.ts
  - domain/mall/index.ts
  - domain/user/index.ts
  - domain/permission/index.ts
  - protocol/index.ts
  - shared/index.ts
  - types/index.ts (向后兼容)
  - _Requirements: 工程化规范_

- [ ] 1.4.2 编写类型守卫函数 (src/utils/guards.ts)
  - isAction、isSemanticObject、isValidRole、isValidAreaStatus 等
  - _Requirements: TypeScript 规范_

### 1.5 类型系统检查点

- [x] 1.5.0 Checkpoint - 确保类型系统完整
  - ✅ 确保所有类型定义完整
  - ✅ 确保 TypeScript 编译无错误
  - _Requirements: 工程化规范_

---

## P2. 渲染引擎层 (Three Core)

> 目标：封装 Three.js，提供纯渲染能力，不包含业务逻辑
> 
> **约束**: 
> - 不认识"商城""店铺"等业务概念
> - 只暴露通用的 3D 操作接口
> - 可被替换为其他渲染引擎

### 2.1 核心引擎类

- [x] 2.1.1 创建 ThreeEngine 类 (src/engine/ThreeEngine.ts)
  - Scene、Camera、Renderer 初始化
  - 渲染循环控制（start/stop/pause）
  - 窗口 resize 处理
  - _Requirements: 1.1, 1.2, 1.3_
  - **已完成**: 实现了完整的 ThreeEngine 核心类

- [x] 2.1.2 实现按需渲染策略
  - needsRender 标志位
  - requestRender() 方法
  - 静止时暂停渲染
  - _Requirements: 14.1, 14.2, Property 16_
  - **已完成**: 实现了按需渲染优化

- [x] 2.1.3 实现资源释放机制
  - dispose() 方法
  - Geometry、Material、Texture 清理
  - 事件监听器注销
  - _Requirements: 1.5, Property 15_
  - **已完成**: 实现了完整的资源清理机制

### 2.2 相机控制

- [x] 2.2.1 创建 CameraController 类 (src/three/camera/CameraController.ts)
  - 相机初始化（PerspectiveCamera）
  - 视角控制（OrbitControls 或自定义）
  - _Requirements: 12.3, 12.4_
  - **已完成**: 实现了 OrbitController 类

- [x] 2.2.2 实现相机动画
  - animateTo(position, target, duration) 方法
  - 平滑过渡（使用 TWEEN 或自定义插值）
  - _Requirements: 12.2_
  - **已完成**: OrbitController 中实现了相机动画

- [x] 2.2.3 实现相机约束
  - 边界限制
  - 缩放范围限制
  - _Requirements: 性能优化_
  - **已完成**: OrbitController 中实现了约束

### 2.3 对象管理

- [x] 2.3.1 创建 ObjectManager 类 (src/engine/ThreeEngine.ts)
  - 对象添加/移除/查询
  - 按 userData 查询对象
  - 对象可见性控制
  - _Requirements: 2.1, 2.3_
  - **已完成**: ThreeEngine 中实现了 addBox 等对象管理方法

- [x] 2.3.2 实现对象池 (src/engine/objects/ObjectPool.ts)
  - 对象复用机制（acquire/release）
  - 减少 GC 压力
  - 容量限制（maxSize）
  - 预创建支持（initialSize）
  - _Requirements: 14.5, 10.3.3_
  - **已完成**: 实现了完整的 ObjectPool 泛型类

- [x] 2.3.3 创建几何体工厂 (src/engine/objects/GeometryFactory.ts)
  - 基础几何体创建（Box、Plane）
  - 几何体缓存与复用
  - 资源清理（dispose 释放 GPU 资源）
  - _Requirements: 14.5_
  - **已完成**: 实现了完整的 GeometryFactory 类

### 2.4 材质与效果

- [x] 2.4.1 创建 MaterialManager 类 (src/engine/materials/MaterialManager.ts)
  - 材质创建与缓存（标准材质、基础材质）
  - 材质复用（相同配置共享实例）
  - 资源清理（dispose 释放 GPU 资源）
  - _Requirements: 14.5_
  - **已完成**: 实现了完整的 MaterialManager 类

- [x] 2.4.2 实现高亮效果 (src/engine/effects/HighlightEffect.ts)
  - 发光效果（使用 emissive 自发光属性）
  - 悬停高亮（灰色）和选中高亮（橙黄色）
  - 状态管理和资源清理
  - _Requirements: 12.4, 12.5_
  - **已完成**: 实现了完整的 HighlightEffect 类

### 2.5 交互检测

- [x] 2.5.1 创建 RaycasterManager 类 (src/engine/interaction/RaycasterManager.ts)
  - 射线检测
  - 点击/悬停检测
  - _Requirements: 11.1, 11.2_
  - **已完成**: 实现了 RaycasterManager 类

- [x] 2.5.2 实现事件抽象层 (src/engine/interaction/SceneEventEmitter.ts)
  - 将 Three.js 事件转换为语义事件
  - scene.click、scene.hover 等
  - _Requirements: 11.5, 11.6_
  - **已完成**: 实现了完整的 SceneEventEmitter 类（点击和悬停事件）

### 2.6 Three Core 检查点

- [x] 2.6.0 Checkpoint - 确保渲染引擎层完成
  - 确保 Three.js 场景可以正常渲染
  - 确保相机控制正常
  - 确保资源释放正确
  - _Requirements: 需求 1_
  - **已完成**: 创建了 EngineTestView.vue 集成测试页面，访问 /engine-test 验证

### 2.7 Three Core 测试

- [*] 2.7.1 编写 ThreeEngine 单元测试
  - 初始化/销毁测试
  - 渲染循环测试
  - _Requirements: 16.4_

- [*] 2.7.2 编写属性测试 - Property 15: 资源释放完整性
  - **Property 15: 资源释放完整性**
  - *对于任意* 场景卸载操作，所有 Three.js 资源都应被正确释放
  - **验证需求: Requirements 1**

- [*] 2.7.3 编写属性测试 - Property 17: 多次进入退出稳定性
  - **Property 17: 多次进入退出稳定性**
  - *对于任意* 连续的进入和退出 3D 场景操作，系统应保持稳定
  - **验证需求: Requirements 1**

- [*] 2.7.4 编写属性测试 - Property 16: 渲染循环可控性
  - **Property 16: 渲染循环可控性**
  - *对于任意* 场景静止状态，渲染循环应被暂停
  - **验证需求: Requirements 14**

---

## P3. 领域场景层 (Domain Layer)

> 目标：管理商城语义实体，提供业务语义一致的行为接口
> 
> **约束**:
> - 不关心用户是谁
> - 不关心 AI 来源
> - 只保证"语义正确性"
> - 将语义行为映射为 Three Core 操作

### 3.1 语义对象管理

- [ ] 3.1.1 创建 SemanticObjectRegistry 类 (src/domain/registry/SemanticObjectRegistry.ts)
  - 语义对象注册/注销
  - 按 id、semanticType、businessId 查询
  - 保证 businessId 唯一性
  - _Requirements: 2.1, 2.3, 2.5, Property 10_

- [ ] 3.1.2 创建语义对象工厂 (src/domain/factory/SemanticObjectFactory.ts)
  - 从配置数据创建语义对象
  - 绑定 Three.js Mesh 与语义信息
  - _Requirements: 2.2, 9.5_

- [ ] 3.1.3 实现语义对象与 Mesh 的双向映射
  - SemanticObject → Mesh
  - Mesh.userData → SemanticObject
  - _Requirements: Property 20_

### 3.2 商城实体管理

- [ ] 3.2.1 创建 MallManager 类 (src/domain/mall/MallManager.ts)
  - 商城数据加载与初始化
  - 楼层/区域/店铺层级管理
  - _Requirements: 9.1, 9.2_

- [ ] 3.2.2 创建 FloorManager 类 (src/domain/mall/FloorManager.ts)
  - 楼层对象管理
  - 楼层可见性控制
  - _Requirements: 13.1, 13.2_

- [ ] 3.2.3 创建 StoreManager 类 (src/domain/mall/StoreManager.ts)
  - 店铺对象管理
  - 店铺状态（高亮、选中）
  - _Requirements: 12.3, 12.4_

### 3.3 领域行为实现

- [ ] 3.3.1 实现导航行为 (src/domain/behaviors/NavigationBehavior.ts)
  - navigateToStore(storeId): DomainResult
  - navigateToArea(areaId): DomainResult
  - 计算目标位置和相机角度
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 3.3.2 实现高亮行为 (src/domain/behaviors/HighlightBehavior.ts)
  - highlightStore(storeId): DomainResult
  - clearHighlight(): DomainResult
  - 管理高亮状态
  - _Requirements: 12.4, 12.5, 12.6_

- [ ] 3.3.3 实现楼层切换行为 (src/domain/behaviors/FloorSwitchBehavior.ts)
  - switchFloor(floorId): DomainResult
  - 隐藏当前楼层，显示目标楼层
  - 过渡动画
  - _Requirements: 13.1, 13.2, 13.3, 13.6_

- [ ] 3.3.4 实现场景查询行为 (src/domain/behaviors/SceneQueryBehavior.ts)
  - getStoreById(id): Store | null
  - getStoresByArea(areaId): Store[]
  - getFloorStores(floorId): Store[]
  - _Requirements: 2.5_

### 3.4 领域事件处理

- [ ] 3.4.1 创建 DomainEventHandler 类 (src/domain/events/DomainEventHandler.ts)
  - 将 Three Core 的场景事件转换为领域事件
  - scene.click → store.selected
  - scene.hover → store.focused
  - _Requirements: 11.5, 11.6_

- [ ] 3.4.2 实现领域事件分发
  - 事件订阅/取消订阅
  - 事件广播
  - _Requirements: PROTOCOL.md 5.2_

### 3.5 数据加载与验证

- [ ] 3.5.1 创建 MallDataLoader 类 (src/domain/loader/MallDataLoader.ts)
  - 从 API 或配置文件加载商城数据
  - 数据格式转换
  - _Requirements: 9.1, 9.2_

- [ ] 3.5.2 创建 MallDataValidator 类 (src/domain/loader/MallDataValidator.ts)
  - 验证数据结构完整性
  - 验证必填字段
  - 验证引用关系
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

### 3.6 Domain Layer 检查点

- [ ] 3.6.0 Checkpoint - 确保领域层完成
  - 确保语义对象可以正确创建和查询
  - 确保导航、高亮、楼层切换功能正常
  - 确保数据加载和验证正常
  - _Requirements: 需求 2, 9, 12, 13_

### 3.7 Domain Layer 测试

- [*] 3.7.1 编写属性测试 - Property 10: 语义对象唯一性
  - **Property 10: 语义对象唯一性**
  - *对于任意* 业务实体，在系统中只存在一个对应的语义对象
  - **验证需求: Requirements 2**

- [*] 3.7.2 编写属性测试 - Property 12: 导航目标可达性
  - **Property 12: 导航目标可达性**
  - *对于任意* 有效的店铺 ID，导航后相机应移动到可视范围内
  - **验证需求: Requirements 12**

- [*] 3.7.3 编写属性测试 - Property 13: 楼层切换完整性
  - **Property 13: 楼层切换完整性**
  - *对于任意* 楼层切换，当前楼层对象应隐藏，目标楼层对象应显示
  - **验证需求: Requirements 13**

- [*] 3.7.4 编写属性测试 - Property 20: 语义映射一致性
  - **Property 20: 语义映射一致性**
  - *对于任意* 语义对象，Domain Layer 与 Mesh.userData 表示应一致
  - **验证需求: Requirements 2**

- [*] 3.7.5 编写属性测试 - Property 23: 配置数据验证完整性
  - **Property 23: 配置数据验证完整性**
  - *对于任意* 格式错误的配置数据，系统应拒绝并返回详细错误
  - **验证需求: Requirements 17**

---

## P4. 业务协调层 (Orchestrator)

> 目标：作为系统行为的唯一入口，统一校验和分发 Action
> 
> **约束**:
> - 不负责理解具体业务语义
> - 只负责形式校验、权限校验、上下文校验
> - 所有行为必须经过此层

### 4.1 Action 处理核心

- [ ] 4.1.1 创建 ActionDispatcher 类 (src/orchestrator/ActionDispatcher.ts)
  - dispatch(action: Action): Promise<DomainResult>
  - 统一的 Action 入口
  - _Requirements: 4.1, 4.6, Property 2_

- [ ] 4.1.2 实现 Action 格式校验 (src/orchestrator/validators/ActionValidator.ts)
  - 验证 Action 结构完整性
  - 验证 ActionType 合法性
  - 验证 payload 格式
  - _Requirements: 4.2, Property 11_

- [ ] 4.1.3 实现 Action 处理器注册机制
  - registerHandler(actionType, handler)
  - 将 ActionType 映射到 Domain Layer 方法
  - _Requirements: 4.6_

### 4.2 权限校验系统

- [ ] 4.2.1 创建 PermissionChecker 类 (src/orchestrator/permission/PermissionChecker.ts)
  - checkPermission(action, user, context): PermissionResult
  - 实现 RCAC 模型
  - _Requirements: 6.2, Property 4_

- [ ] 4.2.2 实现角色能力映射 (src/orchestrator/permission/RoleCapabilityMap.ts)
  - 定义每个角色的能力集合
  - Admin、Merchant、User 的能力差异
  - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 4.2.3 实现上下文校验 (src/orchestrator/permission/ContextValidator.ts)
  - 空间上下文校验（当前楼层、店铺）
  - 时间上下文校验（系统状态、加载状态）
  - 模式校验（CONFIG/RUNTIME）
  - _Requirements: 7.4, 7.5, Property 6_

- [ ] 4.2.4 实现商家权限隔离
  - 验证 merchantId 匹配
  - 商家只能编辑自己的店铺
  - _Requirements: 6.4, 6.5, Property 5_

### 4.3 行为确认机制

- [ ] 4.3.1 实现写操作确认 (src/orchestrator/confirm/WriteConfirmation.ts)
  - 识别写操作（编辑、删除、添加）
  - 触发确认流程
  - _Requirements: 5.5, Property 25_

- [ ] 4.3.2 实现 AI 操作确认
  - AI 触发的写操作必须人工确认
  - _Requirements: 5.5, Property 25_

### 4.4 日志与追踪

- [ ] 4.4.1 创建 ActionLogger 类 (src/orchestrator/logger/ActionLogger.ts)
  - 记录 Action 执行过程
  - 记录权限校验结果
  - 支持日志级别控制
  - _Requirements: 4.7, 19.1, 19.2, 19.4_

### 4.5 Orchestrator 检查点

- [ ] 4.5.0 Checkpoint - 确保协调层完成
  - 确保 Action 可以正确分发
  - 确保权限校验正常
  - 确保日志记录正常
  - _Requirements: 需求 4, 6_

### 4.6 Orchestrator 测试

- [*] 4.6.1 编写属性测试 - Property 2: Action 必经 Orchestrator
  - **Property 2: Action 必经 Orchestrator**
  - *对于任意* 来源的 Action，都必须经过 Orchestrator 校验
  - **验证需求: Requirements 4**

- [*] 4.6.2 编写属性测试 - Property 4: RCAC 完整性
  - **Property 4: RCAC 完整性**
  - *对于任意* Action 执行请求，必须同时校验 Role、Capability、Context
  - **验证需求: Requirements 6**

- [*] 4.6.3 编写属性测试 - Property 5: 商家权限隔离
  - **Property 5: 商家权限隔离**
  - *对于任意* Merchant 角色用户，只能编辑自身店铺
  - **验证需求: Requirements 6**

- [*] 4.6.4 编写属性测试 - Property 6: 配置态访问限制
  - **Property 6: 配置态访问限制**
  - *对于任意* User 角色用户，不能访问 CONFIG 模式页面
  - **验证需求: Requirements 7**

- [*] 4.6.5 编写属性测试 - Property 7: AI 权限等价性
  - **Property 7: AI 权限等价性**
  - *对于任意* Agent 生成的 Action，权限校验规则与 UI 触发相同
  - **验证需求: Requirements 5**

- [*] 4.6.6 编写属性测试 - Property 11: Action 格式合法性
  - **Property 11: Action 格式合法性**
  - *对于任意* Action，必须包含 type、payload、source 字段
  - **验证需求: Requirements 4**

---

## P5. 状态管理层 (Pinia Stores)

> 目标：实现单一事实源（SSOT），集中管理所有业务状态
> 
> **约束**:
> - Three.js Scene 不存储业务状态
> - UI 组件不存储核心状态
> - 所有状态变更通过 Store 进行

### 5.1 核心 Store

- [ ] 5.1.1 创建 MallStore (src/stores/mallStore.ts)
  - 商城数据（floors、areas、stores）
  - 当前楼层、当前选中店铺
  - _Requirements: 10.1, 10.5_

- [ ] 5.1.2 创建 UserStore (src/stores/userStore.ts)
  - 当前用户信息
  - 用户角色和能力
  - 会话状态
  - _Requirements: 10.5_

- [ ] 5.1.3 创建 SystemStore (src/stores/systemStore.ts)
  - 系统模式（CONFIG/RUNTIME）
  - 时间状态（READY/LOADING/TRANSITION）
  - 全局配置
  - _Requirements: 10.5_

- [ ] 5.1.4 创建 SceneStore (src/stores/sceneStore.ts)
  - 场景状态（初始化、运行、销毁）
  - 相机位置
  - 高亮对象列表
  - _Requirements: 10.5_

### 5.2 在线用户 Store

- [ ] 5.2.1 创建 OnlineUsersStore (src/stores/onlineUsersStore.ts)
  - 在线用户列表
  - 用户状态（ONLINE/DISCONNECTED/OFFLINE）
  - 用户位置
  - _Requirements: 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

### 5.3 Store 工具

- [ ] 5.3.1 创建 Store 初始化函数 (src/stores/index.ts)
  - 统一导出所有 Store
  - Store 初始化顺序控制
  - _Requirements: 工程化规范_

- [*] 5.3.2 实现 Store 持久化
  - 关键状态本地存储
  - 页面刷新恢复
  - _Requirements: 可选功能_

### 5.4 Store 检查点

- [ ] 5.4.0 Checkpoint - 确保状态管理完成
  - 确保 Store 状态正确同步
  - 确保 SSOT 原则得到遵守
  - _Requirements: 需求 10_

### 5.5 Store 测试

- [*] 5.5.1 编写属性测试 - Property 8: 单一事实源
  - **Property 8: 单一事实源**
  - *对于任意* 业务状态，系统中只存在一个权威数据源
  - **验证需求: Requirements 10**

- [*] 5.5.2 编写属性测试 - Property 9: 状态同步一致性
  - **Property 9: 状态同步一致性**
  - *对于任意* 状态变更，所有订阅者应在下一渲染周期收到更新
  - **验证需求: Requirements 10**

---

## P6. UI 层 (Vue Components)

> 目标：承载用户交互，展示系统状态
> 
> **约束**:
> - 使用 Vue 3 选项式 API
> - 不直接调用 Three.js API
> - 不解析 AI 返回结果结构
> - 只通过 Orchestrator 触发行为

### 6.1 布局组件

- [ ] 6.1.1 创建 AppLayout 组件 (src/components/layout/AppLayout.vue)
  - 整体页面布局
  - 3D 场景容器 + 2D 面板区域
  - _Requirements: UI 层职责_

- [ ] 6.1.2 创建 SidePanel 组件 (src/components/layout/SidePanel.vue)
  - 侧边面板容器
  - 可折叠/展开
  - _Requirements: UI 层职责_

- [ ] 6.1.3 创建 TopBar 组件 (src/components/layout/TopBar.vue)
  - 顶部导航栏
  - 用户信息、模式切换
  - _Requirements: UI 层职责_

### 6.2 3D 场景组件

- [ ] 6.2.1 创建 SceneContainer 组件 (src/components/scene/SceneContainer.vue)
  - Three.js 渲染容器
  - 生命周期管理（mounted/unmounted）
  - 通过 Domain Layer 初始化场景
  - _Requirements: 1.1, 1.4, 1.5, 1.6, Property 3_

- [ ] 6.2.2 创建 SceneControls 组件 (src/components/scene/SceneControls.vue)
  - 场景控制按钮（缩放、重置视角）
  - 楼层切换按钮
  - _Requirements: UI 层职责_

- [ ] 6.2.3 创建 SceneOverlay 组件 (src/components/scene/SceneOverlay.vue)
  - 场景上的 2D 覆盖层
  - 加载提示、错误提示
  - _Requirements: 16.1, 16.4_

### 6.3 商城信息组件

- [ ] 6.3.1 创建 StoreInfoPanel 组件 (src/components/mall/StoreInfoPanel.vue)
  - 店铺详情展示
  - 商品列表
  - _Requirements: UI 层职责_

- [ ] 6.3.2 创建 FloorSelector 组件 (src/components/mall/FloorSelector.vue)
  - 楼层选择器
  - 当前楼层指示
  - _Requirements: 13.3_

- [ ] 6.3.3 创建 MallMap 组件 (src/components/mall/MallMap.vue)
  - 2D 平面地图（可选）
  - 店铺位置标记
  - _Requirements: 降级策略_

### 6.4 交互组件

- [ ] 6.4.1 创建 SearchBar 组件 (src/components/interaction/SearchBar.vue)
  - 店铺搜索
  - 搜索建议
  - _Requirements: UI 层职责_

- [ ] 6.4.2 创建 ChatInput 组件 (src/components/interaction/ChatInput.vue)
  - 自然语言输入框
  - 发送到 AI Agent
  - _Requirements: 5.1_

- [ ] 6.4.3 创建 ChatHistory 组件 (src/components/interaction/ChatHistory.vue)
  - 对话历史展示
  - AI 响应展示
  - _Requirements: UI 层职责_

### 6.5 配置态组件

- [ ] 6.5.1 创建 ConfigToolbar 组件 (src/components/config/ConfigToolbar.vue)
  - 配置态工具栏
  - 编辑工具按钮
  - _Requirements: 7.2, 7.3_

- [ ] 6.5.2 创建 StoreEditor 组件 (src/components/config/StoreEditor.vue)
  - 店铺编辑面板
  - 商品管理
  - _Requirements: 7.2_

### 6.6 通用组件

- [ ] 6.6.1 创建 ConfirmDialog 组件 (src/components/common/ConfirmDialog.vue)
  - 确认对话框
  - 用于写操作确认
  - _Requirements: 5.5_

- [ ] 6.6.2 创建 ErrorToast 组件 (src/components/common/ErrorToast.vue)
  - 错误提示
  - 用户友好的错误消息
  - _Requirements: 16.1, 16.6_

- [ ] 6.6.3 创建 LoadingSpinner 组件 (src/components/common/LoadingSpinner.vue)
  - 加载指示器
  - _Requirements: UI 层职责_

### 6.7 UI 层检查点

- [ ] 6.7.0 Checkpoint - 确保 UI 层完成
  - 确保所有组件正常渲染
  - 确保用户交互正常
  - 确保 UI 层不直接调用 Three.js
  - _Requirements: 需求 3_

### 6.8 UI 层测试

- [*] 6.8.1 编写属性测试 - Property 3: UI 层隔离性
  - **Property 3: UI 层隔离性**
  - *对于任意* UI 组件，其代码中不应包含对 Three.js API 的直接调用
  - **验证需求: Requirements 3**

- [*] 6.8.2 编写 SceneContainer 组件测试
  - 生命周期测试
  - 事件处理测试
  - _Requirements: 16.4_

- [*] 6.8.3 编写属性测试 - Property 1: 分层依赖单向性
  - **Property 1: 分层依赖单向性**
  - *对于任意* Action 执行路径，调用链必须严格遵循单向依赖
  - **验证需求: Requirements 3**

---

## P7. AI Agent 模块

> 目标：实现自然语言理解和 Action 生成
> 
> **约束**:
> - 不直接操作 Three.js API
> - 不直接修改前端状态
> - 不绕过 Orchestrator 执行操作
> - 输出必须符合 Action 协议

### 7.1 Agent 核心

- [ ] 7.1.1 创建 AgentService 类 (src/agent/AgentService.ts)
  - processInput(text: string): Promise<Action[]>
  - 自然语言 → Action 转换
  - _Requirements: 5.1_

- [ ] 7.1.2 实现意图解析 (src/agent/IntentParser.ts)
  - 解析用户意图
  - 映射到 ActionType
  - _Requirements: 5.1_

- [ ] 7.1.3 实现 Action 生成器 (src/agent/ActionGenerator.ts)
  - 根据意图生成 Action
  - 填充 payload
  - _Requirements: 5.1_

### 7.2 Agent 约束实现

- [ ] 7.2.1 实现输出格式校验 (src/agent/validators/OutputValidator.ts)
  - 验证 AI 输出符合 Action 协议
  - 拒绝非法格式
  - _Requirements: 5.6, Property 24_

- [ ] 7.2.2 实现 Agent 上下文管理 (src/agent/context/AgentContext.ts)
  - 维护对话上下文
  - 提供只读系统状态摘要
  - _Requirements: PROTOCOL.md 6.1_

### 7.3 Agent 集成

- [ ] 7.3.1 创建 AgentBridge 类 (src/agent/AgentBridge.ts)
  - 连接 Agent 和 Orchestrator
  - 将 Agent 输出提交到 Orchestrator
  - 标记 source 为 'AGENT'
  - _Requirements: 5.2, 5.3, 5.4, 5.7_

### 7.4 Agent 检查点

- [ ] 7.4.0 Checkpoint - 确保 AI 集成完成
  - 确保自然语言可以转换为 Action
  - 确保 AI 输出格式正确
  - 确保 AI 权限约束正常
  - _Requirements: 需求 5_

### 7.5 Agent 测试

- [*] 7.5.1 编写属性测试 - Property 24: AI 输出格式约束
  - **Property 24: AI 输出格式约束**
  - *对于任意* Agent 生成的输出，如果不符合 Action 协议格式，系统应拒绝执行
  - **验证需求: Requirements 5**

- [*] 7.5.2 编写属性测试 - Property 25: AI 写操作确认
  - **Property 25: AI 写操作确认**
  - *对于任意* Agent 生成的涉及数据变更的 Action，必须要求用户确认
  - **验证需求: Requirements 5**

- [*] 7.5.3 编写属性测试 - Property 26: AI 不可绕过权限
  - **Property 26: AI 不可绕过权限**
  - *对于任意* Agent 生成的 Action，必须通过与 UI 相同的 RCAC 权限校验
  - **验证需求: Requirements 5**

---

## P8. 路由与权限系统

> 目标：实现动态路由和页面级权限控制
> 
> **约束**:
> - 路由层不负责业务权限判断
> - 动态路由由后端下发
> - AI 不能绕过路由守卫

### 8.1 路由配置

- [ ] 8.1.1 创建基础路由配置 (src/router/index.ts)
  - Vue Router 初始化
  - 静态路由（登录、404）
  - _Requirements: 8.1_

- [ ] 8.1.2 实现动态路由加载 (src/router/dynamicRoutes.ts)
  - 从后端获取路由树
  - 路由树校验
  - router.addRoute 动态注入
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 8.1.3 创建组件白名单映射 (src/router/componentMap.ts)
  - 组件标识符 → Vue 组件映射
  - 安全的组件加载
  - _Requirements: 8.4, 8.5_

### 8.2 路由守卫

- [ ] 8.2.1 实现全局路由守卫 (src/router/guards/authGuard.ts)
  - 登录状态检查
  - 角色权限检查
  - _Requirements: 8.6_

- [ ] 8.2.2 实现模式路由守卫 (src/router/guards/modeGuard.ts)
  - CONFIG/RUNTIME 模式检查
  - User 角色禁止访问 CONFIG 页面
  - _Requirements: 7.6, Property 6_

- [ ] 8.2.3 实现路由刷新机制 (src/router/guards/refreshGuard.ts)
  - 角色变更时刷新路由
  - 回退到安全页面
  - _Requirements: 8.6_

### 8.3 页面视图

- [ ] 8.3.1 创建 MallView 页面 (src/views/MallView.vue)
  - 商城主页面
  - 3D 场景 + 侧边面板
  - _Requirements: UI 层职责_

- [ ] 8.3.2 创建 LoginView 页面 (src/views/LoginView.vue)
  - 登录页面
  - 角色选择（演示用）
  - _Requirements: UI 层职责_

- [ ] 8.3.3 创建 ConfigView 页面 (src/views/ConfigView.vue)
  - 配置态页面
  - 编辑工具和面板
  - _Requirements: 7.2_

- [ ] 8.3.4 创建 NotFoundView 页面 (src/views/NotFoundView.vue)
  - 404 页面
  - _Requirements: UI 层职责_

### 8.4 路由检查点

- [ ] 8.4.0 Checkpoint - 确保路由完成
  - 确保动态路由正常加载
  - 确保路由守卫正常工作
  - 确保页面导航正常
  - _Requirements: 需求 8_

### 8.5 路由测试

- [*] 8.5.1 编写路由守卫单元测试
  - 权限检查测试
  - 模式检查测试
  - _Requirements: 16.4_

- [*] 8.5.2 编写路由树校验属性测试
  - **Property: 路由树结构合法性**
  - *对于任意* 路由树，必须通过结构与权限合法性校验
  - **验证需求: Requirements 8.2**

---

## P9. 集成与优化

> 目标：完成系统集成，优化性能和用户体验

### 9.1 系统集成

- [ ] 9.1.1 集成所有模块到 App.vue
  - 初始化顺序：Store → Router → Domain → Three
  - _Requirements: 工程化规范_

- [ ] 9.1.2 实现完整的 Action 执行链路
  - UI → Orchestrator → Domain → Three Core
  - 验证分层架构正确性
  - _Requirements: Property 1, Property 2_

- [ ] 9.1.3 实现错误边界处理
  - 全局错误捕获
  - 降级策略实现
  - _Requirements: 17.3_

### 9.2 性能优化

- [ ] 9.2.1 实现模型懒加载
  - 按楼层/区域分批加载
  - _Requirements: 14.6_

- [ ] 9.2.2 实现渲染性能监控
  - FPS 监控
  - 内存使用监控
  - _Requirements: 14.7_

- [ ] 9.2.3 优化 Three.js 资源使用
  - 几何体/材质复用
  - 实例化渲染（如需要）
  - _Requirements: 14.4, 14.5_

### 9.3 响应式适配

- [ ] 9.3.1 实现窗口 resize 处理
  - 渲染器尺寸调整
  - 相机宽高比调整
  - _Requirements: 18.1, 18.2_

- [*] 9.3.2 实现移动端触摸支持
  - 触摸控制
  - 手势识别
  - _Requirements: 18.3_

### 9.4 最终检查点

- [ ] 9.4.0 Checkpoint - 确保系统集成完成
  - 确保完整功能可用
  - 确保性能达标
  - 确保所有测试通过
  - _Requirements: 全部需求_

### 9.5 最终测试

- [*] 9.5.1 运行完整属性测试套件
  - 验证所有 26 个正确性属性
  - _Requirements: 15. 正确性属性_

- [*] 9.5.2 运行集成测试
  - 完整用户流程测试
  - _Requirements: 16.5_

- [*] 9.5.3 编写属性测试 - Property 18: 配置数据驱动性
  - **Property 18: 配置数据驱动性**
  - *对于任意* 有效的商城配置数据，系统应能根据数据渲染出对应场景
  - **验证需求: Requirements 9**

- [*] 9.5.4 编写属性测试 - Property 19: 数据更新响应性
  - **Property 19: 数据更新响应性**
  - *对于任意* 商城数据更新，系统应能在不重启应用的情况下重新渲染
  - **验证需求: Requirements 9**

---

## P10. 区域建模权限模块

> 目标：实现区域建模权限申请、审批、沙盒约束等功能
> 
> **约束**:
> - 商家只能在授权区域内建模
> - 所有建模变更需经过审批
> - 防止越权编辑和空间冲突

### 10.1 区域权限状态管理

- [ ] 10.1.1 创建 AreaPermissionStore (src/stores/areaPermissionStore.ts)
  - 区域状态（LOCKED/PENDING/AUTHORIZED/OCCUPIED）
  - 当前用户授权区域列表
  - 申请记录管理
  - _Requirements: 需求 21, 26_

- [ ] 10.1.2 实现区域状态可视化服务 (src/domain/area/AreaStatusVisualizer.ts)
  - 不同状态区域的颜色标识
  - 悬停显示区域详情
  - _Requirements: 需求 26_

### 10.2 建模权限申请流程

- [ ] 10.2.1 创建 AreaApplyService (src/domain/permission/AreaApplyService.ts)
  - 获取可申请区域列表
  - 提交建模权限申请
  - 查询申请状态
  - _Requirements: 需求 21_

- [ ] 10.2.2 创建 AreaApplyPanel 组件 (src/components/permission/AreaApplyPanel.vue)
  - 区域选择界面
  - 申请理由填写
  - 申请状态展示
  - _Requirements: 需求 21_

### 10.3 建模沙盒约束

- [ ] 10.3.1 实现 BuilderConstraintChecker (src/orchestrator/permission/BuilderConstraintChecker.ts)
  - 校验对象位置是否在授权区域内
  - 校验操作对象是否属于授权区域
  - 实时边界校验
  - _Requirements: 需求 22, 28_

- [ ] 10.3.2 实现授权区域边界可视化 (src/domain/area/AreaBoundaryVisualizer.ts)
  - 在 3D 场景中显示授权区域边界
  - 越界操作时的视觉反馈
  - _Requirements: 需求 22_

- [ ] 10.3.3 创建 BuilderMode 组件 (src/components/builder/BuilderMode.vue)
  - Builder 模式入口
  - 仅显示授权区域的编辑工具
  - _Requirements: 需求 22_

### 10.4 变更提案管理

- [ ] 10.4.1 创建 LayoutProposalService (src/domain/layout/LayoutProposalService.ts)
  - 收集变更内容
  - 提交变更提案
  - 查询提案状态
  - _Requirements: 需求 23_

- [ ] 10.4.2 创建 ProposalSubmitPanel 组件 (src/components/layout/ProposalSubmitPanel.vue)
  - 变更预览
  - 提案描述填写
  - 提交确认
  - _Requirements: 需求 23_

### 10.5 版本更新通知

- [ ] 10.5.1 实现 LayoutVersionNotifier (src/domain/layout/LayoutVersionNotifier.ts)
  - WebSocket 监听版本发布
  - 显示更新提示
  - 处理刷新/稍后选项
  - _Requirements: 需求 25_

### 10.6 区域建模权限测试

- [*] 10.6.1 编写属性测试 - 建模边界约束
  - **Property: 建模操作在授权区域内**
  - *对于任意* 商家建模操作，操作位置必须在授权区域边界内
  - **验证需求: Requirements 22, 28**

- [*] 10.6.2 编写属性测试 - 区域状态转换
  - **Property: 区域状态转换合法性**
  - *对于任意* 区域，状态只能按 LOCKED → PENDING → AUTHORIZED 转换
  - **验证需求: Requirements 21**

---

## 检查点（Checkpoints）

### Checkpoint 1: 基础设施完成
**触发条件**: P0 + P1 完成
**验证内容**:
- [x] 项目可以正常启动
- [x] TypeScript 编译无错误
- [x] 所有类型定义完整

### Checkpoint 2: 渲染层完成
**触发条件**: P2 完成
**验证内容**:
- [x] Three.js 场景可以正常渲染
- [x] 相机控制正常
- [x] 资源释放正确

### Checkpoint 3: 领域层完成
**触发条件**: P3 完成
**验证内容**:
- [ ] 语义对象可以正确创建和查询
- [ ] 导航、高亮、楼层切换功能正常
- [ ] 数据加载和验证正常

### Checkpoint 4: 协调层完成
**触发条件**: P4 完成
**验证内容**:
- [ ] Action 可以正确分发
- [ ] 权限校验正常
- [ ] 日志记录正常

### Checkpoint 5: 状态管理完成
**触发条件**: P5 完成
**验证内容**:
- [ ] Store 状态正确同步
- [ ] SSOT 原则得到遵守

### Checkpoint 6: UI 层完成
**触发条件**: P6 完成
**验证内容**:
- [ ] 所有组件正常渲染
- [ ] 用户交互正常
- [ ] UI 层不直接调用 Three.js

### Checkpoint 7: AI 集成完成
**触发条件**: P7 完成
**验证内容**:
- [ ] 自然语言可以转换为 Action
- [ ] AI 输出格式正确
- [ ] AI 权限约束正常

### Checkpoint 8: 路由完成
**触发条件**: P8 完成
**验证内容**:
- [ ] 动态路由正常加载
- [ ] 路由守卫正常工作
- [ ] 页面导航正常

### Checkpoint 9: 系统集成完成
**触发条件**: P9 完成
**验证内容**:
- [ ] 完整功能可用
- [ ] 性能达标
- [ ] 所有测试通过

### Checkpoint 10: 区域建模权限完成
**触发条件**: P10 完成
**验证内容**:
- [ ] 区域权限申请流程正常
- [ ] 建模沙盒约束正常
- [ ] 变更提案管理正常
- [ ] 版本更新通知正常

---

## 附录：任务依赖关系

```
P0 (基础设施)
 └─→ P1 (类型系统)
      └─→ P2 (Three Core)
           └─→ P3 (Domain Layer)
                └─→ P4 (Orchestrator)
                     └─→ P5 (Stores)
                          └─→ P6 (UI Components)
                               └─→ P7 (AI Agent)
                                    └─→ P8 (Router)
                                         └─→ P9 (集成优化)
                                              └─→ P10 (区域建模权限)
```

**并行可能性**:
- P5 (Stores) 可以与 P3 (Domain) 并行开发
- P6 (UI) 的部分组件可以与 P4 (Orchestrator) 并行开发
- P7 (AI Agent) 可以独立开发，最后集成
- P10 (区域建模权限) 可以与 P9 (集成优化) 并行开发

---
