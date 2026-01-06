/**
 * 轨道控制器
 *
 * 这个类封装了 Three.js 的 OrbitControls，提供"编辑模式"下的相机控制功能。
 * 用户可以通过鼠标拖拽、滚轮缩放来自由观察 3D 场景。
 *
 * 核心功能：
 * - 旋转视角：鼠标左键拖拽，围绕目标点旋转相机
 * - 平移视角：鼠标右键拖拽，在屏幕平面上平移相机
 * - 缩放视角：鼠标滚轮，拉近或拉远相机
 * - 阻尼效果：松开鼠标后，相机会有惯性滑动，更自然
 *
 * 业务场景：
 * - 商城建模器（BuilderView）：管理员编辑商城布局时使用
 * - 商城预览模式：用户自由浏览商城 3D 场景时使用
 * - 与 CameraController 的区别：
 *   - OrbitController：自由视角，适合编辑和预览
 *   - CameraController：第三人称跟随，适合漫游模式
 *
 * 设计原则：
 * - 封装性：隐藏 OrbitControls 的复杂配置，提供简洁接口
 * - 安全性：限制相机角度和距离，防止穿透地面或飞出场景
 * - 流畅性：启用阻尼效果，让相机移动更平滑
 *
 * 使用示例：
 * ```typescript
 * // 创建轨道控制器
 * const orbitController = new OrbitController(camera, container)
 *
 * // 设置变化回调（用于触发渲染）
 * orbitController.onChange(() => {
 *   renderer.render(scene, camera)
 * })
 *
 * // 在渲染循环中更新（阻尼效果需要）
 * function animate() {
 *   requestAnimationFrame(animate)
 *   orbitController.update()
 *   renderer.render(scene, camera)
 * }
 * ```
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export class OrbitController {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /**
   * Three.js 轨道控制器实例
   * - 来自 three/examples/jsm/controls/OrbitControls
   * - 提供鼠标交互控制相机的能力
   */
  private controls: OrbitControls

  /**
   * 透视相机引用
   * - 由外部传入，OrbitControls 会操作这个相机
   */
  private camera: THREE.PerspectiveCamera

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建轨道控制器
   *
   * @param camera - 要控制的透视相机
   * @param domElement - DOM 容器元素，用于监听鼠标事件
   *
   * @example
   * ```typescript
   * const camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 1000)
   * const controller = new OrbitController(camera, canvasContainer)
   * ```
   */
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    // 保存相机引用
    this.camera = camera

    // 创建 OrbitControls 实例
    // 参数：要控制的相机，监听事件的 DOM 元素
    this.controls = new OrbitControls(camera, domElement)

    // 配置控制器参数
    this.setupControls()
  }

  // ==========================================================================
  // 私有方法 - 初始化配置
  // ==========================================================================

  /**
   * 配置轨道控制器参数
   *
   * 这些参数经过调优，适合商城 3D 场景的浏览体验
   */
  private setupControls(): void {
    // ========================================================================
    // 阻尼效果（惯性滑动）
    // ========================================================================

    /**
     * 启用阻尼效果
     * - true: 松开鼠标后，相机会有惯性滑动，逐渐停止
     * - false: 松开鼠标后，相机立即停止
     * - 启用后需要在渲染循环中调用 update()
     */
    this.controls.enableDamping = true

    /**
     * 阻尼系数（0-1）
     * - 值越小，惯性越大，滑动越远
     * - 值越大，惯性越小，停止越快
     * - 0.05 是一个平衡的值，既有惯性感又不会滑太远
     */
    this.controls.dampingFactor = 0.05

    // ========================================================================
    // 平移模式
    // ========================================================================

    /**
     * 屏幕空间平移
     * - true: 平移方向与屏幕平行（更直观）
     * - false: 平移方向与地面平行（适合俯视图）
     * - 对于 3D 商城场景，屏幕空间平移更符合用户直觉
     */
    this.controls.screenSpacePanning = true

    // ========================================================================
    // 距离限制（缩放范围）
    // ========================================================================

    /**
     * 最小距离（米）
     * - 相机距离目标点的最近距离
     * - 防止相机穿透物体或离得太近看不清
     * - 5 米适合观察单个店铺
     */
    this.controls.minDistance = 5

    /**
     * 最大距离（米）
     * - 相机距离目标点的最远距离
     * - 防止相机飞出场景，看不到商城
     * - 100 米足够俯瞰整个商城
     */
    this.controls.maxDistance = 100

    // ========================================================================
    // 角度限制
    // ========================================================================

    /**
     * 最大极角（弧度）
     * - 极角：相机与垂直轴（Y轴）的夹角
     * - 0: 相机在正上方（俯视）
     * - Math.PI/2: 相机在水平面上（平视）
     * - Math.PI: 相机在正下方（仰视）
     *
     * Math.PI / 2.1 ≈ 85.7°
     * - 略小于 90°，防止相机完全水平
     * - 完全水平时可能看不到地面上的物体
     * - 也防止相机穿透地面（翻到地下）
     */
    this.controls.maxPolarAngle = Math.PI / 2.1
  }

  // ==========================================================================
  // 公共方法
  // ==========================================================================

  /**
   * 更新控制器状态（每帧调用）
   *
   * 如果启用了阻尼效果（enableDamping = true），
   * 必须在渲染循环中每帧调用此方法，否则阻尼效果不生效
   *
   * @example
   * ```typescript
   * function animate() {
   *   requestAnimationFrame(animate)
   *   orbitController.update()  // 必须调用
   *   renderer.render(scene, camera)
   * }
   * ```
   */
  public update(): void {
    this.controls.update()
  }

  /**
   * 设置变化回调
   *
   * 当相机位置或角度发生变化时，会触发此回调
   * 通常用于触发渲染（按需渲染模式）
   *
   * @param callback - 变化时调用的回调函数
   *
   * @example
   * ```typescript
   * // 按需渲染：只在相机变化时渲染
   * orbitController.onChange(() => {
   *   renderer.render(scene, camera)
   * })
   * ```
   */
  public onChange(callback: () => void): void {
    this.controls.addEventListener('change', callback)
  }

  /**
   * 获取相机对象
   *
   * @returns 被控制的透视相机
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 销毁控制器，释放资源
   *
   * 清理内容：
   * - 移除所有事件监听器
   * - 释放内部引用
   *
   * 重要：组件卸载时必须调用，否则会内存泄漏
   *
   * @example
   * ```typescript
   * // 在 Vue 组件中
   * onUnmounted(() => {
   *   orbitController.dispose()
   * })
   * ```
   */
  public dispose(): void {
    this.controls.dispose()
  }
}