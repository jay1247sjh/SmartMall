# 变更日志（CHANGELOG.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端变更日志
> 
> 本文档为 **变更日志（Changelog）**，用于记录版本变更历史，遵循 Keep a Changelog 格式规范。
> 
> 最后更新：2026-01-07

---

## [Unreleased] - 2026-01-26

### Changed - 变更

#### 相机工厂重构
- ✅ 新增 `engine/camera/cameraFactory.ts` - 统一相机创建逻辑
  - `createPerspectiveCamera()` - 工厂函数，支持配置 FOV、裁剪面、初始位置
  - `CameraConfig` - 相机配置类型
  - 默认配置：FOV 60°, near 0.1, far 1000, position (20, 15, 20)
- ✅ 重构 `ThreeEngine.ts` - 使用工厂函数创建相机，移除重复代码
- ✅ 重构 `CameraController.ts` - 使用工厂函数创建相机，仅覆盖不同的初始位置
- ✅ 更新 `camera/index.ts` - 导出工厂函数

### Removed - 移除

#### 清理不必要的测试文件
- ❌ 移除 `composables/useAsync.property.spec.ts`
- ❌ 移除 `composables/useConfirm.property.spec.ts`
- ❌ 移除 `composables/useErrorBoundary.property.spec.ts`
- ❌ 移除 `composables/useForm.property.spec.ts`
- ❌ 移除 `composables/useKeyboard.property.spec.ts`
- ❌ 移除 `composables/useLocalStorage.property.spec.ts`
- ❌ 移除 `composables/useModal.property.spec.ts`
- ❌ 移除 `composables/useNotification.property.spec.ts`
- ❌ 移除 `composables/usePagination.property.spec.ts`
- ❌ 移除 `composables/useSearch.property.spec.ts`
- ❌ 移除 `composables/useTable.property.spec.ts`
- ❌ 移除 `components/integration.property.spec.ts`

---

## [Unreleased] - 2026-01-11

### Added - 新增功能

#### AI 导购助手集成 ⭐ 新增

**API 模块 (`api/intelligence.api.ts`)** ⭐ 新增
- ✅ 创建智能服务 API 模块，对接 Intelligence Service
- ✅ 智能对话 API：
  - `chat()` - 发送对话消息（支持纯文本和图片+文字）
  - `confirm()` - 确认或取消操作（加购、下单等）
  - `uploadImage()` - 上传图片获取 URL
- ✅ 类型定义：
  - `ChatRequest` - 对话请求
  - `ChatResponse` - 对话响应
  - `ChatMessage` - 聊天消息（前端展示用）
  - `ToolResult` - 工具调用结果
  - `ConfirmRequest` - 确认请求

**AI 聊天组件 (`components/ai/AiChatPanel.vue`)** ⭐ 新增
- ✅ 与 AI 导购助手「小智」的对话界面
- ✅ 文字输入对话
- ✅ 图片上传（视觉理解）
- ✅ 操作确认（加购、下单等需确认操作）
- ✅ 消息历史展示
- ✅ 加载状态和错误处理
- ✅ 深色主题 UI 设计
- ✅ 响应式布局

**Agent 模块 (`agent/index.ts`)** ⭐ 新增
- ✅ 封装与 Intelligence Service 的交互逻辑
- ✅ `parseToolResultToAction()` - 解析工具调用结果为场景操作
- ✅ 场景操作类型定义（navigate、highlight、showDetail、addToCart）

**Mall3DView.vue 集成**
- ✅ 集成 AI 聊天面板组件
- ✅ AI 聊天按钮（右下角浮动按钮）
- ✅ AI 导航事件处理（handleAiNavigate）
- ✅ AI 高亮事件处理（handleAiHighlight）
- ✅ AI 显示详情事件处理（handleAiShowDetail）

**Vite 配置更新**
- ✅ 添加 Intelligence Service 代理配置
  - `/intelligence-api` → `http://localhost:9000`

---

## [Unreleased] - 2026-01-10

### Added - 新增功能

#### 用户管理功能 ⭐ 新增

**API 模块 (`api/admin.api.ts`)** 扩展
- ✅ 新增用户管理相关类型定义
  - `UserListParams` - 用户列表查询参数
  - `UserListResponse` - 用户列表响应
  - `UserDetail` - 用户详情
- ✅ 新增用户管理 API 方法
  - `getUserList()` - 获取用户列表（支持搜索、筛选、分页）
  - `getUserDetail()` - 获取用户详情
  - `freezeUser()` - 冻结用户
  - `activateUser()` - 激活用户
