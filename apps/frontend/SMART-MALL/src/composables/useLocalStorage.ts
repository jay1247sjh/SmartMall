/**
 * useLocalStorage Composable
 * 
 * 通用 localStorage 状态持久化 composable，提供响应式状态同步功能
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
 */

import { ref, watch, type Ref } from 'vue'

/**
 * 序列化器接口
 */
export interface Serializer<T> {
  /** 读取（反序列化） */
  read: (raw: string) => T
  /** 写入（序列化） */
  write: (value: T) => string
}

/**
 * useLocalStorage 配置选项
 */
export interface UseLocalStorageOptions<T> {
  /** 自定义序列化器 */
  serializer?: Serializer<T>
  /** 错误回调 */
  onError?: (error: Error) => void
}

/**
 * useLocalStorage 返回类型
 */
export interface UseLocalStorageReturn<T> {
  /** 响应式值 */
  value: Ref<T>
  /** 设置值 */
  set: (value: T) => void
  /** 移除值 */
  remove: () => void
  /** 从 localStorage 刷新值 */
  refresh: () => void
}

/**
 * 默认 JSON 序列化器
 */
function createDefaultSerializer<T>(): Serializer<T> {
  return {
    read: (raw: string) => JSON.parse(raw) as T,
    write: (value: T) => JSON.stringify(value)
  }
}

/**
 * localStorage 状态持久化 Composable
 * 
 * @param key - localStorage 键名
 * @param defaultValue - 默认值
 * @param options - 配置选项
 * @returns localStorage 状态和方法
 * 
 * @example
 * ```ts
 * // 基本用法
 * const { value, set, remove } = useLocalStorage('user-settings', {
 *   theme: 'light',
 *   language: 'zh-CN'
 * })
 * 
 * // 修改值（自动同步到 localStorage）
 * value.value.theme = 'dark'
 * 
 * // 或使用 set 方法
 * set({ theme: 'dark', language: 'en-US' })
 * 
 * // 移除
 * remove()
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const {
    serializer = createDefaultSerializer<T>(),
    onError
  } = options || {}

  /**
   * 从 localStorage 读取值
   */
  function readFromStorage(): T {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) {
        return defaultValue
      }
      return serializer.read(raw)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      if (onError) {
        onError(error)
      }
      return defaultValue
    }
  }

  /**
   * 写入 localStorage
   */
  function writeToStorage(value: T): void {
    try {
      const serialized = serializer.write(value)
      localStorage.setItem(key, serialized)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      if (onError) {
        onError(error)
      }
    }
  }

  // 初始化值
  const value = ref<T>(readFromStorage()) as Ref<T>

  /**
   * 设置值
   */
  function set(newValue: T): void {
    value.value = newValue
    writeToStorage(newValue)
  }

  /**
   * 移除值
   */
  function remove(): void {
    try {
      localStorage.removeItem(key)
      value.value = defaultValue
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      if (onError) {
        onError(error)
      }
    }
  }

  /**
   * 从 localStorage 刷新值
   */
  function refresh(): void {
    value.value = readFromStorage()
  }

  // 监听值变化，自动同步到 localStorage
  watch(
    value,
    (newValue) => {
      writeToStorage(newValue)
    },
    { deep: true }
  )

  // 监听 storage 事件（跨标签页同步）
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === key) {
        refresh()
      }
    })
  }

  return {
    value,
    set,
    remove,
    refresh
  }
}
