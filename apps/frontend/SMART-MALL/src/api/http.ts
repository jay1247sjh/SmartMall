/**
 * HTTP 请求封装
 * 
 * 职责：
 * - 封装 Axios 实例
 * - 统一请求/响应拦截
 * - Token 自动携带与刷新
 * - 错误统一处理
 * - 请求取消支持
 * - 网络错误重试
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores'

// ============================================================================
// 类型定义
// ============================================================================

/** 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: string
  message: string
  data: T
  timestamp: number
}

/** 请求配置扩展 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否跳过 Token（用于登录等接口） */
  skipAuth?: boolean
  /** 是否显示错误提示 */
  showError?: boolean
  /** 是否已重试（内部使用） */
  _retry?: boolean
  /** 重试次数（内部使用） */
  _retryCount?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 请求唯一标识（用于取消） */
  requestId?: string
}

/** 扩展的内部请求配置 */
interface InternalRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean
  _retry?: boolean
  _retryCount?: number
  maxRetries?: number
  requestId?: string
}

/** HTTP 错误类型 */
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
// 常量
// ============================================================================

/** API 基础路径 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/** 请求超时时间（毫秒） */
const TIMEOUT = 15000

/** 成功响应码 */
const SUCCESS_CODE = '0'

/** 默认最大重试次数 */
const DEFAULT_MAX_RETRIES = 2

/** 重试延迟基数（毫秒） */
const RETRY_DELAY_BASE = 1000

/** 可重试的 HTTP 状态码 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504]

/** 可重试的网络错误 */
const RETRYABLE_ERROR_CODES = ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ERR_NETWORK']

// ============================================================================
// 请求取消管理
// ============================================================================

/** 存储进行中的请求 AbortController */
const pendingRequests = new Map<string, AbortController>()

/**
 * 生成请求唯一标识
 */
function generateRequestId(config: AxiosRequestConfig): string {
  return `${config.method || 'get'}_${config.url}_${JSON.stringify(config.params || {})}`
}

/**
 * 取消指定请求
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
 */
export function cancelAllRequests(): void {
  pendingRequests.forEach((controller) => controller.abort())
  pendingRequests.clear()
}

/**
 * 判断错误是否可重试
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
 * 计算重试延迟（指数退避）
 */
function getRetryDelay(retryCount: number): number {
  return RETRY_DELAY_BASE * Math.pow(2, retryCount)
}

/**
 * 延迟执行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// 创建 Axios 实例
// ============================================================================

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

instance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const requestConfig = config as InternalRequestConfig

    // 携带 Token（除非明确跳过）
    if (!requestConfig.skipAuth && userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }

    // 设置请求取消控制器
    const requestId = requestConfig.requestId || generateRequestId(config)
    
    // 取消之前相同的请求（防止重复请求）
    cancelRequest(requestId)
    
    // 创建新的 AbortController
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

/** 是否正在刷新 Token */
let isRefreshing = false

/** 等待刷新的请求队列 */
let refreshQueue: Array<(token: string) => void> = []

instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data, config } = response
    
    // 清理已完成的请求
    const requestConfig = config as InternalRequestConfig
    const requestId = requestConfig.requestId || generateRequestId(config)
    pendingRequests.delete(requestId)

    // 业务成功
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

    // 401 未授权 - 尝试刷新 Token
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

      originalRequest._retry = true
      isRefreshing = true

      try {
        // 尝试刷新 Token
        const { data } = await instance.post<ApiResponse<{ accessToken: string }>>(
          '/auth/refresh',
          { refreshToken: userStore.refreshToken },
          { skipAuth: true } as RequestConfig
        )

        const newToken = data.data.accessToken
        userStore.updateToken(newToken)

        // 获取到RefreshToken成功，执行队列中的请求
        refreshQueue.forEach((cb) => cb(newToken))
        // 清空队列
        refreshQueue = []

        // 重试原请求
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return instance(originalRequest)
      } catch {
        // 刷新失败，清除用户信息，跳转登录
        userStore.clearUser()
        // 取消所有进行中的请求
        cancelAllRequests()
        window.location.href = '/login'
        return Promise.reject(new HttpError('登录已过期', 'TOKEN_EXPIRED', 401))
      } finally {
        isRefreshing = false
      }
    }

    // 网络错误重试
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

    // 构建错误信息
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

export const http = {
  /**
   * GET 请求
   */
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return instance.get<ApiResponse<T>>(url, config).then((res) => res.data.data)
  },

  /**
   * POST 请求
   */
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.post<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },

  /**
   * PUT 请求
   */
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.put<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },

  /**
   * DELETE 请求
   */
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return instance.delete<ApiResponse<T>>(url, config).then((res) => res.data.data)
  },

  /**
   * PATCH 请求
   */
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.patch<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },
}

export { HttpError }
export default http
