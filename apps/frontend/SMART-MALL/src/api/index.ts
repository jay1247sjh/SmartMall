/**
 * API 层统一导出
 */

// HTTP 封装
export * from './http'
export { default as http } from './http'

// 认证 API
export * from './auth.api'
export { default as authApi } from './auth.api'

// 商城 API
export * from './mall.api'
export { default as mallApi } from './mall.api'

// 路由 API
export * from './route.api'
export { default as routeApi } from './route.api'
