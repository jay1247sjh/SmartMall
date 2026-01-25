/**
 * ============================================================================
 * 商城建模器引擎 (MallBuilderEngine)
 * ============================================================================
 *
 * 继承自通用 3D 引擎 ThreeEngine，专门为商城建模器场景定制。
 *
 * 【设计原则】
 * - 继承 ThreeEngine 的所有基础 3D 能力
 * - 添加商城建模器特有的功能（网格、地板、轮廓渲染等）
 * - 优化相机控制参数，适合俯视建模操作
 * - 提供区域绘制预览功能
 *
 * 【核心功能】
 * 1. 网格辅助线 - 帮助用户对齐和定位
 * 2. 地板平面 - 提供视觉参照
 * 3. 商城轮廓渲染 - 显示商城边界
 * 4. 区域预览 - 绘制时实时显示预览效果
 * 5. 相机控制优化 - 俯视角度、缩放限制等
 *
 * 【使用示例】
 * ```typescript
 * const engine = new MallBuilderEngine(containerElement)
 * engine.start()
 *
 * // 更新网格位置（跟随商城轮廓中心）
 * engine.updateSceneCenter(centerX, centerZ)
 *
 * // 设置绘制预览
 * engine.setDrawPreview(points, color)
 *
 * // 清除预览
 * engine.clearDrawPreview()
 *
 * // 销毁引擎
 * engine.dispose()
 * ```
 *
 * ============================================================================
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ThreeEngine, type EngineOptions } from '@/engine/ThreeEngine'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 商城建模器引擎配置选项
 */
export interface MallBuilderEngineOptions extends EngineOptions {
  /** 网格大小（默认 120） */
  gridSize?: number
  /** 网格分割数（默认 120） */
  gridDivisions?: number
  /** 网格主线颜色（默认 0x1f1f1f） */
  gridCenterLineColor?: number
  /** 网格线颜色（默认 0x151515） */
  gridLineColor?: number
  /** 地板大小（默认 140） */
  groundSize?: number
  /** 地板颜色（默认 0x0d0d0d） */
  groundColor?: number
  /** 相机初始位置 */
  cameraPosition?: { x: number; y: number; z: number }
  /** 轨道控制器目标点 */
  orbitTarget?: { x: number; y: number; z: number }
  /** 最小缩放距离（默认 10） */
  minDistance?: number
  /** 最大缩放距离（默认 500） */
  maxDistance?: number
  /** 最大俯仰角（默认 Math.PI / 2.2，限制不能看到地面下方） */
  maxPolarAngle?: number
  /** 是否默认启用轨道控制（默认 false） */
  orbitEnabled?: boolean
}

/**
 * 2D 点坐标
 */
export interface Point2D {
  x: number
  y: number
}

// ============================================================================
// MallBuilderEngine 类
// ============================================================================

export class MallBuilderEngine extends ThreeEngine {
  // ==========================================================================
  // 私有属性 - 建模器特有对象
  // ==========================================================================

  /** 网格辅助线 */
  private gridHelper: THREE.GridHelper | null = null

  /** 地板网格 */
  private groundMesh: THREE.Mesh | null = null

  /** 绘制预览网格 */
  private previewMesh: THREE.Mesh | null = null

  /** 绘制预览轮廓线 */
  private previewOutline: THREE.Line | null = null

  /** 轨道控制器（建模器专用，带更多配置） */
  private builderOrbitControls: OrbitControls | null = null

  /** 配置选项 */
  private builderOptions: MallBuilderEngineOptions

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建商城建模器引擎实例
   *
   * @param container - 用于挂载 3D 画布的 DOM 元素
   * @param options - 建模器引擎配置选项
   */
  constructor(container: HTMLElement, options: MallBuilderEngineOptions = {}) {
    // 调用父类构造函数，设置深色背景
    super(container, {
      backgroundColor: options.backgroundColor ?? 0x0a0a0a,
      antialias: options.antialias ?? true,
      maxPixelRatio: options.maxPixelRatio ?? 2,
      cameraMode: 'orbit',
    })

    // 保存配置
    this.builderOptions = options

    // 配置建模器专用的相机和控制器
    this.setupBuilderCamera()
    this.setupBuilderOrbitControls()

    // 添加建模器专用的场景元素
    this.setupBuilderGrid()
    this.setupBuilderGround()
    this.setupBuilderLights()
  }

  // ==========================================================================
  // 初始化方法（私有）
  // ==========================================================================

