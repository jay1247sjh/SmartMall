/**
 * 相机控制器
 *
 * 这个类负责管理 3D 场景中的相机行为，提供第三人称跟随和相机动画功能。
 * 主要用于"运行时浏览模式"，让相机跟随用户在场景中移动。
 *
 * 核心功能：
 * - 第三人称跟随：相机跟随目标对象（如角色）移动
 * - 鼠标视角控制：通过鼠标移动控制相机角度（Pointer Lock API）
 * - 相机动画：平滑移动到指定位置和角度
 * - 自动调整：窗口大小变化时自动更新相机宽高比
 *
 * 设计原则：
 * - 独立性：可以独立使用，也可以集成到 ThreeEngine
 * - 灵活性：支持配置跟随距离、平滑度、灵敏度等参数
 * - 平滑性：使用插值算法实现平滑的相机移动
 *
 * 使用场景：
 * - 运行时浏览模式：用户在商城中漫游，相机跟随用户移动
 * - 导航动画：从一个店铺平滑移动到另一个店铺
 * - 第三人称视角：类似游戏中的第三人称相机
 */

import * as THREE from 'three'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 第三人称相机配置
 *
 * 控制相机如何跟随目标对象
 */
export interface ThirdPersonCameraConfig {
  /**
   * 相机与目标的距离（米）
   * - 值越大，相机离目标越远
   * - 默认 8 米，适合观察整个角色
   */
  distance: number

  /**
   * 相机看向目标的垂直偏移（米）
   * - 通常设置为角色头部高度
   * - 默认 1.5 米，适合人类角色
   */
  lookAtHeightOffset: number

  /**
   * 跟随平滑度（0-1）
   * - 0: 完全不跟随（相机固定）
   * - 1: 立即跟随（无延迟）
   * - 0.1: 平滑跟随（推荐值）
   * - 值越小，跟随越平滑，但延迟越大
   */
  smoothness: number

  /**
   * 鼠标灵敏度
   * - 控制鼠标移动对相机旋转的影响程度
   * - 默认 0.002，适合大多数用户
   * - 值越大，相机旋转越快
   */
  mouseSensitivity: number

  /**
   * 垂直角度限制（弧度）
   * - min: 最低角度（向下看的极限）
   * - max: 最高角度（向上看的极限）
   * - 防止相机翻转或穿透地面
   */
  pitchLimit: { min: number; max: number }

  /**
   * 相机最小高度（米）
   * - 防止相机穿透地面
   * - 默认 1 米
   */
  minHeight: number
}

/**
 * 相机动画配置
 *
 * 控制相机移动动画的行为
 */
export interface CameraAnimationOptions {
  /**
   * 动画时长（毫秒）
   * - 1000 = 1 秒
   * - 值越大，动画越慢
   */
  duration: number

  /**
   * 缓动函数（可选）
   * - 控制动画的速度曲线
   * - 默认使用 easeInOut（先加速后减速）
   * - 参数 t: 0-1 之间的进度值
   * - 返回值: 0-1 之间的缓动后的进度值
   */
  easing?: (t: number) => number
}

// ============================================================================
// 缓动函数
// ============================================================================

/**
 * 缓动函数集合
 *
 * 缓动函数用于控制动画的速度曲线，让动画更自然
 *
 * 什么是缓动？
 * - 线性：匀速运动，看起来机械
 * - 缓入：开始慢，逐渐加速
 * - 缓出：开始快，逐渐减速
 * - 缓入缓出：开始慢，中间快，结束慢（最自然）
 */
export const Easing = {
  /**
   * 线性缓动
   * - 匀速运动，没有加速或减速
   * - 适合：机械运动、匀速滚动
   */
  linear: (t: number) => t,

  /**
   * 缓入缓出
   * - 开始慢，中间快，结束慢
   * - 最自然的动画效果
   * - 适合：相机移动、UI 动画
   */
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  /**
   * 缓出
   * - 开始快，逐渐减速
   * - 适合：弹出动画、出现效果
   */
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3)
}

// ============================================================================
// CameraController 类
// ============================================================================

export class CameraController {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /**
   * 透视相机
   * - 模拟人眼视角的相机
   * - 近大远小的透视效果
   */
  private camera: THREE.PerspectiveCamera

  /**
   * DOM 容器元素
   * - 用于获取尺寸信息
   * - 用于请求鼠标指针锁定
   */
  private container: HTMLElement

