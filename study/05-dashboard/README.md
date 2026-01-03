# 仪表盘功能学习指南

> 苏格拉底式教学：通过提问引导你理解仪表盘与动态路由权限系统的实现

## 第一部分：动态路由的本质

### 问题 1：为什么路由需要"动态"？

看这段代码：

```typescript
// 静态路由（无需权限）
const staticRoutes: RouteRecordRaw[] = [
  { path: '/login', name: 'Login', component: () => import('@/views/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/RegisterView.vue') },
  // ...
]
```

**为什么不把所有路由都写成静态的？管理员页面、商家页面、用户页面全部写死不行吗？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

想象这些场景：

1. **安全性**：如果所有路由都是静态的，普通用户虽然看不到管理员菜单，但可以直接在地址栏输入 `/admin/dashboard` 访问
2. **灵活性**：不同角色看到的菜单不同，静态路由无法根据用户角色动态调整
3. **可维护性**：权限配置在后端，前端不需要硬编码每个角色能访问哪些页面

**动态路由的核心思想**：
- 登录后，根据用户角色从后端获取可访问的路由列表
- 前端动态注册这些路由
- 用户只能访问被注册的路由

</details>

---

### 问题 2：动态路由是如何"注册"到 Vue Router 的？

看这段代码：

```typescript
export async function setupDynamicRoutes(router: Router): Promise<boolean> {
  const routeConfigs = await routeApi.getUserRoutes()
  
  routeConfigs.forEach((config) => {
    const route = transformRoute(config)
    router.addRoute(route)  // <-- 关键方法
    
    if (route.name) {
      registeredRouteNames.push(route.name as string)
    }
  })
  
  isRoutesLoaded = true
  return true
}
```

**`router.addRoute()` 做了什么？为什么要记录 `registeredRouteNames`？**

---

<details>
<summary>💡 点击查看引导</summary>

`router.addRoute()` 是 Vue Router 4 提供的 API：
- 在运行时向路由表添加新路由
- 添加后，用户就可以访问这个路由了

记录 `registeredRouteNames` 的原因：
- 用户登出时，需要移除这些动态路由
- 如果不移除，下一个用户登录时会看到上一个用户的路由

**追问**：如果用户 A 是管理员，用户 B 是普通用户，A 登出后 B 登录，如果不清理路由会怎样？

</details>

---

## 第二部分：路由守卫

### 问题 3：路由守卫的执行时机是什么？

```typescript
router.beforeEach(async (to, from, next) => {
  // 这里的代码什么时候执行？
})
```

**用户点击链接、直接输入 URL、刷新页面，守卫都会执行吗？**

---

<details>
<summary>💡 点击查看引导</summary>

`beforeEach` 是全局前置守卫：
- **每次路由跳转前**都会执行
- 包括：点击 `<router-link>`、调用 `router.push()`、直接输入 URL、刷新页面

参数含义：
- `to`：即将进入的目标路由
- `from`：当前正要离开的路由
- `next`：控制导航的函数

**关键洞察**：守卫是路由系统的"门卫"，所有进入的请求都要经过它的检查。

</details>

---

### 问题 4：白名单的作用是什么？

```typescript
const WHITE_LIST = ['/login', '/register', '/forgot-password', '/reset-password', '/404', '/403']

function isInWhiteList(path: string): boolean {
  return WHITE_LIST.some((p) => path.startsWith(p))
}
```

**为什么这些路由不需要登录就能访问？**

---

<details>
<summary>💡 点击查看引导</summary>

思考这个逻辑：
1. 用户未登录
2. 想要登录
3. 但登录页需要登录才能访问
4. 死循环！

白名单的作用：
- 登录、注册、忘记密码等页面必须对所有人开放
- 错误页面（404、403）也应该对所有人开放
- 这些是系统的"公共区域"

**追问**：为什么用 `startsWith` 而不是 `===`？

</details>

---

### 问题 5：这段守卫逻辑的执行顺序是什么？

```typescript
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 1. 尝试恢复登录状态
  if (!userStore.isAuthenticated) {
    userStore.restoreFromStorage()
  }
  
  // 2. 白名单检查
  if (isInWhiteList(to.path)) {
    if (isAuthenticated && LOGIN_REDIRECT_LIST.includes(to.path)) {
      return next({ path: '/mall' })
    }
    return next()
  }
  
  // 3. 未登录检查
  if (!isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  
  // 4. 动态路由加载
  if (!isDynamicRoutesLoaded()) {
    const success = await setupDynamicRoutes(router)
    if (success) {
      return next({ ...to, replace: true })
    }
  }
  
  // 5. 权限检查
  if (!hasRoutePermission(to, userRole)) {
    return next({ path: '/403' })
  }
  
  next()
})
```

