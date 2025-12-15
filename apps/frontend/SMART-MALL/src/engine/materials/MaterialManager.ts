/**
 * 材质管理器
 *
 * 这个类负责管理 3D 场景中的材质，包括：
 * - 材质创建：根据配置创建不同类型的材质
 * - 材质缓存：相同配置的材质只创建一次，避免重复
 * - 材质复用：多个对象可以共享同一个材质实例
 * - 资源清理：统一释放所有材质，防止内存泄漏
 *
 * 设计原则：
 * - 单例模式：整个应用只需要一个材质管理器
 * - 缓存优先：优先从缓存获取材质，减少创建开销
 * - 类型安全：使用 TypeScript 确保材质配置正确
 *
 * 使用示例：
 * ```typescript
 * const materialManager = new MaterialManager()
 *
 * // 获取标准材质（会自动缓存）
 * const material = materialManager.getStandardMaterial({
 *   color: 0xff0000,
 *   roughness: 0.5
 * })
 *
 * // 清理所有材质
 * materialManager.dispose()
 * ```
 */

import * as THREE from 'three'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 标准材质配置选项
 * 用于创建 MeshStandardMaterial
 */
export interface StandardMaterialOptions {
  /** 材质颜色（十六进制，如 0xff0000） */
  color?: number
  /** 粗糙度（0-1，0=光滑镜面，1=完全粗糙） */
  roughness?: number
  /** 金属度（0-1，0=非金属，1=金属） */
  metalness?: number
  /** 透明度（0-1，0=完全透明，1=不透明） */
  opacity?: number
  /** 是否透明 */
  transparent?: boolean
  /** 自发光颜色 */
  emissive?: number
  /** 自发光强度 */
  emissiveIntensity?: number
}

/**
 * 基础材质配置选项
 * 用于创建 MeshBasicMaterial（不受光照影响）
 */
export interface BasicMaterialOptions {
  /** 材质颜色 */
  color?: number
  /** 透明度 */
  opacity?: number
  /** 是否透明 */
  transparent?: boolean
  /** 是否显示线框 */
  wireframe?: boolean
}

// ============================================================================
// MaterialManager 类
// ============================================================================

export class MaterialManager {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /**
   * 标准材质缓存
   * 
   * 数据结构：Map<缓存键, 材质实例>
   * 缓存键由材质配置生成，相同配置 = 相同缓存键
   */
  private standardMaterialCache: Map<string, THREE.MeshStandardMaterial> = new Map()

  /**
   * 基础材质缓存
   */
  private basicMaterialCache: Map<string, THREE.MeshBasicMaterial> = new Map()

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  constructor() {
    // 材质管理器初始化
  }

  // ==========================================================================
  // 公共方法 - 获取材质
  // ==========================================================================

  /**
   * 获取标准材质
   *
   * 如果缓存中存在相同配置的材质，直接返回缓存的实例
   * 否则创建新材质并加入缓存
   *
   * @param options - 材质配置选项
   * @returns MeshStandardMaterial 实例
   */
  public getStandardMaterial(options: StandardMaterialOptions = {}): THREE.MeshStandardMaterial {
    // 步骤 1: 生成缓存键
    // 相同配置会生成相同的 key
    const key = this.generateStandardKey(options)

    // 步骤 2: 检查缓存
    // 如果缓存中已存在，直接返回（复用材质）
    const cached = this.standardMaterialCache.get(key)
    if (cached) {
      return cached
    }

    // 步骤 3: 创建新材质
    // 缓存未命中，需要创建新的材质实例
    const material = this.createStandardMaterial(options)

    // 步骤 4: 存入缓存
    // 下次相同配置可以直接复用
    this.standardMaterialCache.set(key, material)

    return material
  }

  /**
   * 获取基础材质
   *
   * 基础材质不受光照影响，适合用于：
   * - 辅助线、网格
   * - 始终可见的标记
   * - 性能要求高的场景
   *
   * @param options - 材质配置选项
   * @returns MeshBasicMaterial 实例
   */
  public getBasicMaterial(options: BasicMaterialOptions = {}): THREE.MeshBasicMaterial {
    // 步骤 1: 生成缓存键
    const key = this.generateBasicKey(options)

    // 步骤 2: 检查缓存
    const cached = this.basicMaterialCache.get(key)
    if (cached) {
      return cached
    }

    // 步骤 3: 创建新材质
    const material = this.createBasicMaterial(options)

    // 步骤 4: 存入缓存
    this.basicMaterialCache.set(key, material)

    return material
  }

  // ==========================================================================
  // 私有方法 - 缓存键生成
  // ==========================================================================