  // ==========================================================================
  // 第三人称跟随相关属性
  // ==========================================================================

  /**
   * 跟随目标
   * - 相机会跟随这个 3D 对象移动
   * - 通常是角色、车辆等可移动对象
   * - null 表示不跟随任何对象
   */
  private followTarget: THREE.Object3D | null = null

  /**
   * 第三人称相机配置
   * - 控制相机如何跟随目标
   * - 可以通过 updateConfig() 动态修改
   */
  private config: ThirdPersonCameraConfig = {
    distance: 8, // 相机距离目标 8 米
    lookAtHeightOffset: 1.5, // 看向目标头部（1.5 米高）
    smoothness: 0.1, // 平滑跟随（10% 插值）
    mouseSensitivity: 0.002, // 鼠标灵敏度
    pitchLimit: { min: -Math.PI / 3, max: Math.PI / 3 }, // 垂直角度限制 ±60°
    minHeight: 1 // 相机最低高度 1 米
  }

  // ==========================================================================
  // 鼠标控制相关属性
  // ==========================================================================

  /**
   * 水平旋转角度（Yaw，弧度）
   * - 控制相机左右旋转
   * - 0 = 正北方向
   * - Math.PI/2 = 正东方向
   * - Math.PI = 正南方向
   * - -Math.PI/2 = 正西方向
   */
  private yaw: number = 0

  /**
   * 垂直旋转角度（Pitch，弧度）
   * - 控制相机上下旋转
   * - 0 = 水平视角
   * - 正值 = 向上看
   * - 负值 = 向下看
   * - 受 pitchLimit 限制，防止翻转
   */
  private pitch: number = 0.3

  /**
   * 鼠标指针是否被锁定
   * - true: 鼠标被锁定，可以控制视角
   * - false: 鼠标未锁定，正常使用
   * - 使用 Pointer Lock API 实现
   */
  private isPointerLocked: boolean = false

  // ==========================================================================
  // 相机动画相关属性
  // ==========================================================================

  /**
   * 当前动画状态
   * - null: 没有动画正在进行
   * - 对象: 动画正在进行，包含动画的所有信息
   *
   * 动画信息：
   * - active: 动画是否激活
   * - startTime: 动画开始时间（毫秒时间戳）
   * - duration: 动画总时长（毫秒）
   * - startPosition: 起始位置
   * - endPosition: 目标位置
   * - startLookAt: 起始看向点
   * - endLookAt: 目标看向点
   * - easing: 缓动函数
   * - onComplete: 动画完成回调
   */
  private animation: {
    active: boolean
    startTime: number
    duration: number
    startPosition: THREE.Vector3
    endPosition: THREE.Vector3
    startLookAt: THREE.Vector3
    endLookAt: THREE.Vector3
    easing: (t: number) => number
    onComplete?: () => void
  } | null = null

  // ==========================================================================
  // 回调函数
  // ==========================================================================

  /**
   * 变化回调函数
   * - 当相机位置或角度发生变化时调用
   * - 通常用于触发渲染（requestRender）
   * - 由外部通过 onChange() 方法设置
   */
  private onChangeCallback: (() => void) | null = null

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建相机控制器
   *
   * @param container - DOM 容器元素，用于获取尺寸和请求指针锁定
   * @param existingCamera - 可选的现有相机，如果提供则使用它，否则创建新相机
   *
   * @example
   * ```typescript
   * // 创建新相机
   * const controller = new CameraController(container)
   *
   * // 使用现有相机
   * const controller = new CameraController(container, existingCamera)
   * ```
   */
  constructor(container: HTMLElement, existingCamera?: THREE.PerspectiveCamera) {
    // 保存容器引用
    this.container = container

    // 使用现有相机或创建新相机
    this.camera = existingCamera ?? this.createCamera()

    // 设置事件监听器
    this.setupEventListeners()
  }

  // ==========================================================================
  // 初始化方法（私有）
  // ==========================================================================

