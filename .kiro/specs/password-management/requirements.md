# Requirements Document

## Introduction

本文档定义「密码管理」功能的需求规格，包括忘记密码（密码重置）和修改密码两个核心功能。该功能是用户认证系统的重要补充，确保用户能够安全地管理自己的账户密码。

## Glossary

- **Backend_System**: 后端系统，负责处理密码管理的业务逻辑
- **User**: 系统用户，包括 ADMIN、MERCHANT、USER 三种类型
- **Reset_Token**: 密码重置令牌，用于验证密码重置请求的有效性
- **Email_Service**: 邮件服务，用于发送密码重置链接
- **Password_Encoder**: 密码编码器，使用 BCrypt 算法加密密码

## Requirements

### Requirement 1: 忘记密码 - 发送重置链接

**User Story:** As a 用户, I want 在忘记密码时通过邮箱重置密码, so that 我可以恢复对账户的访问

#### Acceptance Criteria

1. WHEN 用户提交注册邮箱地址 THEN THE Backend_System SHALL 验证该邮箱是否存在于系统中
2. WHEN 邮箱存在 THEN THE Backend_System SHALL 生成一个唯一的 Reset_Token 并存储到 Redis
3. WHEN Reset_Token 生成成功 THEN THE Backend_System SHALL 通过 Email_Service 发送包含重置链接的邮件
4. THE Backend_System SHALL 设置 Reset_Token 的有效期为 30 分钟
5. WHEN 邮箱不存在 THEN THE Backend_System SHALL 返回相同的成功响应以防止邮箱枚举攻击
6. THE Backend_System SHALL 限制同一邮箱在 5 分钟内只能请求一次重置链接

### Requirement 2: 忘记密码 - 验证重置令牌

**User Story:** As a 用户, I want 验证密码重置链接的有效性, so that 我可以确认链接是否可用

#### Acceptance Criteria

1. WHEN 用户访问重置链接 THEN THE Backend_System SHALL 验证 Reset_Token 是否存在且未过期
2. WHEN Reset_Token 有效 THEN THE Backend_System SHALL 返回成功状态
3. WHEN Reset_Token 无效或已过期 THEN THE Backend_System SHALL 返回令牌无效错误
4. WHEN Reset_Token 已被使用 THEN THE Backend_System SHALL 返回令牌已使用错误

### Requirement 3: 忘记密码 - 重置密码

**User Story:** As a 用户, I want 使用重置链接设置新密码, so that 我可以使用新密码登录系统

#### Acceptance Criteria

1. WHEN 用户提交新密码和 Reset_Token THEN THE Backend_System SHALL 验证 Reset_Token 的有效性
2. WHEN Reset_Token 有效 THEN THE Backend_System SHALL 使用 Password_Encoder 加密新密码
3. WHEN 密码加密成功 THEN THE Backend_System SHALL 更新用户的密码哈希值
4. WHEN 密码更新成功 THEN THE Backend_System SHALL 使 Reset_Token 失效
5. THE Backend_System SHALL 验证新密码符合安全要求（最少 6 位）
6. WHEN 密码不符合要求 THEN THE Backend_System SHALL 返回密码格式错误

### Requirement 4: 修改密码

**User Story:** As a 已登录用户, I want 修改我的密码, so that 我可以定期更新密码以保证账户安全

#### Acceptance Criteria

1. WHEN 用户提交旧密码和新密码 THEN THE Backend_System SHALL 验证用户已登录
2. WHEN 用户已登录 THEN THE Backend_System SHALL 验证旧密码是否正确
3. WHEN 旧密码正确 THEN THE Backend_System SHALL 使用 Password_Encoder 加密新密码
4. WHEN 新密码加密成功 THEN THE Backend_System SHALL 更新用户的密码哈希值
5. THE Backend_System SHALL 验证新密码符合安全要求（最少 6 位）
6. WHEN 旧密码错误 THEN THE Backend_System SHALL 返回密码错误提示
7. THE Backend_System SHALL 验证新密码与旧密码不同

### Requirement 5: 前端忘记密码页面

**User Story:** As a 用户, I want 在登录页面点击忘记密码链接进入重置流程, so that 我可以方便地找回密码

#### Acceptance Criteria

1. WHEN 用户点击登录页的"忘记密码"链接 THEN THE Frontend SHALL 导航到忘记密码页面
2. THE Frontend SHALL 显示邮箱输入表单
3. WHEN 用户提交邮箱 THEN THE Frontend SHALL 调用后端发送重置链接接口
4. WHEN 请求成功 THEN THE Frontend SHALL 显示"重置链接已发送"的提示信息
5. THE Frontend SHALL 提供返回登录页的链接

### Requirement 6: 前端重置密码页面

**User Story:** As a 用户, I want 通过重置链接设置新密码, so that 我可以完成密码重置流程

#### Acceptance Criteria

1. WHEN 用户访问重置链接 THEN THE Frontend SHALL 从 URL 中提取 Reset_Token
2. THE Frontend SHALL 调用后端验证 Reset_Token 的有效性
3. WHEN Reset_Token 有效 THEN THE Frontend SHALL 显示新密码输入表单
4. WHEN Reset_Token 无效 THEN THE Frontend SHALL 显示链接已失效的提示
5. WHEN 用户提交新密码 THEN THE Frontend SHALL 调用后端重置密码接口
6. WHEN 重置成功 THEN THE Frontend SHALL 显示成功提示并提供登录链接
