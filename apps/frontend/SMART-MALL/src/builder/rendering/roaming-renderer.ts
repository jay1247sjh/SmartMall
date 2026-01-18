/**
 * 漫游模式渲染器
 * 
 * 专门用于漫游模式的场景渲染，创建封闭的室内空间
 * - 精致的 PBR 材质
 * - 不透明的墙壁
 * - 天花板
 * - 地板
 * - 只显示当前楼层内容
 */

import * as THREE from 'three'
import type { Polygon } from '../geometry/types'
import type { MallProject } from '../types'
import { polygonToShape, calculateFloorYPosition } from './polygon-to-three'

// ============================================================================
// 类型定义
// ============================================================================

export interface RoamingRenderOptions {
  /** 当前楼层ID */
  currentFloorId: string
  /** 墙壁高度 */
  wallHeight?: number
  /** 墙壁颜色 */
  wallColor?: number
  /** 地板颜色 */
  floorColor?: number
  /** 天花板颜色 */
  ceilingColor?: number
  /** 墙壁厚度 */
  wallThickness?: number
}

// ============================================================================
// 材质创建
// ============================================================================

/**
 * 创建程序化瓷砖纹理
 */
function createTileTexture(
  tileSize: number = 2,
  color1: number = 0xf5f5f5,
  color2: number = 0xe8e8e8,
  groutColor: number = 0xcccccc,
  groutWidth: number = 0.02
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const size = 512
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // 背景（勾缝颜色）
  ctx.fillStyle = `#${groutColor.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, size, size)
  
  // 瓷砖
  const tilePixels = size / 2  // 每个纹理包含 2x2 瓷砖
  const groutPixels = groutWidth * tilePixels
  
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const isLight = (row + col) % 2 === 0
      const color = isLight ? color1 : color2
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`
      
      const x = col * tilePixels + groutPixels / 2
      const y = row * tilePixels + groutPixels / 2
      const w = tilePixels - groutPixels
      const h = tilePixels - groutPixels
      
      ctx.fillRect(x, y, w, h)
      
      // 添加微妙的高光效果
      const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)')
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, w, h)
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(tileSize, tileSize)
  
  return texture
}

/**
 * 创建程序化墙壁纹理
 */
function createWallTexture(
  baseColor: number = 0xf0f0f0,
  variation: number = 0.05
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const size = 256
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // 基础颜色
  const r = (baseColor >> 16) & 0xff
  const g = (baseColor >> 8) & 0xff
  const b = baseColor & 0xff
  
  // 创建微妙的噪点纹理
  const imageData = ctx.createImageData(size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * variation * 255
    imageData.data[i] = Math.max(0, Math.min(255, r + noise))
    imageData.data[i + 1] = Math.max(0, Math.min(255, g + noise))
    imageData.data[i + 2] = Math.max(0, Math.min(255, b + noise))
    imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 2)
  
  return texture
}

/**
 * 创建天花板纹理（吊顶效果）
 */
