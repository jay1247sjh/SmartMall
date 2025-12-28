/**
 * HTTP 请求封装
 * 
 * 职责：
 * - 封装 Axios 实例
 * - 统一请求/响应拦截
 * - Token 自动携带与刷新
 * - 错误统一处理
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
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
    const requestConfig = config as RequestConfig

    // 携带 Token（除非明确跳过）
    if (!requestConfig.skipAuth && userStore.accessToken) {
      config.headers.Authorization = `Bearer ${userStore.accessToken}`
    }

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
    const { data } = response

    // 业务成功
    if (data.code === SUCCESS_CODE) {
      return response
    }

    // 业务失败，抛出错误
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  async (error) => {
    const originalRequest = error.config as RequestConfig
    const userStore = useUserStore()

    // 401 未授权 - 尝试刷新 Token
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // 其他错误
    return Promise.reject(error)
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
}

export default http
