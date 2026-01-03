# Requirements Document

## Introduction

本需求文档定义前端核心页面的重构与实现，包括个人中心、管理员控制台、商家工作台等页面。所有页面需遵循统一的深色主题设计规范，与已完成的登录页、仪表盘保持视觉一致性。

## Glossary

- **Mall_System**: 智能商城前端系统
- **Profile_Page**: 个人中心页面，用于查看和编辑用户信息
- **Admin_Dashboard**: 管理员控制台，展示系统级统计和管理入口
- **Merchant_Dashboard**: 商家工作台，展示商家相关数据和操作入口
- **Dark_Theme**: 深色主题设计，背景色 #0a0a0a，卡片色 #111113
- **Layout_Shell**: 布局外壳组件，提供侧边栏和顶部栏的统一布局

## Requirements

### Requirement 1: 布局外壳组件

**User Story:** As a 开发者, I want 一个可复用的布局外壳组件, so that 所有内部页面可以共享统一的侧边栏和顶部栏布局

#### Acceptance Criteria

1. THE Mall_System SHALL 提供 DashboardLayout 布局组件
2. THE DashboardLayout SHALL 包含可折叠的侧边栏导航
3. THE DashboardLayout SHALL 包含顶部栏（页面标题、用户信息）
4. THE DashboardLayout SHALL 根据用户角色动态显示菜单项
5. THE DashboardLayout SHALL 提供 slot 用于插入页面内容
6. THE DashboardLayout SHALL 提供登出功能
7. WHEN 用户点击菜单项 THEN THE Mall_System SHALL 导航到对应页面并高亮当前菜单
8. THE DashboardLayout SHALL 使用深色主题设计（背景 #0a0a0a）

---

### Requirement 2: 个人中心页面

**User Story:** As a 用户, I want 查看和编辑我的个人信息, so that 我可以管理我的账户资料

#### Acceptance Criteria

1. WHEN 用户访问个人中心 THEN THE Profile_Page SHALL 显示用户基本信息（用户名、邮箱、手机号、角色）
2. THE Profile_Page SHALL 显示用户头像（首字母或上传的图片）
3. THE Profile_Page SHALL 提供编辑个人信息的功能
4. WHEN 用户点击编辑 THEN THE Profile_Page SHALL 切换到编辑模式
5. WHEN 用户保存修改 THEN THE Mall_System SHALL 调用 API 更新用户信息
6. IF 更新成功 THEN THE Profile_Page SHALL 显示成功提示并退出编辑模式
7. IF 更新失败 THEN THE Profile_Page SHALL 显示错误信息
8. THE Profile_Page SHALL 提供修改密码入口
9. WHEN 用户点击修改密码 THEN THE Mall_System SHALL 显示修改密码表单
10. THE Profile_Page SHALL 使用深色主题设计

---

### Requirement 3: 管理员控制台

**User Story:** As a 管理员, I want 查看系统整体状态和快捷操作入口, so that 我可以高效管理商城

#### Acceptance Criteria

1. WHEN 管理员访问控制台 THEN THE Admin_Dashboard SHALL 显示系统统计数据
2. THE Admin_Dashboard SHALL 显示商家总数、店铺总数、待审批数量、在线用户数
3. THE Admin_Dashboard SHALL 显示最近的审批请求列表
4. THE Admin_Dashboard SHALL 提供快捷操作入口（商城管理、区域审批、版本管理）
5. WHEN 管理员点击快捷入口 THEN THE Mall_System SHALL 导航到对应页面
6. THE Admin_Dashboard SHALL 显示系统公告或通知区域
7. THE Admin_Dashboard SHALL 使用深色主题设计

---

### Requirement 4: 商家工作台

**User Story:** As a 商家, I want 查看我的店铺状态和待办事项, so that 我可以高效管理我的业务

#### Acceptance Criteria

1. WHEN 商家访问工作台 THEN THE Merchant_Dashboard SHALL 显示欢迎信息和商家统计
2. THE Merchant_Dashboard SHALL 显示我的店铺数量、商品数量、今日访客、待处理事项
3. THE Merchant_Dashboard SHALL 显示我的店铺列表（简要信息）
4. THE Merchant_Dashboard SHALL 显示区域申请状态
5. THE Merchant_Dashboard SHALL 提供快捷操作入口（店铺配置、区域申请、建模工具）
6. WHEN 商家点击快捷入口 THEN THE Mall_System SHALL 导航到对应页面
7. THE Merchant_Dashboard SHALL 使用深色主题设计

---

### Requirement 5: 3D 商城入口页面

**User Story:** As a 用户, I want 进入 3D 商城空间, so that 我可以浏览和探索虚拟商城

#### Acceptance Criteria

