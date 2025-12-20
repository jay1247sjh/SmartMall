/**
 * 语义对象工厂
 *
 * 职责：
 * - 从业务实体数据（Mall/Floor/Area/Store）创建语义对象
 * - 自动注册到 SemanticObjectRegistry
 * - 计算 Transform 和 BoundingBox
 *
 * 设计原则：
 * - 工厂不持有业务数据，只负责转换
 * - 创建的对象立即注册到 Registry
 */

import { SemanticObjectRegistry } from '../registry'
import {
  SemanticType,
  createBoundingBox,
  createBoundingBoxFromCenterAndSize,
  createTransform,
  type SemanticObject
} from '../scene'
import type { Store, Floor, Area } from '../mall'

export class SemanticObjectFactory {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** 语义对象注册表引用 */
  private registry: SemanticObjectRegistry

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * @param registry - 语义对象注册表，工厂创建的对象会自动注册到此
   */
  constructor(registry: SemanticObjectRegistry) {
    this.registry = registry
  }

  // ==========================================================================
  // 公共方法 - 创建语义对象
  // ==========================================================================

  /**
   * 从 Store 业务实体创建语义对象
   *
   * @param store - 店铺业务数据
   * @param parentId - 父对象 ID（通常是所属 Area 的语义对象 ID）
   * @returns 创建并注册的语义对象
   */
  public createFromStore(store: Store, parentId?: string): SemanticObject {
    // 计算 BoundingBox（基于位置和缩放）
    const boundingBox = createBoundingBoxFromCenterAndSize(
      store.transform.position,
      store.transform.scale
    )

    // 注册到 Registry 并返回
    return this.registry.register({
      semanticType: SemanticType.STORE,
      businessId: store.id,
      transform: store.transform,
      boundingBox,
      parentId,
      metadata: {
        name: store.name,
        merchantId: store.merchantId,
        areaId: store.areaId,
        description: store.description
      }
    })
  }

  /**
   * 从 Floor 业务实体创建语义对象
   *
   * @param floor - 楼层业务数据
   * @param parentId - 父对象 ID（通常是所属 Mall 的语义对象 ID）
   * @returns 创建并注册的语义对象
   */
  public createFromFloor(floor: Floor, parentId?: string): SemanticObject {
    // 楼层使用默认 Transform 或已有的 transform
    const transform = floor.transform ?? createTransform()

    return this.registry.register({
      semanticType: SemanticType.FLOOR,
      businessId: floor.id,
      transform,
      boundingBox: createBoundingBox(), // 楼层边界由子区域决定，初始为空
      parentId,
      metadata: {
        name: floor.name,
        level: floor.level,
        mallId: floor.mallId
      }
    })
  }

  /**
   * 从 Area 业务实体创建语义对象
   *
   * @param area - 区域业务数据
   * @param parentId - 父对象 ID（通常是所属 Floor 的语义对象 ID）
   * @returns 创建并注册的语义对象
   */
  public createFromArea(area: Area, parentId?: string): SemanticObject {
    return this.registry.register({
      semanticType: SemanticType.AREA,
      businessId: area.id,
      transform: createTransform(), // Area 使用默认 Transform
      boundingBox: area.boundary,   // Area 已有边界信息
      parentId,
      metadata: {
        name: area.name,
        type: area.type,
        status: area.status,
        floorId: area.floorId,
        authorizedMerchantId: area.authorizedMerchantId
      }
    })
  }
}
