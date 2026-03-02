import type { UserStatus, UserType } from '@/stores'
/**
 * ============================================================================
 * 用户 API 模块 (user.api.ts)
 * ============================================================================
 *
 * 用户端资料与互动能力：
 * - 用户资料查询/更新
 * - 用户仪表盘统计
 * - 收藏/浏览/订单/优惠券互动
 * ============================================================================
 */
import http from './http'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 用户资料
 *
 * 包含用户的基本信息和状态。
 *
 * 【字段说明】
 * - id: 用户唯一标识
 * - username: 用户名（登录名）
 * - email: 邮箱（用于找回密码、接收通知）
 * - phone: 手机号（可选，用于短信通知）
 * - avatar: 头像 URL（可选）
 * - userType: 用户类型（ADMIN/MERCHANT/USER）
 * - status: 账户状态（ACTIVE/FROZEN/DELETED）
 * - createdAt: 注册时间
 */
export interface UserProfile {
  /** 用户唯一标识 */
  id: string
  /** 用户名（登录名） */
  username: string
  /** 邮箱地址 */
  email: string
  /** 手机号（可选） */
  phone?: string
  /** 头像 URL（可选） */
  avatar?: string
  /** 用户类型：ADMIN-管理员, MERCHANT-商家, USER-普通用户 */
  userType: 'ADMIN' | 'MERCHANT' | 'USER'
  /** 账户状态：ACTIVE-正常, FROZEN-冻结, DELETED-已删除 */
  status: 'ACTIVE' | 'FROZEN' | 'DELETED'
  /** 注册时间（ISO 8601 格式） */
  createdAt?: string
  /** 最后登录时间（ISO 8601 格式） */
  lastLoginTime?: string
}

/**
 * 更新资料请求
 *
 * 用户可以更新的资料字段。
 * 注意：用户名和用户类型不可修改。
 */
export interface UpdateProfileRequest {
  /** 新邮箱地址（可选） */
  email?: string
  /** 新手机号（可选） */
  phone?: string
  /** 新头像 URL（可选） */
  avatar?: string
}

/**
 * 用户仪表盘统计
 */
export interface UserDashboardStats {
  favoriteStoreCount: number
  browseHistoryCount: number
  orderCount: number
  availableCouponCount: number
}

/**
 * 用户趋势点位
 */
export interface UserTrendPoint {
  date: string
  browseCount: number
  orderCount: number
  favoriteCount: number
}

/**
 * 用户趋势统计
 */
export interface UserTrendStats {
  days: number
  points: UserTrendPoint[]
}

/**
 * 用户端可互动店铺简要信息
 */
export interface UserStoreBrief {
  storeId: string
  name: string
  category: string
}

/**
 * 用户订单（MVP）
 */
export interface UserOrder {
  orderId: string
  storeId?: string
  status: 'CREATED' | 'PAID' | 'CANCELLED' | 'COMPLETED'
  totalAmount: number
  createdAt: string
}

/**
 * 用户优惠券（MVP）
 */
export interface UserCoupon {
  couponId: string
  couponName: string
  discountType: 'AMOUNT' | 'RATE'
  discountValue: number
  status: 'UNUSED' | 'USED' | 'EXPIRED'
  expiresAt: string
  usedAt?: string
}

interface BackendUserProfileDTO {
  userId: string
  username: string
  userType: UserType
  status: UserStatus
  email?: string
  phone?: string
  lastLoginTime?: string
}

function toUserProfile(dto: BackendUserProfileDTO): UserProfile {
  return {
    id: dto.userId,
    username: dto.username,
    email: dto.email ?? '',
    phone: dto.phone,
    avatar: undefined,
    userType: dto.userType,
    status: dto.status,
    lastLoginTime: dto.lastLoginTime,
  }
}

// ============================================================================
// API 方法
// ============================================================================

