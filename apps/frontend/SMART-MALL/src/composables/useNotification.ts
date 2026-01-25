/**
 * useNotification Composable
 * 
 * 通用通知管理 composable，提供通知类型支持、可配置持续时间和队列管理
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6
 */

import { ref, type Ref } from 'vue'

/**
 * 通知类型
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/**
 * 通知接口
 */
export interface Notification {
  /** 唯一标识符 */
  id: string
  /** 通知类型 */
  type: NotificationType
  /** 标题（可选） */
  title?: string
  /** 消息内容 */
  message: string
  /** 持续时间（毫秒），0 表示不自动关闭 */
  duration?: number
  /** 是否可关闭 */
  closable?: boolean
}

/**
 * useNotification 配置选项
 */
export interface UseNotificationOptions {
  /** 最大通知数量 */
  maxCount?: number
  /** 默认持续时间（毫秒） */
  defaultDuration?: number
  /** 通知位置 */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

/**
 * useNotification 返回类型
 */
export interface UseNotificationReturn {
  /** 当前通知列表 */
  notifications: Ref<Notification[]>
  /** 显示通知 */
  show: (notification: Omit<Notification, 'id'>) => string
  /** 显示成功通知 */
  success: (message: string, title?: string) => string
  /** 显示错误通知 */
  error: (message: string, title?: string) => string
  /** 显示警告通知 */
  warning: (message: string, title?: string) => string
  /** 显示信息通知 */
  info: (message: string, title?: string) => string
  /** 关闭指定通知 */
  dismiss: (id: string) => void
  /** 关闭所有通知 */
  dismissAll: () => void
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 根据通知类型获取默认持续时间
 * success/info: 3000ms
 * error/warning: 5000ms
 */
function getDefaultDurationByType(type: NotificationType): number {
  switch (type) {
    case 'success':
    case 'info':
      return 3000
    case 'error':
    case 'warning':
      return 5000
    default:
      return 3000
  }
}

/**
 * 通知管理 Composable
 * 
 * @param options - 配置选项
 * @returns 通知状态和方法
 * 
 * @example
 * ```ts
 * const { notifications, success, error, warning, info, dismiss, dismissAll } = useNotification({
 *   maxCount: 5,
 *   defaultDuration: 3000,
 *   position: 'top-right'
 * })
 * 
 * // 显示成功通知
 * success('操作成功！')
 * 
 * // 显示带标题的错误通知
 * error('请检查网络连接', '网络错误')
 * 
 * // 显示自定义通知
 * const id = show({
 *   type: 'warning',
 *   title: '警告',
 *   message: '您的会话即将过期',
 *   duration: 10000,
 *   closable: true
 * })
 * 
 * // 手动关闭通知
 * dismiss(id)
 * 
 * // 关闭所有通知
 * dismissAll()
 * ```
 */
export function useNotification(
  options?: UseNotificationOptions
): UseNotificationReturn {
  const {
    maxCount = 5,
    defaultDuration,
    position: _position = 'top-right'
  } = options || {}
  // Note: position is reserved for future UI integration

  // 状态
  const notifications = ref<Notification[]>([])

  // 存储定时器，用于自动关闭
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * 关闭指定通知
   */
  function dismiss(id: string): void {
    // 清除定时器
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }

    // 从列表中移除
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * 关闭所有通知
   */
  function dismissAll(): void {
    // 清除所有定时器
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()

    // 清空列表
    notifications.value = []
  }

  /**
   * 显示通知
   */
  function show(notification: Omit<Notification, 'id'>): string {
    const id = generateId()

    // 确定持续时间
    let duration: number
    if (notification.duration !== undefined) {
      duration = notification.duration
    } else if (defaultDuration !== undefined) {
      duration = defaultDuration
    } else {
      duration = getDefaultDurationByType(notification.type)
    }

    // 创建通知对象
    const newNotification: Notification = {
      id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      duration,
      closable: notification.closable ?? true
    }

    // 检查是否超过最大数量，如果超过则移除最旧的通知
    while (notifications.value.length >= maxCount) {
      const oldest = notifications.value[0]
      if (oldest) {
        dismiss(oldest.id)
      }
    }

    // 添加到列表
    notifications.value.push(newNotification)

    // 设置自动关闭定时器（duration > 0 时）
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismiss(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  /**
   * 显示成功通知
   */
  function success(message: string, title?: string): string {
    return show({
      type: 'success',
      title,
      message
    })
  }

  /**
   * 显示错误通知
   */
  function error(message: string, title?: string): string {
    return show({
      type: 'error',
      title,
      message
    })
  }

  /**
   * 显示警告通知
   */
  function warning(message: string, title?: string): string {
    return show({
      type: 'warning',
      title,
      message
    })
  }

  /**
   * 显示信息通知
   */
  function info(message: string, title?: string): string {
    return show({
      type: 'info',
      title,
      message
    })
  }

  return {
    notifications,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll
  }
}

/**
 * 创建全局通知实例
 * 
 * 用于在非组件上下文中使用通知
 * 
 * @example
 * ```ts
 * // 在 store 或 service 中使用
 * import { getGlobalNotification } from '@/composables/useNotification'
 * 
 * async function saveData() {
 *   try {
 *     await api.save(data)
 *     getGlobalNotification()?.success('保存成功！')
 *   } catch (e) {
 *     getGlobalNotification()?.error('保存失败，请重试')
 *   }
 * }
 * ```
 */
let globalNotificationInstance: UseNotificationReturn | null = null

export function createGlobalNotification(
  options?: UseNotificationOptions
): UseNotificationReturn {
  if (!globalNotificationInstance) {
    globalNotificationInstance = useNotification(options)
  }
  return globalNotificationInstance
}

export function getGlobalNotification(): UseNotificationReturn | null {
  return globalNotificationInstance
}
