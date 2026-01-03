# 已知问题（KNOWN_ISSUES.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端已知问题
> 
> 本文档为 **已知问题清单（Known Issues）**，用于记录当前存在的问题、限制及临时解决方案。
> 
> 最后更新：2026-01-02

---

## 问题状态说明

- 🔴 **Critical** - 严重问题，阻塞开发或影响核心功能
- 🟠 **Major** - 重要问题，需要尽快解决
- 🟡 **Minor** - 次要问题，可以延后处理
- 🟢 **Resolved** - 已解决

---

## 当前问题列表

### P2. 渲染引擎层

#### 🟡 ISSUE-001: 相机动画缺少 TWEEN 库支持

**描述：** OrbitController 的 `animateTo` 方法目前未实现，需要引入 TWEEN.js 或自定义插值逻辑。

**影响范围：** 相机平滑过渡动画

**临时方案：** 暂时使用直接设置相机位置的方式

**计划解决：** P3 领域场景层实现时一并处理

---

#### 🟡 ISSUE-002: 高亮效果仅支持 MeshStandardMaterial

**描述：** `HighlightEffect` 类使用 `emissive` 属性实现高亮，该属性仅在 `MeshStandardMaterial` 和 `MeshPhysicalMaterial` 上有效。

**影响范围：** 使用 `MeshBasicMaterial` 或其他材质的对象无法高亮

**临时方案：** 确保所有需要高亮的对象使用 `MeshStandardMaterial`

**计划解决：** 可考虑使用 OutlinePass 或其他后处理效果作为备选方案

---

#### 🟡 ISSUE-003: SceneEventEmitter 未实现 enter/leave 事件

**描述：** 当前 `SceneEventEmitter` 仅实现了 `click` 和 `hover` 事件，尚未实现区域进入/离开事件。

**影响范围：** 需求 11.3、11.4 的区域检测功能

**临时方案：** 暂无

**计划解决：** P3 领域场景层实现时添加区域检测逻辑

---

### P0. 项目基础设施

#### 🟡 ISSUE-004: 测试环境未配置

**描述：** Vitest 和 fast-check 属性测试框架尚未配置完成。

**影响范围：** 无法运行单元测试和属性测试

**临时方案：** 手动测试功能

**计划解决：** 在开始 P3 之前完成测试环境配置

---

## 已解决问题

### 🟢 ISSUE-007: 商城建模器轮廓未居中

**描述：** `createEmptyProject` 默认轮廓从 `(0,0)` 到 `(100,100)`，导致商城轮廓与楼层不对齐。

**影响范围：** 商城建模器初始化视图

**解决方案：** 
- 修改默认轮廓为 `(-50,-50)` 到 `(50,50)`，以原点为中心
- 所有模板生成函数也已修复为居中生成

**解决日期：** 2026-01-02

**修改文件：**
- `src/builder/types/mall-project.ts`
- `src/builder/templates/mall-templates.ts`

---

### 🟢 ISSUE-008: 相机控制在所有工具模式下都启用

**描述：** OrbitControls 在所有工具模式下都启用，导致绘制操作时相机会意外移动。

**影响范围：** 商城建模器绘制功能

**解决方案：** 
- 修改 `setTool()` 函数，只有在平移工具模式下才启用 OrbitControls
- 其他工具模式下禁用相机控制

**解决日期：** 2026-01-02

**修改文件：**
- `src/views/admin/MallBuilderView.vue`

---

### 🟢 ISSUE-009: 建模器初始视图不直观

**描述：** 初始相机位置和网格/地板大小不合适，导致用户进入建模器时看到的视图不直观。

**影响范围：** 商城建模器用户体验

**解决方案：** 
- 优化初始相机位置：`(0, 100, 60)` 看向 `(0, 6, 0)`
- 缩小网格范围：60x60（原100x100）
- 缩小地板范围：70x70（原100x100）

**解决日期：** 2026-01-02

**修改文件：**
- `src/views/admin/MallBuilderView.vue`

---

### 🟢 ISSUE-005: 布局组件嵌套导致重复 UI

**描述：** 子视图内部使用 `DashboardLayout` 组件，而父路由已使用布局组件（AdminLayout、MerchantLayout），导致双重导航栏和重复 UI 元素。

**影响范围：** 管理员、商家、用户页面

**解决方案：** 移除所有子视图中的 `DashboardLayout` 包装，让父路由的布局组件统一处理。

**解决日期：** 2026-01-01

**修改文件：**
- `views/admin/DashboardView.vue`
- `views/admin/LayoutVersionView.vue`
- `views/admin/MallManageView.vue`
- `views/admin/AreaApprovalView.vue`
- `views/merchant/DashboardView.vue`
- `views/merchant/StoreConfigView.vue`
- `views/merchant/AreaApplyView.vue`
- `views/user/ProfileView.vue`

---

### 🟢 ISSUE-006: UI 风格不统一

**描述：** 各页面使用 emoji 图标，风格与登录页的 Gemini/Linear 风格不一致。

**影响范围：** 全局 UI 一致性

**解决方案：** 
- 移除所有 emoji 图标，替换为 SVG 图标
- 统一深色主题背景色 `#0a0a0a`
- 添加毛玻璃效果和渐变光晕背景
- 更新所有布局组件和共享组件

**解决日期：** 2026-01-01

---

## 技术债务

### TD-001: ThreeEngine 类职责过重

**描述：** 当前 `ThreeEngine` 类包含了场景管理、渲染循环、对象添加等多个职责，随着功能增加可能变得难以维护。

**建议：** 考虑将对象管理功能拆分到独立的 `ObjectManager` 类中。

**优先级：** 低

---

### TD-002: 缺少类型守卫函数

**描述：** `src/utils/guards.ts` 中的类型守卫函数尚未实现。

**影响：** 运行时类型检查不完善

**优先级：** 中

---

### TD-003: DashboardLayout 组件可能废弃

**描述：** `components/layouts/DashboardLayout.vue` 已被 `views/layouts/` 下的布局组件替代，但仍保留在代码库中。

**建议：** 确认无其他地方使用后，考虑删除该组件。

**优先级：** 低

---

### TD-004: API 层部分接口使用 Mock 数据

**描述：** 以下 API 文件仍使用 mock 数据，待后端实现对应 Controller 后需要更新：
- `admin.api.ts` - 管理员统计、审批接口
- `merchant.api.ts` - 商家统计、店铺、区域申请接口
- `mall-manage.api.ts` - 楼层、区域、版本管理接口
- `user.api.ts` - 用户资料接口（临时从 localStorage 读取）

**已完成对接：**
- `auth.api.ts` - 登录、登出、刷新 Token
- `register.api.ts` - 注册、用户名/邮箱检查
- `password.api.ts` - 忘记密码、重置密码、修改密码

**优先级：** 中

---

### TD-005: 商城建模器项目持久化

**描述：** 当前商城建模器项目数据仅保存在内存中，刷新页面后丢失。需要实现：
- 项目自动保存到 localStorage
- 项目导出/导入功能（已实现 JSON 格式）
- 后端 API 对接保存到数据库

**优先级：** 中

---

### TD-006: 商城建模器区域编辑功能

**描述：** 当前区域绘制后无法直接编辑顶点位置，只能删除重绘。需要实现：
- 区域顶点拖拽编辑
- 区域移动功能
- 区域缩放功能

**优先级：** 低

---