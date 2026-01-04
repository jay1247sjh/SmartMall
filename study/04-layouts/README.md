# 布局系统学习指南

> 苏格拉底式教学：通过提问引导你理解 Vue Router 布局系统的实现

## 第一部分：理解问题

### 问题 1：为什么需要布局组件？

看这个项目的页面结构：

```
登录页 - 无导航栏，全屏表单
商城页 - 有顶部导航，有侧边栏
管理后台 - 有顶部导航，有管理菜单
商户中心 - 有顶部导航，有商户菜单
```

**如果没有布局组件，每个页面都要写一遍导航栏吗？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

没有布局组件的问题：

```vue
<!-- MallView.vue -->
<template>
  <div>
    <header>导航栏...</header>  <!-- 重复 -->
    <main>商城内容</main>
  </div>
</template>

<!-- UserProfileView.vue -->
<template>
  <div>
    <header>导航栏...</header>  <!-- 又重复 -->
    <main>用户资料</main>
  </div>
</template>
```

问题：
- 代码重复
- 修改导航栏要改很多文件
- 容易出现不一致

**布局组件的作用**：把共同的部分提取出来，页面只关心自己的内容。

</details>

---

### 问题 2：`<router-view>` 是什么？

看 `MainLayout.vue`：

```vue
<template>
  <div class="main-layout">
    <header class="layout-header">
      <!-- 导航栏内容 -->
    </header>
    <main class="layout-content">
      <router-view />  <!-- 这是什么？ -->
    </main>
  </div>
</template>
```

**`<router-view>` 会渲染什么内容？**

---

<details>
<summary>💡 点击查看引导</summary>

`<router-view>` 是一个"占位符"：

- 它会根据当前 URL 渲染对应的组件
- 访问 `/mall` → 渲染 `MallView.vue`
- 访问 `/user/profile` → 渲染 `UserProfileView.vue`

类比：
- 布局组件是"相框"
- `<router-view>` 是"照片位置"
- 页面组件是"照片"

**嵌套路由**：布局组件里的 `<router-view>` 渲染子路由的组件。

</details>

---

## 第二部分：路由配置

### 问题 3：静态路由和动态路由有什么区别？

看 `router/index.ts`：

```typescript
// 静态路由（无需权限）
const staticRoutes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('@/views/LoginView.vue') },
  { path: '/register', component: () => import('@/views/RegisterView.vue') },
  { path: '/404', component: () => import('@/views/errors/NotFoundView.vue') },
]
```

**为什么登录页是静态路由，而商城页是动态路由？**

---

<details>
<summary>💡 点击查看引导</summary>

区别在于"谁能访问"：

**静态路由**：
- 任何人都能访问
- 不需要登录
- 在应用启动时就注册好

**动态路由**：
- 需要登录才能访问
- 不同角色看到不同的路由
- 登录后根据用户权限动态添加

为什么这样设计？
- 安全：未登录用户看不到后台路由
- 灵活：不同角色有不同的菜单
- 性能：只加载用户需要的路由

</details>

---

### 问题 4：动态路由是如何加载的？

看 `router/dynamic.ts`：

```typescript
export async function setupDynamicRoutes(router: Router): Promise<boolean> {
  try {
    // 1. 从后端获取用户可访问的路由
    const routeConfigs = await routeApi.getUserRoutes()

    // 2. 转换并注册路由
    routeConfigs.forEach((config) => {
      const route = transformRoute(config)
      router.addRoute(route)  // 动态添加路由
    })

    return true
  } catch (error) {
    return false
  }
}
```

**`router.addRoute()` 是什么？为什么不在一开始就定义好所有路由？**

---

<details>
<summary>💡 点击查看引导</summary>

`router.addRoute()` 是 Vue Router 的 API，用于在运行时添加路由。

为什么需要动态添加？

1. **权限控制**
   - 管理员能访问 `/admin/*`
   - 普通用户不能
   - 如果一开始就定义，普通用户也能看到这些路由

2. **后端控制**
   - 路由配置存在数据库
   - 可以通过后台管理系统修改
   - 不需要改前端代码

3. **按需加载**
   - 只加载用户需要的路由
   - 减少初始加载时间

