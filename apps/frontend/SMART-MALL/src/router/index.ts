/**
 * 路由配置入口
 * 
 * 职责：
 * - 创建 Router 实例
 * - 定义静态基础路由（登录、404等）
 * - 安装路由守卫
 * - 导出路由相关方法
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

// ============================================================================
// 静态路由（无需权限）
// ============================================================================

const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: '注册' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { title: '忘记密码' },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: '重置密码' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/errors/NotFoundView.vue'),
    meta: { title: '页面不存在' },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/errors/ForbiddenView.vue'),
    meta: { title: '无权访问' },
  },
  // 根路径重定向
  {
    path: '/',
    redirect: '/login',
  },
]

// 兜底路由 - 动态路由加载后再添加
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFoundCatchAll',
  redirect: '/404',
}

// ============================================================================
// 创建 Router
// ============================================================================

const router = createRouter({
  history: createWebHistory(),
  routes: staticRoutes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// ============================================================================
// 安装守卫
// ============================================================================

setupRouterGuards(router)

// ============================================================================
// 导出
// ============================================================================

export default router

// 导出动态路由相关方法
export {
  setupDynamicRoutes,
  removeDynamicRoutes,
  reloadDynamicRoutes,
  isDynamicRoutesLoaded,
} from './dynamic'

// 导出守卫相关方法
export { cleanupOnLogout } from './guards'

// 导出类型
export type { RouteConfig, RouteMeta } from './types'