**为什么要按这个顺序？如果把权限检查放在动态路由加载之前会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

顺序的逻辑：

1. **恢复状态**：刷新页面后，Pinia store 会重置，需要从 localStorage 恢复
2. **白名单优先**：公共页面不需要后续检查，提前放行
3. **登录检查**：未登录用户不需要加载动态路由
4. **动态路由**：已登录但路由未加载，先加载
5. **权限检查**：路由加载后才能检查权限

如果把权限检查放在动态路由加载之前：
- 路由还没注册，`to.meta.roles` 可能是 undefined
- 权限检查会失效

**这叫"守卫链"**：每一步都是下一步的前提条件。

</details>

---

## 第三部分：仪表盘数据加载

### 问题 6：为什么用 `Promise.all` 并行加载数据？

```typescript
async function loadData() {
  isLoading.value = true
  
  try {
    const [statsData, approvalsData] = await Promise.all([
      adminApi.getStats(),
      adminApi.getApprovalList({ status: 'PENDING' }),
    ])
    
    stats.value = statsData
    recentApprovals.value = approvalsData.slice(0, 5)
  } finally {
    isLoading.value = false
  }
}
```

**如果改成顺序加载会怎样？**

```typescript
const statsData = await adminApi.getStats()
const approvalsData = await adminApi.getApprovalList({ status: 'PENDING' })
```

---

<details>
<summary>💡 点击查看引导</summary>

假设每个请求需要 500ms：

**顺序加载**：
- 第一个请求：0-500ms
- 第二个请求：500-1000ms
- 总时间：1000ms

**并行加载（Promise.all）**：
- 两个请求同时发出
- 总时间：500ms（取决于最慢的那个）

`Promise.all` 的特点：
- 所有 Promise 都成功，返回结果数组
- 任一 Promise 失败，整体失败

**追问**：如果希望即使一个请求失败，另一个也能正常显示，应该用什么？

</details>

---

### 问题 7：`approvalsData.slice(0, 5)` 为什么在前端截取？

```typescript
recentApprovals.value = approvalsData.slice(0, 5)
```

**为什么不让后端只返回 5 条？**

---

<details>
<summary>💡 点击查看引导</summary>

这是一个设计权衡：

**前端截取的场景**：
- 数据量不大（几十条）
- 后端 API 是通用的，多处复用
- 不想为了一个小需求改后端

**后端分页的场景**：
- 数据量大（成百上千条）
- 需要精确控制传输量
- 有分页、排序等复杂需求

在这个例子中，待审批列表通常不会太多，前端截取是合理的。

**最佳实践**：如果数据量可能很大，应该让后端支持 `limit` 参数。

</details>

---

## 第四部分：组件化设计

### 问题 8：为什么要把统计卡片抽成 `StatCard` 组件？

```vue
<StatCard :value="stats?.merchantCount ?? '-'" label="商家总数" />
<StatCard :value="stats?.storeCount ?? '-'" label="店铺总数" />
<StatCard :value="stats?.pendingApprovals ?? '-'" label="待审批" />
<StatCard :value="stats?.onlineUsers ?? '-'" label="在线用户" />
```

**直接在 Dashboard 里写 4 个 div 不行吗？**

---

<details>
<summary>💡 点击查看引导</summary>

组件化的好处：

1. **复用**：其他页面也可能需要统计卡片
2. **一致性**：所有卡片样式统一，修改一处全局生效
3. **可维护性**：卡片逻辑独立，Dashboard 代码更简洁
4. **可测试性**：可以单独测试 StatCard 组件

**追问**：`stats?.merchantCount ?? '-'` 这个表达式做了什么？为什么用 `??` 而不是 `||`？

</details>

---

### 问题 9：DataTable 的插槽是如何工作的？

```vue
<DataTable
  :columns="approvalColumns"
  :data="recentApprovals"
  @row-click="handleApprovalClick"
>
  <template #createdAt="{ value }">
    {{ formatDate(value) }}
  </template>
  <template #reason="{ value }">
    <span class="reason-text">{{ value }}</span>
  </template>
</DataTable>
```

**`#createdAt` 和 `#reason` 是什么意思？为什么能自定义单元格渲染？**

---

<details>
<summary>💡 点击查看引导</summary>

这是 Vue 的**作用域插槽**（Scoped Slots）：

