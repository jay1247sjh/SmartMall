/**
 * useErrorBoundary Composable
 * 
 * 通用 API 错误处理 composable，提供错误状态跟踪、错误分类、重试功能
 * Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'

/**
 * 错误类型枚举
 */
export type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'unknown'

/**
 * API 错误接口
 */
export interface ApiError {
  /** 错误类型 */
  type: ErrorType
  /** 错误消息 */
  message: string
  /** 错误代码 */
  code?: string | number
  /** 错误详情 */
  details?: Record<string, any>
  /** 是否可重试 */
  retryable: boolean
  /** 原始错误 */
  originalError?: Error
}

/**
 * useErrorBoundary 配置选项
 */
export interface UseErrorBoundaryOptions {
  /** 认证错误回调（如重定向到登录页） */
  onAuthError?: () => void
  /** 网络错误回调 */
  onNetworkError?: () => void
  /** 是否自动显示通知（需要配合 useNotification 使用） */
  autoNotify?: boolean
}

/**
 * useErrorBoundary 返回类型
 */
export interface UseErrorBoundaryReturn {
  /** 当前错误 */
  error: Ref<ApiError | null>
  /** 错误类型 */
  errorType: ComputedRef<ErrorType | null>
  /** 是否有错误 */
  hasError: ComputedRef<boolean>
  /** 处理错误并返回分类后的 ApiError */
  handleError: (error: unknown) => ApiError
  /** 清除错误状态 */
  clearError: () => void
  /** 重试上次失败的操作 */
  retry: () => Promise<void>
  /** 错误处理包装器 */
  withErrorHandling: <T>(
    fn: () => Promise<T>,
    options?: { retryFn?: () => Promise<T> }
  ) => Promise<T>
}

/**
 * 判断是否为 Axios 错误
 */
function isAxiosError(error: unknown): error is {
  response?: { status: number; data?: any }
  message: string
  code?: string
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    ('response' in error || 'code' in error)
  )
}

/**
 * 分类错误类型
 * 
 * @param error - 原始错误
 * @returns 错误类型
 */
export function classifyError(error: unknown): ErrorType {
  if (isAxiosError(error)) {
    // 网络错误（无响应）
    if (!error.response) {
      // 检查是否为网络相关错误码
      if (error.code === 'ECONNABORTED' || 
          error.code === 'ERR_NETWORK' ||
          error.code === 'ETIMEDOUT' ||
          error.message?.toLowerCase().includes('network')) {
        return 'network'
      }
      return 'network'
    }

    const status = error.response.status

    // 认证错误
    if (status === 401 || status === 403) {
      return 'auth'
    }

    // 验证错误
    if (status === 400 || status === 422) {
      return 'validation'
    }

    // 服务器错误
    if (status >= 500) {
      return 'server'
    }
  }

  // 检查是否为网络错误（TypeError: Failed to fetch 等）
  if (error instanceof TypeError && error.message?.toLowerCase().includes('fetch')) {
    return 'network'
  }

  return 'unknown'
}

/**
 * 判断错误是否可重试
 * 
 * @param errorType - 错误类型
 * @returns 是否可重试
 */
export function isRetryable(errorType: ErrorType): boolean {
  // 网络错误和服务器错误可以重试
  return errorType === 'network' || errorType === 'server'
}

/**
 * 从错误中提取消息
 * 
 * @param error - 原始错误
 * @returns 错误消息
 */
function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // 尝试从响应数据中获取消息
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.response?.data?.error) {
      return error.response.data.error
    }
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '发生未知错误'
}

/**
 * 从错误中提取错误码
 * 
 * @param error - 原始错误
 * @returns 错误码
 */
function extractErrorCode(error: unknown): string | number | undefined {
  if (isAxiosError(error)) {
    if (error.response?.status) {
      return error.response.status
    }
    if (error.response?.data?.code) {
      return error.response.data.code
    }
    return error.code
  }
  return undefined
}

/**
 * 从错误中提取详情
 * 
 * @param error - 原始错误
 * @returns 错误详情
 */
