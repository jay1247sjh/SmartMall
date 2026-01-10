# 用户管理模块

> 学习目标：理解管理员用户管理功能的实现，包括用户列表、搜索筛选、状态管理和详情查看。

## 1. 功能概述

用户管理是 Smart Mall 管理员后台的核心模块，允许系统管理员：
- 查看系统中所有用户的列表
- 按用户名、邮箱、类型、状态搜索和筛选用户
- 冻结或激活用户账户
- 查看用户详细信息

## 2. 文件结构

```
src/
├── api/
│   ├── admin.api.ts              # 管理员 API（包含用户管理接口）
│   └── __tests__/
│       └── admin.api.test.ts     # API 单元测试和属性测试
├── components/
│   └── admin/
│       ├── index.ts              # 管理员组件导出
│       └── UserDetailDrawer.vue  # 用户详情抽屉组件
├── views/
│   └── admin/
│       └── UserManageView.vue    # 用户管理主页面
└── router/
    ├── componentMap.ts           # 组件映射（AdminUserManage）
    └── mock/
        └── route.mock.ts         # 路由配置（/admin/users）
```

## 3. 核心代码解析

### 3.1 API 接口设计

用户管理 API 在 `admin.api.ts` 中扩展：

```typescript
// 类型定义
interface UserListParams {
  keyword?: string                              // 搜索关键词
  userType?: 'ALL' | 'ADMIN' | 'MERCHANT' | 'USER'  // 用户类型
  status?: 'ALL' | 'ACTIVE' | 'FROZEN' | 'DELETED'  // 用户状态
  page?: number                                 // 页码
  pageSize?: number                             // 每页数量
}

interface UserListResponse {
  list: UserInfo[]
  total: number
}

interface UserDetail extends UserInfo {
  phone?: string
  lastLoginTime?: string
}

// API 方法
export async function getUserList(params?: UserListParams): Promise<UserListResponse>
export async function getUserDetail(userId: string): Promise<UserDetail>
export async function freezeUser(userId: string): Promise<void>
export async function activateUser(userId: string): Promise<void>
```

### 3.2 搜索筛选实现

搜索筛选逻辑在 API 层实现（Mock 数据）：

```typescript
export async function getUserList(params?: UserListParams): Promise<UserListResponse> {
  let filtered = [...mockUsers]
  
  // 关键词搜索（用户名或邮箱，不区分大小写）
  if (params?.keyword) {
    const keyword = params.keyword.toLowerCase()
    filtered = filtered.filter(
      user => user.username.toLowerCase().includes(keyword) ||
              user.email.toLowerCase().includes(keyword)
    )
  }
  
  // 用户类型筛选
  if (params?.userType && params.userType !== 'ALL') {
    filtered = filtered.filter(user => user.userType === params.userType)
  }
  
  // 状态筛选
  if (params?.status && params.status !== 'ALL') {
    filtered = filtered.filter(user => user.status === params.status)
  }
  
  // 分页
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)
  
  return { list, total: filtered.length }
}
```

### 3.3 用户管理视图

`UserManageView.vue` 的核心结构：

```vue
<script setup lang="ts">
// 状态定义
const users = ref<UserInfo[]>([])
const total = ref(0)
const isLoading = ref(false)
const searchForm = reactive<UserListParams>({
  keyword: '',
  userType: 'ALL',
  status: 'ALL',
  page: 1,
  pageSize: 10,
})

// 加载用户列表
async function loadUsers() {
  isLoading.value = true
  try {
    const res = await adminApi.getUserList(searchForm)
    users.value = res.list
    total.value = res.total
  } finally {
    isLoading.value = false
  }
}

// 冻结用户（带确认对话框）
async function handleFreezeUser(user: UserInfo) {
  await ElMessageBox.confirm(`确定要冻结用户 "${user.username}" 吗？`)
  await adminApi.freezeUser(user.userId)
  ElMessage.success('用户已冻结')
  await loadUsers()
}
</script>
```

### 3.4 用户详情抽屉

`UserDetailDrawer.vue` 使用 Element Plus 的 `ElDrawer` 和 `ElDescriptions`：

