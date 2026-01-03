# Design Document

## Overview

本设计文档定义前端核心页面的技术实现方案。所有页面采用统一的深色主题设计，基于 Vue 3 Composition API + TypeScript 实现，遵循项目既有的分层架构。

核心设计原则：
1. **组件复用** - 提取 DashboardLayout 布局组件，所有内部页面共享
2. **深色主题** - 统一使用 #0a0a0a 背景、#111113 卡片色、#e8eaed 文字色
3. **响应式设计** - 支持桌面端和移动端适配
4. **状态管理** - 使用 Pinia Store 管理全局状态

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Views Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │              DashboardLayout.vue                     │   │
│  │  ┌─────────┐  ┌──────────────────────────────────┐  │   │
│  │  │ Sidebar │  │         Content Area             │  │   │
│  │  │         │  │  ┌────────────────────────────┐  │  │   │
│  │  │ - Logo  │  │  │        Topbar              │  │  │   │
│  │  │ - Menu  │  │  ├────────────────────────────┤  │  │   │
│  │  │ - User  │  │  │     <slot> (Page)          │  │  │   │
│  │  │         │  │  │                            │  │  │   │
│  │  └─────────┘  │  └────────────────────────────┘  │  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      Page Components                        │
│  ProfileView | AdminDashboard | MerchantDashboard | ...    │
├─────────────────────────────────────────────────────────────┤
│                      Shared Components                      │
│  StatCard | QuickActionCard | DataTable | Modal | ...      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. DashboardLayout 布局组件

```typescript
// src/components/layouts/DashboardLayout.vue

interface Props {
  pageTitle: string        // 页面标题
  showBackButton?: boolean // 是否显示返回按钮
}

interface MenuItem {
  title: string
  icon: string
  path: string
  roles?: string[]  // 允许访问的角色
}

// 菜单配置
const menuConfig: MenuItem[] = [
  { title: '首页', icon: '🏠', path: '/mall' },
  // Admin
  { title: '管理中心', icon: '⚙️', path: '/admin/dashboard', roles: ['ADMIN'] },
  { title: '商城管理', icon: '🏬', path: '/admin/mall', roles: ['ADMIN'] },
  { title: '区域审批', icon: '✅', path: '/admin/area-approval', roles: ['ADMIN'] },
  { title: '版本管理', icon: '📋', path: '/admin/layout-version', roles: ['ADMIN'] },
  // Merchant
  { title: '工作台', icon: '📊', path: '/merchant/dashboard', roles: ['MERCHANT'] },
  { title: '店铺配置', icon: '🏪', path: '/merchant/store-config', roles: ['MERCHANT'] },
  { title: '区域申请', icon: '📝', path: '/merchant/area-apply', roles: ['MERCHANT'] },
  { title: '建模工具', icon: '🔧', path: '/merchant/builder', roles: ['MERCHANT'] },
  // Common
  { title: '个人中心', icon: '👤', path: '/user/profile' },
]
```

### 2. 共享 UI 组件

```typescript
// src/components/shared/StatCard.vue
interface StatCardProps {
  icon: string
  value: string | number
  label: string
  trend?: { value: number; direction: 'up' | 'down' }
}

// src/components/shared/QuickActionCard.vue
interface QuickActionProps {
  icon: string
  title: string
  description: string
  path: string
  color: string
}

// src/components/shared/DataTable.vue
interface Column {
  key: string
  title: string
  width?: string
  render?: (row: any) => VNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  pagination?: { page: number; pageSize: number; total: number }
}

// src/components/shared/Modal.vue
interface ModalProps {
  visible: boolean
  title: string
  width?: string
  closable?: boolean
}
```

### 3. API 接口定义

```typescript
// src/api/user.api.ts
interface UserProfile {
  id: number
  username: string
  email: string
  phone?: string
  avatar?: string
  role: string
  status: string
  createdAt: string
}

interface UpdateProfileRequest {
  email?: string
  phone?: string
  avatar?: string
}

export const userApi = {
  getProfile: () => Promise<UserProfile>
  updateProfile: (data: UpdateProfileRequest) => Promise<UserProfile>
}

// src/api/admin.api.ts
interface AdminStats {
  merchantCount: number
  storeCount: number
  pendingApprovals: number
  onlineUsers: number
}

interface ApprovalRequest {
  id: number
  merchantId: number
  merchantName: string
  areaId: number
  areaName: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export const adminApi = {
  getStats: () => Promise<AdminStats>
  getApprovalList: (params: { status?: string; page?: number }) => Promise<ApprovalRequest[]>
  approveRequest: (id: number) => Promise<void>
  rejectRequest: (id: number, reason: string) => Promise<void>
}

// src/api/merchant.api.ts
interface MerchantStats {
  storeCount: number
  productCount: number
  todayVisitors: number
  pendingTasks: number
}

interface Store {
  id: number
  name: string
  description: string
  category: string
  logo?: string
  cover?: string
  status: string
}

interface AreaApplication {
  id: number
  areaId: number
  areaName: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectReason?: string
  createdAt: string
}

export const merchantApi = {
  getStats: () => Promise<MerchantStats>
  getMyStores: () => Promise<Store[]>
  updateStore: (id: number, data: Partial<Store>) => Promise<Store>
  getMyApplications: () => Promise<AreaApplication[]>
  applyForArea: (areaId: number, reason: string) => Promise<AreaApplication>
}

// src/api/mall.api.ts
interface Floor {
  id: number
  name: string
  level: number
  areas: Area[]
}

interface Area {
  id: number
  name: string
  type: string
  status: 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'
  merchantId?: number
  merchantName?: string
  bounds: { x: number; y: number; width: number; height: number }
}

interface LayoutVersion {
  id: number
  version: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  createdBy: string
  createdAt: string
  description: string
}

export const mallApi = {
  getFloors: () => Promise<Floor[]>
  createFloor: (data: Partial<Floor>) => Promise<Floor>
  updateFloor: (id: number, data: Partial<Floor>) => Promise<Floor>
  deleteFloor: (id: number) => Promise<void>
  
  getAreas: (floorId: number) => Promise<Area[]>
  createArea: (floorId: number, data: Partial<Area>) => Promise<Area>
  updateArea: (id: number, data: Partial<Area>) => Promise<Area>
  deleteArea: (id: number) => Promise<void>
  
  getVersions: () => Promise<LayoutVersion[]>
  publishVersion: (id: number) => Promise<void>
  rollbackVersion: (id: number) => Promise<void>
}
```

