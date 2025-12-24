/**
 * 场景查询行为
 *
 * 职责：
 * - 提供统一的场景查询接口
 * - 封装跨管理器的复杂查询逻辑
 * - 返回标准化的 DomainResult
 *
 * 设计原则：
 * - 不直接操作 Three.js
 * - 聚合多个管理器的查询能力
 * - 提供类型安全的查询结果
 *
 * @example
 * ```typescript
 * const queryBehavior = new SceneQueryBehavior(
 *   storeManager,
 *   floorManager,
 *   semanticRegistry
 * )
 *
 * // 按 ID 查询店铺
 * const result = queryBehavior.getStoreById('store-001')
 *
 * // 获取区域下的所有店铺
 * const stores = queryBehavior.getStoresByArea('area-001')
 *
 * // 获取楼层下的所有店铺
 * const floorStores = queryBehavior.getFloorStores('floor-001')
 * ```
 */

import type { SemanticObject } from '../scene'
import type { Store, Floor, Area } from '../mall/mall.types'
import type { StoreManager } from '../mall/StoreManager'
import type { FloorManager } from '../mall/FloorManager'
import type { SemanticObjectRegistry } from '../registry/SemanticObjectRegistry'
import { SemanticType } from '../scene'
import type { DomainResult } from '@/protocol/result.protocol'
import { ErrorCode } from '@/protocol/result.enums'

// =============================================================================
// 类型定义
// =============================================================================

/** 店铺查询结果 */
export interface StoreQueryResult {
  /** 语义对象 */
  semanticObject: SemanticObject
  /** 业务数据（从 metadata 提取） */
  businessData: Partial<Store>
}

/** 楼层查询结果 */
export interface FloorQueryResult {
  /** 语义对象 */
  semanticObject: SemanticObject
  /** 业务数据（从 metadata 提取） */
  businessData: Partial<Floor>
}

/** 区域查询结果 */
export interface AreaQueryResult {
  /** 语义对象 */
  semanticObject: SemanticObject
  /** 业务数据（从 metadata 提取） */
  businessData: Partial<Area>
}

/** 场景统计信息 */
export interface SceneStatistics {
  /** 楼层数量 */
  floorCount: number
  /** 区域数量 */
  areaCount: number
  /** 店铺数量 */
  storeCount: number
  /** 总对象数量 */
  totalObjects: number
}

// =============================================================================
// SceneQueryBehavior 类
// =============================================================================

export class SceneQueryBehavior {
  // ===========================================================================
  // 私有属性
  // ===========================================================================

  /** 店铺管理器 */
  private storeManager: StoreManager

  /** 楼层管理器 */
  private floorManager: FloorManager

  /** 语义对象注册表 */
  private semanticRegistry: SemanticObjectRegistry

  // ===========================================================================
  // 构造函数
  // ===========================================================================

  /**
   * 创建场景查询行为实例
   *
   * @param storeManager - 店铺管理器
   * @param floorManager - 楼层管理器
   * @param semanticRegistry - 语义对象注册表
   */
  constructor(
    storeManager: StoreManager,
    floorManager: FloorManager,
    semanticRegistry: SemanticObjectRegistry
  ) {
    this.storeManager = storeManager
    this.floorManager = floorManager
    this.semanticRegistry = semanticRegistry
  }

  // ===========================================================================
  // 店铺查询方法
  // ===========================================================================