```vue
<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  userId: string | null
}>()

// 监听 userId 变化，加载详情
watch(() => props.userId, async (newUserId) => {
  if (newUserId) {
    user.value = await adminApi.getUserDetail(newUserId)
  }
})
</script>

<template>
  <ElDrawer :model-value="visible" title="用户详情" size="400px">
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem label="用户 ID">{{ user.userId }}</ElDescriptionsItem>
      <ElDescriptionsItem label="用户名">{{ user.username }}</ElDescriptionsItem>
      <!-- ... 其他字段 -->
    </ElDescriptions>
  </ElDrawer>
</template>
```

## 4. 路由配置

### 4.1 组件映射

在 `componentMap.ts` 中添加：

```typescript
export const componentMap = {
  // ... 其他组件
  'AdminUserManage': () => import('@/views/admin/UserManageView.vue'),
}
```

### 4.2 路由配置

在 `route.mock.ts` 的 adminRoutes 中添加：

```typescript
{
  path: 'users',
  name: 'AdminUserManage',
  component: 'AdminUserManage',
  meta: { title: '用户管理', icon: 'user' },
}
```

## 5. 属性测试

使用 fast-check 进行属性测试，验证核心功能的正确性：

### 5.1 搜索过滤正确性

```typescript
describe('Property 1: Search Filter Correctness', () => {
  it('should only return users matching the search keyword', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('admin', 'merchant', 'user', 'example'),
        async (keyword) => {
          const result = await getUserList({ keyword })
          const lowerKeyword = keyword.toLowerCase()
          
          // 验证所有返回的用户都匹配搜索条件
          result.list.forEach(user => {
            const matches = user.username.toLowerCase().includes(lowerKeyword) ||
                           user.email.toLowerCase().includes(lowerKeyword)
            expect(matches).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### 5.2 状态转换正确性

```typescript
describe('Property 2: Status Transition Correctness', () => {
  it('should correctly transition user status', async () => {
    // 冻结 ACTIVE 用户 → 状态变为 FROZEN
    // 激活 FROZEN 用户 → 状态变为 ACTIVE
  })
})
```

### 5.3 详情数据完整性

```typescript
describe('Property 3: Detail View Data Completeness', () => {
  it('should return all required fields for any user', async () => {
    // 验证所有必需字段都存在：userId, username, email, userType, status, createdAt
  })
})
```

## 6. 关键设计决策

### 6.1 为什么使用抽屉而不是模态框？

- 抽屉从侧边滑出，不会完全遮挡列表
- 用户可以同时看到列表和详情
- 更适合展示详细信息的场景

### 6.2 为什么状态变更需要确认？

- 冻结用户是敏感操作，会影响用户登录
- 确认对话框防止误操作
- 符合用户体验最佳实践

### 6.3 为什么搜索是前端过滤？

- 当前使用 Mock 数据，搜索在前端实现
- 生产环境应改为后端搜索（API 参数传递）
- 代码结构已预留后端接口调用位置

## 7. 常见问题

### Q1: 为什么访问 /admin/users 之前会 404？

**原因**：
1. `componentMap.ts` 中没有 `AdminUserManage` 组件映射
2. `route.mock.ts` 中没有 `/admin/users` 路由配置
3. `UserManageView.vue` 视图文件不存在

**解决**：按照本模块的实现，添加上述三个部分。

### Q2: 如何添加新的用户操作（如删除）？

1. 在 `admin.api.ts` 中添加 `deleteUser` 方法
2. 在 `UserManageView.vue` 中添加删除按钮和处理函数
3. 添加确认对话框和成功/失败提示

### Q3: 如何对接真实后端？

在 `admin.api.ts` 中，将 Mock 实现替换为真实 API 调用：

```typescript
export async function getUserList(params?: UserListParams): Promise<UserListResponse> {
  // 替换 Mock 实现
  return http.get('/api/admin/users', { params })
}
```

## 8. 扩展阅读

- [Element Plus Table 组件](https://element-plus.org/zh-CN/component/table.html)
- [Element Plus Drawer 组件](https://element-plus.org/zh-CN/component/drawer.html)
- [fast-check 属性测试](https://github.com/dubzzz/fast-check)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
