---
inclusion: fileMatch
fileMatchPattern: "**/api/**/*.{ts,java,py}"
---

# API 协议约束

## 统一响应结构

### 后端 API 响应

```json
{
  "code": "string",
  "message": "string",
  "data": "any",
  "timestamp": "number"
}
```

### AI 服务响应

```json
{
  "requestId": "string",
  "status": "SUCCESS | ERROR | DEGRADED",
  "result": {},
  "metadata": {
    "modelUsed": "string",
    "tokensUsed": "number",
    "latencyMs": "number"
  }
}
```

## 错误码体系

| 前缀 | 分类 | 说明 |
|------|------|------|
| 0 | 成功 | 操作成功 |
| A1xxx | 参数错误 | 请求参数校验失败 |
| A2xxx | 业务错误 | 业务规则冲突 |
| A3xxx | 权限错误 | 认证或授权失败 |
| A4xxx | 资源错误 | 资源不存在或状态异常 |
| B1xxx | 系统错误 | 服务端内部错误 |
| C1xxx | 依赖错误 | 外部服务异常 |

## Intent/Action 结构

### Intent 标准结构

```typescript
interface Intent {
  intentId: string              // UUID v4
  name: string                  // domain.action 格式
  source: 'user' | 'agent' | 'system'
  timestamp: number
  target?: {
    type: string
    id: string
  }
  payload?: Record<string, any>
  context: {
    mode: 'RUNTIME' | 'CONFIG'
    mallId: string
    userId: string
    userRole: 'ADMIN' | 'MERCHANT' | 'USER'
    sessionId: string
  }
  version: '1.0'
}
```

### Action 白名单

所有 Intent 必须在白名单中：
- navigation.moveTo
- navigation.reset
- scene.highlight
- permission.apply
- permission.approve
- builder.enter
- layout.submitProposal

## 验证清单

- [ ] 是否使用统一响应结构？
- [ ] 错误码是否符合规范？
- [ ] Intent 是否包含必填字段？
- [ ] Intent 是否在白名单中？
