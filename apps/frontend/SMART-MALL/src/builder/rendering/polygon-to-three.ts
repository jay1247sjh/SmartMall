/**
 * 多边形到 Three.js 转换模块
 * 
 * 将几何模块的多边形转换为 Three.js 几何体
 * 支持挤出生成 3D 形状
 */

import * as THREE from 'three'
import type { Polygon } from '../geometry/types'
import { getBoundingBox } from '../geometry/polygon'

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
  /** 粗糙度 (0-1) */
  roughness?: number
  /** 金属度 (0-1) */
  metalness?: number
  /** 是否使用磨砂玻璃材质（MeshPhysicalMaterial） */
  glassEffect?: boolean
  /** 透射率 (0-1)，glassEffect 启用时有效 */
  transmission?: number
  /** 折射率，glassEffect 启用时有效 */
  ior?: number
  /** 厚度，glassEffect 启用时有效 */
  thickness?: number
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
  // Shape 在 XY 平面，经 rotation.x = -PI/2 后：(shapeX, shapeY) → 3D (shapeX, 0, -shapeY)
  // 要让最终 3D 坐标为 (x, 0, -y)，Shape 坐标应为 (x, y)（不取反）
  shape.moveTo(vertices[0]!.x, vertices[0]!.y)
  
  // 连接其余点
  for (let i = 1; i < vertices.length; i++) {
    shape.lineTo(vertices[i]!.x, vertices[i]!.y)
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
 * 使用 Shape 路径 + rotation.x = -PI/2，与 mesh 系列保持一致的坐标变换方式
 */
export function createPolygonOutline(
  polygon: Polygon,
  color: number = 0xffffff,
  lineWidth: number = 1
): THREE.Line {
  // 在 XY 平面构建路径（与 polygonToShape 一致）
  const points: THREE.Vector3[] = polygon.vertices.map(
    v => new THREE.Vector3(v.x, v.y, 0)
  )
  
  // 闭合路径
  if (polygon.isClosed && points.length > 0) {
    points.push(points[0]!.clone())
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ 
    color,
    linewidth: lineWidth,
  })
  
  const line = new THREE.Line(geometry, material)
  line.rotation.x = -Math.PI / 2  // 与 mesh 统一：XY 平面旋转到 XZ 平面
  
  return line
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
 * 支持普通 MeshStandardMaterial 和磨砂玻璃 MeshPhysicalMaterial
 */
function createMaterial(options: MeshOptions): THREE.MeshStandardMaterial {
  const isTransparent = options.transparent ?? (options.opacity !== undefined && options.opacity < 1)
  
  // 磨砂玻璃效果：使用 MeshPhysicalMaterial
  if (options.glassEffect) {
    return new THREE.MeshPhysicalMaterial({
      color: options.color ?? 0x60a5fa,
      opacity: options.opacity ?? 1,
      transparent: isTransparent,
      side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
      wireframe: options.wireframe ?? false,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0,
      roughness: options.roughness ?? 0.3,
      metalness: options.metalness ?? 0.0,
      transmission: options.transmission ?? 0.6,
      ior: options.ior ?? 1.5,
      thickness: options.thickness ?? 0.5,
    }) as unknown as THREE.MeshStandardMaterial
  }
  
  return new THREE.MeshStandardMaterial({
    color: options.color ?? 0x60a5fa,
    opacity: options.opacity ?? 1,
    transparent: isTransparent,
    side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
    wireframe: options.wireframe ?? false,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.15,
  })
}

/**
 * 创建多边形的发光边框管道
 * 使用 TubeGeometry 沿轮廓挤出，配合 emissive 实现发光效果
 * 在 XY 平面构建路径 + rotation.x = -PI/2，与 mesh 系列保持一致
 */
export function createGlowOutline(
  polygon: Polygon,
  options: {
    color?: number
    emissive?: number
    emissiveIntensity?: number
    radius?: number
    opacity?: number
  } = {}
): THREE.Mesh {
  const color = options.color ?? 0x60a5fa
  const emissive = options.emissive ?? color
  const emissiveIntensity = options.emissiveIntensity ?? 0.8
  const radius = options.radius ?? 0.06
  const opacity = options.opacity ?? 0.9
  
  // 在 XY 平面构建路径（与 polygonToShape 一致）
  const pathPoints: THREE.Vector3[] = polygon.vertices.map(
    v => new THREE.Vector3(v.x, v.y, 0)
  )
  // 闭合
  if (polygon.isClosed && pathPoints.length > 0) {
    pathPoints.push(pathPoints[0]!.clone())
  }
  
  const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.0)
  const tubeGeometry = new THREE.TubeGeometry(curve, pathPoints.length * 8, radius, 6, false)
  
  const tubeMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity,
    transparent: true,
    opacity,
    roughness: 0.3,
    metalness: 0.1,
  })
  
  const mesh = new THREE.Mesh(tubeGeometry, tubeMaterial)
  mesh.rotation.x = -Math.PI / 2  // 与 mesh 统一：XY 平面旋转到 XZ 平面
  
  return mesh
}

/**
 * 计算多边形的中心点（用于定位）
 */
export function getPolygonCenter(polygon: Polygon): THREE.Vector3 {
  const box = getBoundingBox(polygon)
  return new THREE.Vector3(
    (box.minX + box.maxX) / 2,
    0,
    -(box.minY + box.maxY) / 2
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