- ✅ Mock 数据：8 个测试用户（管理员、商家、普通用户）

**用户管理视图 (`views/admin/UserManageView.vue`)** ⭐ 新增
- ✅ 用户列表展示（表格视图）
- ✅ 搜索筛选功能
  - 关键词搜索（用户名/邮箱）
  - 用户类型筛选（全部/管理员/商家/普通用户）
  - 状态筛选（全部/正常/冻结/已删除）
- ✅ 分页功能
- ✅ 冻结/激活用户操作（带确认对话框）
- ✅ 骨架屏加载效果
- ✅ 错误处理和重试按钮
- ✅ 深色主题 UI 设计

**用户详情抽屉 (`components/admin/UserDetailDrawer.vue`)** ⭐ 新增
- ✅ 抽屉式详情展示
- ✅ 显示完整用户信息
  - 用户 ID、用户名、邮箱、手机号
  - 用户类型、状态
  - 注册时间、最后登录时间
- ✅ 加载状态和错误处理

**路由配置更新**
- ✅ 添加用户管理路由 `/admin/users`
- ✅ 更新组件映射表 `componentMap.ts`（AdminUserManage）
- ✅ 更新 Mock 路由配置 `route.mock.ts`

**测试覆盖** ⭐ 新增
- ✅ 9 个单元测试
  - getUserList 参数传递测试
  - getUserDetail 正常/异常测试
  - freezeUser/activateUser 状态变更测试
- ✅ 3 个属性测试（fast-check，每个 100 次迭代）
  - Property 1: 搜索过滤正确性
  - Property 2: 状态转换正确性
  - Property 3: 详情数据完整性

---

## [Unreleased] - 2026-01-07

### Added - 新增功能

#### 商品管理功能

**API 模块 (`api/product.api.ts`)** ⭐ 新增
- ✅ 创建商品管理 API 模块，对接后端商品管理接口
- ✅ 商家端 API：
  - `createProduct()` - 创建商品
  - `getProduct()` - 获取商品详情
  - `updateProduct()` - 更新商品
  - `deleteProduct()` - 删除商品
  - `getStoreProducts()` - 获取店铺商品列表
  - `updateProductStatus()` - 更新商品状态
  - `updateProductStock()` - 更新库存
- ✅ 公开端 API：
  - `getPublicStoreProducts()` - 获取店铺公开商品
  - `getPublicProduct()` - 获取商品公开详情

**商品管理视图 (`views/merchant/ProductManageView.vue`)** ⭐ 新增
- ✅ 商品列表展示（表格视图）
- ✅ 分页和状态筛选
- ✅ 创建/编辑/删除商品
- ✅ 上架/下架切换
- ✅ 库存编辑
- ✅ 深色主题 UI 设计

---

## [Previous] - 2026-01-06

### Added - 新增功能

#### 店铺管理功能

**API 模块 (`api/store.api.ts`)** ⭐ 新增
- ✅ 创建店铺管理 API 模块，对接后端店铺管理接口
- ✅ 商家端 API：
  - `createStore()` - 创建店铺（需要有该区域的 ACTIVE 权限）
  - `getMyStores()` - 获取我的店铺列表
  - `getStoreById()` - 获取店铺详情
  - `updateStore()` - 更新店铺信息
  - `activateStore()` - 激活店铺（PENDING/INACTIVE → ACTIVE）
  - `deactivateStore()` - 暂停营业（ACTIVE → INACTIVE）
- ✅ 管理员端 API：
  - `getAllStores()` - 获取所有店铺（分页、筛选）
  - `approveStore()` - 审批店铺（PENDING → ACTIVE）
  - `closeStore()` - 关闭店铺（任意状态 → CLOSED）

**API 模块 (`api/product.api.ts`)** ⭐ 新增
- ✅ 创建商品管理 API 模块，对接后端商品管理接口
- ✅ 商家端 API：
  - `createProduct()` - 创建商品
  - `getProduct()` - 获取商品详情
  - `updateProduct()` - 更新商品
  - `deleteProduct()` - 删除商品
  - `getStoreProducts()` - 获取店铺商品列表
  - `updateProductStatus()` - 更新商品状态
  - `updateProductStock()` - 更新库存
- ✅ 公开端 API：
  - `getPublicStoreProducts()` - 获取店铺公开商品
  - `getPublicProduct()` - 获取商品公开详情

