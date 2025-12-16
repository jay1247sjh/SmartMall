/**
 * 场景事件发射器
 *
 * 这个类的作用是将 Three.js 的底层事件（鼠标点击、移动）转换为语义化的场景事件。
 * 让上层代码不需要直接处理 Three.js 的细节，只需要关心"点击了哪个对象"这样的业务逻辑。
 *
 * 核心功能：
 * - 监听 DOM 事件（click、mousemove）
 * - 使用 RaycasterManager 检测鼠标与 3D 对象的交互
 * - 发出语义化事件（scene.click、scene.hover、scene.hoverEnd）
 * - 提供订阅/取消订阅机制（发布-订阅模式）
 *
 * 设计原则：
 * - 解耦：上层代码不需要知道 Three.js 和 RaycasterManager 的存在
 * - 语义化：事件名称更符合业务含义（click 而不是 mousedown）
 * - 易用：订阅/取消订阅接口简单直观
 *
 * 使用示例：
 * ```typescript
 * const emitter = new SceneEventEmitter(raycasterManager, container)
 *
 * // 订阅点击事件
 * const unsubscribe = emitter.on('click', (data) => {
 *   console.log('点击了对象:', data.object)
 * })
 *
 * // 取消订阅
 * unsubscribe()
 * ```
 */

import * as THREE from 'three'
import type { RaycasterManager } from '.'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 场景事件类型
 *
 * - 'click': 鼠标点击事件，当用户点击场景中的对象时触发
 * - 'hover': 鼠标悬停事件，当鼠标移动到对象上时触发（进入）
 * - 'hoverEnd': 鼠标离开事件，当鼠标从对象上移开时触发（离开）
 */
export type SceneEventType = 'click' | 'hover' | 'hoverEnd'

/**
 * 场景事件数据
 *
 * 每个事件都会携带这些信息，让订阅者知道发生了什么
 */
export interface SceneEventData {
  /**
   * 被交互的 3D 对象
   * - 如果点击/悬停到了对象，这里是该对象的引用
   * - 如果点击/悬停到了空白处，这里是 null
   */
  object: THREE.Object3D | null

  /**
   * 交互点的 3D 世界坐标
   * - 如果点击/悬停到了对象，这里是交点的 3D 坐标
   * - 如果点击/悬停到了空白处，这里是 null
   */
  point: THREE.Vector3 | null

  /**
   * 原始的 DOM 鼠标事件
   * - 包含鼠标位置、按键状态等原始信息
   * - 如果需要访问底层细节（如 Ctrl 键是否按下），可以使用这个
   */
  event: MouseEvent
}

/**
 * 场景事件回调函数类型
 *
 * 订阅事件时传入的函数必须符合这个签名
 */
export type SceneEventCallback = (data: SceneEventData) => void

// ============================================================================
// SceneEventEmitter 类
// ============================================================================

export class SceneEventEmitter {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /**
   * 射线检测管理器
   * 用于检测鼠标与 3D 对象的交互（点击了哪个对象）
   */
  private raycasterManager: RaycasterManager

  /**
   * DOM 容器元素
   * 用于监听鼠标事件（click、mousemove）
   */
  private container: HTMLElement

  /**
   * 事件订阅者存储
   *
   * 数据结构：Map<事件类型, Set<回调函数>>
   * - 外层 Map：按事件类型分组（click、hover、hoverEnd）
   * - 内层 Set：存储该事件的所有订阅者（回调函数）
   *
   * 为什么用 Set？
   * - 自动去重：同一个回调函数不会被重复添加
   * - 快速删除：取消订阅时可以快速找到并删除
   *
   * 示例：
   * {
   *   'click' => Set { callback1, callback2 },
   *   'hover' => Set { callback3 }
   * }
   */
  private listeners: Map<SceneEventType, Set<SceneEventCallback>>

  /**
   * 当前鼠标悬停的对象
   *
   * 用于检测悬停状态的变化：
   * - 如果鼠标从对象 A 移动到对象 B，需要触发 A 的 hoverEnd 和 B 的 hover
   * - 如果鼠标从对象移动到空白处，需要触发 hoverEnd
   * - 如果鼠标在同一个对象上移动，不需要重复触发 hover
   */
  private currentHoverObject: THREE.Object3D | null = null

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建场景事件发射器
   *
   * @param raycasterManager - 射线检测管理器，用于检测鼠标与对象的交互
   * @param container - DOM 容器元素，用于监听鼠标事件
   */
  constructor(raycasterManager: RaycasterManager, container: HTMLElement) {
    // 保存依赖
    this.raycasterManager = raycasterManager
    this.container = container

    // 初始化订阅者存储（空的 Map）
    this.listeners = new Map()

    this.setupEventListeners()
  }

  // ==========================================================================
  // 订阅机制（发布-订阅模式）
  // ==========================================================================

