/**
 * useKeyboard Composable
 * 
 * 通用键盘快捷键管理 composable，提供快捷键注册、修饰键支持和自动清理功能
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */

import { ref, onUnmounted, isRef, type Ref } from 'vue'

/**
 * 键盘快捷键定义
 */
export interface KeyboardShortcut {
  /** 按键（如 's', 'Enter', 'Escape'） */
  key: string
  /** Ctrl 修饰键 */
  ctrl?: boolean
  /** Shift 修饰键 */
  shift?: boolean
  /** Alt 修饰键 */
  alt?: boolean
  /** Meta 修饰键（Mac 的 Command 键） */
  meta?: boolean
  /** 处理函数 */
  handler: (event: KeyboardEvent) => void
  /** 是否启用 */
  enabled?: boolean
  /** 是否阻止默认行为 */
  preventDefault?: boolean
}

/**
 * useKeyboard 配置选项
 */
export interface UseKeyboardOptions {
  /** 事件目标（默认为 window） */
  target?: Ref<HTMLElement | null> | HTMLElement | Window
  /** 是否启用（可以是响应式引用） */
  enabled?: Ref<boolean> | boolean
}

/**
 * useKeyboard 返回类型
 */
export interface UseKeyboardReturn {
  /** 注册快捷键，返回取消注册函数 */
  register: (shortcut: KeyboardShortcut) => () => void
  /** 取消注册快捷键 */
  unregister: (key: string) => void
  /** 启用指定快捷键 */
  enable: (key: string) => void
  /** 禁用指定快捷键 */
  disable: (key: string) => void
  /** 启用所有快捷键 */
  enableAll: () => void
  /** 禁用所有快捷键 */
  disableAll: () => void
  /** 已注册的快捷键 */
  shortcuts: Ref<Map<string, KeyboardShortcut>>
}

/**
 * 生成快捷键唯一标识
 */
function generateShortcutId(shortcut: KeyboardShortcut): string {
  const modifiers: string[] = []
  if (shortcut.ctrl) modifiers.push('Ctrl')
  if (shortcut.shift) modifiers.push('Shift')
  if (shortcut.alt) modifiers.push('Alt')
  if (shortcut.meta) modifiers.push('Meta')
  modifiers.push(shortcut.key.toLowerCase())
  return modifiers.join('+')
}

/**
 * 检查事件是否匹配快捷键
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  // 检查按键
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false
  }

  // 检查修饰键
  if (!!shortcut.ctrl !== event.ctrlKey) return false
  if (!!shortcut.shift !== event.shiftKey) return false
  if (!!shortcut.alt !== event.altKey) return false
  if (!!shortcut.meta !== event.metaKey) return false

  return true
}

/**
 * 键盘快捷键管理 Composable
 * 
 * @param options - 配置选项
 * @returns 键盘快捷键状态和方法
 * 
 * @example
 * ```ts
 * const { register, unregister, shortcuts } = useKeyboard()
 * 
 * // 注册 Ctrl+S 保存快捷键
 * const unregisterSave = register({
 *   key: 's',
 *   ctrl: true,
 *   handler: () => saveDocument(),
 *   preventDefault: true
 * })
 * 
 * // 注册 Ctrl+Z 撤销快捷键
 * register({
 *   key: 'z',
 *   ctrl: true,
 *   handler: () => undo()
 * })
 * 
 * // 取消注册
 * unregisterSave()
 * // 或
 * unregister('Ctrl+s')
 * ```
 */
export function useKeyboard(options?: UseKeyboardOptions): UseKeyboardReturn {
  const {
    target = typeof window !== 'undefined' ? window : null,
    enabled = true
  } = options || {}

  // 已注册的快捷键
  const shortcuts = ref(new Map<string, KeyboardShortcut>())

  // 全局启用状态
  let globalEnabled = true

  /**
   * 获取事件目标
   */
  function getTarget(): HTMLElement | Window | null {
    if (!target) return null
    if (isRef(target)) return target.value
    return target
  }

  /**
   * 检查是否启用
   */
  function isEnabled(): boolean {
    if (!globalEnabled) return false
    if (isRef(enabled)) return enabled.value
    return enabled
  }

  /**
   * 键盘事件处理器
   */
  function handleKeyDown(event: KeyboardEvent): void {
    if (!isEnabled()) return

    for (const [, shortcut] of shortcuts.value) {
      // 检查快捷键是否启用
      if (shortcut.enabled === false) continue

      // 检查是否匹配
      if (matchesShortcut(event, shortcut)) {
        // 阻止默认行为
        if (shortcut.preventDefault) {
          event.preventDefault()
        }

        // 执行处理函数
        shortcut.handler(event)
        break
      }
    }
  }

  /**
   * 注册快捷键
   */
  function register(shortcut: KeyboardShortcut): () => void {
    const id = generateShortcutId(shortcut)
    
    // 设置默认值
    const normalizedShortcut: KeyboardShortcut = {
      ...shortcut,
      enabled: shortcut.enabled !== false,
      preventDefault: shortcut.preventDefault ?? false
    }

    shortcuts.value.set(id, normalizedShortcut)

    // 返回取消注册函数
    return () => unregister(id)
  }

  /**
   * 取消注册快捷键
   */
  function unregister(key: string): void {
    // 支持直接传入 ID 或按键名
    if (shortcuts.value.has(key)) {
      shortcuts.value.delete(key)
    } else {
      // 尝试查找匹配的快捷键
      for (const [id, shortcut] of shortcuts.value) {
        if (shortcut.key.toLowerCase() === key.toLowerCase()) {
          shortcuts.value.delete(id)
          break
        }
      }
    }
  }

  /**
   * 启用指定快捷键
   */
  function enable(key: string): void {
    const shortcut = shortcuts.value.get(key)
    if (shortcut) {
      shortcut.enabled = true
    }
  }

  /**
   * 禁用指定快捷键
   */
  function disable(key: string): void {
    const shortcut = shortcuts.value.get(key)
    if (shortcut) {
      shortcut.enabled = false
    }
  }

  /**
   * 启用所有快捷键
   */
  function enableAll(): void {
    globalEnabled = true
    for (const shortcut of shortcuts.value.values()) {
      shortcut.enabled = true
    }
  }

  /**
   * 禁用所有快捷键
   */
  function disableAll(): void {
    globalEnabled = false
  }

  /**
   * 清理函数
   */
  function cleanup(): void {
    const eventTarget = getTarget()
    if (eventTarget) {
      eventTarget.removeEventListener('keydown', handleKeyDown as EventListener)
    }
    shortcuts.value.clear()
  }

  // 添加事件监听器
  const eventTarget = getTarget()
  if (eventTarget) {
    eventTarget.addEventListener('keydown', handleKeyDown as EventListener)
  }

  // 组件卸载时自动清理
  onUnmounted(cleanup)

  return {
    register,
    unregister,
    enable,
    disable,
    enableAll,
    disableAll,
    shortcuts
  }
}
