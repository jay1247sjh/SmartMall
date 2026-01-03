# Design Document: Password Management

## Overview

本设计文档描述密码管理功能的技术实现方案，包括忘记密码（密码重置）和修改密码两个核心功能。该功能扩展现有的认证系统，为用户提供安全的密码管理能力。

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vue 3)                        │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ ForgotPassword  │  │ ResetPassword   │                   │
│  │     View        │  │     View        │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └────────┬───────────┘                             │
│                    ▼                                         │
│           ┌─────────────────┐                               │
│           │   Password API   │                               │
│           └────────┬────────┘                               │
└────────────────────┼────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              AuthController (扩展)                    │    │
│  │  POST /auth/forgot-password                          │    │
│  │  POST /auth/verify-reset-token                       │    │
│  │  POST /auth/reset-password                           │    │
│  │  POST /auth/change-password                          │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PasswordService                         │    │
│  │  - sendResetLink()                                   │    │
│  │  - verifyResetToken()                                │    │
│  │  - resetPassword()                                   │    │
│  │  - changePassword()                                  │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│           ┌───────────┼───────────┐                         │
│           ▼           ▼           ▼                         │
│  ┌─────────────┐ ┌─────────┐ ┌─────────────┐               │
│  │ UserRepo    │ │  Redis  │ │ EmailService│               │
│  └─────────────┘ └─────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 密码重置流程

```
用户                    前端                    后端                    Redis
 │                       │                       │                       │
 │  1. 点击忘记密码       │                       │                       │
 │──────────────────────>│                       │                       │
 │                       │  2. 提交邮箱           │                       │
 │                       │──────────────────────>│                       │
 │                       │                       │  3. 生成 Token         │
 │                       │                       │──────────────────────>│
 │                       │                       │  4. 存储 Token (30min) │
 │                       │                       │<──────────────────────│
 │                       │  5. 返回成功           │                       │
 │                       │<──────────────────────│                       │
 │  6. 显示提示信息       │                       │                       │
 │<──────────────────────│                       │                       │
 │                       │                       │                       │
 │  7. 点击邮件中的链接   │                       │                       │
 │──────────────────────>│                       │                       │
 │                       │  8. 验证 Token         │                       │
 │                       │──────────────────────>│                       │
 │                       │                       │  9. 检查 Token         │
 │                       │                       │──────────────────────>│
 │                       │  10. Token 有效        │                       │
 │                       │<──────────────────────│                       │
 │  11. 显示密码表单      │                       │                       │
 │<──────────────────────│                       │                       │
 │                       │                       │                       │
 │  12. 提交新密码        │                       │                       │
 │──────────────────────>│                       │                       │
 │                       │  13. 重置密码          │                       │
 │                       │──────────────────────>│                       │
 │                       │                       │  14. 删除 Token        │
 │                       │                       │──────────────────────>│
 │                       │  15. 返回成功          │                       │
 │                       │<──────────────────────│                       │
 │  16. 跳转登录页        │                       │                       │
 │<──────────────────────│                       │                       │
```

## Components and Interfaces

### Backend Components

#### 1. AuthController (扩展)

```java
@RestController
@RequestMapping("/auth")
public class AuthController {
    
    // 现有接口...
    
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request);
    
    @PostMapping("/verify-reset-token")
    public ApiResponse<Void> verifyResetToken(@Valid @RequestBody VerifyTokenRequest request);
    
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request);
    
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request);
}
```

#### 2. PasswordService

```java
@Service
public class PasswordService {
    
    /**
     * 发送密码重置链接
     * @param email 用户邮箱
     */
    void sendResetLink(String email);
    
    /**
     * 验证重置令牌
     * @param token 重置令牌
     * @return 是否有效
     */
    boolean verifyResetToken(String token);
    
    /**
     * 重置密码
     * @param token 重置令牌
     * @param newPassword 新密码
     */
    void resetPassword(String token, String newPassword);
    
    /**
     * 修改密码（已登录用户）
     * @param userId 用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     */
    void changePassword(String userId, String oldPassword, String newPassword);
}
```

#### 3. EmailService (接口)

```java
public interface EmailService {
    
    /**
     * 发送密码重置邮件
     * @param to 收件人邮箱
     * @param resetLink 重置链接
     */
    void sendPasswordResetEmail(String to, String resetLink);
}
```

### Frontend Components

#### 1. ForgotPasswordView.vue

忘记密码页面，包含邮箱输入表单。

#### 2. ResetPasswordView.vue

重置密码页面，包含新密码输入表单。

#### 3. password.api.ts

```typescript
export const passwordApi = {
    forgotPassword(email: string): Promise<void>;
    verifyResetToken(token: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    changePassword(oldPassword: string, newPassword: string): Promise<void>;
}
```

