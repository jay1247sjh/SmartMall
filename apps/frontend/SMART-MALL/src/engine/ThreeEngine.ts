/**
 * Three.js 渲染引擎
 *
 * 这是整个 3D 场景的核心类，负责：
 * - 创建和管理 3D 场景（Scene）
 * - 创建和管理渲染器（Renderer）
 * - 创建和管理相机（Camera）
 * - 管理渲染循环（每帧更新画面）
 * - 提供场景操作的便捷方法
 *
 * 设计原则：
 * - 不包含业务逻辑（不认识"商城""店铺"等概念）
 * - 只提供通用的 3D 操作接口
 * - 可被替换为其他渲染引擎
 */

import * as THREE from 'three'
import { CameraController, OrbitController, createPerspectiveCamera, type ThirdPersonCameraConfig } from './camera'
import { PostProcessingPipeline, type PostProcessingOptions } from './effects/PostProcessingPipeline'
import { EnvironmentManager } from './environment/EnvironmentManager'
import { RaycasterManager } from './interaction'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 相机控制模式
 * - 'orbit': 轨道模式，相机围绕场景中心旋转，适合建模器
 * - 'follow': 跟随模式，相机跟随目标移动，适合运行时浏览
 */
export type CameraMode = 'orbit' | 'follow'

/**
 * 质量等级
 * - 'high': 全部后处理通道启用
 * - 'medium': 禁用 Bloom
 * - 'low': 禁用 SSAO 和 Bloom
 */
export type QualityLevel = 'high' | 'medium' | 'low'

/**
 * 质量等级预设配置映射
 */
export const QUALITY_PRESETS: Record<QualityLevel, {
  ssaoEnabled: boolean
  bloomEnabled: boolean
  fxaaEnabled: boolean
  shadowMapSize: number
  toneMappingExposure: number
}> = {
  high: {
    ssaoEnabled: true,
    bloomEnabled: true,
    fxaaEnabled: true,
    shadowMapSize: 2048,
    toneMappingExposure: 1.0,
  },
  medium: {
    ssaoEnabled: true,
    bloomEnabled: false,
    fxaaEnabled: true,
    shadowMapSize: 1024,
    toneMappingExposure: 1.0,
  },
  low: {
    ssaoEnabled: false,
    bloomEnabled: false,
    fxaaEnabled: true,
    shadowMapSize: 512,
    toneMappingExposure: 1.0,
  },
}

/**
 * 三点光照配置
 */
export interface ThreePointLightConfig {
  /** 主光源（Key Light） */
  keyLight: {
    color: number
    intensity: number
    position: THREE.Vector3
    castShadow: boolean
    shadowMapSize: number
    shadowCameraRange: number
  }
  /** 补光灯（Fill Light） */
  fillLight: {
    color: number
    intensity: number
    position: THREE.Vector3
  }
  /** 轮廓光（Rim Light） */
  rimLight: {
    color: number
    intensity: number
    position: THREE.Vector3
  }
  /** 半球光 */
  hemisphereLight: {
    skyColor: number
    groundColor: number
    intensity: number
  }
}

/**
 * 引擎配置选项
 */
export interface EngineOptions {
  /** 场景背景颜色（十六进制，如 0x87ceeb 天蓝色） */
  backgroundColor?: number
  /** 是否开启抗锯齿（让边缘更平滑，但会消耗更多性能） */
  antialias?: boolean
  /** 最大像素比率（限制高 DPI 设备的渲染负载，默认 2） */
  maxPixelRatio?: number
  /** 相机控制模式，默认 'orbit' */
  cameraMode?: CameraMode
  /** 色调映射算法，默认 ACESFilmicToneMapping */
  toneMapping?: THREE.ToneMapping
  /** 色调映射曝光值，默认 1.0 */
  toneMappingExposure?: number
  /** 输出色彩空间，默认 SRGBColorSpace */
  outputColorSpace?: THREE.ColorSpace
  /** 是否启用环境贴图，默认 false */
  enableEnvironmentMap?: boolean
  /** 是否启用后处理管线，默认 false */
  enablePostProcessing?: boolean
  /** 后处理管线配置选项 */
  postProcessingOptions?: PostProcessingOptions
  /** 是否启用雾效，默认 false */
  fogEnabled?: boolean
  /** 雾效颜色（十六进制），默认 0xcccccc */
  fogColor?: number
  /** 雾效近距离，默认 10 */
  fogNear?: number
  /** 雾效远距离，默认 200 */
  fogFar?: number
  /** 质量等级，默认 'high' */
  qualityLevel?: QualityLevel
}

