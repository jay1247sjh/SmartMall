/**
 * 商场基础设施 3D 模型
 * 包含长椅、路灯、垃圾桶、指示牌、花盆等
 */
import * as THREE from 'three'
import {
  getFurnitureWoodMaterial,
  getFurnitureMetalMaterial,
  getFurnitureChromeMaterial,
  getFurniturePlasticMaterial,
  getFurnitureLeafMaterial,
  getFurnitureCeramicMaterial,
  getGlassMaterial,
  getMaterialManager,
} from '../resources/resource-manager'

// 导出 getGlassMaterial 供其他模块使用
export { getGlassMaterial }

// ============================================================================
// 长椅模型
// ============================================================================

/**
 * 创建商场长椅
 */
export function createBenchModel(
  length: number = 2,
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'bench'
  
  const woodMaterial = getFurnitureWoodMaterial()
  const metalMaterial = getFurnitureMetalMaterial()
  
  const seatHeight = 0.45 * heightScale
  const seatDepth = 0.4
  const seatThickness = 0.05
  const backHeight = 0.4 * heightScale
  
  // 座板（多条木板）
  const slatsCount = Math.max(3, Math.floor(length / 0.15))
  const slatWidth = (length - 0.1) / slatsCount
  
  for (let i = 0; i < slatsCount; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(slatWidth - 0.02, seatThickness, seatDepth),
      woodMaterial
    )
    slat.position.set(
      -length / 2 + slatWidth * (i + 0.5) + 0.05,
      seatHeight,
      0
    )
    slat.castShadow = true
    slat.receiveShadow = true
    group.add(slat)
  }
  
  // 靠背（多条木板）
  for (let i = 0; i < slatsCount; i++) {
    const backSlat = new THREE.Mesh(
      new THREE.BoxGeometry(slatWidth - 0.02, backHeight, seatThickness),
      woodMaterial
    )
    backSlat.position.set(
      -length / 2 + slatWidth * (i + 0.5) + 0.05,
      seatHeight + backHeight / 2 + seatThickness,
      -seatDepth / 2 + seatThickness / 2
    )
    backSlat.castShadow = true
    group.add(backSlat)
  }
  
  // 金属支架
  const legPositions = [-length / 2 + 0.15, length / 2 - 0.15]
  
  legPositions.forEach(x => {
    // 前腿
    const frontLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, seatHeight, 8),
      metalMaterial
    )
    frontLeg.position.set(x, seatHeight / 2, seatDepth / 2 - 0.05)
    frontLeg.castShadow = true
    group.add(frontLeg)
    
    // 后腿（延伸到靠背）
    const backLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, seatHeight + backHeight + seatThickness, 8),
      metalMaterial
    )
    backLeg.position.set(x, (seatHeight + backHeight + seatThickness) / 2, -seatDepth / 2 + 0.05)
    backLeg.castShadow = true
    group.add(backLeg)
    
    // 横梁
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.03, seatDepth - 0.1),
      metalMaterial
    )
    beam.position.set(x, seatHeight - 0.1, 0)
    group.add(beam)
  })
  
  // 扶手
  const armrestPositions = [-length / 2 + 0.1, length / 2 - 0.1]
  armrestPositions.forEach(x => {
    const armrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.03, seatDepth * 0.6),
      woodMaterial
    )
    armrest.position.set(x, seatHeight + 0.25 * heightScale, 0)
    armrest.castShadow = true
    group.add(armrest)
  })
  
  return group
}


// ============================================================================
// 路灯模型
// ============================================================================

/**
 * 创建商场路灯/装饰灯
 */