**商家视图更新**
- ✅ `StoreConfigView.vue` - 更新为使用真实后端 API
  - 移除 Mock 数据，对接 `storeApi`
  - 添加创建店铺对话框（选择已授权区域）
  - 添加激活/暂停店铺功能
  - 添加错误处理逻辑
  - 显示店铺状态标签（待审批/营业中/暂停营业/已关闭）

**管理员视图新增**
- ✅ `AdminStoreManageView.vue` - 新增管理员店铺管理视图
  - 展示所有店铺列表（分页）
  - 支持状态筛选（全部/待审批/营业中/暂停营业/已关闭）
  - 支持分类筛选
  - 审批店铺功能
  - 关闭店铺功能（带理由输入）
  - 深色主题 UI 设计

**路由配置更新**
- ✅ 添加管理员店铺管理路由 `/admin/store-manage`
- ✅ 添加商家商品管理路由 `/merchant/product` ⭐ 新增
- ✅ 更新组件映射表 `componentMap.ts`
- ✅ 更新 Mock 路由配置 `route.mock.ts`

---

#### 区域权限管理 UI

**API 模块 (`api/area-permission.api.ts`)** ⭐ 新增
- ✅ 创建区域权限 API 模块，对接后端区域权限管理接口
- ✅ 商家端 API：
  - `getAvailableAreas()` - 获取可申请区域列表
  - `submitApplication()` - 提交区域申请
  - `getMyApplications()` - 获取我的申请列表
  - `getMyPermissions()` - 获取我的权限列表
- ✅ 管理员端 API：
  - `getPendingApplications()` - 获取待审批申请列表
  - `approveApplication()` - 审批通过
  - `rejectApplication()` - 审批驳回
  - `revokePermission()` - 撤销权限

**商家视图更新**
- ✅ `AreaApplyView.vue` - 更新为使用真实后端 API
  - 移除 Mock 数据，对接 `areaPermissionApi`
  - 更新类型定义匹配后端 DTO
  - 添加错误处理逻辑
  - 更新区域状态映射（AVAILABLE/OCCUPIED/LOCKED）
- ✅ `AreaPermissionView.vue` - 新增商家权限视图
  - 展示商家已获得的区域权限列表
  - 显示权限详情（区域名称、楼层、授权时间）
  - 显示权限状态标签（有效/已撤销）
- ✅ `ProductManageView.vue` - 新增商品管理视图 ⭐ 新增
  - 展示店铺商品列表（表格视图）
  - 支持分页和状态筛选
  - 创建/编辑/删除商品
  - 上架/下架切换
  - 库存编辑
  - 深色主题 UI 设计

**管理员视图更新**
- ✅ `AreaApprovalView.vue` - 更新为使用真实后端 API
  - 移除 Mock 数据，对接 `areaPermissionApi`
  - 更新类型定义匹配后端 DTO
  - 添加错误处理逻辑
- ✅ `AreaPermissionManageView.vue` - 新增管理员权限管理视图
  - 展示所有区域权限列表
  - 支持撤销权限操作（带理由输入）
  - 状态筛选功能

**路由配置更新**
- ✅ 添加商家权限视图路由 `/merchant/area-permission`
- ✅ 添加管理员权限管理路由 `/admin/area-permission`
- ✅ 更新组件映射表 `componentMap.ts`
- ✅ 更新 Mock 路由配置 `route.mock.ts`

### Fixed - 问题修复

#### 深色主题样式统一化

**问题描述**
- 首页（/mall）显示白色背景
- 管理中心（/admin/dashboard）显示深色背景
- 部分页面出现"半黑半白"的样式不一致问题

**根本原因**
- `index.html` 的 `<html>` 标签缺少 `class="dark"`，导致 Element Plus 使用默认浅色主题
- 部分组件使用 Element Plus CSS 变量（如 `var(--el-bg-color)`），而非硬编码深色值
- 不同组件样式实现方式不一致

**修复内容**
- ✅ `index.html` - 添加 `class="dark"` 到 `<html>` 标签，启用 Element Plus 深色主题
- ✅ `DashboardLayout.vue` - 统一使用深色主题硬编码样式
  - 背景色：`#0a0a0a`
  - 侧边栏：`rgba(17, 17, 19, 0.8)` + 毛玻璃效果
  - 边框：`rgba(255, 255, 255, 0.06)`
  - 文字色：`#e8eaed`（主）、`#9aa0a6`（次）
