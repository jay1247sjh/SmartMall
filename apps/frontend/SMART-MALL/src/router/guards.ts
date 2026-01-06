/**
 * ============================================================================
 * 路由守卫 (guards.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 路由守卫是 Vue Router 的核心安全机制，负责：
 * 1. 认证检查：未登录用户重定向到登录页
 * 2. 权限校验：检查用户角色是否有权访问目标路由
 * 3. 动态路由加载：首次访问时加载用户路由
 * 4. 模式检查：CONFIG 模式页面需要特定权限
 * 
 * 【执行时机】
 * 每次路由跳转都会触发守卫，包括：
 * - 用户点击链接
 * - 调用 router.push() / router.replace()
 * - 浏览器前进/后退
 * - 直接在地址栏输入 URL
 * 
 * 【守卫类型】
 * - beforeEach: 路由跳转前执行（本文件主要使用）
 * - afterEach: 路由跳转后执行（用于设置页面标题）
 * - beforeResolve: 在 beforeEach 和组件守卫之后执行
 * 
 * 【业务流程】
 * 1. 检查是否在白名单中 → 是则放行
 * 2. 检查是否已登录 → 否则跳转登录页
 * 3. 检查动态路由是否已加载 → 否则加载
 * 4. 检查角色权限 → 无权限则跳转 403
 * 5. 检查模式权限 → 无权限则跳转 403
 * 6. 全部通过 → 放行
 * 
 * ============================================================================
 */