// ============================================================================
// ThreeEngine 类
// ============================================================================

export class ThreeEngine {
  // ==========================================================================
  // 受保护属性 - 核心对象（子类可访问）
  // ==========================================================================

  /** 3D 场景，所有 3D 对象都添加到这里 */
  protected scene: THREE.Scene

  /** WebGL 渲染器，负责将场景渲染到画布上 */
  protected renderer: THREE.WebGLRenderer

  /** DOM 容器元素，渲染器的画布会挂载到这里 */
  protected container: HTMLElement

  /** 时钟，用于计算每帧的时间间隔（delta） */
  protected clock: THREE.Clock

  /** 透视相机，模拟人眼看到的 3D 效果 */
  protected camera: THREE.PerspectiveCamera

  /** 射线检测管理器，用于鼠标点击检测 */
  protected raycasterManager: RaycasterManager

  // ==========================================================================
  // 受保护属性 - 相机控制器（子类可访问）
  // ==========================================================================

  /** 轨道控制器（orbit 模式使用） */
  protected orbitController: OrbitController | null = null

  /** 第三人称跟随控制器（follow 模式使用） */
  protected cameraController: CameraController | null = null

  /** 当前相机模式 */
  protected currentMode: CameraMode = 'orbit'

  // ==========================================================================
  // 受保护属性 - 渲染循环控制（子类可访问）
  // ==========================================================================

  /** requestAnimationFrame 返回的 ID，用于取消动画 */
  protected animationFrameId: number | null = null

  /** 渲染循环是否正在运行 */
  protected isRunning: boolean = false

  /** 是否需要渲染下一帧（按需渲染优化） */
  protected needsRender: boolean = true

  /** 每帧回调函数列表 */
  protected onRenderCallbacks: Array<(delta: number) => void> = []

  // ==========================================================================
  // 受保护属性 - 环境贴图管理（子类可访问）
  // ==========================================================================

  /** 环境贴图管理器 */
  protected environmentManager: EnvironmentManager | null = null

  /** 当前加载的环境贴图引用（用于后续传递给 MaterialManager） */
  protected currentEnvMap: THREE.Texture | null = null

  // ==========================================================================
  // 受保护属性 - 后处理管线（子类可访问）
  // ==========================================================================

  /** 后处理管线 */
  protected postProcessing: PostProcessingPipeline | null = null

  // ==========================================================================
  // 受保护属性 - 质量等级（子类可访问）
  // ==========================================================================

