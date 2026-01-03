# Implementation Plan: Password Management

## Overview

本任务列表实现密码管理功能，包括后端 API、前端页面和文档更新。采用增量开发方式，先实现核心功能，再完善边缘场景。

## Tasks

- [x] 1. 后端：扩展错误码和 DTO
  - [x] 1.1 在 ResultCode 中添加密码相关错误码
    - 添加 PASSWORD_RESET_TOKEN_INVALID、PASSWORD_OLD_INCORRECT 等错误码
    - _Requirements: 3.6, 4.6_
  - [x] 1.2 创建密码管理相关的 Request DTO
    - 创建 ForgotPasswordRequest、VerifyTokenRequest、ResetPasswordRequest、ChangePasswordRequest
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 2. 后端：实现 PasswordService
  - [x] 2.1 创建 PasswordService 类
    - 实现 sendResetLink、verifyResetToken、resetPassword、changePassword 方法
    - 使用 Redis 存储重置令牌
    - _Requirements: 1.2, 1.4, 2.1, 3.2, 3.3, 3.4, 4.2, 4.3, 4.4_
  - [x] 2.2 实现密码验证逻辑
    - 验证密码长度（最少 6 位）
    - 验证新旧密码不同
    - _Requirements: 3.5, 4.5, 4.7_
  - [x] 2.3 实现请求频率限制
    - 同一邮箱 5 分钟内只能请求一次
    - _Requirements: 1.6_
  - [ ]* 2.4 编写 PasswordService 单元测试
    - 测试令牌生成、验证、密码加密逻辑
    - _Requirements: 1.2, 2.1, 3.2_

- [x] 3. 后端：创建 EmailService 接口和模拟实现
  - [x] 3.1 创建 EmailService 接口
    - 定义 sendPasswordResetEmail 方法
    - _Requirements: 1.3_
  - [x] 3.2 创建 ConsoleEmailService 模拟实现
    - 将邮件内容输出到控制台（开发阶段使用）
    - _Requirements: 1.3_

- [x] 4. 后端：扩展 AuthController
  - [x] 4.1 添加忘记密码接口 POST /auth/forgot-password
    - 接收邮箱，调用 PasswordService.sendResetLink
    - _Requirements: 1.1, 1.5_
  - [x] 4.2 添加验证令牌接口 POST /auth/verify-reset-token
    - 验证令牌有效性
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 4.3 添加重置密码接口 POST /auth/reset-password
    - 验证令牌并重置密码
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 4.4 添加修改密码接口 POST /auth/change-password
    - 验证旧密码并更新新密码（需要登录）
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - [ ]* 4.5 编写 AuthController 集成测试
    - 测试完整的密码重置和修改流程
    - _Requirements: 1.1-4.7_

- [x] 5. Checkpoint - 后端功能验证
  - 确保所有后端接口可用，使用 Swagger 或 curl 测试
  - 确保 Redis 令牌存储正常工作

- [x] 6. 前端：创建密码管理 API
  - [x] 6.1 在 api 目录创建 password.api.ts
    - 实现 forgotPassword、verifyResetToken、resetPassword、changePassword 方法
    - _Requirements: 5.3, 6.2, 6.5_

- [x] 7. 前端：创建忘记密码页面
  - [x] 7.1 创建 ForgotPasswordView.vue
    - 邮箱输入表单
    - 提交后显示成功提示
    - 返回登录页链接
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 7.2 添加路由配置
    - 添加 /forgot-password 路由
    - _Requirements: 5.1_

- [x] 8. 前端：创建重置密码页面
  - [x] 8.1 创建 ResetPasswordView.vue
    - 从 URL 提取 token
    - 验证 token 有效性
    - 新密码输入表单
    - 成功后跳转登录页
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - [x] 8.2 添加路由配置
    - 添加 /reset-password 路由，支持 token 参数
    - _Requirements: 6.1_

- [x] 9. 前端：更新登录页面
  - [x] 9.1 更新 LoginView.vue 中的忘记密码链接
    - 将占位链接改为实际的 /forgot-password 路由
    - _Requirements: 5.1_
  - [ ]* 9.2 编写前端组件测试
    - 测试表单验证和 API 调用
    - _Requirements: 5.2-6.6_

- [ ] 10. Checkpoint - 前端功能验证
  - 确保完整的密码重置流程可用
  - 确保修改密码功能可用

- [x] 11. 更新文档
  - [x] 11.1 更新后端 DESIGN.md
    - 添加密码管理相关的接口说明
    - _Requirements: 1.1-4.7_
  - [x] 11.2 更新后端 REQUIREMENTS.md
    - 添加密码管理需求
    - _Requirements: 1.1-4.7_
  - [x] 11.3 更新后端 CHANGELOG.md
    - 记录新增的密码管理功能
    - _Requirements: 1.1-4.7_

- [x] 12. Final Checkpoint
  - 确保所有测试通过
  - 确保文档已更新
  - 确保功能完整可用

## Notes

- 任务标记 `*` 的为可选测试任务，可在 MVP 阶段跳过
- 邮件服务目前使用控制台输出模拟，后续可替换为真实邮件服务
- 密码重置令牌存储在 Redis 中，有效期 30 分钟
- 所有密码使用 BCrypt 加密存储
