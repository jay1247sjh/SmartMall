---
inclusion: always
---

# 错误处理规范

## 错误分类

### 前端错误分类

| 类型 | 说明 | 处理方式 |
|------|------|----------|
| 网络错误 | API 请求失败 | 提示用户，提供重试 |
| 权限错误 | 无权限执行操作 | 提示权限不足，引导申请 |
| 验证错误 | 参数校验失败 | 显示具体字段错误 |
| 业务错误 | 业务规则冲突 | 显示业务错误信息 |
| 系统错误 | 未知错误 | 显示通用错误，记录日志 |

### 后端错误分类

| 错误码前缀 | 分类 | HTTP 状态码 |
|-----------|------|-------------|
| 0 | 成功 | 200 |
| A1xxx | 参数错误 | 400 |
| A2xxx | 业务错误 | 400 |
| A3xxx | 权限错误 | 403 |
| A4xxx | 资源错误 | 404 |
| B1xxx | 系统错误 | 500 |
| C1xxx | 依赖错误 | 503 |

## 错误响应结构

### 后端统一错误响应

```json
{
  "code": "A3004",
  "message": "未获得该区域的建模权限",
  "data": null,
  "timestamp": 1733644800000
}
```

### 前端错误处理

```typescript
// ✅ 正确：统一错误处理
async function handleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall()
  } catch (error) {
    if (error.response) {
      // API 返回错误
      const { code, message } = error.response.data
      
      switch (code) {
        case 'A3001': // 未登录
          router.push('/login')
          break
        case 'A3003': // 权限不足
          ElMessage.error(message)
          break
        case 'A3004': // 区域权限不足
          showPermissionDialog(message)
          break
        default:
          ElMessage.error(message || '操作失败')
      }
    } else if (error.request) {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      // 其他错误
      ElMessage.error('操作失败')
      console.error(error)
    }
    throw error
  }
}
```

## 后端异常处理

### 全局异常处理器

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(PermissionDeniedException.class)
    public ApiResponse<Void> handlePermissionDenied(PermissionDeniedException e) {
        return ApiResponse.error("A3003", e.getMessage());
    }
    
    @ExceptionHandler(ValidationException.class)
    public ApiResponse<Void> handleValidation(ValidationException e) {
        return ApiResponse.error("A1001", e.getMessage());
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ApiResponse<Void> handleResourceNotFound(ResourceNotFoundException e) {
        return ApiResponse.error("A4001", e.getMessage());
    }
    
    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return ApiResponse.error("B1001", "系统内部错误");
    }
}
```

### 自定义异常

```java
// 权限异常
public class PermissionDeniedException extends RuntimeException {
    private final String reason;
    
    public PermissionDeniedException(String reason) {
        super("权限不足: " + reason);
        this.reason = reason;
    }
}

// 业务异常
public class BusinessException extends RuntimeException {
    private final String code;
    
    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }
}
```

## AI 服务错误处理

### 错误分类

| 错误类型 | 错误码 | 可重试 | 处理策略 |
|----------|--------|--------|----------|
| 服务超时 | AI_SERVICE_TIMEOUT | ✅ | 重试 + 降级 |
| 模型限流 | AI_RATE_LIMITED | ✅ | 延迟重试 |
| 输入过长 | AI_INPUT_TOO_LONG | ❌ | 截断重试 |
| 输出解析失败 | AI_OUTPUT_PARSE_ERROR | ✅ | 重新生成 |
| 意图不明确 | AI_INTENT_UNCLEAR | ❌ | 引导用户 |

### 降级策略

```python
# ✅ 正确：AI 服务降级
async def process_intent(user_input: str):
    try:
        # 尝试使用主 LLM
        return await primary_llm.process(user_input)
    except TimeoutError:
        # 超时，尝试备用 LLM
        try:
            return await fallback_llm.process(user_input)
        except Exception:
            # 降级到关键词匹配
            return keyword_matcher.match(user_input)
    except Exception as e:
        log.error(f"AI 服务异常: {e}")
        return {
            "status": "DEGRADED",
            "message": "AI 服务暂时不可用，请稍后再试"
        }
```

## 用户友好的错误提示

### 错误消息原则

1. **明确性** - 清楚说明发生了什么
2. **可操作性** - 告诉用户如何解决
3. **友好性** - 使用用户能理解的语言
4. **简洁性** - 避免技术术语

### 示例

```typescript
// ❌ 错误：技术性错误
"NullPointerException at line 42"

// ✅ 正确：用户友好错误
"无法加载商城数据，请刷新页面重试"

// ❌ 错误：不明确
"操作失败"

// ✅ 正确：明确且可操作
"您没有编辑该区域的权限，请先申请区域建模权限"
```

## 错误日志

### 日志级别

- **ERROR** - 系统错误，需要立即处理
- **WARN** - 警告信息，可能影响功能
- **INFO** - 一般信息，记录关键操作
- **DEBUG** - 调试信息，开发环境使用

### 日志格式

```java
// ✅ 正确：结构化日志
log.error("权限校验失败", 
    Map.of(
        "userId", userId,
        "action", action.getType(),
        "reason", "AREA_NOT_AUTHORIZED",
        "areaId", areaId
    )
);

// ❌ 错误：非结构化日志
log.error("权限校验失败: " + userId + " " + action);
```

## 验证清单

- [ ] 是否使用统一的错误响应结构？
- [ ] 错误码是否符合规范？
- [ ] 是否提供用户友好的错误提示？
- [ ] 是否记录了错误日志？
- [ ] 是否有降级策略？
- [ ] 是否区分了可重试和不可重试错误？
