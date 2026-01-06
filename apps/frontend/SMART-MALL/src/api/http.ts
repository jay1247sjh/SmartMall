/**
 * ============================================================================
 * HTTP 请求封装 (http.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 这是整个应用的网络请求基础设施，所有 API 调用都通过这个模块发出。
 * 
 * 【核心功能】
 * 1. Axios 实例封装 - 统一配置基础 URL、超时时间、请求头
 * 2. 请求拦截器 - 自动携带 Token、防止重复请求
 * 3. 响应拦截器 - 统一错误处理、Token 自动刷新
 * 4. 请求取消 - 支持取消单个或所有进行中的请求
 * 5. 网络重试 - 网络错误时自动重试（指数退避）
 * 
 * 【业务背景】
 * Smart Mall 是一个需要用户登录的系统，使用 JWT Token 进行身份验证：
 * - accessToken: 短期有效（如 15 分钟），用于 API 请求
 * - refreshToken: 长期有效（如 7 天），用于刷新 accessToken
 * 
 * 当 accessToken 过期时，系统会自动使用 refreshToken 获取新的 accessToken，
 * 用户无感知，不需要重新登录。
 * 
 * 【后端响应格式】
 * 后端统一返回以下格式：
 * {
 *   code: "0",        // "0" 表示成功，其他表示错误码
 *   message: "成功",   // 提示信息
 *   data: { ... },    // 业务数据
 *   timestamp: 1234567890
 * }
 * 
 * 【错误处理策略】
 * - 401 未授权：尝试刷新 Token，失败则跳转登录页
 * - 网络错误：自动重试（最多 2 次，指数退避）
 * - 业务错误：抛出 HttpError，由调用方处理
 * 
 * ============================================================================
 */

import axios, { 
  type AxiosInstance, 
  type AxiosRequestConfig, 
  type AxiosResponse, 
  type AxiosError, 
  type InternalAxiosRequestConfig 
} from 'axios'
import { useUserStore } from '@/stores'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 后端统一响应结构
 * 
 * 【设计说明】
 * 后端所有接口都返回这个格式，便于前端统一处理：
 * - code: 业务状态码，"0" 表示成功
 * - message: 人类可读的提示信息
 * - data: 实际的业务数据
 * - timestamp: 服务器时间戳
 */
export interface ApiResponse<T = unknown> {
  code: string
  message: string
  data: T
  timestamp: number
}

/**
 * 请求配置扩展
 * 
 * 在 Axios 原有配置基础上，增加业务相关的配置项
 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 
   * 是否跳过 Token 验证
   * 用于登录、注册等不需要认证的接口
   */
  skipAuth?: boolean
  
  /** 是否显示错误提示（预留，可配合 UI 组件使用） */
  showError?: boolean
  
  /** 是否已重试（内部使用，防止无限重试） */
  _retry?: boolean
  
  /** 当前重试次数（内部使用） */
  _retryCount?: number
  
  /** 最大重试次数 */
  maxRetries?: number
  
  /** 请求唯一标识（用于取消重复请求） */
  requestId?: string
}

/**
 * 扩展的内部请求配置
 * Axios 内部使用的配置类型，包含我们的扩展字段
 */
interface InternalRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean
  _retry?: boolean
  _retryCount?: number
  maxRetries?: number
  requestId?: string
}

/**
 * HTTP 错误类
 * 
 * 【设计说明】
 * 自定义错误类，包含更多错误信息：
 * - code: 错误码（业务错误码或 HTTP 状态码）
 * - status: HTTP 状态码
 * - data: 错误相关的数据
 * 
 * 调用方可以根据 code 进行不同的错误处理
 */
class HttpError extends Error {
  public code: string
  public status?: number
  public data?: unknown
  
  constructor(
    message: string,
    code: string,
    status?: number,
    data?: unknown
  ) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.status = status
    this.data = data
  }
}

// ============================================================================
// 常量配置
// ============================================================================

/**
 * API 基础路径
 * 
 * 【配置说明】
 * - 开发环境：通过 Vite 代理转发到后端（避免跨域）
 * - 生产环境：直接请求后端 API 地址
 * 
 * 可在 .env 文件中配置 VITE_API_BASE_URL
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 请求超时时间（毫秒）
 * 
 * 15 秒是一个合理的默认值：
 * - 太短：正常请求可能超时
 * - 太长：用户等待时间过长
 */
