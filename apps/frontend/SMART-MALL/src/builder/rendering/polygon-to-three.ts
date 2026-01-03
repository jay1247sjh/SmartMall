/**
 * 多边形到 Three.js 转换模块
 * 
 * 将几何模块的多边形转换为 Three.js 几何体
 * 支持挤出生成 3D 形状
 */

import * as THREE from 'three'
import type { Point2D, Polygon } from '../geometry/types'
import { calculateArea, getBoundingBox } from '../geometry/polygon'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 挤出选项
 */
export interface ExtrudeOptions {
  /** 挤出深度（高度） */
  depth: number
  /** 是否斜切边缘 */
  bevelEnabled?: boolean
  /** 斜切厚度 */
  bevelThickness?: number
  /** 斜切大小 */
  bevelSize?: number
  /** 斜切分段数 */
  bevelSegments?: number
}

/**
 * 网格选项
 */
export interface MeshOptions {
  /** 材质颜色 */
  color?: number
  /** 透明度 */
  opacity?: number
  /** 是否透明 */
  transparent?: boolean
  /** 是否双面渲染 */
  doubleSide?: boolean
  /** 是否显示线框 */
  wireframe?: boolean
  /** 发光颜色 */
  emissive?: number
  /** 发光强度 */
  emissiveIntensity?: number
}

// ============================================================================
// 转换函数
// ============================================================================

/**
 * 将多边形转换为 Three.js Shape
 */
export function polygonToShape(polygon: Polygon): THREE.Shape {
  const shape = new THREE.Shape()
  const vertices = polygon.vertices
  
  if (vertices.length < 3) {
    return shape
  }
  
  // 移动到第一个点
  shape.moveTo(vertices[0].x, vertices[0].y)
  
  // 连接其余点
  for (let i = 1; i < vertices.length; i++) {
    shape.lineTo(vertices[i].x, vertices[i].y)
  }
  
  // 闭合路径
  if (polygon.isClosed) {
    shape.closePath()
  }
  
  return shape
}

/**
 * 将多边形转换为 2D 平面几何体
 */
export function polygonToPlaneGeometry(polygon: Polygon): THREE.ShapeGeometry {
  const shape = polygonToShape(polygon)
  return new THREE.ShapeGeometry(shape)
}

/**
 * 将多边形挤出为 3D 几何体
 */
export function polygonToExtrudedGeometry(
  polygon: Polygon,
  options: ExtrudeOptions
): THREE.ExtrudeGeometry {
  const shape = polygonToShape(polygon)
  
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: options.depth,
    bevelEnabled: options.bevelEnabled ?? false,
    bevelThickness: options.bevelThickness ?? 0,
    bevelSize: options.bevelSize ?? 0,
    bevelSegments: options.bevelSegments ?? 1,
  }
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings)
}

/**
 * 创建多边形的 2D 网格
 */
export function createPolygonMesh2D(
  polygon: Polygon,
  options: MeshOptions = {}
): THREE.Mesh {
  const geometry = polygonToPlaneGeometry(polygon)
  const material = createMaterial(options)
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2 // 平放在 XZ 平面
  
  return mesh
}

/**
 * 创建多边形的 3D 挤出网格
 */
export function createPolygonMesh3D(
  polygon: Polygon,
  extrudeOptions: ExtrudeOptions,
  meshOptions: MeshOptions = {}
): THREE.Mesh {
  const geometry = polygonToExtrudedGeometry(polygon, extrudeOptions)
  const material = createMaterial(meshOptions)
  
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2 // 平放在 XZ 平面
  
  return mesh
}

/**
 * 创建多边形的边框线
 */
export function createPolygonOutline(
  polygon: Polygon,
  color: number = 0xffffff,
  lineWidth: number = 1
): THREE.Line {
  const points: THREE.Vector3[] = polygon.vertices.map(
    v => new THREE.Vector3(v.x, 0, -v.y)  // 注意：Y 坐标取反以匹配 ExtrudeGeometry 的旋转
  )
  
  // 闭合路径
  if (polygon.isClosed && points.length > 0) {
    points.push(points[0].clone())
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ 
    color,
    linewidth: lineWidth,
  })
  
  return new THREE.Line(geometry, material)
}