- ✅ `MallView.vue` - 统一深色主题样式
  - 欢迎区域渐变背景
  - 卡片背景和边框
- ✅ `ProfileView.vue` - 统一深色主题样式
- ✅ `DashboardView.vue`（管理员）- 统一深色主题样式
- ✅ `DashboardView.vue`（商家）- 统一深色主题样式
- ✅ `MallManageView.vue` - 统一深色主题样式
- ✅ `QuickActionCard.vue` - 统一深色主题样式
- ✅ `StatCard.vue` - 统一深色主题样式

**设计规范**
- 主背景色：`#0a0a0a`
- 卡片/面板背景：`rgba(17, 17, 19, 0.8)`
- 边框色：`rgba(255, 255, 255, 0.06)`
- 主文字色：`#e8eaed`
- 次文字色：`#9aa0a6`
- 占位文字色：`#71717a`
- 强调色：`#8ab4f8`（蓝色）
- 悬停边框：`rgba(138, 180, 248, 0.3)`

---

## [Unreleased] - 2026-01-03

### Added - 新增功能

#### P-0. 商场家具模型系统

**家具模型 (`builder/objects/furniture-models.ts`)**
- ✅ `createBenchModel()` - 商场长椅
  - 多条木板座椅和靠背
  - 金属支架和横梁
  - 扶手
  - 支持长度和高度缩放
- ✅ `createLampPostModel()` - 路灯/装饰灯
  - mall 风格（现代商场简约立柱灯）
  - modern 风格（现代简约方形灯）
  - classic 风格（经典灯笼形）
  - 内置点光源
- ✅ `createTrashBinModel()` - 垃圾桶
  - single 风格（单个金属垃圾桶）
  - recycling 风格（三色分类垃圾桶）
- ✅ `createPlanterModel()` - 装饰花盆
  - 三种尺寸（small/medium/large）
  - 三种植物类型（tree/bush/flowers）
  - 陶瓷花盆 + 土壤 + 植物
- ✅ `createSignPostModel()` - 指示牌/导视牌
  - standing 风格（立式指示牌）
  - hanging 风格（悬挂式指示牌）
  - wall 风格（墙面指示牌）
- ✅ `createFountainModel()` - 中庭喷泉
  - 石材外圈池
  - 水面效果
  - 中心柱和喷水口
- ✅ `createKioskModel()` - 信息亭/服务台
  - 柜台和台面
  - 顶棚支架和顶棚
  - 信息屏幕

**漫游模式渲染器 (`builder/rendering/roaming-renderer.ts`)**
- ✅ `createRoamingWalls()` - 创建商城墙壁
  - 根据商城轮廓生成墙壁
  - 带踢脚线
  - PBR 墙面材质
- ✅ `createRoamingFloor()` - 创建地板
  - PBR 瓷砖材质
  - 程序化纹理
- ✅ `createRoamingCeiling()` - 创建天花板
- ✅ `createRoamingLights()` - 创建室内照明
  - 多点光源布置
  - 环境光
- ✅ `createMallFurniture()` - 自动布置商场家具
  - 根据商城大小自动计算家具数量和位置
  - 包含长椅、路灯、垃圾桶、花盆、指示牌

### Changed - 变更

#### Builder 资源优化重构
- ✅ 将 `furniture-models.ts` 中的材质函数迁移到 `resource-manager.ts`
- ✅ 新增 6 个家具材质函数（使用 MaterialManager 缓存）：
  - `getFurnitureWoodMaterial()` - 木材材质 (0x8b4513)
  - `getFurnitureMetalMaterial()` - 金属材质 (0x4a4a4a)
  - `getFurnitureChromeMaterial()` - 铬材质 (0xcccccc)
  - `getFurniturePlasticMaterial(color)` - 塑料材质
  - `getFurnitureLeafMaterial()` - 叶子材质 (0x228b22)
  - `getFurnitureCeramicMaterial(color)` - 陶瓷材质
- ✅ 移除 `furniture-models.ts` 中的本地材质定义
- ✅ 所有内联 `new THREE.MeshStandardMaterial()` 改用 `getMaterialManager().getStandardMaterial()`
- ✅ 减少 GPU 内存占用，提高材质复用率

---

## [Previous] - 2026-01-02

### Added - 新增功能

#### P-0. 第三人称漫游模式与角色系统

