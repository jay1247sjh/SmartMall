/**
 * 路由守卫
 * 
 * 职责：
 * - 认证检查：未登录用户重定向到登录页
 * - 权限校验：检查用户角色是否有权访问目标路由
 * - 动态路由加载：首次访问时加载用户路由
 * - 模式检查：CONFIG 模式页面需要特定权限
 */

import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { useUserStore } from '@/stores'
import { setupDynamicRoutes, isDynamicRoutesLoaded, removeDynamicRoutes } from './dynamic'

// ============================================================================
// 白名单配置
// ============================================================================

/** 无需登录即可访问的路由 */
const WHITE_LIST = ['/login', '/404', '/403']

/** 登录后不应访问的路由（如登录页） */
const LOGIN_REDIRECT_LIST = ['/login']

// ============================================================================
// 守卫逻辑
// ============================================================================

/**
 * 检查路由是否在白名单中
 */
function isInWhiteList(path: string): boolean {
  return WHITE_LIST.some((p) => path.startsWith(p))
}

/**
 * 检查用户角色是否有权访问路由
 */
function hasRoutePermission(
  to: RouteLocationNormalized,
  userRole: string | null
): boolean {
  const roles = to.meta?.roles as string[] | undefined
  
  // 没有配置 roles 表示所有人可访问
  if (!roles || roles.length === 0) {
    return true
  }
  
  // 检查用户角色是否在允许列表中
  return userRole ? roles.includes(userRole) : false
}

/**
 * 检查系统模式权限
 * CONFIG 模式页面只有 ADMIN 和 MERCHANT 可访问
 */
function hasModePemission(
  to: RouteLocationNormalized,
  userRole: string | null
): boolean {
  const mode = to.meta?.mode as string | undefined
  
  if (mode === 'CONFIG') {
    return userRole === 'ADMIN' || userRole === 'MERCHANT'
  }
  
  return true
}

// ============================================================================
// 守卫安装
// ============================================================================

/**
 * 安装路由守卫
 * 
 * @param router - Vue Router 实例
 */
export function setupRouterGuards(router: Router): void {
  // 前置守卫
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    
    // 1. 尝试从 localStorage 恢复登录状态
    if (!userStore.isAuthenticated) {
      userStore.restoreFromStorage()
    }
    
    const isAuthenticated = userStore.isAuthenticated
    const userRole = userStore.role
    
    // 2. 白名单路由直接放行
    if (isInWhiteList(to.path)) {
      // 已登录用户访问登录页，重定向到商城首页
      if (isAuthenticated && LOGIN_REDIRECT_LIST.includes(to.path)) {
        return next({ path: '/mall' })
      }
      return next()
    }
    
    // 3. 未登录，重定向到登录页
    if (!isAuthenticated) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    }
    
    // 4. 已登录，检查动态路由是否已加载
    if (!isDynamicRoutesLoaded()) {
      try {
        const success = await setupDynamicRoutes(router)
        
        if (success) {
          // 路由加载成功，重新导航到目标路由
          // 使用 replace 避免产生历史记录
          return next({ ...to, replace: true })
        } else {
          // 路由加载失败，跳转到错误页
          return next({ path: '/403' })
        }
      } catch (error) {
        console.error('[Guard] 动态路由加载异常:', error)
        return next({ path: '/403' })
      }
    }
    
    // 5. 检查角色权限
    if (!hasRoutePermission(to, userRole)) {
      console.warn(`[Guard] 用户角色 ${userRole} 无权访问 ${to.path}`)
      return next({ path: '/403' })
    }
    
    // 6. 检查模式权限
    if (!hasModePemission(to, userRole)) {
      console.warn(`[Guard] 用户角色 ${userRole} 无权访问 CONFIG 模式页面`)
      return next({ path: '/403' })
    }
    
    // 7. 全部通过，放行
    next()
  })
  
  // 后置守卫（可用于页面标题、进度条等）
  router.afterEach((to) => {
    // 设置页面标题
    const title = to.meta?.title as string | undefined
    if (title) {
      document.title = `${title} - Smart Mall`
    } else {
      document.title = 'Smart Mall'
    }
  })
}

/**
 * 登出时清理路由
 * 
 * @param router - Vue Router 实例
 */
export function cleanupOnLogout(router: Router): void {
  // 移除动态路由
  removeDynamicRoutes(router)
  
  // 跳转到登录页
  router.push('/login')
}
