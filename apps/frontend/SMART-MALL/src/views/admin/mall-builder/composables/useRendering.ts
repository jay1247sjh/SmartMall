/**
 * 渲染 Composable
 * 处理 3D 场景渲染逻辑
 */
import * as THREE from 'three'
import type { MallProject, AreaDefinition } from '@/builder'
import {
  createPolygonMesh3D,
  createPolygonOutline,
  createFloorMesh,
  calculateFloorYPosition,
  createRoamingEnvironment,
  clearRoamingEnvironment,
  clearConnectionIndicators,
  getAreaCenter,
  createElevatorModel,
  createEscalatorModel,
  createStairsModel,
  createServiceDeskModel,
  createRestroomModel,
  createBenchModel,
  createLampPostModel,
  createTrashBinModel,
  createPlanterModel,
  createSignPostModel,
  createFountainModel,
  createKioskModel,
  createATMModel,
  createVendingMachineModel,
  createInfoBoardModel,
  createClockModel,
  createFireExtinguisherModel,
} from '@/builder'
import { AreaType, AREA_TYPE_COLORS } from '@smart-mall/shared-types'

export interface RenderOptions {
  renderAllFloors?: boolean
  useFullHeight?: boolean
  isRoamingMode?: boolean
}

/**
 * 获取区域边界
 */
export function getAreaBounds(vertices: { x: number; y: number }[]) {
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const v of vertices) {
    minX = Math.min(minX, v.x)
    maxX = Math.max(maxX, v.x)
    minY = Math.min(minY, v.y)
    maxY = Math.max(maxY, v.y)
  }

  return { minX, maxX, minY, maxY }
}

/**
 * 创建区域名称标签精灵
 */
export function createAreaLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  canvas.width = 256
  canvas.height = 64

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.roundRect(0, 0, canvas.width, canvas.height, 8)
  ctx.fill()

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 6, canvas.height)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })

  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4, 1, 1)

  return sprite
}

/**
 * 创建区域墙壁和入口门面
 */