/**
 * 创建多边形的边框（使用 EdgesGeometry）
 */
export function createPolygonEdges(
  polygon: Polygon,
  height: number,
  color: number = 0xffffff
): THREE.LineSegments {
  const geometry = polygonToExtrudedGeometry(polygon, { depth: height })
  const edges = new THREE.EdgesGeometry(geometry)
  const material = new THREE.LineBasicMaterial({ color })
  
  const lineSegments = new THREE.LineSegments(edges, material)
  lineSegments.rotation.x = -Math.PI / 2
  
  return lineSegments
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 创建材质
 */
function createMaterial(options: MeshOptions): THREE.MeshStandardMaterial {
  const isTransparent = options.transparent ?? (options.opacity !== undefined && options.opacity < 1)
  return new THREE.MeshStandardMaterial({
    color: options.color ?? 0x60a5fa,
    opacity: options.opacity ?? 1,
    transparent: isTransparent,
    side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    wireframe: options.wireframe ?? false,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    roughness: 0.7,
    metalness: 0.1,
  })
}

/**
 * 计算多边形的中心点（用于定位）
 */
export function getPolygonCenter(polygon: Polygon): THREE.Vector3 {
  const box = getBoundingBox(polygon)
  return new THREE.Vector3(
    (box.minX + box.maxX) / 2,
    0,
    (box.minY + box.maxY) / 2
  )
}

/**
 * 将多边形居中到原点
 */
export function centerPolygon(polygon: Polygon): Polygon {
  const box = getBoundingBox(polygon)
  const centerX = (box.minX + box.maxX) / 2
  const centerY = (box.minY + box.maxY) / 2
  
  return {
    vertices: polygon.vertices.map(v => ({
      x: v.x - centerX,
      y: v.y - centerY,
    })),
    isClosed: polygon.isClosed,
  }
}

/**
 * 缩放多边形
 */
export function scalePolygon(polygon: Polygon, scale: number): Polygon {
  const box = getBoundingBox(polygon)
  const centerX = (box.minX + box.maxX) / 2
  const centerY = (box.minY + box.maxY) / 2
  
  return {
    vertices: polygon.vertices.map(v => ({
      x: centerX + (v.x - centerX) * scale,
      y: centerY + (v.y - centerY) * scale,
    })),
    isClosed: polygon.isClosed,
  }
}

// ============================================================================
// 楼层渲染
// ============================================================================

/**
 * 楼层渲染选项
 */
export interface FloorRenderOptions {
  /** 楼层高度 */
  height: number
  /** 楼层颜色 */
  color: number
  /** 透明度 */
  opacity?: number
  /** Y 轴位置 */
  yPosition: number
  /** 是否显示边框 */
  showEdges?: boolean
  /** 边框颜色 */
  edgeColor?: number
}

/**
 * 创建楼层 3D 网格
 */
export function createFloorMesh(
  outline: Polygon,
  options: FloorRenderOptions
): THREE.Group {
  const group = new THREE.Group()
  
  // 创建楼层主体
  const mesh = createPolygonMesh3D(
    outline,
    { depth: options.height, bevelEnabled: false },
    {
      color: options.color,
      opacity: options.opacity ?? 0.8,
      transparent: true,
    }
  )
  mesh.position.y = options.yPosition
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  
  // 添加边框
  if (options.showEdges !== false) {
    const edges = createPolygonEdges(
      outline,
      options.height,
      options.edgeColor ?? 0x3f3f46
    )
    edges.position.y = options.yPosition
    group.add(edges)
  }
  
  return group
}

/**
 * 计算楼层 Y 位置
 */
export function calculateFloorYPosition(
  floorIndex: number,
  floorHeights: number[]
): number {
  let y = 0
  for (let i = 0; i < floorIndex; i++) {
    y += floorHeights[i] ?? 4
  }
  return y
}
