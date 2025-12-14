import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


export class OrbitController {
  private controls: OrbitControls
  private camera: THREE.PerspectiveCamera

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera
    this.controls = new OrbitControls(camera, domElement)
    this.setupControls()
  }

  private setupControls(): void {
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = true
    this.controls.minDistance = 5
    this.controls.maxDistance = 100
    this.controls.maxPolarAngle = Math.PI / 2.1
  }

  /** 每帧更新 */
  public update(): void {
    this.controls.update()
  }

  /** 设置变化回调 */
  public onChange(callback: () => void): void {
    this.controls.addEventListener('change', callback)
  }

  /** 获取相机 */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  /** 销毁 */
  public dispose(): void {
    this.controls.dispose()
  }
}