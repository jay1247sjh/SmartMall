/**
 * Builder 资源管理器
 * 复用 engine 中的 MaterialManager 和 GeometryFactory
 * 提供统一的材质和几何体获取接口
 */
import * as THREE from 'three'
import { MaterialManager } from '@/engine/materials/MaterialManager'
import { GeometryFactory } from '@/engine/objects/GeometryFactory'

// 单例实例
let materialManager: MaterialManager | null = null
let geometryFactory: GeometryFactory | null = null

// 圆柱几何体缓存（GeometryFactory 不支持圆柱，需要单独缓存）
const cylinderCache = new Map<string, THREE.CylinderGeometry>()

// TubeGeometry 缓存
const tubeCache = new Map<string, THREE.TubeGeometry>()

/**
 * 获取 MaterialManager 单例
 */
export function getMaterialManager(): MaterialManager {
  if (!materialManager) {
    materialManager = new MaterialManager()
  }
  return materialManager
}

/**
 * 获取 GeometryFactory 单例
 */
export function getGeometryFactory(): GeometryFactory {
  if (!geometryFactory) {
    geometryFactory = new GeometryFactory()
  }
  return geometryFactory
}

// ============================================================================
// 材质获取函数（使用 MaterialManager 缓存）
// ============================================================================

/** 墙壁材质 - 灰色 */
export function getWallMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x404040,
    metalness: 0.3,
    roughness: 0.7,
  })
}

/** 金属门材质 */
export function getDoorMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x888888,
    metalness: 0.8,
    roughness: 0.2,
  })
}

/** 地板材质 - 深灰 */
export function getFloorMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x333333,
    roughness: 0.9,
  })
}

/** 台阶材质 - 银色金属 */
export function getStepMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x888888,
    metalness: 0.7,
    roughness: 0.3,
  })
}

/** 扶手材质 - 黑色橡胶 */
export function getHandrailMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.8,
  })
}


/** 玻璃材质 */
export function getGlassMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,
    opacity: 0.3,
  })
}

/** 木质材质 */
export function getWoodMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x8B7355,
    roughness: 0.8,
  })
}

/** 白色瓷砖材质 */
export function getTileMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.7,
  })
}

/** 白墙材质 */
export function getWhiteWallMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.9,
  })
}

/** 隔间材质 */
export function getPartitionMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.1,
    roughness: 0.6,
  })
}

/** 柱子材质 */
export function getPostMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x3A3A3A,
    metalness: 0.5,
    roughness: 0.5,
  })
}

/** 梳齿板材质 - 黄色 */
export function getCombMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xffcc00,
    metalness: 0.3,
    roughness: 0.6,
  })
}

/** 服务台材质 */
export function getDeskMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x4a5568,
    metalness: 0.2,
    roughness: 0.8,
  })
}

/** 台面材质 - 大理石 */
export function getCounterMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.3,
    roughness: 0.4,
  })
}

/** 显示器材质 */
export function getMonitorMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.5,
    roughness: 0.3,
  })
}

/** 屏幕材质 - 蓝色发光 */
export function getScreenMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.2,
  })
}

/** 镜子材质 */
export function getMirrorMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xc4d4e4,
    metalness: 0.9,
    roughness: 0.1,
  })
}

/** 马桶材质 */
export function getToiletMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
  })
}

/** 水龙头材质 */
export function getFaucetMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.8,
    roughness: 0.2,
  })
}

/** 洗手台台面材质 */
export function getSinkCounterMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.3,
    roughness: 0.4,
  })
}

/** 洗手盆材质 */
export function getSinkMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xffffff,
    metalness: 0.4,
    roughness: 0.2,
  })
}

/** 基础材质 - 灰色 */
export function getBaseMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x404040,
    metalness: 0.6,
    roughness: 0.4,
  })
}

/** 凹槽材质 */
export function getGrooveMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x666666,
  })
}

/** 灰色地板材质 */
export function getGrayFloorMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.9,
  })
}

// ============================================================================
// 家具材质函数（供 furniture-models.ts 使用）
// ============================================================================

/** 家具木材材质 - 棕色 */
export function getFurnitureWoodMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.1,
  })
}

