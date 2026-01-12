/**
 * ============================================================================
 * API 层统一导出 (index.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 作为 API 层的统一入口，导出所有 API 模块。
 * 其他模块只需要从 '@/api' 导入，不需要知道具体的文件路径。
 * 
 * 【模块说明】
 * 
 * 1. HTTP 封装 (http.ts)
 *    - Axios 实例配置
 *    - 请求/响应拦截器
 *    - Token 自动刷新
 *    - 错误统一处理
 * 
 * 2. 认证 API (auth.api.ts)
 *    - 用户登录/登出
 *    - Token 刷新
 *    - 获取当前用户信息
 * 
 * 3. 注册 API (register.api.ts)
 *    - 用户注册
 *    - 用户名唯一性检查
 *    - 邮箱唯一性检查
 * 
 * 4. 密码管理 API (password.api.ts)
 *    - 忘记密码（发送重置邮件）
 *    - 重置密码
 *    - 修改密码
 * 
 * 5. 用户 API (user.api.ts)
 *    - 获取用户信息
 *    - 更新用户资料
 * 
 * 6. 管理员 API (admin.api.ts)
 *    - 用户管理
 *    - 系统配置
 *    - 数据统计
 * 
 * 7. 商家 API (merchant.api.ts)
 *    - 店铺管理
 *    - 区域申请
 *    - 商家数据统计
 * 
 * 8. 商城 API (mall.api.ts)
 *    - 商城列表
 *    - 商城结构
 *    - 店铺详情
 * 
 * 9. 商城管理 API (mall-manage.api.ts)
 *    - 商城 CRUD
 *    - 楼层管理
 *    - 区域管理
 * 
 * 10. 路由 API (route.api.ts)
 *     - 动态路由配置
 *     - 权限路由
 * 
 * 11. 商城建模器 API (mall-builder.api.ts)
 *     - 保存/加载商城布局
 *     - 版本管理
 * 
 * 【使用示例】
 * ```typescript
 * import { authApi, http, merchantApi } from '@/api'
 * 
 * // 登录
 * const response = await authApi.login({ username, password })
 * 
 * // 获取商家统计
 * const stats = await merchantApi.getStats()
 * 
 * // 自定义请求
 * const data = await http.get<MyType>('/custom/endpoint')
 * ```
 * 
 * ============================================================================
 */

// ============================================================================
// HTTP 封装
// ============================================================================

export * from './http'
export { default as http } from './http'

// ============================================================================
// 认证相关 API
// ============================================================================

/** 认证 API - 登录、登出、Token 刷新 */
export * from './auth.api'
export { default as authApi } from './auth.api'

/** 注册 API - 用户注册、唯一性检查 */
export * from './register.api'
export { default as registerApi } from './register.api'

/** 密码管理 API - 忘记密码、重置密码 */
export * from './password.api'
export { default as passwordApi } from './password.api'

// ============================================================================
// 用户相关 API
// ============================================================================

/** 用户 API - 用户信息、资料更新 */
export * from './user.api'
export { default as userApi } from './user.api'

/** 管理员 API - 用户管理、系统配置 */
export * from './admin.api'
export { default as adminApi } from './admin.api'

// ============================================================================
// 商家相关 API
// ============================================================================

/**
 * 商家 API - 店铺管理、区域申请
 * 
 * 【类型导出说明】
 * 由于 merchant.api.ts 和 mall.api.ts 都有 AvailableArea 类型，
 * 这里使用别名导出避免冲突：
 * - MerchantAvailableArea: 商家视角的可用区域
 * - MallAvailableArea: 商城视角的可用区域
 */
export {
  merchantApi,
  type MerchantStats,
  type Store,
  type UpdateStoreRequest,
  type AreaApplication,
  type AvailableArea as MerchantAvailableArea,
} from './merchant.api'
export { default as merchantApiDefault } from './merchant.api'

// ============================================================================
// 商城相关 API
// ============================================================================

/** 商城 API - 商城列表、结构、店铺详情 */
export {
  mallApi,
  type MallListItem,
  type MallStructure,
  type StoreDetail,
  type AvailableArea as MallAvailableArea,
} from './mall.api'
export { default as mallApiDefault } from './mall.api'

/** 商城管理 API - 商城 CRUD、楼层管理、区域管理 */
export * from './mall-manage.api'
export { default as mallManageApi } from './mall-manage.api'

// ============================================================================
// 系统相关 API
// ============================================================================

/** 路由 API - 动态路由配置 */
export * from './route.api'
export { default as routeApi } from './route.api'

/** 商城建模器 API - 布局保存/加载、版本管理 */
export * from './mall-builder.api'
export { default as mallBuilderApi } from './mall-builder.api'

// ============================================================================
// 区域权限 API
// ============================================================================

/** 区域权限 API - 区域申请、审批、权限管理 */
export * from './area-permission.api'
export { default as areaPermissionApi } from './area-permission.api'

// ============================================================================
// 店铺管理 API
// ============================================================================

/** 店铺管理 API - 店铺创建、编辑、审批、状态管理 */
export * from './store.api'
export { default as storeApi } from './store.api'

// ============================================================================
// 商品管理 API
// ============================================================================

/** 商品管理 API - 商品创建、编辑、上下架、库存管理 */
export * from './product.api'
export { default as productApi } from './product.api'

// ============================================================================
// 智能服务 API
// ============================================================================

/** 智能服务 API - AI 对话、视觉理解、操作确认 */
export * from './intelligence.api'
export { default as intelligenceApi } from './intelligence.api'
