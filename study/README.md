# 智能商城导购系统 - 学习路线

> 本目录采用苏格拉底式教学法，通过提问引导你思考每个功能模块的实现原理。
> 
> 假设你已掌握 Vue 3、TypeScript、Three.js 的基本语法。

## 技术栈

- **前端框架**：Vue 3 + TypeScript + Vite
- **UI 框架**：Element Plus（已集成）
- **样式系统**：SCSS（嵌套语法 + 设计令牌）
- **状态管理**：Pinia
- **3D 引擎**：Three.js
- **后端框架**：Spring Boot 3.x + MyBatis-Plus
- **数据库**：PostgreSQL + Redis

## 前端设计原则

项目遵循以下优先级进行 UI 开发：

1. **优先使用 Element Plus 组件**：ElButton、ElCard、ElTable、ElForm、ElDialog 等
2. **使用 HTML5 语义化标签**：main、section、article、header、footer、nav、aside、hgroup
3. **使用 SCSS 嵌套语法**：所有样式采用嵌套写法，提高可读性和可维护性

### SCSS 样式系统

项目包含完整的 SCSS 设计系统（`src/assets/styles/scss/`）：

| 文件 | 说明 |
|------|------|
| `_variables.scss` | 设计令牌（颜色、间距、字体、阴影、断点） |
| `_mixins.scss` | 可复用混入（响应式、Flexbox、Grid、定位） |
| `_animations.scss` | 关键帧动画和工具类 |
| `_utilities.scss` | 工具类（显示、间距、尺寸、文本、背景） |
| `_components.scss` | 组件样式（按钮、卡片、输入框、徽章） |
| `_base.scss` | 重置和基础元素样式 |
| `main.scss` | 主入口文件，包含 Element Plus 覆盖样式 |

## 学习顺序建议

### 第一阶段：基础功能
1. **01-login** - 登录功能（表单验证、API 调用、路由守卫）
2. **02-register** - 注册功能（实时验证、防抖检查）
3. **03-password-reset** - 密码重置（Token 验证流程）

### 第二阶段：布局与导航
4. **04-layouts** - 布局系统（嵌套路由、角色布局）
5. **05-dashboard** - 仪表盘（角色权限、动态内容）

### 第三阶段：3D 引擎基础
6. **06-three-engine** - Three.js 引擎封装（场景、相机、渲染循环）
7. **07-materials** - 材质管理（缓存、复用）
8. **08-camera-controls** - 相机控制（轨道、跟随）

### 第四阶段：商城建模器
9. **09-mall-builder-basics** - 建模器基础（模板、楼层、区域）
10. **10-3d-models** - 3D 模型创建（电梯、扶梯、家具）
11. **11-roaming-mode** - 漫游模式（第三人称、碰撞检测）

### 第五阶段：架构与进阶
12. **12-backend-architecture** - 后端架构（DDD 分层、Spring Boot、MyBatis-Plus）
13. **13-api-layer** - API 层（Axios 封装、拦截器、Token 管理）
14. **14-state-management** - 状态管理（Pinia stores、持久化）
15. **15-routing-system** - 路由系统（动态路由、路由守卫、权限控制）
16. **16-domain-model** - 领域模型（语义对象、事件总线、权限模型）
17. **17-protocol-layer** - 协议层（Action/Result 协议、数据契约）
18. **18-element-plus** - Element Plus 组件（组件封装、表单验证）
19. **19-mall-builder-persistence** - 建模器持久化（后端 API、数据库设计）

---

## 组件化架构

项目采用高度组件化的架构，减少代码重复：

### 认证组件 (`@/components/auth/`)

| 组件 | 说明 | Element Plus 组件 | 跳转 |
|------|------|------------------|------|
| `AuthLayout` | 认证页面统一布局 | ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/auth/AuthLayout.vue) |
| `AuthFormCard` | 表单卡片容器 | ElCard | [查看](../apps/frontend/SMART-MALL/src/components/auth/AuthFormCard.vue) |
| `AuthInput` | 带图标、验证状态的输入框 | ElInput, ElIcon, ElFormItem | [查看](../apps/frontend/SMART-MALL/src/components/auth/AuthInput.vue) |
| `AuthButton` | 带加载状态的主按钮 | ElButton, ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/auth/AuthButton.vue) |
| `AlertMessage` | 错误/成功/警告提示 | ElAlert | [查看](../apps/frontend/SMART-MALL/src/components/auth/AlertMessage.vue) |
| `TypewriterCard` | 打字机效果卡片 | ElCard | [查看](../apps/frontend/SMART-MALL/src/components/auth/TypewriterCard.vue) |
| `SocialLogin` | 第三方登录按钮组 | ElButton, ElDivider, ElSpace, ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/auth/SocialLogin.vue) |
| `FeatureList` | 功能特点列表 | ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/auth/FeatureList.vue) |

### 共享组件 (`@/components/shared/`)

| 组件 | 说明 | Element Plus 组件 | 跳转 |
|------|------|------------------|------|
| `StatCard` | 统计卡片 | ElCard, ElStatistic, ElTag, ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/shared/StatCard.vue) |
| `QuickActionCard` | 快捷操作卡片 | ElCard, ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/shared/QuickActionCard.vue) |
| `DataTable` | 数据表格 | ElTable, ElTableColumn, ElEmpty, ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/shared/DataTable.vue) |
| `Modal` | 模态框 | ElDialog, ElButton, ElSpace | [查看](../apps/frontend/SMART-MALL/src/components/shared/Modal.vue) |
| `CustomSelect` | 自定义选择器 | ElSelect, ElOption, ElIcon | [查看](../apps/frontend/SMART-MALL/src/components/common/CustomSelect.vue) |

### 布局组件 (`@/views/layouts/`)

| 组件 | 说明 | Element Plus 组件 | 跳转 |
|------|------|------------------|------|
| `AdminLayout` | 管理员布局 | ElContainer, ElAside, ElHeader, ElMain, ElMenu, ElMenuItem, ElButton, ElIcon, ElTag | [查看](../apps/frontend/SMART-MALL/src/views/layouts/AdminLayout.vue) |
| `MerchantLayout` | 商户布局 | ElContainer, ElAside, ElHeader, ElMain, ElMenu, ElMenuItem, ElButton, ElIcon, ElTag | [查看](../apps/frontend/SMART-MALL/src/views/layouts/MerchantLayout.vue) |
| `MainLayout` | 主布局 | ElContainer, ElHeader, ElMain, ElMenu, ElMenuItem, ElButton, ElIcon | [查看](../apps/frontend/SMART-MALL/src/views/layouts/MainLayout.vue) |

---

## 学习方法

每个模块包含：
- `README.md` - 苏格拉底式问答，引导你思考
- `code-analysis.md` - 关键代码分析
- `exercises.md` - 动手练习（可选）

**学习建议**：
1. 先阅读问答，尝试自己回答
2. 对照代码验证你的想法
3. 动手修改代码，观察效果

**代码风格要点**：
1. 优先使用 Element Plus 组件替代原生 HTML
2. 使用 HTML5 语义化标签（main、section、article、header、footer、nav、aside）
3. 样式使用 SCSS 嵌套语法，避免扁平 CSS
4. 使用 `:deep()` 穿透 Element Plus 组件样式

---

*"我唯一知道的，就是我一无所知。" —— 苏格拉底*
