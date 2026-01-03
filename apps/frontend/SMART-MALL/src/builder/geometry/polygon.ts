/**
 * 多边形操作模块
 * 
 * 提供多边形的各种几何计算功能
 * 所有函数都是纯函数，不修改输入参数
 */

import type {
  Point2D,
  Polygon,
  BoundingBox,
  Rectangle,
  LineSegment,
  IntersectionResult,
  ValidationResult,
} from './types'

// ============================================================================
// 基础计算
// ============================================================================

/**
 * 计算多边形面积（Shoelace 公式 / 鞋带公式）
 * 
 * 公式：A = 0.5 * |Σ(x[i] * y[i+1] - x[i+1] * y[i])|
 * 
 * @param polygon - 多边形
 * @returns 面积（始终为正数）
 */
export function calculateArea(polygon: Polygon): number {
  const { vertices } = polygon
  if (vertices.length < 3) return 0

  let area = 0
  const n = vertices.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += vertices[i].x * vertices[j].y
    area -= vertices[j].x * vertices[i].y
  }

  return Math.abs(area) / 2
}

/**
 * 计算多边形周长
 * 
 * @param polygon - 多边形
 * @returns 周长
 */
export function calculatePerimeter(polygon: Polygon): number {
  const { vertices, isClosed } = polygon
  if (vertices.length < 2) return 0

  let perimeter = 0
  const n = vertices.length
  const limit = isClosed ? n : n - 1

  for (let i = 0; i < limit; i++) {
    const j = (i + 1) % n
    perimeter += distance(vertices[i], vertices[j])
  }

  return perimeter
}

/**
 * 计算两点之间的距离
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * 获取多边形的边界框 (AABB)
 * 
 * @param polygon - 多边形
 * @returns 边界框
 */
export function getBoundingBox(polygon: Polygon): BoundingBox {
  const { vertices } = polygon
  if (vertices.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = vertices[0].x
  let minY = vertices[0].y
  let maxX = vertices[0].x
  let maxY = vertices[0].y

  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]
    if (v.x < minX) minX = v.x
    if (v.y < minY) minY = v.y
    if (v.x > maxX) maxX = v.x
    if (v.y > maxY) maxY = v.y
  }

  return { minX, minY, maxX, maxY }
}

/**
 * 计算多边形的中心点（质心）
 */
export function getCentroid(polygon: Polygon): Point2D {
  const { vertices } = polygon
  if (vertices.length === 0) return { x: 0, y: 0 }

  let cx = 0
  let cy = 0
  const n = vertices.length

  for (const v of vertices) {
    cx += v.x
    cy += v.y
  }

  return { x: cx / n, y: cy / n }
}

// ============================================================================
// 点与多边形关系
// ============================================================================

/**
 * 判断点是否在多边形内部（射线法）
 * 
 * 从点向右发射一条射线，计算与多边形边的交点数
 * 奇数次交点 = 内部，偶数次 = 外部
 * 
 * @param point - 待检测的点
 * @param polygon - 多边形
 * @returns 是否在内部
 */
export function isPointInside(point: Point2D, polygon: Polygon): boolean {
  const { vertices } = polygon
  if (vertices.length < 3) return false

  let inside = false
  const n = vertices.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = vertices[i]
    const vj = vertices[j]

    // 检查点是否在边的 Y 范围内
    if ((vi.y > point.y) !== (vj.y > point.y)) {
      // 计算射线与边的交点 X 坐标
      const intersectX = ((vj.x - vi.x) * (point.y - vi.y)) / (vj.y - vi.y) + vi.x
      
      // 如果交点在点的右侧，翻转 inside 状态
      if (point.x < intersectX) {
        inside = !inside
      }
    }
  }

  return inside
}

/**
 * 判断点是否在多边形边上
 */
export function isPointOnEdge(point: Point2D, polygon: Polygon, tolerance: number = 0.0001): boolean {
  const { vertices } = polygon
  const n = vertices.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    if (isPointOnSegment(point, vertices[i], vertices[j], tolerance)) {
      return true
    }
  }

  return false
}

/**
 * 判断点是否在线段上
 */
export function isPointOnSegment(
  point: Point2D,
  segStart: Point2D,
  segEnd: Point2D,
  tolerance: number = 0.0001
): boolean {
  const d1 = distance(point, segStart)
  const d2 = distance(point, segEnd)
  const segLength = distance(segStart, segEnd)
  
  return Math.abs(d1 + d2 - segLength) < tolerance
}

// ============================================================================
// 多边形包含关系
// ============================================================================

