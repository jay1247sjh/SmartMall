/**
 * 语义对象注册表
 *
 * 职责：
 * - 管理所有语义对象的生命周期（注册/查询/注销）
 * - 提供多种查询方式
 * - 保证 businessId 唯一性
 *
 * 设计原则：
 * - 不依赖 Three.js，纯业务逻辑
 */

import { SemanticType, type SemanticObject } from '../scene'
import type { SemanticObjectCreateParams } from '../scene'

export class SemanticObjectRegistry {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** 主存储：id -> SemanticObject */
  private objectsById: Map<string, SemanticObject> = new Map()

  /** ID 计数器，用于生成唯一 ID */
  private idCounter: number = 0

  /** 索引：semanticType -> id 集合（用于按类型快速查询） */
  private idsByType: Map<SemanticType, Set<string>> = new Map()

  /** 索引：businessId 复合键 -> id（用于按业务ID快速查询） */
  private idByBusinessId: Map<string, string> = new Map()

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  constructor() {
    // 初始化类型索引，为每种语义类型创建空 Set
    Object.values(SemanticType).forEach((type) => {
      this.idsByType.set(type, new Set())
    })
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  /**
   * 生成唯一 ID
   * 格式：{类型}_{计数器}_{时间戳}
   * 例如：store_1_1702800000000
   */
  private generateId(type: SemanticType): string {
    return `${type}_${++this.idCounter}_${Date.now()}`
  }

  // ==========================================================================
  // 注册方法
  // ==========================================================================

  /**
   * 注册新的语义对象
   *
   * @param params - 创建参数
   * @returns 创建的语义对象
   */
  public register(params: SemanticObjectCreateParams): SemanticObject {
    // 1. 生成唯一 ID
    const id = this.generateId(params.semanticType)

    // 2. 创建语义对象，设置默认值
    const object: SemanticObject = {
      id,
      semanticType: params.semanticType,
      businessId: params.businessId,
      transform: params.transform,
      boundingBox: params.boundingBox,
      meshId: params.meshId,
      parentId: params.parentId,
      childrenIds: [],
      interactive: params.interactive ?? true,   // 默认可交互
      visible: params.visible ?? true,           // 默认可见
      metadata: params.metadata ?? {}
    }

    // 3. 存储到主 Map
    this.objectsById.set(id, object)

    // 4. 更新类型索引
    this.idsByType.get(params.semanticType)?.add(id)

    // 5. 更新 businessId 索引
    this.idByBusinessId.set(
      this.makeBusinessKey(params.businessId, params.semanticType),
      id
    )

    return object
  }

  // ==========================================================================
  // 查询方法
  // ==========================================================================

  /**
   * 按 ID 查询语义对象
   *
   * @param id - 语义对象的唯一 ID
   * @returns 找到的对象，未找到返回 undefined
   */
  public getById(id: string): SemanticObject | undefined {
    return this.objectsById.get(id)
  }

  /**
   * 获取所有已注册的语义对象
   *
   * @returns 所有语义对象的数组
   */
  public getAll(): SemanticObject[] {
    return Array.from(this.objectsById.values())
  }

  /**
   * 获取已注册对象的数量
   */
  public get size(): number {
    return this.objectsById.size
  }

  /**
   * 按语义类型查询所有对象
   * 例如：获取所有店铺、获取所有楼层
   *
   * @param semanticType - 语义类型
   * @returns 该类型的所有对象数组
   */
  public getByType(semanticType: SemanticType): SemanticObject[] {
    const ids = this.idsByType.get(semanticType)
    if (!ids) return []  // 注意：是 !ids，没有找到时返回空数组

    return Array.from(ids)
      .map((id) => this.objectsById.get(id))
      .filter((obj): obj is SemanticObject => obj !== undefined)
  }

  /**
   * 生成 businessId 的复合键
   * 格式：{类型}:{businessId}
   * 用于保证同类型下 businessId 唯一
   *
   * @example makeBusinessKey("starbucks", "store") => "store:starbucks"
   */
  private makeBusinessKey(businessId: string, type: SemanticType): string {
    return `${type}:${businessId}`
  }

  /**
   * 按 businessId 和类型查询语义对象
   * 例如：通过 "starbucks" 找到星巴克店铺
   *
   * @param businessId - 业务实体 ID（如 store-001）
   * @param semanticType - 语义类型（如 SemanticType.STORE）
   * @returns 找到的对象，未找到返回 undefined
   */
  public getByBusinessId(
    businessId: string,
    semanticType: SemanticType
  ): SemanticObject | undefined {
    const key = this.makeBusinessKey(businessId, semanticType)
    const id = this.idByBusinessId.get(key)
    return id ? this.objectsById.get(id) : undefined
  }

  // ==========================================================================
  // 注销方法
  // ==========================================================================

  /**
   * 注销语义对象
   * 从注册表中移除对象，并清理所有索引
   *
   * @param id - 要注销的对象 ID
   * @returns 是否成功注销（对象不存在时返回 false）
   */
  public unregister(id: string): boolean {
    const object = this.objectsById.get(id)
    if (!object) return false

    // 1. 从主存储移除
    this.objectsById.delete(id)

    // 2. 从类型索引移除
    this.idsByType.get(object.semanticType)?.delete(id)

    // 3. 从 businessId 索引移除
    this.idByBusinessId.delete(
      this.makeBusinessKey(object.businessId, object.semanticType)
    )

    return true
  }

  /**
   * 清空所有语义对象
   * 用于场景重置或页面卸载时
   */
  public clear(): void {
    // 清空主存储
    this.objectsById.clear()

    // 清空 businessId 索引
    this.idByBusinessId.clear()

    // 清空类型索引（保留 Map 结构，只清空 Set 内容）
    this.idsByType.forEach((set) => set.clear())

    // 重置 ID 计数器
    this.idCounter = 0
  }
}