## Data Models

### 页面状态模型

```typescript
// Profile Page State
interface ProfilePageState {
  isEditing: boolean
  isLoading: boolean
  isSaving: boolean
  profile: UserProfile | null
  editForm: UpdateProfileRequest
  error: string | null
}

// Admin Dashboard State
interface AdminDashboardState {
  stats: AdminStats | null
  recentApprovals: ApprovalRequest[]
  isLoading: boolean
}

// Merchant Dashboard State
interface MerchantDashboardState {
  stats: MerchantStats | null
  stores: Store[]
  applications: AreaApplication[]
  isLoading: boolean
}

// Area Approval Page State
interface AreaApprovalState {
  approvals: ApprovalRequest[]
  selectedApproval: ApprovalRequest | null
  filter: { status: string }
  isLoading: boolean
  isProcessing: boolean
  rejectReason: string
}

// Store Config Page State
interface StoreConfigState {
  stores: Store[]
  selectedStore: Store | null
  isEditing: boolean
  isSaving: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role-based Menu Filtering

*For any* user role (ADMIN, MERCHANT, USER), the menu items displayed in DashboardLayout SHALL only include items where the user's role is in the item's roles array, or the item has no roles restriction.

**Validates: Requirements 1.4**

### Property 2: Edit Mode State Consistency

*For any* page with edit functionality (ProfileView, StoreConfigView), when isEditing is true, the form fields SHALL be editable, and when isEditing is false, the form fields SHALL be read-only.

**Validates: Requirements 2.4**

### Property 3: API Error Handling

*For any* API call that fails, the corresponding page SHALL display an error message and SHALL NOT leave the UI in an inconsistent state.

**Validates: Requirements 2.7, 6.7, 7.7**

## Error Handling

### 错误类型分类

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',      // 网络错误
  AUTH = 'AUTH',            // 认证错误
  PERMISSION = 'PERMISSION', // 权限错误
  VALIDATION = 'VALIDATION', // 验证错误
  SERVER = 'SERVER',        // 服务器错误
}

interface AppError {
  type: ErrorType
  message: string
  details?: any
}
```

### 错误处理策略

1. **网络错误** - 显示"网络连接失败，请检查网络"，提供重试按钮
2. **认证错误** - 清除登录状态，跳转到登录页
3. **权限错误** - 显示"无权限访问"，提供返回按钮
4. **验证错误** - 在表单字段旁显示具体错误信息
5. **服务器错误** - 显示"服务器错误，请稍后重试"

### 全局错误处理

```typescript
// src/utils/errorHandler.ts
export function handleApiError(error: any): AppError {
  if (error.response) {
    const status = error.response.status
    if (status === 401) return { type: ErrorType.AUTH, message: '登录已过期' }
    if (status === 403) return { type: ErrorType.PERMISSION, message: '无权限访问' }
    if (status === 422) return { type: ErrorType.VALIDATION, message: error.response.data.message }
    return { type: ErrorType.SERVER, message: '服务器错误' }
  }
  return { type: ErrorType.NETWORK, message: '网络连接失败' }
}
```

## Testing Strategy

### 单元测试

使用 Vitest + Vue Test Utils 进行组件单元测试：

1. **DashboardLayout 测试**
   - 测试菜单项根据角色正确过滤
   - 测试侧边栏折叠/展开功能
   - 测试登出功能

2. **页面组件测试**
   - 测试数据加载和显示
   - 测试表单验证
   - 测试错误状态处理

### 属性测试

使用 fast-check 进行属性测试：

1. **Property 1: Role-based Menu Filtering**
   - 生成随机角色，验证菜单过滤逻辑

### 集成测试

1. **API 集成测试** - 使用 MSW 模拟后端响应
2. **路由测试** - 验证页面导航和权限守卫

### 测试配置

```typescript
// vitest.config.ts
export default {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
}
```

## UI Design Specifications

### 颜色规范

```css
:root {
  /* 背景色 */
  --bg-primary: #0a0a0a;
  --bg-secondary: #111113;
  --bg-tertiary: #161618;
  
  /* 边框色 */
  --border-color: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.1);
  
  /* 文字色 */
  --text-primary: #e8eaed;
  --text-secondary: #9aa0a6;
  --text-muted: #5f6368;
  
  /* 强调色 */
  --accent-blue: #60a5fa;
  --accent-purple: #a78bfa;
  --accent-green: #34d399;
  --accent-yellow: #fbbf24;
  --accent-red: #f28b82;
}
```

### 组件样式规范

```css
/* 卡片 */
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

/* 按钮 - 主要 */
.btn-primary {
  background: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
}

/* 按钮 - 次要 */
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 24px;
}

/* 输入框 */
.input {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
}

.input:focus {
  border-color: var(--accent-blue);
  outline: none;
}
```

### 响应式断点

```css
/* 移动端 */
@media (max-width: 600px) { }

/* 平板 */
@media (max-width: 900px) { }

/* 桌面 */
@media (max-width: 1200px) { }
```
