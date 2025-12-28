/**
 * 路由相关 API
 * 
 * 职责：
 * - 获取用户可访问的动态路由
 * - 开发环境使用 Mock 数据
 */

import { http } from './http'
import type { RouteConfig } from '@/router/types'

/**
 * 路由 API
 */
export const routeApi = {
  /**
   * 获取用户可访问的路由树
   * 
   * 开发环境使用 Mock 数据
   * 生产环境调用后端接口
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
