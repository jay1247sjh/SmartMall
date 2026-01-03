# 后端架构学习指南

## 学习目标

通过本章学习，你将掌握：
- DDD（领域驱动设计）分层架构
- Spring Boot 应用配置
- MyBatis-Plus 数据访问
- 统一响应处理

---

## 苏格拉底式问答

### 问题 1：为什么要使用分层架构？

**思考**：如果把所有代码都写在 Controller 里会怎样？

<details>
<summary>点击查看答案</summary>

分层架构的好处：
1. **职责分离**：每层只关注自己的职责
2. **可测试性**：可以独立测试每一层
3. **可维护性**：修改一层不影响其他层
4. **可复用性**：业务逻辑可以被多个接口复用

如果都写在 Controller 里：
- 代码臃肿，难以维护
- 业务逻辑无法复用
- 难以编写单元测试
- 数据库操作和业务逻辑混杂

</details>

### 问题 2：DDD 分层架构有哪些层？各层职责是什么？

**思考**：看看项目的目录结构，能识别出哪些层？

```
com.smartmall/
├── interfaces/      # ?
├── application/     # ?
├── domain/          # ?
├── infrastructure/  # ?
└── common/          # ?
```

<details>
<summary>点击查看答案</summary>

| 层 | 职责 | 示例 |
|----|------|------|
| interfaces | 接口层，处理 HTTP 请求 | Controller, DTO |
| application | 应用层，编排业务流程 | Service |
| domain | 领域层，核心业务逻辑 | Entity, ValueObject, Repository |
| infrastructure | 基础设施层，技术实现 | Mapper, Config, Security |
| common | 公共模块 | Exception, Response, Util |

**依赖方向**：interfaces → application → domain ← infrastructure

注意：domain 层不依赖 infrastructure，而是 infrastructure 实现 domain 定义的接口。

</details>

### 问题 3：Entity 和 DTO 有什么区别？为什么要分开？

**思考**：看看 `User.java` 和 `LoginRequest.java`，它们有什么不同？

<details>
<summary>点击查看答案</summary>

**Entity（实体）**：
- 代表领域对象，有唯一标识
- 包含业务逻辑和验证
- 与数据库表对应
- 生命周期由领域层管理

```java
// domain/entity/User.java
@Data
@TableName("users")
public class User extends BaseEntity {
    private String id;
    private String username;
    private String email;
    private String passwordHash;  // 敏感字段
    private UserStatus status;
    private Role role;
}
```

**DTO（数据传输对象）**：
- 用于层间数据传输
- 只包含需要传输的字段
- 可以组合多个 Entity 的数据
- 隐藏敏感信息

```java
// interfaces/dto/auth/LoginRequest.java
@Data
public class LoginRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
}
```

**为什么分开**：
1. 安全性：DTO 不暴露敏感字段（如 passwordHash）
2. 灵活性：接口可以返回不同结构的数据
3. 解耦：Entity 变化不影响 API 契约

</details>

---

## 核心代码解析

### 1. 统一响应格式

```java
// common/response/ApiResponse.java
@Data
public class ApiResponse<T> {
    private String code;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(ResultCode.SUCCESS.getCode());
        response.setMessage(ResultCode.SUCCESS.getMessage());
        response.setData(data);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }
    
    public static <T> ApiResponse<T> error(ResultCode resultCode) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(resultCode.getCode());
        response.setMessage(resultCode.getMessage());
        response.setTimestamp(LocalDateTime.now());
        return response;
    }
}
```

### 2. 全局异常处理

```java
// common/exception/GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Void> handleBusinessException(BusinessException e) {
        return ApiResponse.error(e.getResultCode());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleValidationException(
            MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return ApiResponse.error(ResultCode.PARAM_ERROR, message);
    }
}
```

### 3. MyBatis-Plus 配置

```java
// infrastructure/config/MybatisPlusConfig.java
@Configuration
@MapperScan("com.smartmall.infrastructure.mapper")
public class MybatisPlusConfig {
    
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(
            new PaginationInnerInterceptor(DbType.POSTGRE_SQL));
        return interceptor;
    }
}
```

---

## 实践练习

### 练习 1：追踪一个请求的完整流程

以登录请求为例，追踪从 HTTP 请求到数据库查询的完整流程：

```
POST /api/auth/login
    ↓
AuthController.login()
    ↓
AuthService.login()
    ↓
UserMapper.selectOne()
    ↓
JwtTokenProvider.generateToken()
    ↓
ApiResponse.success()
```

### 练习 2：添加一个新的 API

假设要添加一个获取用户信息的 API：`GET /api/user/profile`

需要创建/修改哪些文件？

<details>
<summary>点击查看答案</summary>

1. **DTO**：`interfaces/dto/user/UserProfileResponse.java`
2. **Controller**：`interfaces/controller/UserController.java`
3. **Service**：`application/service/UserService.java`
4. **Mapper**：可能复用 `UserMapper`

</details>

---

## 相关文件

| 文件路径 | 说明 |
|---------|------|
| `common/response/ApiResponse.java` | 统一响应格式 |
| `common/response/ResultCode.java` | 响应码枚举 |
| `common/exception/GlobalExceptionHandler.java` | 全局异常处理 |
| `infrastructure/config/MybatisPlusConfig.java` | MyBatis-Plus 配置 |
| `domain/entity/User.java` | 用户实体 |

---

## 延伸阅读

- [DDD 领域驱动设计](https://www.domainlanguage.com/ddd/)
- [MyBatis-Plus 官方文档](https://baomidou.com/)
- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
