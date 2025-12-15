/**
 * 几何体工厂
 *
 * 这个类负责创建和管理 3D 几何体，包括：
 * - 几何体创建：Box（立方体）、Plane（平面）等基础几何体
 * - 几何体缓存：相同尺寸的几何体只创建一次，避免重复
 * - 几何体复用：多个 Mesh 可以共享同一个几何体实例
 * - 资源清理：统一释放所有几何体，防止内存泄漏
 *
 * 设计原则：
 * - 缓存优先：优先从缓存获取几何体，减少 GPU 内存占用
 * - 与 MaterialManager 配合：几何体 + 材质 = 完整的 Mesh
 *
 * 使用示例：
 * ```typescript
 * const geometryFactory = new GeometryFactory()
 *
 * // 获取 1x2x1 的立方体（会自动缓存）
 * const boxGeometry = geometryFactory.getBoxGeometry({ width: 1, height: 2, depth: 1 })
 *
 * // 再次获取相同尺寸，直接返回缓存
 * const sameGeometry = geometryFactory.getBoxGeometry({ width: 1, height: 2, depth: 1 })
 * console.log(boxGeometry === sameGeometry) // true
 *
 * // 清理所有几何体
 * geometryFactory.dispose()
 * ```
 */

import * as THREE from 'three'

// ============================================================================
// 类型定义
// ============================================================================

export interface BoxGeometryOptions {
  /** 宽度 */
  width?: number
  /** 高度 */
  height?: number
  /** 深度 */
  depth?: number
}

export interface PlaneGeometryOptions {
  width?: number
  height?: number
}

export class GeometryFactory {
  // ==========================================================================
  // 私有属性 - 几何体缓存
  // ==========================================================================

  /** Box 几何体缓存 */
  private boxCache: Map<string, THREE.BoxGeometry> = new Map()

  /** Plane 几何体缓存 */
  private planeCache: Map<string, THREE.PlaneGeometry> = new Map()

  // ==========================================================================
  // 公共方法 - 获取几何体
  // ==========================================================================

  /**
   * 获取 Box 几何体（立方体/长方体）
   *
   * 如果缓存中存在相同尺寸的几何体，直接返回缓存的实例
   * 否则创建新几何体并加入缓存
   *
   * @param options - 几何体配置
   * @returns BoxGeometry 实例
   */
  public getBoxGeometry(options: BoxGeometryOptions = {}): THREE.BoxGeometry {
    // 步骤 1: 生成缓存键
    const key = this.generateBoxKey(options)

    // 步骤 2: 检查缓存
    const cached = this.boxCache.get(key)
    if (cached) {
      return cached
    }

    // 步骤 3: 创建新几何体
    const width = options.width ?? 1 // 默认宽度 1
    const height = options.height ?? 1 // 默认高度 1
    const depth = options.depth ?? 1 // 默认深度 1
    const geometry = new THREE.BoxGeometry(width, height, depth)

    // 步骤 4: 存入缓存
    this.boxCache.set(key, geometry)

    return geometry
  }

  /**
   * 获取 Plane 几何体（平面）
   *
   * 平面几何体常用于：
   * - 地板、墙壁
   * - 2D 图片展示
   * - UI 面板
   *
   * @param options - 几何体配置
   * @returns PlaneGeometry 实例
   */
  public getPlaneGeometry(options: PlaneGeometryOptions = {}): THREE.PlaneGeometry {
    // 步骤 1: 生成缓存键
    const key = this.generatePlaneKey(options)

    // 步骤 2: 检查缓存
    const cached = this.planeCache.get(key)
    if (cached) {
      return cached
    }

    // 步骤 3: 创建新几何体
    const width = options.width ?? 1 // 默认宽度 1
    const height = options.height ?? 1 // 默认高度 1
    const geometry = new THREE.PlaneGeometry(width, height)

    // 步骤 4: 存入缓存
    this.planeCache.set(key, geometry)

    return geometry
  }

  // ==========================================================================
  // 私有方法 - 缓存键生成
  // ==========================================================================

  /**
   * 生成 Box 几何体的缓存键
   *
   * 将尺寸参数转换为唯一字符串，相同尺寸 = 相同 key = 缓存命中
   */
  private generateBoxKey(options: BoxGeometryOptions): string {
    // 提取尺寸值，使用默认值（与 Three.js BoxGeometry 默认值一致）
    const width = options.width ?? 1
    const height = options.height ?? 1
    const depth = options.depth ?? 1

    // 拼接成缓存键，前缀 'box' 表示 Box 几何体
    return `box_${width}_${height}_${depth}`
  }

  /**
   * 生成 Plane 几何体的缓存键
   *
   * 将尺寸参数转换为唯一字符串
   */
  private generatePlaneKey(options: PlaneGeometryOptions): string {
    // 提取尺寸值，使用默认值
    const width = options.width ?? 1
    const height = options.height ?? 1

    // 拼接成缓存键，前缀 'plane' 表示 Plane 几何体
    return `plane_${width}_${height}`
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 清理所有缓存的几何体
   *
   * 释放 GPU 资源，防止内存泄漏
   * 应在场景销毁时调用
   */
  public dispose(): void {
    // 步骤 1: 清理 Box 几何体缓存
    this.boxCache.forEach((geometry) => {
      geometry.dispose()
    })
    this.boxCache.clear()

    // 步骤 2: 清理 Plane 几何体缓存
    this.planeCache.forEach((geometry) => {
      geometry.dispose()
    })
    this.planeCache.clear()

    // 注意：几何体的 dispose() 会释放 GPU 中的顶点缓冲区
  }

  /**
   * 获取缓存统计
   */
  public getCacheSize(): { box: number; plane: number } {
    return {
      box: this.boxCache.size,
      plane: this.planeCache.size
    }
  }
}