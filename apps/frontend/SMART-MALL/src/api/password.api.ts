/**
 * ============================================================================
 * 密码管理 API 模块 (Password API)
 * ============================================================================
 *
 * 【业务职责】
 * 处理用户密码相关的所有操作，包括：
 * 1. 忘记密码 - 发送密码重置邮件
 * 2. 验证重置令牌 - 检查重置链接是否有效
 * 3. 重置密码 - 使用令牌设置新密码
 * 4. 修改密码 - 已登录用户修改自己的密码
 *
 * 【密码重置流程】
 * 1. 用户在登录页点击"忘记密码"
 * 2. 输入注册邮箱，调用 forgotPassword
 * 3. 后端发送包含重置链接的邮件
 * 4. 用户点击邮件中的链接，前端调用 verifyResetToken 验证
 * 5. 验证通过后显示新密码输入表单
 * 6. 用户输入新密码，调用 resetPassword 完成重置
 *
 * 【密码修改流程】（已登录用户）
 * 1. 用户在个人设置中选择修改密码
 * 2. 输入旧密码和新密码
 * 3. 调用 changePassword 完成修改
 *
 * 【安全设计】
 * - 重置令牌是一次性的，使用后立即失效
 * - 重置令牌有有效期（通常 24 小时）
 * - forgotPassword 无论邮箱是否存在都返回成功，防止邮箱枚举
 * - changePassword 需要验证旧密码，防止账号被盗后密码被改
 *
 * 【认证说明】
 * - forgotPassword、verifyResetToken、resetPassword 使用 skipAuth: true
 *   因为用户此时无法登录（忘记密码了）
 * - changePassword 需要认证，因为是已登录用户的操作
 *
 * 【后端对应接口】
 * - POST /auth/forgot-password - 发送重置邮件
 * - POST /auth/verify-reset-token - 验证重置令牌
 * - POST /auth/reset-password - 重置密码
 * - POST /auth/change-password - 修改密码（需认证）
 * ============================================================================
 */

import { http, type RequestConfig } from './http'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 忘记密码请求参数
 * @property email - 用户注册时使用的邮箱地址
 */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * 验证令牌请求参数
 * @property token - 邮件中的重置令牌（通常是 URL 参数）
 */
export interface VerifyTokenRequest {
  token: string
}

/**
 * 重置密码请求参数
 * @property token - 邮件中的重置令牌
 * @property newPassword - 用户设置的新密码
 */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/**
 * 修改密码请求参数（已登录用户）
 * @property oldPassword - 当前密码，用于验证身份
 * @property newPassword - 新密码
 */
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

// ============================================================================
// API 方法
// ============================================================================

export const passwordApi = {
  /**
   * 忘记密码 - 发送重置链接到邮箱
   *
   * 用户忘记密码时调用，后端会发送包含重置链接的邮件。
   * 注意：无论邮箱是否存在，API 都应返回成功，这是安全最佳实践。
   *
   * @param data - 包含邮箱地址
   */
  forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return http.post<void>('/auth/forgot-password', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 验证重置令牌是否有效
   *
   * 用户点击邮件中的重置链接后，前端应先调用此接口验证令牌。
   * 如果令牌无效或已过期，应提示用户重新申请。
   *
   * @param data - 包含重置令牌
   * @returns true 表示令牌有效，false 表示无效或已过期
   */
  verifyResetToken(data: VerifyTokenRequest): Promise<boolean> {
    return http.post<boolean>('/auth/verify-reset-token', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 重置密码
   *
   * 使用有效的重置令牌设置新密码。
   * 成功后令牌立即失效，用户需要用新密码登录。
   *
   * @param data - 包含令牌和新密码
   * @throws 令牌无效、令牌已过期、密码不符合要求等错误
   */
  resetPassword(data: ResetPasswordRequest): Promise<void> {
    return http.post<void>('/auth/reset-password', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 修改密码（需要登录）
   *
   * 已登录用户修改自己的密码。
   * 需要提供旧密码进行身份验证，防止账号被盗后密码被恶意修改。
   *
   * @param data - 包含旧密码和新密码
   * @throws 旧密码错误、新密码不符合要求等错误
   */
  changePassword(data: ChangePasswordRequest): Promise<void> {
    return http.post<void>('/auth/change-password', data)
  },
}

export default passwordApi