- `#createdAt` 是 `v-slot:createdAt` 的简写
- DataTable 组件内部会为每个列提供一个插槽
- 插槽名称对应 `columns` 中的 `key`

工作原理：
1. DataTable 遍历数据和列
2. 对于每个单元格，检查是否有对应的插槽
3. 如果有，使用插槽内容；如果没有，显示原始值
4. 插槽可以接收 `{ value, row, column }` 等数据

**这叫"渲染委托"**：父组件决定如何渲染特定内容。

</details>

---

## 第五部分：响应式布局

### 问题 10：这段 CSS 实现了什么效果？

```css
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
}
```

**在不同屏幕宽度下，统计卡片会如何排列？**

---

<details>
<summary>💡 点击查看引导</summary>

CSS Grid + 媒体查询实现响应式：

- **> 1200px**：4 列（`repeat(4, 1fr)`）
- **601-1200px**：2 列（`repeat(2, 1fr)`）
- **≤ 600px**：1 列（`1fr`）

`1fr` 表示"1 份可用空间"，所有列平分容器宽度。

**视觉效果**：
- 大屏幕：4 个卡片一行
- 中等屏幕：2 个卡片一行，共 2 行
- 小屏幕：1 个卡片一行，共 4 行

**这叫"移动优先"的反向实现**：从大屏幕开始，逐步适配小屏幕。

</details>

---

## 动手练习

现在你理解了仪表盘和动态路由的实现，试着完成这些练习：

### 练习 1：添加数据刷新功能
- 添加一个"刷新"按钮
- 点击后重新加载统计数据
- 显示加载状态

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const isLoading = ref(true)
const isRefreshing = ref(false)

async function loadData() {
  isLoading.value = true
  try {
    const [statsData, approvalsData] = await Promise.all([
      adminApi.getStats(),
      adminApi.getApprovalList({ status: 'PENDING' }),
    ])
    stats.value = statsData
    recentApprovals.value = approvalsData.slice(0, 5)
  } finally {
    isLoading.value = false
  }
}

async function refreshData() {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  try {
    await loadData()
  } finally {
    isRefreshing.value = false
  }
}
</script>

<template>
  <div class="dashboard-header">
    <h1>控制台</h1>
    <button 
      class="refresh-btn" 
      :disabled="isRefreshing"
      @click="refreshData"
    >
      <svg 
        class="refresh-icon" 
        :class="{ spinning: isRefreshing }"
        viewBox="0 0 24 24"
      >
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      {{ isRefreshing ? '刷新中...' : '刷新' }}
    </button>
  </div>
</template>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
```

**关键点**：
- 分离 `isLoading`（首次加载）和 `isRefreshing`（刷新）
- 防止重复点击
- 旋转动画提供视觉反馈

</details>

---

### 练习 2：实现路由权限缓存
- 将用户路由配置缓存到 localStorage
- 刷新页面时先使用缓存，再异步更新
- 减少白屏时间

<details>
<summary>📝 参考答案</summary>

```typescript
// router/dynamic.ts

const ROUTES_CACHE_KEY = 'user_routes_cache'
const CACHE_EXPIRY_KEY = 'user_routes_cache_expiry'
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟

interface CachedRoutes {
  routes: RouteConfig[]
  userId: string
}

// 保存路由到缓存
function cacheRoutes(routes: RouteConfig[], userId: string): void {
  const cache: CachedRoutes = { routes, userId }
  localStorage.setItem(ROUTES_CACHE_KEY, JSON.stringify(cache))
  localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION))
}

// 从缓存读取路由
function getCachedRoutes(userId: string): RouteConfig[] | null {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY)
    if (!expiry || Date.now() > Number(expiry)) {
      clearRoutesCache()
      return null
    }
    
    const cached = localStorage.getItem(ROUTES_CACHE_KEY)
    if (!cached) return null
    
    const { routes, userId: cachedUserId } = JSON.parse(cached) as CachedRoutes
    
    // 确保是同一个用户的缓存
    if (cachedUserId !== userId) {
      clearRoutesCache()
      return null
    }
    
    return routes
  } catch {
    clearRoutesCache()
    return null
  }
}

// 清除缓存
function clearRoutesCache(): void {
  localStorage.removeItem(ROUTES_CACHE_KEY)
  localStorage.removeItem(CACHE_EXPIRY_KEY)
}

