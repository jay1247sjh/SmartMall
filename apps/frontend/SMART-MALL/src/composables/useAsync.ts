/**
 * useAsync Composable
 * 
 * 通用异步操作状态管理 composable，提供 loading、error、data 状态跟踪
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'

/**
 * useAsync 配置选项
 */
export interface UseAsyncOptions<T> {
  /** 是否立即执行 */
  immediate?: boolean
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 执行时是否重置状态 */
  resetOnExecute?: boolean
}

/**
 * useAsync 返回类型
 */
export interface UseAsyncReturn<T, P extends any[]> {
  /** 数据 */
  data: Ref<T | null>
  /** 错误 */
  error: Ref<Error | null>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 是否已准备好（有数据且无错误） */
  isReady: ComputedRef<boolean>
  /** 是否有错误 */
  isError: ComputedRef<boolean>
  /** 执行异步操作 */
  execute: (...args: P) => Promise<T>
  /** 重置状态 */
  reset: () => void
}

/**
 * 异步操作状态管理 Composable
 * 
 * @param fn - 异步函数
 * @param options - 配置选项
 * @returns 异步状态和方法
 * 
 * @example
 * ```ts
 * const { data, loading, error, execute } = useAsync(
 *   async (id: string) => {
 *     const response = await api.getUser(id)
 *     return response.data
 *   },
 *   { immediate: false }
 * )
 * 
 * // 手动执行
 * await execute('user-123')
 * ```
 */
export function useAsync<T, P extends any[] = []>(
  fn: (...args: P) => Promise<T>,
  options?: UseAsyncOptions<T>
): UseAsyncReturn<T, P> {
  const {
    immediate = false,
    onSuccess,
    onError,
    resetOnExecute = false
  } = options || {}

  // 状态
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<Error | null>(null)
  const loading = ref(false)

  // 计算属性
  const isReady = computed(() => data.value !== null && error.value === null)
  const isError = computed(() => error.value !== null)

  /**
   * 执行异步操作
   */
  async function execute(...args: P): Promise<T> {
    // 可选：执行前重置状态
    if (resetOnExecute) {
      data.value = null
      error.value = null
    }

    loading.value = true

    try {
      const result = await fn(...args)
      data.value = result
      error.value = null

      // 成功回调
      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      // 注意：失败时保留之前的 data（根据 Requirement 7.7）

      // 错误回调
      if (onError) {
        onError(err)
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置状态
   */
  function reset(): void {
    data.value = null
    error.value = null
    loading.value = false
  }

  // 立即执行（如果配置了且函数不需要参数）
  if (immediate) {
    execute(...([] as unknown as P))
  }

  return {
    data,
    error,
    loading,
    isReady,
    isError,
    execute,
    reset
  }
}
