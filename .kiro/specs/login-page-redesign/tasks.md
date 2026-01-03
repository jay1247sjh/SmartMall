# Implementation Plan: Login Page Redesign

## Overview

将 Smart Mall 登录页面从单列居中布局重构为 Linear 风格的左右分栏布局。保持现有登录逻辑不变，仅重构视觉样式和布局结构。

## Tasks

- [x] 1. 扩展 CSS 变量系统
  - 在 `variables.css` 中添加渐变文字和 Brand Panel 背景相关变量
  - 添加 `--gradient-text-start`, `--gradient-text-end`
  - 添加 `--brand-bg-gradient-start`, `--brand-bg-gradient-end`
  - _Requirements: 2.2, 4.1_

- [x] 2. 重构 LoginView 页面布局
  - [x] 2.1 创建左右分栏容器结构
    - 修改 `LoginView.vue` 的 template 结构
    - 添加 `.login-page` 使用 flexbox 左右分栏
    - 左侧 `.brand-panel`，右侧 `.form-panel`
    - _Requirements: 1.1, 1.2, 1.4_![1766912186315](image/tasks/1766912186315.png)![1766912191841](image/tasks/1766912191841.png)![1766912192151](image/tasks/1766912192151.png)![1766912192298](image/tasks/1766912192298.png)![1766912192447](image/tasks/1766912192447.png)![1766912197622](image/tasks/1766912197622.png)![1766912197910](image/tasks/1766912197910.png)![1766912198070](image/tasks/1766912198070.png)

  - [x] 2.2 实现 Brand Panel 左侧区域
    - 添加系统名称（大字号渐变文字）
    - 添加系统描述（muted 颜色）
    - 实现微妙背景渐变效果
    - 内容垂直居中
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

  - [x] 2.3 重构 Login Form 右侧区域
    - 保持现有表单结构和逻辑
    - 减少卡片感，使用 subtle border
    - 表单容器最大宽度 400px
    - 内容垂直居中
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [x] 3. 优化表单样式细节
  - [x] 3.1 调整输入框样式
    - 更克制的聚焦效果（border-color 变化更微妙）
    - 确保间距遵循 4px 网格
    - _Requirements: 3.3, 5.3, 5.4_

  - [x] 3.2 调整错误提示样式
    - 降低错误提示的视觉权重
    - 使用更低透明度的背景色
    - _Requirements: 3.4_

  - [x] 3.3 调整按钮和辅助信息样式
    - 确保按钮样式符合设计规范
    - 调整 footer hint 的视觉层级
    - _Requirements: 5.2_

- [x] 4. 实现响应式布局
  - 添加 768px 断点媒体查询
  - 移动端隐藏 Brand Panel
  - 移动端调整 Form Panel 内边距
  - _Requirements: 1.3, 6.1, 6.2, 6.3, 6.4_

- [x] 5. Checkpoint - 视觉验证
  - 确保所有样式正确应用
  - 在不同屏幕尺寸下测试布局
  - 验证深色模式效果
  - 如有问题请告知

- [x] 6. 编写单元测试
  - [x] 6.1 测试表单结构完整性
    - **Property 2: 表单结构完整性**
    - 验证表单包含用户名、密码输入框和提交按钮
    - **Validates: Requirements 3.1**

  - [x] 6.2 测试响应式布局切换
    - **Property 3: 响应式布局切换**
    - 验证 768px 以下 Brand Panel 隐藏
    - **Validates: Requirements 1.3, 6.1, 6.2**

- [x] 7. Final Checkpoint - 完成验证
  - 确保所有功能正常工作
  - 确保登录流程不受影响
  - 如有问题请告知

## Notes

- 所有任务均为必须执行
- 保持现有登录逻辑完全不变，仅重构视觉样式
- 所有间距必须遵循 4px 网格系统
- 渐变效果必须保持低饱和度、克制
