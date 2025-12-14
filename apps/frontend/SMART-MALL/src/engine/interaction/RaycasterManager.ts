import * as THREE from 'three'

/**
 * 射线检测管理器
 *
 * 职责：
 * - 将鼠标屏幕坐标转换为 3D 空间射线
 * - 检测射线与场景物体的交点
 * - 提供便捷方法获取地面交点
 *
 * 原理：
 * 射线从相机位置出发，穿过鼠标在屏幕上的位置，延伸到 3D 空间中。
 * 通过检测这条射线与场景中物体的交点，可以实现"点击选中"等交互。
 */
export class RaycasterManager {
  /** Three.js 射线投射器 */
  private raycaster: THREE.Raycaster

  /** 标准化的鼠标坐标 (-1 到 1) */
  private mouse: THREE.Vector2

  /** 相机引用（射线从相机出发） */
  private camera: THREE.Camera

  /** 场景引用（默认检测目标） */
  private scene: THREE.Scene

  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera
    this.scene = scene
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
  }

  /**
   * 更新鼠标位置
   *
   * 将屏幕像素坐标转换为标准化设备坐标（NDC）
   * NDC 范围：X 轴 -1(左) 到 1(右)，Y 轴 -1(下) 到 1(上)
   *
   * @param event - 鼠标事件
   * @param container - 渲染容器元素
   */
  public updateMouse(event: MouseEvent, container: HTMLElement): void {
    // 获取容器在页面中的位置和尺寸
    const rect = container.getBoundingClientRect()

    // X: (鼠标X - 容器左边距) / 容器宽度 → 0~1 → *2-1 → -1~1
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1

    // Y: 同理，但 Y 轴需要翻转（屏幕 Y 向下，3D 空间 Y 向上）
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  /**
   * 检测射线与物体的交点
   *
   * @param objects - 要检测的对象数组（可选，默认检测整个场景）
   * @returns 交点数组，按距离从近到远排序
   */
  public intersect(objects?: THREE.Object3D[]): THREE.Intersection[] {
    // 根据鼠标位置和相机，设置射线的起点和方向
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // 如果没有指定对象，则检测场景中的所有子对象
    const targets = objects ?? this.scene.children

    // 第二个参数 true 表示递归检测子对象
    return this.raycaster.intersectObjects(targets, true)
  }

  /**
   * 获取第一个交点（最近的物体）
   *
   * @param objects - 要检测的对象数组（可选）
   * @returns 最近的交点，如果没有则返回 null
   */
  public getFirstIntersect(objects?: THREE.Object3D[]): THREE.Intersection | null {
    const intersects = this.intersect(objects)
    return intersects[0] ?? null
  }

  /**
   * 获取射线与地面的交点
   *
   * 地面定义为 Y=0 的水平平面，常用于建模器中"点击地面放置物体"
   *
   * @returns 地面交点坐标，如果射线与地面平行则返回 null
   */
  public getGroundPoint(): THREE.Vector3 | null {
    // 设置射线
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // 创建地面平面：法向量 (0,1,0) 表示朝上，常数 0 表示经过原点（normal · point + constant = 0）
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    // 用于存储交点的向量
    const intersectPoint = new THREE.Vector3()

    // 计算射线与平面的交点，结果存入 intersectPoint
    // 如果射线与平面平行，返回 null
    return this.raycaster.ray.intersectPlane(groundPlane, intersectPoint)
  }
}