**角色模型 (`builder/objects/character-model.ts`)**
- ✅ 小人角色 3D 模型
  - 头部（圆柱 + 头发）
  - 躯干（方块）
  - 手臂（圆柱 x2）
  - 腿部（圆柱 x2）
  - 脚（方块 x2）
  - 皮肤、衣服、鞋子材质
- ✅ `CharacterController` 角色控制器类
  - WASD 移动控制
  - 角色旋转
  - 速度阻尼
  - 楼层高度管理
  - 资源清理

**第三人称漫游模式**
- ✅ 相机跟随角色移动
- ✅ 鼠标控制视角（Pointer Lock API）
  - 水平旋转（yaw）同时旋转角色
  - 垂直旋转（pitch）控制相机俯仰
- ✅ 球面坐标计算相机位置
- ✅ 平滑相机跟随（lerp 插值）
- ✅ 楼层切换时更新角色位置

### Changed - 变更

#### 漫游模式重构
- ✅ 从第一人称视角改为第三人称视角
- ✅ 移除直接相机控制，改为角色控制
- ✅ 相机自动跟随角色移动
- ✅ 鼠标控制同时旋转角色和相机

---

#### P-0. 商城建模器性能优化与 3D 模型系统

**3D 模型模块 (`builder/objects/`)**
- ✅ 电梯 3D 模型 (`elevator-model.ts`)
  - 电梯井外壳（四面墙，前面留门洞）
  - 双开电梯门（金属质感）
  - 顶部指示灯（选中时变绿）
  - 支持高度缩放（编辑模式/漫游模式）
- ✅ 扶梯 3D 模型 (`escalator-model.ts`)
  - 底部/顶部平台
  - 斜面底板和台阶
  - 台阶凹槽线条
  - 玻璃护栏和扶手
  - 扶手支撑柱
  - 梳齿板（黄色）
- ✅ 楼梯 3D 模型 (`stairs-model.ts`)
  - 踏板和踢面
  - 扶手柱子
  - 倾斜扶手管
  - 木质材质
- ✅ 服务台 3D 模型 (`service-desk-model.ts`)
  - 服务台主体和台面
  - 标识牌（发光效果）
  - 电脑显示器和屏幕
  - 地板
- ✅ 洗手间 3D 模型 (`restroom-model.ts`)
  - 墙壁和瓷砖地板
  - 厕所隔间和门
  - 马桶
  - 洗手台和洗手盆
  - 水龙头
  - 镜子

**资源管理模块 (`builder/resources/`)**
- ✅ 资源管理器 (`resource-manager.ts`)
  - 复用 engine 层的 MaterialManager 和 GeometryFactory
  - 单例模式管理材质和几何体缓存
  - 20+ 种预定义共享材质函数
  - 几何体缓存（Box、Cylinder、TaperedCylinder）
  - 动态材质创建（指示灯、标识牌、发光效果）
  - 统一资源清理函数 `disposeBuilderResources()`
  - 缓存统计函数 `getResourceStats()`

**MallBuilderView.vue 功能增强**
- ✅ 可折叠左侧面板
  - 楼层面板和材质面板合并到左侧容器
  - 折叠按钮（箭头图标）
  - 平滑过渡动画（0.3s）
  - 场景说明跟随折叠状态
- ✅ 场景说明可隐藏
  - 添加关闭按钮
  - `showSceneLegend` 状态控制
- ✅ 第一人称漫游模式
  - WASD 键移动
  - 鼠标控制视角（requestPointerLock API）
  - 玩家高度 1.7m
  - 移动速度 8
  - 鼠标灵敏度 0.002
  - ESC 解锁鼠标，点击画布重新锁定
- ✅ 楼层切换优化
  - 漫游模式只显示当前楼层
  - 非当前楼层只显示轮廓线
  - 切换楼层时更新相机 Y 位置
- ✅ 楼梯连接限制
  - 楼梯必须连接恰好两个相邻楼层
  - 电梯和扶梯可连接任意楼层
  - `canConfirmConnection` 计算属性验证
- ✅ 区域选择优化
  - 支持选择 3D 模型（Group 内的子对象）
  - `raycastAreas()` 使用 `scene.traverse()` 递归查找
  - 向上遍历父对象查找 `areaId`

---

#### P-0. 商城建模器（Mall Builder）

