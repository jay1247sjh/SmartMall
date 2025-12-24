/**
 * 领域事件处理器
 *
 * 职责：
 * - 监听渲染层的场景事件（SceneEventEmitter）
 * - 将底层 3D 事件翻译为业务领域事件
 * - 通过 DomainEventBus 发布领域事件
 *
 * 事件翻译映射：
 * - scene.click + STORE  → store.selected
 * - scene.hover + STORE  → store.focused
 * - scene.hoverEnd       → store.unfocused
 * - scene.click + AREA   → area.selected
 * - scene.click + FLOOR  → floor.selected
 * - scene.click + null   → scene.backgroundClick
 *
 * 设计原则：
 * - 解耦渲染层和业务层
 * - UI 层不需要知道 Three.js 的存在
 * - 只关心业务语义（哪个店铺被点击了）
 *
 * @example
 * ```typescript
 * const handler = new DomainEventHandler(
 *   sceneEventEmitter,
 *   meshRegistry,
 *   semanticRegistry,
 *   domainEventBus
 * )
 *
 * // 开始监听
 * handler.startListening()
 *
 * // UI 层订阅领域事件
 * domainEventBus.on('store.selected', (data) => {
 *   showStorePanel(data.storeId)
 * })
 *
 * // 停止监听
 * handler.stopListening()
 * ```
 */

import type * as THREE from 'three'
import type { SceneEventEmitter, SceneEventData } from '@/engine/interaction/SceneEventEmitter'
import type { MeshRegistry } from '../registry/MeshRegistry'
import type { SemanticObjectRegistry } from '../registry/SemanticObjectRegistry'
import type { DomainEventBus } from './DomainEventBus'
import { SemanticType } from '../scene'

// =============================================================================
// DomainEventHandler 类
// =============================================================================

export class DomainEventHandler {
  // ===========================================================================
  // 私有属性
  // ===========================================================================

  /** 场景事件发射器（渲染层） */
  private sceneEventEmitter: SceneEventEmitter

  /** Mesh 注册表 */
  private meshRegistry: MeshRegistry

  /** 语义对象注册表 */
  private semanticRegistry: SemanticObjectRegistry

  /** 领域事件总线 */
  private eventBus: DomainEventBus

  /** 取消订阅函数列表 */
  private unsubscribers: Array<() => void> = []

  /** 是否正在监听 */
  private _isListening: boolean = false

  // ===========================================================================
  // 构造函数
  // ===========================================================================

  /**
   * 创建领域事件处理器
   *
   * @param sceneEventEmitter - 场景事件发射器
   * @param meshRegistry - Mesh 注册表
   * @param semanticRegistry - 语义对象注册表
   * @param eventBus - 领域事件总线
   */
  constructor(
    sceneEventEmitter: SceneEventEmitter,
    meshRegistry: MeshRegistry,
    semanticRegistry: SemanticObjectRegistry,
    eventBus: DomainEventBus
  ) {
    this.sceneEventEmitter = sceneEventEmitter
    this.meshRegistry = meshRegistry
    this.semanticRegistry = semanticRegistry
    this.eventBus = eventBus
  }

  // ===========================================================================
  // 公共方法
  // ===========================================================================

  /**
   * 开始监听场景事件
   */
  public startListening(): void {
    if (this._isListening) {
      console.warn('[DomainEventHandler] 已经在监听中')
      return
    }

    // 订阅点击事件
    const unsubClick = this.sceneEventEmitter.on('click', this.handleClick)
    this.unsubscribers.push(unsubClick)

    // 订阅悬停事件
    const unsubHover = this.sceneEventEmitter.on('hover', this.handleHover)
    this.unsubscribers.push(unsubHover)

    // 订阅离开悬停事件
    const unsubHoverEnd = this.sceneEventEmitter.on('hoverEnd', this.handleHoverEnd)
    this.unsubscribers.push(unsubHoverEnd)

    this._isListening = true
  }

  /**
   * 停止监听场景事件
   */
  public stopListening(): void {
    if (!this._isListening) return

    // 取消所有订阅
    this.unsubscribers.forEach((unsub) => unsub())
    this.unsubscribers = []

    this._isListening = false
  }

