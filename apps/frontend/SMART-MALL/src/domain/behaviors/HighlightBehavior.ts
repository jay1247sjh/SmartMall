/**
 * 高亮行为
 *
 * 职责：
 * - 连接语义层（StoreManager）和渲染层（HighlightEffect）
 * - 通过语义对象 ID 控制 3D 对象的高亮效果
 *
 * 设计原则：
 * - 领域层不直接操作 Three.js（除了类型检查）
 * - 通过 MeshRegistry 获取 Mesh，再委托给 HighlightEffect
 *
 * @example
 * ```typescript
 * const highlightBehavior = new HighlightBehavior(meshRegistry, highlightEffect)
 *
 * // 悬停高亮
 * highlightBehavior.highlightStore('store_1_xxx')
 *
 * // 选中高亮
 * highlightBehavior.selectStore('store_1_xxx')
 * ```
 */

import * as THREE from 'three'
import type { MeshRegistry } from '../registry'
import type { HighlightEffect } from '@/engine/effects/HighlightEffect'

export class HighlightBehavior {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** Mesh 注册表，用于通过语义 ID 获取 Mesh */
  private meshRegistry: MeshRegistry

  /** 高亮效果管理器，负责实际的高亮渲染 */
  private highlightEffect: HighlightEffect

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建高亮行为实例
   *
   * @param meshRegistry - Mesh 注册表
   * @param highlightEffect - 高亮效果管理器
   */
  constructor(meshRegistry: MeshRegistry, highlightEffect: HighlightEffect) {
    this.meshRegistry = meshRegistry
    this.highlightEffect = highlightEffect
  }

  // ==========================================================================
  // 悬停高亮方法
  // ==========================================================================

  /**
   * 高亮店铺（悬停效果）
   * 通过语义对象 ID 找到对应的 Mesh，应用悬停高亮
   *
   * @param semanticId - 店铺语义对象 ID
   * @returns 是否成功应用高亮
   */
  public highlightStore(semanticId: string): boolean {
    // 1. 通过 MeshRegistry 获取对应的 Mesh
    const object = this.meshRegistry.getMesh(semanticId)

    // 2. 检查是否存在且是 THREE.Mesh 类型
    if (!object || !(object instanceof THREE.Mesh)) {
      console.warn(`[HighlightBehavior] 无法高亮：找不到 Mesh (${semanticId})`)
      return false
    }

    // 3. 委托给 HighlightEffect 应用效果
    this.highlightEffect.setHover(object)
    return true
  }

  /**
   * 清除悬停高亮
   */
  public clearHighlight(): void {
    this.highlightEffect.clearHover()
  }

  // ==========================================================================
  // 选中高亮方法
  // ==========================================================================

  /**
   * 选中店铺（选中效果）
   * 通过语义对象 ID 找到对应的 Mesh，应用选中高亮
   *
   * @param semanticId - 店铺语义对象 ID
   * @returns 是否成功应用选中
   */
  public selectStore(semanticId: string): boolean {
    // 1. 通过 MeshRegistry 获取对应的 Mesh
    const object = this.meshRegistry.getMesh(semanticId)

    // 2. 检查是否存在且是 THREE.Mesh 类型
    if (!object || !(object instanceof THREE.Mesh)) {
      console.warn(`[HighlightBehavior] 无法选中：找不到 Mesh (${semanticId})`)
      return false
    }

    // 3. 委托给 HighlightEffect 应用效果
    this.highlightEffect.setSelected(object)
    return true
  }

  /**
   * 清除选中高亮
   */
  public clearSelection(): void {
    this.highlightEffect.clearSelected()
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 清理所有高亮效果
   */
  public dispose(): void {
    this.highlightEffect.dispose()
  }
}