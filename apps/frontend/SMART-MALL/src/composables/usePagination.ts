/**
 * usePagination Composable
 * 
 * 通用分页状态管理 composable，提供分页导航和边界处理功能
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { ref, computed, watch, isRef, type Ref, type ComputedRef } from 'vue'

/**
 * usePagination 配置选项
 */
export interface UsePaginationOptions {
  /** 总记录数（可以是响应式引用或普通数字） */
  total: Ref<number> | number
  /** 默认页码 */
  defaultPage?: number
  /** 默认每页大小 */
  defaultPageSize?: number
  /** 可选的每页大小选项 */
  pageSizes?: number[]
}

/**
 * usePagination 返回类型
 */
export interface UsePaginationReturn {
  /** 当前页码 */
  currentPage: Ref<number>
  /** 每页大小 */
  pageSize: Ref<number>
  /** 总记录数 */
  total: ComputedRef<number>
  /** 总页数 */
  totalPages: ComputedRef<number>
  /** 是否有下一页 */
  hasNext: ComputedRef<boolean>
  /** 是否有上一页 */
  hasPrev: ComputedRef<boolean>
  /** 当前页起始索引（0-based） */
  startIndex: ComputedRef<number>
  /** 当前页结束索引（0-based，不包含） */
  endIndex: ComputedRef<number>
  /** 跳转到指定页 */
  goToPage: (page: number) => void
  /** 下一页 */
  nextPage: () => void
  /** 上一页 */
  prevPage: () => void
  /** 设置每页大小 */
  setPageSize: (size: number) => void
  /** 重置分页 */
  reset: () => void
}

/**
 * 分页状态管理 Composable
 * 
 * @param options - 配置选项
 * @returns 分页状态和方法
 * 
 * @example
 * ```ts
 * const total = ref(100)
 * const { currentPage, totalPages, hasNext, nextPage, goToPage } = usePagination({
 *   total,
 *   defaultPageSize: 10
 * })
 * 
 * // 跳转到第 5 页
 * goToPage(5)
 * 
 * // 下一页
 * if (hasNext.value) {
 *   nextPage()
 * }
 * ```
 */
export function usePagination(options: UsePaginationOptions): UsePaginationReturn {
  const {
    total: totalOption,
    defaultPage = 1,
    defaultPageSize = 10,
    pageSizes = [10, 20, 50, 100]
  } = options

  // 状态
  const currentPage = ref(defaultPage)
  const pageSize = ref(defaultPageSize)

  // 获取总数（支持响应式和非响应式）
  const total = computed(() => {
    return isRef(totalOption) ? totalOption.value : totalOption
  })

  // 计算总页数
  const totalPages = computed(() => {
    if (total.value <= 0) return 0
    return Math.ceil(total.value / pageSize.value)
  })

  // 是否有下一页
  const hasNext = computed(() => {
    return currentPage.value < totalPages.value
  })

  // 是否有上一页
  const hasPrev = computed(() => {
    return currentPage.value > 1
  })

  // 当前页起始索引（0-based）
  const startIndex = computed(() => {
    if (total.value === 0) return 0
    return (currentPage.value - 1) * pageSize.value
  })

  // 当前页结束索引（0-based，不包含）
  const endIndex = computed(() => {
    if (total.value === 0) return 0
    return Math.min(startIndex.value + pageSize.value, total.value)
  })

  /**
   * 跳转到指定页（带边界检查）
   */
  function goToPage(page: number): void {
    if (totalPages.value === 0) {
      currentPage.value = 1
      return
    }

    if (page < 1) {
      currentPage.value = 1
    } else if (page > totalPages.value) {
      currentPage.value = totalPages.value
    } else {
      currentPage.value = page
    }
  }

  /**
   * 下一页
   */
  function nextPage(): void {
    if (hasNext.value) {
      currentPage.value++
    }
  }

  /**
   * 上一页
   */
  function prevPage(): void {
    if (hasPrev.value) {
      currentPage.value--
    }
  }

  /**
   * 设置每页大小
   */
  function setPageSize(size: number): void {
    if (size < 1) return
    
    // 计算新的页码，尽量保持当前位置
    const currentFirstItem = startIndex.value
    pageSize.value = size
    
    // 重新计算页码
    const newPage = Math.floor(currentFirstItem / size) + 1
    goToPage(newPage)
  }

  /**
   * 重置分页
   */
  function reset(): void {
    currentPage.value = defaultPage
    pageSize.value = defaultPageSize
  }

  // 监听总数变化，自动调整页码
  watch(totalPages, (newTotalPages) => {
    if (newTotalPages > 0 && currentPage.value > newTotalPages) {
      currentPage.value = newTotalPages
    } else if (newTotalPages === 0) {
      currentPage.value = 1
    }
  })

  return {
    currentPage,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    reset
  }
}
