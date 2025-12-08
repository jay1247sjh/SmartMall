/**
 * 3D 场景领域 - 工具函数
 * 提供几何计算和操作函数
 */

import type { Vector3D, BoundingBox, Transform } from './scene.types'

/**
 * 创建默认的 Vector3D
 */
export function createVector3D(x = 0, y = 0, z = 0): Vector3D {
  return { x, y, z }
}

/**
 * 创建默认的 BoundingBox
 */
export function createBoundingBox(
  min: Vector3D = createVector3D(),
  max: Vector3D = createVector3D()
): BoundingBox {
  return { min, max }
}

/**
 * 创建默认的 Transform
 */
export function createTransform(): Transform {
  return {
    position: createVector3D(),
    rotation: createVector3D(),
    scale: createVector3D(1, 1, 1)
  }
}

/**
 * 检查点是否在边界框内
 */
export function isPointInBoundingBox(point: Vector3D, box: BoundingBox): boolean {
  return (
    point.x >= box.min.x &&
    point.x <= box.max.x &&
    point.y >= box.min.y &&
    point.y <= box.max.y &&
    point.z >= box.min.z &&
    point.z <= box.max.z
  )
}

/**
 * 检查两个边界框是否重叠
 */
export function doBoundingBoxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return (
    box1.min.x <= box2.max.x &&
    box1.max.x >= box2.min.x &&
    box1.min.y <= box2.max.y &&
    box1.max.y >= box2.min.y &&
    box1.min.z <= box2.max.z &&
    box1.max.z >= box2.min.z
  )
}

/**
 * 计算边界框的中心点
 */
export function getBoundingBoxCenter(box: BoundingBox): Vector3D {
  return {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2
  }
}

/**
 * 计算边界框的尺寸
 */
export function getBoundingBoxSize(box: BoundingBox): Vector3D {
  return {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z
  }
}