export function createLampPostModel(
  height: number = 3,
  style: 'modern' | 'classic' | 'mall' = 'mall'
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'lamp-post'
  
  const metalMaterial = getFurnitureMetalMaterial()
  const chromeMaterial = getFurnitureChromeMaterial()
  
  if (style === 'mall') {
    // 现代商场风格 - 简约立柱灯
    
    // 底座
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.1, 16),
      metalMaterial
    )
    base.position.y = 0.05
    base.castShadow = true
    group.add(base)
    
    // 灯柱
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, height - 0.3, 8),
      chromeMaterial
    )
    pole.position.y = height / 2
    pole.castShadow = true
    group.add(pole)
    
    // 灯头（圆形）
    const lampHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      getMaterialManager().getStandardMaterial({
        color: 0xffffee,
        emissive: 0xffffaa,
        emissiveIntensity: 0.5,
        roughness: 0.3,
      })
    )
    lampHead.position.y = height - 0.1
    group.add(lampHead)
    
    // 点光源
    const light = new THREE.PointLight(0xffffee, 1, 8)
    light.position.y = height - 0.1
    group.add(light)
    
  } else if (style === 'modern') {
    // 现代简约风格
    
    // 底座
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.05, 0.3),
      metalMaterial
    )
    base.position.y = 0.025
    group.add(base)
    
    // 灯柱
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, height - 0.5, 0.08),
      chromeMaterial
    )
    pole.position.y = height / 2 - 0.2
    pole.castShadow = true
    group.add(pole)
    
    // 灯头（方形）
    const lampHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.1, 0.25),
      getMaterialManager().getStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffcc,
        emissiveIntensity: 0.6,
      })
    )
    lampHead.position.y = height - 0.25
    group.add(lampHead)
    
    const light = new THREE.PointLight(0xffffff, 1.2, 10)
    light.position.y = height - 0.2
    group.add(light)
    
  } else {
    // 经典风格
    
    // 底座
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.15, 8),
      metalMaterial
    )
    base.position.y = 0.075
    group.add(base)
    
    // 灯柱
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, height - 0.6, 8),
      metalMaterial
    )
    pole.position.y = height / 2 - 0.15
    pole.castShadow = true
    group.add(pole)
    
    // 灯笼形灯头
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 0.1, 8),
      metalMaterial
    )
    lampBase.position.y = height - 0.45
    group.add(lampBase)
    
    const lampGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.3, 8),
      getMaterialManager().getStandardMaterial({
        color: 0xffffee,
        emissive: 0xffeeaa,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.8,
      })
    )
    lampGlass.position.y = height - 0.25
    group.add(lampGlass)
    
    const lampTop = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.1, 8),
      metalMaterial
    )
    lampTop.position.y = height - 0.05
    group.add(lampTop)
    
    const light = new THREE.PointLight(0xffeeaa, 0.8, 6)
    light.position.y = height - 0.25
    group.add(light)
  }
  
  return group
}


// ============================================================================
// 垃圾桶模型
// ============================================================================

/**
 * 创建垃圾桶
 */
export function createTrashBinModel(
  style: 'single' | 'recycling' = 'recycling',
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'trash-bin'
  
  const metalMaterial = getFurnitureMetalMaterial()
  const height = 0.9 * heightScale
  
  if (style === 'recycling') {
    // 分类垃圾桶（三个）
    const colors = [0x4caf50, 0x2196f3, 0xff9800]  // 绿、蓝、橙
    // labels: ['可回收', '其他', '有害'] - 用于未来添加文字标签
    const binWidth = 0.3
    const spacing = 0.35
    
    colors.forEach((color, i) => {
      const x = (i - 1) * spacing
      
      // 桶身
      const bin = new THREE.Mesh(
        new THREE.CylinderGeometry(binWidth / 2, binWidth / 2 - 0.02, height, 16),
        getFurniturePlasticMaterial(color)
      )
      bin.position.set(x, height / 2, 0)
      bin.castShadow = true
      group.add(bin)
      
      // 桶盖
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(binWidth / 2 + 0.02, binWidth / 2 + 0.02, 0.05, 16),
        getFurniturePlasticMaterial(color - 0x222222)
      )
      lid.position.set(x, height + 0.025, 0)
      group.add(lid)
      
      // 投入口
      const opening = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.02, 0.05),
        metalMaterial
      )
      opening.position.set(x, height + 0.04, 0)
      group.add(opening)
    })
    
    // 底座框架
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(spacing * 3, 0.05, binWidth + 0.1),
      metalMaterial
    )
    frame.position.y = 0.025
    group.add(frame)
    
  } else {
    // 单个垃圾桶
    const bin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.18, height, 16),
      metalMaterial
    )
    bin.position.y = height / 2
    bin.castShadow = true
    group.add(bin)
    
    // 摇摆盖
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16, 1, false, 0, Math.PI),
      metalMaterial
    )
    lid.position.set(0, height, 0)
    lid.rotation.x = -0.2
    group.add(lid)
  }
  
  return group
}

// ============================================================================
// 花盆/绿植模型
// ============================================================================

/**
 * 创建装饰花盆
 */
