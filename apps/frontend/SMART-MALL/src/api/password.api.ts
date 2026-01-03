/**
 * 密码管理相关 API
 * 
 * 职责：
 * - 忘记密码（发送重置链接）
 * - 验证重置令牌
 * - 重置密码
 * - 修改密码
 */

import { http, type RequestConfig } from './http'

// ============================================================================
// 类型定义
// ============================================================================

/** 忘记密码请求参数 */
export interface ForgotPasswordRequest {
  email: string
}

/** 验证令牌请求参数 */
export interface VerifyTokenRequest {
  token: string
}

/** 重置密码请求参数 */
export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

/** 修改密码请求参数 */
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
   */
  forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    return http.post<void>('/auth/forgot-password', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 验证重置令牌是否有效
   */
  verifyResetToken(data: VerifyTokenRequest): Promise<boolean> {
    return http.post<boolean>('/auth/verify-reset-token', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 重置密码
   */
  resetPassword(data: ResetPasswordRequest): Promise<void> {
    return http.post<void>('/auth/reset-password', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 修改密码（需要登录）
   */
  changePassword(data: ChangePasswordRequest): Promise<void> {
    return http.post<void>('/auth/change-password', data)
  },
}

export default passwordApi
