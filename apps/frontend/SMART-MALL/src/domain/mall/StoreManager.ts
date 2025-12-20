/**
 * 店铺管理器
 *
 * 职责：
 * - 管理店铺语义对象的生命周期（添加/移除/查询）
 * - 管理店铺的交互状态（选中/高亮）
 * - 提供多种店铺查询方式
 *
 * 设计原则：
 * - 不直接操作 Three.js，通过 MeshRegistry 间接访问
 * - 店铺数据存储在 SemanticObjectRegistry 中
 * - 只负责店铺相关的业务逻辑
 *
 * 使用场景：
 * - 加载商城数据时，批量添加店铺
 * - 用户点击店铺时，设置选中状态
 * - 用户悬停店铺时，设置高亮状态
 * - 搜索店铺时，按条件查询
 *
 * @example
 * ```typescript
 * const storeManager = new StoreManager(semanticRegistry, meshRegistry, factory)
 *
 * // 添加店铺
 * const storeObj = storeManager.addStore(storeData, areaSemanticId)
 *
 * // 选中店铺
 * storeManager.selectStore(storeObj.id)
 *
 * // 查询店铺
 * const stores = storeManager.getStoresByArea('area-001')
 * ```
 */

import { SemanticObjectRegistry, MeshRegistry } from '../registry'
import { SemanticObjectFactory } from '../factory'
import { SemanticType, type SemanticObject } from '../scene'
import type { Store } from './mall.types'

export class StoreManager {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** 语义对象注册表，用于存储和查询店铺语义对象 */
  private semanticRegistry: SemanticObjectRegistry

  /** Mesh 注册表，用于关联店铺语义对象与 3D 模型 */
  private meshRegistry: MeshRegistry

  /** 语义对象工厂，用于从业务数据创建语义对象 */
  private factory: SemanticObjectFactory

  /** 当前选中的店铺语义对象 ID（同一时间只能选中一个） */
  private selectedStoreId: string | null = null

  /** 当前高亮的店铺语义对象 ID（同一时间只能高亮一个） */
  private highlightedStoreId: string | null = null

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建店铺管理器实例
   *
   * @param semanticRegistry - 语义对象注册表，管理所有语义对象
   * @param meshRegistry - Mesh 注册表，管理语义对象与 3D 模型的映射
   * @param factory - 语义对象工厂，负责创建语义对象
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
  // 店铺注册方法
  // ==========================================================================

  /**
   * 添加店铺
   * 从业务数据创建语义对象并注册到 SemanticObjectRegistry
   *
   * @param store - 店铺业务数据
   * @param parentId - 父对象 ID（通常是所属 Area 的语义对象 ID）
   * @returns 创建的语义对象
   *
   * @example
   * ```typescript
   * const storeData: Store = { id: 'store-001', name: '星巴克', ... }
   * const storeObj = storeManager.addStore(storeData, areaSemanticId)
   * ```
   */
  public addStore(store: Store, parentId?: string): SemanticObject {
    return this.factory.createFromStore(store, parentId)
  }

  /**
   * 移除店铺
   * 从注册表中注销店铺，并清理相关状态和 Mesh 绑定
   *
   * @param semanticId - 店铺语义对象 ID
   * @returns 是否成功移除
   *
   * @example
   * ```typescript
   * const success = storeManager.removeStore('store_1_1702800000000')
   * ```
   */
  public removeStore(semanticId: string): boolean {
    // 1. 如果是当前选中的店铺，清除选中状态
    if (this.selectedStoreId === semanticId) {
      this.selectedStoreId = null
    }

    // 2. 如果是当前高亮的店铺，清除高亮状态
    if (this.highlightedStoreId === semanticId) {
      this.highlightedStoreId = null
    }

    // 3. 解除 Mesh 绑定（如果存在）
    this.meshRegistry.unbind(semanticId)

    // 4. 从语义注册表注销
    return this.semanticRegistry.unregister(semanticId)
  }

  // ==========================================================================
  // 查询方法
  // ==========================================================================