**3D 建模器核心功能**
- ✅ 项目创建向导（模板选择：矩形、L形、U形、T形、圆形）
- ✅ 自定义商城轮廓绘制（多边形工具）
- ✅ 楼层管理（添加、删除、切换、可见性控制）
- ✅ 区域绘制（矩形工具、多边形工具）
- ✅ 区域属性编辑（名称、类型、颜色）
- ✅ 重叠检测和边界验证
- ✅ 历史记录（撤销/重做，最多50步）
- ✅ 项目导出/导入（JSON格式）
- ✅ 背景图片导入（参考图辅助绘制）

**3D 渲染与交互**
- ✅ Three.js 场景初始化（深色主题 `#0a0a0a`）
- ✅ 轨道控制器（OrbitControls）- 仅平移工具模式启用
- ✅ 楼层 3D 渲染（透明方块，支持多层堆叠）
- ✅ 商城轮廓渲染（蓝色边框）
- ✅ 区域 3D 渲染（彩色方块，支持选中高亮）
- ✅ 当前楼层高亮效果（蓝色，更高透明度）
- ✅ 场景说明图例（左下角浮动面板）

**模板系统**
- ✅ 矩形商城模板（100x80，3层）
- ✅ L形商城模板（120x100，3层）
- ✅ U形商城模板（120x100，3层）
- ✅ T形商城模板（120x100，3层）
- ✅ 圆形商城模板（半径50，32边形近似，3层）
- ✅ 所有模板轮廓居中生成（以原点为中心）

**几何计算模块**
- ✅ 多边形面积计算（Shoelace 公式）
- ✅ 多边形周长计算
- ✅ 点在多边形内检测（射线法）
- ✅ 多边形包含检测
- ✅ 多边形重叠检测（SAT 分离轴定理）
- ✅ 网格对齐（snapToGrid）

**工具栏**
- ✅ 选择工具（V）- 点击选中区域
- ✅ 平移工具 - 启用相机旋转/缩放/平移
- ✅ 矩形绘制工具（R）
- ✅ 多边形绘制工具（P）
- ✅ 轮廓绘制工具
- ✅ 重置轮廓工具
- ✅ 重置视图按钮
- ✅ 撤销/重做按钮

**UI/UX 改进**
- ✅ 深色主题设计（与登录页一致）
- ✅ 毛玻璃效果面板
- ✅ SVG 图标（无 emoji）
- ✅ 快捷键支持（V/R/P/Del/Ctrl+Z/Ctrl+S/Esc）
- ✅ 底部状态栏（当前楼层、区域数量、快捷键提示）
- ✅ 帮助面板（使用指南）

**属性测试（Property-Based Testing）**
- ✅ 多边形面积计算属性测试
- ✅ 多边形周长计算属性测试
- ✅ 点在多边形内检测属性测试
- ✅ 模板生成属性测试
- ✅ 绘图工具状态机属性测试
- ✅ 背景图片状态管理属性测试
- ✅ 3D 渲染函数属性测试

---

### Fixed - 问题修复

#### 商城建模器修复

**3D 模型位置问题**
- ✅ 修复 3D 模型位置错误
  - `getAreaCenter()` 返回 `{x, z}`，不是 `{x, y}`
  - 修正 `group.position.set(center.x, yPosition, center.z)`

**第一人称移动方向问题**
- ✅ 修复 A/D 键移动方向相反
  - 修正 `velocity.x` 计算逻辑
  - 修正 `cam.position.addScaledVector(right, velocity.x)`

**区域选择问题**
- ✅ 修复工具选择模式无法选中 3D 模型
  - `raycastAreas()` 改用递归检测
  - 添加父对象遍历查找 `areaId`

**轮廓居中问题**
- ✅ 修复 `createEmptyProject` 默认轮廓未居中问题
  - 原：`(0,0)` 到 `(100,100)`
  - 现：`(-50,-50)` 到 `(50,50)`
- ✅ 修复所有模板生成函数，确保轮廓以原点为中心
  - `generateRectangle()` - 使用 `-halfW/-halfH` 到 `halfW/halfH`
  - `generateLShape()` - 居中计算
  - `generateUShape()` - 居中计算
  - `generateTShape()` - 居中计算
  - `generateCircle()` - 移除中心偏移

**相机控制问题**
- ✅ 修复相机控制在所有工具模式下都启用的问题
  - 现在只有平移工具模式才启用 OrbitControls
  - 其他工具模式下禁用相机控制，避免干扰绘制操作