export function createPlanterModel(
  size: 'small' | 'medium' | 'large' = 'medium',
  plantType: 'tree' | 'bush' | 'flowers' = 'bush'
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'planter'
  
  const sizes = {
    small: { pot: 0.3, height: 0.25 },
    medium: { pot: 0.5, height: 0.4 },
    large: { pot: 0.8, height: 0.5 },
  }
  
  const { pot: potSize, height: potHeight } = sizes[size]
  const ceramicMaterial = getFurnitureCeramicMaterial(0x8b7355)
  const leafMaterial = getFurnitureLeafMaterial()
  
  // 花盆
  const potGeometry = new THREE.CylinderGeometry(
    potSize / 2,
    potSize / 2 - 0.05,
    potHeight,
    16
  )
  const pot = new THREE.Mesh(potGeometry, ceramicMaterial)
  pot.position.y = potHeight / 2
  pot.castShadow = true
  pot.receiveShadow = true
  group.add(pot)
  
  // 土壤
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(potSize / 2 - 0.02, potSize / 2 - 0.02, 0.05, 16),
    getMaterialManager().getStandardMaterial({ color: 0x3d2817, roughness: 1 })
  )
  soil.position.y = potHeight - 0.02
  group.add(soil)
  
  // 植物
  if (plantType === 'tree') {
    // 小树
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.05, potSize * 1.5, 8),
      getMaterialManager().getStandardMaterial({ color: 0x4a3728, roughness: 0.9 })
    )
    trunk.position.y = potHeight + potSize * 0.75
    group.add(trunk)
    
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(potSize * 0.6, 16, 16),
      leafMaterial
    )
    foliage.position.y = potHeight + potSize * 1.8
    foliage.castShadow = true
    group.add(foliage)
    
  } else if (plantType === 'bush') {
    // 灌木
    const bushCount = size === 'large' ? 5 : 3
    for (let i = 0; i < bushCount; i++) {
      const angle = (i / bushCount) * Math.PI * 2
      const radius = potSize * 0.2
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(potSize * 0.35, 12, 12),
        leafMaterial
      )
      bush.position.set(
        Math.cos(angle) * radius,
        potHeight + potSize * 0.4,
        Math.sin(angle) * radius
      )
      bush.scale.y = 1.2
      bush.castShadow = true
      group.add(bush)
    }
    
  } else {
    // 花朵
    const flowerColors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff]
    const flowerCount = size === 'large' ? 8 : 5
    
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i / flowerCount) * Math.PI * 2 + Math.random() * 0.5
      const radius = potSize * 0.25 * Math.random()
      const flowerHeight = potSize * 0.5 + Math.random() * potSize * 0.3
      
      // 茎
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, flowerHeight, 4),
        leafMaterial
      )
      stem.position.set(
        Math.cos(angle) * radius,
        potHeight + flowerHeight / 2,
        Math.sin(angle) * radius
      )
      group.add(stem)
      
      // 花朵
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        getMaterialManager().getStandardMaterial({
          color: flowerColors[i % flowerColors.length],
          roughness: 0.5,
        })
      )
      flower.position.set(
        Math.cos(angle) * radius,
        potHeight + flowerHeight,
        Math.sin(angle) * radius
      )
      group.add(flower)
    }
  }
  
  return group
}


// ============================================================================
// 指示牌模型
// ============================================================================

/**
 * 创建指示牌/导视牌
 */
