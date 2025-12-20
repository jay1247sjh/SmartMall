/**
 * Mesh 注册表
 *
 * 职责：
 * - 管理 SemanticObject 与 Three.js Mesh 的双向映射
 * - 支持通过语义对象 ID 查找 Mesh（SemanticObject → Mesh）
 * - 支持通过 Mesh 查找语义对象 ID（Mesh → SemanticObject）
 *
 * 设计原则：
 * - 保持与 SemanticObjectRegistry 的独立性
 * - 使用 Mesh.uuid 作为 Three.js 对象的唯一标识
 * - 在 Mesh.userData 中存储 semanticId 便于射线检测时快速访问
 *
 * 使用场景：
 * - 点击 3D 对象时，通过 Mesh 找到对应的语义对象
 * - 高亮某个店铺时，通过语义对象 ID 找到对应的 Mesh
 * - 导航到某个位置时，获取目标的 Mesh 进行相机动画
 *
 * @example
 * ```typescript
 * const meshRegistry = new MeshRegistry()
 *
 * // 绑定语义对象与 Mesh
 * meshRegistry.bind(semanticObject.id, storeMesh)
 *
 * // 通过语义对象 ID 获取 Mesh
 * const mesh = meshRegistry.getMesh(semanticObject.id)
 *
 * // 通过 Mesh 获取语义对象 ID（用于点击检测）
 * const semanticId = meshRegistry.getSemanticId(clickedMesh)
 * ```
 */

import type * as THREE from 'three'

export class MeshRegistry {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** 语义对象 ID → Mesh 的映射 */
  private meshBySemanticId: Map<string, THREE.Object3D> = new Map()

  /** Mesh UUID → 语义对象 ID 的映射 */
  private semanticIdByMeshUuid: Map<string, string> = new Map()

  // ==========================================================================
  // 绑定方法
  // ==========================================================================

  /**
   * 绑定语义对象与 Mesh
   *
   * 建立双向映射关系，同时在 Mesh.userData 中存储 semanticId
   * 便于射线检测时快速访问语义信息
   *
   * @param semanticId - 语义对象 ID
   * @param mesh - Three.js 对象（Mesh、Group 等）
   *
   * @example
   * ```typescript
   * // 创建店铺 Mesh 后绑定
   * const storeMesh = new THREE.Mesh(geometry, material)
   * meshRegistry.bind(storeSemanticObject.id, storeMesh)
   * ```
   */
  public bind(semanticId: string, mesh: THREE.Object3D): void {
    // 1. 如果该语义对象已有绑定，先解除旧绑定
    if (this.meshBySemanticId.has(semanticId)) {
      this.unbind(semanticId)
    }

    // 2. 存储双向映射
    this.meshBySemanticId.set(semanticId, mesh)
    this.semanticIdByMeshUuid.set(mesh.uuid, semanticId)

    // 3. 在 Mesh.userData 中存储语义 ID（便于射线检测时快速访问）
    mesh.userData.semanticId = semanticId
  }

  /**
   * 解除语义对象与 Mesh 的绑定
   *
   * 清理双向映射和 Mesh.userData 中的语义信息
   *
   * @param semanticId - 语义对象 ID
   * @returns 是否成功解除绑定（不存在时返回 false）
   *
   * @example
   * ```typescript
   * // 删除店铺时解除绑定
   * meshRegistry.unbind(storeSemanticObject.id)
   * ```
   */
  public unbind(semanticId: string): boolean {
    const mesh = this.meshBySemanticId.get(semanticId)
    if (!mesh) return false

    // 1. 清理 Mesh.userData 中的语义信息
    delete mesh.userData.semanticId

    // 2. 删除双向映射
    this.semanticIdByMeshUuid.delete(mesh.uuid)
    this.meshBySemanticId.delete(semanticId)

    return true
  }

  // ==========================================================================
  // 查询方法
  // ==========================================================================

  /**
   * 通过语义对象 ID 获取 Mesh
   *
   * 用于需要操作 3D 对象的场景，如高亮、隐藏、动画等
   *
   * @param semanticId - 语义对象 ID
   * @returns 对应的 Mesh，未找到返回 undefined
   *
   * @example
   * ```typescript
   * // 高亮某个店铺
   * const mesh = meshRegistry.getMesh(storeId)
   * if (mesh) {
   *   highlightEffect.apply(mesh)
   * }
   * ```
   */
  public getMesh(semanticId: string): THREE.Object3D | undefined {
    return this.meshBySemanticId.get(semanticId)
  }

  /**
   * 通过 Mesh 获取语义对象 ID
   *
   * 主要用于射线检测后，从点击的 Mesh 找到对应的语义对象
   *
   * @param mesh - Three.js 对象
   * @returns 对应的语义对象 ID，未找到返回 undefined
   *
   * @example
   * ```typescript
   * // 射线检测点击事件
   * const intersects = raycaster.intersectObjects(scene.children)
   * if (intersects.length > 0) {
   *   const clickedMesh = intersects[0].object
   *   const semanticId = meshRegistry.getSemanticId(clickedMesh)
   *   if (semanticId) {
   *     // 处理点击的语义对象
   *   }
   * }
   * ```
   */
  public getSemanticId(mesh: THREE.Object3D): string | undefined {
    // 优先从 userData 获取（更快）
    if (mesh.userData.semanticId) {
      return mesh.userData.semanticId as string
    }
    // 回退到 Map 查询
    return this.semanticIdByMeshUuid.get(mesh.uuid)
  }

  /**
   * 检查语义对象是否已绑定 Mesh
   *
   * @param semanticId - 语义对象 ID
   * @returns 是否已绑定
   */
  public hasMesh(semanticId: string): boolean {
    return this.meshBySemanticId.has(semanticId)
  }

  /**
   * 获取所有已绑定的语义对象 ID
   *
   * @returns 语义对象 ID 数组
   */
  public getAllSemanticIds(): string[] {
    return Array.from(this.meshBySemanticId.keys())
  }

  /**
   * 获取已绑定的数量
   */
  public get size(): number {
    return this.meshBySemanticId.size
  }

  // ==========================================================================
  // 清理方法
  // ==========================================================================

  /**
   * 清空所有绑定
   *
   * 用于场景重置或页面卸载时
   */
  public clear(): void {
    // 清理所有 Mesh 的 userData
    this.meshBySemanticId.forEach((mesh) => {
      delete mesh.userData.semanticId
    })

    // 清空映射
    this.meshBySemanticId.clear()
    this.semanticIdByMeshUuid.clear()
  }
}