// 修改 setupDynamicRoutes
export async function setupDynamicRoutes(router: Router): Promise<boolean> {
  const userStore = useUserStore()
  const userId = userStore.user?.id || ''
  
  // 1. 尝试使用缓存（快速显示）
  const cachedRoutes = getCachedRoutes(userId)
  if (cachedRoutes) {
    registerRoutes(router, cachedRoutes)
    console.log('[Router] 使用缓存路由')
    
    // 2. 后台异步更新缓存
    routeApi.getUserRoutes().then(freshRoutes => {
      cacheRoutes(freshRoutes, userId)
      // 如果路由有变化，可以提示用户刷新
    }).catch(console.error)
    
    return true
  }
  
  // 3. 没有缓存，正常加载
  try {
    const routeConfigs = await routeApi.getUserRoutes()
    registerRoutes(router, routeConfigs)
    cacheRoutes(routeConfigs, userId)
    return true
  } catch (error) {
    console.error('[Router] 动态路由加载失败:', error)
    return false
  }
}

// 登出时清除缓存
export function removeDynamicRoutes(router: Router): void {
  // ... 原有逻辑
  clearRoutesCache()
}
```

**关键点**：
- 缓存包含用户 ID，防止用户切换后使用错误缓存
- 设置过期时间，避免缓存过久
- 先用缓存快速显示，后台静默更新
- 登出时清除缓存

</details>

---

### 练习 3：添加权限变更检测
- 定时检查用户权限是否变更
- 如果变更，提示用户刷新页面
- 或自动重新加载路由

<details>
<summary>📝 参考答案</summary>

```typescript
// composables/usePermissionCheck.ts

import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { routeApi } from '@/api'
import { reloadDynamicRoutes } from '@/router'

export function usePermissionCheck(options: {
  interval?: number
  autoReload?: boolean
} = {}) {
  const { interval = 60000, autoReload = false } = options // 默认 1 分钟检查一次
  
  const router = useRouter()
  const hasPermissionChanged = ref(false)
  const showReloadPrompt = ref(false)
  
  let checkTimer: number | null = null
  let lastRouteHash: string = ''
  
  // 计算路由配置的哈希值
  function computeRouteHash(routes: any[]): string {
    return JSON.stringify(routes.map(r => ({
      path: r.path,
      name: r.name,
      meta: r.meta,
    })))
  }
  
  // 检查权限是否变更
  async function checkPermissions(): Promise<boolean> {
    try {
      const currentRoutes = await routeApi.getUserRoutes()
      const currentHash = computeRouteHash(currentRoutes)
      
      if (lastRouteHash && lastRouteHash !== currentHash) {
        hasPermissionChanged.value = true
        return true
      }
      
      lastRouteHash = currentHash
      return false
    } catch (error) {
      console.error('权限检查失败:', error)
      return false
    }
  }
  
  // 处理权限变更
  async function handlePermissionChange() {
    if (autoReload) {
      // 自动重新加载路由
      await reloadDynamicRoutes(router)
      hasPermissionChanged.value = false
      lastRouteHash = ''
    } else {
      // 显示提示
      showReloadPrompt.value = true
    }
  }
  
  // 用户确认刷新
  async function confirmReload() {
    showReloadPrompt.value = false
    await reloadDynamicRoutes(router)
    hasPermissionChanged.value = false
    lastRouteHash = ''
    
    // 重新导航到当前页面
    router.replace(router.currentRoute.value.fullPath)
  }
  
  // 用户忽略
  function dismissPrompt() {
    showReloadPrompt.value = false
  }
  
  // 开始定时检查
  function startChecking() {
    // 初始化哈希
    checkPermissions()
    
    checkTimer = window.setInterval(async () => {
      const changed = await checkPermissions()
      if (changed) {
        handlePermissionChange()
      }
    }, interval)
  }
  
  // 停止检查
  function stopChecking() {
    if (checkTimer) {
      clearInterval(checkTimer)
      checkTimer = null
    }
  }
  
  onMounted(startChecking)
  onUnmounted(stopChecking)
  
  return {
    hasPermissionChanged,
    showReloadPrompt,
    confirmReload,
    dismissPrompt,
    checkPermissions,
  }
}
```

**在组件中使用**：

```vue
<script setup lang="ts">
import { usePermissionCheck } from '@/composables/usePermissionCheck'

const { showReloadPrompt, confirmReload, dismissPrompt } = usePermissionCheck({
  interval: 30000, // 30 秒检查一次
  autoReload: false, // 不自动刷新，显示提示
})
</script>