export function createSignPostModel(
  _text: string = '出口',  // 预留参数，用于未来添加文字渲染
  style: 'standing' | 'hanging' | 'wall' = 'standing',
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'sign-post'
  
  const metalMaterial = getFurnitureMetalMaterial()
  const signHeight = 2.2 * heightScale
  
  if (style === 'standing') {
    // 立式指示牌
    
    // 底座
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 0.08, 16),
      metalMaterial
    )
    base.position.y = 0.04
    group.add(base)
    
    // 立柱
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, signHeight - 0.5, 8),
      metalMaterial
    )
    pole.position.y = signHeight / 2 - 0.2
    pole.castShadow = true
    group.add(pole)
    
    // 指示牌面板
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.4, 0.03),
      getMaterialManager().getStandardMaterial({
        color: 0x1a237e,
        roughness: 0.3,
      })
    )
    signBoard.position.y = signHeight - 0.3
    group.add(signBoard)
    
    // 发光边框
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.44, 0.02),
      getMaterialManager().getStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
      })
    )
    frame.position.set(0, signHeight - 0.3, -0.02)
    group.add(frame)
    
  } else if (style === 'hanging') {
    // 悬挂式指示牌
    
    // 吊杆
    const hanger = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.03, 0.03),
      metalMaterial
    )
    hanger.position.y = signHeight
    group.add(hanger)
    
    // 吊链
    const chainLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4),
      metalMaterial
    )
    chainLeft.position.set(-0.3, signHeight - 0.15, 0)
    group.add(chainLeft)
    
    const chainRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4),
      metalMaterial
    )
    chainRight.position.set(0.3, signHeight - 0.15, 0)
    group.add(chainRight)
    
    // 双面指示牌
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.35, 0.05),
      getMaterialManager().getStandardMaterial({
        color: 0x2e7d32,
        roughness: 0.3,
        emissive: 0x1b5e20,
        emissiveIntensity: 0.2,
      })
    )
    signBoard.position.y = signHeight - 0.45
    group.add(signBoard)
    
  } else {
    // 墙面指示牌
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.02),
      getMaterialManager().getStandardMaterial({
        color: 0x0277bd,
        roughness: 0.2,
        emissive: 0x01579b,
        emissiveIntensity: 0.3,
      })
    )
    signBoard.position.y = signHeight * 0.8
    group.add(signBoard)
  }
  
  return group
}

// ============================================================================
// 自动扶梯装饰
// ============================================================================

/**
 * 创建商场中庭喷泉
 */
export function createFountainModel(
  radius: number = 2,
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'fountain'
  
  const stoneMaterial = getMaterialManager().getStandardMaterial({
    color: 0x9e9e9e,
    roughness: 0.7,
    metalness: 0.1,
  })
  
  const waterMaterial = getMaterialManager().getStandardMaterial({
    color: 0x4fc3f7,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7,
  })
  
  // 外圈池
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.15, 8, 32),
    stoneMaterial
  )
  outerRing.rotation.x = Math.PI / 2
  outerRing.position.y = 0.3 * heightScale
  outerRing.castShadow = true
  group.add(outerRing)
  
  // 水面
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.1, 32),
    waterMaterial
  )
  water.rotation.x = -Math.PI / 2
  water.position.y = 0.25 * heightScale
  group.add(water)
  
  // 中心柱
  const centerPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 1.0 * heightScale, 16),
    stoneMaterial
  )
  centerPillar.position.y = 0.5 * heightScale
  centerPillar.castShadow = true
  group.add(centerPillar)
  
  // 顶部喷水口
  const spout = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    stoneMaterial
  )
  spout.position.y = 1.1 * heightScale
  group.add(spout)
  
  // 水柱效果（简化）
  const waterJet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.05, 0.5 * heightScale, 8),
    waterMaterial
  )
  waterJet.position.y = 1.4 * heightScale
  group.add(waterJet)
  
  return group
}

// ============================================================================
// 信息亭/服务台
// ============================================================================

/**
 * 创建信息亭
 */
export function createKioskModel(
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'kiosk'
  
  const metalMaterial = getFurnitureMetalMaterial()
  // glassMaterial 预留用于未来添加玻璃展示柜
  
  const width = 1.2
  const depth = 0.8
  const height = 2.2 * heightScale
  const counterHeight = 1.0 * heightScale
  
  // 柜台
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(width, counterHeight, depth),
    getMaterialManager().getStandardMaterial({
      color: 0x37474f,
      roughness: 0.3,
      metalness: 0.5,
    })
  )
  counter.position.y = counterHeight / 2
  counter.castShadow = true
  group.add(counter)
  
  // 柜台面板
  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.1, 0.05, depth + 0.1),
    getMaterialManager().getStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    })
  )
  counterTop.position.y = counterHeight + 0.025
  group.add(counterTop)
  
  // 顶棚支架
  const pillarPositions = [
    { x: -width / 2 + 0.05, z: -depth / 2 + 0.05 },
    { x: width / 2 - 0.05, z: -depth / 2 + 0.05 },
    { x: -width / 2 + 0.05, z: depth / 2 - 0.05 },
    { x: width / 2 - 0.05, z: depth / 2 - 0.05 },
  ]
  
  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, height - counterHeight, 8),
      metalMaterial
    )
    pillar.position.set(pos.x, counterHeight + (height - counterHeight) / 2, pos.z)
    pillar.castShadow = true
    group.add(pillar)
  })
  
  // 顶棚
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, 0.08, depth + 0.3),
    metalMaterial
  )
  roof.position.y = height
  roof.castShadow = true
  group.add(roof)
  
  // 信息屏幕
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.4, 0.03),
    getMaterialManager().getStandardMaterial({
      color: 0x000000,
      emissive: 0x1565c0,
      emissiveIntensity: 0.5,
    })
  )
  screen.position.set(0, counterHeight + 0.3, depth / 2 + 0.02)
  group.add(screen)
  
  return group
}