function extractErrorDetails(error: unknown): Record<string, any> | undefined {
  if (isAxiosError(error)) {
    if (error.response?.data?.errors) {
      return error.response.data.errors
    }
    if (error.response?.data?.details) {
      return error.response.data.details
    }
  }
  return undefined
}

/**
 * API 错误处理 Composable
 * 
 * @param options - 配置选项
 * @returns 错误处理状态和方法
 * 
 * @example
 * ```ts
 * const { error, hasError, handleError, clearError, withErrorHandling } = useErrorBoundary({
 *   onAuthError: () => router.push('/login'),
 *   autoNotify: true
 * })
 * 
 * // 使用 withErrorHandling 包装异步操作
 * async function loadData() {
 *   try {
 *     const data = await withErrorHandling(
 *       () => api.fetchData(),
 *       { retryFn: () => api.fetchData() }
 *     )
 *     // 处理数据
 *   } catch (e) {
 *     // 错误已被处理，可以在这里做额外处理
 *   }
 * }
 * ```
 */
export function useErrorBoundary(
  options?: UseErrorBoundaryOptions
): UseErrorBoundaryReturn {
  const { onAuthError, onNetworkError, autoNotify: _autoNotify = false } = options || {}
  // Note: autoNotify is reserved for future integration with useNotification composable

  // 状态
  const error = ref<ApiError | null>(null)

  // 存储重试函数
  let retryFn: (() => Promise<any>) | null = null

  // 计算属性
  const hasError = computed(() => error.value !== null)
  const errorType = computed(() => error.value?.type ?? null)

  /**
   * 处理错误
   */
  function handleError(rawError: unknown): ApiError {
    const type = classifyError(rawError)
    const message = extractErrorMessage(rawError)
    const code = extractErrorCode(rawError)
    const details = extractErrorDetails(rawError)
    const retryable = isRetryable(type)

    const apiError: ApiError = {
      type,
      message,
      code,
      details,
      retryable,
      originalError: rawError instanceof Error ? rawError : new Error(String(rawError))
    }

    error.value = apiError

    // 触发特定错误类型的回调
    if (type === 'auth' && onAuthError) {
      onAuthError()
    }

    if (type === 'network' && onNetworkError) {
      onNetworkError()
    }

    return apiError
  }

  /**
   * 清除错误状态
   */
  function clearError(): void {
    error.value = null
    retryFn = null
  }

  /**
   * 重试上次失败的操作
   */
  async function retry(): Promise<void> {
    if (!retryFn) {
      console.warn('No retry function available')
      return
    }

    // 清除当前错误
    const currentRetryFn = retryFn
    clearError()

    try {
      await currentRetryFn()
    } catch (e) {
      // 重试失败，错误会在 withErrorHandling 中被处理
      throw e
    }
  }

  /**
   * 错误处理包装器
   */
  async function withErrorHandling<T>(
    fn: () => Promise<T>,
    fnOptions?: { retryFn?: () => Promise<T> }
  ): Promise<T> {
    // 清除之前的错误
    clearError()

    // 存储重试函数
    retryFn = fnOptions?.retryFn ?? fn

    try {
      const result = await fn()
      // 成功后清除重试函数
      retryFn = null
      return result
    } catch (e) {
      handleError(e)
      throw e
    }
  }

  return {
    error,
    errorType,
    hasError,
    handleError,
    clearError,
    retry,
    withErrorHandling
  }
}

/**
 * 创建全局错误边界实例
 * 
 * 用于在非组件上下文中使用错误处理
 */
let globalErrorBoundaryInstance: UseErrorBoundaryReturn | null = null

export function createGlobalErrorBoundary(
  options?: UseErrorBoundaryOptions
): UseErrorBoundaryReturn {
  if (!globalErrorBoundaryInstance) {
    globalErrorBoundaryInstance = useErrorBoundary(options)
  }
  return globalErrorBoundaryInstance
}

export function getGlobalErrorBoundary(): UseErrorBoundaryReturn | null {
  return globalErrorBoundaryInstance
}