## Data Models

### Request DTOs

```java
// 忘记密码请求
public record ForgotPasswordRequest(
    @NotBlank @Email String email
) {}

// 验证令牌请求
public record VerifyTokenRequest(
    @NotBlank String token
) {}

// 重置密码请求
public record ResetPasswordRequest(
    @NotBlank String token,
    @NotBlank @Size(min = 6) String newPassword
) {}

// 修改密码请求
public record ChangePasswordRequest(
    @NotBlank String oldPassword,
    @NotBlank @Size(min = 6) String newPassword
) {}
```

### Redis Key 设计

```
# 密码重置令牌
password:reset:{token} -> userId
TTL: 30 minutes

# 请求频率限制
password:rate:{email} -> timestamp
TTL: 5 minutes
```

### 错误码扩展

```java
// 新增错误码
PASSWORD_RESET_TOKEN_INVALID("A2010", "重置令牌无效"),
PASSWORD_RESET_TOKEN_EXPIRED("A2011", "重置令牌已过期"),
PASSWORD_RESET_TOKEN_USED("A2012", "重置令牌已使用"),
PASSWORD_RESET_RATE_LIMITED("A2013", "请求过于频繁，请稍后再试"),
PASSWORD_OLD_INCORRECT("A2014", "旧密码错误"),
PASSWORD_SAME_AS_OLD("A2015", "新密码不能与旧密码相同"),
PASSWORD_TOO_SHORT("A2016", "密码长度不能少于6位")
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Email Response Consistency (Security)

*For any* email address submitted to the forgot-password endpoint, the system SHALL return the same response format and timing regardless of whether the email exists in the system.

**Validates: Requirements 1.1, 1.5**

### Property 2: Token Validation Correctness

*For any* reset token, the system SHALL correctly identify whether the token is valid (exists and not expired), invalid (does not exist), or expired (exists but past TTL).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Password Encoding Round-Trip

*For any* valid password string, encoding it with BCrypt and then verifying the original password against the hash SHALL return true.

**Validates: Requirements 3.2, 4.3**

### Property 4: Password Update Persistence

*For any* successful password reset or change operation, the user's password hash in the database SHALL be updated, and subsequent login with the new password SHALL succeed.

**Validates: Requirements 3.3, 4.4**

### Property 5: Password Validation Rules

*For any* password string shorter than 6 characters, the system SHALL reject it with a validation error.

**Validates: Requirements 3.5, 4.5**

### Property 6: Token Single-Use Guarantee

*For any* reset token that has been successfully used to reset a password, subsequent attempts to use the same token SHALL fail with "token already used" error.

**Validates: Requirements 3.4, 2.4**

### Property 7: Old Password Verification

*For any* change-password request, the system SHALL verify that the provided old password matches the current password hash before allowing the change.

**Validates: Requirements 4.2**

### Property 8: New Password Differs From Old

*For any* change-password request where the new password is identical to the old password, the system SHALL reject the request.

**Validates: Requirements 4.7**

## Error Handling

### 错误处理策略

1. **邮箱不存在**: 返回成功响应，防止邮箱枚举攻击
2. **令牌无效/过期**: 返回明确的错误信息，引导用户重新申请
3. **密码格式错误**: 返回详细的验证错误信息
4. **旧密码错误**: 返回密码错误提示，但不透露具体原因
5. **请求频率限制**: 返回友好的等待提示

### 安全考虑

1. **防止邮箱枚举**: 无论邮箱是否存在，都返回相同响应
2. **令牌安全**: 使用 UUID + 随机字符串生成令牌
3. **令牌有效期**: 30 分钟后自动过期
4. **单次使用**: 令牌使用后立即删除
5. **频率限制**: 同一邮箱 5 分钟内只能请求一次

## Testing Strategy

### Unit Tests

1. **PasswordService 单元测试**
   - 测试令牌生成逻辑
   - 测试密码验证逻辑
   - 测试密码加密逻辑

2. **Controller 单元测试**
   - 测试请求参数验证
   - 测试响应格式

### Integration Tests

1. **密码重置流程测试**
   - 完整的忘记密码 -> 重置密码流程
   - 令牌过期场景
   - 令牌重复使用场景

2. **修改密码测试**
   - 正确旧密码场景
   - 错误旧密码场景
   - 新旧密码相同场景

### Property-Based Tests

使用 JUnit 5 + jqwik 进行属性测试：

1. **Property 3**: 密码编码往返测试
2. **Property 5**: 密码长度验证测试
3. **Property 8**: 新旧密码不同验证测试

### 测试框架

- **后端**: JUnit 5 + Mockito + jqwik (property-based testing)
- **前端**: Vitest + Vue Test Utils