  /**
   * 按业务 ID 查询店铺
   *
   * @param storeId - 店铺业务 ID（Store.id）
   * @returns 查询结果
   */
  public getStoreById(storeId: string): DomainResult<StoreQueryResult> {
    const semanticObject = this.storeManager.getStoreByBusinessId(storeId)

    if (!semanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `店铺不存在: ${storeId}`,
        },
      }
    }

    return {
      success: true,
      data: {
        semanticObject,
        businessData: this.extractStoreData(semanticObject),
      },
    }
  }

  /**
   * 按语义对象 ID 查询店铺
   *
   * @param semanticId - 店铺语义对象 ID
   * @returns 查询结果
   */
  public getStoreBySemanticId(semanticId: string): DomainResult<StoreQueryResult> {
    const semanticObject = this.storeManager.getStoreById(semanticId)

    if (!semanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `店铺语义对象不存在: ${semanticId}`,
        },
      }
    }

    return {
      success: true,
      data: {
        semanticObject,
        businessData: this.extractStoreData(semanticObject),
      },
    }
  }

  /**
   * 获取指定区域下的所有店铺
   *
   * @param areaId - 区域业务 ID（Area.id）
   * @returns 店铺列表
   */
  public getStoresByArea(areaId: string): DomainResult<StoreQueryResult[]> {
    // 1. 先找到区域的语义对象
    const areaSemanticObject = this.semanticRegistry.getByBusinessId(
      areaId,
      SemanticType.AREA
    )

    if (!areaSemanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `区域不存在: ${areaId}`,
        },
      }
    }

    // 2. 获取该区域下的所有店铺
    const stores = this.storeManager.getStoresByArea(areaSemanticObject.id)

    return {
      success: true,
      data: stores.map((semanticObject) => ({
        semanticObject,
        businessData: this.extractStoreData(semanticObject),
      })),
    }
  }

  /**
   * 获取指定楼层下的所有店铺
   *
   * @param floorId - 楼层业务 ID（Floor.id）
   * @returns 店铺列表
   */
  public getFloorStores(floorId: string): DomainResult<StoreQueryResult[]> {
    // 1. 先找到楼层的语义对象
    const floorSemanticObject = this.floorManager.getFloorByBusinessId(floorId)

    if (!floorSemanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `楼层不存在: ${floorId}`,
        },
      }
    }

    // 2. 获取该楼层下的所有区域
    const areas = this.semanticRegistry
      .getByType(SemanticType.AREA)
      .filter((area) => area.parentId === floorSemanticObject.id)

    // 3. 收集所有区域下的店铺
    const stores: StoreQueryResult[] = []
    for (const area of areas) {
      const areaStores = this.storeManager.getStoresByArea(area.id)
      for (const store of areaStores) {
        stores.push({
          semanticObject: store,
          businessData: this.extractStoreData(store),
        })
      }
    }

    return {
      success: true,
      data: stores,
    }
  }

  /**
   * 获取所有店铺
   *
   * @returns 所有店铺列表
   */
  public getAllStores(): StoreQueryResult[] {
    return this.storeManager.getAllStores().map((semanticObject) => ({
      semanticObject,
      businessData: this.extractStoreData(semanticObject),
    }))
  }

  // ===========================================================================
  // 楼层查询方法
  // ===========================================================================

  /**
   * 按业务 ID 查询楼层
   *
   * @param floorId - 楼层业务 ID（Floor.id）
   * @returns 查询结果
   */
  public getFloorById(floorId: string): DomainResult<FloorQueryResult> {
    const semanticObject = this.floorManager.getFloorByBusinessId(floorId)

    if (!semanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `楼层不存在: ${floorId}`,
        },
      }
    }

    return {
      success: true,
      data: {
        semanticObject,
        businessData: this.extractFloorData(semanticObject),
      },
    }
  }

  /**
   * 按楼层编号查询楼层
   *
   * @param level - 楼层编号（1 表示 1F，-1 表示 B1）
   * @returns 查询结果
   */
  public getFloorByLevel(level: number): DomainResult<FloorQueryResult> {
    const semanticObject = this.floorManager.getFloorByLevel(level)

    if (!semanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `楼层不存在: ${level}F`,
        },
      }
    }

    return {
      success: true,
      data: {
        semanticObject,
        businessData: this.extractFloorData(semanticObject),
      },
    }
  }

  /**
   * 获取所有楼层
   *
   * @returns 所有楼层列表（按 level 排序）
   */
  public getAllFloors(): FloorQueryResult[] {
    return this.floorManager
      .getAllFloors()
      .map((semanticObject) => ({
        semanticObject,
        businessData: this.extractFloorData(semanticObject),
      }))
      .sort((a, b) => {
        const levelA = (a.businessData.level ?? 0)
        const levelB = (b.businessData.level ?? 0)
        return levelA - levelB
      })
  }

  // ===========================================================================
  // 区域查询方法
  // ===========================================================================

  /**
   * 按业务 ID 查询区域
   *
   * @param areaId - 区域业务 ID（Area.id）
   * @returns 查询结果
   */
  public getAreaById(areaId: string): DomainResult<AreaQueryResult> {
    const semanticObject = this.semanticRegistry.getByBusinessId(
      areaId,
      SemanticType.AREA
    )

    if (!semanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `区域不存在: ${areaId}`,
        },
      }
    }

    return {
      success: true,
      data: {
        semanticObject,
        businessData: this.extractAreaData(semanticObject),
      },
    }
  }

  /**
   * 获取指定楼层下的所有区域
   *
   * @param floorId - 楼层业务 ID（Floor.id）
   * @returns 区域列表
   */
  public getAreasByFloor(floorId: string): DomainResult<AreaQueryResult[]> {
    // 1. 先找到楼层的语义对象
    const floorSemanticObject = this.floorManager.getFloorByBusinessId(floorId)

    if (!floorSemanticObject) {
      return {
        success: false,
        error: {
          code: ErrorCode.TARGET_NOT_FOUND,
          message: `楼层不存在: ${floorId}`,
        },
      }
    }

    // 2. 获取该楼层下的所有区域
    const areas = this.semanticRegistry
      .getByType(SemanticType.AREA)
      .filter((area) => area.parentId === floorSemanticObject.id)

    return {
      success: true,
      data: areas.map((semanticObject) => ({
        semanticObject,
        businessData: this.extractAreaData(semanticObject),
      })),
    }
  }

  /**
   * 获取所有区域
   *
   * @returns 所有区域列表
   */
  public getAllAreas(): AreaQueryResult[] {
    return this.semanticRegistry
      .getByType(SemanticType.AREA)
      .map((semanticObject) => ({
        semanticObject,
        businessData: this.extractAreaData(semanticObject),
      }))
  }

  // ===========================================================================
  // 统计查询方法
  // ===========================================================================

  /**
   * 获取场景统计信息
   *
   * @returns 场景统计
   */
  public getStatistics(): SceneStatistics {
    return {
      floorCount: this.floorManager.floorCount,
      areaCount: this.semanticRegistry.getByType(SemanticType.AREA).length,
      storeCount: this.storeManager.storeCount,
      totalObjects: this.semanticRegistry.size,
    }
  }

  // ===========================================================================
  // 状态查询方法
  // ===========================================================================

  /**
   * 获取当前选中的店铺
   *
   * @returns 当前选中的店铺，未选中返回 null
   */
  public getSelectedStore(): StoreQueryResult | null {
    const semanticObject = this.storeManager.getSelectedStore()
    if (!semanticObject) return null

    return {
      semanticObject,
      businessData: this.extractStoreData(semanticObject),
    }
  }

  /**
   * 获取当前高亮的店铺
   *
   * @returns 当前高亮的店铺，未高亮返回 null
   */
  public getHighlightedStore(): StoreQueryResult | null {
    const semanticObject = this.storeManager.getHighlightedStore()
    if (!semanticObject) return null

    return {
      semanticObject,
      businessData: this.extractStoreData(semanticObject),
    }
  }

  /**
   * 获取当前楼层
   *
   * @returns 当前楼层，未设置返回 null
   */
  public getCurrentFloor(): FloorQueryResult | null {
    const semanticObject = this.floorManager.getCurrentFloor()
    if (!semanticObject) return null

    return {
      semanticObject,
      businessData: this.extractFloorData(semanticObject),
    }
  }

  // ===========================================================================
  // 私有辅助方法
  // ===========================================================================

  /**
   * 从语义对象提取店铺业务数据
   */
  private extractStoreData(semanticObject: SemanticObject): Partial<Store> {
    const metadata = semanticObject.metadata ?? {}
    return {
      id: semanticObject.businessId,
      name: metadata.name as string | undefined,
      merchantId: metadata.merchantId as string | undefined,
      description: metadata.description as string | undefined,
      logoUrl: metadata.logoUrl as string | undefined,
      isOpen: metadata.isOpen as boolean | undefined,
      areaId: metadata.areaId as string | undefined,
    }
  }

  /**
   * 从语义对象提取楼层业务数据
   */
  private extractFloorData(semanticObject: SemanticObject): Partial<Floor> {
    const metadata = semanticObject.metadata ?? {}
    return {
      id: semanticObject.businessId,
      name: metadata.name as string | undefined,
      level: metadata.level as number | undefined,
      mallId: metadata.mallId as string | undefined,
    }
  }

  /**
   * 从语义对象提取区域业务数据
   */
  private extractAreaData(semanticObject: SemanticObject): Partial<Area> {
    const metadata = semanticObject.metadata ?? {}
    return {
      id: semanticObject.businessId,
      name: metadata.name as string | undefined,
      type: metadata.type as Area['type'] | undefined,
      status: metadata.status as Area['status'] | undefined,
      floorId: metadata.floorId as string | undefined,
      authorizedMerchantId: metadata.authorizedMerchantId as string | undefined,
    }
  }
}