  /**
   * 订阅场景事件
   *
   * 当指定的事件发生时，会调用你提供的回调函数
   *
   * @param eventType - 要订阅的事件类型（'click' | 'hover' | 'hoverEnd'）
   * @param callback - 事件发生时要调用的回调函数
   * @returns 取消订阅的函数，调用它可以停止监听
   *
   * @example
   * ```typescript
   * // 订阅点击事件
   * const unsubscribe = emitter.on('click', (data) => {
   *   if (data.object) {
   *     console.log('点击了对象:', data.object.name)
   *   } else {
   *     console.log('点击了空白处')
   *   }
   * })
   *
   * // 稍后取消订阅
   * unsubscribe()
   * ```
   */
  public on(eventType: SceneEventType, callback: SceneEventCallback): () => void {
    // 1. 检查该事件类型是否已经有订阅者
    //    如果没有，创建一个新的 Set 来存储订阅者
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }

    // 2. 将回调函数添加到订阅者集合中
    //    使用 ! 断言，因为上面已经确保 Set 存在
    this.listeners.get(eventType)!.add(callback)

    // 3. 返回取消订阅函数（闭包）
    //    这样用户可以方便地取消订阅：const unsub = on(...); unsub()
    return () => this.off(eventType, callback)
  }

  /**
   * 取消订阅场景事件
   *
   * 停止监听指定的事件，之后该回调函数不会再被调用
   *
   * @param eventType - 要取消订阅的事件类型
   * @param callback - 要移除的回调函数（必须是之前传给 on() 的同一个函数）
   *
   * @example
   * ```typescript
   * const handleClick = (data) => { ... }
   *
   * // 订阅
   * emitter.on('click', handleClick)
   *
   * // 取消订阅
   * emitter.off('click', handleClick)
   * ```
   */
  public off(eventType: SceneEventType, callback: SceneEventCallback): void {
    // 1. 获取该事件类型的订阅者集合
    const callbacks = this.listeners.get(eventType)

    // 2. 如果集合不存在，说明没有人订阅过这个事件，直接返回
    if (!callbacks) return

    // 3. 从集合中删除指定的回调函数
    //    Set.delete() 会自动处理"函数不存在"的情况，不会报错
    callbacks.delete(callback)

    // 4. 如果删除后集合为空，清理这个 Map 条目（节省内存）
    if (callbacks.size === 0) {
      this.listeners.delete(eventType)
    }
  }

  // ==========================================================================
  // 事件触发（内部使用）
  // ==========================================================================

  /**
   * 触发场景事件（内部使用）
   *
   * 当事件发生时（如点击、悬停），调用这个方法来通知所有订阅者
   *
   * @param eventType - 要触发的事件类型
   * @param data - 事件数据，包含被交互的对象、交点坐标等信息
   *
   * @example
   * ```typescript
   * // 内部使用示例
   * this.emit('click', {
   *   object: clickedObject,
   *   point: clickPoint,
   *   event: mouseEvent
   * })
   * ```
   */
  private emit(eventType: SceneEventType, data: SceneEventData): void {
    // 1. 从订阅者存储中获取该事件类型的所有回调函数
    const callbacks = this.listeners.get(eventType)

    // 2. 如果没有订阅者，直接返回（没人关心这个事件）
    if (!callbacks) return

    // 3. 遍历所有订阅者，调用他们的回调函数
    //    每个回调函数都会收到相同的事件数据
    callbacks.forEach((callback) => {
      callback(data)
    })
  }

  // ==========================================================================
  // DOM 事件处理器
  // ==========================================================================

  /**
   * 处理鼠标点击事件
   *
   * 当用户点击鼠标时：
   * 1. 更新鼠标位置到 RaycasterManager
   * 2. 使用射线检测找到被点击的对象
   * 3. 构造事件数据（包含对象、交点、原始事件）
   * 4. 发出 'click' 事件，通知所有订阅者
   *
   * @param event - 原始的 DOM 鼠标事件
   *
   * @example
   * 内部流程：
   * 用户点击 → handleClick 被调用 → 射线检测 → emit('click') → 所有订阅者收到通知
   *
   * 使用方式：
   * ```typescript
   * // 在构造函数中绑定到 DOM 元素
   * this.container.addEventListener('click', this.handleClick)
   * ```
   */
  private handleClick = (event: MouseEvent): void => {
    // 1. 更新 RaycasterManager 的鼠标位置
    //    将屏幕坐标转换为 3D 空间坐标
    this.raycasterManager.updateMouse(event, this.container)

    // 2. 使用射线检测获取第一个交点（最近的对象）
    //    如果点击空白处，intersect 为 null
    const intersect = this.raycasterManager.getFirstIntersect()

    // 3. 构造场景事件数据
    //    使用可选链 (?.) 和空值合并 (??) 处理 null 情况
    const data: SceneEventData = {
      object: intersect?.object ?? null, // 被点击的对象（或 null）
      point: intersect?.point ?? null, // 交点坐标（或 null）
      event: event // 原始 DOM 事件
    }

    // 4. 发出 'click' 事件，通知所有订阅者
    this.emit('click', data)
  }

  /**
   * 处理鼠标移动事件
   *
   * 当鼠标移动时，检测悬停状态的变化，发出 'hover' 或 'hoverEnd' 事件
   *
   * 悬停状态变化：
   * - null → 对象：触发 hover 事件
   * - 对象 → null：触发 hoverEnd 事件
   * - 对象A → 对象B：先触发 A 的 hoverEnd，再触发 B 的 hover
   * - 对象 → 同一对象：不触发任何事件（避免重复）
   *
   * @param event - 原始的 DOM 鼠标移动事件
   *
   * @example
   * 内部流程：
   * 鼠标移动 → handleMouseMove 被调用 → 射线检测 → 比较状态 → emit 事件
   *
   * 使用方式：
   * ```typescript
   * // 在构造函数中绑定到 DOM 元素
   * this.container.addEventListener('mousemove', this.handleMouseMove)
   * ```
   *
   * 使用箭头函数保持 this 指向
   */
  private handleMouseMove = (event: MouseEvent): void => {
    // 1. 更新 RaycasterManager 的鼠标位置
    //    将屏幕坐标转换为 3D 空间坐标
    this.raycasterManager.updateMouse(event, this.container)

    // 2. 使用射线检测获取当前鼠标悬停的对象
    //    如果鼠标在空白处，intersect 为 null
    const intersect = this.raycasterManager.getFirstIntersect()

    // 3. 提取新的悬停对象（可能是 null）
    const newHoveredObject = intersect?.object ?? null

    // 4. 检测悬停状态是否变化
    //    如果鼠标还在同一个对象上，不触发任何事件（避免重复）
    if (newHoveredObject === this.currentHoverObject) {
      return
    }

    // 5. 如果之前有悬停对象，现在离开了
    //    触发 hoverEnd 事件
    if (this.currentHoverObject) {
      this.emit('hoverEnd', {
        object: this.currentHoverObject, // 之前的悬停对象
        point: null, // 已经离开，没有交点
        event: event // 原始 DOM 事件
      })
    }

    // 6. 如果现在有新的悬停对象
    //    触发 hover 事件
    if (newHoveredObject) {
      this.emit('hover', {
        object: newHoveredObject, // 新的悬停对象
        point: intersect!.point, // 交点坐标（使用 ! 断言，因为 newHoveredObject 不为 null）
        event: event // 原始 DOM 事件
      })
    }

    // 7. 更新当前悬停对象
    //    保存新的悬停对象，供下次比较使用
    this.currentHoverObject = newHoveredObject
  }

  /**
   * 设置 DOM 事件监听器
   *
   * 将内部的事件处理器绑定到容器元素上，这样当用户交互时，
   * 浏览器会自动调用对应的处理器
   *
   * 绑定的事件：
   * - 'click': 鼠标点击事件 → handleClick
   * - 'mousemove': 鼠标移动事件 → handleMouseMove
   *
   * @example
   * 事件流程：
   * 用户点击 → 浏览器触发 'click' → handleClick 被调用 → emit('click')
   */
  private setupEventListeners(): void {
    // 监听点击事件
    this.container.addEventListener('click', this.handleClick)

    // 监听鼠标移动事件（用于悬停检测）
    this.container.addEventListener('mousemove', this.handleMouseMove)
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 销毁事件发射器，释放所有资源
   *
   * 清理内容：
   * 1. 移除 DOM 事件监听器（防止内存泄漏）
   * 2. 清空订阅者列表（释放回调函数引用）
   * 3. 重置内部状态（清空悬停对象）
   *
   * 重要：组件卸载时必须调用，否则会内存泄漏
   *
   * @example
   * ```typescript
   * // 在 Vue 组件中
   * onUnmounted(() => {
   *   eventEmitter.dispose()
   * })
   *
   * // 在 ThreeEngine 中
   * public dispose(): void {
   *   this.eventEmitter.dispose()
   *   // ... 其他清理
   * }
   * ```
   */
  public dispose(): void {
    // 1. 移除 DOM 事件监听器
    //    必须与 addEventListener 的参数完全相同
    this.container.removeEventListener('click', this.handleClick)
    this.container.removeEventListener('mousemove', this.handleMouseMove)

    // 2. 清空订阅者列表
    //    删除所有事件订阅，释放回调函数的引用
    this.listeners.clear()

    // 3. 重置当前悬停对象
    //    释放对 3D 对象的引用，帮助垃圾回收
    this.currentHoverObject = null
  }
}
