/**
 * 扶梯 3D 模型
 * 创建真实的扶梯模型，包含台阶、扶手、玻璃护栏
 */
import * as THREE from 'three'
import {
  getBaseMaterial,
  getStepMaterial,
  getHandrailMaterial,
  getGlassMaterial,
  getCombMaterial,
  getGrooveMaterial,
  getBoxGeometry,
  getCylinderGeometry,
  createGlowMaterial,
} from '../resources'

/**
 * 创建扶梯3D模型
 * @param group 要添加模型的组
 * @param width 扶梯宽度
 * @param depth 扶梯深度
 * @param color 颜色
 * @param isSelected 是否选中
 * @param heightScale 高度缩放比例（编辑模式下使用较小的值）
 */
export function createEscalatorModel(
  group: THREE.Group,
  width: number,
  depth: number,
  color: number,
  isSelected: boolean,
  heightScale: number = 1.0
): void {
  const height = 4 * heightScale
  const angle = Math.atan2(height, depth)
  const escalatorLength = Math.sqrt(depth * depth + height * height)
  const stepCount = Math.max(3, Math.floor(escalatorLength / 0.4))
  const stepWidth = width - 0.4
  const stepDepth = 0.4
  const stepHeight = 0.2 * heightScale
  
  // 使用缓存的材质
  const baseMaterial = getBaseMaterial()
  const stepMaterial = getStepMaterial()
  const handrailMaterial = getHandrailMaterial()
  const glassMaterial = getGlassMaterial()
  const combMaterial = getCombMaterial()
  const grooveMaterial = getGrooveMaterial()
  
  // 底部平台
  const bottomPlatform = new THREE.Mesh(
    getBoxGeometry(width, 0.3, 1.5),
    baseMaterial
  )
  bottomPlatform.position.set(0, 0.15, depth / 2 - 0.75)
  group.add(bottomPlatform)
  
  // 顶部平台
  const topPlatform = new THREE.Mesh(
    getBoxGeometry(width, 0.3, 1.5),
    baseMaterial
  )
  topPlatform.position.set(0, height + 0.15, -depth / 2 + 0.75)
  group.add(topPlatform)
  
  // 斜面底板
  const slopeGeometry = getBoxGeometry(width, 0.2, escalatorLength)
  const slope = new THREE.Mesh(slopeGeometry, baseMaterial)
  slope.rotation.x = angle
  slope.position.set(0, height / 2, 0)
  group.add(slope)
  
  // 台阶
  const stepGeometry = getBoxGeometry(stepWidth, stepHeight, stepDepth)
  const grooveGeometry = getBoxGeometry(stepWidth - 0.1, 0.02, 0.03)
  
  for (let i = 0; i < stepCount; i++) {
    const t = i / stepCount
    const x = 0
    const y = t * height + 0.3
    const z = depth / 2 - 1.5 - t * (depth - 3)
    
    const step = new THREE.Mesh(stepGeometry, stepMaterial)
    step.position.set(x, y, z)
    group.add(step)
    
    // 台阶凹槽线条
    const grooveCount = 5
    for (let g = 0; g < grooveCount; g++) {
      const groove = new THREE.Mesh(grooveGeometry, grooveMaterial)
      groove.position.set(x, y + stepHeight / 2 + 0.01, z - stepDepth / 2 + 0.08 + g * 0.07)
      group.add(groove)
    }
  }
  
  // 侧面玻璃护栏
  const glassHeight = 1.0 * heightScale
  const glassThickness = 0.02
  
  const leftGlassGeometry = getBoxGeometry(glassThickness, glassHeight, escalatorLength + 2)
  const leftGlass = new THREE.Mesh(leftGlassGeometry, glassMaterial)
  leftGlass.rotation.x = angle
  leftGlass.position.set(-width / 2 + 0.1, height / 2 + glassHeight / 2, 0)
  group.add(leftGlass)
  
  const rightGlass = new THREE.Mesh(leftGlassGeometry, glassMaterial)
  rightGlass.rotation.x = angle
  rightGlass.position.set(width / 2 - 0.1, height / 2 + glassHeight / 2, 0)
  group.add(rightGlass)

  
  // 扶手
  const handrailPoints: THREE.Vector3[] = []
  const segments = 20
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = t * height + 0.3 + glassHeight + 0.05
    const z = depth / 2 - 1 - t * (depth - 2)
    handrailPoints.push(new THREE.Vector3(0, y, z))
  }
  
  const handrailCurve = new THREE.CatmullRomCurve3(handrailPoints)
  const handrailGeometry = new THREE.TubeGeometry(handrailCurve, 30, 0.04, 8, false)
  
  const leftHandrail = new THREE.Mesh(handrailGeometry, handrailMaterial)
  leftHandrail.position.x = -width / 2 + 0.1
  group.add(leftHandrail)
  
  const rightHandrail = new THREE.Mesh(handrailGeometry, handrailMaterial)
  rightHandrail.position.x = width / 2 - 0.1
  group.add(rightHandrail)
  
  // 扶手支撑柱
  const postCount = 6
  const postGeometry = getCylinderGeometry(0.02, glassHeight, 8)
  
  for (let i = 0; i <= postCount; i++) {
    const t = i / postCount
    const y = t * height + 0.3
    const z = depth / 2 - 1 - t * (depth - 2)
    
    const leftPost = new THREE.Mesh(postGeometry, baseMaterial)
    leftPost.position.set(-width / 2 + 0.1, y + glassHeight / 2, z)
    group.add(leftPost)
    
    const rightPost = new THREE.Mesh(postGeometry, baseMaterial)
    rightPost.position.set(width / 2 - 0.1, y + glassHeight / 2, z)
    group.add(rightPost)
  }
  
  // 梳齿板
  const combGeometry = getBoxGeometry(stepWidth, 0.05, 0.3)
  
  const bottomComb = new THREE.Mesh(combGeometry, combMaterial)
  bottomComb.position.set(0, 0.32, depth / 2 - 1.35)
  group.add(bottomComb)
  
  const topComb = new THREE.Mesh(combGeometry, combMaterial)
  topComb.position.set(0, height + 0.32, -depth / 2 + 1.35)
  group.add(topComb)
  
  // 选中指示
  if (isSelected) {
    const glowMaterial = createGlowMaterial(color)
    const glow = new THREE.Mesh(
      getBoxGeometry(width + 0.2, 0.1, depth + 0.2),
      glowMaterial
    )
    glow.position.set(0, 0.05, 0)
    group.add(glow)
  }
}
