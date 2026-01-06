/**
 * ============================================================================
 * 用户 API 模块 (user.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 提供用户资料管理相关的 API 接口，包括获取和更新用户信息。
 * 
 * 【业务背景】
 * 用户资料是系统的基础数据，用于：
 * - 个人中心展示用户信息
 * - 权限系统判断用户角色
 * - 业务流程中获取用户上下文
 * 
 * 【当前状态】
 * ⚠️ 后端 UserController 尚未实现，当前使用 localStorage 中的登录信息作为临时方案。
 * 待后端实现后，取消注释真实 API 调用即可。
 * 
 * 【与其他模块的关系】
 * - stores/user.store.ts：调用此 API 获取用户信息
 * - views/user/：用户中心页面使用此 API
 * - auth.api.ts：登录成功后会保存用户信息到 localStorage
 * 
 * 【安全考虑】
 * - 用户只能获取和修改自己的资料
 * - 敏感信息（如密码）不会通过此 API 返回
 * - 头像上传需要单独的文件上传接口
 * 
 * ============================================================================
 */
// import http from './http'  // 后端实现后启用

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
  createdAt: string
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
  // 后端实现后启用：
  // return http.get<UserProfile>('/user/profile')
  
  // 临时：从 localStorage 获取登录时保存的用户信息
  const userStr = localStorage.getItem('sm_userInfo')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return {
        id: user.userId,
        username: user.username,
        email: user.email || '',
        phone: user.phone,
        avatar: undefined,
        userType: user.userType,
        status: user.status,
        createdAt: user.lastLoginTime || new Date().toISOString(),
      }
    } catch {
      // 解析失败，返回默认值
    }
  }
  
  throw new Error('用户未登录')
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
  // 后端实现后启用：
  // return http.put<UserProfile>('/user/profile', data)
  
  // 临时：模拟更新成功
  const current = await getProfile()
  return {
    ...current,
    email: data.email || current.email,
    phone: data.phone || current.phone,
    avatar: data.avatar || current.avatar,
  }
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
}

export default userApi
