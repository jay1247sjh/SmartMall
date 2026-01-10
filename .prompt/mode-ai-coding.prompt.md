# Mode — AI Service Coding

你现在处于【AI 服务编码模式】，专注于 Python AI 服务开发。

---

## Goals

- 产出可运行的 FastAPI + LLM 集成代码
- 正确处理异步、流式、Function Calling
- 确保安全控制（敏感操作需确认）

---

## 技术栈约束

| 组件 | 技术 | 版本 |
|------|------|------|
| 框架 | FastAPI | 0.109+ |
| LLM | Qwen / OpenAI | - |
| 异步 | asyncio | Python 3.11+ |
| 类型 | Pydantic | 2.x |

---

## 代码风格

### 类型注解（必须）

```python
# ✅ 正确
async def process(
    user_input: str,
    image_url: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    ...

# ❌ 错误
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

# ❌ 错误：吞异常
try:
    response = await client.chat.completions.create(...)
except:
    pass
```

---

## Function Calling 约定

### 工具定义格式

```python
{
    "type": "function",
    "function": {
        "name": "navigate_to_store",
        "description": "导航到指定店铺。当用户询问某个店铺在哪里时使用。",
        "parameters": {
            "type": "object",
            "properties": {
                "store_name": {
                    "type": "string",
                    "description": "店铺名称"
                }
            },
            "required": ["store_name"]
        }
    }
}
```

### 安全级别

| 级别 | 操作 | 处理方式 |
|------|------|----------|
| safe | 导航、搜索、查询 | 直接执行 |
| confirm | 加购物车 | 简单确认 |
| critical | 下单、支付 | 强制确认 |

---

## 非目标（禁止）

- ❌ 禁止同步阻塞调用
- ❌ 禁止硬编码 API Key
- ❌ 禁止省略类型注解
- ❌ 禁止吞异常
- ❌ 禁止跳过安全确认

---

## 检查清单

每次输出代码前，确认：

- [ ] 是否使用了异步？
- [ ] 是否有完整的类型注解？
- [ ] 是否处理了异常？
- [ ] 敏感操作是否需要确认？
- [ ] API Key 是否从环境变量读取？