/** 家具金属材质 - 深灰 */
export function getFurnitureMetalMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.3,
    metalness: 0.8,
  })
}

/** 家具铬材质 - 亮银 */
export function getFurnitureChromeMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0xcccccc,
    roughness: 0.1,
    metalness: 0.9,
  })
}

/** 家具塑料材质 - 可配置颜色 */
export function getFurniturePlasticMaterial(color: number): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: color,
    roughness: 0.6,
    metalness: 0.0,
  })
}

/** 家具叶子材质 - 绿色 */
export function getFurnitureLeafMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x228b22,
    roughness: 0.8,
    metalness: 0.0,
  })
}

/** 家具陶瓷材质 - 可配置颜色 */
export function getFurnitureCeramicMaterial(color: number): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: color,
    roughness: 0.4,
    metalness: 0.1,
  })
}

// ============================================================================
// 几何体获取函数（使用 GeometryFactory 缓存）
// ============================================================================

/** 获取盒子几何体 */
export function getBoxGeometry(width: number, height: number, depth: number): THREE.BoxGeometry {
  return getGeometryFactory().getBoxGeometry({ width, height, depth })
}

/** 获取圆柱几何体（单独缓存） */
export function getCylinderGeometry(
  radius: number,
  height: number,
  segments: number = 8
): THREE.CylinderGeometry {
  const key = `cylinder_${radius}_${height}_${segments}`
  let geometry = cylinderCache.get(key)
  if (!geometry) {
    geometry = new THREE.CylinderGeometry(radius, radius, height, segments)
    cylinderCache.set(key, geometry)
  }
  return geometry
}

/** 获取锥形圆柱几何体 */
export function getTaperedCylinderGeometry(
  topRadius: number,
  bottomRadius: number,
  height: number,
  segments: number = 16
): THREE.CylinderGeometry {
  const key = `tapered_${topRadius}_${bottomRadius}_${height}_${segments}`
  let geometry = cylinderCache.get(key)
  if (!geometry) {
    geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments)
    cylinderCache.set(key, geometry)
  }
  return geometry
}


// ============================================================================
// 动态材质创建（带参数，使用缓存）
// ============================================================================

/** 创建指示灯材质（带选中状态） */
export function createIndicatorMaterial(color: number, isSelected: boolean): THREE.MeshStandardMaterial {
  const actualColor = isSelected ? 0x00ff00 : color
  return getMaterialManager().getStandardMaterial({
    color: actualColor,
    emissive: actualColor,
    emissiveIntensity: 0.5,
  })
}

/** 创建标识牌材质 */
export function createSignMaterial(color: number): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
  })
}

/** 创建选中发光材质 */
export function createGlowMaterial(color: number): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.3,
  })
}

/** 创建选中发光材质（楼梯用，较低透明度） */
export function createStairsGlowMaterial(color: number): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.5,
  })
}

// ============================================================================
// 资源清理
// ============================================================================

/**
 * 清理所有缓存的资源
 * 在组件卸载时调用
 */
export function disposeBuilderResources(): void {
  // 清理 MaterialManager
  if (materialManager) {
    materialManager.dispose()
    materialManager = null
  }
  
  // 清理 GeometryFactory
  if (geometryFactory) {
    geometryFactory.dispose()
    geometryFactory = null
  }
  
  // 清理圆柱几何体缓存
  cylinderCache.forEach(geometry => geometry.dispose())
  cylinderCache.clear()
  
  // 清理 Tube 几何体缓存
  tubeCache.forEach(geometry => geometry.dispose())
  tubeCache.clear()
}

/**
 * 获取缓存统计信息
 */
export function getResourceStats(): {
  materials: { standard: number; basic: number }
  geometries: { box: number; plane: number; cylinder: number; tube: number }
} {
  const matStats = materialManager?.getCacheSize() ?? { standard: 0, basic: 0 }
  const geoStats = geometryFactory?.getCacheSize() ?? { box: 0, plane: 0 }
  
  return {
    materials: matStats,
    geometries: {
      ...geoStats,
      cylinder: cylinderCache.size,
      tube: tubeCache.size,
    },
  }
}