**视图初始化问题**
- ✅ 优化初始相机位置：`(0, 100, 60)` 看向 `(0, 6, 0)`
- ✅ 缩小网格范围：60x60（原100x100）
- ✅ 缩小地板范围：70x70（原100x100）

**缩放与绘制问题**
- ✅ 修复相机缩放限制过小问题
  - `minDistance`: 20 → 10（允许更近距离观察）
  - `maxDistance`: 200 → 500（允许更远距离查看全貌）
- ✅ 修复轮廓绘制预览线 Y 坐标
  - 预览线 Y 位置：0.1 → 0.05（更贴近地面，减少视觉偏差）

---

### Changed - 变更

#### Builder 模块重构
- ✅ 3D 模型代码从 MallBuilderView.vue 提取到独立文件
  - `builder/objects/` 目录存放所有 3D 模型
  - 每个模型一个文件，职责清晰
- ✅ 资源管理代码提取到独立模块
  - `builder/resources/` 目录存放资源管理功能
  - 复用 engine 层的 MaterialManager 和 GeometryFactory
  - 避免重复创建材质和几何体

#### 楼层渲染改进
- ✅ 当前选中楼层使用蓝色高亮（`0x60a5fa`）
- ✅ 当前楼层透明度提高（0.4 vs 0.2）
- ✅ 非当前楼层使用默认灰色，透明度降低

---

## [Previous] - 2026-01-01

### Added - 新增功能

#### P-0. UI 风格统一化（Gemini/Linear 风格）

**全局设计系统更新**
- ✅ 移除所有 emoji 图标，采用纯 SVG 图标
- ✅ 统一深色主题背景色 `#0a0a0a`
- ✅ 添加渐变光晕背景效果
- ✅ 实现毛玻璃效果（backdrop-blur）
- ✅ 卡片样式：`rgba(255, 255, 255, 0.02)` 背景 + `rgba(255, 255, 255, 0.08)` 边框
- ✅ 主强调色：`#8ab4f8`（蓝色）

**组件更新**
- ✅ `StatCard.vue` - 移除 icon prop，纯数字展示
- ✅ `QuickActionCard.vue` - 移除 icon/color props，文字+箭头样式
- ✅ `DataTable.vue` - 空状态使用 SVG 图标替代 emoji
- ✅ `Modal.vue` - 添加毛玻璃效果，优化样式

**布局组件更新**
- ✅ `DashboardLayout.vue` - SVG logo，移除 emoji 菜单图标，毛玻璃效果
- ✅ `AdminLayout.vue` - 完整深色主题，渐变强调色，SVG logo
- ✅ `MerchantLayout.vue` - 粉橙渐变主题，SVG logo
- ✅ `MainLayout.vue` - 统一头部样式，SVG logo

**页面更新**
- ✅ `MallView.vue` - 渐变背景，移除 emoji
- ✅ `admin/DashboardView.vue` - 移除 emoji 图标
- ✅ `merchant/DashboardView.vue` - 移除 emoji，渐变欢迎区
- ✅ `user/ProfileView.vue` - emoji 替换为 SVG 图标

---

#### P-0. 布局嵌套问题修复

**问题描述**
- 子视图内部使用 `DashboardLayout` 组件，而父路由已使用布局组件
- 导致双重导航栏和重复 UI 元素

**修复内容**
- ✅ `admin/DashboardView.vue` - 移除 DashboardLayout 包装
- ✅ `admin/LayoutVersionView.vue` - 移除 DashboardLayout 包装
- ✅ `admin/MallManageView.vue` - 移除 DashboardLayout 包装
- ✅ `admin/AreaApprovalView.vue` - 移除 DashboardLayout 包装
- ✅ `merchant/DashboardView.vue` - 移除 DashboardLayout 包装
- ✅ `merchant/StoreConfigView.vue` - 移除 DashboardLayout 包装
- ✅ `merchant/AreaApplyView.vue` - 移除 DashboardLayout 包装
- ✅ `user/ProfileView.vue` - 移除 DashboardLayout 包装

---

#### P-0. 主页/仪表盘页面

**MallView.vue 重构**
- ✅ 完整的仪表盘布局（侧边栏 + 顶部栏 + 内容区）
- ✅ 可折叠侧边栏导航
- ✅ 根据用户角色动态显示菜单项
- ✅ 欢迎区域（时间问候语 + 用户名）
- ✅ 统计卡片（根据角色显示不同数据）
- ✅ 快捷入口（根据角色显示不同功能）
- ✅ 用户信息展示（头像、用户名、角色）
- ✅ 登出功能
- ✅ 深色主题 UI 设计
- ✅ 响应式布局支持

