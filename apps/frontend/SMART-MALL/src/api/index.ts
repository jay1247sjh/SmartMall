/**
 * API 层统一导出
 */

// HTTP 封装
export * from './http'
export { default as http } from './http'

// 认证 API
export * from './auth.api'
export { default as authApi } from './auth.api'

// 注册 API
export * from './register.api'
export { default as registerApi } from './register.api'

// 密码管理 API
export * from './password.api'
export { default as passwordApi } from './password.api'

// 用户 API
export * from './user.api'
export { default as userApi } from './user.api'

// 管理员 API
export * from './admin.api'
export { default as adminApi } from './admin.api'

// 商家 API
export * from './merchant.api'
export { default as merchantApi } from './merchant.api'

// 商城 API
export * from './mall.api'
export { default as mallApi } from './mall.api'

// 商城管理 API
export * from './mall-manage.api'
export { default as mallManageApi } from './mall-manage.api'

// 路由 API
export * from './route.api'
export { default as routeApi } from './route.api'