  /** 当前质量等级 */
  protected currentQualityLevel: QualityLevel = 'high'

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建 ThreeEngine 实例
   *
   * @param container - 用于挂载 3D 画布的 DOM 元素
   * @param options - 引擎配置选项
   */
  constructor(container: HTMLElement, options: EngineOptions = {}) {
    // 保存容器引用
    this.container = container

    // 创建时钟，用于计算帧间隔
    this.clock = new THREE.Clock()

    // 设置相机模式，默认为 orbit（轨道模式）
    this.currentMode = options.cameraMode ?? 'orbit'

    // 设置质量等级，默认为 'high'
    this.currentQualityLevel = options.qualityLevel ?? 'high'

    // 按顺序初始化各个组件
    this.scene = this.createScene(options)           // 1. 创建场景
    this.renderer = this.createRenderer(options)     // 2. 创建渲染器
    this.camera = this.createCamera()                // 3. 创建相机
    this.raycasterManager = new RaycasterManager(this.camera, this.scene) // 4. 创建射线检测器

    this.initCameraController()

    // 将渲染器的画布添加到 DOM 容器中
    this.container.appendChild(this.renderer.domElement)

    // 设置光源
    this.setupLights()

    // 如果启用环境贴图，创建 EnvironmentManager
    if (options.enableEnvironmentMap) {
      this.environmentManager = new EnvironmentManager(this.renderer)
    }

    // 如果启用后处理管线，创建 PostProcessingPipeline
    if (options.enablePostProcessing) {
      try {
        this.postProcessing = new PostProcessingPipeline(
          this.renderer,
          this.scene,
          this.camera,
          options.postProcessingOptions,
        )
        // 应用初始质量等级配置到后处理通道
        this.applyQualityPreset(this.currentQualityLevel)
      } catch (e) {
        console.warn('[ThreeEngine] Failed to initialize post-processing pipeline, falling back to direct rendering:', e)
        this.postProcessing = null
      }
    }

    // 设置事件监听器
    this.setupEventListeners()
  }

  // ==========================================================================
  // 初始化方法（私有）
  // ==========================================================================

  /**
   * 创建 3D 场景
   *
   * Scene 是所有 3D 对象的容器，类似于舞台
   */
  private createScene(options: EngineOptions): THREE.Scene {
    // 创建场景实例
    const scene = new THREE.Scene()

    // 设置背景颜色，默认浅灰色 0xf0f0f0
    scene.background = new THREE.Color(options.backgroundColor ?? 0xf0f0f0)

    // 设置雾效（增强深度感知）
    if (options.fogEnabled) {
      const fogColor = options.fogColor ?? 0xcccccc
      const fogNear = options.fogNear ?? 10
      const fogFar = options.fogFar ?? 200
      scene.fog = new THREE.Fog(fogColor, fogNear, fogFar)
    }

    return scene
  }

