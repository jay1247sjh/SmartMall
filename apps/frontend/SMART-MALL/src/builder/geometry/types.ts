/**
 * 几何类型定义
 * 
 * 定义所有几何计算相关的 TypeScript 接口
 * 这些类型是纯数据结构，不依赖任何 UI 框架
 */

// ============================================================================
// 基础类型
// ============================================================================

/**
 * 2D 点
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * 3D 点
 */
export interface Point3D {
  x: number
  y: number
  z: number
}

/**
 * 2D 向量（与 Point2D 结构相同，语义不同）
 */
export type Vector2D = Point2D

// ============================================================================
// 多边形类型
// ============================================================================

/**
 * 多边形
 * 
 * 由一系列顶点组成的闭合图形
 * 顶点按顺时针或逆时针顺序排列
 */
export interface Polygon {
  /** 顶点列表，至少3个点 */
  vertices: Point2D[]
  /** 是否闭合（最后一个点是否连接到第一个点） */
  isClosed: boolean
}

/**
 * 带孔多边形
 * 
 * 外轮廓 + 内部孔洞（用于复杂形状）
 */
export interface PolygonWithHoles {
  /** 外轮廓 */
  outer: Polygon
  /** 内部孔洞列表 */
  holes: Polygon[]
}

// ============================================================================
// 边界框类型
// ============================================================================

/**
 * 轴对齐边界框 (AABB)
 * 
 * 用于快速碰撞检测和范围查询
 */
export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * 矩形（位置 + 尺寸表示）
 */
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

// ============================================================================
// 线段类型
// ============================================================================

/**
 * 线段
 */
export interface LineSegment {
  start: Point2D
  end: Point2D
}

/**
 * 射线
 */
export interface Ray {
  origin: Point2D
  direction: Vector2D
}

// ============================================================================
// 几何操作结果类型
// ============================================================================

/**
 * 点与多边形的位置关系
 */
export type PointPolygonRelation = 'inside' | 'outside' | 'on-edge' | 'on-vertex'

/**
 * 两个多边形的位置关系
 */
export type PolygonRelation = 
  | 'disjoint'      // 不相交
  | 'touching'      // 边界接触
  | 'overlapping'   // 部分重叠
  | 'a-contains-b'  // A 包含 B
  | 'b-contains-a'  // B 包含 A
  | 'equal'         // 完全相等

/**
 * 线段相交结果
 */
export interface IntersectionResult {
  /** 是否相交 */
  intersects: boolean
  /** 交点（如果相交） */
  point?: Point2D
  /** 相交类型 */
  type?: 'point' | 'segment' | 'none'
}

// ============================================================================
// 变换类型
// ============================================================================

/**
 * 2D 变换矩阵 (3x3 齐次坐标)
 * 
 * | a  c  tx |
 * | b  d  ty |
 * | 0  0  1  |
 */
export interface Transform2D {
  a: number   // scale x
  b: number   // skew y
  c: number   // skew x
  d: number   // scale y
  tx: number  // translate x
  ty: number  // translate y
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 网格配置
 */
export interface GridConfig {
  /** 网格大小 */
  size: number
  /** 是否启用对齐 */
  enabled: boolean
}

/**
 * 几何验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误信息列表 */
  errors: string[]
  /** 警告信息列表 */
  warnings: string[]
}

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 检查是否为有效的 Point2D
 */
export function isPoint2D(obj: unknown): obj is Point2D {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as Point2D).x === 'number' &&
    typeof (obj as Point2D).y === 'number' &&
    !isNaN((obj as Point2D).x) &&
    !isNaN((obj as Point2D).y)
  )
}

/**
 * 检查是否为有效的 Polygon
 */
export function isPolygon(obj: unknown): obj is Polygon {
  if (typeof obj !== 'object' || obj === null) return false
  const poly = obj as Polygon
  return (
    Array.isArray(poly.vertices) &&
    poly.vertices.length >= 3 &&
    poly.vertices.every(isPoint2D) &&
    typeof poly.isClosed === 'boolean'
  )
}

/**
 * 检查是否为有效的 BoundingBox
 */
export function isBoundingBox(obj: unknown): obj is BoundingBox {
  if (typeof obj !== 'object' || obj === null) return false
  const box = obj as BoundingBox
  return (
    typeof box.minX === 'number' &&
    typeof box.minY === 'number' &&
    typeof box.maxX === 'number' &&
    typeof box.maxY === 'number' &&
    box.minX <= box.maxX &&
    box.minY <= box.maxY
  )
}