// ============================================================================
// ATM 机
// ============================================================================

/**
 * 创建 ATM 机模型
 */
export function createATMModel(
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'atm'
  
  const metalMaterial = getFurnitureMetalMaterial()
  
  const width = 0.6
  const depth = 0.5
  const height = 1.5 * heightScale
  
  // 主体
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    getMaterialManager().getStandardMaterial({
      color: 0x1565c0,
      roughness: 0.3,
      metalness: 0.6,
    })
  )
  body.position.y = height / 2
  body.castShadow = true
  group.add(body)
  
  // 屏幕
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.7, height * 0.25, 0.02),
    getMaterialManager().getStandardMaterial({
      color: 0x000000,
      emissive: 0x4fc3f7,
      emissiveIntensity: 0.6,
    })
  )
  screen.position.set(0, height * 0.7, depth / 2 + 0.01)
  group.add(screen)
  
  // 键盘区域
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.6, height * 0.15, 0.05),
    metalMaterial
  )
  keyboard.position.set(0, height * 0.4, depth / 2 + 0.03)
  keyboard.rotation.x = -0.3
  group.add(keyboard)
  
  // 出钞口
  const cashSlot = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.5, 0.03, 0.08),
    getMaterialManager().getStandardMaterial({
      color: 0x212121,
      roughness: 0.8,
    })
  )
  cashSlot.position.set(0, height * 0.2, depth / 2 + 0.04)
  group.add(cashSlot)
  
  // 银行标志
  const logo = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.4, 0.08, 0.01),
    getMaterialManager().getStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
    })
  )
  logo.position.set(0, height * 0.9, depth / 2 + 0.01)
  group.add(logo)
  
  return group
}

// ============================================================================
// 自动售货机
// ============================================================================

/**
 * 创建自动售货机模型
 */
export function createVendingMachineModel(
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'vending-machine'
  
  const width = 0.9
  const depth = 0.7
  const height = 1.8 * heightScale
  
  // 主体
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    getMaterialManager().getStandardMaterial({
      color: 0xd32f2f,
      roughness: 0.4,
      metalness: 0.3,
    })
  )
  body.position.y = height / 2
  body.castShadow = true
  group.add(body)
  
  // 玻璃展示窗
  const glassWindow = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.85, height * 0.55, 0.02),
    getMaterialManager().getStandardMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
    })
  )
  glassWindow.position.set(0, height * 0.6, depth / 2 + 0.01)
  group.add(glassWindow)
  
  // 商品架（简化显示）
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const item = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8),
        getMaterialManager().getStandardMaterial({
          color: [0xff5722, 0x4caf50, 0x2196f3, 0xffeb3b][col % 4],
          roughness: 0.5,
        })
      )
      item.position.set(
        -width * 0.3 + col * 0.18,
        height * 0.45 + row * 0.18,
        depth / 2 - 0.1
      )
      group.add(item)
    }
  }
  
  // 操作面板
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.3, height * 0.15, 0.05),
    getFurnitureMetalMaterial()
  )
  panel.position.set(width * 0.25, height * 0.2, depth / 2 + 0.03)
  group.add(panel)
  
  // 取货口
  const pickupSlot = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.5, 0.15, 0.1),
    getMaterialManager().getStandardMaterial({
      color: 0x212121,
      roughness: 0.9,
    })
  )
  pickupSlot.position.set(-width * 0.1, 0.1, depth / 2 + 0.05)
  group.add(pickupSlot)
  
  return group
}

// ============================================================================
// 信息显示屏
// ============================================================================

/**
 * 创建信息显示屏模型
 */