**功能特性**
- 管理员视图：商城总数、店铺总数、待审批、在线用户
- 商家视图：我的店铺、商品数量、今日访客、待处理
- 用户视图：收藏店铺、浏览记录、我的订单、优惠券
- 快捷入口根据角色动态配置

---

#### P-1. 用户注册功能

**注册 API 模块**
- ✅ 创建 `register.api.ts` 注册 API 封装
  - `register()`: 用户注册
  - `checkUsername()`: 检查用户名可用性
  - `checkEmail()`: 检查邮箱可用性
- ✅ 更新 `api/index.ts` 导出注册 API

**注册页面 (RegisterView.vue)**
- ✅ 实现注册表单（用户名、邮箱、密码、确认密码、手机号）
- ✅ 实时表单验证
  - 用户名：3-20字符，字母数字下划线
  - 邮箱：格式验证
  - 密码：至少6位
  - 确认密码：一致性验证
  - 手机号：可选，格式验证
- ✅ 防抖检查用户名/邮箱可用性（500ms）
- ✅ 可用性检查加载状态和结果显示
- ✅ 注册成功后 2 秒自动跳转登录页
- ✅ 深色主题 UI 设计（与登录页一致）
- ✅ 左侧品牌面板展示功能特点
- ✅ 响应式布局支持

**路由配置**
- ✅ 添加 `/register` 路由
- ✅ 更新登录页面"创建账号"链接为 router-link

---

#### P-1. 密码管理功能

**密码管理 API 模块**
- ✅ 创建 `password.api.ts` 密码管理 API 封装
  - `forgotPassword()`: 忘记密码，发送重置链接
  - `verifyResetToken()`: 验证重置令牌有效性
  - `resetPassword()`: 重置密码
  - `changePassword()`: 修改密码（需登录）
- ✅ 更新 `api/index.ts` 导出密码管理 API

**忘记密码页面 (ForgotPasswordView.vue)**
- ✅ 实现邮箱输入表单
- ✅ 邮箱格式验证
- ✅ 提交状态管理（loading/success/error）
- ✅ 成功状态展示（邮件已发送提示）
- ✅ 返回登录链接
- ✅ 深色主题 UI 设计（与登录页一致）
- ✅ 响应式布局支持

**重置密码页面 (ResetPasswordView.vue)**
- ✅ URL 参数获取重置令牌
- ✅ 页面加载时自动验证令牌
- ✅ 令牌验证中加载状态
- ✅ 令牌无效错误状态（含重新申请入口）
- ✅ 新密码输入表单（密码 + 确认密码）
- ✅ 密码长度验证（最少6位）
- ✅ 密码一致性验证
- ✅ 重置成功状态展示（含前往登录入口）
- ✅ 深色主题 UI 设计
- ✅ 响应式布局支持

**路由配置**
- ✅ 添加 `/forgot-password` 路由
- ✅ 添加 `/reset-password` 路由（支持 token 查询参数）
- ✅ 更新登录页面忘记密码链接为 router-link

**UI/UX 特性**
- ✅ 统一的深色主题设计
- ✅ 渐变色按钮（蓝紫渐变）
- ✅ 输入框图标前缀
- ✅ 聚焦状态高亮
- ✅ 加载状态 spinner
- ✅ 成功/错误状态图标
- ✅ 移动端响应式适配

---

## [Previous] - 2024-12-29

### Added - 新增功能

#### P-0. 主页/仪表盘页面

**MallView.vue 重构**
- ✅ 完整的仪表盘布局（侧边栏 + 顶部栏 + 内容区）
- ✅ 可折叠侧边栏导航
- ✅ 根据用户角色动态显示菜单项
- ✅ 欢迎区域（时间问候语 + 用户名）
- ✅ 统计卡片（根据角色显示不同数据）
- ✅ 快捷入口（根据角色显示不同功能）
- ✅ 用户信息展示（头像、用户名、角色）
- ✅ 登出功能
- ✅ 深色主题 UI 设计
- ✅ 响应式布局支持

**功能特性**
- 管理员视图：商城总数、店铺总数、待审批、在线用户
- 商家视图：我的店铺、商品数量、今日访客、待处理
- 用户视图：收藏店铺、浏览记录、我的订单、优惠券
- 快捷入口根据角色动态配置

---

## [Previous] - 2024-12-20

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
