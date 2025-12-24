/**
 * 导航行为
 *
 * 职责：
 * - 连接语义层和相机控制层
 * - 通过语义对象 ID 导航到店铺/区域/楼层
 * - 计算目标位置并控制相机平滑移动
 *
 * 设计原则：
 * - 领域层不直接操作 Three.js 渲染
 * - 通过 MeshRegistry 获取目标位置
 * - 委托相机控制器执行动画
 * - 所有楼层始终可见，通过相机移动实现连续空间体验
 *
 * @example
 * ```typescript
 * const navigationBehavior = new NavigationBehavior(
 *   meshRegistry,
 *   cameraController
 * )
 *
 * // 导航到店铺（近距离斜向俯视）
 * navigationBehavior.navigateToStore('store_1_xxx')
 *
 * // 导航到区域（中距离俯视）
 * navigationBehavior.navigateToArea('area_1_xxx')
 *
 * // 导航到楼层（远距离垂直俯视，连续过渡）
 * navigationBehavior.navigateToFloor('floor_2_xxx')
 * ```
 */

import * as THREE from 'three'
import type { MeshRegistry } from '../registry'
import type { OrbitController } from '@/engine/camera/OrbitController'

// =============================================================================
// 类型定义
// =============================================================================

/** 导航配置选项 */
export interface NavigationOptions {
  /** 动画持续时间（毫秒），默认 1000 */
  duration?: number
  /** 相机距离目标的水平距离，默认 10 */
  distance?: number
  /** 相机相对目标的高度偏移，默认 3（略高于目标） */
  heightOffset?: number
  /** 楼层高度限制（相机不会超过此高度），可选 */
  maxHeight?: number
  /** 每帧渲染回调（用于触发引擎渲染） */
  onUpdate?: () => void
}

/** 导航结果 */
export interface NavigationResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息（失败时） */
  message?: string
}

// =============================================================================
// NavigationBehavior 类
// =============================================================================

export class NavigationBehavior {
  // ===========================================================================
  // 私有属性
  // ===========================================================================

  /** Mesh 注册表，用于获取目标对象 */
  private meshRegistry: MeshRegistry

  /** 相机控制器，用于执行相机动画 */
  private cameraController: OrbitController

  /** 是否正在导航中 */
  private _isNavigating: boolean = false

  /** 当前动画 ID（用于取消动画） */
  private animationId: number | null = null

  // ===========================================================================
  // 默认配置
  // ===========================================================================

  /** 默认导航配置 */
  private static readonly DEFAULT_OPTIONS: Required<NavigationOptions> = {
    duration: 1000,
    distance: 15,
    heightOffset: 8,
    maxHeight: Infinity,
    onUpdate: () => {},
  }

  // ===========================================================================
  // 构造函数
  // ===========================================================================

  /**
   * 创建导航行为实例
   *
   * @param meshRegistry - Mesh 注册表
   * @param cameraController - 相机控制器
   */
  constructor(meshRegistry: MeshRegistry, cameraController: OrbitController) {
    this.meshRegistry = meshRegistry
    this.cameraController = cameraController
  }

  // ===========================================================================
  // 公共方法 - 导航
  // ===========================================================================

  /**
   * 导航到店铺
   *
   * @param semanticId - 店铺语义对象 ID
   * @param options - 导航配置选项
   * @returns 导航结果
   */
  public navigateToStore(
    semanticId: string,
    options?: NavigationOptions
  ): NavigationResult {
    return this.navigateToObject(semanticId, options)
  }

  /**
   * 导航到区域
   *
   * @param semanticId - 区域语义对象 ID
   * @param options - 导航配置选项
   * @returns 导航结果
   */
  public navigateToArea(
    semanticId: string,
    options?: NavigationOptions
  ): NavigationResult {
    // 区域通常需要更远的视角
    const areaOptions: NavigationOptions = {
      distance: 18,
      heightOffset: 5,
      ...options,
    }
    return this.navigateToObject(semanticId, areaOptions)
  }

  /**
   * 导航到楼层
   * 相机移动到楼层内部，斜向观察整个楼层
   * 相机高度不会超过楼层天花板，避免被上层遮挡
   *
   * @param semanticId - 楼层语义对象 ID
   * @param options - 导航配置选项
   * @returns 导航结果
   *
   * @example
   * ```typescript
   * // 从 1F 平滑移动到 2F
   * navigationBehavior.navigateToFloor('floor_2_xxx')
   * ```
   */
  public navigateToFloor(
    semanticId: string,
    options?: NavigationOptions
  ): NavigationResult {
    // 楼层导航：更远的距离，但高度受限
    const floorOptions: NavigationOptions = {
      distance: 25,
      heightOffset: 6, // 楼层内部高度
      duration: 1500,
      ...options,
    }
    return this.navigateToObject(semanticId, floorOptions)
  }

