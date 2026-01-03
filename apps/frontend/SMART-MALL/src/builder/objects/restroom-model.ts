/**
 * 洗手间 3D 模型
 * 创建真实的洗手间模型，包含隔间、洗手台、镜子
 * 支持男女分区
 */
import * as THREE from 'three'
import {
  getWhiteWallMaterial,
  getTileMaterial,
  getPartitionMaterial,
  getToiletMaterial,
  getSinkCounterMaterial,
  getSinkMaterial,
  getFaucetMaterial,
  getMirrorMaterial,
  getBoxGeometry,
  getCylinderGeometry,
  getTaperedCylinderGeometry,
  createGlowMaterial,
} from '../resources'

/**
 * 创建性别标识
 */
function createGenderSign(
  isMale: boolean,
  size: number = 0.3
): THREE.Group {
  const group = new THREE.Group()
  
  const signColor = isMale ? 0x2196f3 : 0xe91e63  // 蓝色/粉色
  const material = new THREE.MeshStandardMaterial({
    color: signColor,
    metalness: 0.3,
    roughness: 0.5,
  })
  
  // 背景板
  const bgMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.8,
  })
  const bg = new THREE.Mesh(
    new THREE.BoxGeometry(size * 1.2, size * 1.5, 0.02),
    bgMaterial
  )
  group.add(bg)
  
  // 人形图标
  // 头
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.15, 16, 16),
    material
  )
  head.position.set(0, size * 0.45, 0.02)
  group.add(head)
  
  // 身体
  if (isMale) {
    // 男性 - 简单的身体
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.25, size * 0.4, 0.03),
      material
    )
    body.position.set(0, size * 0.1, 0.02)
    group.add(body)
    
    // 腿
    const leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.1, size * 0.35, 0.03),
      material
    )
    leftLeg.position.set(-size * 0.08, -size * 0.28, 0.02)
    group.add(leftLeg)
    
    const rightLeg = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.1, size * 0.35, 0.03),
      material
    )
    rightLeg.position.set(size * 0.08, -size * 0.28, 0.02)
    group.add(rightLeg)
  } else {
    // 女性 - 裙子形状
    const bodyTop = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.2, size * 0.2, 0.03),
      material
    )
    bodyTop.position.set(0, size * 0.2, 0.02)
    group.add(bodyTop)
    
    // 裙子（梯形）
    const skirtGeometry = new THREE.CylinderGeometry(size * 0.1, size * 0.2, size * 0.35, 16, 1, true)
    const skirt = new THREE.Mesh(skirtGeometry, material)
    skirt.position.set(0, -size * 0.08, 0.02)
    group.add(skirt)
  }
  
  return group
}

/**
 * 创建小便池
 */
function createUrinal(heightScale: number = 1.0): THREE.Mesh {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.2,
  })
  
  const geometry = new THREE.BoxGeometry(0.35, 0.5 * heightScale, 0.25)
  const urinal = new THREE.Mesh(geometry, material)
  
  return urinal
}

/**
 * 创建洗手间3D模型（支持男女分区）
 */