**流程**：
```
用户登录 → 获取用户角色 → 请求该角色的路由 → 动态注册 → 用户可以访问
```

</details>

---

## 第三部分：路由守卫

### 问题 5：什么是路由守卫？

看 `router/guards.ts`：

```typescript
router.beforeEach(async (to, from, next) => {
  // 每次路由跳转前都会执行这里
  // to: 要去的路由
  // from: 来自的路由
  // next: 放行函数
})
```

**为什么需要路由守卫？**

---

<details>
<summary>💡 点击查看引导</summary>

路由守卫是"门卫"：

- 每次用户想去一个页面，都要先经过门卫
- 门卫检查：你有权限吗？你登录了吗？
- 门卫决定：放行、拦截、重定向

没有路由守卫的问题：
- 用户可以直接输入 URL 访问任何页面
- 未登录用户可以访问后台
- 没有权限的用户可以访问管理页面

**路由守卫 = 前端的权限控制**

</details>

---

### 问题 6：这段守卫逻辑在做什么？

```typescript
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 1. 尝试恢复登录状态
  if (!userStore.isAuthenticated) {
    userStore.restoreFromStorage()
  }
  
  // 2. 白名单路由直接放行
  if (isInWhiteList(to.path)) {
    if (isAuthenticated && LOGIN_REDIRECT_LIST.includes(to.path)) {
      return next({ path: '/mall' })
    }
    return next()
  }
  
  // 3. 未登录，重定向到登录页
  if (!isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  
  // 4. 检查动态路由是否已加载
  if (!isDynamicRoutesLoaded()) {
    await setupDynamicRoutes(router)
    return next({ ...to, replace: true })
  }
  
  // 5. 检查权限
  if (!hasRoutePermission(to, userRole)) {
    return next({ path: '/403' })
  }
  
  // 6. 放行
  next()
})
```

**画出这个守卫的流程图。**

---

<details>
<summary>💡 点击查看引导</summary>

```
┌─────────────────┐
│   用户访问 URL   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 恢复登录状态     │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │ 是白名单？  │
    └────┬───────┘
    是   │   否
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌───────────┐
│已登录？│  │  已登录？  │
└───┬───┘  └─────┬─────┘
 是 │ 否        是│否
    │ │          │ │
    ▼ ▼          ▼ ▼
重定向 放行    继续  重定向
/mall         检查  /login
              │
              ▼
         ┌────────────┐
         │路由已加载？ │
         └────┬───────┘
         否   │   是
              │
              ▼
         ┌────────────┐
         │ 有权限？    │
         └────┬───────┘
         是   │   否
              │
              ▼
            放行/403
```

**关键点**：
- 白名单优先检查
- 动态路由懒加载
- 权限最后检查

</details>

---

### 问题 7：为什么要 `next({ ...to, replace: true })`？

```typescript
if (!isDynamicRoutesLoaded()) {
  await setupDynamicRoutes(router)
  return next({ ...to, replace: true })  // 为什么这样写？
}
```

**为什么不直接 `next()`？**

---

<details>
<summary>💡 点击查看引导</summary>

问题在于时机：

1. 用户访问 `/mall`
2. 守卫检查：动态路由还没加载
3. 加载动态路由（包括 `/mall` 的配置）
4. 如果直接 `next()`...

**直接 `next()` 的问题**：
- 路由刚加载完，但当前导航还是用的"旧路由表"
- `/mall` 可能找不到，跳转到 404

**`next({ ...to, replace: true })` 的作用**：
- 重新导航到目标路由
- 这次用的是"新路由表"
- `replace: true` 不产生历史记录（避免后退到空白页）

**类比**：你要去一个房间，但门还没装好。等门装好后，你需要重新走一遍。

</details>

---

## 第四部分：角色布局

### 问题 8：不同角色如何使用不同布局？

项目中有三个布局：
- `MainLayout.vue` - 普通用户
- `AdminLayout.vue` - 管理员
- `MerchantLayout.vue` - 商户

**路由是如何决定使用哪个布局的？**

---

<details>
<summary>💡 点击查看引导</summary>

通过嵌套路由实现：

