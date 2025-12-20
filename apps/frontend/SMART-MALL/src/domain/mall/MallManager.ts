/**
 * 商城管理器
 *
 * 职责：
 * - 作为商城领域的顶层管理器，统一管理商城数据
 * - 协调 FloorManager 和 StoreManager
 * - 负责商城数据的加载和层级关系建立
 *
 * 设计原则：
 * - 作为统一入口，简化外部调用
 * - 委托具体操作给子管理器
 * - 管理商城 → 楼层 → 区域 → 店铺的层级关系
 *
 * 使用场景：
 * - 应用启动时，加载整个商城数据
 * - 获取子管理器进行具体操作
 * - 重置或清空商城数据
 *
 * @example
 * ```typescript
 * const mallManager = new MallManager(semanticRegistry, meshRegistry, factory)
 *
 * // 加载商城数据
 * mallManager.loadMall(mallData)
 *
 * // 获取子管理器
 * const storeManager = mallManager.getStoreManager()
 * const floorManager = mallManager.getFloorManager()
 *
 * // 切换楼层
 * floorManager.setCurrentFloor(floorId)
 * ```
 */

import { SemanticObjectRegistry, MeshRegistry } from '../registry'
import { SemanticObjectFactory } from '../factory'
import { SemanticType, type SemanticObject } from '../scene'
import type { Mall } from './mall.types'
import { StoreManager } from './StoreManager'
import { FloorManager } from './FloorManager'

export class MallManager {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** 语义对象注册表 */
  private semanticRegistry: SemanticObjectRegistry

  /** Mesh 注册表 */
  private meshRegistry: MeshRegistry

  /** 语义对象工厂 */
  private factory: SemanticObjectFactory

  /** 楼层管理器 */
  private floorManager: FloorManager

  /** 店铺管理器 */
  private storeManager: StoreManager

  /** 当前商城语义对象 ID */
  private currentMallId: string | null = null

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建商城管理器实例
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

    // 创建子管理器，共享同一套注册表和工厂
    this.floorManager = new FloorManager(semanticRegistry, meshRegistry, factory)
    this.storeManager = new StoreManager(semanticRegistry, meshRegistry, factory)
  }


  // ==========================================================================
  // 子管理器访问
  // ==========================================================================

  /**
   * 获取楼层管理器
   *
   * @returns 楼层管理器实例
   */
  public getFloorManager(): FloorManager {
    return this.floorManager
  }

  /**
   * 获取店铺管理器
   *
   * @returns 店铺管理器实例
   */
  public getStoreManager(): StoreManager {
    return this.storeManager
  }

  // ==========================================================================
  // 商城数据加载
  // ==========================================================================

  /**
   * 加载商城数据
   * 递归创建商城 → 楼层 → 区域 → 店铺的语义对象层级
   *
   * @param mall - 商城业务数据
   * @returns 商城语义对象
   *
   * @example
   * ```typescript
   * const mallData: Mall = {
   *   id: 'mall-001',
   *   name: '智能商城',
   *   floors: [...]
   * }
   * const mallObj = mallManager.loadMall(mallData)
   * ```
   */
  public loadMall(mall: Mall): SemanticObject {
    // 1. 创建商城语义对象
    const mallObj = this.createMallSemanticObject(mall)
    this.currentMallId = mallObj.id

    // 2. 递归加载楼层
    for (const floor of mall.floors) {
      const floorObj = this.floorManager.addFloor(floor, mallObj.id)

      // 3. 递归加载区域和店铺
      for (const area of floor.areas) {
        const areaObj = this.createAreaSemanticObject(area, floorObj.id)

        // 4. 加载区域内的店铺
        for (const store of area.stores) {
          this.storeManager.addStore(store, areaObj.id)
        }
      }
    }

    // 5. 默认显示第一个楼层
    const floors = this.floorManager.getAllFloors()
    if (floors.length > 0 && floors[0]) {
      this.floorManager.setCurrentFloor(floors[0].id)
    }

    return mallObj
  }

  /**
   * 创建商城语义对象
   *
   * @param mall - 商城业务数据
   * @returns 商城语义对象
   */
  private createMallSemanticObject(mall: Mall): SemanticObject {
    return this.semanticRegistry.register({
      semanticType: SemanticType.MALL,
      businessId: mall.id,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 }
      },
      metadata: {
        name: mall.name,
        description: mall.description
      }
    })
  }

  /**
   * 创建区域语义对象
   *
   * @param area - 区域业务数据
   * @param parentId - 父对象 ID（楼层语义对象 ID）
   * @returns 区域语义对象
   */
  private createAreaSemanticObject(
    area: import('./mall.types').Area,
    parentId: string
  ): SemanticObject {
    return this.factory.createFromArea(area, parentId)
  }


  // ==========================================================================
  // 商城查询方法
  // ==========================================================================

  /**
   * 获取当前商城语义对象
   *
   * @returns 商城语义对象，未加载返回 null
   */
  public getMall(): SemanticObject | null {
    if (!this.currentMallId) return null
    return this.semanticRegistry.getById(this.currentMallId) ?? null
  }

  /**
   * 获取当前商城 ID
   *
   * @returns 商城语义对象 ID，未加载返回 null
   */
  public getMallId(): string | null {
    return this.currentMallId
  }

  /**
   * 检查商城是否已加载
   *
   * @returns 是否已加载
   */
  public isMallLoaded(): boolean {
    return this.currentMallId !== null
  }

  // ==========================================================================
  // 清理方法
  // ==========================================================================

  /**
   * 清空商城数据
   * 清除所有语义对象和 Mesh 绑定
   */
  public clear(): void {
    // 清空注册表
    this.semanticRegistry.clear()
    this.meshRegistry.clear()

    // 重置状态
    this.currentMallId = null
  }

  /**
   * 获取商城统计信息
   *
   * @returns 统计信息对象
   */
  public getStats(): {
    floorCount: number
    storeCount: number
    totalObjects: number
  } {
    return {
      floorCount: this.floorManager.floorCount,
      storeCount: this.storeManager.storeCount,
      totalObjects: this.semanticRegistry.size
    }
  }
}
