# Implementation Plan: Frontend Core Pages

## Overview

本任务列表定义前端核心页面的实现步骤。采用渐进式开发，先完成基础布局组件，再逐步实现各个页面。所有页面使用统一的深色主题设计。

## Tasks

- [x] 1. 创建共享组件和布局
  - [x] 1.1 创建 DashboardLayout 布局组件
    - 从 MallView.vue 提取布局逻辑
    - 实现可折叠侧边栏
    - 实现顶部栏（页面标题、用户信息）
    - 实现角色菜单过滤
    - 提供 default slot 用于页面内容
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 1.2 创建共享 UI 组件
    - 创建 StatCard.vue 统计卡片组件
    - 创建 QuickActionCard.vue 快捷入口组件
    - 创建 DataTable.vue 数据表格组件
    - 创建 Modal.vue 模态框组件
    - _Requirements: 3.2, 4.2_

  - [x] 1.3 重构 MallView 使用 DashboardLayout
    - 将 MallView 改为使用 DashboardLayout
    - 保留欢迎区域、统计卡片、快捷入口
    - _Requirements: 1.5_

- [x] 2. Checkpoint - 验证布局组件
  - 确保 DashboardLayout 正常工作
  - 确保 MallView 使用新布局后功能正常
  - 如有问题请告知

- [x] 3. 创建 API 模块
  - [x] 3.1 创建用户 API 模块
    - 创建 src/api/user.api.ts
    - 实现 getProfile、updateProfile 方法
    - _Requirements: 2.5_

  - [x] 3.2 创建管理员 API 模块
    - 创建 src/api/admin.api.ts
    - 实现 getStats、getApprovalList、approveRequest、rejectRequest 方法
    - _Requirements: 3.1, 6.7_

  - [x] 3.3 创建商家 API 模块
    - 创建 src/api/merchant.api.ts
    - 实现 getStats、getMyStores、updateStore、getMyApplications、applyForArea 方法
    - _Requirements: 4.1, 7.6, 8.7_

  - [x] 3.4 创建商城管理 API 模块
    - 创建 src/api/mall-manage.api.ts
    - 实现楼层 CRUD、区域 CRUD、版本管理方法
    - _Requirements: 9.3, 9.4, 10.4, 10.5_

  - [x] 3.5 更新 API 索引导出
    - 更新 src/api/index.ts 导出所有新 API 模块
    - _Requirements: 3.1_

- [x] 4. 实现个人中心页面
  - [x] 4.1 重构 ProfileView.vue
    - 使用 DashboardLayout 布局
    - 显示用户基本信息（用户名、邮箱、手机号、角色）
    - 显示用户头像（首字母）
    - 实现编辑模式切换
    - 实现保存功能（调用 API）
    - 实现成功/错误提示
    - 添加修改密码入口
    - 使用深色主题样式
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 4.2 实现修改密码弹窗
    - 创建 ChangePasswordModal.vue
    - 实现当前密码、新密码、确认密码表单
    - 调用 password.api 的 changePassword 方法
    - _Requirements: 2.8, 2.9_

- [x] 5. 实现管理员页面
  - [x] 5.1 重构 admin/DashboardView.vue
    - 使用 DashboardLayout 布局
    - 显示系统统计数据（商家总数、店铺总数、待审批、在线用户）
    - 显示最近审批请求列表
    - 显示快捷操作入口
    - 显示系统公告区域
    - 使用深色主题样式
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 5.2 重构 admin/AreaApprovalView.vue
    - 使用 DashboardLayout 布局
    - 显示待审批申请列表（商家信息、区域、理由、时间）
    - 实现筛选功能（按状态、按时间）
    - 实现申请详情查看
    - 实现通过/拒绝操作
    - 拒绝时要求填写理由
    - 操作后更新列表
    - 使用深色主题样式
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x] 5.3 重构 admin/MallManageView.vue
    - 使用 DashboardLayout 布局
    - 显示商城结构树（楼层 → 区域）
    - 实现楼层 CRUD 操作
    - 实现区域 CRUD 操作
    - 显示区域状态和授权商家
    - 使用深色主题样式
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 5.4 重构 admin/LayoutVersionView.vue
    - 使用 DashboardLayout 布局
    - 显示版本列表（版本号、状态、时间、创建者）
    - 用不同标识区分状态
    - 实现发布草稿版本功能
    - 实现回滚功能
    - 显示版本详情
    - 使用深色主题样式
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.8_

- [x] 6. Checkpoint - 验证管理员页面
  - 确保所有管理员页面正常工作
  - 确保 API 调用正确
  - 如有问题请告知

- [x] 7. 实现商家页面
  - [x] 7.1 重构 merchant/DashboardView.vue
    - 使用 DashboardLayout 布局
    - 显示欢迎信息和商家统计
    - 显示我的店铺列表
    - 显示区域申请状态
    - 显示快捷操作入口
    - 使用深色主题样式
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 7.2 重构 merchant/AreaApplyView.vue
    - 使用 DashboardLayout 布局
    - 显示可申请区域列表（位置、面积、状态）
    - 用不同颜色标识区域状态
    - 实现申请表单（填写理由）
    - 实现提交申请功能
    - 显示我的申请历史
    - 使用深色主题样式
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 7.3 重构 merchant/StoreConfigView.vue
    - 使用 DashboardLayout 布局
    - 显示我的店铺列表
    - 实现店铺选择和配置表单
    - 允许编辑店铺名称、描述、分类、营业时间
    - 实现保存功能
    - 使用深色主题样式
    - _Requirements: 8.1, 8.2, 8.3, 8.7, 8.8_

- [x] 8. Checkpoint - 验证商家页面
  - 确保所有商家页面正常工作
  - 确保 API 调用正确
  - 如有问题请告知

- [x] 9. 实现 3D 商城入口页面
  - [x] 9.1 创建 Mall3DView.vue
    - 创建 src/views/Mall3DView.vue
    - 集成 ThreeEngine 渲染引擎
    - 显示加载进度指示器
    - 场景加载完成后显示 3D 商城
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 9.2 实现 3D 场景 UI 覆盖层
    - 添加楼层切换控件
    - 添加搜索店铺功能
    - 添加返回仪表盘入口
    - 添加迷你地图或导航提示
    - _Requirements: 5.4, 5.5, 5.6, 5.8_

  - [x] 9.3 实现店铺详情面板
    - 点击店铺时显示详情面板
    - 显示店铺名称、描述、商品等信息
    - _Requirements: 5.7_

  - [x] 9.4 添加 3D 商城路由
    - 在路由配置中添加 /mall/3d 路由
    - _Requirements: 5.1_

- [x] 10. 更新路由配置
  - [x] 10.1 更新动态路由组件映射
    - 确保所有新页面在 componentMap 中注册
    - _Requirements: 1.7_

  - [x] 10.2 验证路由守卫
    - 确保角色权限正确控制页面访问
    - _Requirements: 1.4_

- [x] 11. Final Checkpoint - 完整功能验证
  - 验证所有页面正常工作
  - 验证角色权限控制正确
  - 验证深色主题一致性
  - 如有问题请告知

## Notes

- 所有页面使用统一的深色主题设计（背景 #0a0a0a，卡片 #111113）
- DashboardLayout 是核心组件，需要先完成
- API 模块目前使用模拟数据，后续对接真实后端
- 3D 商城页面依赖已有的 ThreeEngine 渲染引擎
- 每个 Checkpoint 后暂停，等待用户确认