import type { Router, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores'
import { setupDynamicRoutes, isDynamicRoutesLoaded, removeDynamicRoutes } from './dynamic'

// ============================================================================
// 白名单配置
// ============================================================================

/**
 * 无需登录即可访问的路由
 * 
 * 【包含页面】
 * - /login: 登录页
 * - /register: 注册页
 * - /forgot-password: 忘记密码页
 * - /reset-password: 重置密码页
 * - /404: 页面不存在
 * - /403: 无权访问
 */
const WHITE_LIST = ['/login', '/register', '/forgot-password', '/reset-password', '/404', '/403']

/**
 * 登录后不应访问的路由
 * 
 * 【业务逻辑】
 * 已登录用户访问这些页面时，会被重定向到商城首页。
 * 因为已经登录了，不需要再看登录/注册页面。
 */
const LOGIN_REDIRECT_LIST = ['/login', '/register', '/forgot-password', '/reset-password']

// ============================================================================
// 守卫逻辑
// ============================================================================

/**
 * 检查路由是否在白名单中
 * 
 * 【匹配规则】
 * 使用 startsWith 进行前缀匹配，
 * 这样 /login?redirect=/mall 也能匹配 /login
 * 
 * @param path - 路由路径
 * @returns 是否在白名单中
 */
function isInWhiteList(path: string): boolean {
  return WHITE_LIST.some((p) => path.startsWith(p))
}

/**
 * 检查用户角色是否有权访问路由
 * 
 * 【权限配置】
 * 路由的 meta.roles 字段定义了允许访问的角色列表：
 * - 未配置 roles：所有人可访问
 * - roles: ['ADMIN']：仅管理员可访问
 * - roles: ['ADMIN', 'MERCHANT']：管理员和商户可访问
 * 
 * @param to - 目标路由
 * @param userRole - 用户角色
 * @returns 是否有权限
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
 * 
 * 【模式说明】
 * Smart Mall 有两种系统模式：
 * - VIEW 模式：浏览模式，所有用户可访问
 * - CONFIG 模式：配置模式，只有 ADMIN 和 MERCHANT 可访问
 * 
 * CONFIG 模式页面包括：
 * - 商城建模器
 * - 店铺装修
 * - 区域管理
 * 
 * @param to - 目标路由
 * @param userRole - 用户角色
 * @returns 是否有权限
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
 * 【调用时机】
 * 在 router/index.ts 中创建 Router 实例后调用
 * 
 * 【守卫执行顺序】
 * 1. 全局 beforeEach（本函数定义）
 * 2. 路由独享守卫（路由配置中的 beforeEnter）
 * 3. 组件内守卫（组件中的 beforeRouteEnter）
 * 4. 全局 beforeResolve
 * 5. 导航确认
 * 6. 全局 afterEach（本函数定义）
 * 
 * @param router - Vue Router 实例
 */
export function setupRouterGuards(router: Router): void {
  // ========================================
  // 前置守卫
  // ========================================
  
  router.beforeEach(async (to, _from, next) => {
    const userStore = useUserStore()
    
    try {
      // ----------------------------------------
      // 1. 尝试从 localStorage 恢复登录状态
      // ----------------------------------------
      
      /**
       * 【场景说明】
       * 用户刷新页面后，Pinia store 会被重置。
       * 需要从 localStorage 恢复之前保存的登录状态。
       */
      if (!userStore.isAuthenticated) {
        userStore.restoreFromStorage()
      }
      
      const isAuthenticated = userStore.isAuthenticated
      const userRole = userStore.role
      
      // ----------------------------------------
      // 2. 白名单路由直接放行
      // ----------------------------------------
      
      if (isInWhiteList(to.path)) {
        /**
         * 【特殊处理】
         * 已登录用户访问登录页，重定向到商城首页。
         * 避免已登录用户看到登录页面。
         */
        if (isAuthenticated && LOGIN_REDIRECT_LIST.includes(to.path)) {
          return next({ path: '/mall' })
        }
        return next()
      }
      
      // ----------------------------------------
      // 3. 未登录，重定向到登录页
      // ----------------------------------------
      
      if (!isAuthenticated) {
        console.log('[Guard] 未登录，重定向到登录页')
        /**
         * 【redirect 参数】
         * 将原本要访问的路径作为 redirect 参数传递给登录页。
         * 登录成功后，会跳转回这个路径。
         * 
         * 例如：用户访问 /admin/dashboard
         * → 重定向到 /login?redirect=/admin/dashboard
         * → 登录成功后跳转到 /admin/dashboard
         */
        return next({
          path: '/login',
          query: { redirect: to.fullPath },
        })
      }
      
      // ----------------------------------------
      // 4. 已登录，检查动态路由是否已加载
      // ----------------------------------------
      
      /**
       * 【动态路由加载】
       * 动态路由是根据用户角色从后端获取的。
       * 首次访问需要登录的页面时，会触发加载。
       * 
       * 【为什么需要动态路由？】
       * - 不同角色看到的菜单不同
       * - 权限控制更灵活
       * - 可以在后台配置路由
       */
      if (!isDynamicRoutesLoaded()) {
        try {
          const success = await setupDynamicRoutes(router)
          
          if (success) {
            /**
             * 【重新导航】
             * 路由加载成功后，需要重新导航到目标路由。
             * 因为之前目标路由还不存在，现在才添加。
             * 
             * 使用 replace: true 避免产生历史记录，
             * 否则用户点击后退会回到一个中间状态。
             */
            return next({ ...to, replace: true })
          } else {
            console.error('[Guard] 动态路由加载失败')
            return next({ path: '/403' })
          }
        } catch (error) {
          console.error('[Guard] 动态路由加载异常:', error)
          return next({ path: '/403' })
        }
      }
      
      // ----------------------------------------
      // 5. 检查角色权限
      // ----------------------------------------
      
      if (!hasRoutePermission(to, userRole)) {
        console.warn(`[Guard] 用户角色 ${userRole} 无权访问 ${to.path}`)
        return next({ path: '/403' })
      }
      
      // ----------------------------------------
      // 6. 检查模式权限
      // ----------------------------------------
      
      if (!hasModePemission(to, userRole)) {
        console.warn(`[Guard] 用户角色 ${userRole} 无权访问 CONFIG 模式页面`)
        return next({ path: '/403' })
      }
      
      // ----------------------------------------
      // 7. 全部通过，放行
      // ----------------------------------------
      
      next()
    } catch (error) {
      /**
       * 【异常处理】
       * 捕获所有未预期的错误，防止路由卡死。
       * 清除可能损坏的状态，跳转到登录页。
       */
      console.error('[Guard] 路由守卫异常:', error)
      userStore.clearUser()
      return next({ path: '/login' })
    }
  })
  
  // ========================================
  // 后置守卫
  // ========================================
  
  /**
   * 后置守卫在路由跳转完成后执行
   * 
   * 【用途】
   * - 设置页面标题
   * - 关闭加载进度条
   * - 页面访问统计
   */
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
 * 【调用时机】
 * 用户点击"退出登录"时调用
 * 
 * 【清理内容】
 * 1. 移除动态路由（下次登录重新加载）
 * 2. 跳转到登录页
 * 
 * @param router - Vue Router 实例
 */
export function cleanupOnLogout(router: Router): void {
  // 移除动态路由
  removeDynamicRoutes(router)
  
  // 跳转到登录页
  router.push('/login')
}
