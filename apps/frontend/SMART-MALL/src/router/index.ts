/**
 * ============================================================================
 * 路由配置入口 (index.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 这是 Vue Router 的配置入口，负责：
 * 1. 创建 Router 实例
 * 2. 定义静态基础路由（登录、注册、404 等）
 * 3. 安装路由守卫
 * 4. 导出路由相关方法
 * 
 * 【路由分类】
 * Smart Mall 的路由分为两类：
 * 
 * 1. 静态路由（本文件定义）
 *    - 无需登录即可访问
 *    - 应用启动时就存在
 *    - 例如：登录页、注册页、404 页
 * 
 * 2. 动态路由（dynamic.ts 定义）
 *    - 需要登录后才能访问
 *    - 根据用户角色动态加载
 *    - 例如：管理员后台、商户中心、商城首页
 * 
 * 【路由守卫】
 * 路由守卫在 guards.ts 中定义，负责：
 * - 认证检查：未登录用户重定向到登录页
 * - 权限校验：检查用户角色是否有权访问
 * - 动态路由加载：首次访问时加载用户路由
 * 
 * 【路由元信息 (meta)】
 * 每个路由可以配置 meta 字段，包含：
 * - title: 页面标题（显示在浏览器标签）
 * - roles: 允许访问的角色列表
 * - mode: 系统模式（CONFIG/VIEW）
 * - icon: 菜单图标
 * 
 * ============================================================================
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

// ============================================================================
// 静态路由（无需权限）
// ============================================================================

/**
 * 静态路由配置
 * 
 * 【设计说明】
 * 这些路由在应用启动时就存在，无需登录即可访问。
 * 主要包括认证相关页面和错误页面。
 * 
 * 【懒加载】
 * 使用 () => import() 语法实现路由懒加载：
 * - 首次访问时才加载组件代码
 * - 减少首屏加载时间
 * - 按需加载，节省带宽
 */
const staticRoutes: RouteRecordRaw[] = [
  // ========================================
  // 认证相关页面
  // ========================================
  
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
  
  // ========================================
  // 错误页面
  // ========================================
  
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
  
  // ========================================
  // 根路径重定向
  // ========================================
  
  /**
   * 访问根路径时重定向到登录页
   * 
   * 【业务逻辑】
   * - 未登录用户：显示登录页
   * - 已登录用户：路由守卫会重定向到 /mall
   */
  {
    path: '/',
    redirect: '/login',
  },
]

/**
 * 兜底路由 - 匹配所有未定义的路径
 * 
 * 【设计说明】
 * 这个路由需要在动态路由加载后再添加，
 * 否则会拦截所有动态路由。
 * 
 * 【路径匹配】
 * :pathMatch(.*)*  匹配任意路径
 * 例如：/abc/def/ghi 都会被匹配
 */
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFoundCatchAll',
  redirect: '/404',
}

// ============================================================================
// 创建 Router
// ============================================================================

/**
 * 创建 Vue Router 实例
 * 
 * 【配置说明】
 * - history: 使用 HTML5 History 模式（URL 不带 #）
 * - routes: 初始路由配置（静态路由）
 * - scrollBehavior: 页面切换时的滚动行为
 */
const router = createRouter({
  /**
   * 路由模式：HTML5 History
   * 
   * 【对比】
   * - Hash 模式：URL 带 #，如 http://example.com/#/login
   * - History 模式：URL 不带 #，如 http://example.com/login
   * 
   * 【注意】
   * History 模式需要服务器配置支持，
   * 否则刷新页面会 404
   */
  history: createWebHistory(),
  
  routes: staticRoutes,
  
  /**
   * 滚动行为配置
   * 
   * 【逻辑说明】
   * - 如果有保存的滚动位置（浏览器前进/后退），恢复到该位置
   * - 否则滚动到页面顶部
   */
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

/**
 * 安装路由守卫
 * 
 * 守卫会在每次路由跳转时执行，负责：
 * - 检查用户是否已登录
 * - 检查用户是否有权限访问目标页面
 * - 动态加载用户路由
 */
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
