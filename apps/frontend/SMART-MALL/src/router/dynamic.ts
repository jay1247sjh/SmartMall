/**
 * 动态路由管理
 * 
 * 职责：
 * - 将后端返回的 RouteConfig 转换为 Vue Router 的 RouteRecordRaw
 * - 动态注册路由到 router 实例
 * - 管理动态路由的添加和移除
 */

import type { Router, RouteRecordRaw } from 'vue-router'
import type { RouteConfig } from './types'
import { getComponent, isComponentAllowed } from './componentMap'
import { routeApi } from '@/api'

// ============================================================================
// 状态管理
// ============================================================================

/** 已注册的动态路由名称列表（用于移除） */
let registeredRouteNames: string[] = []

/** 是否已加载动态路由 */
let isRoutesLoaded = false

// ============================================================================
// 核心方法
// ============================================================================

/**
 * 将后端 RouteConfig 转换为 Vue Router 的 RouteRecordRaw
 * 
 * @param config - 后端返回的路由配置
 * @returns Vue Router 路由记录
 */
function transformRoute(config: RouteConfig): RouteRecordRaw {
  // 检查组件是否在白名单中
  if (!isComponentAllowed(config.component)) {
    console.warn(`[Router] 组件 "${config.component}" 不在白名单中`)
  }

  // 构建基础路由对象
  const route = {
    path: config.path,
    name: config.name,
    component: getComponent(config.component),
    meta: config.meta ? { ...config.meta } : {},
    redirect: config.redirect,
    children: config.children?.length 
      ? config.children.map(transformRoute) 
      : undefined,
  } as RouteRecordRaw

  return route
}

/**
 * 加载并注册动态路由
 * 
 * @param router - Vue Router 实例
 * @returns 是否加载成功
 */
export async function setupDynamicRoutes(router: Router): Promise<boolean> {
  try {
    // 获取用户可访问的路由
    const routeConfigs = await routeApi.getUserRoutes()

    // 转换并注册路由
    routeConfigs.forEach((config) => {
      const route = transformRoute(config)
      
      // 添加到根路由
      router.addRoute(route)
      
      // 记录已注册的路由名称
      if (route.name) {
        registeredRouteNames.push(route.name as string)
      }
    })

    // 最后添加兜底路由（确保在所有动态路由之后）
    router.addRoute({
      path: '/:pathMatch(.*)*',
      name: 'NotFoundCatchAll',
      redirect: '/404',
    })
    registeredRouteNames.push('NotFoundCatchAll')

    isRoutesLoaded = true
    console.log(`[Router] 动态路由加载完成，共 ${routeConfigs.length} 个顶级路由`)
    
    return true
  } catch (error) {
    console.error('[Router] 动态路由加载失败:', error)
    return false
  }
}

/**
 * 移除所有动态路由
 * 
 * @param router - Vue Router 实例
 */
export function removeDynamicRoutes(router: Router): void {
  registeredRouteNames.forEach((name) => {
    if (router.hasRoute(name)) {
      router.removeRoute(name)
    }
  })
  
  registeredRouteNames = []
  isRoutesLoaded = false
  
  console.log('[Router] 动态路由已清除')
}

/**
 * 重新加载动态路由
 * 用于角色变更或权限刷新时
 * 
 * @param router - Vue Router 实例
 */
export async function reloadDynamicRoutes(router: Router): Promise<boolean> {
  // 先移除旧路由
  removeDynamicRoutes(router)
  
  // 重新加载
  return setupDynamicRoutes(router)
}

/**
 * 检查动态路由是否已加载
 */
export function isDynamicRoutesLoaded(): boolean {
  return isRoutesLoaded
}

/**
 * 获取已注册的动态路由名称列表
 */
export function getRegisteredRouteNames(): string[] {
  return [...registeredRouteNames]
}
