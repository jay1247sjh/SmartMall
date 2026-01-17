/**
 * 几何类型定义
 * 
 * 用于商城建模器的几何数据结构
 * 
 * @shared 前端、后端、AI服务共用
 */

/**
 * 2D 点
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * 3D 点/向量
 */
export interface Point3D {
  x: number
  y: number
  z: number
}

/**
 * 多边形
 */
export interface Polygon {
  /** 顶点列表 */
  vertices: Point2D[]
  /** 是否闭合 */
  isClosed: boolean
}

/**
 * 矩形
 */
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 边界盒
 */
export interface BoundingBox {
  min: Point3D
  max: Point3D
}

/**
 * 2D 变换
 */
export interface Transform2D {
  /** X 偏移 */
  x: number
  /** Y 偏移 */
  y: number
  /** 缩放 */
  scale: number
  /** 旋转角度（弧度） */
  rotation: number
}

/**
 * 计算多边形面积
 */
export function calculatePolygonArea(vertices: Point2D[]): number {
  if (vertices.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length
    area += vertices[i].x * vertices[j].y
    area -= vertices[j].x * vertices[i].y
  }
  
  return Math.abs(area / 2)
}

/**
 * 计算多边形周长
 */
export function calculatePolygonPerimeter(vertices: Point2D[]): number {
  if (vertices.length < 2) return 0
  
  let perimeter = 0
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length
    const dx = vertices[j].x - vertices[i].x
    const dy = vertices[j].y - vertices[i].y
    perimeter += Math.sqrt(dx * dx + dy * dy)
  }
  
  return perimeter
}

/**
 * 计算多边形中心点
 */
export function calculatePolygonCenter(vertices: Point2D[]): Point2D {
  if (vertices.length === 0) return { x: 0, y: 0 }
  
  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 }
  )
  
  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length
  }
}