const TIMEOUT = 15000

/** 成功响应码（后端约定） */
const SUCCESS_CODE = '0'

/** 默认最大重试次数 */
const DEFAULT_MAX_RETRIES = 2

/** 重试延迟基数（毫秒），用于指数退避计算 */
const RETRY_DELAY_BASE = 1000

/**
 * 可重试的 HTTP 状态码
 * 
 * 这些状态码通常是临时性错误，重试可能成功：
 * - 408: 请求超时
 * - 429: 请求过多（限流）
 * - 500: 服务器内部错误
 * - 502: 网关错误
 * - 503: 服务不可用
 * - 504: 网关超时
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/**
 * 可重试的网络错误码
 * 
 * 这些是 Axios/Node.js 的网络错误码：
 * - ECONNABORTED: 连接中断
 * - ETIMEDOUT: 连接超时
 * - ENOTFOUND: DNS 解析失败
 * - ENETUNREACH: 网络不可达
 * - ERR_NETWORK: 网络错误
 */
const RETRYABLE_ERROR_CODES = ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ERR_NETWORK']

// ============================================================================
// 请求取消管理
// ============================================================================

/**
 * 存储进行中的请求
 * 
 * 【设计说明】
 * 使用 Map 存储每个请求的 AbortController：
 * - key: 请求唯一标识（method + url + params）
 * - value: AbortController 实例
 * 
 * 当发起新请求时，如果已有相同的请求在进行中，会先取消旧请求
 */
const pendingRequests = new Map<string, AbortController>()

/**
 * 生成请求唯一标识
 * 
 * 【算法说明】
 * 使用 method + url + params 组合生成唯一标识
 * 相同的请求会生成相同的标识，用于防止重复请求
 */
function generateRequestId(config: AxiosRequestConfig): string {
  return `${config.method || 'get'}_${config.url}_${JSON.stringify(config.params || {})}`
}

/**
 * 取消指定请求
 * 
 * 【使用场景】
 * - 用户快速切换页面，取消上一个页面的请求
 * - 搜索框输入时，取消上一次搜索请求
 * 
 * @param requestId - 请求唯一标识
 */
export function cancelRequest(requestId: string): void {
  const controller = pendingRequests.get(requestId)
  if (controller) {
    controller.abort()
    pendingRequests.delete(requestId)
  }
}

/**
 * 取消所有进行中的请求
 * 
 * 【使用场景】
 * - 用户登出时，取消所有请求
 * - Token 过期需要重新登录时
 */
export function cancelAllRequests(): void {
  pendingRequests.forEach((controller) => controller.abort())
  pendingRequests.clear()
}

/**
 * 判断错误是否可重试
 * 
 * 【判断逻辑】
 * 1. 请求被取消 → 不重试
 * 2. 网络错误（ECONNABORTED 等）→ 重试
 * 3. 特定 HTTP 状态码（500、502 等）→ 重试
 */
function isRetryableError(error: AxiosError): boolean {
  // 请求被取消不重试
  if (axios.isCancel(error)) return false
  
  // 网络错误可重试
  if (error.code && RETRYABLE_ERROR_CODES.includes(error.code)) return true
  
  // 特定 HTTP 状态码可重试
  if (error.response?.status && RETRYABLE_STATUS_CODES.includes(error.response.status)) return true
  
  return false
}

/**
 * 计算重试延迟（指数退避算法）
 * 
 * 【算法说明】
 * 延迟时间 = 基数 × 2^重试次数
 * - 第 1 次重试：1000 × 2^0 = 1000ms (1秒)
 * - 第 2 次重试：1000 × 2^1 = 2000ms (2秒)
 * - 第 3 次重试：1000 × 2^2 = 4000ms (4秒)
 * 
 * 【为什么用指数退避？】
 * 如果服务器过载，固定间隔重试会加重负担
 * 指数退避让重试间隔越来越长，给服务器恢复时间
 */
function getRetryDelay(retryCount: number): number {
  return RETRY_DELAY_BASE * Math.pow(2, retryCount)
}

