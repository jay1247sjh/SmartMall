/**
 * 领域事件总线
 *
 * 职责：
 * - 提供领域事件的发布-订阅机制
 * - 解耦事件生产者和消费者
 * - 支持类型安全的事件订阅
 *
 * 设计原则：
 * - 单例模式，全局唯一事件总线
 * - 类型安全，事件类型和数据类型关联
 * - 支持取消订阅，防止内存泄漏
 *
 * @example
 * ```typescript
 * // 订阅事件
 * const unsubscribe = domainEventBus.on('store.selected', (data) => {
 *   console.log('店铺被选中:', data.storeId)
 * })
 *
 * // 发布事件
 * domainEventBus.emit('store.selected', {
 *   storeId: 'store-001',
 *   storeName: '星巴克',
 *   semanticId: 'store_1_xxx'
 * })
 *
 * // 取消订阅
 * unsubscribe()
 * ```
 */

// =============================================================================
// 领域事件类型定义
// =============================================================================

/** 店铺选中事件数据 */
export interface StoreSelectedEventData {
  /** 店铺业务 ID */
  storeId: string
  /** 店铺名称 */
  storeName?: string
  /** 语义对象 ID */
  semanticId: string
  /** 点击位置（世界坐标） */
  point?: { x: number; y: number; z: number }
}

/** 店铺聚焦事件数据（悬停） */
export interface StoreFocusedEventData {
  /** 店铺业务 ID */
  storeId: string
  /** 店铺名称 */
  storeName?: string
  /** 语义对象 ID */
  semanticId: string
}

/** 店铺失焦事件数据（离开悬停） */
export interface StoreUnfocusedEventData {
  /** 店铺业务 ID */
  storeId: string
  /** 语义对象 ID */
  semanticId: string
}

/** 区域选中事件数据 */
export interface AreaSelectedEventData {
  /** 区域业务 ID */
  areaId: string
  /** 区域名称 */
  areaName?: string
  /** 语义对象 ID */
  semanticId: string
}

/** 楼层选中事件数据 */
export interface FloorSelectedEventData {
  /** 楼层业务 ID */
  floorId: string
  /** 楼层名称 */
  floorName?: string
  /** 楼层编号 */
  level?: number
  /** 语义对象 ID */
  semanticId: string
}

/** 场景背景点击事件数据 */
export interface SceneBackgroundClickEventData {
  /** 点击位置（世界坐标） */
  point?: { x: number; y: number; z: number }
}

/** 领域事件类型映射 */
export interface DomainEventMap {
  /** 店铺被选中（点击） */
  'store.selected': StoreSelectedEventData
  /** 店铺被聚焦（悬停） */
  'store.focused': StoreFocusedEventData
  /** 店铺失焦（离开悬停） */
  'store.unfocused': StoreUnfocusedEventData
  /** 区域被选中 */
  'area.selected': AreaSelectedEventData
  /** 楼层被选中 */
  'floor.selected': FloorSelectedEventData
  /** 场景背景被点击（点击空白处） */
  'scene.backgroundClick': SceneBackgroundClickEventData
}

/** 领域事件类型 */
export type DomainEventType = keyof DomainEventMap

/** 事件回调函数类型 */
export type DomainEventCallback<T extends DomainEventType> = (
  data: DomainEventMap[T]
) => void

// =============================================================================
// DomainEventBus 类
// =============================================================================

export class DomainEventBus {
  // ===========================================================================
  // 私有属性
  // ===========================================================================

  /** 事件订阅者存储 */
  private listeners: Map<DomainEventType, Set<DomainEventCallback<DomainEventType>>>

  /** 单例实例 */
  private static instance: DomainEventBus | null = null

  // ===========================================================================
  // 构造函数
  // ===========================================================================

  constructor() {
    this.listeners = new Map()
  }

  // ===========================================================================
  // 单例访问
  // ===========================================================================

  /**
   * 获取单例实例
   */
  public static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus()
    }
    return DomainEventBus.instance
  }

  /**
   * 重置单例（仅用于测试）
   */
  public static resetInstance(): void {
    if (DomainEventBus.instance) {
      DomainEventBus.instance.clear()
      DomainEventBus.instance = null
    }
  }

  // ===========================================================================
  // 订阅方法
  // ===========================================================================

  /**
   * 订阅领域事件
   *
   * @param eventType - 事件类型
   * @param callback - 事件回调函数
   * @returns 取消订阅的函数
   */
  public on<T extends DomainEventType>(
    eventType: T,
    callback: DomainEventCallback<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    const callbacks = this.listeners.get(eventType)!
    callbacks.add(callback as DomainEventCallback<DomainEventType>)

    // 返回取消订阅函数
    return () => this.off(eventType, callback)
  }

  /**
   * 订阅一次性事件（触发后自动取消订阅）
   *
   * @param eventType - 事件类型
   * @param callback - 事件回调函数
   * @returns 取消订阅的函数
   */
  public once<T extends DomainEventType>(
    eventType: T,
    callback: DomainEventCallback<T>
  ): () => void {
    // 包装回调函数，在触发后自动取消订阅
    const wrappedCallback: DomainEventCallback<T> = (data) => {
      this.off(eventType, wrappedCallback)
      callback(data)
    }

    return this.on(eventType, wrappedCallback)
  }

  /**
   * 取消订阅领域事件
   *
   * @param eventType - 事件类型
   * @param callback - 要移除的回调函数
   */
  public off<T extends DomainEventType>(
    eventType: T,
    callback: DomainEventCallback<T>
  ): void {
    const callbacks = this.listeners.get(eventType)
    if (!callbacks) return

    callbacks.delete(callback as DomainEventCallback<DomainEventType>)

    // 如果没有订阅者了，清理 Map 条目
    if (callbacks.size === 0) {
      this.listeners.delete(eventType)
    }
  }

  // ===========================================================================
  // 发布方法
  // ===========================================================================

  /**
   * 发布领域事件
   *
   * @param eventType - 事件类型
   * @param data - 事件数据
   */
  public emit<T extends DomainEventType>(
    eventType: T,
    data: DomainEventMap[T]
  ): void {
    const callbacks = this.listeners.get(eventType)
    if (!callbacks) return

    // 遍历所有订阅者，调用回调函数
    callbacks.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[DomainEventBus] 事件处理器错误 (${eventType}):`, error)
      }
    })
  }

  // ===========================================================================
  // 工具方法
  // ===========================================================================

  /**
   * 检查是否有订阅者
   *
   * @param eventType - 事件类型
   * @returns 是否有订阅者
   */
  public hasListeners(eventType: DomainEventType): boolean {
    const callbacks = this.listeners.get(eventType)
    return callbacks !== undefined && callbacks.size > 0
  }

  /**
   * 获取订阅者数量
   *
   * @param eventType - 事件类型
   * @returns 订阅者数量
   */
  public listenerCount(eventType: DomainEventType): number {
    const callbacks = this.listeners.get(eventType)
    return callbacks?.size ?? 0
  }

  /**
   * 清空所有订阅
   */
  public clear(): void {
    this.listeners.clear()
  }

  /**
   * 清空指定事件的所有订阅
   *
   * @param eventType - 事件类型
   */
  public clearEvent(eventType: DomainEventType): void {
    this.listeners.delete(eventType)
  }
}

// =============================================================================
// 导出单例实例
// =============================================================================

/** 全局领域事件总线实例 */
export const domainEventBus = DomainEventBus.getInstance()
