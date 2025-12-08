/**
 * 3D 场景领域 - 类型定义
 * 描述 3D 空间中的几何概念
 */

/**
 * 三维向量
 * 表示 3D 空间中的位置、方向或尺寸
 */
export interface Vector3D {
  x: number
  y: number
  z: number
}

/**
 * 边界框
 * 使用最小点和最大点定义 3D 空间中的矩形区域
 */
export interface BoundingBox {
  min: Vector3D
  max: Vector3D
}

/**
 * 3D 变换
 * 描述对象在 3D 空间中的位置、旋转和缩放
 */
export interface Transform {
  position: Vector3D
  rotation: Vector3D // 欧拉角（弧度）
  scale: Vector3D
}
