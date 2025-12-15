/**
 * 对象池
 *
 * 这个类负责管理 3D 对象的复用，包括：
 * - 对象获取：从池中取出可用对象，池空则创建新的
 * - 对象归还：将不再使用的对象放回池中
 * - 减少 GC：避免频繁 new/dispose 造成的性能开销
 *
 * 设计原则：
 * - 泛型设计：支持任意 THREE.Object3D 子类
 * - 工厂模式：通过工厂函数创建新对象
 * - 容量限制：防止池无限增长占用内存
 *
 * 使用示例：
 * ```typescript
 * // 创建 Mesh 对象池
 * const meshPool = new ObjectPool(() => {
 *   const geometry = new THREE.BoxGeometry(1, 1, 1)
 *   const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
 *   return new THREE.Mesh(geometry, material)
 * }, { initialSize: 10, maxSize: 100 })
 *
 * // 获取对象
 * const mesh = meshPool.acquire()
 * scene.add(mesh)
 *
 * // 归还对象
 * scene.remove(mesh)
 * meshPool.release(mesh)
 * ```
 */

import * as THREE from 'three'

// ============================================================================
// 类型定义
// ============================================================================

/** 对象池配置 */
export interface ObjectPoolOptions {
  /** 初始池大小（预创建的对象数量） */
  initialSize?: number
  /** 最大池大小（防止内存无限增长） */
  maxSize?: number
}

// ============================================================================
// ObjectPool 类
// ============================================================================

export class ObjectPool<T extends THREE.Object3D> {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** 可用对象池（存放已归还、可复用的对象） */
  private pool: T[] = []

  /** 对象创建工厂函数 */
  private factory: () => T

  /** 最大池大小 */
  private maxSize: number

  /** 已创建的对象总数（用于统计） */
  private createdCount: number = 0

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建对象池
   *
   * @param factory - 对象创建工厂函数，池空时调用此函数创建新对象
   * @param options - 池配置选项
   */
  constructor(factory: () => T, options: ObjectPoolOptions = {}) {
    // 步骤 1: 保存工厂函数
    this.factory = factory

    // 步骤 2: 设置最大池大小（默认 100）
    this.maxSize = options.maxSize ?? 100

    // 步骤 3: 预创建初始对象
    const initialSize = options.initialSize ?? 0
    for (let i = 0; i < initialSize; i++) {
      // 创建对象并放入池中
      this.pool.push(this.factory())
      this.createdCount++
    }
  }

  // ==========================================================================
  // 公共方法
  // ==========================================================================

  /**
   * 获取对象
   *
   * 从池中取出一个可用对象，如果池为空则创建新对象
   *
   * @returns 可用的对象实例
   */
  public acquire(): T {
    // 步骤 1: 检查池中是否有可用对象
    if (this.pool.length > 0) {
      // 从池中取出最后一个对象
      // 使用 pop() 而不是 shift()，因为 pop() 是 O(1)，shift() 是 O(n)
      return this.pool.pop()!
    }

    // 步骤 2: 池为空，创建新对象
    this.createdCount++
    return this.factory()
  }

  /**
   * 归还对象
   *
   * 将不再使用的对象放回池中，供下次复用
   * 如果池已满（达到 maxSize），则直接丢弃
   *
   * @param obj - 要归还的对象
   */
  public release(obj: T): void {
    // 步骤 1: 检查池是否已满
    // 防止池无限增长占用内存
    if (this.pool.length >= this.maxSize) {
      return // 池已满，直接丢弃
    }

    // 步骤 2: 重置对象状态
    // 确保下次获取时对象处于"干净"状态
    obj.position.set(0, 0, 0) // 重置位置到原点
    obj.rotation.set(0, 0, 0) // 重置旋转
    obj.scale.set(1, 1, 1) // 重置缩放
    obj.visible = true // 确保可见

    // 步骤 3: 放回池中
    this.pool.push(obj)
  }

  /**
   * 清理对象池
   *
   * 释放所有池中的对象
   */
  public dispose(): void {
    // 步骤 1: 遍历池中所有对象，释放资源
    this.pool.forEach((obj) => {
      // 如果对象是 Mesh，释放其几何体和材质
      if (obj instanceof THREE.Mesh) {
        // 释放几何体（顶点缓冲区）
        obj.geometry?.dispose()

        // 释放材质（着色器程序）
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose()
        }
      }
    })

    // 步骤 2: 清空池
    this.pool = []

    // 步骤 3: 重置计数器
    this.createdCount = 0
  }

  // ==========================================================================
  // 公共访问器
  // ==========================================================================

  /** 获取当前池中可用对象数量 */
  public getAvailableCount(): number {
    return this.pool.length
  }

  /** 获取已创建的对象总数 */
  public getCreatedCount(): number {
    return this.createdCount
  }
}