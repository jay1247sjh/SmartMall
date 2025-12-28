/**
 * 认证相关 API
 * 
 * 职责：
 * - 用户登录/登出
 * - Token 刷新
 * - 获取当前用户信息
 */

import { http, type RequestConfig } from './http'
import type { UserInfo, MerchantInfo } from '@/stores'

// ============================================================================
// 类型定义
// ============================================================================

/** 登录请求参数 */
export interface LoginRequest {
  username: string
  password: string
}

/** 登录响应 */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserInfo
  merchant?: MerchantInfo
}

/** 刷新 Token 请求参数 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/** 刷新 Token 响应 */
export interface RefreshTokenResponse {
  accessToken: string
}

/** 当前用户信息响应 */
export interface CurrentUserResponse {
  user: UserInfo
  merchant?: MerchantInfo
}

// ============================================================================
// API 方法
// ============================================================================

export const authApi = {
  /**
   * 用户登录
   */
  login(data: LoginRequest): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/login', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 刷新 Token
   */
  refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return http.post<RefreshTokenResponse>('/auth/refresh', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 用户登出
   */
  logout(): Promise<void> {
    return http.post<void>('/auth/logout')
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<CurrentUserResponse> {
    return http.get<CurrentUserResponse>('/user/me')
  },
}

export default authApi
