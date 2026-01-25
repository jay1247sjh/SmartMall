/**
 * useTable Composable
 * 
 * 通用表格状态管理 composable，提供分页、排序、筛选和数据加载功能
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

/**
 * 表格请求参数
 */
export interface TableParams {
  /** 当前页码 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 排序字段 */
  sortBy?: string
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
  /** 筛选条件 */
  filters?: Record<string, any>
}

/**
 * 表格响应数据
 */
export interface TableResponse<T> {
  /** 数据列表 */
  data: T[]
  /** 总记录数 */
  total: number
}

/**
 * useTable 配置选项
 */
export interface UseTableOptions<T> {
  /** 数据获取函数 */
  fetchData: (params: TableParams) => Promise<TableResponse<T>>
  /** 默认每页大小 */
  defaultPageSize?: number
  /** 默认排序字段 */
  defaultSortBy?: string
  /** 默认排序顺序 */
  defaultSortOrder?: 'asc' | 'desc'
  /** 是否立即加载 */
  immediate?: boolean
}

/**
 * useTable 返回类型
 */
export interface UseTableReturn<T> {
  /** 表格数据 */
  data: Ref<T[]>
  /** 总记录数 */
  total: Ref<number>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 当前页码 */
  page: Ref<number>
  /** 每页大小 */
  pageSize: Ref<number>
  /** 总页数 */
  totalPages: ComputedRef<number>
  /** 排序字段 */
  sortBy: Ref<string | undefined>
  /** 排序顺序 */
  sortOrder: Ref<'asc' | 'desc'>
  /** 筛选条件 */
  filters: Ref<Record<string, any>>
  /** 刷新数据 */
  refresh: () => Promise<void>
  /** 设置页码 */
  setPage: (page: number) => void
  /** 设置每页大小 */
  setPageSize: (size: number) => void
  /** 设置排序 */
  setSort: (field: string, order?: 'asc' | 'desc') => void
  /** 设置筛选条件 */
  setFilter: (key: string, value: any) => void
  /** 清除所有筛选条件 */
  clearFilters: () => void
}

/**
 * 表格状态管理 Composable
 * 
 * @param options - 配置选项
 * @returns 表格状态和方法
 * 
 * @example
 * ```ts
 * const { data, loading, page, setPage, refresh } = useTable({
 *   fetchData: async (params) => {
 *     const response = await api.getProducts(params)
 *     return { data: response.records, total: response.total }
 *   },
 *   defaultPageSize: 10
 * })
 * ```
 */
export function useTable<T>(options: UseTableOptions<T>): UseTableReturn<T> {
  const {
    fetchData,
    defaultPageSize = 10,
    defaultSortBy,
    defaultSortOrder = 'asc',
    immediate = true
  } = options

  // 表格状态
  const data = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // 分页状态
  const page = ref(1)
  const pageSize = ref(defaultPageSize)

  // 排序状态
  const sortBy = ref<string | undefined>(defaultSortBy)
  const sortOrder = ref<'asc' | 'desc'>(defaultSortOrder)

  // 筛选状态
  const filters = ref<Record<string, any>>({})

  // 计算总页数
  const totalPages = computed(() => {
    if (total.value === 0) return 0
    return Math.ceil(total.value / pageSize.value)
  })

  /**
   * 加载数据
   */
  async function loadData(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const params: TableParams = {
        page: page.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        filters: Object.keys(filters.value).length > 0 ? filters.value : undefined
      }

      const response = await fetchData(params)
      data.value = response.data
      total.value = response.total

      // 如果当前页超出范围，调整到最后一页
      if (page.value > totalPages.value && totalPages.value > 0) {
        page.value = totalPages.value
      }
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新数据
   */
  async function refresh(): Promise<void> {
    await loadData()
  }

  /**
   * 设置页码
   */
  function setPage(newPage: number): void {
    if (newPage < 1) {
      page.value = 1
    } else if (totalPages.value > 0 && newPage > totalPages.value) {
      page.value = totalPages.value
    } else {
      page.value = newPage
    }
  }

  /**
   * 设置每页大小
   */
  function setPageSize(size: number): void {
    if (size < 1) return
    pageSize.value = size
    // 重置到第一页
    page.value = 1
  }

  /**
   * 设置排序
   */
  function setSort(field: string, order?: 'asc' | 'desc'): void {
    sortBy.value = field
    sortOrder.value = order || 'asc'
  }

  /**
   * 设置筛选条件
   */
  function setFilter(key: string, value: any): void {
    if (value === undefined || value === null || value === '') {
      delete filters.value[key]
    } else {
      filters.value[key] = value
    }
    // 重置到第一页
    page.value = 1
  }

  /**
   * 清除所有筛选条件
   */
  function clearFilters(): void {
    filters.value = {}
    page.value = 1
  }

  // 监听分页、排序、筛选变化，自动重新加载数据
  watch(
    [page, pageSize, sortBy, sortOrder, filters],
    () => {
      loadData()
    },
    { deep: true }
  )

  // 立即加载数据
  if (immediate) {
    loadData()
  }

  return {
    data,
    total,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    sortBy,
    sortOrder,
    filters,
    refresh,
    setPage,
    setPageSize,
    setSort,
    setFilter,
    clearFilters
  }
}