```typescript
// 后端返回的路由配置
{
  path: '/admin',
  component: 'AdminLayout',  // 使用管理员布局
  children: [
    { path: 'dashboard', component: 'AdminDashboard' },
    { path: 'users', component: 'UserManagement' },
  ]
}

{
  path: '/mall',
  component: 'MainLayout',  // 使用主布局
  children: [
    { path: '', component: 'MallView' },
  ]
}
```

**嵌套结构**：
```
/admin/dashboard
  └── AdminLayout
        └── <router-view> → AdminDashboard

/mall
  └── MainLayout
        └── <router-view> → MallView
```

**关键**：父路由决定布局，子路由决定内容。

</details>

---

### 问题 9：后置守卫有什么用？

```typescript
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  if (title) {
    document.title = `${title} - Smart Mall`
  }
})
```

**为什么要在路由跳转后设置标题？**

---

<details>
<summary>💡 点击查看引导</summary>

`afterEach` 是"后置守卫"：路由跳转完成后执行。

用途：
- 设置页面标题
- 关闭加载动画
- 发送页面访问统计
- 滚动到页面顶部

为什么用后置守卫？
- 前置守卫可能会拦截，导致标题设置了但页面没跳转
- 后置守卫只在跳转成功后执行

**`to.meta.title`**：路由元信息，在路由配置中定义：
```typescript
{
  path: '/mall',
  meta: { title: '商城首页' }
}
```

</details>

---

## 第五部分：登出清理

### 问题 10：登出时为什么要清理路由？

```typescript
export function cleanupOnLogout(router: Router): void {
  removeDynamicRoutes(router)
  router.push('/login')
}
```

**如果不清理动态路由会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

场景：
1. 管理员登录 → 加载管理员路由
2. 管理员登出
3. 普通用户登录 → 加载普通用户路由

如果不清理：
- 普通用户可能看到管理员的路由
- 路由表越来越大
- 可能出现路由冲突

**清理的作用**：
- 移除旧用户的路由
- 为新用户准备干净的路由表
- 防止权限泄露

</details>

---

## 动手练习

