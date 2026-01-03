# 路由系统学习指南

## 学习目标

通过本章学习，你将掌握：
- Vue Router 基础配置
- 动态路由与权限控制
- 路由守卫
- 嵌套路由与布局

---

## 苏格拉底式问答

### 问题 1：什么是 SPA 路由？

**思考**：传统多页面应用和 SPA 的页面切换有什么区别？

<details>
<summary>点击查看答案</summary>

**传统多页面应用**：
- 每次切换页面都向服务器请求新的 HTML
- 整个页面刷新
- 状态丢失

**SPA 路由**：
- 只加载一次 HTML
- 通过 JavaScript 切换视图
- 状态保持
- URL 变化但不刷新页面

```
传统：/login → 服务器 → 新 HTML
SPA：/login → 路由匹配 → 渲染 LoginView 组件
```

</details>

### 问题 2：路由守卫有哪些类型？

<details>
<summary>点击查看答案</summary>

| 类型 | 作用范围 | 使用场景 |
|------|---------|---------|
| 全局前置守卫 | 所有路由 | 登录验证 |
| 全局后置钩子 | 所有路由 | 页面统计 |
| 路由独享守卫 | 单个路由 | 特定页面权限 |
| 组件内守卫 | 组件 | 离开确认 |

```typescript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login');
  } else {
    next();
  }
});
```

</details>

### 问题 3：如何实现基于角色的权限控制？

<details>
<summary>点击查看答案</summary>

```typescript
// 路由配置
{
  path: '/admin',
  component: AdminLayout,
  meta: { 
    requiresAuth: true,
    roles: ['ADMIN'] 
  }
}

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.roles) {
    const hasRole = to.meta.roles.includes(userStore.user?.role);
    if (!hasRole) {
      next('/403');
      return;
    }
  }
  next();
});
```

</details>

---

## 核心代码解析

### 1. 路由配置

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 公开路由
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guest: true }
    },
    
    // 需要认证的路由
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/DashboardView.vue')
        },
        {
          path: 'mall-builder',
          name: 'MallBuilder',
          component: () => import('@/views/MallBuilderView.vue')
        }
      ]
    },
    
    // 管理员路由
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, roles: ['ADMIN'] },
      children: [
        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('@/views/admin/UserManagement.vue')
        }
      ]
    }
  ]
});
```

### 2. 路由守卫

```typescript
// router/guards.ts
import { useUserStore } from '@/stores/user.store';

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    
    // 已登录用户访问登录页，重定向到首页
    if (to.meta.guest && userStore.isLoggedIn) {
      next('/');
      return;
    }
    
    // 需要认证的页面
    if (to.meta.requiresAuth) {
      if (!userStore.isLoggedIn) {
        next({ path: '/login', query: { redirect: to.fullPath } });
        return;
      }
      
      // 角色检查
      if (to.meta.roles) {
        const hasRole = to.meta.roles.includes(userStore.user?.role);
        if (!hasRole) {
          next('/403');
          return;
        }
      }
    }
    
    next();
  });
}
```

### 3. 动态路由

```typescript
// 根据用户角色动态添加路由
function addDynamicRoutes(role: string) {
  if (role === 'ADMIN') {
    router.addRoute({
      path: '/admin/settings',
      name: 'AdminSettings',
      component: () => import('@/views/admin/Settings.vue')
    });
  }
  
  if (role === 'MERCHANT') {
    router.addRoute({
      path: '/merchant/shop',
      name: 'MerchantShop',
      component: () => import('@/views/merchant/Shop.vue')
    });
  }
}
```

---

## 路由结构

```
/                          → MainLayout + DashboardView
/login                     → LoginView
/register                  → RegisterView
/mall-builder              → MainLayout + MallBuilderView
/mall-builder/:id          → MainLayout + MallBuilderView
/admin                     → AdminLayout
/admin/users               → AdminLayout + UserManagement
/merchant                  → MerchantLayout
/merchant/shop             → MerchantLayout + ShopManagement
```

---

## 延伸阅读

- [Vue Router 官方文档](https://router.vuejs.org/)
- [导航守卫](https://router.vuejs.org/guide/advanced/navigation-guards.html)