export function createInfoBoardModel(
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'info-board'
  
  const metalMaterial = getFurnitureMetalMaterial()
  
  const screenWidth = 1.2
  const screenHeight = 0.8 * heightScale
  const standHeight = 1.5 * heightScale
  
  // 支架
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, standHeight, 8),
    metalMaterial
  )
  stand.position.y = standHeight / 2
  stand.castShadow = true
  group.add(stand)
  
  // 底座
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.05, 16),
    metalMaterial
  )
  base.position.y = 0.025
  group.add(base)
  
  // 屏幕框架
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(screenWidth + 0.1, screenHeight + 0.1, 0.08),
    metalMaterial
  )
  frame.position.y = standHeight + screenHeight / 2
  frame.castShadow = true
  group.add(frame)
  
  // 屏幕
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(screenWidth, screenHeight, 0.02),
    getMaterialManager().getStandardMaterial({
      color: 0x000000,
      emissive: 0x2196f3,
      emissiveIntensity: 0.5,
    })
  )
  screen.position.set(0, standHeight + screenHeight / 2, 0.04)
  group.add(screen)
  
  return group
}

// ============================================================================
// 装饰时钟
// ============================================================================

/**
 * 创建装饰时钟模型
 */
export function createClockModel(
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'clock'
  
  const metalMaterial = getFurnitureMetalMaterial()
  const chromeMaterial = getFurnitureChromeMaterial()
  
  const radius = 0.4 * heightScale
  const standHeight = 2.0 * heightScale
  
  // 支架
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, standHeight, 8),
    metalMaterial
  )
  stand.position.y = standHeight / 2
  stand.castShadow = true
  group.add(stand)
  
  // 底座
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.08, 16),
    metalMaterial
  )
  base.position.y = 0.04
  group.add(base)
  
  // 钟面框架
  const clockFrame = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.05, 8, 32),
    chromeMaterial
  )
  clockFrame.position.y = standHeight + radius
  clockFrame.rotation.x = Math.PI / 2
  group.add(clockFrame)
  
  // 钟面
  const clockFace = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.02, 32),
    getMaterialManager().getStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
    })
  )
  clockFace.position.set(0, standHeight + radius, 0.03)
  group.add(clockFace)
  
  // 时针
  const hourHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, radius * 0.5, 0.02),
    getMaterialManager().getStandardMaterial({ color: 0x212121 })
  )
  hourHand.position.set(0, standHeight + radius + radius * 0.15, 0.04)
  hourHand.rotation.z = Math.PI / 6  // 指向2点钟方向
  group.add(hourHand)
  
  // 分针
  const minuteHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, radius * 0.7, 0.02),
    getMaterialManager().getStandardMaterial({ color: 0x212121 })
  )
  minuteHand.position.set(0, standHeight + radius + radius * 0.2, 0.05)
  minuteHand.rotation.z = -Math.PI / 3  // 指向10点钟方向
  group.add(minuteHand)
  
  // 中心点
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    chromeMaterial
  )
  center.position.set(0, standHeight + radius, 0.05)
  group.add(center)
  
  return group
}

// ============================================================================
// 消防栓
// ============================================================================

/**
 * 创建消防栓模型
 */
export function createFireExtinguisherModel(
  heightScale: number = 1.0
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'fire-extinguisher'
  
  const height = 1.2 * heightScale
  
  // 消防柜
  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, height, 0.25),
    getMaterialManager().getStandardMaterial({
      color: 0xd32f2f,
      roughness: 0.4,
    })
  )
  cabinet.position.y = height / 2
  cabinet.castShadow = true
  group.add(cabinet)
  
  // 玻璃门
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, height * 0.8, 0.02),
    getMaterialManager().getStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
    })
  )
  glass.position.set(0, height / 2, 0.13)
  group.add(glass)
  
  // 灭火器（内部可见）
  const extinguisher = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, height * 0.5, 12),
    getMaterialManager().getStandardMaterial({
      color: 0xb71c1c,
      roughness: 0.5,
    })
  )
  extinguisher.position.set(0, height * 0.35, 0)
  group.add(extinguisher)
  
  // 灭火器顶部
  const extTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.06, 0.08, 12),
    getMaterialManager().getStandardMaterial({
      color: 0x212121,
      roughness: 0.3,
    })
  )
  extTop.position.set(0, height * 0.65, 0)
  group.add(extTop)
  
  // 消防标志
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 0.01),
    getMaterialManager().getStandardMaterial({
      color: 0xffffff,
      emissive: 0xff0000,
      emissiveIntensity: 0.3,
    })
  )
  sign.position.set(0, height * 0.9, 0.13)
  group.add(sign)
  
  return group
}
