/**
 * 用户注册 API
 * 
 * 职责：
 * - 用户注册
 * - 用户名/邮箱可用性检查
 */

import { http, type RequestConfig } from './http'

// ============================================================================
// 类型定义
// ============================================================================

/** 注册请求参数 */
export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  email: string
  phone?: string
}

/** 注册响应 */
export interface RegisterResponse {
  userId: string
  username: string
  email: string
  userType: string
  status: string
}

// ============================================================================
// API 方法
// ============================================================================

export const registerApi = {
  /**
   * 用户注册
   */
  register(data: RegisterRequest): Promise<RegisterResponse> {
    return http.post<RegisterResponse>('/auth/register', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 检查用户名是否可用
   */
  checkUsername(username: string): Promise<boolean> {
    return http.get<boolean>(`/auth/check-username?username=${encodeURIComponent(username)}`, { skipAuth: true } as RequestConfig)
  },

  /**
   * 检查邮箱是否可用
   */
  checkEmail(email: string): Promise<boolean> {
    return http.get<boolean>(`/auth/check-email?email=${encodeURIComponent(email)}`, { skipAuth: true } as RequestConfig)
  },
}

export default registerApi