  /**
   * 创建透视相机
   *
   * 创建一个默认配置的透视相机：
   * - 视野角度（FOV）: 60 度
   * - 宽高比：根据容器尺寸计算
   * - 近裁剪面：0.1 米（太近的物体不显示）
   * - 远裁剪面：1000 米（太远的物体不显示）
   * - 初始位置：(0, 5, 10)，斜上方俯视原点
   *
   * @returns 创建的透视相机
   */
  private createCamera(): THREE.PerspectiveCamera {
    // 获取容器尺寸
    const { clientWidth, clientHeight } = this.container

    // 创建透视相机
    // 参数：视野角度, 宽高比, 近裁剪面, 远裁剪面
    const camera = new THREE.PerspectiveCamera(
      60, // FOV: 60 度视野（人眼舒适范围）
      clientWidth / clientHeight, // 宽高比：保持画面不变形
      0.1, // 近裁剪面：0.1 米内的物体不显示
      1000 // 远裁剪面：1000 米外的物体不显示
    )

    // 设置相机初始位置（斜上方俯视场景）
    camera.position.set(0, 5, 10)

    // 让相机看向原点
    camera.lookAt(0, 0, 0)

    return camera
  }

  /**
   * 设置事件监听器
   *
   * 监听以下事件：
   * - pointerlockchange: 鼠标指针锁定状态变化
   * - mousemove: 鼠标移动（用于控制视角）
   * - resize: 窗口大小变化（用于更新相机宽高比）
   */
  private setupEventListeners(): void {
    // 监听指针锁定状态变化
    document.addEventListener('pointerlockchange', this.handlePointerLockChange)

    // 监听鼠标移动（用于视角控制）
    document.addEventListener('mousemove', this.handleMouseMove)

    // 监听窗口大小变化（用于更新相机）
    window.addEventListener('resize', this.handleResize)
  }

  // ==========================================================================
  // 事件处理器（私有）
  // ==========================================================================

  /**
   * 处理指针锁定状态变化
   *
   * 当用户点击场景请求锁定鼠标，或按 ESC 退出锁定时触发
   *
   * 使用箭头函数保持 this 指向
   */
  private handlePointerLockChange = (): void => {
    // 更新锁定状态
    // document.pointerLockElement 不为 null 表示指针被锁定
    this.isPointerLocked = document.pointerLockElement !== null
  }

  /**
   * 处理鼠标移动事件
   *
   * 当鼠标移动时，根据移动量更新相机角度
   * 只有在指针锁定状态下才生效
   *
   * @param event - 鼠标移动事件
   *
   * 使用箭头函数保持 this 指向
   */
  private handleMouseMove = (event: MouseEvent): void => {
    // 如果指针未锁定，不处理
    if (!this.isPointerLocked) return

    // 获取配置
    const { mouseSensitivity, pitchLimit } = this.config

    // 水平旋转（Yaw）
    // movementX: 鼠标水平移动量（像素）
    // 负号：鼠标向右移动，相机向右转（yaw 减小）
    this.yaw -= event.movementX * mouseSensitivity

    // 垂直旋转（Pitch）
    // movementY: 鼠标垂直移动量（像素）
    // 负号：鼠标向下移动，相机向下看（pitch 减小）
    this.pitch -= event.movementY * mouseSensitivity

    // 限制垂直角度，防止相机翻转或穿透地面
    // Math.max(min, ...) 确保不低于最小值
    // Math.min(..., max) 确保不超过最大值
    this.pitch = Math.max(pitchLimit.min, Math.min(pitchLimit.max, this.pitch))

    // 通知外部相机发生变化（触发渲染）
    this.notifyChange()
  }

  /**
   * 处理窗口大小变化
   *
   * 当窗口大小改变时，更新相机的宽高比，保持画面不变形
   *
   * 使用箭头函数保持 this 指向
   */
  private handleResize = (): void => {
    // 获取新的容器尺寸
    const { clientWidth, clientHeight } = this.container

    // 更新相机宽高比
    this.camera.aspect = clientWidth / clientHeight

    // 更新相机投影矩阵（必须调用，否则宽高比不生效）
    this.camera.updateProjectionMatrix()

    // 通知外部相机发生变化（触发渲染）
    this.notifyChange()
  }

  /**
   * 通知外部相机发生变化
   *
   * 调用外部设置的回调函数（通常用于触发渲染）
   * 使用可选链操作符，如果回调未设置则不调用
   */
  private notifyChange(): void {
    this.onChangeCallback?.()
  }

  // ==========================================================================
  // 更新方法（每帧调用）
  // ==========================================================================