function createCeilingTexture(
  baseColor: number = 0xfafafa,
  gridSize: number = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  const size = 512
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // 基础颜色
  ctx.fillStyle = `#${baseColor.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, size, size)
  
  // 吊顶格栅线
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 2
  
  const cellSize = size / gridSize
  for (let i = 0; i <= gridSize; i++) {
    // 水平线
    ctx.beginPath()
    ctx.moveTo(0, i * cellSize)
    ctx.lineTo(size, i * cellSize)
    ctx.stroke()
    
    // 垂直线
    ctx.beginPath()
    ctx.moveTo(i * cellSize, 0)
    ctx.lineTo(i * cellSize, size)
    ctx.stroke()
  }
  
  // 添加微妙的阴影效果
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * cellSize + 2
      const y = row * cellSize + 2
      const w = cellSize - 4
      const h = cellSize - 4
      
      // 内部微妙渐变
      const gradient = ctx.createRadialGradient(
        x + w / 2, y + h / 2, 0,
        x + w / 2, y + h / 2, w / 2
      )
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.02)')
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, w, h)
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(8, 8)
  
  return texture
}

/**
 * 创建精致的地板材质
 */
function createFloorMaterial(color: number): THREE.MeshStandardMaterial {
  const texture = createTileTexture(10, 0xf8f8f8, 0xf0f0f0, 0xd0d0d0, 0.015)
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: color,
    roughness: 0.3,
    metalness: 0.1,
    side: THREE.DoubleSide,
  })
}

/**
 * 创建精致的墙壁材质
 */
function createWallMaterial(color: number): THREE.MeshStandardMaterial {
  const texture = createWallTexture(0xffffff, 0.03)
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: color,
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })
}

/**
 * 创建精致的天花板材质
 */
function createCeilingMaterial(color: number): THREE.MeshStandardMaterial {
  const texture = createCeilingTexture(0xffffff, 4)
  
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: color,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })
}

// ============================================================================
// 墙壁创建
// ============================================================================

/**
 * 创建商城轮廓的墙壁（封闭空间）
 */
export function createWalls(
  outline: Polygon,
  height: number,
  yPosition: number,
  options: {
    color?: number
    thickness?: number
    opacity?: number
  } = {}
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'walls'
  
  const wallColor = options.color ?? 0xe8e8e8
  const thickness = options.thickness ?? 0.3
  
  const vertices = outline.vertices
  if (vertices.length < 3) {
    console.warn('[createWalls] 顶点数量不足:', vertices.length)
    return group
  }
  
  // 创建共享的墙壁材质
  const wallMaterial = createWallMaterial(wallColor)
  
  // 为每条边创建墙壁
  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i]!
    const end = vertices[(i + 1) % vertices.length]!
    
    // 计算墙壁长度和角度
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    
    // 创建墙壁几何体
    const wallGeometry = new THREE.BoxGeometry(length, height, thickness)
    
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)
    
    // 定位墙壁
    const centerX = (start.x + end.x) / 2
    const centerY = (start.y + end.y) / 2
    wall.position.set(centerX, yPosition + height / 2, -centerY)
    wall.rotation.y = -angle
    
    wall.castShadow = true
    wall.receiveShadow = true
    wall.name = `wall-${i}`
    
    group.add(wall)
  }
  
  // 添加踢脚线
  const baseboardMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.5,
    metalness: 0.2,
  })
  
  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i]!
    const end = vertices[(i + 1) % vertices.length]!
    
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    
    // 踢脚线
    const baseboardGeometry = new THREE.BoxGeometry(length + 0.02, 0.15, thickness + 0.05)
    const baseboard = new THREE.Mesh(baseboardGeometry, baseboardMaterial)
    
    const centerX = (start.x + end.x) / 2
    const centerY = (start.y + end.y) / 2
    baseboard.position.set(centerX, yPosition + 0.075, -centerY)
    baseboard.rotation.y = -angle
    baseboard.name = `baseboard-${i}`
    
    group.add(baseboard)
  }
  
  return group
}

/**
 * 创建地板
 */
export function createFloor(
  outline: Polygon,
  yPosition: number,
  options: {
    color?: number
    opacity?: number
  } = {}
): THREE.Mesh {
  const shape = polygonToShape(outline)
  const geometry = new THREE.ShapeGeometry(shape)
  
  const floorColor = options.color ?? 0xf5f5f5
  const material = createFloorMaterial(floorColor)
  
  const floor = new THREE.Mesh(geometry, material)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = yPosition
  floor.receiveShadow = true
  floor.name = 'floor-surface'
  
  return floor
}

/**
 * 创建天花板
 */
export function createCeiling(
  outline: Polygon,
  yPosition: number,
  options: {
    color?: number
    opacity?: number
  } = {}
): THREE.Mesh {
  const shape = polygonToShape(outline)
  const geometry = new THREE.ShapeGeometry(shape)
  
  const ceilingColor = options.color ?? 0xfafafa
  const material = createCeilingMaterial(ceilingColor)
  
  const ceiling = new THREE.Mesh(geometry, material)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = yPosition
  ceiling.receiveShadow = true
  ceiling.name = 'ceiling'
  
  return ceiling
}

// ============================================================================
// 漫游场景渲染
// ============================================================================

/**
 * 创建漫游模式的封闭空间
 */
export function createRoamingEnvironment(
  project: MallProject,
  options: RoamingRenderOptions
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'roaming-environment'
  
  const currentFloor = project.floors.find(f => f.id === options.currentFloorId)
  if (!currentFloor) {
    console.warn('[createRoamingEnvironment] 未找到当前楼层:', options.currentFloorId)
    return group
  }
  
  const floorIndex = project.floors.findIndex(f => f.id === options.currentFloorId)
  const floorHeights = project.floors.map(f => f.height)
  const yPos = calculateFloorYPosition(floorIndex, floorHeights)
  
  const outline = currentFloor.shape || project.outline
  const wallHeight = options.wallHeight ?? currentFloor.height ?? 4
  
  // 创建地板（使用明亮的瓷砖效果）
  const floor = createFloor(outline, yPos, {
    color: options.floorColor ?? 0xf5f5f5,
  })
  group.add(floor)
  
  // 创建墙壁（使用精致的墙面材质）
  const walls = createWalls(outline, wallHeight, yPos, {
    color: options.wallColor ?? 0xf0f0f0,
    thickness: options.wallThickness ?? 0.3,
  })
  group.add(walls)
  
  // 创建天花板（使用半透明材质，不阻挡相机视角）
  const ceiling = createCeiling(outline, yPos + wallHeight, {
    color: options.ceilingColor ?? 0xfafafa,
    transparent: true,  // 启用透明
    opacity: 0.3,       // 设置为半透明，既能提供光照反射，又不会完全遮挡视角
  })
  group.add(ceiling)
  
  // 添加环境光照增强（提高亮度）
  const ambientBoost = new THREE.AmbientLight(0xffffff, 0.8)  // 从 0.5 提高到 0.8
  ambientBoost.name = 'roaming-ambient'
  group.add(ambientBoost)
  
  return group
}

/**
 * 清除漫游环境对象
 */
export function clearRoamingEnvironment(scene: THREE.Scene): void {
  const toRemove: THREE.Object3D[] = []
  
  scene.traverse(obj => {
    if (obj.name === 'roaming-environment' || 
        obj.name === 'walls' || 
        obj.name === 'floor-surface' || 
        obj.name === 'ceiling' ||
        obj.name === 'roaming-ambient' ||
        obj.name === 'mall-furniture' ||
        obj.name.startsWith('wall-') ||
        obj.name.startsWith('baseboard-') ||
        obj.name.startsWith('furniture-')) {
      toRemove.push(obj)
    }
  })
  
  toRemove.forEach(obj => {
    scene.remove(obj)
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        } else if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        }
      }
    })
  })
}


// ============================================================================
// 商场基础设施放置
// ============================================================================

import {
  createBenchModel,
  createLampPostModel,
  createTrashBinModel,
  createPlanterModel,
  createSignPostModel,
} from '../objects/furniture-models'

export interface FurniturePlacementOptions {
  /** 是否放置长椅 */
  benches?: boolean
  /** 是否放置路灯 */
  lamps?: boolean
  /** 是否放置垃圾桶 */
  trashBins?: boolean
  /** 是否放置花盆 */
  planters?: boolean
  /** 是否放置指示牌 */
  signs?: boolean
  /** 高度缩放 */
  heightScale?: number
}

/**
 * 在商城空间中自动放置基础设施
 * 根据商城轮廓智能放置长椅、路灯、垃圾桶等
 */
export function createMallFurniture(
  outline: Polygon,
  yPosition: number,
  options: FurniturePlacementOptions = {}
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'mall-furniture'
  
  const {
    benches = true,
    lamps = true,
    trashBins = true,
    planters = true,
    signs = true,
    heightScale = 1.0,
  } = options
  
  const vertices = outline.vertices
  if (vertices.length < 3) return group
  
  // 计算商城边界
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  
  for (const v of vertices) {
    minX = Math.min(minX, v.x)
    maxX = Math.max(maxX, v.x)
    minY = Math.min(minY, v.y)
    maxY = Math.max(maxY, v.y)
  }
  
  const width = maxX - minX
  const depth = maxY - minY
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  
  let furnitureIndex = 0
  
  // 放置路灯（沿着主要通道）
  if (lamps) {
    const lampSpacing = 15  // 每15米一盏灯
    const lampCount = Math.floor(Math.max(width, depth) / lampSpacing)
    
    for (let i = 0; i < lampCount; i++) {
      // 沿 X 轴放置
      const lampX = minX + (i + 0.5) * (width / lampCount)
      const lamp1 = createLampPostModel(3 * heightScale, 'mall')
      lamp1.position.set(lampX, yPosition, -centerY - depth * 0.2)
      lamp1.name = `furniture-lamp-${furnitureIndex++}`
      group.add(lamp1)
      
      const lamp2 = createLampPostModel(3 * heightScale, 'mall')
      lamp2.position.set(lampX, yPosition, -centerY + depth * 0.2)
      lamp2.name = `furniture-lamp-${furnitureIndex++}`
      group.add(lamp2)
    }
  }
  
  // 放置长椅（沿着墙边）
  if (benches) {
    const benchSpacing = 12  // 每12米一个长椅
    const benchCount = Math.floor(width / benchSpacing)
    
    for (let i = 0; i < benchCount; i++) {
      const benchX = minX + (i + 0.5) * (width / benchCount)
      
      // 靠近一侧墙的长椅
      const bench = createBenchModel(2, heightScale)
      bench.position.set(benchX, yPosition, -minY + 2)  // 靠近南墙
      bench.rotation.y = Math.PI  // 面向中心
      bench.name = `furniture-bench-${furnitureIndex++}`
      group.add(bench)
    }
    
    // 另一侧也放置一些
    for (let i = 0; i < Math.floor(benchCount / 2); i++) {
      const benchX = minX + (i * 2 + 1) * (width / benchCount)
      
      const bench = createBenchModel(2, heightScale)
      bench.position.set(benchX, yPosition, -maxY + 2)  // 靠近北墙
      bench.name = `furniture-bench-${furnitureIndex++}`
      group.add(bench)
    }
  }
  
  // 放置垃圾桶（在长椅附近和主要通道交叉口）
  if (trashBins) {
    const trashPositions = [
      { x: minX + width * 0.25, z: -centerY },
      { x: minX + width * 0.75, z: -centerY },
      { x: centerX, z: -minY + 3 },
      { x: centerX, z: -maxY + 3 },
    ]
    
    trashPositions.forEach((pos) => {
      const trashBin = createTrashBinModel('recycling', heightScale)
      trashBin.position.set(pos.x, yPosition, pos.z)
      trashBin.name = `furniture-trash-${furnitureIndex++}`
      group.add(trashBin)
    })
  }
  
  // 放置花盆（装饰性，在角落和中心区域）
  if (planters) {
    const planterPositions = [
      { x: minX + 3, z: -minY + 3, type: 'tree' as const },
      { x: maxX - 3, z: -minY + 3, type: 'tree' as const },
      { x: minX + 3, z: -maxY + 3, type: 'bush' as const },
      { x: maxX - 3, z: -maxY + 3, type: 'bush' as const },
      { x: centerX, z: -centerY, type: 'flowers' as const },
    ]
    
    planterPositions.forEach((pos) => {
      const planter = createPlanterModel('large', pos.type)
      planter.position.set(pos.x, yPosition, pos.z)
      planter.name = `furniture-planter-${furnitureIndex++}`
      group.add(planter)
    })
  }
  
  // 放置指示牌（在主要入口和通道）
  if (signs) {
    const signPositions = [
      { x: centerX, z: -minY + 5, text: '出口' },
      { x: minX + 5, z: -centerY, text: '电梯' },
      { x: maxX - 5, z: -centerY, text: '洗手间' },
    ]
    
    signPositions.forEach((pos) => {
      const sign = createSignPostModel(pos.text, 'standing', heightScale)
      sign.position.set(pos.x, yPosition, pos.z)
      sign.name = `furniture-sign-${furnitureIndex++}`
      group.add(sign)
    })
  }
  
  return group
}