  /**
   * 配置建模器专用相机
   *
   * 商城建模器需要更大的俯视角度，以便查看整个商城布局
   */
  private setupBuilderCamera(): void {
    const camera = this.camera
    const opts = this.builderOptions

    // 设置更小的视野角度（50度），获得更好的俯视效果
    camera.fov = 50
    camera.updateProjectionMatrix()

    // 设置相机初始位置（默认从正上方稍微偏移）
    const pos = opts.cameraPosition ?? { x: 0, y: 100, z: 60 }
    camera.position.set(pos.x, pos.y, pos.z)

    // 让相机看向场景中心
    camera.lookAt(0, 0, 0)
  }

  /**
   * 配置建模器专用轨道控制器
   *
   * 建模器需要更精细的控制器配置：
   * - 限制缩放范围
   * - 限制俯仰角度（不能看到地面下方）
   * - 支持屏幕空间平移
   * - 默认禁用（只在平移工具模式下启用）
   */
  private setupBuilderOrbitControls(): void {
    const opts = this.builderOptions

    // 创建轨道控制器
    this.builderOrbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    )

    const controls = this.builderOrbitControls

    // 启用阻尼（惯性效果）
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // 启用屏幕空间平移（更自然的平移体验）
    controls.screenSpacePanning = true

    // 设置缩放距离限制
    controls.minDistance = opts.minDistance ?? 10
    controls.maxDistance = opts.maxDistance ?? 500

    // 限制俯仰角度（不能看到地面下方）
    controls.maxPolarAngle = opts.maxPolarAngle ?? Math.PI / 2.2

    // 设置目标点（默认稍微抬高，看向楼层中心）
    const target = opts.orbitTarget ?? { x: 0, y: 6, z: 0 }
    controls.target.set(target.x, target.y, target.z)

    // 默认禁用，只在需要时启用
    controls.enabled = opts.orbitEnabled ?? false

    // 更新控制器
    controls.update()

