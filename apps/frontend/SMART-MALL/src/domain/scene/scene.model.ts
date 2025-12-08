/**
 * 3D 场景领域 - 语义对象模型
 * 定义连接 3D 场景和业务实体的语义对象
 */

import type { Transform, BoundingBox } from './scene.types'
import type { SemanticType } from './scene.enums'

/**
 * 语义对象
 * 连接 3D 场景对象与业务实体的桥梁
 * 
 * 每个 3D 场景中的对象都有对应的语义信息，用于：
 * - 将 Three.js Mesh 映射到业务实体（Mall/Floor/Area/Store/Product）
 * - 提供交互能力（点击、悬停、选择）
 * - 管理对象层级关系
 * - 支持场景查询和过滤
 * 
 * @example
 * ```typescript
 * const storeObject: SemanticObject = {
 *   id: 'semantic-store-001',
 *   semanticType: SemanticType.STORE,
 *   businessId: 'store-001',
 *   transform: { position: {x: 0, y: 0, z: 0}, ... },
 *   boundingBox: { min: {...}, max: {...} },
 *   interactive: true,
 *   visible: true
 * }
 * ```
 */
export interface SemanticObject {
  /**
   * 语义对象唯一标识
   * 用于在场景中唯一标识此语义对象
   */
  id: string

  /**
   * 语义类型
   * 标识此对象代表的业务概念（商城、楼层、区域、店铺、商品等）
   */
  semanticType: SemanticType

  /**
   * 业务实体ID
   * 指向对应业务实体的ID（Mall.id / Floor.id / Store.id 等）
   * 用于从语义对象反查业务数据
   */
  businessId: string

  /**
   * 3D 变换信息
   * 描述对象在 3D 空间中的位置、旋转和缩放
   */
  transform: Transform

  /**
   * 边界框
   * 用于碰撞检测、射线检测、选择等操作
   */
  boundingBox: BoundingBox

  /**
   * 关联的 Three.js Mesh ID（可选）
   * 用于从语义对象找到对应的 Three.js 对象
   */
  meshId?: string

  /**
   * 父对象ID（可选）
   * 用于构建对象层级关系
   * 例如：Store 的 parentId 指向 Area 的语义对象ID
   */
  parentId?: string

  /**
   * 子对象ID列表（可选）
   * 用于快速访问子对象
   * 例如：Area 的 childrenIds 包含所有 Store 的语义对象ID
   */
  childrenIds?: string[]

  /**
   * 是否可交互
   * 控制对象是否响应用户交互（点击、悬停等）
   * @default true
   */
  interactive?: boolean

  /**
   * 是否可见
   * 控制对象在场景中的可见性
   * @default true
   */
  visible?: boolean

  /**
   * 扩展元数据
   * 存储额外的自定义数据
   */
  metadata?: Record<string, unknown>
}

/**
 * 语义对象创建参数
 * 用于创建新的语义对象时的参数类型
 */
export interface SemanticObjectCreateParams {
  semanticType: SemanticType
  businessId: string
  transform: Transform
  boundingBox: BoundingBox
  meshId?: string
  parentId?: string
  interactive?: boolean
  visible?: boolean
  metadata?: Record<string, unknown>
}

/**
 * 语义对象更新参数
 * 用于更新语义对象时的参数类型（所有字段可选）
 */
export interface SemanticObjectUpdateParams {
  transform?: Transform
  boundingBox?: BoundingBox
  meshId?: string
  parentId?: string
  childrenIds?: string[]
  interactive?: boolean
  visible?: boolean
  metadata?: Record<string, unknown>
}

/**
 * 语义对象查询条件
 * 用于在场景中查询语义对象
 */
export interface SemanticObjectQuery {
  /** 按语义类型查询 */
  semanticType?: SemanticType
  /** 按业务ID查询 */
  businessId?: string
  /** 按父对象ID查询 */
  parentId?: string
  /** 只查询可交互对象 */
  interactiveOnly?: boolean
  /** 只查询可见对象 */
  visibleOnly?: boolean
}
