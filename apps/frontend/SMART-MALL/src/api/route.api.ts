/**
 * ============================================================================
 * 路由 API 模块 (route.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 提供动态路由配置的 API 接口，根据用户角色返回可访问的路由树。
 * 
 * 【业务背景】
 * 智慧商城系统采用动态路由机制：
 * - 不同角色（管理员、商家、普通用户）看到不同的菜单
 * - 路由配置从后端获取，便于权限的集中管理
 * - 开发环境使用 Mock 数据，生产环境调用后端接口
 * 
 * 【动态路由的优势】
 * 1. 权限集中管理：后端统一控制用户可访问的页面
 * 2. 灵活配置：无需修改前端代码即可调整菜单结构
 * 3. 安全性：前端不暴露所有路由，只显示用户有权限的部分
 * 
 * 【与其他模块的关系】
 * - router/index.ts：调用此 API 获取动态路由并注册
 * - router/guards.ts：路由守卫中检查路由权限
 * - stores/user.store.ts：登录后触发路由加载
 * - api/mock/route.mock.ts：开发环境的 Mock 数据
 * 
 * 【数据流】
 * ```
 * 用户登录 → 获取用户角色 → 调用 getUserRoutes → 注册动态路由 → 渲染菜单
 * ```
 * 
 * ============================================================================
 */

import { http } from './http'
import type { RouteConfig } from '@/router/types'

/**
 * 路由 API 对象
 * 
 * 提供动态路由相关的 API 方法。
 */
export const routeApi = {
  /**
   * 获取用户可访问的路由树
   * 
   * 【业务逻辑】
   * 1. 开发环境：从 Mock 文件加载路由配置
   * 2. 生产环境：调用后端接口获取路由配置
   * 
   * 【返回数据结构】
   * 返回的路由配置是一个树形结构，包含：
   * - path: 路由路径
   * - name: 路由名称
   * - component: 组件路径
   * - meta: 路由元信息（标题、图标、权限等）
   * - children: 子路由
   * 
   * 【后端接口】
   * GET /user/routes
   * 
   * @returns 用户可访问的路由配置树
   * 
   * @example
   * ```typescript
   * import { routeApi } from '@/api'
   * 
   * // 获取路由配置
   * const routes = await routeApi.getUserRoutes()
   * 
   * // 注册到 Vue Router
   * routes.forEach(route => router.addRoute(route))
   * ```
   */
  async getUserRoutes(): Promise<RouteConfig[]> {
    // 开发环境使用 Mock 数据
    if (import.meta.env.DEV) {
      const { getMockRoutes } = await import('./mock/route.mock')
      return getMockRoutes()
    }
    
    // 生产环境调用后端接口
    return http.get<RouteConfig[]>('/user/routes')
  },
}

export default routeApi