export function createAreaWalls(
  area: AreaDefinition,
  yPosition: number,
  wallHeight: number,
  wallThickness: number,
  color: number,
  isSelected: boolean
): THREE.Group {
  const group = new THREE.Group()
  group.name = `walls-${area.id}`

  const vertices = area.shape.vertices
  if (vertices.length < 3) return group

  // 计算每条边的长度，找出最长边作为入口
  let maxEdgeLength = 0
  let entranceEdgeIndex = 0

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i]!
    const v2 = vertices[(i + 1) % vertices.length]!
    const edgeLength = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2))
    if (edgeLength > maxEdgeLength) {
      maxEdgeLength = edgeLength
      entranceEdgeIndex = i
    }
  }

  // 墙壁材质
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: isSelected ? 0xffffff : 0x4a4a5a,
    roughness: 0.8,
    metalness: 0.1,
  } as THREE.MeshStandardMaterialParameters)

  // 入口门面材质（玻璃效果）
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.3,
  } as THREE.MeshStandardMaterialParameters)

  // 门框材质
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a3a,
    roughness: 0.5,
    metalness: 0.5,
  } as THREE.MeshStandardMaterialParameters)

  // 为每条边创建墙壁
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i]!
    const v2 = vertices[(i + 1) % vertices.length]!

    const dx = v2.x - v1.x
    const dy = v2.y - v1.y
    const edgeLength = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    const midX = (v1.x + v2.x) / 2
    const midY = (v1.y + v2.y) / 2

    if (i === entranceEdgeIndex) {
      // 入口边：创建带门的门面
      const doorWidth = Math.min(edgeLength * 0.6, 4)
      const doorHeight = wallHeight * 0.85
      const sideWallWidth = (edgeLength - doorWidth) / 2

      // 左侧墙
      if (sideWallWidth > 0.1) {
        const leftWall = new THREE.Mesh(
          new THREE.BoxGeometry(sideWallWidth, wallHeight, wallThickness),
          wallMaterial
        )
        const leftOffset = -(edgeLength / 2) + (sideWallWidth / 2)
        leftWall.position.set(
          midX + leftOffset * Math.cos(angle),
          yPosition + wallHeight / 2,
          -(midY + leftOffset * Math.sin(angle))
        )
        leftWall.rotation.y = -angle
        leftWall.castShadow = true
        leftWall.receiveShadow = true
        group.add(leftWall)
      }

      // 右侧墙
      if (sideWallWidth > 0.1) {
        const rightWall = new THREE.Mesh(
          new THREE.BoxGeometry(sideWallWidth, wallHeight, wallThickness),
          wallMaterial
        )
        const rightOffset = (edgeLength / 2) - (sideWallWidth / 2)
        rightWall.position.set(
          midX + rightOffset * Math.cos(angle),
          yPosition + wallHeight / 2,
          -(midY + rightOffset * Math.sin(angle))
        )
        rightWall.rotation.y = -angle
        rightWall.castShadow = true
        rightWall.receiveShadow = true
        group.add(rightWall)
      }

      // 门上方的横梁
      const topBeamHeight = wallHeight - doorHeight
      if (topBeamHeight > 0.05) {
        const topBeam = new THREE.Mesh(
          new THREE.BoxGeometry(doorWidth, topBeamHeight, wallThickness),
          wallMaterial
        )
        topBeam.position.set(midX, yPosition + doorHeight + topBeamHeight / 2, -midY)
        topBeam.rotation.y = -angle
        topBeam.castShadow = true
        group.add(topBeam)
      }

      // 玻璃门面
      const glassPanel = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth - 0.1, doorHeight - 0.1, 0.05),
        glassMaterial
      )
      glassPanel.position.set(midX, yPosition + doorHeight / 2, -midY)
      glassPanel.rotation.y = -angle
      group.add(glassPanel)

      // 门框
      const frameThickness = 0.08
      const leftFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, doorHeight, frameThickness),
        frameMaterial
      )
      leftFrame.position.set(
        midX - (doorWidth / 2) * Math.cos(angle),
        yPosition + doorHeight / 2,
        -(midY - (doorWidth / 2) * Math.sin(angle))
      )
      leftFrame.rotation.y = -angle
      group.add(leftFrame)

      const rightFrame = new THREE.Mesh(
        new THREE.BoxGeometry(frameThickness, doorHeight, frameThickness),
        frameMaterial
      )
      rightFrame.position.set(
        midX + (doorWidth / 2) * Math.cos(angle),
        yPosition + doorHeight / 2,
        -(midY + (doorWidth / 2) * Math.sin(angle))
      )
      rightFrame.rotation.y = -angle
      group.add(rightFrame)
    } else {
      // 普通边：创建实心墙壁
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(edgeLength, wallHeight, wallThickness),
        wallMaterial
      )
      wall.position.set(midX, yPosition + wallHeight / 2, -midY)
      wall.rotation.y = -angle
      wall.castShadow = true
      wall.receiveShadow = true
      group.add(wall)
    }
  }

  return group
}

/**
 * 根据类型创建基础设施模型
 */
export function createInfrastructureModel(type: string, heightScale: number = 1): THREE.Group | null {
  switch (type) {
    case 'bench':
      return createBenchModel(2, heightScale)
    case 'lamp':
      return createLampPostModel(3 * heightScale, 'mall')
    case 'trashBin':
      return createTrashBinModel('recycling', heightScale)
    case 'planter':
      return createPlanterModel('large', 'tree')
    case 'sign':
      return createSignPostModel('指示牌', 'standing', heightScale)
    case 'fountain':
      return createFountainModel(heightScale)
    case 'kiosk':
      return createKioskModel(heightScale)
    case 'atm':
      return createATMModel(heightScale)
    case 'vendingMachine':
      return createVendingMachineModel(heightScale)
    case 'infoBoard':
      return createInfoBoardModel(heightScale)
    case 'clock':
      return createClockModel(heightScale)
    case 'fireExtinguisher':
      return createFireExtinguisherModel(heightScale)
    default:
      console.warn(`[createInfrastructureModel] 未知的基础设施类型: ${type}`)
      return null
  }
}