  /**
   * 按语义对象 ID 查询店铺
   *
   * @param semanticId - 店铺语义对象 ID
   * @returns 找到的语义对象，未找到返回 undefined
   */
  public getStoreById(semanticId: string): SemanticObject | undefined {
    const obj = this.semanticRegistry.getById(semanticId)
    // 确保返回的是店铺类型
    return obj?.semanticType === SemanticType.STORE ? obj : undefined
  }

  /**
   * 按业务 ID 查询店铺
   * 例如：通过 "store-001" 找到对应的语义对象
   *
   * @param businessId - 店铺业务 ID（Store.id）
   * @returns 找到的语义对象，未找到返回 undefined
   */
  public getStoreByBusinessId(businessId: string): SemanticObject | undefined {
    return this.semanticRegistry.getByBusinessId(businessId, SemanticType.STORE)
  }

  /**
   * 获取指定区域下的所有店铺
   *
   * @param areaSemanticId - 区域语义对象 ID
   * @returns 该区域下的所有店铺语义对象数组
   */
  public getStoresByArea(areaSemanticId: string): SemanticObject[] {
    return this.getAllStores().filter((store) => store.parentId === areaSemanticId)
  }

  /**
   * 获取所有店铺
   *
   * @returns 所有店铺语义对象数组
   */
  public getAllStores(): SemanticObject[] {
    return this.semanticRegistry.getByType(SemanticType.STORE)
  }

  /**
   * 获取店铺数量
   */
  public get storeCount(): number {
    return this.getAllStores().length
  }

  // ==========================================================================
  // 状态管理方法
  // ==========================================================================

  /**
   * 选中店铺
   * 同一时间只能选中一个店铺，选中新店铺会自动取消之前的选中
   *
   * @param semanticId - 要选中的店铺语义对象 ID
   *
   * @example
   * ```typescript
   * storeManager.selectStore('store_1_1702800000000')
   * ```
   */
  public selectStore(semanticId: string): void {
    // 验证是否为有效的店铺
    const store = this.getStoreById(semanticId)
    if (!store) {
      console.warn(`[StoreManager] 无法选中：店铺不存在 (${semanticId})`)
      return
    }

    this.selectedStoreId = semanticId
  }

  /**
   * 取消选中店铺
   */
  public deselectStore(): void {
    this.selectedStoreId = null
  }

  /**
   * 获取当前选中的店铺
   *
   * @returns 当前选中的店铺语义对象，未选中返回 null
   */
  public getSelectedStore(): SemanticObject | null {
    if (!this.selectedStoreId) return null
    return this.getStoreById(this.selectedStoreId) ?? null
  }

  /**
   * 高亮店铺
   * 同一时间只能高亮一个店铺，高亮新店铺会自动取消之前的高亮
   *
   * @param semanticId - 要高亮的店铺语义对象 ID
   *
   * @example
   * ```typescript
   * // 鼠标悬停时高亮
   * storeManager.highlightStore('store_1_1702800000000')
   * ```
   */
  public highlightStore(semanticId: string): void {
    // 验证是否为有效的店铺
    const store = this.getStoreById(semanticId)
    if (!store) {
      console.warn(`[StoreManager] 无法高亮：店铺不存在 (${semanticId})`)
      return
    }

    this.highlightedStoreId = semanticId
  }

  /**
   * 清除高亮
   */
  public clearHighlight(): void {
    this.highlightedStoreId = null
  }

  /**
   * 获取当前高亮的店铺
   *
   * @returns 当前高亮的店铺语义对象，未高亮返回 null
   */
  public getHighlightedStore(): SemanticObject | null {
    if (!this.highlightedStoreId) return null
    return this.getStoreById(this.highlightedStoreId) ?? null
  }

  /**
   * 检查店铺是否被选中
   *
   * @param semanticId - 店铺语义对象 ID
   * @returns 是否被选中
   */
  public isSelected(semanticId: string): boolean {
    return this.selectedStoreId === semanticId
  }

  /**
   * 检查店铺是否被高亮
   *
   * @param semanticId - 店铺语义对象 ID
   * @returns 是否被高亮
   */
  public isHighlighted(semanticId: string): boolean {
    return this.highlightedStoreId === semanticId
  }
}