export function createRestroomModel(
  group: THREE.Group,
  width: number,
  depth: number,
  color: number,
  isSelected: boolean,
  heightScale: number = 1.0
): void {
  const wallHeight = 2.8 * heightScale
  const wallThickness = 0.1
  
  const wallMaterial = getWhiteWallMaterial()
  const tileMaterial = getTileMaterial()
  const partitionMaterial = getPartitionMaterial()
  
  // 地板
  const floor = new THREE.Mesh(
    getBoxGeometry(width, 0.05, depth),
    tileMaterial
  )
  floor.position.set(0, 0.025, 0)
  group.add(floor)
  
  // 后墙
  const backWall = new THREE.Mesh(
    getBoxGeometry(width, wallHeight, wallThickness),
    wallMaterial
  )
  backWall.position.set(0, wallHeight / 2, -depth / 2 + wallThickness / 2)
  group.add(backWall)
  
  // 左墙
  const leftWall = new THREE.Mesh(
    getBoxGeometry(wallThickness, wallHeight, depth),
    wallMaterial
  )
  leftWall.position.set(-width / 2 + wallThickness / 2, wallHeight / 2, 0)
  group.add(leftWall)
  
  // 右墙
  const rightWall = new THREE.Mesh(
    getBoxGeometry(wallThickness, wallHeight, depth),
    wallMaterial
  )
  rightWall.position.set(width / 2 - wallThickness / 2, wallHeight / 2, 0)
  group.add(rightWall)
  
  // 中间隔墙（分隔男女区域）
  const dividerWall = new THREE.Mesh(
    getBoxGeometry(wallThickness, wallHeight, depth - wallThickness),
    wallMaterial
  )
  dividerWall.position.set(0, wallHeight / 2, wallThickness / 2)
  group.add(dividerWall)
  
  if (heightScale > 0.5) {
    const halfWidth = (width - wallThickness) / 2 - wallThickness
    
    // ========== 男厕区域（左侧）==========
    const maleAreaX = -width / 4 - wallThickness / 4
    
    // 男厕标识
    const maleSign = createGenderSign(true, 0.25 * heightScale)
    maleSign.position.set(maleAreaX, wallHeight - 0.4 * heightScale, depth / 2 - 0.01)
    group.add(maleSign)
    
    // 小便池
    const urinalCount = Math.max(2, Math.floor(halfWidth / 0.6))
    const urinalSpacing = halfWidth / urinalCount
    
    for (let i = 0; i < urinalCount; i++) {
      const urinalX = -width / 2 + wallThickness + urinalSpacing * (i + 0.5)
      const urinal = createUrinal(heightScale)
      urinal.position.set(urinalX, 0.7 * heightScale, -depth / 2 + wallThickness + 0.2)
      group.add(urinal)
      
      // 小便池隔板
      if (i < urinalCount - 1) {
        const divider = new THREE.Mesh(
          getBoxGeometry(0.02, 1.0 * heightScale, 0.4),
          partitionMaterial
        )
        divider.position.set(urinalX + urinalSpacing / 2, 0.8 * heightScale, -depth / 2 + wallThickness + 0.3)
        group.add(divider)
      }
    }
    
    // 男厕隔间（1-2个）
    const maleStallCount = Math.max(1, Math.floor(halfWidth / 1.5))
    const maleStallWidth = halfWidth / maleStallCount
    const stallDepth = depth * 0.4
    const stallHeight = 2.0 * heightScale
    
    const toiletMaterial = getToiletMaterial()
    
    for (let i = 0; i < maleStallCount; i++) {
      const stallX = -width / 2 + wallThickness + maleStallWidth * (i + 0.5)
      const stallZ = depth / 2 - stallDepth / 2 - 0.8
      
      // 隔间隔板
      if (i < maleStallCount - 1) {
        const partition = new THREE.Mesh(
          getBoxGeometry(0.03, stallHeight, stallDepth),
          partitionMaterial
        )
        partition.position.set(stallX + maleStallWidth / 2, stallHeight / 2 + 0.2, stallZ)
        group.add(partition)
      }
      
      // 隔间门
      const door = new THREE.Mesh(
        getBoxGeometry(maleStallWidth * 0.7, stallHeight - 0.3, 0.03),
        partitionMaterial
      )
      door.position.set(stallX, stallHeight / 2 + 0.15, stallZ + stallDepth / 2)
      group.add(door)
      
      // 马桶
      const toilet = new THREE.Mesh(
        getBoxGeometry(0.4, 0.4 * heightScale, 0.5),
        toiletMaterial
      )
      toilet.position.set(stallX, 0.2 * heightScale, stallZ - stallDepth / 4)
      group.add(toilet)
    }
    
    // ========== 女厕区域（右侧）==========
    const femaleAreaX = width / 4 + wallThickness / 4
    
    // 女厕标识
    const femaleSign = createGenderSign(false, 0.25 * heightScale)
    femaleSign.position.set(femaleAreaX, wallHeight - 0.4 * heightScale, depth / 2 - 0.01)
    group.add(femaleSign)
    
    // 女厕隔间（更多）
    const femaleStallCount = Math.max(2, Math.floor(halfWidth / 1.0))
    const femaleStallWidth = halfWidth / femaleStallCount
    
    for (let i = 0; i < femaleStallCount; i++) {
      const stallX = wallThickness / 2 + femaleStallWidth * (i + 0.5)
      const stallZ = -depth / 2 + stallDepth / 2 + wallThickness
      
      // 隔间隔板
      if (i < femaleStallCount - 1) {
        const partition = new THREE.Mesh(
          getBoxGeometry(0.03, stallHeight, stallDepth),
          partitionMaterial
        )
        partition.position.set(stallX + femaleStallWidth / 2, stallHeight / 2 + 0.2, stallZ)
        group.add(partition)
      }
      
      // 隔间门
      const door = new THREE.Mesh(
        getBoxGeometry(femaleStallWidth * 0.7, stallHeight - 0.3, 0.03),
        partitionMaterial
      )
      door.position.set(stallX, stallHeight / 2 + 0.15, stallZ + stallDepth / 2)
      group.add(door)
      
      // 马桶
      const toilet = new THREE.Mesh(
        getBoxGeometry(0.4, 0.4 * heightScale, 0.5),
        toiletMaterial
      )
      toilet.position.set(stallX, 0.2 * heightScale, stallZ - stallDepth / 4)
      group.add(toilet)
    }
    
    // ========== 洗手台区域（两侧共用前部）==========
    const sinkCounterMaterial = getSinkCounterMaterial()
    const sinkMaterial = getSinkMaterial()
    const faucetMaterial = getFaucetMaterial()
    const mirrorMaterial = getMirrorMaterial()
    
    // 男厕洗手台
    const maleSinkCount = Math.max(2, Math.floor(halfWidth / 0.6))
    const maleSinkSpacing = halfWidth / maleSinkCount
    
    const maleSinkCounter = new THREE.Mesh(
      getBoxGeometry(halfWidth, 0.1, 0.5),
      sinkCounterMaterial
    )
    maleSinkCounter.position.set(maleAreaX, 0.85 * heightScale, depth / 2 - 0.4)
    group.add(maleSinkCounter)
    
    for (let i = 0; i < maleSinkCount; i++) {
      const sinkX = -width / 2 + wallThickness + maleSinkSpacing * (i + 0.5)
      
      const sink = new THREE.Mesh(
        getTaperedCylinderGeometry(0.15, 0.12, 0.08, 16),
        sinkMaterial
      )
      sink.position.set(sinkX, 0.9 * heightScale, depth / 2 - 0.4)
      group.add(sink)
      
      const faucet = new THREE.Mesh(
        getCylinderGeometry(0.015, 0.12 * heightScale, 8),
        faucetMaterial
      )
      faucet.position.set(sinkX, 0.98 * heightScale, depth / 2 - 0.28)
      group.add(faucet)
    }
    
    // 男厕镜子
    const maleMirror = new THREE.Mesh(
      getBoxGeometry(halfWidth - 0.1, 0.8 * heightScale, 0.02),
      mirrorMaterial
    )
    maleMirror.position.set(maleAreaX, 1.5 * heightScale, depth / 2 - 0.15)
    group.add(maleMirror)
    
    // 女厕洗手台
    const femaleSinkCount = Math.max(2, Math.floor(halfWidth / 0.5))
    const femaleSinkSpacing = halfWidth / femaleSinkCount
    
    const femaleSinkCounter = new THREE.Mesh(
      getBoxGeometry(halfWidth, 0.1, 0.5),
      sinkCounterMaterial
    )
    femaleSinkCounter.position.set(femaleAreaX, 0.85 * heightScale, depth / 2 - 0.4)
    group.add(femaleSinkCounter)
    
    for (let i = 0; i < femaleSinkCount; i++) {
      const sinkX = wallThickness / 2 + femaleSinkSpacing * (i + 0.5)
      
      const sink = new THREE.Mesh(
        getTaperedCylinderGeometry(0.15, 0.12, 0.08, 16),
        sinkMaterial
      )
      sink.position.set(sinkX, 0.9 * heightScale, depth / 2 - 0.4)
      group.add(sink)
      
      const faucet = new THREE.Mesh(
        getCylinderGeometry(0.015, 0.12 * heightScale, 8),
        faucetMaterial
      )
      faucet.position.set(sinkX, 0.98 * heightScale, depth / 2 - 0.28)
      group.add(faucet)
    }
    
    // 女厕镜子
    const femaleMirror = new THREE.Mesh(
      getBoxGeometry(halfWidth - 0.1, 0.8 * heightScale, 0.02),
      mirrorMaterial
    )
    femaleMirror.position.set(femaleAreaX, 1.5 * heightScale, depth / 2 - 0.15)
    group.add(femaleMirror)
  }
  
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