1. WHEN 用户访问 3D 商城页面 THEN THE Mall_System SHALL 初始化 Three.js 渲染引擎
2. THE Mall_System SHALL 显示加载进度指示器
3. WHEN 场景加载完成 THEN THE Mall_System SHALL 显示 3D 商城场景
4. THE Mall_System SHALL 提供楼层切换控件
5. THE Mall_System SHALL 提供搜索店铺功能
6. THE Mall_System SHALL 提供返回仪表盘的入口
7. WHEN 用户点击店铺 THEN THE Mall_System SHALL 显示店铺详情面板
8. THE Mall_System SHALL 在场景上方显示迷你地图或导航提示

---

### Requirement 6: 区域审批页面（管理员）

**User Story:** As a 管理员, I want 审批商家的区域申请, so that 我可以控制商城区域的分配

#### Acceptance Criteria

1. WHEN 管理员访问区域审批页面 THEN THE Mall_System SHALL 显示待审批申请列表
2. THE Mall_System SHALL 显示每个申请的商家信息、申请区域、申请理由、申请时间
3. THE Mall_System SHALL 提供筛选功能（按状态、按时间）
4. WHEN 管理员点击申请 THEN THE Mall_System SHALL 显示申请详情
5. THE Mall_System SHALL 提供通过、拒绝两个操作按钮
6. WHEN 管理员拒绝申请 THEN THE Mall_System SHALL 要求填写拒绝理由
7. WHEN 审批操作完成 THEN THE Mall_System SHALL 更新列表并显示操作结果
8. THE Mall_System SHALL 使用深色主题设计

---

### Requirement 7: 区域申请页面（商家）

**User Story:** As a 商家, I want 申请商城区域的建模权限, so that 我可以在该区域开设店铺

#### Acceptance Criteria

1. WHEN 商家访问区域申请页面 THEN THE Mall_System SHALL 显示可申请的区域列表
2. THE Mall_System SHALL 显示每个区域的位置、面积、状态
3. THE Mall_System SHALL 用不同颜色标识区域状态（可申请、审批中、已占用）
4. WHEN 商家点击可申请区域 THEN THE Mall_System SHALL 显示申请表单
5. THE Mall_System SHALL 要求填写申请理由
6. WHEN 商家提交申请 THEN THE Mall_System SHALL 调用 API 创建申请
7. IF 提交成功 THEN THE Mall_System SHALL 显示成功提示并更新区域状态
8. THE Mall_System SHALL 显示我的申请历史
9. THE Mall_System SHALL 使用深色主题设计

---

### Requirement 8: 店铺配置页面（商家）

**User Story:** As a 商家, I want 配置我的店铺信息, so that 用户可以了解我的店铺

#### Acceptance Criteria

1. WHEN 商家访问店铺配置页面 THEN THE Mall_System SHALL 显示我的店铺列表
2. WHEN 商家选择店铺 THEN THE Mall_System SHALL 显示店铺配置表单
3. THE Mall_System SHALL 允许编辑店铺名称、描述、分类、营业时间
4. THE Mall_System SHALL 允许上传店铺 Logo 和封面图
5. THE Mall_System SHALL 显示店铺的商品列表
6. THE Mall_System SHALL 提供添加/编辑/删除商品的功能
7. WHEN 商家保存配置 THEN THE Mall_System SHALL 调用 API 更新店铺信息
8. THE Mall_System SHALL 使用深色主题设计

---

### Requirement 9: 商城管理页面（管理员）

**User Story:** As a 管理员, I want 管理商城的基础结构, so that 我可以配置楼层和区域

#### Acceptance Criteria

1. WHEN 管理员访问商城管理页面 THEN THE Mall_System SHALL 显示商城结构树
2. THE Mall_System SHALL 显示楼层列表和每个楼层的区域
3. THE Mall_System SHALL 提供添加/编辑/删除楼层的功能
4. THE Mall_System SHALL 提供添加/编辑/删除区域的功能
5. WHEN 管理员编辑区域 THEN THE Mall_System SHALL 允许设置区域名称、类型、坐标范围
6. THE Mall_System SHALL 显示每个区域的当前状态和授权商家
7. THE Mall_System SHALL 使用深色主题设计

---

### Requirement 10: 版本管理页面（管理员）

**User Story:** As a 管理员, I want 管理商城布局的版本, so that 我可以控制发布和回滚

#### Acceptance Criteria

1. WHEN 管理员访问版本管理页面 THEN THE Mall_System SHALL 显示版本列表
2. THE Mall_System SHALL 显示每个版本的版本号、状态、创建时间、创建者
3. THE Mall_System SHALL 用不同标识区分 DRAFT、ACTIVE、ARCHIVED 状态
4. THE Mall_System SHALL 提供发布草稿版本的功能
5. THE Mall_System SHALL 提供回滚到历史版本的功能
6. WHEN 管理员点击版本 THEN THE Mall_System SHALL 显示版本详情和变更内容
7. THE Mall_System SHALL 提供版本对比功能
8. THE Mall_System SHALL 使用深色主题设计

