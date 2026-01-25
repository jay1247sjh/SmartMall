/**
 * useSearch Composable
 * 
 * 通用搜索状态管理 composable，提供防抖搜索和结果管理功能
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

/**
 * useSearch 配置选项
 */
export interface UseSearchOptions<T> {
  /** 搜索函数 */
  searchFn: (query: string) => Promise<T[]>
  /** 防抖延迟（毫秒） */
  debounceMs?: number
  /** 最小搜索长度 */
  minLength?: number
}

/**
 * useSearch 返回类型
 */
export interface UseSearchReturn<T> {
  /** 搜索查询 */
  query: Ref<string>
  /** 搜索结果 */
  results: Ref<T[]>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 是否有结果 */
  hasResults: ComputedRef<boolean>
  /** 结果是否为空（已搜索但无结果） */
  isEmpty: ComputedRef<boolean>
  /** 执行搜索 */
  search: (query?: string) => Promise<void>
  /** 清除搜索 */
  clear: () => void
  /** 设置查询（不触发搜索） */
  setQuery: (query: string) => void
}

/**
 * 创建防抖函数
 */
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): { debouncedFn: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return { debouncedFn, cancel }
}

/**
 * 搜索状态管理 Composable
 * 
 * @param options - 配置选项
 * @returns 搜索状态和方法
 * 
 * @example
 * ```ts
 * const { query, results, loading, search, clear } = useSearch({
 *   searchFn: async (q) => {
 *     const response = await api.searchProducts(q)
 *     return response.data
 *   },
 *   debounceMs: 300,
 *   minLength: 2
 * })
 * 
 * // 设置查询并自动搜索
 * query.value = 'iPhone'
 * 
 * // 或手动搜索
 * await search('iPhone')
 * ```
 */
export function useSearch<T>(options: UseSearchOptions<T>): UseSearchReturn<T> {
  const {
    searchFn,
    debounceMs = 300,
    minLength = 1
  } = options

  // 状态
  const query = ref('')
  const results = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const hasSearched = ref(false)
  const skipNextWatch = ref(false)

  // 计算属性
  const hasResults = computed(() => results.value.length > 0)
  const isEmpty = computed(() => hasSearched.value && results.value.length === 0)

  /**
   * 执行搜索
   */
  async function executeSearch(searchQuery: string): Promise<void> {
    // 检查最小长度
    if (searchQuery.length < minLength) {
      results.value = []
      hasSearched.value = false
      return
    }

    loading.value = true
    error.value = null

    try {
      const searchResults = await searchFn(searchQuery)
      results.value = searchResults
      hasSearched.value = true
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      results.value = []
    } finally {
      loading.value = false
    }
  }

  // 创建防抖搜索
  const { debouncedFn: debouncedSearch, cancel: cancelDebounce } = debounce(
    executeSearch,
    debounceMs
  )

  /**
   * 搜索方法（可选传入查询，否则使用当前 query）
   */
  async function search(searchQuery?: string): Promise<void> {
    const q = searchQuery ?? query.value
    if (searchQuery !== undefined) {
      query.value = q
    }
    cancelDebounce()
    await executeSearch(q)
  }

  /**
   * 清除搜索
   */
  function clear(): void {
    cancelDebounce()
    query.value = ''
    results.value = []
    error.value = null
    loading.value = false
    hasSearched.value = false
  }

  /**
   * 设置查询（不触发搜索）
   */
  function setQuery(newQuery: string): void {
    cancelDebounce()
    skipNextWatch.value = true
    query.value = newQuery
  }

  // 监听 query 变化，自动防抖搜索
  watch(query, (newQuery) => {
    if (skipNextWatch.value) {
      skipNextWatch.value = false
      return
    }
    if (newQuery.length >= minLength) {
      debouncedSearch(newQuery)
    } else {
      cancelDebounce()
      results.value = []
      hasSearched.value = false
    }
  })

  return {
    query,
    results,
    loading,
    error,
    hasResults,
    isEmpty,
    search,
    clear,
    setQuery
  }
}