  /**
   * 是否正在监听
   */
  public get isListening(): boolean {
    return this._isListening
  }

  /**
   * 销毁处理器
   */
  public dispose(): void {
    this.stopListening()
  }

  // ===========================================================================
  // 私有方法 - 事件处理
  // ===========================================================================

  /**
   * 处理点击事件
   */
  private handleClick = (data: SceneEventData): void => {
    const { object, point } = data

    // 点击空白处
    if (!object) {
      this.eventBus.emit('scene.backgroundClick', {
        point: point ? { x: point.x, y: point.y, z: point.z } : undefined,
      })
      return
    }

    // 查找语义对象
    const semanticInfo = this.findSemanticObject(object)
    if (!semanticInfo) {
      // 点击了非语义对象（如地面、装饰物）
      this.eventBus.emit('scene.backgroundClick', {
        point: point ? { x: point.x, y: point.y, z: point.z } : undefined,
      })
      return
    }

    const { semanticObject, semanticId } = semanticInfo
    const pointData = point ? { x: point.x, y: point.y, z: point.z } : undefined

    // 根据语义类型发出不同的领域事件
    switch (semanticObject.semanticType) {
      case SemanticType.STORE:
        this.eventBus.emit('store.selected', {
          storeId: semanticObject.businessId,
          storeName: semanticObject.metadata?.name as string | undefined,
          semanticId,
          point: pointData,
        })
        break

      case SemanticType.AREA:
        this.eventBus.emit('area.selected', {
          areaId: semanticObject.businessId,
          areaName: semanticObject.metadata?.name as string | undefined,
          semanticId,
        })
        break

      case SemanticType.FLOOR:
        this.eventBus.emit('floor.selected', {
          floorId: semanticObject.businessId,
          floorName: semanticObject.metadata?.name as string | undefined,
          level: semanticObject.metadata?.level as number | undefined,
          semanticId,
        })
        break

      default:
        // 其他类型暂不处理
        break
    }
  }

  /**
   * 处理悬停事件
   */
  private handleHover = (data: SceneEventData): void => {
    const { object } = data

    if (!object) return

    // 查找语义对象
    const semanticInfo = this.findSemanticObject(object)
    if (!semanticInfo) return

    const { semanticObject, semanticId } = semanticInfo

    // 只处理店铺的悬停
    if (semanticObject.semanticType === SemanticType.STORE) {
      this.eventBus.emit('store.focused', {
        storeId: semanticObject.businessId,
        storeName: semanticObject.metadata?.name as string | undefined,
        semanticId,
      })
    }
  }

  /**
   * 处理离开悬停事件
   */
  private handleHoverEnd = (data: SceneEventData): void => {
    const { object } = data

    if (!object) return

    // 查找语义对象
    const semanticInfo = this.findSemanticObject(object)
    if (!semanticInfo) return

    const { semanticObject, semanticId } = semanticInfo

    // 只处理店铺的离开悬停
    if (semanticObject.semanticType === SemanticType.STORE) {
      this.eventBus.emit('store.unfocused', {
        storeId: semanticObject.businessId,
        semanticId,
      })
    }
  }

  // ===========================================================================
  // 私有方法 - 辅助函数
  // ===========================================================================

  /**
   * 从 Mesh 查找对应的语义对象
   * 支持向上遍历父节点查找（处理嵌套的 Group 情况）
   *
   * @param object - Three.js 对象
   * @returns 语义对象信息，未找到返回 null
   */
  private findSemanticObject(
    object: THREE.Object3D
  ): { semanticObject: NonNullable<ReturnType<SemanticObjectRegistry['getById']>>; semanticId: string } | null {
    let current: THREE.Object3D | null = object

    // 向上遍历查找语义对象
    while (current) {
      const semanticId = this.meshRegistry.getSemanticId(current)
      if (semanticId) {
        const semanticObject = this.semanticRegistry.getById(semanticId)
        if (semanticObject) {
          return { semanticObject, semanticId }
        }
      }
      current = current.parent
    }

    return null
  }
}