/**
 * 判断多边形 A 是否完全包含在多边形 B 内
 * 
 * 条件：A 的所有顶点都在 B 内部，且 A 和 B 的边不相交
 * 
 * @param inner - 内部多边形 A
 * @param outer - 外部多边形 B
 * @returns A 是否被 B 包含
 */
export function isContainedIn(inner: Polygon, outer: Polygon): boolean {
  // 1. 检查所有顶点是否在外部多边形内
  for (const vertex of inner.vertices) {
    if (!isPointInside(vertex, outer) && !isPointOnEdge(vertex, outer)) {
      return false
    }
  }

  // 2. 检查边是否相交（排除共享顶点的情况）
  const innerEdges = getEdges(inner)
  const outerEdges = getEdges(outer)

  for (const innerEdge of innerEdges) {
    for (const outerEdge of outerEdges) {
      const result = segmentsIntersect(innerEdge, outerEdge)
      if (result.intersects && result.type === 'point') {
        // 如果交点不是顶点，则说明边穿过了外部多边形
        if (!isVertexOfPolygon(result.point!, inner) && !isVertexOfPolygon(result.point!, outer)) {
          return false
        }
      }
    }
  }

  return true
}

/**
 * 获取多边形的所有边
 */
export function getEdges(polygon: Polygon): LineSegment[] {
  const { vertices } = polygon
  const edges: LineSegment[] = []
  const n = vertices.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    edges.push({ start: vertices[i], end: vertices[j] })
  }

  return edges
}

/**
 * 检查点是否是多边形的顶点
 */
function isVertexOfPolygon(point: Point2D, polygon: Polygon, tolerance: number = 0.0001): boolean {
  return polygon.vertices.some(v => distance(v, point) < tolerance)
}

// ============================================================================
// 多边形重叠检测
// ============================================================================

/**
 * 判断两个多边形是否重叠
 * 
 * 使用分离轴定理 (SAT) 的简化版本：
 * 1. 检查边界框是否相交
 * 2. 检查是否有顶点在对方内部或边上
 * 3. 检查边是否相交
 * 4. 检查一个多边形的中心点是否在另一个内部
 * 
 * @param a - 多边形 A
 * @param b - 多边形 B
 * @returns 是否重叠
 */
export function doPolygonsOverlap(a: Polygon, b: Polygon): boolean {
  // 1. 快速排除：边界框不相交
  const boxA = getBoundingBox(a)
  const boxB = getBoundingBox(b)
  if (!doBoundingBoxesOverlap(boxA, boxB)) {
    return false
  }

  // 2. 检查 A 的顶点是否在 B 内部或边上
  for (const vertex of a.vertices) {
    if (isPointInside(vertex, b) || isPointOnEdge(vertex, b)) {
      return true
    }
  }

  // 3. 检查 B 的顶点是否在 A 内部或边上
  for (const vertex of b.vertices) {
    if (isPointInside(vertex, a) || isPointOnEdge(vertex, a)) {
      return true
    }
  }

  // 4. 检查边是否相交
  const edgesA = getEdges(a)
  const edgesB = getEdges(b)

  for (const edgeA of edgesA) {
    for (const edgeB of edgesB) {
      const result = segmentsIntersect(edgeA, edgeB)
      if (result.intersects) {
        return true
      }
    }
  }

  // 5. 检查中心点（处理完全包含的情况）
  const centerA = getCentroid(a)
  const centerB = getCentroid(b)
  if (isPointInside(centerA, b) || isPointInside(centerB, a)) {
    return true
  }

  return false
}

/**
 * 判断两个边界框是否重叠
 */
export function doBoundingBoxesOverlap(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  )
}

/**
 * 判断两条线段是否相交
 */
export function segmentsIntersect(seg1: LineSegment, seg2: LineSegment): IntersectionResult {
  const { start: p1, end: p2 } = seg1
  const { start: p3, end: p4 } = seg2

  const d1 = direction(p3, p4, p1)
  const d2 = direction(p3, p4, p2)
  const d3 = direction(p1, p2, p3)
  const d4 = direction(p1, p2, p4)

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    // 计算交点
    const t = ((p3.x - p1.x) * (p3.y - p4.y) - (p3.y - p1.y) * (p3.x - p4.x)) /
              ((p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x))
    
    const point: Point2D = {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    }
    
    return { intersects: true, point, type: 'point' }
  }

  // 检查共线情况
  if (d1 === 0 && onSegment(p3, p4, p1)) return { intersects: true, type: 'segment' }
  if (d2 === 0 && onSegment(p3, p4, p2)) return { intersects: true, type: 'segment' }
  if (d3 === 0 && onSegment(p1, p2, p3)) return { intersects: true, type: 'segment' }
  if (d4 === 0 && onSegment(p1, p2, p4)) return { intersects: true, type: 'segment' }

  return { intersects: false, type: 'none' }
}

