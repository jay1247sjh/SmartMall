# Mode — Strict Coding

你现在处于【严格工程编码模式】，适用于前端、后端、AI 服务的生产级代码开发。

---

## Goals

- 产出 **可运行、可维护、工程级** 的代码
- 默认以真实生产环境为假设
- 主动处理边界条件、异常、错误路径

---

## 行为准则

### 输出要求

1. **先给结论**：推荐方案 + 理由
2. **再给实现**：文件级别的修改清单
3. **最后给代码**：可直接运行或接近运行
4. **说明写注释**：关键解释在代码注释中，不散落正文

### 代码质量

- 优先给出 **MVP 可落地方案**
- 需要时给 2~3 个方案，并明确 trade-off
- 关注：模块边界、错误处理、日志与可观测性、可测试性

---

## 技术栈约束

| 层 | 技术 | 约束 |
|---|---|---|
| 前端 | Vue 3 + TS | `<script setup lang="ts">`，Composition API |
| 后端 | Spring Boot 3 | DDD 分层，MyBatis-Plus |
| AI | FastAPI + Python | 异步优先，类型注解，Pydantic 2.x |

---

## 前端代码规范 (TypeScript)

```typescript
// ✅ 正确：带语言标识 + 文件路径注释
// src/api/user.ts
export async function getUser(id: string): Promise<User> {
  try {
    const response = await http.get<User>(`/users/${id}`)
    return response.data
  } catch (error) {
    console.error('Failed to get user:', error)
    throw error
  }
}
```

---

## 后端代码规范 (Java)

```java
// ✅ 正确：DDD 分层，统一响应格式
// interfaces/controller/UserController.java
@GetMapping("/{id}")
public Result<UserDTO> getUser(@PathVariable String id) {
    return Result.success(userService.getById(id));
}
```

---

## AI 服务代码规范 (Python)

### 类型注解（必须）

```python
# ✅ 正确：完整类型注解
async def process(
    user_input: str,
    image_url: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    ...

# ❌ 错误：缺少类型注解
async def process(user_input, image_url=None, context=None):
    ...
```

### 异步优先

```python
# ✅ 正确：使用异步客户端
async def chat(self, messages: List[Message]) -> CompletionResult:
    client = self._get_async_client()
    response = await client.chat.completions.create(...)
    return response

# ❌ 错误：在异步函数中使用同步调用
async def chat(self, messages: List[Message]) -> CompletionResult:
    client = self._get_sync_client()
    response = client.chat.completions.create(...)  # 阻塞！
    return response
```

### 错误处理

```python
# ✅ 正确：具体异常 + 日志
try:
    response = await client.chat.completions.create(...)
except openai.APIError as e:
    logger.error(f"LLM API error: {e}")
    raise HTTPException(status_code=502, detail="LLM service unavailable")
except Exception as e:
    logger.exception(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail=str(e))
```

### Function Calling 安全级别

| 级别 | 操作 | 处理方式 |
|------|------|----------|
| safe | 导航、搜索、查询 | 直接执行 |
| confirm | 加购物车 | 简单确认 |
| critical | 下单、支付 | 强制确认 |

---

## 输出格式约束

### 修改说明格式

```
📁 修改文件：src/api/user.ts
📝 修改内容：新增 getUser 方法
📌 影响范围：UserStore 需要同步更新
```

---

## 非目标（禁止）

- ❌ 禁止学生作业式示例
- ❌ 禁止只讲概念不给实现
- ❌ 禁止"理论上可以"的空谈
- ❌ 禁止省略错误处理
- ❌ 禁止使用 `any` 类型（除非有充分理由）
- ❌ 禁止硬编码配置值
- ❌ 禁止同步阻塞调用（AI 服务）
- ❌ 禁止吞异常

---

## 检查清单

每次输出代码前，确认：

- [ ] 是否处理了所有错误路径？
- [ ] 是否有适当的日志记录？
- [ ] 是否遵循了项目分层约定？
- [ ] 是否有完整的类型定义？
- [ ] 是否考虑了边界条件？
- [ ] （AI 服务）是否使用了异步？
- [ ] （AI 服务）敏感操作是否需要确认？
- [ ] API Key 是否从环境变量读取？
