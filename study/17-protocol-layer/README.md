# 协议层学习指南

## 学习目标

通过本章学习，你将掌握：
- Action 协议设计
- Result 协议设计
- 前后端数据契约
- 类型安全的 API 调用

---

## 苏格拉底式问答

### 问题 1：为什么需要协议层？

**思考**：前后端如何保证数据格式一致？

<details>
<summary>点击查看答案</summary>

**问题场景**：
- 后端返回 `user_name`，前端期望 `userName`
- 后端返回 `null`，前端没有处理
- 后端修改了字段，前端没有同步

**协议层的作用**：
1. 定义统一的数据格式
2. 提供类型检查
3. 作为前后端契约

```typescript
// 协议定义
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

interface LoginResult {
  token: string;
  user: UserInfo;
}
```

</details>

### 问题 2：Action 和 Result 有什么区别？

<details>
<summary>点击查看答案</summary>

**Action（动作）**：描述要执行的操作
```typescript
interface LoginAction {
  type: 'LOGIN';
  payload: {
    username: string;
    password: string;
  };
}
```

**Result（结果）**：描述操作的结果
```typescript
interface LoginResult {
  success: boolean;
  data?: {
    token: string;
    user: UserInfo;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

Action → 服务器处理 → Result

</details>


---

## 核心代码解析

### 1. 统一响应协议

```typescript
// protocol/response.ts
export interface ApiResponse<T = unknown> {
  code: string;      // '0' 表示成功
  message: string;   // 提示信息
  data: T;           // 业务数据
  timestamp: string; // 响应时间
}

// 响应码定义
export const ResultCode = {
  SUCCESS: '0',
  PARAM_ERROR: '1001',
  UNAUTHORIZED: '1002',
  FORBIDDEN: '1003',
  NOT_FOUND: '1004',
  SERVER_ERROR: '5000'
} as const;
```

### 2. 请求协议

```typescript
// protocol/request.ts
export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
```

### 3. 建模器数据协议

```typescript
// protocol/mall-builder.ts
export interface MallProjectDTO {
  id: string;
  name: string;
  description?: string;
  floors: FloorDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface FloorDTO {
  id: string;
  level: number;
  name: string;
  height: number;
  objects: SemanticObjectDTO[];
}

export interface SemanticObjectDTO {
  id: string;
  type: string;
  name: string;
  geometry: string;  // JSON 序列化的几何数据
  properties: Record<string, unknown>;
}
```

---

## 关键文件

| 文件 | 说明 | 跳转 |
|------|------|------|
| action.protocol.ts | Action 协议定义 | [查看](../../apps/frontend/SMART-MALL/src/protocol/action.protocol.ts) |
| action.enums.ts | Action 枚举定义 | [查看](../../apps/frontend/SMART-MALL/src/protocol/action.enums.ts) |
| result.protocol.ts | Result 协议定义 | [查看](../../apps/frontend/SMART-MALL/src/protocol/result.protocol.ts) |
| result.enums.ts | Result 枚举定义 | [查看](../../apps/frontend/SMART-MALL/src/protocol/result.enums.ts) |
| index.ts | 协议模块导出 | [查看](../../apps/frontend/SMART-MALL/src/protocol/index.ts) |

---

## 延伸阅读

- [API 设计最佳实践](https://swagger.io/resources/articles/best-practices-in-api-design/)
- [JSON Schema](https://json-schema.org/)