/**
 * 计算向量叉积的符号（用于判断点在线的哪一侧）
 */
function direction(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y)
}

/**
 * 判断点是否在线段的边界框内
 */
function onSegment(p1: Point2D, p2: Point2D, p: Point2D): boolean {
  return (
    Math.min(p1.x, p2.x) <= p.x && p.x <= Math.max(p1.x, p2.x) &&
    Math.min(p1.y, p2.y) <= p.y && p.y <= Math.max(p1.y, p2.y)
  )
}

// ============================================================================
// 顶点操作
// ============================================================================

/**
 * 在指定位置添加顶点
 * 
 * @param polygon - 原多边形
 * @param index - 插入位置（0 到 vertices.length）
 * @param point - 新顶点
 * @returns 新多边形
 */
export function addVertex(polygon: Polygon, index: number, point: Point2D): Polygon {
  const newVertices = [...polygon.vertices]
  const clampedIndex = Math.max(0, Math.min(index, newVertices.length))
  newVertices.splice(clampedIndex, 0, { ...point })
  
  return {
    vertices: newVertices,
    isClosed: polygon.isClosed,
  }
}

/**
 * 移除指定位置的顶点
 * 
 * @param polygon - 原多边形
 * @param index - 要移除的顶点索引
 * @returns 新多边形，如果顶点数不足则返回 null
 */
export function removeVertex(polygon: Polygon, index: number): Polygon | null {
  // 多边形至少需要 3 个顶点
  if (polygon.vertices.length <= 3) {
    return null
  }

  if (index < 0 || index >= polygon.vertices.length) {
    return polygon
  }

  const newVertices = [...polygon.vertices]
  newVertices.splice(index, 1)

  return {
    vertices: newVertices,
    isClosed: polygon.isClosed,
  }
}

/**
 * 移动顶点到新位置
 */
export function moveVertex(polygon: Polygon, index: number, newPosition: Point2D): Polygon {
  if (index < 0 || index >= polygon.vertices.length) {
    return polygon
  }

  const newVertices = polygon.vertices.map((v, i) => 
    i === index ? { ...newPosition } : { ...v }
  )

  return {
    vertices: newVertices,
    isClosed: polygon.isClosed,
  }
}

// ============================================================================
// 网格对齐
// ============================================================================

/**
 * 将点对齐到网格
 * 
 * @param point - 原始点
 * @param gridSize - 网格大小
 * @returns 对齐后的点
 */
export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  if (gridSize <= 0) return { ...point }
  
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  }
}

/**
 * 将多边形的所有顶点对齐到网格
 */
export function snapPolygonToGrid(polygon: Polygon, gridSize: number): Polygon {
  return {
    vertices: polygon.vertices.map(v => snapToGrid(v, gridSize)),
    isClosed: polygon.isClosed,
  }
}

// ============================================================================
// 验证
// ============================================================================

/**
 * 验证多边形是否有效
 */
export function validatePolygon(polygon: Polygon): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查顶点数量
  if (polygon.vertices.length < 3) {
    errors.push('多边形至少需要 3 个顶点')
  }

  // 检查自相交
  if (polygon.vertices.length >= 4 && isSelfIntersecting(polygon)) {
    errors.push('多边形不能自相交')
  }

  // 检查面积
  if (polygon.vertices.length >= 3) {
    const area = calculateArea(polygon)
    if (area < 0.0001) {
      warnings.push('多边形面积过小')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * 检查多边形是否自相交
 */
export function isSelfIntersecting(polygon: Polygon): boolean {
  const edges = getEdges(polygon)
  const n = edges.length

  for (let i = 0; i < n; i++) {
    // 只检查不相邻的边
    for (let j = i + 2; j < n; j++) {
      // 跳过首尾相邻的边
      if (i === 0 && j === n - 1) continue

      const result = segmentsIntersect(edges[i], edges[j])
      if (result.intersects && result.type === 'point') {
        return true
      }
    }
  }

  return false
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 从矩形创建多边形
 */
export function rectangleToPolygon(rect: Rectangle): Polygon {
  return {
    vertices: [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ],
    isClosed: true,
  }
}

/**
 * 创建正多边形
 */
export function createRegularPolygon(center: Point2D, radius: number, sides: number): Polygon {
  const vertices: Point2D[] = []
  const angleStep = (2 * Math.PI) / sides

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2 // 从顶部开始
    vertices.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    })
  }

  return { vertices, isClosed: true }
}

/**
 * 复制多边形
 */
export function clonePolygon(polygon: Polygon): Polygon {
  return {
    vertices: polygon.vertices.map(v => ({ ...v })),
    isClosed: polygon.isClosed,
  }
}