### 练习 1：添加面包屑导航
- 在布局组件中添加面包屑
- 根据当前路由显示路径
- 提示：使用 `route.matched`

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 生成面包屑数据
const breadcrumbs = computed(() => {
  return route.matched
    .filter(record => record.meta?.title)  // 只显示有标题的路由
    .map((record, index, arr) => ({
      title: record.meta.title as string,
      path: record.path,
      isLast: index === arr.length - 1,
    }))
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="breadcrumb" aria-label="面包屑导航">
    <ol>
      <li>
        <a href="#" @click.prevent="navigateTo('/')">首页</a>
        <span class="separator">/</span>
      </li>
      <li v-for="crumb in breadcrumbs" :key="crumb.path">
        <span v-if="crumb.isLast" class="current">{{ crumb.title }}</span>
        <template v-else>
          <a href="#" @click.prevent="navigateTo(crumb.path)">
            {{ crumb.title }}
          </a>
          <span class="separator">/</span>
        </template>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  padding: 12px 0;
  font-size: 14px;
}

.breadcrumb ol {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb li {
  display: flex;
  align-items: center;
}

.breadcrumb a {
  color: #409eff;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb .current {
  color: #606266;
}

.breadcrumb .separator {
  margin: 0 8px;
  color: #c0c4cc;
}
</style>
```

**关键点**：
- `route.matched` 包含当前路由匹配的所有路由记录
- 过滤出有 `meta.title` 的路由
- 最后一项不可点击（当前页面）
- 使用语义化的 `<nav>` 和 `<ol>` 标签

</details>

---

### 练习 2：添加路由切换动画
- 使用 `<transition>` 包裹 `<router-view>`
- 实现淡入淡出效果

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
// 布局组件
</script>

<template>
  <div class="layout">
    <header>导航栏</header>
    
    <main class="layout-content">
      <router-view v-slot="{ Component, route }">
        <transition 
          name="fade-slide" 
          mode="out-in"
          @before-enter="onBeforeEnter"
          @after-leave="onAfterLeave"
        >
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
/* 淡入淡出 + 轻微滑动 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 或者简单的淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

**进阶：根据路由方向决定动画方向**

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const transitionName = ref('fade-slide-right')

// 路由层级映射
const routeDepth: Record<string, number> = {
  '/': 0,
  '/mall': 1,
  '/mall/product': 2,
  '/admin': 1,
  '/admin/dashboard': 2,
}

watch(
  () => route.path,
  (to, from) => {
    const toDepth = routeDepth[to] ?? 1
    const fromDepth = routeDepth[from] ?? 1
    
    // 进入更深层级：向左滑
    // 返回上层：向右滑
    transitionName.value = toDepth > fromDepth 
      ? 'slide-left' 
      : 'slide-right'
  }
)
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from { transform: translateX(100%); opacity: 0; }
.slide-left-leave-to { transform: translateX(-100%); opacity: 0; }

.slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-right-leave-to { transform: translateX(100%); opacity: 0; }
</style>
```

**关键点**：
- `v-slot` 获取当前组件和路由
- `mode="out-in"` 先离开再进入，避免重叠
- `:key="route.path"` 确保路由变化时触发动画
- 可以根据路由深度动态选择动画方向

</details>

---

### 练习 3：实现路由缓存
- 使用 `<keep-alive>` 缓存页面
- 某些页面不缓存（如登录页）

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 从路由 meta 中获取缓存配置
const cachedViews = computed(() => {
  // 可以从 store 中管理，或者硬编码
  return ['MallView', 'ProductListView', 'UserProfileView']
})
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade" mode="out-in">
      <keep-alive :include="cachedViews">
        <component 
          :is="Component" 
          :key="route.path"
          v-if="route.meta.keepAlive !== false"
        />
      </keep-alive>
      <component 
        :is="Component" 
        :key="route.path"
        v-else
      />
    </transition>
  </router-view>
</template>
```

**更灵活的方案：使用路由 meta 配置**

```typescript
// router/index.ts
const routes = [
  {
    path: '/mall',
    component: MallView,
    meta: { 
      keepAlive: true,  // 需要缓存
      title: '商城' 
    }
  },
  {
    path: '/login',
    component: LoginView,
    meta: { 
      keepAlive: false,  // 不缓存
      title: '登录' 
    }
  },
]
```

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const cachedViews = ref<string[]>([])

// 动态管理缓存列表
watch(
  () => route.name,
  (name) => {
    if (route.meta.keepAlive && name && !cachedViews.value.includes(name as string)) {
      cachedViews.value.push(name as string)
    }
  },
  { immediate: true }
)

// 提供清除缓存的方法
function removeCache(name: string) {
  const index = cachedViews.value.indexOf(name)
  if (index > -1) {
    cachedViews.value.splice(index, 1)
  }
}

// 暴露给子组件使用
provide('removeCache', removeCache)
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="cachedViews">
      <component :is="Component" :key="route.path" />
    </keep-alive>
  </router-view>
</template>
```

**在页面组件中使用缓存生命周期**

```vue
<script setup lang="ts">
import { onActivated, onDeactivated } from 'vue'

// 从缓存中激活时调用
onActivated(() => {
  console.log('页面从缓存中恢复')
  // 可以在这里刷新数据
})

// 进入缓存时调用
onDeactivated(() => {
  console.log('页面进入缓存')
})
</script>
```

**关键点**：
- `<keep-alive>` 缓存组件实例
- `include` 指定要缓存的组件名
- 使用路由 `meta.keepAlive` 配置
- `onActivated` / `onDeactivated` 处理缓存生命周期
- 登录页等敏感页面不应缓存

</details>

---

## 关键文件

| 文件 | 说明 | 跳转 |
|------|------|------|
| 路由入口 | 路由配置主文件 | [index.ts](../../apps/frontend/SMART-MALL/src/router/index.ts) |
| 路由守卫 | 权限检查、登录验证 | [guards.ts](../../apps/frontend/SMART-MALL/src/router/guards.ts) |
| 动态路由 | 动态路由加载与管理 | [dynamic.ts](../../apps/frontend/SMART-MALL/src/router/dynamic.ts) |
| 组件映射 | 路由组件名称映射 | [componentMap.ts](../../apps/frontend/SMART-MALL/src/router/componentMap.ts) |
| 路由类型 | 路由相关类型定义 | [types.ts](../../apps/frontend/SMART-MALL/src/router/types.ts) |

### 布局组件

| 组件 | 说明 | 跳转 |
|------|------|------|
| AdminLayout | 管理员后台布局 | [AdminLayout.vue](../../apps/frontend/SMART-MALL/src/views/layouts/AdminLayout.vue) |
| MerchantLayout | 商户中心布局 | [MerchantLayout.vue](../../apps/frontend/SMART-MALL/src/views/layouts/MerchantLayout.vue) |
| MainLayout | 主布局（普通用户） | [MainLayout.vue](../../apps/frontend/SMART-MALL/src/views/layouts/MainLayout.vue) |
| DashboardLayout | 仪表盘通用布局 | [DashboardLayout.vue](../../apps/frontend/SMART-MALL/src/components/layouts/DashboardLayout.vue) |

### 路由 API

| 文件 | 说明 | 跳转 |
|------|------|------|
| 路由 API | 获取用户路由配置 | [route.api.ts](../../apps/frontend/SMART-MALL/src/api/route.api.ts) |
| 路由 Mock | 路由配置模拟数据 | [route.mock.ts](../../apps/frontend/SMART-MALL/src/api/mock/route.mock.ts) |

---

## Element Plus 布局组件

项目布局已使用 Element Plus 组件重构：

### 布局组件对照表

| 布局 | Element Plus 组件 |
|------|------------------|
| `AdminLayout` | ElContainer, ElAside, ElHeader, ElMain, ElMenu, ElMenuItem, ElButton, ElIcon, ElTag |
| `MerchantLayout` | ElContainer, ElAside, ElHeader, ElMain, ElMenu, ElMenuItem, ElButton, ElIcon, ElTag |
| `MainLayout` | ElContainer, ElHeader, ElMain, ElMenu, ElMenuItem, ElButton, ElIcon |

### 布局组件示例

```vue
<script setup lang="ts">
import {
  ElContainer,
  ElAside,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElButton,
  ElIcon,
  ElTag,
} from 'element-plus'
import { House, User, Setting, SwitchButton } from '@element-plus/icons-vue'
</script>

<template>
  <ElContainer class="admin-layout">
    <ElAside width="240px" class="layout-aside">
      <header class="aside-header">
        <ElIcon :size="24"><House /></ElIcon>
        <h1>Smart Mall</h1>
      </header>
      
      <ElMenu
        :default-active="activeMenu"
        router
        class="aside-menu"
      >
        <ElMenuItem index="/admin/dashboard">
          <ElIcon><House /></ElIcon>
          <span>控制台</span>
        </ElMenuItem>
        <ElMenuItem index="/admin/users">
          <ElIcon><User /></ElIcon>
          <span>用户管理</span>
        </ElMenuItem>
      </ElMenu>
    </ElAside>

    <ElContainer class="layout-main">
      <ElHeader class="layout-header">
        <nav class="header-nav">
          <ElTag type="info">{{ userRole }}</ElTag>
          <ElButton text @click="handleLogout">
            <ElIcon><SwitchButton /></ElIcon>
            退出
          </ElButton>
        </nav>
      </ElHeader>

      <ElMain class="layout-content">
        <router-view />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>
```

### SCSS 嵌套语法示例

```scss
.admin-layout {
  min-height: 100vh;

  .layout-aside {
    background: #1d1e1f;
    border-right: 1px solid rgba(255, 255, 255, 0.06);

    .aside-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      h1 {
        font-size: 18px;
        font-weight: 600;
        color: #e8eaed;
        margin: 0;
      }
    }

    .aside-menu {
      border-right: none;
      background: transparent;

      :deep(.el-menu-item) {
        color: #9aa0a6;

        &:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        &.is-active {
          color: #8ab4f8;
          background: rgba(138, 180, 248, 0.08);
        }
      }
    }
  }

  .layout-main {
    .layout-header {
      background: #1d1e1f;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 24px;
    }

    .layout-content {
      background: #0a0a0a;
      padding: 24px;
    }
  }
}
```

---

*"教育不是灌输，而是点燃火焰。" —— 苏格拉底*
