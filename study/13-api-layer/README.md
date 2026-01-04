# API 层学习指南

## 学习目标

通过本章学习，你将掌握：
- Axios HTTP 客户端封装
- 请求/响应拦截器
- Token 自动刷新机制
- API 模块化组织

---

## 苏格拉底式问答

### 问题 1：为什么要封装 HTTP 客户端？

**思考**：如果每个 API 调用都直接使用 `fetch` 或 `axios`，会有什么问题？

<details>
<summary>点击查看答案</summary>

直接使用的问题：
1. **重复代码**：每次都要设置 baseURL、headers
2. **错误处理分散**：每个调用都要写 try-catch
3. **Token 管理困难**：每次都要手动添加 Authorization
4. **无法统一处理**：如 401 跳转登录、网络错误提示

封装后的好处：
```typescript
// 封装前
const response = await fetch('http://localhost:8080/api/user', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

// 封装后
const data = await http.get('/user');
```

</details>

### 问题 2：拦截器的执行顺序是什么？

**思考**：请求拦截器和响应拦截器分别在什么时候执行？

<details>
<summary>点击查看答案</summary>

```
发起请求 → 请求拦截器 → 服务器 → 响应拦截器 → 得到数据
           ↓                      ↓
        添加 Token              处理错误
        转换数据                解析响应
```

**请求拦截器**：在请求发送前执行
- 添加 Authorization header
- 添加时间戳防缓存
- 转换请求数据格式

**响应拦截器**：在收到响应后执行
- 统一错误处理
- 解析响应数据
- Token 过期处理

</details>

### 问题 3：如何处理 Token 过期？

**思考**：当 API 返回 401 时，应该怎么处理？

<details>
<summary>点击查看答案</summary>

**策略 1：直接跳转登录**
```typescript
if (response.status === 401) {
  localStorage.removeItem('token');
  router.push('/login');
}
```

**策略 2：自动刷新 Token**
```typescript
if (response.status === 401 && !config._retry) {
  config._retry = true;
  const newToken = await refreshToken();
  config.headers.Authorization = `Bearer ${newToken}`;
  return http(config);  // 重试原请求
}
```

</details>

---

## 核心代码解析

### 1. HTTP 客户端封装

```typescript
// api/http.ts
import axios, { AxiosInstance } from 'axios';

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data;
    if (code === '0') {
      return data;
    }
    return Promise.reject(new Error(message));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default http;
```

### 2. API 模块化

```typescript
// api/auth.api.ts
import http from './http';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> => 
    http.post('/api/auth/login', data),
  
  logout: (): Promise<void> => 
    http.post('/api/auth/logout'),
  
  refreshToken: (): Promise<{ token: string }> => 
    http.post('/api/auth/refresh')
};
```

### 3. 商城建模器 API

```typescript
// api/mall-builder.api.ts
import http from './http';
import type { MallProject, Floor } from '@/builder/types';

export interface SaveProjectRequest {
  id?: string;
  name: string;
  description?: string;
  floors: Floor[];
}

export const mallBuilderApi = {
  getProjects: (): Promise<MallProject[]> => 
    http.get('/api/mall-builder/projects'),
  
  getProject: (id: string): Promise<MallProject> => 
    http.get(`/api/mall-builder/projects/${id}`),
  
  saveProject: (data: SaveProjectRequest): Promise<MallProject> => 
    http.post('/api/mall-builder/projects', data),
  
  deleteProject: (id: string): Promise<void> => 
    http.delete(`/api/mall-builder/projects/${id}`)
};
```

---

## 关键文件

| 文件 | 说明 | 跳转 |
|------|------|------|
| http.ts | Axios 封装、拦截器 | [查看](../../apps/frontend/SMART-MALL/src/api/http.ts) |
| auth.api.ts | 登录、登出、刷新 Token | [查看](../../apps/frontend/SMART-MALL/src/api/auth.api.ts) |
| register.api.ts | 注册、用户名检查 | [查看](../../apps/frontend/SMART-MALL/src/api/register.api.ts) |
| password.api.ts | 忘记密码、重置密码 | [查看](../../apps/frontend/SMART-MALL/src/api/password.api.ts) |
| mall-builder.api.ts | 建模器项目 CRUD | [查看](../../apps/frontend/SMART-MALL/src/api/mall-builder.api.ts) |
| mall.api.ts | 商城数据 API | [查看](../../apps/frontend/SMART-MALL/src/api/mall.api.ts) |
| mall-manage.api.ts | 商城管理 API | [查看](../../apps/frontend/SMART-MALL/src/api/mall-manage.api.ts) |
| user.api.ts | 用户信息 API | [查看](../../apps/frontend/SMART-MALL/src/api/user.api.ts) |
| admin.api.ts | 管理员 API | [查看](../../apps/frontend/SMART-MALL/src/api/admin.api.ts) |
| merchant.api.ts | 商户 API | [查看](../../apps/frontend/SMART-MALL/src/api/merchant.api.ts) |
| route.api.ts | 路由 API | [查看](../../apps/frontend/SMART-MALL/src/api/route.api.ts) |
| index.ts | API 模块导出 | [查看](../../apps/frontend/SMART-MALL/src/api/index.ts) |

---

## 延伸阅读

- [Axios 官方文档](https://axios-http.com/)
- [RESTful API 设计指南](https://restfulapi.net/)
