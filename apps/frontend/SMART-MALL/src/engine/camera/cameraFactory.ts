/**
 * 相机工厂
 *
 * 统一管理相机的创建逻辑，避免代码重复
 */

import * as THREE from 'three'

/**
 * 相机创建配置
 */
export interface CameraConfig {
  /** 视野角度（FOV），默认 60 度 */
  fov?: number
  /** 近裁剪面，默认 0.1 */
  near?: number
  /** 远裁剪面，默认 1000 */
  far?: number
  /** 初始位置，默认 (20, 15, 20) */
  position?: { x: number; y: number; z: number }
  /** 看向的目标点，默认 (0, 0, 0) */
  lookAt?: { x: number; y: number; z: number }
}

/** 默认相机配置 */
const DEFAULT_CONFIG: Required<CameraConfig> = {
  fov: 60,
  near: 0.1,
  far: 1000,
  position: { x: 20, y: 15, z: 20 },
  lookAt: { x: 0, y: 0, z: 0 }
}

/**
 * 创建透视相机
 *
 * @param container - DOM 容器，用于计算宽高比
 * @param config - 相机配置（可选）
 * @returns 创建的透视相机
 */
export function createPerspectiveCamera(
  container: HTMLElement,
  config?: CameraConfig
): THREE.PerspectiveCamera {
  const { clientWidth, clientHeight } = container
  const merged = { ...DEFAULT_CONFIG, ...config }

  const camera = new THREE.PerspectiveCamera(
    merged.fov,
    clientWidth / clientHeight,
    merged.near,
    merged.far
  )

  camera.position.set(merged.position.x, merged.position.y, merged.position.z)
  camera.lookAt(merged.lookAt.x, merged.lookAt.y, merged.lookAt.z)

  return camera
}
