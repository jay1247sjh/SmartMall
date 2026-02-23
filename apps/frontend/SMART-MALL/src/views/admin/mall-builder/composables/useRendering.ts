/**
 * 渲染 Composable
 * 处理 3D 场景渲染逻辑
 */
import * as THREE from 'three'
import type { MallProject, AreaDefinition } from '@/builder'
import {
  createPolygonMesh3D,
  createPolygonOutline,
  createGlowOutline,
  createFloorMesh,
  calculateFloorYPosition,
  createRoamingEnvironment,
  clearRoamingEnvironment,
  clearConnectionIndicators,
  getAreaCenter,
  getEdges,
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
  getMaterialPresetByAreaType,
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
 * 在一条边上创建带有多扇门的墙壁
 *
 * 将整条边按门的位置切割为：墙段 → 门洞 → 墙段 → 门洞 → 墙段
 * 每个门洞包含：玻璃门面 + 门框 + 上方横梁
 */
function createEdgeWithDoors(
  group: THREE.Group,
  v1: { x: number; y: number },
  v2: { x: number; y: number },
  doors: { position: number; width: number; id?: string }[],
  yPosition: number,
  wallHeight: number,
  wallThickness: number,
  wallMaterial: THREE.MeshStandardMaterial,
  glassMaterial: THREE.MeshStandardMaterial,
  frameMaterial: THREE.MeshStandardMaterial,
) {
  const dx = v2.x - v1.x
  const dy = v2.y - v1.y
  const edgeLength = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx)
  const dirX = dx / edgeLength
  const dirY = dy / edgeLength

  const doorHeight = wallHeight * 0.85

  // 将门按位置排序，计算每扇门在边上的绝对起止位置
  const sortedDoors = [...doors]
    .map(d => {
      const center = d.position * edgeLength
      const halfW = Math.min(d.width, edgeLength * 0.9) / 2
      return { start: Math.max(0, center - halfW), end: Math.min(edgeLength, center + halfW), id: d.id }
    })
    .sort((a, b) => a.start - b.start)

  // 沿边遍历，交替生成墙段和门洞
  let cursor = 0

  for (const door of sortedDoors) {
    // 门前的墙段
    const wallLen = door.start - cursor
    if (wallLen > 0.1) {
      const mid = cursor + wallLen / 2
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(wallLen, wallHeight, wallThickness),
        wallMaterial,
      )
      wall.position.set(v1.x + dirX * mid, yPosition + wallHeight / 2, -(v1.y + dirY * mid))
      wall.rotation.y = -angle
      wall.castShadow = true
      wall.receiveShadow = true
      group.add(wall)
    }

    // 门洞 — 包裹在子 Group 中，标记 doorId 用于 hover 检测
    const doorMid = (door.start + door.end) / 2
    const actualWidth = door.end - door.start
    const doorGroup = new THREE.Group()
    const doorId = door.id || `__default_${Math.round(door.start * 100)}`
    doorGroup.name = `door-group-${doorId}`
    doorGroup.userData = { isDoorGroup: true, doorId }

    // 上方横梁
    const topBeamH = wallHeight - doorHeight
    if (topBeamH > 0.05) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(actualWidth, topBeamH, wallThickness),
        wallMaterial,
      )
      beam.position.set(
        v1.x + dirX * doorMid, yPosition + doorHeight + topBeamH / 2, -(v1.y + dirY * doorMid),
      )
      beam.rotation.y = -angle
      beam.castShadow = true
      doorGroup.add(beam)
    }

    // 玻璃门面
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(actualWidth - 0.1, doorHeight - 0.1, 0.05),
      glassMaterial.clone(),
    )
    glass.position.set(v1.x + dirX * doorMid, yPosition + doorHeight / 2, -(v1.y + dirY * doorMid))
    glass.rotation.y = -angle
    glass.userData = { isDoorGlass: true, doorId }
    doorGroup.add(glass)

    // 门框
    const ft = 0.08
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(ft, doorHeight, ft), frameMaterial.clone())
    leftFrame.position.set(v1.x + dirX * door.start, yPosition + doorHeight / 2, -(v1.y + dirY * door.start))
    leftFrame.rotation.y = -angle
    leftFrame.userData = { isDoorFrame: true, doorId }
    doorGroup.add(leftFrame)

    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(ft, doorHeight, ft), frameMaterial.clone())
    rightFrame.position.set(v1.x + dirX * door.end, yPosition + doorHeight / 2, -(v1.y + dirY * door.end))
    rightFrame.rotation.y = -angle
    rightFrame.userData = { isDoorFrame: true, doorId }
    doorGroup.add(rightFrame)

    group.add(doorGroup)
    cursor = door.end
  }

  // 最后一扇门之后的墙段
  const tailLen = edgeLength - cursor
  if (tailLen > 0.1) {
    const mid = cursor + tailLen / 2
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(tailLen, wallHeight, wallThickness),
      wallMaterial,
    )
    wall.position.set(v1.x + dirX * mid, yPosition + wallHeight / 2, -(v1.y + dirY * mid))
    wall.rotation.y = -angle
    wall.castShadow = true
    wall.receiveShadow = true
    group.add(wall)
  }
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

  // 计算每条边的长度，找出最长边作为默认入口
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

  // 材质
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: isSelected ? 0xffffff : 0x4a4a5a,
    roughness: 0.8,
    metalness: 0.1,
  } as THREE.MeshStandardMaterialParameters)

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a5a,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.3,
  } as THREE.MeshStandardMaterialParameters)

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a3a,
    roughness: 0.5,
    metalness: 0.5,
  } as THREE.MeshStandardMaterialParameters)

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i]!
    const v2 = vertices[(i + 1) % vertices.length]!

    const dx = v2.x - v1.x
    const dy = v2.y - v1.y
    const edgeLength = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    const midX = (v1.x + v2.x) / 2
    const midY = (v1.y + v2.y) / 2

    // 收集该边上的门
    const edgeDoors = (area.doors ?? []).filter(d => d.wallIndex === i)

    if (edgeDoors.length > 0) {
      // 有门的边：统一切割墙段和门洞
      createEdgeWithDoors(
        group, v1, v2,
        edgeDoors.map(d => ({ position: d.position, width: d.width, id: d.id })),
        yPosition, wallHeight, wallThickness,
        wallMaterial, glassMaterial, frameMaterial,
      )
    } else if (i === entranceEdgeIndex && !(area.doors?.length)) {
      // 没有手动放置门时，默认入口边：在中心位置放一扇门
      createEdgeWithDoors(
        group, v1, v2,
        [{ position: 0.5, width: Math.min(edgeLength * 0.6, 4), id: `__default_entrance_${area.id}` }],
        yPosition, wallHeight, wallThickness,
        wallMaterial, glassMaterial, frameMaterial,
      )
    } else {
      // 普通边：实心墙壁
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(edgeLength, wallHeight, wallThickness),
        wallMaterial,
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
      // 普通区域 — 磨砂玻璃效果 + 发光边框
      const wallHeight = fullHeight ? 2.8 : 0.45
      const wallThickness = 0.1
      const uniformColor = 0x2a2a3a
      const glowColor = isOverlapping ? 0xff4444 : 0x60a5fa

      // 从预设获取材质参数
      const preset = getMaterialPresetByAreaType(area.type)
      const matParams = preset?.materialParams

      const mesh = createPolygonMesh3D(
        area.shape,
        { depth: 0.1, bevelEnabled: false },
        {
          color: isOverlapping ? 0xff0000 : uniformColor,
          opacity: isSelected ? 0.95 : 0.75,
          transparent: true,
          glassEffect: true,
          transmission: isSelected ? 0.4 : 0.6,
          roughness: isSelected ? 0.15 : 0.3,
          metalness: 0.0,
          ior: 1.5,
          thickness: 0.5,
          emissive: isSelected
            ? uniformColor
            : matParams?.emissive
              ? parseInt(matParams.emissive.replace('#', ''), 16)
              : 0x000000,
          emissiveIntensity: isSelected ? 0.4 : (matParams?.emissiveIntensity ?? 0),
        }
      )
      mesh.position.y = yPosition
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { isArea: true, areaId: area.id }
      mesh.name = `area-${area.id}`
      scene.add(mesh)

      const isShopType = [AreaType.RETAIL, AreaType.FOOD, AreaType.SERVICE, AreaType.ANCHOR].includes(area.type)
        || area.type === 'store'  // AI 生成的区域使用 "store" 类型
      if (isShopType && area.shape.vertices.length >= 3) {
        const wallGroup = createAreaWalls(area, yPosition, wallHeight, wallThickness, uniformColor, isSelected)
        wallGroup.userData = { isArea: true, areaId: area.id }
        scene.add(wallGroup)
      }

      // 发光边框管道（替代简单线条）
      const glowOutline = createGlowOutline(area.shape, {
        color: isSelected ? 0xffffff : glowColor,
        emissive: isSelected ? 0xffffff : glowColor,
        emissiveIntensity: isSelected ? 1.2 : 0.6,
        radius: isSelected ? 0.08 : 0.05,
        opacity: isSelected ? 1.0 : 0.85,
      })
      glowOutline.position.y = yPosition + 0.11
      glowOutline.userData = { isArea: true, areaId: area.id }
      glowOutline.name = `outline-${area.id}`
      scene.add(glowOutline)
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
   * 渲染门指示器（编辑模式下在区域边上显示门的位置标记）
   */
  function renderDoorIndicators(
    scene: THREE.Scene,
    area: AreaDefinition,
    yPosition: number,
  ) {
    const doors = area.doors
    if (!doors?.length) return

    const edges = getEdges(area.shape)

    // 共享材质：所有门指示器复用同一个 MeshStandardMaterial
    const sharedMaterial = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9,
    })

    for (const door of doors) {
      const edge = edges[door.wallIndex]
      if (!edge) continue

      const dx = edge.end.x - edge.start.x
      const dy = edge.end.y - edge.start.y
      const edgeLen = Math.sqrt(dx * dx + dy * dy)
      const dirX = dx / edgeLen
      const dirY = dy / edgeLen

      // 门中心位置
      const cx = edge.start.x + dirX * door.position * edgeLen
      const cy = edge.start.y + dirY * door.position * edgeLen

      // 门宽度方向上的两端
      const halfW = door.width / 2
      const x1 = cx - dirX * halfW
      const y1 = cy - dirY * halfW
      const x2 = cx + dirX * halfW
      const y2 = cy + dirY * halfW

      // 用发光管道绘制门段（亮绿色）
      const points = [
        new THREE.Vector3(x1, yPosition + 0.15, -y1),
        new THREE.Vector3(x2, yPosition + 0.15, -y2),
      ]
      const curve = new THREE.LineCurve3(points[0], points[1])
      const tubeGeo = new THREE.TubeGeometry(curve, 1, 0.12, 6, false)
      const tube = new THREE.Mesh(tubeGeo, sharedMaterial)
      tube.name = `door-indicator-${door.id}`
      scene.add(tube)
    }
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
        wallColor: 0xf0f0f0,
        floorColor: 0xf5f5f5,
        ceilingColor: 0xfafafa,
        wallThickness: 0.3,
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
          // 编辑模式下渲染区域的门指示器
          if (!isRoamingMode && area.doors?.length) {
            renderDoorIndicators(scene, area, yPos + 0.1)
          }
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

  // 高亮材质（绿色发光）
  const highlightGlassMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.5,
    roughness: 0.1,
    metalness: 0.3,
    emissive: 0x22c55e,
    emissiveIntensity: 0.6,
  })
  const highlightFrameMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.5,
    metalness: 0.5,
    emissive: 0x22c55e,
    emissiveIntensity: 0.4,
  })

  /** 缓存被高亮门的原始材质，用于恢复 */
  const savedMaterials = new Map<string, { mesh: THREE.Mesh; material: THREE.Material }[]>()

  /**
   * 设置门 3D 模型高亮状态
   * @param scene 当前场景
   * @param doorId 要高亮的门 ID（null 表示取消所有高亮）
   */
  function setDoorHighlight(scene: THREE.Scene, doorId: string | null) {
    // 恢复之前高亮的门
    for (const [id, entries] of savedMaterials) {
      if (id === doorId) continue
      for (const entry of entries) {
        entry.mesh.material = entry.material
      }
      savedMaterials.delete(id)
    }

    if (!doorId) return
    if (savedMaterials.has(doorId)) return // 已经高亮

    // 在场景中查找门 group
    let doorGroup: THREE.Group | null = null
    scene.traverse((obj) => {
      if (obj.userData.isDoorGroup && obj.userData.doorId === doorId) {
        doorGroup = obj as THREE.Group
      }
    })
    if (!doorGroup) return

    // 替换子 mesh 材质
    const entries: { mesh: THREE.Mesh; material: THREE.Material }[] = []
    ;(doorGroup as THREE.Group).traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      entries.push({ mesh: child, material: child.material as THREE.Material })
      if (child.userData.isDoorGlass) {
        child.material = highlightGlassMat
      } else if (child.userData.isDoorFrame) {
        child.material = highlightFrameMat
      }
    })
    savedMaterials.set(doorId, entries)
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
    setDoorHighlight,
  }
}
