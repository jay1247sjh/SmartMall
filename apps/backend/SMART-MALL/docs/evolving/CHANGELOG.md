# 变更日志（CHANGELOG.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端变更日志
> 
> 本文档为 **变更日志（Changelog）**，用于记录版本变更历史，遵循 Keep a Changelog 格式规范。

---

## [Unreleased]

### Added
- 商城建模器持久化 API
  - 创建项目：`POST /api/mall-builder/projects`
  - 获取项目列表：`GET /api/mall-builder/projects`
  - 获取项目详情：`GET /api/mall-builder/projects/{id}`
  - 更新项目：`PUT /api/mall-builder/projects/{id}`
  - 删除项目：`DELETE /api/mall-builder/projects/{id}`
- 新增数据库表：`mall_project`、`floor`、`area`
- 新增实体类：`MallProject`、`Floor`、`Area`
- 新增 Mapper：`MallProjectMapper`、`FloorMapper`、`AreaMapper`
- 新增 DTO：`CreateProjectRequest`、`UpdateProjectRequest`、`ProjectResponse`、`ProjectListItem`、`FloorDTO`、`AreaDTO`、`OutlineDTO`、`SettingsDTO`
- 新增服务：`MallBuilderService`
- 新增控制器：`MallBuilderController`

- 用户注册功能
  - 用户注册：创建新用户账号 (`POST /auth/register`)
  - 检查用户名可用性 (`GET /auth/check-username`)
  - 检查邮箱可用性 (`GET /auth/check-email`)
- 新增 `RegisterService` 服务类，处理用户注册逻辑
- 新增 `RegisterRequest` 和 `RegisterResponse` DTO
- 注册验证规则：
  - 用户名：3-20 字符，只能包含字母、数字和下划线
  - 密码：至少 6 位
  - 邮箱：必填，格式验证
  - 手机号：可选，格式验证（中国大陆手机号）
- 密码管理功能
  - 忘记密码：发送密码重置链接到邮箱 (`POST /auth/forgot-password`)
  - 验证重置令牌：检查令牌有效性 (`POST /auth/verify-reset-token`)
  - 重置密码：使用令牌设置新密码 (`POST /auth/reset-password`)
  - 修改密码：已登录用户修改密码 (`POST /auth/change-password`)
- 新增 `PasswordService` 服务类，处理密码重置和修改逻辑
- 新增 `EmailService` 接口和 `ConsoleEmailService` 实现（开发阶段输出到控制台）
- 新增密码相关错误码：`PASSWORD_RESET_TOKEN_INVALID`、`PASSWORD_OLD_INCORRECT`、`PASSWORD_SAME_AS_OLD`、`PASSWORD_TOO_SHORT`、`PASSWORD_RESET_RATE_LIMITED`
- 新增 `UserRepository.findByEmail()` 和 `updatePassword()` 方法

### Security
- 新注册用户默认角色为 USER，状态为 ACTIVE
- 密码重置令牌存储在 Redis 中，有效期 30 分钟
- 同一邮箱 5 分钟内只能请求一次重置链接（防止滥用）
- 无论邮箱是否存在都返回成功响应（防止邮箱枚举攻击）
- 密码使用 BCrypt 加密存储

---
