---
inclusion: fileMatch
fileMatchPattern: "**/auth/**/*.{ts,java,py}"
---

# 密码安全约束

## 密码存储

### 加密算法
- 必须使用 BCrypt 加密
- 禁止明文存储密码
- 禁止可逆加密（如 AES）

### 代码示例

```java
// ✅ 正确：使用 BCrypt
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String hashedPassword = encoder.encode(rawPassword);
```

```typescript
// ✅ 正确：使用 bcrypt
import bcrypt from 'bcrypt'

const saltRounds = 10
const hashedPassword = await bcrypt.hash(password, saltRounds)
```

```python
# ✅ 正确：使用 bcrypt
from passlib.hash import bcrypt

hashed = bcrypt.hash(password)
```

## 密码验证

### 验证规则
- 最小长度：6 位
- 新旧密码必须不同
- 密码不能与用户名相同

### 代码示例

```java
// ✅ 正确：密码验证
public void validatePassword(String password, String username) {
    if (password.length() < 6) {
        throw new ValidationException("密码长度不能少于6位");
    }
    if (password.equals(username)) {
        throw new ValidationException("密码不能与用户名相同");
    }
}
```

## 密码重置

### 重置令牌
- 令牌必须有过期时间（30分钟）
- 令牌使用后立即失效
- 令牌存储在 Redis 中

### 防止邮箱枚举攻击
- 无论邮箱是否存在都返回成功响应
- 不暴露用户是否存在的信息

### 代码示例

```java
// ✅ 正确：防止邮箱枚举
@PostMapping("/forgot-password")
public ApiResponse<Void> forgotPassword(@RequestBody ForgotPasswordRequest request) {
    // 无论邮箱是否存在，都返回成功
    passwordService.sendResetEmail(request.getEmail());
    return ApiResponse.success("重置链接已发送到您的邮箱");
}

// 内部实现
public void sendResetEmail(String email) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
        // 邮箱不存在，静默返回
        return;
    }
    
    // 生成重置令牌
    String token = UUID.randomUUID().toString();
    
    // 存储到 Redis，30分钟过期
    redisTemplate.opsForValue().set(
        "reset_token:" + token,
        user.getUserId(),
        30,
        TimeUnit.MINUTES
    );
    
    // 发送邮件
    emailService.sendResetEmail(email, token);
}
```

### 令牌验证

```java
// ✅ 正确：验证重置令牌
@PostMapping("/reset-password")
public ApiResponse<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
    // 1. 验证令牌
    String userId = redisTemplate.opsForValue().get("reset_token:" + request.getToken());
    if (userId == null) {
        throw new InvalidTokenException("令牌无效或已过期");
    }
    
    // 2. 更新密码
    passwordService.updatePassword(userId, request.getNewPassword());
    
    // 3. 删除令牌
    redisTemplate.delete("reset_token:" + request.getToken());
    
    return ApiResponse.success("密码重置成功");
}
```

## 修改密码

### 验证流程
1. 验证当前密码
2. 验证新密码格式
3. 验证新旧密码不同
4. 更新密码

### 代码示例

```java
// ✅ 正确：修改密码
@PostMapping("/change-password")
public ApiResponse<Void> changePassword(@RequestBody ChangePasswordRequest request) {
    User user = getCurrentUser();
    
    // 1. 验证当前密码
    if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
        throw new InvalidPasswordException("当前密码错误");
    }
    
    // 2. 验证新密码
    validatePassword(request.getNewPassword(), user.getUsername());
    
    // 3. 验证新旧密码不同
    if (request.getOldPassword().equals(request.getNewPassword())) {
        throw new ValidationException("新密码不能与旧密码相同");
    }
    
    // 4. 更新密码
    String newHash = passwordEncoder.encode(request.getNewPassword());
    userRepository.updatePassword(user.getUserId(), newHash);
    
    return ApiResponse.success("密码修改成功");
}
```

## 频率限制

### 防止暴力破解
- 同一邮箱 5 分钟内只能请求一次重置
- 同一 IP 1 小时内最多 10 次重置请求

### 代码示例

```java
// ✅ 正确：频率限制
public void checkRateLimit(String email) {
    String key = "reset_limit:" + email;
    Long count = redisTemplate.opsForValue().increment(key);
    
    if (count == 1) {
        // 首次请求，设置过期时间
        redisTemplate.expire(key, 5, TimeUnit.MINUTES);
    }
    
    if (count > 1) {
        throw new RateLimitException("请求过于频繁，请5分钟后再试");
    }
}
```

## 验证清单

- [ ] 是否使用 BCrypt 加密密码？
- [ ] 密码长度是否至少 6 位？
- [ ] 重置令牌是否有过期时间？
- [ ] 令牌使用后是否立即失效？
- [ ] 是否防止邮箱枚举攻击？
- [ ] 是否验证新旧密码不同？
- [ ] 是否有频率限制？