  /**
   * 更新相机状态（每帧调用）
   *
   * 这个方法应该在渲染循环中每帧调用一次，用于更新相机位置和角度
   *
   * 更新优先级：
   * 1. 如果有动画正在进行，优先处理动画
   * 2. 如果设置了跟随目标，处理第三人称跟随
   * 3. 否则不做任何更新
   *
   * @example
   * ```typescript
   * // 在渲染循环中调用
   * function animate() {
   *   requestAnimationFrame(animate)
   *   cameraController.update()  // 更新相机
   *   renderer.render(scene, camera)
   * }
   * ```
   */
  public update(): void {
    // 优先处理动画（动画期间不处理跟随）
    if (this.animation?.active) {
      this.updateAnimation()
      return
    }

    // 第三人称跟随
    if (this.followTarget) {
      this.updateFollowCamera()
    }
  }

  /**
   * 更新第三人称跟随相机
   *
   * 根据跟随目标的位置和当前的 yaw/pitch 角度，计算相机的理想位置，
   * 然后使用线性插值平滑移动到理想位置
   *
   * 计算原理（球面坐标系）：
   * 1. 以目标为球心，distance 为半径
   * 2. yaw 控制水平角度（绕 Y 轴旋转）
   * 3. pitch 控制垂直角度（上下俯仰）
   * 4. 计算出相机在球面上的位置
   *
   * 平滑跟随：
   * - 使用 lerp（线性插值）实现平滑移动
   * - smoothness 控制插值速度（0-1）
   * - 值越小，跟随越平滑，但延迟越大
   */
  private updateFollowCamera(): void {
    // 安全检查：如果没有跟随目标，直接返回
    if (!this.followTarget) return

    // 获取配置参数
    const { distance, lookAtHeightOffset, smoothness, minHeight } = this.config

    // 获取目标位置（克隆，避免修改原对象）
    const targetPosition = this.followTarget.position.clone()

    // 球面坐标计算相机理想位置
    // 1. 计算水平距离（投影到 XZ 平面的距离）
    const horizontalDistance = distance * Math.cos(this.pitch)

    // 2. 计算垂直偏移（Y 轴高度）
    //    distance * sin(pitch) 是球面坐标的垂直分量
    //    + 2 是额外的高度偏移，让相机稍微高一点
    const verticalOffset = distance * Math.sin(this.pitch) + 2

    // 3. 计算相机理想位置（目标位置 + 球面偏移）
    const idealPosition = new THREE.Vector3(
      // X 坐标：目标 X + 水平距离 * sin(yaw)
      targetPosition.x + Math.sin(this.yaw) * horizontalDistance,
      // Y 坐标：目标 Y + 垂直偏移，但不低于最小高度
      Math.max(targetPosition.y + verticalOffset, minHeight),
      // Z 坐标：目标 Z + 水平距离 * cos(yaw)
      targetPosition.z + Math.cos(this.yaw) * horizontalDistance
    )

    // 4. 平滑插值到理想位置
    //    lerp(target, alpha) 表示：当前位置向目标位置移动 alpha 的距离
    //    smoothness = 0.1 表示每帧移动 10% 的距离
    this.camera.position.lerp(idealPosition, smoothness)

    // 5. 让相机看向目标（通常是角色的头部）
    const lookAtPosition = targetPosition.clone()
    lookAtPosition.y += lookAtHeightOffset // 向上偏移到头部高度
    this.camera.lookAt(lookAtPosition)

    // 6. 通知外部相机发生变化（触发渲染）
    this.notifyChange()
  }

  /**
   * 更新相机动画
   *
   * 根据动画进度，插值计算相机的当前位置和看向点
   *
   * 动画流程：
   * 1. 计算已经过的时间
   * 2. 计算动画进度（0-1）
   * 3. 应用缓动函数，得到缓动后的进度
   * 4. 根据缓动进度插值位置和看向点
   * 5. 如果动画完成，清理动画状态并调用回调
   */
  private updateAnimation(): void {
    // 安全检查：如果没有动画，直接返回
    if (!this.animation) return

    // 1. 计算已经过的时间（毫秒）
    const elapsed = performance.now() - this.animation.startTime

    // 2. 计算动画进度（0-1）
    //    Math.min 确保进度不超过 1
    const progress = Math.min(elapsed / this.animation.duration, 1)

    // 3. 应用缓动函数，得到缓动后的进度
    //    例如：线性进度 0.5 → 缓动后可能是 0.7（加速）
    const easedProgress = this.animation.easing(progress)

    // 4. 插值相机位置
    //    lerpVectors(v1, v2, alpha) 表示：v1 向 v2 移动 alpha 的距离
    this.camera.position.lerpVectors(
      this.animation.startPosition, // 起始位置
      this.animation.endPosition, // 目标位置
      easedProgress // 缓动后的进度
    )

    // 5. 插值看向点
    const currentLookAt = new THREE.Vector3().lerpVectors(
      this.animation.startLookAt, // 起始看向点
      this.animation.endLookAt, // 目标看向点
      easedProgress // 缓动后的进度
    )
    this.camera.lookAt(currentLookAt)

    // 6. 通知外部相机发生变化（触发渲染）
    this.notifyChange()

    // 7. 检查动画是否完成
    if (progress >= 1) {
      // 保存回调函数（因为下一行会清空 animation）
      const onComplete = this.animation.onComplete

      // 清空动画状态
      this.animation = null

      // 调用完成回调（如果有）
      onComplete?.()
    }
  }