/**
 * 延迟执行
 * 
 * 简单的 Promise 封装，用于重试前等待
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// 创建 Axios 实例
// ============================================================================

/**
 * Axios 实例
 * 
 * 【配置说明】
 * - baseURL: 所有请求的基础路径
 * - timeout: 请求超时时间
 * - headers: 默认请求头（JSON 格式）
 */
const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ============================================================================
// 请求拦截器
// ============================================================================

/**
 * 请求拦截器
 * 
 * 【执行时机】
 * 每个请求发出前都会经过这里
 * 
 * 【处理逻辑】
 * 1. 自动携带 Token（除非 skipAuth: true）
 * 2. 取消之前相同的请求（防止重复请求）
 * 3. 设置请求取消控制器
 */
instance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const requestConfig = config as InternalRequestConfig

    // ========================================
    // 自动携带 Token
    // ========================================
    
    /**
     * 除非明确设置 skipAuth: true，否则自动携带 Token
     * 
     * 【skipAuth 使用场景】
     * - 登录接口：用户还没有 Token
     * - 注册接口：用户还没有 Token
     * - 刷新 Token 接口：使用 refreshToken，不是 accessToken
     */
    if (!requestConfig.skipAuth && userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }

    // ========================================
    // 请求取消管理
    // ========================================
    
    // 生成或使用自定义的请求标识
    const requestId = requestConfig.requestId || generateRequestId(config)
    
    /**
     * 取消之前相同的请求
     * 
     * 【场景示例】
     * 用户快速点击搜索按钮两次：
     * 1. 第一次点击发出请求 A
     * 2. 第二次点击发出请求 B
     * 3. 请求 A 被取消，只保留请求 B
     * 
     * 这样可以避免：
     * - 浪费网络资源
     * - 旧请求的响应覆盖新请求的响应
     */
    cancelRequest(requestId)
    
    // 创建新的 AbortController 用于取消请求
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestId, controller)

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ============================================================================
// 响应拦截器
// ============================================================================

/** 
 * 是否正在刷新 Token
 * 
 * 【作用】
 * 防止多个请求同时触发 Token 刷新
 * 当一个请求触发刷新时，其他请求会等待刷新完成
 */
let isRefreshing = false

/** 
 * 等待刷新的请求队列
 * 
 * 【工作流程】
 * 1. 请求 A 发现 Token 过期，开始刷新
 * 2. 请求 B、C 也发现 Token 过期，加入队列等待
 * 3. Token 刷新成功，队列中的请求使用新 Token 重试
 */
let refreshQueue: Array<(token: string) => void> = []