<template>
  <!-- 权限变更提示 -->
  <Teleport to="body">
    <div v-if="showReloadPrompt" class="permission-prompt">
      <div class="prompt-content">
        <p>您的权限已更新，是否刷新页面以应用新权限？</p>
        <div class="prompt-actions">
          <button class="btn-secondary" @click="dismissPrompt">稍后</button>
          <button class="btn-primary" @click="confirmReload">立即刷新</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.permission-prompt {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.prompt-content {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 320px;
}

.prompt-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
```

**关键点**：
- 定时轮询检查权限
- 通过哈希值比较检测变化
- 提供自动刷新和手动确认两种模式
- 组件卸载时清理定时器

</details>

---

## 关键文件

- `apps/frontend/SMART-MALL/src/views/admin/DashboardView.vue` - 仪表盘页面
- `apps/frontend/SMART-MALL/src/router/index.ts` - 路由入口
- `apps/frontend/SMART-MALL/src/router/dynamic.ts` - 动态路由管理
- `apps/frontend/SMART-MALL/src/router/guards.ts` - 路由守卫
- `apps/frontend/SMART-MALL/src/api/admin.api.ts` - 管理员 API

---

## Element Plus 仪表盘组件

仪表盘页面已使用 Element Plus 组件重构：

### 使用的组件

| 组件 | 用途 |
|------|------|
| `ElRow`, `ElCol` | 栅格布局 |
| `ElCard` | 卡片容器 |
| `ElStatistic` | 统计数值展示 |
| `ElTable`, `ElTableColumn` | 数据表格 |
| `ElTag` | 状态标签 |
| `ElSkeleton` | 加载骨架屏 |
| `ElEmpty` | 空状态 |

### 仪表盘组件示例

```vue
<script setup lang="ts">
import {
  ElRow,
  ElCol,
  ElCard,
  ElStatistic,
  ElTable,
  ElTableColumn,
  ElTag,
  ElSkeleton,
} from 'element-plus'
</script>

<template>
  <main class="dashboard-page">
    <!-- 统计卡片区域 -->
    <section class="stats-section">
      <ElRow :gutter="16">
        <ElCol :xs="24" :sm="12" :lg="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="商家总数" :value="stats?.merchantCount ?? 0">
              <template #suffix>
                <ElTag type="success" size="small">+12%</ElTag>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <!-- 更多统计卡片... -->
      </ElRow>
    </section>

    <!-- 数据表格区域 -->
    <section class="table-section">
      <ElCard shadow="never">
        <template #header>
          <header class="card-header">
            <h3>待审批列表</h3>
          </header>
        </template>

        <ElTable :data="recentApprovals" stripe>
          <ElTableColumn prop="merchantName" label="商家名称" />
          <ElTableColumn prop="reason" label="申请原因" />
          <ElTableColumn prop="status" label="状态">
            <template #default="{ row }">
              <ElTag :type="getStatusType(row.status)">
                {{ row.status }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="createdAt" label="申请时间">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </section>
  </main>
</template>
```

### SCSS 嵌套语法示例

```scss
.dashboard-page {
  .stats-section {
    margin-bottom: 24px;

    .stat-card {
      background: #1d1e1f;
      border: 1px solid rgba(255, 255, 255, 0.06);

      :deep(.el-statistic) {
        .el-statistic__head {
          color: #9aa0a6;
          font-size: 14px;
        }

        .el-statistic__content {
          color: #e8eaed;

          .el-statistic__number {
            font-size: 32px;
            font-weight: 600;
          }
        }
      }
    }
  }

  .table-section {
    :deep(.el-card) {
      background: #1d1e1f;
      border: 1px solid rgba(255, 255, 255, 0.06);

      .el-card__header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        padding: 16px 20px;
      }
    }

    :deep(.el-table) {
      background: transparent;

      th.el-table__cell {
        background: rgba(255, 255, 255, 0.02);
        color: #9aa0a6;
      }

      td.el-table__cell {
        color: #e8eaed;
      }

      tr:hover > td.el-table__cell {
        background: rgba(255, 255, 255, 0.04);
      }
    }
  }
}
```

### 响应式布局

使用 Element Plus 栅格系统实现响应式：

```vue
<ElRow :gutter="16">
  <!-- xs: 手机 (<768px) - 1列 -->
  <!-- sm: 平板 (≥768px) - 2列 -->
  <!-- lg: 桌面 (≥1200px) - 4列 -->
  <ElCol :xs="24" :sm="12" :lg="6">
    <StatCard />
  </ElCol>
</ElRow>
```

---

*"认识你自己的权限边界。" —— 改编自德尔斐神谕*
