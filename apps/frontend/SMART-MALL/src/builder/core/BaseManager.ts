/**
 * BaseManager - 管理器基类
 * 
 * 提供所有管理器的通用功能：
 * - 回调管理
 * - 事件通知
 * - 错误处理
 */

/**
 * 回调函数类型
 */
export type Callback<T = void> = (data: T) => void

/**
 * BaseManager 抽象基类
 * 
 * @template T - 回调函数的参数类型
 */
export abstract class BaseManager<T = void> {
  /** 回调函数列表 */
  protected callbacks: Set<Callback<T>> = new Set()

  /** 管理器名称（用于日志） */
  protected abstract readonly managerName: string

  /**
   * 注册回调函数
   * 
   * @param callback - 回调函数
   * @returns 取消注册的函数
   */
  public onChange(callback: Callback<T>): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * 通知所有回调函数
   * 
   * @param data - 传递给回调的数据
   */
  protected notify(data: T): void {
    this.callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[${this.managerName}] Error in callback:`, error)
      }
    })
  }

  /**
   * 清除所有回调函数
   */
  public clearCallbacks(): void {
    this.callbacks.clear()
  }

  /**
   * 获取回调函数数量
   * 
   * @returns 回调函数数量
   */
  public getCallbackCount(): number {
    return this.callbacks.size
  }
}
