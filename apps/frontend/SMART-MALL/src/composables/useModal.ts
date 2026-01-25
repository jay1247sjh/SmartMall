/**
 * useModal Composable
 * 
 * 通用 Modal 状态管理 composable，提供可见性控制和数据传递功能
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { ref, type Ref } from 'vue'

/**
 * useModal 配置选项
 */
export interface UseModalOptions {
  /** 默认可见性 */
  defaultVisible?: boolean
}

/**
 * useModal 返回类型
 */
export interface UseModalReturn<T = any> {
  /** 可见性状态 */
  visible: Ref<boolean>
  /** Modal 数据 */
  data: Ref<T | null>
  /** 打开 Modal */
  open: (data?: T) => void
  /** 关闭 Modal */
  close: () => void
  /** 切换 Modal 可见性 */
  toggle: () => void
}

/**
 * Modal 状态管理 Composable
 * 
 * @param options - 配置选项
 * @returns Modal 状态和方法
 * 
 * @example
 * ```ts
 * const { visible, data, open, close } = useModal<UserData>()
 * 
 * // 打开 Modal 并传递数据
 * open({ id: 1, name: 'John' })
 * 
 * // 关闭 Modal
 * close()
 * ```
 */
export function useModal<T = any>(options?: UseModalOptions): UseModalReturn<T> {
  const { defaultVisible = false } = options || {}

  const visible = ref(defaultVisible)
  const data = ref<T | null>(null) as Ref<T | null>

  /**
   * 打开 Modal
   * @param modalData - 可选的 Modal 数据
   */
  function open(modalData?: T): void {
    data.value = modalData ?? null
    visible.value = true
  }

  /**
   * 关闭 Modal
   */
  function close(): void {
    visible.value = false
    data.value = null
  }

  /**
   * 切换 Modal 可见性
   */
  function toggle(): void {
    if (visible.value) {
      close()
    } else {
      open()
    }
  }

  return {
    visible,
    data,
    open,
    close,
    toggle
  }
}

/**
 * useModals 返回类型 - 多 Modal 管理
 */
export interface UseModalsReturn {
  /** Modal 状态映射 */
  modals: Ref<Map<string, { visible: boolean; data: any }>>
  /** 打开指定 Modal */
  open: (id: string, data?: any) => void
  /** 关闭指定 Modal */
  close: (id: string) => void
  /** 检查 Modal 是否打开 */
  isOpen: (id: string) => boolean
  /** 获取 Modal 数据 */
  getData: <T>(id: string) => T | null
  /** 关闭所有 Modal */
  closeAll: () => void
}

/**
 * 多 Modal 状态管理 Composable
 * 
 * @returns 多 Modal 状态和方法
 * 
 * @example
 * ```ts
 * const { open, close, isOpen, getData } = useModals()
 * 
 * // 打开编辑 Modal
 * open('edit', { id: 1, name: 'John' })
 * 
 * // 检查是否打开
 * if (isOpen('edit')) {
 *   const data = getData<UserData>('edit')
 * }
 * 
 * // 关闭所有
 * closeAll()
 * ```
 */
export function useModals(): UseModalsReturn {
  const modals = ref(new Map<string, { visible: boolean; data: any }>())

  /**
   * 打开指定 Modal
   */
  function open(id: string, data?: any): void {
    modals.value.set(id, { visible: true, data: data ?? null })
  }

  /**
   * 关闭指定 Modal
   */
  function close(id: string): void {
    const modal = modals.value.get(id)
    if (modal) {
      modals.value.set(id, { visible: false, data: null })
    }
  }

  /**
   * 检查 Modal 是否打开
   */
  function isOpen(id: string): boolean {
    const modal = modals.value.get(id)
    return modal?.visible ?? false
  }

  /**
   * 获取 Modal 数据
   */
  function getData<T>(id: string): T | null {
    const modal = modals.value.get(id)
    return (modal?.data as T) ?? null
  }

  /**
   * 关闭所有 Modal
   */
  function closeAll(): void {
    modals.value.forEach((_, id) => {
      modals.value.set(id, { visible: false, data: null })
    })
  }

  return {
    modals,
    open,
    close,
    isOpen,
    getData,
    closeAll
  }
}
