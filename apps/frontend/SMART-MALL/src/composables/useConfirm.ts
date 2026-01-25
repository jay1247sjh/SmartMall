/**
 * useConfirm Composable
 * 
 * 通用确认对话框状态管理 composable，提供 Promise 返回的确认方法
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7
 */

import { ref, type Ref } from 'vue'

/**
 * 确认对话框配置选项
 */
export interface ConfirmOptions {
  /** 标题 */
  title?: string
  /** 消息内容 */
  message: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 变体样式 */
  variant?: 'default' | 'danger' | 'warning'
  /** 图标 */
  icon?: string
}

/**
 * useConfirm 返回类型
 */
export interface UseConfirmReturn {
  /** 可见性状态 */
  visible: Ref<boolean>
  /** 当前配置选项 */
  options: Ref<ConfirmOptions | null>
  /** 显示确认对话框并返回 Promise */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** 关闭对话框（取消） */
  close: () => void
  /** 处理确认操作 */
  handleConfirm: () => void
  /** 处理取消操作 */
  handleCancel: () => void
}

/**
 * 确认对话框状态管理 Composable
 * 
 * @returns 确认对话框状态和方法
 * 
 * @example
 * ```ts
 * const { visible, options, confirm, handleConfirm, handleCancel } = useConfirm()
 * 
 * // 显示确认对话框
 * const confirmed = await confirm({
 *   title: '删除确认',
 *   message: '确定要删除这条记录吗？',
 *   confirmText: '删除',
 *   cancelText: '取消',
 *   variant: 'danger'
 * })
 * 
 * if (confirmed) {
 *   // 用户点击了确认
 *   await deleteRecord()
 * }
 * ```
 * 
 * @example
 * ```vue
 * <!-- 在模板中使用 -->
 * <ConfirmDialog
 *   v-model:visible="visible"
 *   :title="options?.title"
 *   :message="options?.message"
 *   :variant="options?.variant"
 *   @confirm="handleConfirm"
 *   @cancel="handleCancel"
 * />
 * ```
 */
export function useConfirm(): UseConfirmReturn {
  // 状态
  const visible = ref(false)
  const options = ref<ConfirmOptions | null>(null)

  // Promise 解析函数
  let resolvePromise: ((value: boolean) => void) | null = null

  /**
   * 显示确认对话框
   */
  function confirm(confirmOptions: ConfirmOptions): Promise<boolean> {
    // 设置默认值
    options.value = {
      title: confirmOptions.title ?? '确认',
      message: confirmOptions.message,
      confirmText: confirmOptions.confirmText ?? '确认',
      cancelText: confirmOptions.cancelText ?? '取消',
      variant: confirmOptions.variant ?? 'default',
      icon: confirmOptions.icon
    }

    visible.value = true

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  /**
   * 处理确认操作
   */
  function handleConfirm(): void {
    visible.value = false
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
    options.value = null
  }

  /**
   * 处理取消操作
   */
  function handleCancel(): void {
    visible.value = false
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
    options.value = null
  }

  /**
   * 关闭对话框（等同于取消）
   */
  function close(): void {
    handleCancel()
  }

  return {
    visible,
    options,
    confirm,
    close,
    handleConfirm,
    handleCancel
  }
}

/**
 * 创建全局确认对话框实例
 * 
 * 用于在非组件上下文中使用确认对话框
 * 
 * @example
 * ```ts
 * // 在 store 或 service 中使用
 * import { globalConfirm } from '@/composables/useConfirm'
 * 
 * async function deleteItem(id: string) {
 *   const confirmed = await globalConfirm.confirm({
 *     title: '删除确认',
 *     message: '确定要删除吗？',
 *     variant: 'danger'
 *   })
 *   
 *   if (confirmed) {
 *     await api.delete(id)
 *   }
 * }
 * ```
 */
let globalConfirmInstance: UseConfirmReturn | null = null

export function createGlobalConfirm(): UseConfirmReturn {
  if (!globalConfirmInstance) {
    globalConfirmInstance = useConfirm()
  }
  return globalConfirmInstance
}

export function getGlobalConfirm(): UseConfirmReturn | null {
  return globalConfirmInstance
}