  // ===========================================================================
  // 公共方法 - 状态查询
  // ===========================================================================

  /**
   * 是否正在导航中
   */
  public get isNavigating(): boolean {
    return this._isNavigating
  }

  /**
   * 取消当前导航
   */
  public cancelNavigation(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this._isNavigating = false
  }

  // ===========================================================================
  // 私有方法 - 核心导航逻辑
  // ===========================================================================

  /**
   * 导航到指定语义对象
   *
   * @param semanticId - 语义对象 ID
   * @param options - 导航配置
   * @returns 导航结果
   */
  private navigateToObject(
    semanticId: string,
    options?: NavigationOptions
  ): NavigationResult {
    // 1. 获取目标 Mesh
    const mesh = this.meshRegistry.getMesh(semanticId)
    if (!mesh) {
      return {
        success: false,
        message: `找不到目标对象: ${semanticId}`,
      }
    }

    // 2. 合并配置
    const config = {
      ...NavigationBehavior.DEFAULT_OPTIONS,
      ...options,
    }

    // 3. 计算目标相机位置
    const targetPosition = this.calculateCameraPosition(mesh, config)
    const lookAtPosition = this.getMeshCenter(mesh)

    // 4. 执行相机动画
    this.animateCameraTo(targetPosition, lookAtPosition, config.duration, config.onUpdate)

    return { success: true }
  }

  /**
   * 计算相机目标位置
   * 相机位于目标的右前方斜上角，45度俯视
   * 这样目标始终在画面中心偏下位置，视野开阔
   *
   * @param mesh - 目标 Mesh
   * @param config - 导航配置
   * @returns 相机目标位置
   */
  private calculateCameraPosition(
    mesh: THREE.Object3D,
    config: Required<NavigationOptions>
  ): THREE.Vector3 {
    const center = this.getMeshCenter(mesh)

    // 相机位于目标的右前方斜上角
    // X: 目标右侧 (+ distance * 0.5)
    // Y: 目标上方 (+ heightOffset)
    // Z: 目标前方 (+ distance * 0.866，约 cos(30°))
    const cameraX = center.x + config.distance * 0.5
    const cameraZ = center.z + config.distance * 0.866

    // 计算相机高度
    let cameraY = center.y + config.heightOffset
    if (config.maxHeight !== Infinity) {
      cameraY = Math.min(cameraY, config.maxHeight)
    }

    return new THREE.Vector3(cameraX, cameraY, cameraZ)
  }

  /**
   * 获取 Mesh 中心点
   *
   * @param mesh - 目标 Mesh
   * @returns 中心点世界坐标
   */
  private getMeshCenter(mesh: THREE.Object3D): THREE.Vector3 {
    const box = new THREE.Box3().setFromObject(mesh)
    const center = new THREE.Vector3()
    box.getCenter(center)
    return center
  }

  /**
   * 执行相机动画
   * 使用线性插值平滑移动相机
   *
   * @param targetPosition - 目标相机位置
   * @param lookAtPosition - 相机看向的位置
   * @param duration - 动画持续时间（毫秒）
   * @param onUpdate - 每帧更新回调
   */
  private animateCameraTo(
    targetPosition: THREE.Vector3,
    lookAtPosition: THREE.Vector3,
    duration: number,
    onUpdate: () => void
  ): void {
    // 取消之前的动画
    this.cancelNavigation()

    const camera = this.cameraController.getCamera()
    const startPosition = camera.position.clone()
    const startTime = performance.now()

    this._isNavigating = true

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用 easeOutCubic 缓动函数
      const eased = 1 - Math.pow(1 - progress, 3)

      // 插值相机位置
      camera.position.lerpVectors(startPosition, targetPosition, eased)

      // 相机始终看向目标
      camera.lookAt(lookAtPosition)

      // 触发渲染更新
      onUpdate()

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        this._isNavigating = false
        this.animationId = null
      }
    }

    this.animationId = requestAnimationFrame(animate)
  }

  // ===========================================================================
  // 资源清理
  // ===========================================================================

  /**
   * 清理资源
   */
  public dispose(): void {
    this.cancelNavigation()
  }
}