export function useRendering() {
  /**
   * 渲染单个区域
   */
  function renderArea(
    scene: THREE.Scene,
    area: AreaDefinition,
    yPosition: number,
    fullHeight: boolean,
    selectedAreaId: string | null,
    overlappingAreas: string[],
    showLabels: boolean
  ) {
    const color = parseInt(area.color.replace('#', ''), 16)
    const isSelected = area.id === selectedAreaId
    const isOverlapping = overlappingAreas.includes(area.id)

    const isInfrastructure = (area.properties?.custom as Record<string, unknown>)?.isInfrastructure === true
    const isVerticalConnection = [AreaType.ELEVATOR, AreaType.ESCALATOR, AreaType.STAIRS].includes(area.type)
    const isFacility = [AreaType.RESTROOM, AreaType.SERVICE].includes(area.type)

    const center = getAreaCenter(area.shape.vertices)
    const heightScale = fullHeight ? 1.0 : 0.3

    if (isInfrastructure && (area.properties?.custom as Record<string, unknown>)?.infrastructureType) {
      const infrastructureType = (area.properties.custom as Record<string, unknown>).infrastructureType as string
      const model = createInfrastructureModel(infrastructureType, heightScale)
      if (model) {
        model.position.set(center.x, yPosition, center.z)
        model.name = `infrastructure-${area.id}`
        model.userData = {
          isArea: true,
          areaId: area.id,
          isInfrastructure: true,
          infrastructureType: infrastructureType,
        }
        scene.add(model)
      }
    } else if (isVerticalConnection) {
      renderVerticalConnectionModel(scene, area, yPosition, isSelected, fullHeight)
    } else if (isFacility) {
      renderFacilityModel(scene, area, yPosition, isSelected, fullHeight)
    } else {
      // 普通区域
      const wallHeight = fullHeight ? 2.8 : 0.45
      const wallThickness = 0.1

      const mesh = createPolygonMesh3D(
        area.shape,
        { depth: 0.1, bevelEnabled: false },
        {
          color: isOverlapping ? 0xff0000 : color,
          opacity: isSelected ? 0.9 : 0.7,
          transparent: true,
          emissive: isSelected ? color : 0x000000,
          emissiveIntensity: isSelected ? 0.3 : 0,
        }
      )
      mesh.position.y = yPosition
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { isArea: true, areaId: area.id }
      mesh.name = `area-${area.id}`
      scene.add(mesh)

      const isShopType = [AreaType.RETAIL, AreaType.FOOD, AreaType.SERVICE, AreaType.ANCHOR].includes(area.type)
      if (isShopType && area.shape.vertices.length >= 3) {
        const wallGroup = createAreaWalls(area, yPosition, wallHeight, wallThickness, color, isSelected)
        wallGroup.userData = { isArea: true, areaId: area.id }
        scene.add(wallGroup)
      }

      const outline = createPolygonOutline(
        area.shape,
        isSelected ? 0xffffff : 0x3f3f46,
        isSelected ? 2 : 1
      )
      outline.position.y = yPosition + 0.11
      outline.userData = { isArea: true, areaId: area.id }
      scene.add(outline)
    }

    // 添加区域名称标签
    if (showLabels && area.name) {
      const labelHeight = fullHeight ? 3.5 : 1.2
      const label = createAreaLabel(area.name, area.color)
      label.position.set(center.x, yPosition + labelHeight, center.z)
      label.name = `label-${area.id}`
      label.userData = { isAreaLabel: true, areaId: area.id }
      scene.add(label)
    }
  }

  /**
   * 渲染垂直连接 3D 模型
   */
  function renderVerticalConnectionModel(
    scene: THREE.Scene,
    area: AreaDefinition,
    yPosition: number,
    isSelected: boolean,
    fullHeight: boolean
  ) {
    const center = getAreaCenter(area.shape.vertices)
    const color = parseInt(area.color.replace('#', ''), 16)

    const bounds = getAreaBounds(area.shape.vertices)
    const width = bounds.maxX - bounds.minX
    const depth = bounds.maxY - bounds.minY
    const size = Math.min(width, depth)

    const heightScale = fullHeight ? 1.0 : 0.3

    const group = new THREE.Group()
    group.name = `area-${area.id}`
    group.userData = { isArea: true, areaId: area.id }

    if (area.type === 'elevator') {
      createElevatorModel(group, size, color, isSelected, heightScale)
    } else if (area.type === 'escalator') {
      createEscalatorModel(group, width, depth, color, isSelected, heightScale)
    } else if (area.type === 'stairs') {
      createStairsModel(group, width, depth, color, isSelected, heightScale)
    }

    group.position.set(center.x, yPosition, center.z)
    scene.add(group)
  }

  /**
   * 渲染设施 3D 模型
   */
  function renderFacilityModel(
    scene: THREE.Scene,
    area: AreaDefinition,
    yPosition: number,
    isSelected: boolean,
    fullHeight: boolean
  ) {
    const center = getAreaCenter(area.shape.vertices)
    const color = parseInt(area.color.replace('#', ''), 16)

    const bounds = getAreaBounds(area.shape.vertices)
    const width = bounds.maxX - bounds.minX
    const depth = bounds.maxY - bounds.minY

    const heightScale = fullHeight ? 1.0 : 0.3

    const group = new THREE.Group()
    group.name = `area-${area.id}`
    group.userData = { isArea: true, areaId: area.id }

    if (area.type === 'service') {
      createServiceDeskModel(group, width, depth, color, isSelected, heightScale)
    } else if (area.type === 'restroom') {
      createRestroomModel(group, width, depth, color, isSelected, heightScale)
    }

    group.position.set(center.x, yPosition, center.z)
    scene.add(group)
  }

  /**
   * 渲染完整项目
   */
  function renderProject(
    scene: THREE.Scene,
    project: MallProject,
    currentFloorId: string | null,
    selectedAreaId: string | null,
    overlappingAreas: string[],
    options: RenderOptions = {}
  ) {
    const {
      renderAllFloors = false,
      useFullHeight = false,
      isRoamingMode = false,
    } = options

    // 计算商城轮廓中心
    let outlineCenter = { x: 0, z: 0 }
    if (project.outline?.vertices?.length >= 3) {
      outlineCenter = getAreaCenter(project.outline.vertices)
    }

    // 清除连接指示器
    clearConnectionIndicators(scene)
    clearRoamingEnvironment(scene)

    // 漫游模式：创建封闭的室内空间
    if (isRoamingMode && currentFloorId) {
      const roamingEnv = createRoamingEnvironment(project, {
        currentFloorId: currentFloorId,
        wallColor: 0x6a6a7a,
        floorColor: 0x4a4a5a,
        ceilingColor: 0x555565,
        wallThickness: 0.5,
      })
      scene.add(roamingEnv)
    } else {
      // 编辑模式：渲染商城轮廓线
      const outlineMesh = createPolygonOutline(project.outline, 0x60a5fa, 2)
      outlineMesh.name = 'mall-outline'
      scene.add(outlineMesh)
    }

    // 渲染楼层
    const floorHeights = project.floors.map(f => f.height)
    const showLabels = project.settings?.display?.showAreaLabels !== false

    project.floors.forEach((floor, index) => {
      if (!floor.visible) return

      const yPos = calculateFloorYPosition(index, floorHeights)
      const outline = floor.shape || project.outline
      const isCurrentFloor = floor.id === currentFloorId
      const color = parseInt(floor.color?.replace('#', '') || AREA_TYPE_COLORS[AreaType.COMMON].replace('#', ''), 16)

      // 漫游模式只渲染当前楼层
      if (isRoamingMode && !isCurrentFloor) return

      const shouldRenderFull = renderAllFloors || isCurrentFloor

      if (shouldRenderFull) {
        if (!isRoamingMode) {
          const floorGroup = createFloorMesh(outline, {
            height: floor.height,
            color: isCurrentFloor ? 0x60a5fa : color,
            opacity: isCurrentFloor ? 0.4 : 0.25,
            yPosition: yPos,
            showEdges: true,
          })
          floorGroup.name = `floor-${floor.id}`
          scene.add(floorGroup)
        }

        // 渲染楼层的区域
        floor.areas.forEach(area => {
          renderArea(scene, area, yPos + 0.1, useFullHeight, selectedAreaId, overlappingAreas, showLabels)
        })
      } else {
        // 非当前楼层只显示淡化的轮廓线
        const floorOutline = createPolygonOutline(outline, color, 1)
        floorOutline.position.y = yPos
        floorOutline.name = `floor-${floor.id}`
        scene.add(floorOutline)
      }
    })

    return outlineCenter
  }

  return {
    renderArea,
    renderVerticalConnectionModel,
    renderFacilityModel,
    renderProject,
    createAreaLabel,
    createAreaWalls,
    createInfrastructureModel,
    getAreaBounds,
  }
}
