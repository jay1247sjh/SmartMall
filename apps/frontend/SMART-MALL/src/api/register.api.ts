/**
 * ============================================================================
 * 用户注册 API 模块 (Register API)
 * ============================================================================
 *
 * 【业务职责】
 * 处理新用户注册相关的所有 API 请求，包括：
 * 1. 用户注册 - 创建新账号
 * 2. 用户名可用性检查 - 实时验证用户名是否已被占用
 * 3. 邮箱可用性检查 - 实时验证邮箱是否已被注册
 *
 * 【注册流程】
 * 1. 用户填写注册表单
 * 2. 前端调用 checkUsername/checkEmail 实时检查可用性
 * 3. 用户提交表单
 * 4. 前端调用 register 创建账号
 * 5. 后端验证数据、创建用户、返回用户信息
 * 6. 前端跳转到登录页
 *
 * 【认证说明】
 * 所有注册相关接口都使用 skipAuth: true，因为：
 * - 用户在注册时还没有账号，自然没有 Token
 * - 这些接口必须对未认证用户开放
 *
 * 【安全考虑】
 * - 后端应对注册接口进行频率限制，防止恶意注册
 * - 用户名/邮箱检查接口也应限流，防止枚举攻击
 * - 密码在传输前应考虑加密（HTTPS 已提供传输层加密）
 *
 * 【后端对应接口】
 * - POST /auth/register - 用户注册
 * - GET /auth/check-username - 检查用户名可用性
 * - GET /auth/check-email - 检查邮箱可用性
 * ============================================================================
 */

import { http, type RequestConfig } from './http'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 注册请求参数
 *
 * @property username - 用户名，3-20字符，只能包含字母、数字、下划线
 * @property password - 密码，至少6字符
 * @property confirmPassword - 确认密码，必须与 password 一致
 * @property email - 邮箱地址，用于账号验证和密码找回
 * @property phone - 手机号（可选），11位中国大陆手机号
 */
export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  email: string
  phone?: string
}

/**
 * 注册响应
 * 注册成功后返回新创建的用户基本信息
 *
 * @property userId - 用户唯一标识
 * @property username - 用户名
 * @property email - 邮箱
 * @property userType - 用户类型，新注册用户默认为 'USER'
 * @property status - 账号状态，新注册用户默认为 'ACTIVE'
 */
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
   *
   * 创建新用户账号。注册成功后用户需要到登录页面登录。
   * 新注册用户默认角色为 USER（普通用户）。
   *
   * @param data - 注册信息
   * @returns 新创建的用户信息
   * @throws 用户名已存在、邮箱已注册、密码不符合要求等错误
   */
  register(data: RegisterRequest): Promise<RegisterResponse> {
    return http.post<RegisterResponse>('/auth/register', data, { skipAuth: true } as RequestConfig)
  },

  /**
   * 检查用户名是否可用
   *
   * 用于注册表单的实时验证，在用户输入用户名时检查是否已被占用。
   * 建议使用防抖（debounce）调用，避免频繁请求。
   *
   * @param username - 要检查的用户名
   * @returns true 表示可用，false 表示已被占用
   */
  checkUsername(username: string): Promise<boolean> {
    return http.get<boolean>(`/auth/check-username?username=${encodeURIComponent(username)}`, { skipAuth: true } as RequestConfig)
  },

  /**
   * 检查邮箱是否可用
   *
   * 用于注册表单的实时验证，在用户输入邮箱时检查是否已被注册。
   * 建议使用防抖（debounce）调用，避免频繁请求。
   *
   * @param email - 要检查的邮箱地址
   * @returns true 表示可用，false 表示已被注册
   */
  checkEmail(email: string): Promise<boolean> {
    return http.get<boolean>(`/auth/check-email?email=${encodeURIComponent(email)}`, { skipAuth: true } as RequestConfig)
  },
}

export default registerApi