/**
 * 响应拦截器
 * 
 * 【执行时机】
 * 每个响应返回后都会经过这里
 * 
 * 【处理逻辑】
 * 1. 成功响应：检查业务状态码，返回数据或抛出错误
 * 2. 401 错误：尝试刷新 Token
 * 3. 网络错误：自动重试
 * 4. 其他错误：构建 HttpError 抛出
 */
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data, config } = response
    
    // 清理已完成的请求记录
    const requestConfig = config as InternalRequestConfig
    const requestId = requestConfig.requestId || generateRequestId(config)
    pendingRequests.delete(requestId)

    // ========================================
    // 业务状态码检查
    // ========================================
    
    /**
     * 后端约定 code: "0" 表示成功
     * 其他值表示业务错误（如参数错误、权限不足等）
     */
    if (data.code === SUCCESS_CODE) {
      return response
    }

    // 业务失败，抛出错误
    throw new HttpError(data.message || '请求失败', data.code)
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalRequestConfig | undefined
    
    // 清理请求记录
    if (originalRequest) {
      const requestId = originalRequest.requestId || generateRequestId(originalRequest)
      pendingRequests.delete(requestId)
    }
    
    // 请求被取消，直接返回
    if (axios.isCancel(error)) {
      return Promise.reject(new HttpError('请求已取消', 'CANCELLED'))
    }

    const userStore = useUserStore()

    // ========================================
    // 401 未授权 - Token 刷新逻辑
    // ========================================
    
    /**
     * 当收到 401 错误时，说明 accessToken 已过期
     * 
     * 【处理流程】
     * 1. 如果正在刷新，将请求加入队列等待
     * 2. 如果没有在刷新，开始刷新 Token
     * 3. 刷新成功后，重试原请求和队列中的请求
     * 4. 刷新失败，清除用户信息，跳转登录页
     */
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // 正在刷新，加入队列等待
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(instance(originalRequest))
          })
        })
      }

      // 标记为已重试，防止无限循环
      originalRequest._retry = true
      isRefreshing = true

      try {
        // 使用 refreshToken 获取新的 accessToken
        const { data } = await instance.post<ApiResponse<{ accessToken: string }>>(
          '/auth/refresh',
          { refreshToken: userStore.refreshToken },
          { skipAuth: true } as RequestConfig  // 刷新接口不需要 accessToken
        )

        const newToken = data.data.accessToken
        userStore.updateToken(newToken)

        // 执行队列中等待的请求
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        // 使用新 Token 重试原请求
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return instance(originalRequest)
      } catch {
        // 刷新失败（refreshToken 也过期了）
        userStore.clearUser()
        cancelAllRequests()
        
        // 跳转到登录页
        window.location.href = '/login'
        return Promise.reject(new HttpError('登录已过期', 'TOKEN_EXPIRED', 401))
      } finally {
        isRefreshing = false
      }
    }

    // ========================================
    // 网络错误重试
    // ========================================
    
    /**
     * 对于可重试的错误，使用指数退避算法重试
     * 
     * 【重试条件】
     * - 网络错误（ECONNABORTED、ERR_NETWORK 等）
     * - 特定 HTTP 状态码（500、502、503 等）
     * - 未超过最大重试次数
     */
    if (originalRequest && isRetryableError(error)) {
      const maxRetries = originalRequest.maxRetries ?? DEFAULT_MAX_RETRIES
      const retryCount = originalRequest._retryCount ?? 0
      
      if (retryCount < maxRetries) {
        originalRequest._retryCount = retryCount + 1
        
        // 指数退避延迟
        await delay(getRetryDelay(retryCount))
        
        console.warn(`[HTTP] 请求重试 (${retryCount + 1}/${maxRetries}): ${originalRequest.url}`)
        return instance(originalRequest)
      }
    }

    // ========================================
    // 构建错误信息
    // ========================================
    
    const errorMessage = error.response?.data?.message 
      || error.message 
      || '网络请求失败'
    const errorCode = error.response?.data?.code || 'NETWORK_ERROR'
    
    return Promise.reject(new HttpError(errorMessage, errorCode, error.response?.status))
  }
)

// ============================================================================
// 请求方法封装
// ============================================================================

/**
 * HTTP 请求方法集合
 * 
 * 【设计说明】
 * 封装常用的 HTTP 方法，自动解包响应数据：
 * - 原始响应：{ code: "0", message: "成功", data: { ... } }
 * - 解包后：{ ... }（直接返回 data 字段）
 * 
 * 调用方不需要关心响应结构，直接使用业务数据
 */
export const http = {
  /**
   * GET 请求
   * 
   * 【使用场景】
   * 获取数据，如：获取用户信息、获取列表数据
   * 
   * @example
   * const user = await http.get<User>('/user/me')
   */
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return instance.get<ApiResponse<T>>(url, config).then((res) => res.data.data)
  },

  /**
   * POST 请求
   * 
   * 【使用场景】
   * 创建资源或提交数据，如：登录、创建订单
   * 
   * @example
   * const result = await http.post<LoginResponse>('/auth/login', { username, password })
   */
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.post<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },

  /**
   * PUT 请求
   * 
   * 【使用场景】
   * 更新整个资源，如：更新用户信息
   * 
   * @example
   * await http.put('/user/profile', { name: '新名字', email: 'new@email.com' })
   */
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.put<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },

  /**
   * DELETE 请求
   * 
   * 【使用场景】
   * 删除资源，如：删除订单、删除用户
   * 
   * @example
   * await http.delete('/orders/123')
   */
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return instance.delete<ApiResponse<T>>(url, config).then((res) => res.data.data)
  },

  /**
   * PATCH 请求
   * 
   * 【使用场景】
   * 部分更新资源，如：只更新用户的某个字段
   * 
   * @example
   * await http.patch('/user/profile', { name: '新名字' })
   */
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.patch<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },
}

export { HttpError }
export default http
