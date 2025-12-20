/**
 * 楼层管理器
 *
 * 职责：
 * - 管理楼层语义对象的生命周期（添加/移除/查询）
 * - 管理楼层的可见性状态（显示/隐藏）
 * - 管理当前楼层状态
 *
 * 设计原则：
 * - 不直接操作 Three.js，通过 MeshRegistry 间接访问
 * - 楼层数据存储在 SemanticObjectRegistry 中
 * - 只负责楼层相关的业务逻辑
 *
 * 使用场景：
 * - 加载商城数据时，批量添加楼层
 * - 用户切换楼层时，控制楼层可见性
 * - 导航到某店铺时，自动切换到对应楼层
 *
 * @example
 * ```typescript
 * const floorManager = new FloorManager(semanticRegistry, meshRegistry, factory)
 *
 * // 添加楼层
 * const floorObj = floorManager.addFloor(floorData, mallSemanticId)
 *
 * // 切换楼层
 * floorManager.setCurrentFloor(floorObj.id)
 *
 * // 按楼层编号查询
 * const floor1F = floorManager.getFloorByLevel(1)
 * ```
 */

import { SemanticObjectRegistry, MeshRegistry } from '../registry'
import { SemanticObjectFactory } from '../factory'
import { SemanticType, type SemanticObject } from '../scene'
import type { Floor } from './mall.types'

export class FloorManager {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** 语义对象注册表，用于存储和查询楼层语义对象 */
  private semanticRegistry: SemanticObjectRegistry

  /** Mesh 注册表，用于关联楼层语义对象与 3D 模型 */
  private meshRegistry: MeshRegistry

  /** 语义对象工厂，用于从业务数据创建语义对象 */
  private factory: SemanticObjectFactory

  /** 当前楼层语义对象 ID */
  private currentFloorId: string | null = null

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建楼层管理器实例
   *
   * @param semanticRegistry - 语义对象注册表
   * @param meshRegistry - Mesh 注册表
   * @param factory - 语义对象工厂
   */
  constructor(
    semanticRegistry: SemanticObjectRegistry,
    meshRegistry: MeshRegistry,
    factory: SemanticObjectFactory
  ) {
    this.semanticRegistry = semanticRegistry
    this.meshRegistry = meshRegistry
    this.factory = factory
  }


  // ==========================================================================
  // 楼层注册方法
  // ==========================================================================

  /**
   * 添加楼层
   * 从业务数据创建语义对象并注册到 SemanticObjectRegistry
   *
   * @param floor - 楼层业务数据
   * @param parentId - 父对象 ID（通常是所属 Mall 的语义对象 ID）
   * @returns 创建的语义对象
   */
  public addFloor(floor: Floor, parentId?: string): SemanticObject {
    return this.factory.createFromFloor(floor, parentId)
  }

  /**
   * 移除楼层
   * 从注册表中注销楼层，并清理相关状态和 Mesh 绑定
   *
   * @param semanticId - 楼层语义对象 ID
   * @returns 是否成功移除
   */
  public removeFloor(semanticId: string): boolean {
    // 1. 如果是当前楼层，清除状态
    if (this.currentFloorId === semanticId) {
      this.currentFloorId = null
    }

    // 2. 解除 Mesh 绑定
    this.meshRegistry.unbind(semanticId)

    // 3. 从语义注册表注销
    return this.semanticRegistry.unregister(semanticId)
  }

  // ==========================================================================
  // 查询方法
  // ==========================================================================

  /**
   * 按语义对象 ID 查询楼层
   *
   * @param semanticId - 楼层语义对象 ID
   * @returns 找到的语义对象，未找到返回 undefined
   */
  public getFloorById(semanticId: string): SemanticObject | undefined {
    const obj = this.semanticRegistry.getById(semanticId)
    return obj?.semanticType === SemanticType.FLOOR ? obj : undefined
  }

  /**
   * 按业务 ID 查询楼层
   *
   * @param businessId - 楼层业务 ID（Floor.id）
   * @returns 找到的语义对象，未找到返回 undefined
   */
  public getFloorByBusinessId(businessId: string): SemanticObject | undefined {
    return this.semanticRegistry.getByBusinessId(businessId, SemanticType.FLOOR)
  }