  // ==========================================================================
  // 公共方法 - 跟随目标
  // ==========================================================================

  /**
   * 设置跟随目标
   * @param target - 要跟随的 3D 对象
   * @param config - 配置（可选，部分覆盖）
   */
  public setFollowTarget(
    target: THREE.Object3D,
    config?: Partial<ThirdPersonCameraConfig>
  ): void {
    this.followTarget = target
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * 清除跟随目标
   */
  public clearFollowTarget(): void {
    this.followTarget = null
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ThirdPersonCameraConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // ==========================================================================
  // 公共方法 - 相机动画
  // ==========================================================================

  /**
   * 动画移动相机到指定位置
   * @param position - 目标位置
   * @param lookAt - 目标看向点
   * @param options - 动画配置
   * @returns Promise，动画完成时 resolve
   */
  public animateTo(
    position: THREE.Vector3,
    lookAt: THREE.Vector3,
    options: CameraAnimationOptions = { duration: 1000 }
  ): Promise<void> {
    return new Promise((resolve) => {
      // 获取当前看向点（近似计算）
      const currentLookAt = new THREE.Vector3()
      this.camera.getWorldDirection(currentLookAt)
      currentLookAt.multiplyScalar(10).add(this.camera.position)

      this.animation = {
        active: true,
        startTime: performance.now(),
        duration: options.duration,
        startPosition: this.camera.position.clone(),
        endPosition: position.clone(),
        startLookAt: currentLookAt,
        endLookAt: lookAt.clone(),
        easing: options.easing ?? Easing.easeInOut,
        onComplete: resolve
      }
    })
  }

  /**
   * 停止当前动画
   */
  public stopAnimation(): void {
    this.animation = null
  }

  // ==========================================================================
  // 公共方法 - 视角控制
  // ==========================================================================

  /**
   * 获取水平旋转角度
   */
  public getYaw(): number {
    return this.yaw
  }

  /**
   * 获取垂直旋转角度
   */
  public getPitch(): number {
    return this.pitch
  }

  /**
   * 设置视角角度
   */
  public setAngles(yaw: number, pitch: number): void {
    this.yaw = yaw
    this.pitch = Math.max(
      this.config.pitchLimit.min,
      Math.min(this.config.pitchLimit.max, pitch)
    )
    this.notifyChange()
  }

  /**
   * 请求锁定鼠标指针
   */
  public requestPointerLock(): void {
    this.container.requestPointerLock()
  }

  /**
   * 退出鼠标指针锁定
   */
  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }
  }

  /**
   * 是否处于指针锁定状态
   */
  public isLocked(): boolean {
    return this.isPointerLocked
  }

  // ==========================================================================
  // 公共方法 - 回调
  // ==========================================================================

  /**
   * 设置变化回调（用于触发渲染）
   */
  public onChange(callback: () => void): void {
    this.onChangeCallback = callback
  }

  // ==========================================================================
  // 公共访问器
  // ==========================================================================

  /** 获取相机对象 */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  /** 获取当前跟随目标 */
  public getFollowTarget(): THREE.Object3D | null {
    return this.followTarget
  }

  /** 获取当前配置 */
  public getConfig(): ThirdPersonCameraConfig {
    return { ...this.config }
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 销毁控制器，释放资源
   */
  public dispose(): void {
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
    document.removeEventListener('mousemove', this.handleMouseMove)
    window.removeEventListener('resize', this.handleResize)

    this.exitPointerLock()
    this.animation = null
    this.followTarget = null
    this.onChangeCallback = null
  }
}