    // 当控制器变化时请求渲染
    controls.addEventListener('change', () => {
      this.requestRender()
    })
  }

  /**
   * 设置建模器网格辅助线
   *
   * 网格帮助用户对齐和定位区域
   */
  private setupBuilderGrid(): void {
    const opts = this.builderOptions

    // 创建网格辅助线
    const size = opts.gridSize ?? 120
    const divisions = opts.gridDivisions ?? 120
    const centerLineColor = opts.gridCenterLineColor ?? 0x1f1f1f
    const lineColor = opts.gridLineColor ?? 0x151515

    this.gridHelper = new THREE.GridHelper(size, divisions, centerLineColor, lineColor)
    this.gridHelper.position.y = -0.02 // 稍微下沉，避免与地板 z-fighting
    this.gridHelper.name = 'mall-builder-grid'

    this.scene.add(this.gridHelper)
  }

  /**
   * 设置建模器地板平面
   *
   * 地板提供视觉参照，接收阴影
   */
  private setupBuilderGround(): void {
    const opts = this.builderOptions

    // 创建地板几何体
    const size = opts.groundSize ?? 140
    const geometry = new THREE.PlaneGeometry(size, size)

    // 创建地板材质
    const color = opts.groundColor ?? 0x0d0d0d
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.95,
    })

    // 创建地板网格
    this.groundMesh = new THREE.Mesh(geometry, material)
    this.groundMesh.rotation.x = -Math.PI / 2 // 旋转为水平
    this.groundMesh.position.y = -0.03 // 稍微下沉
    this.groundMesh.receiveShadow = true
    this.groundMesh.name = 'mall-builder-ground'

    this.scene.add(this.groundMesh)
  }

  /**
   * 设置建模器专用灯光
   *
   * 覆盖父类的灯光设置，使用更适合建模器的配置
   */
  private setupBuilderLights(): void {
    // 移除父类添加的灯光
    const lightsToRemove: THREE.Light[] = []
    this.scene.traverse((object) => {
      if (object instanceof THREE.Light) {
        lightsToRemove.push(object)
      }
    })
    lightsToRemove.forEach((light) => this.scene.remove(light))

    // 添加环境光（稍亮一些）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    ambientLight.name = 'mall-builder-ambient-light'
    this.scene.add(ambientLight)

    // 添加方向光（从更高的位置照射）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(30, 80, 30)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.name = 'mall-builder-directional-light'
    this.scene.add(directionalLight)
  }

  // ==========================================================================
  // 公共方法 - 场景控制
  // ==========================================================================

  /**
   * 更新场景中心位置
   *
   * 当商城轮廓改变时，调用此方法将网格、地板和相机目标点
   * 移动到新的中心位置
   *
   * @param centerX - 中心点 X 坐标
   * @param centerZ - 中心点 Z 坐标
   */
  public updateSceneCenter(centerX: number, centerZ: number): void {
    // 更新网格位置
    if (this.gridHelper) {
      this.gridHelper.position.x = centerX
      this.gridHelper.position.z = centerZ
    }

    // 更新地板位置
    if (this.groundMesh) {
      this.groundMesh.position.x = centerX
      this.groundMesh.position.z = centerZ
    }

    // 更新轨道控制器目标点
    if (this.builderOrbitControls) {
      this.builderOrbitControls.target.set(centerX, 6, centerZ)
      this.builderOrbitControls.update()
    }

    this.requestRender()
  }

  /**
   * 设置轨道控制器启用状态
   *
   * 建模器中只在特定工具模式（如平移工具）下启用轨道控制
   *
   * @param enabled - 是否启用
   */
  public setOrbitControlsEnabled(enabled: boolean): void {
    if (this.builderOrbitControls) {
      this.builderOrbitControls.enabled = enabled
    }
  }

  /**
   * 获取轨道控制器启用状态
   */
  public isOrbitControlsEnabled(): boolean {
    return this.builderOrbitControls?.enabled ?? false
  }

  /**
   * 获取轨道控制器实例
   *
   * 用于外部需要直接操作控制器的场景
   */
  public getOrbitControls(): OrbitControls | null {
    return this.builderOrbitControls
  }

  // ==========================================================================
  // 公共方法 - 绘制预览
  // ==========================================================================

  /**
   * 设置区域绘制预览
   *
   * 在用户绘制区域时，实时显示预览效果
   *
   * @param points - 2D 点坐标数组
   * @param color - 预览颜色（十六进制）
   * @param yPosition - Y 轴位置（默认 0.1）
   * @param closed - 是否闭合（默认 false）
   */
  public setDrawPreview(
    points: Point2D[],
    color: number = 0x60a5fa,
    yPosition: number = 0.1,
    closed: boolean = false
  ): void {
    // 清除旧的预览
    this.clearDrawPreview()

    if (points.length < 2) return

    // 创建预览轮廓线
    const linePoints = points.map(p => new THREE.Vector3(p.x, yPosition + 0.01, -p.y))
    if (closed && points.length >= 3 && linePoints[0]) {
      linePoints.push(linePoints[0].clone()) // 闭合
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints)
    const lineMaterial = new THREE.LineBasicMaterial({
      color,
      linewidth: 2,
    })
    this.previewOutline = new THREE.Line(lineGeometry, lineMaterial)
    this.previewOutline.name = 'draw-preview-outline'
    this.scene.add(this.previewOutline)

    // 如果有 3 个及以上的点，创建填充预览
    if (points.length >= 3) {
      const shape = new THREE.Shape()
      const firstPoint = points[0]!
      shape.moveTo(firstPoint.x, -firstPoint.y)
      for (let i = 1; i < points.length; i++) {
        const point = points[i]!
        shape.lineTo(point.x, -point.y)
      }
      shape.closePath()

      const meshGeometry = new THREE.ShapeGeometry(shape)
      const meshMaterial = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })

      this.previewMesh = new THREE.Mesh(meshGeometry, meshMaterial)
      this.previewMesh.rotation.x = -Math.PI / 2
      this.previewMesh.position.y = yPosition
      this.previewMesh.name = 'draw-preview-mesh'
      this.scene.add(this.previewMesh)
    }

    this.requestRender()
  }

  /**
   * 清除绘制预览
   */
  public clearDrawPreview(): void {
    if (this.previewOutline) {
      this.scene.remove(this.previewOutline)
      this.previewOutline.geometry.dispose()
      ;(this.previewOutline.material as THREE.Material).dispose()
      this.previewOutline = null
    }

    if (this.previewMesh) {
      this.scene.remove(this.previewMesh)
      this.previewMesh.geometry.dispose()
      ;(this.previewMesh.material as THREE.Material).dispose()
      this.previewMesh = null
    }

    this.requestRender()
  }

  /**
   * 更新绘制预览的最后一个点
   *
   * 用于跟随鼠标移动实时更新预览
   *
   * @param points - 已确定的点
   * @param currentPoint - 当前鼠标位置点
   * @param color - 预览颜色
   * @param yPosition - Y 轴位置
   */
  public updateDrawPreviewWithCursor(
    points: Point2D[],
    currentPoint: Point2D,
    color: number = 0x60a5fa,
    yPosition: number = 0.1
  ): void {
    const allPoints = [...points, currentPoint]
    this.setDrawPreview(allPoints, color, yPosition, false)
  }

  // ==========================================================================
  // 公共方法 - 场景对象管理
  // ==========================================================================

  /**
   * 清除场景中的业务对象
   *
   * 保留基础设施（网格、地板、灯光），清除其他对象
   *
   * @param preserveNames - 要保留的对象名称前缀列表
   */
  public clearSceneObjects(preserveNames: string[] = []): void {
    const defaultPreserve = [
      'mall-builder-grid',
      'mall-builder-ground',
      'mall-builder-ambient-light',
      'mall-builder-directional-light',
    ]
    const allPreserve = [...defaultPreserve, ...preserveNames]

    const objectsToRemove: THREE.Object3D[] = []

    this.scene.traverse((object) => {
      // 跳过场景本身
      if (object === this.scene) return

      // 检查是否需要保留
      const shouldPreserve = allPreserve.some(
        prefix => object.name && object.name.startsWith(prefix)
      )

      if (!shouldPreserve && object.parent === this.scene) {
        objectsToRemove.push(object)
      }
    })

    // 移除并释放资源
    objectsToRemove.forEach((object) => {
      this.scene.remove(object)
      this.disposeObject(object)
    })

    this.requestRender()
  }

  /**
   * 释放 3D 对象资源
   *
   * @param object - 要释放的对象
   */
  private disposeObject(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose()
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose())
      } else if (object.material) {
        object.material.dispose()
      }
    } else if (object instanceof THREE.Line) {
      object.geometry?.dispose()
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose())
      } else if (object.material) {
        (object.material as THREE.Material).dispose()
      }
    }

    // 递归处理子对象
    object.children.forEach(child => this.disposeObject(child))
  }

  // ==========================================================================
  // 公共方法 - 射线检测
  // ==========================================================================

  /**
   * 获取鼠标位置对应的地面坐标
   *
   * @param event - 鼠标事件
   * @returns 地面坐标（2D 点），如果没有命中返回 null
   */
  public getGroundPosition(event: MouseEvent): Point2D | null {
    const rect = this.container.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)

    // 创建一个临时的地面平面进行检测
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersection = new THREE.Vector3()

    if (raycaster.ray.intersectPlane(plane, intersection)) {
      return {
        x: intersection.x,
        y: -intersection.z, // 注意：Three.js 的 Z 轴与 2D 的 Y 轴方向相反
      }
    }

    return null
  }

  /**
   * 检测鼠标点击的对象
   *
   * @param event - 鼠标事件
   * @param filter - 过滤函数，返回 true 表示该对象可被选中
   * @returns 被点击的对象，如果没有命中返回 null
   */
  public pickObject(
    event: MouseEvent,
    filter?: (object: THREE.Object3D) => boolean
  ): THREE.Object3D | null {
    const rect = this.container.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera)

    const intersects = raycaster.intersectObjects(this.scene.children, true)

    for (const intersect of intersects) {
      if (!filter || filter(intersect.object)) {
        return intersect.object
      }
    }

    return null
  }

  // ==========================================================================
  // 重写父类方法
  // ==========================================================================

  /**
   * 销毁引擎，释放所有资源
   *
   * 重写父类方法，额外清理建模器特有的资源
   */
  public override dispose(): void {
    // 清除绘制预览
    this.clearDrawPreview()

    // 销毁轨道控制器
    if (this.builderOrbitControls) {
      this.builderOrbitControls.dispose()
      this.builderOrbitControls = null
    }

    // 清除网格和地板引用
    this.gridHelper = null
    this.groundMesh = null

    // 调用父类的销毁方法
    super.dispose()

    console.log('[MallBuilderEngine] Disposed successfully')
  }

  // ==========================================================================
  // 渲染循环更新
  // ==========================================================================

  /**
   * 每帧更新（可由外部调用或通过 onRender 回调）
   *
   * 更新轨道控制器的阻尼效果
   */
  public updateControls(): void {
    if (this.builderOrbitControls?.enabled) {
      this.builderOrbitControls.update()
    }
  }
}
