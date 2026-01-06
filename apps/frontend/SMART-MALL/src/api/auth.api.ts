/**
 * ============================================================================
 * 认证 API (auth.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 封装所有与用户认证相关的 API 接口：
 * - 用户登录
 * - 用户登出
 * - Token 刷新
 * - 获取当前用户信息
 * 
 * 【业务背景】
 * Smart Mall 使用 JWT (JSON Web Token) 进行身份验证：
 * 
 * 1. 用户登录成功后，后端返回两个 Token：
 *    - accessToken: 短期有效（如 15 分钟），用于 API 请求
 *    - refreshToken: 长期有效（如 7 天），用于刷新 accessToken
 * 
 * 2. 每次 API 请求都需要在 Header 中携带 accessToken：
 *    Authorization: Bearer <accessToken>
 * 
 * 3. 当 accessToken 过期时，使用 refreshToken 获取新的 accessToken
 * 
 * 4. 当 refreshToken 也过期时，用户需要重新登录
 * 
 * 【用户角色】
 * 系统支持三种用户角色：
 * - ADMIN: 管理员，可以管理整个商城
 * - MERCHANT: 商户，可以管理自己的店铺
 * - USER: 普通用户，可以浏览商城
 * 
 * ============================================================================
 */

import { http, type RequestConfig } from './http'
import type { UserType, UserStatus, MerchantInfo } from '@/stores'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string
  password: string
}

/**
 * 登录响应中的用户信息
 */
export interface LoginUserInfo {
  userId: string
  username: string
  userType: UserType
  status: UserStatus
  email?: string
  phone?: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: LoginUserInfo
  merchant?: MerchantInfo
}

/**
 * 刷新 Token 请求参数
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * 刷新 Token 响应
 */
export interface RefreshTokenResponse {
  accessToken: string
}

/**
 * 当前用户信息响应
 */
export interface CurrentUserResponse {
  user: LoginUserInfo
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