  /**
   * 按楼层编号查询楼层
   * 例如：level=1 表示 1F，level=-1 表示 B1
   *
   * @param level - 楼层编号
   * @returns 找到的语义对象，未找到返回 undefined
   */
  public getFloorByLevel(level: number): SemanticObject | undefined {
    return this.getAllFloors().find((floor) => floor.metadata?.level === level)
  }

  /**
   * 获取所有楼层
   *
   * @returns 所有楼层语义对象数组
   */
  public getAllFloors(): SemanticObject[] {
    return this.semanticRegistry.getByType(SemanticType.FLOOR)
  }

  /**
   * 获取楼层数量
   */
  public get floorCount(): number {
    return this.getAllFloors().length
  }


  // ==========================================================================
  // 可见性控制方法
  // ==========================================================================

  /**
   * 显示楼层
   * 设置楼层及其关联 Mesh 为可见状态
   *
   * @param semanticId - 楼层语义对象 ID
   */
  public showFloor(semanticId: string): void {
    this.setFloorVisibility(semanticId, true)
  }

  /**
   * 隐藏楼层
   * 设置楼层及其关联 Mesh 为隐藏状态
   *
   * @param semanticId - 楼层语义对象 ID
   */
  public hideFloor(semanticId: string): void {
    this.setFloorVisibility(semanticId, false)
  }

  /**
   * 设置楼层可见性
   *
   * @param semanticId - 楼层语义对象 ID
   * @param visible - 是否可见
   */
  public setFloorVisibility(semanticId: string, visible: boolean): void {
    const floor = this.getFloorById(semanticId)
    if (!floor) {
      console.warn(`[FloorManager] 无法设置可见性：楼层不存在 (${semanticId})`)
      return
    }

    // 更新语义对象的 visible 属性
    floor.visible = visible

    // 更新关联 Mesh 的可见性
    const mesh = this.meshRegistry.getMesh(semanticId)
    if (mesh) {
      mesh.visible = visible
    }
  }

  /**
   * 检查楼层是否可见
   *
   * @param semanticId - 楼层语义对象 ID
   * @returns 是否可见
   */
  public isFloorVisible(semanticId: string): boolean {
    const floor = this.getFloorById(semanticId)
    return floor?.visible ?? false
  }

  // ==========================================================================
  // 当前楼层状态管理
  // ==========================================================================

  /**
   * 设置当前楼层
   * 会自动隐藏其他楼层，显示目标楼层
   *
   * @param semanticId - 要设置为当前的楼层语义对象 ID
   *
   * @example
   * ```typescript
   * // 切换到 1F
   * const floor1F = floorManager.getFloorByLevel(1)
   * if (floor1F) {
   *   floorManager.setCurrentFloor(floor1F.id)
   * }
   * ```
   */
  public setCurrentFloor(semanticId: string): void {
    const floor = this.getFloorById(semanticId)
    if (!floor) {
      console.warn(`[FloorManager] 无法切换：楼层不存在 (${semanticId})`)
      return
    }

    // 1. 隐藏所有楼层
    this.getAllFloors().forEach((f) => {
      this.hideFloor(f.id)
    })

    // 2. 显示目标楼层
    this.showFloor(semanticId)

    // 3. 更新当前楼层 ID
    this.currentFloorId = semanticId
  }

  /**
   * 获取当前楼层
   *
   * @returns 当前楼层语义对象，未设置返回 null
   */
  public getCurrentFloor(): SemanticObject | null {
    if (!this.currentFloorId) return null
    return this.getFloorById(this.currentFloorId) ?? null
  }

  /**
   * 获取当前楼层 ID
   *
   * @returns 当前楼层语义对象 ID，未设置返回 null
   */
  public getCurrentFloorId(): string | null {
    return this.currentFloorId
  }

  /**
   * 检查是否为当前楼层
   *
   * @param semanticId - 楼层语义对象 ID
   * @returns 是否为当前楼层
   */
  public isCurrentFloor(semanticId: string): boolean {
    return this.currentFloorId === semanticId
  }
}