  /**
   * 生成标准材质的缓存键
   *
   * 将配置对象转换为字符串，作为 Map 的 key
   * 相同配置会生成相同的 key，实现缓存命中
   *
   * @param options - 材质配置
   * @returns 缓存键字符串
   */
  private generateStandardKey(options: StandardMaterialOptions): string {
    // ========================================================================
    // 缓存键生成原理：
    // 将材质配置转换为唯一字符串，相同配置 = 相同字符串 = 缓存命中
    // 这样可以避免创建重复的材质实例，节省 GPU 内存
    // ========================================================================

    // 步骤 1: 提取配置值，使用默认值填充未定义的属性
    // 为什么要用默认值？
    // - 确保相同视觉效果的材质生成相同的 key
    // - 例如：{ color: 0xffffff } 和 {} 应该是同一个材质
    const color = options.color ?? 0xffffff // 默认白色
    const roughness = options.roughness ?? 1.0 // 默认完全粗糙
    const metalness = options.metalness ?? 0.0 // 默认非金属
    const opacity = options.opacity ?? 1.0 // 默认不透明
    const transparent = options.transparent ?? false // 默认不透明
    const emissive = options.emissive ?? 0x000000 // 默认无自发光
    const emissiveIntensity = options.emissiveIntensity ?? 1.0 // 默认强度 1

    // 步骤 2: 按固定顺序拼接成字符串
    // 为什么用固定顺序？
    // - 对象属性顺序可能不同，但我们需要相同配置生成相同 key
    // - 前缀 'std' 表示标准材质，与基础材质区分
    return `std_${color}_${roughness}_${metalness}_${opacity}_${transparent}_${emissive}_${emissiveIntensity}`
  }

  /**
   * 生成基础材质的缓存键
   *
   * 基础材质属性较少，缓存键也更简单
   *
   * @param options - 材质配置
   * @returns 缓存键字符串
   */
  private generateBasicKey(options: BasicMaterialOptions): string {
    // 步骤 1: 提取配置值，使用默认值
    // 基础材质只有 4 个常用属性
    const color = options.color ?? 0xffffff // 默认白色
    const opacity = options.opacity ?? 1.0 // 默认不透明
    const transparent = options.transparent ?? false // 默认不透明
    const wireframe = options.wireframe ?? false // 默认实心（非线框）

    // 步骤 2: 拼接成缓存键
    // 前缀 'basic' 表示基础材质，与标准材质区分
    return `basic_${color}_${opacity}_${transparent}_${wireframe}`
  }

  // ==========================================================================
  // 私有方法 - 材质创建
  // ==========================================================================

  /**
   * 创建标准材质
   *
   * MeshStandardMaterial 是 Three.js 中最常用的 PBR（基于物理的渲染）材质
   * 它支持光照、阴影、反射等真实感效果
   *
   * @param options - 材质配置
   * @returns 新创建的 MeshStandardMaterial
   */
  private createStandardMaterial(options: StandardMaterialOptions): THREE.MeshStandardMaterial {
    // 创建材质实例，传入配置参数
    // Three.js 会自动处理未定义的属性，使用其内部默认值
    return new THREE.MeshStandardMaterial({
      // 基础颜色
      color: options.color ?? 0xffffff,
      // 粗糙度：0=光滑镜面，1=完全粗糙（漫反射）
      roughness: options.roughness ?? 1.0,
      // 金属度：0=非金属（塑料、木头），1=金属
      metalness: options.metalness ?? 0,
      // 透明度：0=完全透明，1=不透明
      opacity: options.opacity ?? 1.0,
      // 是否启用透明：如果 opacity < 1，需要设为 true
      transparent: options.transparent ?? false,
      // 自发光颜色：让物体自己发光，不受环境光影响
      emissive: options.emissive ?? 0x000000,
      // 自发光强度
      emissiveIntensity: options.emissiveIntensity ?? 1.0
    })
  }

  /**
   * 创建基础材质
   *
   * MeshBasicMaterial 是最简单的材质，不受光照影响
   * 适用场景：
   * - 辅助线、网格线
   * - 始终可见的标记、图标
   * - 性能要求高的大量对象
   *
   * @param options - 材质配置
   * @returns 新创建的 MeshBasicMaterial
   */
  private createBasicMaterial(options: BasicMaterialOptions): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      // 基础颜色
      color: options.color ?? 0xffffff,
      // 透明度
      opacity: options.opacity ?? 1.0,
      // 是否启用透明
      transparent: options.transparent ?? false,
      // 线框模式：true=只显示边框线，false=实心填充
      wireframe: options.wireframe ?? false
    })
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 清理所有缓存的材质
   *
   * 释放 GPU 资源，防止内存泄漏
   * 应在场景销毁时调用
   */
  public dispose(): void {
    // 步骤 1: 清理标准材质缓存
    // 遍历所有缓存的材质，调用 dispose() 释放 GPU 资源
    this.standardMaterialCache.forEach((material) => {
      material.dispose()
    })
    // 清空 Map
    this.standardMaterialCache.clear()

    // 步骤 2: 清理基础材质缓存
    this.basicMaterialCache.forEach((material) => {
      material.dispose()
    })
    this.basicMaterialCache.clear()

    // 注意：材质的 dispose() 会释放 GPU 中的着色器程序
    // 如果材质有纹理，纹理需要单独 dispose()
  }

  // ==========================================================================
  // 公共访问器
  // ==========================================================================

  /**
   * 获取缓存的材质数量
   * 用于调试和性能监控
   */
  public getCacheSize(): { standard: number; basic: number } {
    return {
      standard: this.standardMaterialCache.size,
      basic: this.basicMaterialCache.size
    }
  }
}