/**
 * 获取当前用户资料
 *
 * 【业务逻辑】
 * 1. 从 localStorage 获取登录时保存的用户信息
 * 2. 转换为 UserProfile 格式返回
 * 3. 如果未登录，抛出错误
 *
 * 【后端接口】
 * GET /user/profile（待实现）
 *
 * @returns 用户资料
 * @throws Error 用户未登录时抛出
 */
export async function getProfile(): Promise<UserProfile> {
  const data = await http.get<BackendUserProfileDTO>('/user/profile')
  return toUserProfile(data)
}

/**
 * 更新用户资料
 *
 * 【业务逻辑】
 * 1. 获取当前用户资料
 * 2. 合并更新字段
 * 3. 返回更新后的资料
 *
 * 【后端接口】
 * PUT /user/profile（待实现）
 *
 * @param data 要更新的字段
 * @returns 更新后的用户资料
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const updated = await http.put<BackendUserProfileDTO>('/user/profile', data)
  return toUserProfile(updated)
}

/**
 * 获取用户仪表盘统计
 */
export async function getDashboardStats(): Promise<UserDashboardStats> {
  return http.get<UserDashboardStats>('/dashboard/user/stats')
}

/**
 * 获取用户近 N 天趋势统计
 */
export async function getDashboardTrend(days = 7): Promise<UserTrendStats> {
  return http.get<UserTrendStats>('/dashboard/user/stats/trend', { params: { days } })
}

/**
 * 获取可互动店铺列表
 */
export async function getActiveStores(limit = 12): Promise<UserStoreBrief[]> {
  return http.get<UserStoreBrief[]>('/user/stores/active', { params: { limit } })
}

/**
 * 获取收藏店铺 ID 列表
 */
export async function getFavoriteStoreIds(): Promise<string[]> {
  return http.get<string[]>('/user/favorites')
}

/**
 * 收藏店铺
 */
export async function addFavorite(storeId: string): Promise<void> {
  return http.post<void>(`/user/favorites/${storeId}`)
}

/**
 * 取消收藏
 */
export async function removeFavorite(storeId: string): Promise<void> {
  return http.delete<void>(`/user/favorites/${storeId}`)
}

/**
 * 记录浏览
 */
export async function recordBrowse(storeId: string): Promise<void> {
  return http.post<void>(`/user/history/store/${storeId}`)
}

/**
 * 创建订单（MVP）
 */
export async function createOrder(payload: { storeId?: string, totalAmount?: number }): Promise<UserOrder> {
  return http.post<UserOrder>('/user/orders', payload)
}

/**
 * 获取订单列表
 */
export async function getOrders(limit = 20): Promise<UserOrder[]> {
  return http.get<UserOrder[]>('/user/orders', { params: { limit } })
}

/**
 * 领取优惠券（MVP）
 */
export async function claimCoupon(): Promise<UserCoupon> {
  return http.post<UserCoupon>('/user/coupons/claim')
}

/**
 * 使用优惠券
 */
export async function useCoupon(couponId: string): Promise<UserCoupon> {
  return http.post<UserCoupon>(`/user/coupons/${couponId}/use`)
}

/**
 * 获取优惠券列表
 */
export async function getCoupons(limit = 20): Promise<UserCoupon[]> {
  return http.get<UserCoupon[]>('/user/coupons', { params: { limit } })
}

// ============================================================================
// 导出
// ============================================================================

/**
 * 用户 API 对象
 *
 * 提供命名空间式的 API 调用方式。
 *
 * @example
 * ```typescript
 * import { userApi } from '@/api'
 *
 * // 获取用户资料
 * const profile = await userApi.getProfile()
 *
 * // 更新用户资料
 * const updated = await userApi.updateProfile({ email: 'new@example.com' })
 * ```
 */
export const userApi = {
  getProfile,
  updateProfile,
  getDashboardStats,
  getDashboardTrend,
  getActiveStores,
  getFavoriteStoreIds,
  addFavorite,
  removeFavorite,
  recordBrowse,
  createOrder,
  getOrders,
  claimCoupon,
  useCoupon,
  getCoupons,
}

export default userApi