  /**
   * 创建 WebGL 渲染器
   *
   * Renderer 负责将 3D 场景绘制到 2D 画布上
   */
  protected createRenderer(options: EngineOptions): THREE.WebGLRenderer {
    // 创建渲染器，配置抗锯齿和透明背景
    const renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,  // 抗锯齿，让边缘更平滑
      alpha: true                             // 允许透明背景
    })

    // 获取容器尺寸
    const { clientWidth: width, clientHeight: height } = this.container

    // 设置渲染器输出尺寸
    renderer.setSize(width, height)

    // 设置像素比率（高 DPI 屏幕会更清晰，但也更耗性能）
    // 限制最大值为 2，平衡清晰度和性能
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, options.maxPixelRatio ?? 2))

    // 色调映射：将 HDR 亮度范围映射到显示器可显示范围
    // 默认使用 ACESFilmicToneMapping，提供电影级色彩表现
    renderer.toneMapping = options.toneMapping ?? THREE.ACESFilmicToneMapping

    // 色调映射曝光值：控制整体亮度，默认 1.0
    renderer.toneMappingExposure = options.toneMappingExposure ?? 1.0

    // 输出色彩空间：确保颜色在 sRGB 空间正确显示
    renderer.outputColorSpace = options.outputColorSpace ?? THREE.SRGBColorSpace

    // 开启阴影
    renderer.shadowMap.enabled = true
    // 使用柔和阴影（PCF = Percentage Closer Filtering）
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    return renderer
  }

  /**
   * 创建透视相机
   *
   * 使用工厂函数创建，统一相机配置
   */
  private createCamera(): THREE.PerspectiveCamera {
    return createPerspectiveCamera(this.container)
  }

  /**
   * 初始化相机控制器
   *
   * 根据当前模式创建对应的控制器
   */
  private initCameraController(): void {
    if (this.currentMode === 'orbit') {
      // 轨道模式：创建 OrbitController
      this.orbitController = new OrbitController(this.camera, this.renderer.domElement)
      // 当相机移动时，请求重新渲染
      this.orbitController.onChange(() => this.requestRender())
    } else {
      // 跟随模式：创建 CameraController
      this.cameraController = new CameraController(this.container, this.camera)
      this.cameraController.onChange(() => this.requestRender())
    }
  }

  /**
   * 设置场景光源
   *
   * 没有光源，物体会是全黑的
   *
   * 使用三点光照系统：主光源（Key Light）、补光灯（Fill Light）、轮廓光（Rim Light）
   * 加上 HemisphereLight 模拟天空与地面的自然色彩过渡
   */
  protected setupLights(): void {
    const config = this.getDefaultLightConfig()

    // 主光源（Key Light）：场景主要照明，带阴影
    const keyLight = new THREE.DirectionalLight(config.keyLight.color, config.keyLight.intensity)
    keyLight.position.copy(config.keyLight.position)
    keyLight.castShadow = config.keyLight.castShadow
    keyLight.shadow.mapSize.width = config.keyLight.shadowMapSize
    keyLight.shadow.mapSize.height = config.keyLight.shadowMapSize
    keyLight.shadow.camera.left = -config.keyLight.shadowCameraRange
    keyLight.shadow.camera.right = config.keyLight.shadowCameraRange
    keyLight.shadow.camera.top = config.keyLight.shadowCameraRange
    keyLight.shadow.camera.bottom = -config.keyLight.shadowCameraRange
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 100
    keyLight.name = 'key-light'
    this.scene.add(keyLight)

    // 补光灯（Fill Light）：从对侧柔和补光，减少暗部对比
    const fillLight = new THREE.DirectionalLight(config.fillLight.color, config.fillLight.intensity)
    fillLight.position.copy(config.fillLight.position)
    fillLight.name = 'fill-light'
    this.scene.add(fillLight)

    // 轮廓光（Rim Light）：从背后照射，勾勒物体边缘轮廓
    const rimLight = new THREE.DirectionalLight(config.rimLight.color, config.rimLight.intensity)
    rimLight.position.copy(config.rimLight.position)
    rimLight.name = 'rim-light'
    this.scene.add(rimLight)

    // 半球光：模拟天空（暖白）与地面（冷灰）的自然色彩过渡
    const hemiLight = new THREE.HemisphereLight(
      config.hemisphereLight.skyColor,
      config.hemisphereLight.groundColor,
      config.hemisphereLight.intensity,
    )
    hemiLight.name = 'hemisphere-light'
    this.scene.add(hemiLight)
  }

  /**
   * 获取默认三点光照配置
   *
   * 子类可覆盖此方法以自定义光照参数
   */
  protected getDefaultLightConfig(): ThreePointLightConfig {
    return {
      keyLight: {
        color: 0xffffff,
        intensity: 0.8,
        position: new THREE.Vector3(10, 20, 10),
        castShadow: true,
        shadowMapSize: 2048,
        shadowCameraRange: 50,
      },
      fillLight: {
        color: 0xffffff,
        intensity: 0.3,
        position: new THREE.Vector3(-8, 10, -8),
      },
      rimLight: {
        color: 0xffffff,
        intensity: 0.4,
        position: new THREE.Vector3(0, 15, -15),
      },
      hemisphereLight: {
        skyColor: 0xffeedd,
        groundColor: 0x8899aa,
        intensity: 0.3,
      },
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听窗口大小变化，调整渲染器和相机
    window.addEventListener('resize', this.handleResize)
  }

  // ==========================================================================
  // 事件处理器（私有）
  // ==========================================================================

  /**
   * 处理窗口大小变化
   *
   * 使用箭头函数保持 this 指向
   */
  private handleResize = (): void => {
    // 获取新的容器尺寸
    const { clientWidth: width, clientHeight: height } = this.container

    // 更新相机宽高比
    this.camera.aspect = width / height
    // 更新相机投影矩阵（必须调用，否则宽高比不生效）
    this.camera.updateProjectionMatrix()

    // 更新渲染器尺寸
    this.renderer.setSize(width, height)

    // 同步更新后处理管线尺寸
    this.postProcessing?.setSize(width, height)

    // 请求重新渲染
    this.requestRender()
  }

  // ==========================================================================
  // 相机模式切换
  // ==========================================================================

  /**
   * 切换相机控制模式
   *
   * @param mode - 目标模式 'orbit' 或 'follow'
   */
  public setCameraMode(mode: CameraMode): void {
    // 如果模式相同，不做任何操作
    if (mode === this.currentMode) return

    // 销毁当前控制器，释放资源
    this.orbitController?.dispose()
    this.cameraController?.dispose()
    this.orbitController = null
    this.cameraController = null

    // 更新模式并初始化新控制器
    this.currentMode = mode
    this.initCameraController()

    // 请求重新渲染
    this.requestRender()
  }

  /**
   * 获取当前相机模式
   */
  public getCameraMode(): CameraMode {
    return this.currentMode
  }

  // ==========================================================================
  // 渲染循环
  // ==========================================================================

  /**
   * 启动渲染循环
   *
   * 渲染循环会不断调用 animate()，通常每秒 60 次（60 FPS）
   */
  public start(): void {
    // 防止重复启动
    if (this.isRunning) return

    this.isRunning = true
    // 启动时钟
    this.clock.start()
    // 开始动画循环
    this.animate()
  }

  /**
   * 停止渲染循环
   */
  public stop(): void {
    this.isRunning = false

    // 取消下一帧动画
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 请求下一帧渲染
   *
   * 这是"按需渲染"的核心：只有需要时才渲染，节省性能
   */
  public requestRender(): void {
    this.needsRender = true
  }

  /**
   * 渲染循环主函数
   *
   * 每帧被调用一次（约每秒60次），分为两个阶段：
   *
   * 【UPDATE 阶段】更新数据/状态
   * - 职责：计算新位置、新角度、动画进度等
   * - 类比：演员走位、换姿势、换表情
   * - 输出：修改内存中的数据，不产生画面
   *
   * 【RENDER 阶段】绘制画面
   * - 职责：把场景"拍照"输出到画布
   * - 类比：摄影师按下快门
   * - 输出：像素显示在屏幕上
   */
  private animate = (): void => {
    // 如果已停止，不再继续
    if (!this.isRunning) return

    // 请求下一帧动画（浏览器会在下一次重绘前调用）
    // 这行代码让 animate 形成循环，每秒约调用 60 次
    this.animationFrameId = requestAnimationFrame(this.animate)

    // 获取距离上一帧的时间间隔（秒）
    // 60fps 时 delta ≈ 0.0167 秒，用于让动画速度与帧率无关
    const delta = this.clock.getDelta()

    // ========================================================================
    // UPDATE 阶段：更新所有数据/状态（不绑制任何东西）
    // ========================================================================

    // 更新相机控制器（计算阻尼惯性，更新相机位置/角度）
    if (this.currentMode === 'orbit') {
      // 轨道控制器：处理鼠标拖拽后的惯性滑动效果
      this.orbitController?.update()
    } else {
      // 跟随控制器：计算相机跟随目标的新位置
      this.cameraController?.update()
    }

    // 执行所有注册的每帧回调（用户自定义的 update 逻辑）
    // 比如：角色移动、物体旋转、粒子动画等
    this.onRenderCallbacks.forEach((cb) => cb(delta))

    // ========================================================================
    // RENDER 阶段：绘制画面（把 UPDATE 的结果显示出来）
    // ========================================================================

    // 按需渲染：只有 needsRender 为 true 时才渲染，节省 GPU 性能
    if (this.needsRender) {
      // 后处理管线启用时使用 postProcessing.render()，否则直接渲染
      if (this.postProcessing) {
        this.postProcessing.render()
      } else {
        this.renderer.render(this.scene, this.camera)
      }
      // 重置标志，等待下次 requestRender() 调用
      this.needsRender = false
    }
  }

  // ==========================================================================
  // 跟随模式专用方法
  // ==========================================================================

  /**
   * 设置相机跟随目标（仅 follow 模式可用）
   *
   * @param target - 要跟随的 3D 对象
   * @param config - 跟随配置（可选）
   */
  public setFollowTarget(target: THREE.Object3D, config?: Partial<ThirdPersonCameraConfig>): void {
    // 检查是否在正确的模式
    if (this.currentMode !== 'follow' || !this.cameraController) {
      console.warn('setFollowTarget 只在 follow 模式下可用')
      return
    }
    this.cameraController.setFollowTarget(target, config)
  }

  /**
   * 清除跟随目标
   */
  public clearFollowTarget(): void {
    this.cameraController?.clearFollowTarget()
  }

  // ==========================================================================
  // 环境贴图
  // ==========================================================================

  /**
   * 加载并应用 HDR 环境贴图
   *
   * 懒创建 EnvironmentManager（如果尚未创建）。
   * 加载成功后将环境贴图应用到场景，并存储引用供后续使用。
   *
   * @param url - HDR 文件路径
   */
  public async loadEnvironmentMap(url: string): Promise<void> {
    // 懒创建 EnvironmentManager
    if (!this.environmentManager) {
      this.environmentManager = new EnvironmentManager(this.renderer)
    }

    const envMap = await this.environmentManager.loadHDR(url)

    if (envMap) {
      this.environmentManager.applyToScene(this.scene)
      this.currentEnvMap = envMap

      // TODO: Task 5.1 — 调用 materialManager.setGlobalEnvMap(envMap)
      // 将环境贴图传递给 MaterialManager，使所有 PBR 材质自动获得环境反射

      this.requestRender()
    }
  }

  // ==========================================================================
  // 场景操作方法
  // ==========================================================================

  /**
   * 添加地板网格辅助线
   *
   * 网格可以帮助你判断物体的位置和大小
   *
   * @param size - 网格总大小（默认 50）
   * @param divisions - 网格分割数（默认 50）
   */
  public addGridHelper(size: number = 50, divisions: number = 50): void {
    // 创建网格辅助对象
    // 参数：大小, 分割数, 中心线颜色, 网格线颜色
    const grid = new THREE.GridHelper(size, divisions, 0x888888, 0xcccccc)
    this.scene.add(grid)
    this.requestRender()
  }

  /**
   * 添加方块到场景
   *
   * @param position - 方块底部中心位置
   * @param size - 方块尺寸 { width, height, depth }
   * @param color - 方块颜色（十六进制）
   * @returns 创建的 Mesh 对象，可用于后续操作
   */
  public addBox(
    position: THREE.Vector3,
    size: { width: number; height: number; depth: number } = { width: 2, height: 2, depth: 2 },
    color: number = 0x4a90d9
  ): THREE.Mesh {
    // 创建方块几何体
    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth)

    // 创建标准材质（支持光照和阴影）
    const material = new THREE.MeshStandardMaterial({ color })

    // 创建网格对象（几何体 + 材质 = 可渲染的物体）
    const mesh = new THREE.Mesh(geometry, material)

    // 设置位置
    mesh.position.copy(position)
    // Y 轴偏移半个高度，使方块底部贴地
    mesh.position.y += size.height / 2

    // 开启阴影
    mesh.castShadow = true     // 投射阴影
    mesh.receiveShadow = true  // 接收阴影

    // 添加到场景
    this.scene.add(mesh)

    // 请求重新渲染
    this.requestRender()

    return mesh
  }

  /**
   * 注册每帧回调函数
   *
   * @param callback - 每帧调用的函数，参数 delta 是帧间隔（秒）
   * @returns 取消注册的函数
   */
  public onRender(callback: (delta: number) => void): () => void {
    // 添加到回调列表
    this.onRenderCallbacks.push(callback)

    // 返回取消函数
    return () => {
      const idx = this.onRenderCallbacks.indexOf(callback)
      if (idx > -1) this.onRenderCallbacks.splice(idx, 1)
    }
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 销毁引擎，释放所有资源
   *
   * 重要：组件卸载时必须调用，否则会内存泄漏
   */
  public dispose(): void {
    // 停止渲染循环
    this.stop()

    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize)

    // 销毁相机控制器
    try {
      this.orbitController?.dispose()
      this.cameraController?.dispose()
    } catch (e) {
      console.warn('[ThreeEngine] Error disposing camera controllers:', e)
    }
    this.orbitController = null
    this.cameraController = null

    // 销毁射线检测器（如果有 dispose 方法）
    if (this.raycasterManager && typeof (this.raycasterManager as unknown as { dispose?: () => void }).dispose === 'function') {
      try {
        (this.raycasterManager as unknown as { dispose: () => void }).dispose()
      } catch (e) {
        console.warn('[ThreeEngine] Error disposing raycaster:', e)
      }
    }

    // 销毁环境贴图管理器
    try {
      this.environmentManager?.dispose()
    } catch (e) {
      console.warn('[ThreeEngine] Error disposing environment manager:', e)
    }
    this.environmentManager = null
    this.currentEnvMap = null

    // 销毁后处理管线
    try {
      this.postProcessing?.dispose()
    } catch (e) {
      console.warn('[ThreeEngine] Error disposing post-processing pipeline:', e)
    }
    this.postProcessing = null

    // 遍历场景中的所有对象，释放几何体和材质
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // 释放几何体
        try {
          object.geometry?.dispose()
        } catch (e) {
          console.warn('[ThreeEngine] Error disposing geometry:', e)
        }
        
        // 释放材质（可能是数组）
        try {
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => {
              this.disposeMaterial(m)
            })
          } else if (object.material) {
            this.disposeMaterial(object.material)
          }
        } catch (e) {
          console.warn('[ThreeEngine] Error disposing material:', e)
        }
      }
    })

    // 清空场景
    this.scene.clear()

    // 销毁渲染器
    try {
      this.renderer.dispose()
      this.renderer.forceContextLoss()
    } catch (e) {
      console.warn('[ThreeEngine] Error disposing renderer:', e)
    }
    
    // 从 DOM 中移除画布
    try {
      this.renderer.domElement.remove()
    } catch (e) {
      console.warn('[ThreeEngine] Error removing canvas:', e)
    }

    // 清空回调列表
    this.onRenderCallbacks = []
    
    console.log('[ThreeEngine] Disposed successfully')
  }

  /**
   * 释放材质及其纹理
   */
  private disposeMaterial(material: THREE.Material): void {
    material.dispose()
    
    // 释放材质中的纹理
    if ('map' in material && material.map) {
      (material.map as THREE.Texture).dispose()
    }
    if ('normalMap' in material && material.normalMap) {
      (material.normalMap as THREE.Texture).dispose()
    }
    if ('roughnessMap' in material && material.roughnessMap) {
      (material.roughnessMap as THREE.Texture).dispose()
    }
    if ('metalnessMap' in material && material.metalnessMap) {
      (material.metalnessMap as THREE.Texture).dispose()
    }
    if ('envMap' in material && material.envMap) {
      (material.envMap as THREE.Texture).dispose()
    }
  }

  // ==========================================================================
  // 公共访问器
  // ==========================================================================

  /** 获取场景对象 */
  public getScene(): THREE.Scene {
    return this.scene
  }

  /** 获取相机对象 */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  /** 获取渲染器对象 */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  /** 获取 DOM 容器 */
  public getContainer(): HTMLElement {
    return this.container
  }

  /** 获取射线检测管理器 */
  public getRaycasterManager(): RaycasterManager {
    return this.raycasterManager
  }

  /** 获取后处理管线（未启用时返回 null） */
  public getPostProcessing(): PostProcessingPipeline | null {
    return this.postProcessing
  }

  // ==========================================================================
  // 质量等级控制
  // ==========================================================================

  /**
   * 设置质量等级，根据预设配置后处理通道
   */
  public setQualityLevel(level: QualityLevel): void {
    this.currentQualityLevel = level
    this.applyQualityPreset(level)
    this.requestRender()
  }

  /**
   * 获取当前质量等级
   */
  public getQualityLevel(): QualityLevel {
    return this.currentQualityLevel
  }

  /**
   * 应用质量预设到后处理通道
   */
  private applyQualityPreset(level: QualityLevel): void {
    if (!this.postProcessing) return

    const preset = QUALITY_PRESETS[level]
    this.postProcessing.setPassEnabled('ssao', preset.ssaoEnabled)
    this.postProcessing.setPassEnabled('bloom', preset.bloomEnabled)
    this.postProcessing.setPassEnabled('fxaa', preset.fxaaEnabled)
  }

  // ==========================================================================
  // 相机位置控制方法
  // ==========================================================================

  /**
   * 设置相机位置
   *
   * @param x - X 坐标
   * @param y - Y 坐标（高度）
   * @param z - Z 坐标
   */
  public setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
    
    // 如果是轨道模式，需要更新控制器
    if (this.currentMode === 'orbit' && this.orbitController) {
      this.orbitController.update()
    }
  }

  /**
   * 设置相机目标点（相机看向的位置）
   *
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param z - Z 坐标
   */
  public setCameraTarget(x: number, y: number, z: number): void {
    if (this.currentMode === 'orbit' && this.orbitController) {
      // 轨道模式：设置控制器的目标点
      this.orbitController.setTarget(x, y, z)
    } else {
      // 跟随模式或无控制器：直接让相机看向目标点
      this.camera.lookAt(x, y, z)
    }
  }

  /**
   * 获取相机目标点（相机看向的位置）
   *
   * @returns 目标点坐标
   */
  public getCameraTarget(): THREE.Vector3 {
    if (this.currentMode === 'orbit' && this.orbitController) {
      // 轨道模式：从控制器获取目标点
      return this.orbitController.getTarget()
    } else {
      // 跟随模式或无控制器：从相机方向计算目标点
      const direction = new THREE.Vector3()
      this.camera.getWorldDirection(direction)
      return this.camera.position.clone().add(direction.multiplyScalar(10))
    }
  }

  // ==========================================================================
  // CameraController 委托方法
  // ==========================================================================

  /**
   * 请求指针锁定（委托给 CameraController）
   */
  public requestPointerLock(): void {
    this.cameraController?.requestPointerLock()
  }

  /**
   * 退出指针锁定（委托给 CameraController）
   */
  public exitPointerLock(): void {
    this.cameraController?.exitPointerLock()
  }

  /**
   * 查询指针锁定状态（委托给 CameraController）
   */
  public isPointerLocked(): boolean {
    return this.cameraController?.isLocked() ?? false
  }

  /**
   * 获取当前相机偏航角（委托给 CameraController）
   */
  public getCameraYaw(): number {
    return this.cameraController?.getYaw() ?? 0
  }

  /**
   * 获取当前相机俯仰角（委托给 CameraController）
   */
  public getCameraPitch(): number {
    return this.cameraController?.getPitch() ?? 0.3
  }

  /**
   * 设置相机角度（委托给 CameraController）
   */
  public setCameraAngles(yaw: number, pitch: number): void {
    this.cameraController?.setAngles(yaw, pitch)
  }

}
