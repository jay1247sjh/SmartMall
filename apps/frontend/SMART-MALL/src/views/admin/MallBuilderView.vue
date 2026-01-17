<script setup lang="ts">
/**
 * 商城建模器 - 专业级 3D 建模工具（增强版）
 * 
 * 功能：
 * - 项目创建向导（模板选择）
 * - 自定义商城轮廓绘制
 * - 楼层管理（添加、删除、切换、自定义形状）
 * - 区域绘制（矩形、多边形）
 * - 区域编辑（移动、缩放、旋转、顶点编辑）
 * - 背景图片导入和变换
 * - 重叠检测和边界验证
 * - 属性面板（区域类型、商家分配）
 * - 历史记录（撤销/重做）
 * - 3D 预览
 * - 导出/导入
 */
import { ref, reactive, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 导入 builder 模块
import {
  // 类型
  type MallProject,
  type AreaDefinition,
  type AreaType,
  type MallTemplate,
  type MaterialPreset,
  type MaterialCategory,
  type VerticalConnection,
  // 函数
  createEmptyProject,
  createDefaultFloor,
  generateId,
  getAreaTypeColor,
  // 模板
  getAllTemplates,
  createProjectFromTemplate,
  // 几何
  calculateArea,
  calculatePerimeter,
  isContainedIn,
  doPolygonsOverlap,
  snapToGrid,
  isSelfIntersecting,
  // 渲染
  createPolygonMesh3D,
  createPolygonOutline,
  createFloorMesh,
  calculateFloorYPosition,
  // 漫游渲染
  createRoamingEnvironment,
  clearRoamingEnvironment,
  // IO
  exportProject,
  importProject,
  // 材质系统
  getAllMaterialPresets,
  getMaterialPresetsByCategory,
  getAllCategories,
  getCategoryDisplayName,
  // 垂直连接
  createVerticalConnection,
  isVerticalConnectionAreaType,
  getConnectionTypeName,
  createConnectionIndicator,
  clearConnectionIndicators,
  getAreaCenter,
  // 3D 模型
  createElevatorModel,
  createEscalatorModel,
  createStairsModel,
  createServiceDeskModel,
  createRestroomModel,
  // 基础设施模型
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
  // 角色控制器
  CharacterController,
  // 资源管理
  disposeBuilderResources,
} from '@/builder'

// ============================================================================
// Types
// ============================================================================

type Tool = 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline' | 'edit-vertex'
type ViewMode = 'edit' | 'orbit'

interface SavedCameraState {
  position: THREE.Vector3
  target: THREE.Vector3
}

// ============================================================================
// State
// ============================================================================

const router = useRouter()
const route = useRoute()
const containerRef = ref<HTMLElement | null>(null)

// Three.js 相关
const scene = shallowRef<THREE.Scene | null>(null)
const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
const controls = shallowRef<OrbitControls | null>(null)

// 加载状态
const isLoading = ref(true)
const loadProgress = ref(0)

// 项目数据
const project = ref<MallProject | null>(null)
const currentFloorId = ref<string | null>(null)
const currentFloor = computed(() => 
  project.value?.floors.find(f => f.id === currentFloorId.value) || null
)

// 向导状态
const showWizard = ref(true)
const selectedTemplate = ref<MallTemplate | null>(null)
const newProjectName = ref('我的商城')

// 工具状态
const currentTool = ref<Tool>('select')
const isDrawing = ref(false)
const drawPoints = ref<{ x: number; y: number }[]>([])
const previewMesh = shallowRef<THREE.Mesh | null>(null)

// 视图模式状态
const viewMode = ref<ViewMode>('edit')
const savedCameraState = ref<SavedCameraState | null>(null)

// 第三人称漫游控制
let characterController: CharacterController | null = null
const mouseSensitivity = 0.003  // 鼠标灵敏度
let roamAnimationId: number | null = null
let prevTime = performance.now()
// 相机跟随参数
const cameraDistance = 5      // 相机距离角色的距离（适中距离，能看到角色全身和周围环境）
const cameraHeight = 2        // 相机高度偏移（高于角色头部）
const cameraPitch = ref(0.3)  // 相机俯仰角（上下看）- 稍微向下看
const cameraYaw = ref(0)      // 相机偏航角（左右看）
// 指针是否已锁定
const isPointerLocked = ref(false)
// 移动速度预设
const walkSpeedPreset = ref<'slow' | 'normal' | 'fast'>('normal')
const speedPresets: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast']
const speedPresetLabels: Record<'slow' | 'normal' | 'fast', string> = {
  slow: '慢速',
  normal: '正常',
  fast: '快速',
}

// 选中状态
const selectedAreaId = ref<string | null>(null)
const selectedArea = computed(() => 
  currentFloor.value?.areas.find(a => a.id === selectedAreaId.value) || null
)

// 面板状态
const showFloorPanel = ref(true)
const showPropertyPanel = ref(true)
const showMaterialPanel = ref(true)
const leftPanelCollapsed = ref(false)  // 左侧面板折叠状态
const showSceneLegend = ref(true)  // 场景说明显示状态

// 材质面板状态
const selectedMaterialId = ref<string | null>(null)
const expandedCategories = ref<MaterialCategory[]>(['circulation', 'service', 'common', 'infrastructure'])
const materialPresets = computed(() => getAllMaterialPresets())
const categories = computed(() => getAllCategories())

// 垂直连接状态
const verticalConnections = ref<VerticalConnection[]>([])
const showFloorConnectionModal = ref(false)
const pendingConnectionArea = ref<AreaDefinition | null>(null)
const selectedFloorIds = ref<string[]>([])

/** 判断是否可以确认楼层连接 */
const canConfirmConnection = computed(() => {
  if (selectedFloorIds.value.length === 0) return false
  
  // 楼梯必须选择恰好两个相邻楼层
  if (pendingConnectionArea.value?.type === 'stairs') {
    if (selectedFloorIds.value.length !== 2) return false
    
    // 检查是否相邻
    const levels = selectedFloorIds.value.map(id => {
      const floor = project.value?.floors.find(f => f.id === id)
      return floor?.level || 0
    })
    if (levels.length === 2) {
      const diff = Math.abs(levels[0] - levels[1])
      if (diff !== 1) return false
    }
  }
  
  // 电梯和扶梯至少选择一个楼层即可（建议两个以上）
  return true
})

/** 获取待连接区域的连接类型名称 */
const pendingConnectionTypeName = computed(() => {
  const type = pendingConnectionArea.value?.type
  if (type === 'elevator' || type === 'escalator' || type === 'stairs') {
    return getConnectionTypeName(type)
  }
  return '设施'
})

// 历史记录
const history = ref<string[]>([])
const historyIndex = ref(-1)
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// 网格设置
const gridSize = ref(1)
const snapEnabled = ref(true)

// 背景图片
const backgroundImage = ref<{
  src: string
  opacity: number
  scale: number
  x: number
  y: number
  locked: boolean
} | null>(null)

// 重叠检测
const overlappingAreas = ref<string[]>([])
const boundaryWarning = ref<string | null>(null)

// 弹窗状态
const showAddFloorModal = ref(false)
const showHelpPanel = ref(false)
const newFloorForm = reactive({ name: '', level: 1, height: 4 })

// 模板列表
const templates = computed(() => getAllTemplates())

// 区域类型配置
const areaTypes: { value: AreaType; label: string; color: string }[] = [
  { value: 'retail', label: '零售', color: '#3b82f6' },
  { value: 'food', label: '餐饮', color: '#f97316' },
  { value: 'service', label: '服务', color: '#8b5cf6' },
  { value: 'anchor', label: '主力店', color: '#ef4444' },
  { value: 'common', label: '公共区域', color: '#6b7280' },
  { value: 'corridor', label: '走廊', color: '#9ca3af' },
  { value: 'elevator', label: '电梯', color: '#10b981' },
  { value: 'escalator', label: '扶梯', color: '#14b8a6' },
  { value: 'restroom', label: '洗手间', color: '#ec4899' },
  { value: 'other', label: '其他', color: '#a3a3a3' },
]

// ============================================================================
// 3D Engine Methods
// ============================================================================

async function initEngine() {
  if (!containerRef.value) return

  loadProgress.value = 20

  // 创建场景
  scene.value = new THREE.Scene()
  scene.value.background = new THREE.Color(0x0a0a0a)

  // 创建相机 - 使用更好的俯视角度
  const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.value = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000)
  // 设置相机位置：从正上方稍微偏移，看向中心
  camera.value.position.set(0, 100, 60)
  camera.value.lookAt(0, 0, 0)

  loadProgress.value = 40

  // 创建渲染器
  renderer.value = new THREE.WebGLRenderer({ antialias: true })
  renderer.value.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.value.setPixelRatio(window.devicePixelRatio)
  renderer.value.shadowMap.enabled = true
  renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
  containerRef.value.appendChild(renderer.value.domElement)

  loadProgress.value = 60

  // 创建轨道控制器
  controls.value = new OrbitControls(camera.value, renderer.value.domElement)
  controls.value.enableDamping = true
  controls.value.dampingFactor = 0.05
  controls.value.screenSpacePanning = true
  controls.value.minDistance = 10
  controls.value.maxDistance = 500
  controls.value.maxPolarAngle = Math.PI / 2.2 // 限制不能看到地面下方
  // 设置目标点为楼层中心（稍微抬高）
  controls.value.target.set(0, 6, 0)
  controls.value.enabled = false // 默认禁用，只有在平移工具模式下才启用
  controls.value.update()

  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
  scene.value.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
  directionalLight.position.set(30, 80, 30)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.value.add(directionalLight)

  // 添加网格 - 匹配商城轮廓大小（100x100）
  const gridHelper = new THREE.GridHelper(120, 120, 0x1f1f1f, 0x151515)
  gridHelper.position.y = -0.02
  gridHelper.name = 'grid-helper'
  scene.value.add(gridHelper)

  // 添加地板 - 匹配商城轮廓大小
  const floorGeometry = new THREE.PlaneGeometry(140, 140)
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0d0d0d,
    roughness: 0.95,
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.03
  floor.receiveShadow = true
  floor.name = 'ground-floor'
  scene.value.add(floor)

  loadProgress.value = 80

  // 设置事件监听
  setupInteraction()
  
  // 监听指针锁定状态变化（用于第一人称模式）
  document.addEventListener('pointerlockchange', handlePointerLockChange)

  // 启动渲染循环
  animate()

  loadProgress.value = 100
  setTimeout(() => { isLoading.value = false }, 300)
}

/**
 * 处理指针锁定状态变化
 */
function handlePointerLockChange() {
  // 更新指针锁定状态
  isPointerLocked.value = !!document.pointerLockElement
  
  // 在漫游模式下，如果鼠标被解锁（用户按了ESC），不自动退出
  // 用户可以点击画布重新锁定，或点击"退出漫游"按钮退出
  if (viewMode.value === 'orbit') {
    if (document.pointerLockElement) {
      console.log('鼠标已锁定')
    } else {
      console.log('鼠标已解锁，点击画布可重新锁定')
    }
  }
}

function animate() {
  if (!renderer.value || !scene.value || !camera.value) return
  requestAnimationFrame(animate)
  
  // 只在非漫游模式下更新轨道控制器
  // 漫游模式下相机由 startRoamLoop 控制
  if (controls.value && viewMode.value !== 'orbit') {
    controls.value.update()
  }
  
  renderer.value.render(scene.value, camera.value)
}

function handleResize() {
  if (!containerRef.value || !camera.value || !renderer.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.value.aspect = width / height
  camera.value.updateProjectionMatrix()
  renderer.value.setSize(width, height)
}

// ============================================================================
// Project Methods
// ============================================================================

function createNewProject() {
  if (!selectedTemplate.value) return

  project.value = createProjectFromTemplate(
    selectedTemplate.value,
    newProjectName.value
  )

  if (project.value.floors.length > 0 && project.value.floors[0]) {
    currentFloorId.value = project.value.floors[0].id
  }

  // 更新 URL，添加项目 ID
  router.replace({ params: { projectId: project.value.id } })

  showWizard.value = false
  renderProject()
  saveHistory()
}

function createCustomProject() {
  project.value = createEmptyProject(newProjectName.value)
  project.value.floors.push(createDefaultFloor(1, '1F'))
  if (project.value.floors[0]) {
    currentFloorId.value = project.value.floors[0].id
  }
  
  // 更新 URL，添加项目 ID
  router.replace({ params: { projectId: project.value.id } })
  
  showWizard.value = false
  setTool('draw-outline')
  saveHistory()
}

function renderProject(renderAllFloors: boolean = false) {
  if (!scene.value || !project.value) return

  // 判断是否使用完整高度（漫游模式使用完整高度，编辑模式使用缩小高度）
  const useFullHeight = viewMode.value === 'orbit'
  const isRoamingMode = viewMode.value === 'orbit'
  
  console.log(`[renderProject] renderAllFloors: ${renderAllFloors}, useFullHeight: ${useFullHeight}, 楼层数: ${project.value.floors.length}`)

  // 计算商城轮廓中心
  let outlineCenter = { x: 0, z: 0 }
  if (project.value.outline?.vertices?.length >= 3) {
    outlineCenter = getAreaCenter(project.value.outline.vertices)
  }

  // 更新网格和地板位置到商城中心
  const gridHelper = scene.value.getObjectByName('grid-helper')
  if (gridHelper) {
    gridHelper.position.x = outlineCenter.x
    gridHelper.position.z = outlineCenter.z
  }
  const groundFloor = scene.value.getObjectByName('ground-floor')
  if (groundFloor) {
    groundFloor.position.x = outlineCenter.x
    groundFloor.position.z = outlineCenter.z
  }

  // 更新相机目标点到商城中心
  if (controls.value) {
    controls.value.target.set(outlineCenter.x, 6, outlineCenter.z)
    controls.value.update()
  }

  // 清除旧的对象
  clearSceneObjects()
  
  // 清除连接指示器（漫游模式下会显示真实3D模型）
  clearConnectionIndicators(scene.value)
  
  // 清除漫游环境
  clearRoamingEnvironment(scene.value)

  // 漫游模式：创建封闭的室内空间
  if (isRoamingMode && currentFloorId.value) {
    const roamingEnv = createRoamingEnvironment(project.value, {
      currentFloorId: currentFloorId.value,
      // 使用更亮的颜色，确保在漫游模式下可见
      wallColor: 0x6a6a7a,
      floorColor: 0x4a4a5a,
      ceilingColor: 0x555565,
      wallThickness: 0.5,
    })
    scene.value.add(roamingEnv)
    
    // 注意：基础设施（长椅、路灯等）现在由用户手动放置
    // 不再自动添加，用户可以从材质面板的"基础设施"分类中选择放置
  } else {
    // 编辑模式：渲染商城轮廓线
    const outlineMesh = createPolygonOutline(project.value.outline, 0x60a5fa, 2)
    outlineMesh.name = 'mall-outline'
    scene.value.add(outlineMesh)
  }

  // 渲染楼层
  const floorHeights = project.value.floors.map(f => f.height)
  project.value.floors.forEach((floor, index) => {
    console.log(`[renderProject] 楼层 ${floor.name}, visible: ${floor.visible}, 区域数: ${floor.areas.length}`)
    
    if (!floor.visible) return

    const yPos = calculateFloorYPosition(index, floorHeights)
    const outline = floor.shape || project.value!.outline
    const isCurrentFloor = floor.id === currentFloorId.value
    const color = parseInt(floor.color?.replace('#', '') || getAreaTypeColor('common').replace('#', ''), 16)

    // 漫游模式只渲染当前楼层
    if (isRoamingMode && !isCurrentFloor) return

    // 决定是否渲染该楼层的完整内容
    const shouldRenderFull = renderAllFloors || isCurrentFloor
    
    console.log(`[renderProject] shouldRenderFull: ${shouldRenderFull}, isCurrentFloor: ${isCurrentFloor}`)

    if (shouldRenderFull) {
      // 漫游模式不需要渲染透明楼层方块（已经有墙壁和地板了）
      if (!isRoamingMode) {
        const floorGroup = createFloorMesh(outline, {
          height: floor.height,
          color: isCurrentFloor ? 0x60a5fa : color,
          opacity: isCurrentFloor ? 0.4 : 0.25,
          yPosition: yPos,
          showEdges: true,
        })
        floorGroup.name = `floor-${floor.id}`
        scene.value!.add(floorGroup)
      }

      // 渲染楼层的区域（漫游模式使用完整高度）
      floor.areas.forEach(area => {
        renderArea(area, yPos + 0.1, useFullHeight)
      })
    } else {
      // 非当前楼层只显示淡化的轮廓线
      const floorOutline = createPolygonOutline(outline, color, 1)
      floorOutline.position.y = yPos
      floorOutline.name = `floor-${floor.id}`
      scene.value!.add(floorOutline)
    }
  })
  
  // 只在编辑模式下显示连接指示器
  if (viewMode.value === 'edit') {
    renderConnectionIndicators()
  }
}

/**
 * 创建区域墙壁和入口门面
 * @param area 区域定义
 * @param yPosition Y轴位置
 * @param wallHeight 墙壁高度
 * @param wallThickness 墙壁厚度
 * @param color 区域颜色
 * @param isSelected 是否选中
 */
function createAreaWalls(
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
  
  // 获取区域边界，确定入口方向（默认最长边为入口）
  const bounds = getAreaBounds(vertices)
  const width = bounds.maxX - bounds.minX
  const depth = bounds.maxY - bounds.minY
  
  // 计算每条边的长度，找出最长边作为入口
  let maxEdgeLength = 0
  let entranceEdgeIndex = 0
  
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i]
    const v2 = vertices[(i + 1) % vertices.length]
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
  })
  
  // 入口门面材质（玻璃效果）
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: color,
    transparent: true,
    opacity: 0.4,
    roughness: 0.1,
    metalness: 0.3,
  })
  
  // 门框材质
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a3a,
    roughness: 0.5,
    metalness: 0.5,
  })
  
  // 为每条边创建墙壁
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i]
    const v2 = vertices[(i + 1) % vertices.length]
    
    // 计算边的长度和角度
    const dx = v2.x - v1.x
    const dy = v2.y - v1.y
    const edgeLength = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)
    
    // 边的中点
    const midX = (v1.x + v2.x) / 2
    const midY = (v1.y + v2.y) / 2
    
    if (i === entranceEdgeIndex) {
      // 入口边：创建带门的门面
      const doorWidth = Math.min(edgeLength * 0.6, 4)  // 门宽度为边长的60%，最大4米
      const doorHeight = wallHeight * 0.85  // 门高度为墙高的85%
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
        topBeam.position.set(
          midX,
          yPosition + doorHeight + topBeamHeight / 2,
          -midY
        )
        topBeam.rotation.y = -angle
        topBeam.castShadow = true
        group.add(topBeam)
      }
      
      // 玻璃门面
      const glassPanel = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth - 0.1, doorHeight - 0.1, 0.05),
        glassMaterial
      )
      glassPanel.position.set(
        midX,
        yPosition + doorHeight / 2,
        -midY
      )
      glassPanel.rotation.y = -angle
      group.add(glassPanel)
      
      // 门框
      const frameThickness = 0.08
      // 左门框
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
      
      // 右门框
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
      wall.position.set(
        midX,
        yPosition + wallHeight / 2,
        -midY
      )
      wall.rotation.y = -angle
      wall.castShadow = true
      wall.receiveShadow = true
      group.add(wall)
    }
  }
  
  return group
}

/**
 * 创建区域名称标签精灵
 */
function createAreaLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // 设置画布大小
  canvas.width = 256
  canvas.height = 64
  
  // 绘制背景（半透明黑色）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.roundRect(0, 0, canvas.width, canvas.height, 8)
  ctx.fill()
  
  // 绘制左侧颜色条
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 6, canvas.height)
  
  // 绘制文字
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  
  // 创建纹理和精灵
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(4, 1, 1) // 调整标签大小
  
  return sprite
}

function renderArea(area: AreaDefinition, yPosition: number, fullHeight: boolean = false) {
  if (!scene.value) return

  const color = parseInt(area.color.replace('#', ''), 16)
  const isSelected = area.id === selectedAreaId.value
  const isOverlapping = overlappingAreas.value.includes(area.id)

  // 检查是否为基础设施
  const isInfrastructure = area.properties?.isInfrastructure === true
  // 检查是否为垂直连接类型（电梯、扶梯、楼梯）
  const isVerticalConnection = ['elevator', 'escalator', 'stairs'].includes(area.type)
  // 检查是否为需要特殊建模的设施类型
  const isFacility = ['restroom', 'service'].includes(area.type)
  
  // 调试日志
  console.log(`[renderArea] 区域: ${area.name}, 类型: ${area.type}, fullHeight: ${fullHeight}, isInfrastructure: ${isInfrastructure}`)
  
  // 获取区域中心点用于放置标签
  const center = getAreaCenter(area.shape.vertices)
  
  if (isInfrastructure && area.properties?.infrastructureType) {
    // 基础设施使用专门的模型
    const infrastructureType = area.properties.infrastructureType as string
    const model = createInfrastructureModel(infrastructureType)
    if (model) {
      model.position.set(center.x, yPosition, center.z)
      model.name = `infrastructure-${area.id}`
      model.userData = {
        isArea: true,
        areaId: area.id,
        isInfrastructure: true,
        infrastructureType: infrastructureType,
      }
      scene.value.add(model)
    }
  } else if (isVerticalConnection) {
    // 垂直连接始终使用真实3D建模（编辑模式和漫游模式都显示）
    console.log(`[renderArea] 渲染垂直连接3D模型: ${area.type}`)
    renderVerticalConnectionModel(area, yPosition, isSelected, fullHeight)
  } else if (isFacility) {
    // 设施类型使用特殊建模
    console.log(`[renderArea] 渲染设施3D模型: ${area.type}`)
    renderFacilityModel(area, yPosition, isSelected, fullHeight)
  } else {
    // 普通区域使用默认渲染（带墙壁和入口门面）
    const areaHeight = fullHeight ? 3 : 0.5
    const wallHeight = fullHeight ? 2.8 : 0.45  // 墙壁高度略低于区域高度
    const wallThickness = 0.1

    // 创建地板
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
    scene.value.add(mesh)

    // 为店铺类型区域添加墙壁和入口门面
    const isShopType = ['retail', 'food', 'service', 'anchor'].includes(area.type)
    if (isShopType && area.shape.vertices.length >= 3) {
      const wallGroup = createAreaWalls(area, yPosition, wallHeight, wallThickness, color, isSelected)
      wallGroup.userData = { isArea: true, areaId: area.id }
      scene.value.add(wallGroup)
    }

    // 添加边框
    const outline = createPolygonOutline(
      area.shape,
      isSelected ? 0xffffff : 0x3f3f46,
      isSelected ? 2 : 1
    )
    outline.position.y = yPosition + 0.11
    outline.userData = { isArea: true, areaId: area.id }
    scene.value.add(outline)
  }
  
  // 添加区域名称标签（如果启用且有名称）
  const showLabels = project.value?.settings?.display?.showAreaLabels !== false
  if (showLabels && area.name) {
    const labelHeight = fullHeight ? 3.5 : 1.2
    const label = createAreaLabel(area.name, area.color)
    label.position.set(center.x, yPosition + labelHeight, center.z)
    label.name = `label-${area.id}`
    label.userData = { isAreaLabel: true, areaId: area.id }
    scene.value.add(label)
  }
}

/**
 * 渲染垂直连接的3D模型（电梯、扶梯、楼梯）
 * @param area 区域定义
 * @param yPosition Y轴位置
 * @param isSelected 是否选中
 * @param fullHeight 是否使用完整高度（漫游模式为true，编辑模式为false）
 */
function renderVerticalConnectionModel(area: AreaDefinition, yPosition: number, isSelected: boolean, fullHeight: boolean = true) {
  if (!scene.value) return
  
  const center = getAreaCenter(area.shape.vertices)
  const color = parseInt(area.color.replace('#', ''), 16)
  
  // 计算区域的大小
  const bounds = getAreaBounds(area.shape.vertices)
  const width = bounds.maxX - bounds.minX
  const depth = bounds.maxY - bounds.minY
  const size = Math.min(width, depth)
  
  // 编辑模式下使用缩小的高度比例
  const heightScale = fullHeight ? 1.0 : 0.3
  
  console.log(`[renderVerticalConnectionModel] 类型: ${area.type}, 宽度: ${width}, 深度: ${depth}, heightScale: ${heightScale}`)
  
  const group = new THREE.Group()
  group.name = `area-${area.id}`
  group.userData = { isArea: true, areaId: area.id }
  
  if (area.type === 'elevator') {
    // 电梯：创建电梯井和电梯门
    console.log('[renderVerticalConnectionModel] 创建电梯模型')
    createElevatorModel(group, size, color, isSelected, heightScale)
  } else if (area.type === 'escalator') {
    // 扶梯：创建倾斜的扶梯模型
    console.log('[renderVerticalConnectionModel] 创建扶梯模型')
    createEscalatorModel(group, width, depth, color, isSelected, heightScale)
  } else if (area.type === 'stairs') {
    // 楼梯：创建阶梯模型
    console.log('[renderVerticalConnectionModel] 创建楼梯模型')
    createStairsModel(group, width, depth, color, isSelected, heightScale)
  }
  
  // 设置位置（使用 center.z，因为 getAreaCenter 返回的是 { x, z }）
  group.position.set(center.x, yPosition, center.z)
  console.log(`[renderVerticalConnectionModel] 位置: (${center.x}, ${yPosition}, ${center.z}), 子对象数量: ${group.children.length}`)
  scene.value.add(group)
}

/**
 * 获取区域边界
 */
function getAreaBounds(vertices: { x: number; y: number }[]) {
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
 * 渲染设施3D模型（服务台、洗手间等）
 * @param fullHeight 是否使用完整高度（漫游模式为true，编辑模式为false）
 */
function renderFacilityModel(area: AreaDefinition, yPosition: number, isSelected: boolean, fullHeight: boolean = true) {
  if (!scene.value) return
  
  const center = getAreaCenter(area.shape.vertices)
  const color = parseInt(area.color.replace('#', ''), 16)
  
  const bounds = getAreaBounds(area.shape.vertices)
  const width = bounds.maxX - bounds.minX
  const depth = bounds.maxY - bounds.minY
  
  // 编辑模式下使用缩小的高度比例
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
  scene.value.add(group)
}

function clearSceneObjects() {
  if (!scene.value) return
  const toRemove: THREE.Object3D[] = []
  scene.value.traverse(obj => {
    if (obj.userData.isArea || obj.userData.isAreaLabel || obj.name.startsWith('floor-') || obj.name.startsWith('area-') || obj.name.startsWith('label-') || obj.name === 'mall-outline' || obj.name === 'preview') {
      toRemove.push(obj)
    }
  })
  toRemove.forEach(obj => {
    scene.value!.remove(obj)
    // 递归清理子对象的几何体和材质
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        } else if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        }
      }
      // 清理 Sprite 材质和纹理
      if (child instanceof THREE.Sprite) {
        if (child.material.map) {
          child.material.map.dispose()
        }
        child.material.dispose()
      }
    })
  })
}

// ============================================================================
// Interaction Methods
// ============================================================================

function setupInteraction() {
  if (!containerRef.value) return
  containerRef.value.addEventListener('mousedown', handleMouseDown)
  containerRef.value.addEventListener('mousemove', handleMouseMove)
  containerRef.value.addEventListener('mouseup', handleMouseUp)
  containerRef.value.addEventListener('click', handleClick)
  containerRef.value.addEventListener('dblclick', handleDoubleClick)
  // 注意：wheel 事件由 OrbitControls 处理
}

function handleMouseDown(e: MouseEvent) {
  // 在漫游模式下不处理
  if (viewMode.value === 'orbit') return
  
  if (currentTool.value === 'draw-rect' || currentTool.value === 'draw-poly' || currentTool.value === 'draw-outline') {
    if (e.button === 0) {
      const point = screenToWorld(e.clientX, e.clientY)
      if (point) {
        const snapped = snapEnabled.value ? snapToGrid(point, gridSize.value) : point
        if (!isDrawing.value) {
          isDrawing.value = true
          drawPoints.value = [snapped]
        } else if (currentTool.value === 'draw-poly' || currentTool.value === 'draw-outline') {
          drawPoints.value.push(snapped)
        }
      }
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  // 在漫游模式下不处理（漫游模式有自己的鼠标移动处理）
  if (viewMode.value === 'orbit') return
  
  if (isDrawing.value) {
    const point = screenToWorld(e.clientX, e.clientY)
    if (point) {
      const snapped = snapEnabled.value ? snapToGrid(point, gridSize.value) : point
      updatePreview(snapped)
    }
  }
}

function handleMouseUp(e: MouseEvent) {
  // 在漫游模式下不处理
  if (viewMode.value === 'orbit') return
  
  if (currentTool.value === 'draw-rect' && isDrawing.value && drawPoints.value.length === 1) {
    const point = screenToWorld(e.clientX, e.clientY)
    if (point) {
      const snapped = snapEnabled.value ? snapToGrid(point, gridSize.value) : point
      const startPoint = drawPoints.value[0]
      if (startPoint) {
        finishRectDraw(startPoint, snapped)
      }
    }
  }
}

function handleClick(e: MouseEvent) {
  // 在漫游模式下不处理点击
  if (viewMode.value === 'orbit') return
  
  if (currentTool.value === 'select') {
    // 检查是否选中了基础设施材质
    const selectedMaterial = getSelectedMaterial()
    if (selectedMaterial?.isInfrastructure) {
      // 放置基础设施
      const point = screenToWorld(e.clientX, e.clientY)
      if (point) {
        const snapped = snapEnabled.value ? snapToGrid(point, gridSize.value) : point
        placeInfrastructure(selectedMaterial, snapped)
      }
      return
    }
    
    // 普通选择逻辑
    const intersect = raycastAreas(e.clientX, e.clientY)
    if (intersect) {
      selectArea(intersect.object.userData.areaId)
    } else {
      deselectAll()
    }
  }
}

function handleDoubleClick(_e: MouseEvent) {
  if ((currentTool.value === 'draw-poly' || currentTool.value === 'draw-outline') && isDrawing.value) {
    if (drawPoints.value.length >= 3) {
      finishPolyDraw()
    }
  }
}

function screenToWorld(clientX: number, clientY: number): { x: number; y: number } | null {
  if (!containerRef.value || !camera.value) return null

  const rect = containerRef.value.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  )

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera.value)

  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const point = new THREE.Vector3()
  raycaster.ray.intersectPlane(plane, point)

  // 注意：返回的 y 坐标取反，因为 3D 渲染时会再次取反
  return { x: point.x, y: -point.z }
}

function raycastAreas(clientX: number, clientY: number): THREE.Intersection | null {
  if (!containerRef.value || !camera.value || !scene.value) return null

  const rect = containerRef.value.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  )

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera.value)

  // 收集所有区域对象（包括 Group 和 Mesh）
  const areas: THREE.Object3D[] = []
  scene.value.traverse(obj => {
    if (obj.userData.isArea) {
      areas.push(obj)
    }
  })
  
  // 递归检查所有子对象
  const intersects = raycaster.intersectObjects(areas, true)
  
  // 找到第一个有 areaId 的交叉对象（可能是子对象，需要向上查找）
  for (const intersect of intersects) {
    let obj: THREE.Object3D | null = intersect.object
    while (obj) {
      if (obj.userData.areaId) {
        return { ...intersect, object: obj } as THREE.Intersection
      }
      obj = obj.parent
    }
  }

  return null
}

// ============================================================================
// Drawing Methods
// ============================================================================

function updatePreview(point: { x: number; y: number }) {
  if (!scene.value) return
  removePreview()

  if (currentTool.value === 'draw-rect' && drawPoints.value.length === 1) {
    const start = drawPoints.value[0]
    if (!start) return
    const width = Math.abs(point.x - start.x)
    const height = Math.abs(point.y - start.y)
    if (width < 0.5 || height < 0.5) return

    const geometry = new THREE.BoxGeometry(width, 0.5, height)
    const material = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.4,
    })
    const mesh = new THREE.Mesh(geometry, material)
    // Z 坐标取反以匹配渲染坐标系
    mesh.position.set((start.x + point.x) / 2, 0.25, -(start.y + point.y) / 2)
    mesh.name = 'preview'
    scene.value.add(mesh)
    previewMesh.value = mesh
  } else if ((currentTool.value === 'draw-poly' || currentTool.value === 'draw-outline') && drawPoints.value.length >= 1) {
    const points = [...drawPoints.value, point]
    const linePoints = points.map(p => new THREE.Vector3(p.x, 0, -p.y))  // Y 坐标取反以匹配渲染
    const firstPoint = drawPoints.value[0]
    if (firstPoint) {
      linePoints.push(new THREE.Vector3(firstPoint.x, 0, -firstPoint.y))
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints)
    const material = new THREE.LineBasicMaterial({ color: 0x60a5fa })
    const line = new THREE.Line(geometry, material)
    line.name = 'preview'
    scene.value.add(line)
  }
}

function removePreview() {
  if (!scene.value) return
  const preview = scene.value.getObjectByName('preview')
  if (preview) {
    scene.value.remove(preview)
    if (preview instanceof THREE.Mesh) {
      preview.geometry.dispose()
      if (preview.material instanceof THREE.Material) preview.material.dispose()
    }
  }
  previewMesh.value = null
}

function finishRectDraw(start: { x: number; y: number }, end: { x: number; y: number }) {
  if (!currentFloor.value || !project.value) return

  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)
  if (width < 1 || height < 1) {
    cancelDraw()
    return
  }

  const minX = Math.min(start.x, end.x)
  const minY = Math.min(start.y, end.y)

  // 获取选中的材质预设
  const selectedMaterial = getSelectedMaterial()
  const areaType: AreaType = selectedMaterial?.areaType || 'other'
  const areaColor = selectedMaterial?.color || getAreaTypeColor('other')

  const newArea: AreaDefinition = {
    id: generateId(),
    name: selectedMaterial?.name || `区域-${currentFloor.value.areas.length + 1}`,
    type: areaType,
    shape: {
      vertices: [
        { x: minX, y: minY },
        { x: minX + width, y: minY },
        { x: minX + width, y: minY + height },
        { x: minX, y: minY + height },
      ],
      isClosed: true,
    },
    color: areaColor,
    properties: {
      area: width * height,
      perimeter: 2 * (width + height),
    },
    visible: true,
    locked: false,
  }

  // 验证边界
  if (!isContainedIn(newArea.shape, project.value.outline)) {
    boundaryWarning.value = '区域超出商城边界'
    setTimeout(() => { boundaryWarning.value = null }, 3000)
  }

  // 检测重叠
  checkOverlaps(newArea)

  currentFloor.value.areas.push(newArea)
  cancelDraw()
  renderProject()
  selectArea(newArea.id)
  saveHistory()
  
  // 检查是否需要设置楼层连接
  checkAndPromptFloorConnection(newArea)
  
  // 清除材质选择
  clearMaterialSelection()
}

function finishPolyDraw() {
  if (!currentFloor.value || !project.value || drawPoints.value.length < 3) {
    cancelDraw()
    return
  }

  const polygon = {
    vertices: drawPoints.value.map(p => ({ x: p.x, y: p.y })),
    isClosed: true,
  }

  // 验证多边形是否自相交
  if (isSelfIntersecting(polygon)) {
    boundaryWarning.value = '多边形不能自相交，请重新绘制'
    setTimeout(() => { boundaryWarning.value = null }, 3000)
    cancelDraw()
    return
  }

  if (currentTool.value === 'draw-outline') {
    // 更新商城轮廓
    project.value.outline = polygon
    cancelDraw()
    renderProject()
    saveHistory()
    setTool('select')
    return
  }

  // 获取选中的材质预设
  const selectedMaterial = getSelectedMaterial()
  const areaType: AreaType = selectedMaterial?.areaType || 'other'
  const areaColor = selectedMaterial?.color || getAreaTypeColor('other')

  const newArea: AreaDefinition = {
    id: generateId(),
    name: selectedMaterial?.name || `区域-${currentFloor.value.areas.length + 1}`,
    type: areaType,
    shape: polygon,
    color: areaColor,
    properties: {
      area: calculateArea(polygon),
      perimeter: calculatePerimeter(polygon),
    },
    visible: true,
    locked: false,
  }

  // 验证边界
  if (!isContainedIn(newArea.shape, project.value.outline)) {
    boundaryWarning.value = '区域超出商城边界'
    setTimeout(() => { boundaryWarning.value = null }, 3000)
  }

  checkOverlaps(newArea)

  currentFloor.value.areas.push(newArea)
  cancelDraw()
  renderProject()
  selectArea(newArea.id)
  saveHistory()
  
  // 检查是否需要设置楼层连接
  checkAndPromptFloorConnection(newArea)
  
  // 清除材质选择
  clearMaterialSelection()
}

function cancelDraw() {
  isDrawing.value = false
  drawPoints.value = []
  removePreview()
}

function checkOverlaps(newArea: AreaDefinition) {
  if (!currentFloor.value) return
  overlappingAreas.value = []
  
  for (const area of currentFloor.value.areas) {
    if (area.id === newArea.id) continue
    if (doPolygonsOverlap(newArea.shape, area.shape)) {
      overlappingAreas.value.push(area.id, newArea.id)
    }
  }
}

// ============================================================================
// Selection & Edit Methods
// ============================================================================

function selectArea(areaId: string) {
  selectedAreaId.value = areaId
  renderProject()
}

function deselectAll() {
  selectedAreaId.value = null
  renderProject()
}

function deleteSelectedArea() {
  if (!currentFloor.value || !selectedArea.value) return

  const index = currentFloor.value.areas.findIndex(a => a.id === selectedArea.value!.id)
  if (index !== -1) {
    currentFloor.value.areas.splice(index, 1)
  }

  selectedAreaId.value = null
  renderProject()
  saveHistory()
}

function resetOutline() {
  if (!project.value) return
  
  // 重置为默认矩形轮廓
  project.value.outline = {
    vertices: [
      { x: -25, y: -25 },
      { x: 25, y: -25 },
      { x: 25, y: 25 },
      { x: -25, y: 25 },
    ],
    isClosed: true,
  }
  
  // 同时重置所有楼层的形状为 null（使用商城轮廓）
  project.value.floors.forEach(floor => {
    floor.shape = undefined
  })
  
  renderProject()
  saveHistory()
  resetCamera()
  
  // 提示用户可以重新绘制
  boundaryWarning.value = '轮廓已重置，可使用轮廓工具重新绘制'
  setTimeout(() => { boundaryWarning.value = null }, 3000)
}

function resetCamera() {
  if (!camera.value || !controls.value) return
  
  camera.value.position.set(0, 100, 60)
  controls.value.target.set(0, 6, 0)
  controls.value.update()
}

function updateSelectedAreaType(type: AreaType) {
  if (!selectedArea.value || !currentFloor.value) return
  
  // 找到区域在数组中的索引
  const areaIndex = currentFloor.value.areas.findIndex(a => a.id === selectedArea.value!.id)
  if (areaIndex === -1) return
  
  // 直接修改数组中的对象
  currentFloor.value.areas[areaIndex].type = type
  currentFloor.value.areas[areaIndex].color = getAreaTypeColor(type)
  
  renderProject()
  saveHistory()
}

function updateSelectedAreaName(name: string) {
  if (!selectedArea.value) return
  selectedArea.value.name = name
  saveHistory()
}

function handleNameInput(e: Event) {
  const target = e.target as HTMLInputElement
  updateSelectedAreaName(target.value)
}

// ============================================================================
// Material Panel Methods
// ============================================================================

function toggleLeftPanel() {
  leftPanelCollapsed.value = !leftPanelCollapsed.value
}

function toggleCategory(category: MaterialCategory) {
  const index = expandedCategories.value.indexOf(category)
  if (index === -1) {
    expandedCategories.value.push(category)
  } else {
    expandedCategories.value.splice(index, 1)
  }
}

function selectMaterial(preset: MaterialPreset) {
  selectedMaterialId.value = preset.id
  
  // 基础设施使用点击放置模式
  if (preset.isInfrastructure) {
    setTool('select')  // 使用选择工具，点击放置
    console.log(`[selectMaterial] 选择基础设施: ${preset.name}，点击场景放置`)
  } else {
    // 其他材质使用绘制模式
    setTool('draw-rect')
  }
}

function clearMaterialSelection() {
  selectedMaterialId.value = null
}

function getSelectedMaterial(): MaterialPreset | null {
  if (!selectedMaterialId.value) return null
  return materialPresets.value.find(p => p.id === selectedMaterialId.value) || null
}

// ============================================================================
// Infrastructure Placement Methods
// ============================================================================

/**
 * 放置基础设施
 */
function placeInfrastructure(preset: MaterialPreset, point: { x: number; y: number }) {
  if (!currentFloor.value || !project.value || !scene.value) return
  
  const infrastructureType = preset.infrastructureType
  if (!infrastructureType) return
  
  // 计算当前楼层的 Y 位置
  const floorIndex = project.value.floors.findIndex(f => f.id === currentFloorId.value)
  const floorHeights = project.value.floors.map(f => f.height)
  const yPos = calculateFloorYPosition(floorIndex, floorHeights) + 0.1
  
  // 创建基础设施 3D 模型
  const model = createInfrastructureModel(infrastructureType)
  if (!model) return
  
  // 设置位置（注意 Z 坐标取反）
  model.position.set(point.x, yPos, -point.y)
  
  // 生成唯一 ID
  const id = generateId()
  model.name = `infrastructure-${id}`
  model.userData = {
    isInfrastructure: true,
    infrastructureId: id,
    infrastructureType: infrastructureType,
    floorId: currentFloorId.value,
  }
  
  // 添加到场景
  scene.value.add(model)
  
  // 保存到楼层数据（作为特殊区域）
  const infrastructureArea: AreaDefinition = {
    id: id,
    name: `${preset.name}-${currentFloor.value.areas.length + 1}`,
    type: 'other',
    shape: {
      vertices: [
        { x: point.x - 0.5, y: point.y - 0.5 },
        { x: point.x + 0.5, y: point.y - 0.5 },
        { x: point.x + 0.5, y: point.y + 0.5 },
        { x: point.x - 0.5, y: point.y + 0.5 },
      ],
      isClosed: true,
    },
    color: preset.color,
    properties: {
      infrastructureType: infrastructureType,
      isInfrastructure: true,
    },
    visible: true,
    locked: false,
  }
  
  currentFloor.value.areas.push(infrastructureArea)
  saveHistory()
  
  console.log(`[placeInfrastructure] 放置 ${preset.name} 在 (${point.x}, ${point.y})`)
}

/**
 * 根据类型创建基础设施模型
 */
function createInfrastructureModel(type: string): THREE.Group | null {
  const heightScale = viewMode.value === 'orbit' ? 1.0 : 0.5
  
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

// ============================================================================
// Vertical Connection Methods
// ============================================================================

function checkAndPromptFloorConnection(area: AreaDefinition) {
  // 检查是否为垂直连接类型
  if (isVerticalConnectionAreaType(area.type)) {
    pendingConnectionArea.value = area
    selectedFloorIds.value = currentFloorId.value ? [currentFloorId.value] : []
    showFloorConnectionModal.value = true
  }
}

function confirmFloorConnection() {
  if (!pendingConnectionArea.value || selectedFloorIds.value.length === 0) {
    cancelFloorConnection()
    return
  }

  // 创建垂直连接
  const connection = createVerticalConnection({
    areaId: pendingConnectionArea.value.id,
    type: pendingConnectionArea.value.type as 'elevator' | 'escalator' | 'stairs',
    floorIds: selectedFloorIds.value,
  })

  verticalConnections.value.push(connection)
  
  // 渲染连接指示器
  renderConnectionIndicators()
  
  cancelFloorConnection()
  saveHistory()
}

function cancelFloorConnection() {
  showFloorConnectionModal.value = false
  pendingConnectionArea.value = null
  selectedFloorIds.value = []
}

function toggleFloorSelection(floorId: string) {
  // 检查是否为楼梯类型，楼梯只能连接相邻楼层
  if (pendingConnectionArea.value?.type === 'stairs') {
    // 如果已经选择了楼层，检查新选择的楼层是否相邻
    if (selectedFloorIds.value.length > 0 && !selectedFloorIds.value.includes(floorId)) {
      const selectedFloorLevels = selectedFloorIds.value.map(id => {
        const floor = project.value?.floors.find(f => f.id === id)
        return floor?.level || 0
      })
      const newFloor = project.value?.floors.find(f => f.id === floorId)
      const newLevel = newFloor?.level || 0
      
      // 检查是否与已选楼层相邻
      const isAdjacent = selectedFloorLevels.some(level => Math.abs(level - newLevel) === 1)
      if (!isAdjacent) {
        boundaryWarning.value = '楼梯只能连接相邻楼层'
        setTimeout(() => { boundaryWarning.value = null }, 3000)
        return
      }
      
      // 楼梯最多只能连接两层
      if (selectedFloorIds.value.length >= 2) {
        boundaryWarning.value = '楼梯最多只能连接两个相邻楼层'
        setTimeout(() => { boundaryWarning.value = null }, 3000)
        return
      }
    }
  }
  
  const index = selectedFloorIds.value.indexOf(floorId)
  if (index === -1) {
    selectedFloorIds.value.push(floorId)
  } else {
    selectedFloorIds.value.splice(index, 1)
  }
}

/** 检查楼层是否可以被选择（用于楼梯的相邻楼层限制） */
function isFloorSelectable(floorId: string): boolean {
  // 电梯和扶梯可以选择任意楼层
  if (pendingConnectionArea.value?.type !== 'stairs') {
    return true
  }
  
  // 如果还没有选择任何楼层，所有楼层都可选
  if (selectedFloorIds.value.length === 0) {
    return true
  }
  
  // 如果已经选择了这个楼层，可以取消选择
  if (selectedFloorIds.value.includes(floorId)) {
    return true
  }
  
  // 楼梯最多只能连接两层
  if (selectedFloorIds.value.length >= 2) {
    return false
  }
  
  // 检查是否与已选楼层相邻
  const selectedFloorLevels = selectedFloorIds.value.map(id => {
    const floor = project.value?.floors.find(f => f.id === id)
    return floor?.level || 0
  })
  const targetFloor = project.value?.floors.find(f => f.id === floorId)
  const targetLevel = targetFloor?.level || 0
  
  return selectedFloorLevels.some(level => Math.abs(level - targetLevel) === 1)
}

function renderConnectionIndicators() {
  if (!scene.value || !project.value) return

  // 清除旧的连接指示器
  clearConnectionIndicators(scene.value)

  // 计算楼层 Y 坐标映射
  const floorPositions = new Map<string, number>()
  const floorHeights = project.value.floors.map(f => f.height)
  project.value.floors.forEach((floor, index) => {
    const yPos = calculateFloorYPosition(index, floorHeights)
    floorPositions.set(floor.id, yPos)
  })

  // 渲染每个连接
  verticalConnections.value.forEach(connection => {
    // 找到关联的区域
    let area: AreaDefinition | undefined
    for (const floor of project.value!.floors) {
      area = floor.areas.find(a => a.id === connection.areaId)
      if (area) break
    }

    if (area) {
      const center = getAreaCenter(area.shape.vertices)
      const indicator = createConnectionIndicator(
        connection,
        floorPositions,
        center
      )
      scene.value!.add(indicator)
    }
  })
}

// ============================================================================
// Floor Management
// ============================================================================

function selectFloor(floorId: string) {
  if (currentFloorId.value === floorId) return
  deselectAll()
  currentFloorId.value = floorId
  
  // 在漫游模式下，切换楼层时需要更新角色位置并只渲染当前楼层
  if (viewMode.value === 'orbit') {
    if (characterController && project.value) {
      const floorIndex = project.value.floors.findIndex(f => f.id === floorId)
      const floorHeights = project.value.floors.map(f => f.height)
      const floorY = calculateFloorYPosition(floorIndex, floorHeights) + 0.1
      characterController.setFloorHeight(floorY)
      console.log(`[selectFloor] 漫游模式切换楼层，角色Y位置: ${floorY}`)
    }
    // 漫游模式下只渲染当前楼层
    renderProject(false)
  } else {
    // 编辑模式正常渲染
    renderProject()
  }
}

function addFloor() {
  if (!project.value) return
  const maxLevel = Math.max(...project.value.floors.map(f => f.level), 0)
  newFloorForm.name = `${maxLevel + 1}F`
  newFloorForm.level = maxLevel + 1
  newFloorForm.height = 4
  showAddFloorModal.value = true
}

function confirmAddFloor() {
  if (!project.value || !newFloorForm.name.trim()) return

  const newFloor = createDefaultFloor(newFloorForm.level, newFloorForm.name)
  newFloor.height = newFloorForm.height

  project.value.floors.push(newFloor)
  project.value.floors.sort((a, b) => a.level - b.level)
  
  selectFloor(newFloor.id)
  showAddFloorModal.value = false
  renderProject()
  saveHistory()
}

function deleteFloor(floorId: string) {
  if (!project.value || project.value.floors.length <= 1) return
  
  const index = project.value.floors.findIndex(f => f.id === floorId)
  if (index === -1) return

  project.value.floors.splice(index, 1)
  
  if (currentFloorId.value === floorId) {
    currentFloorId.value = project.value.floors[0]?.id || null
  }

  renderProject()
  saveHistory()
}

function toggleFloorVisibility(floorId: string) {
  if (!project.value) return
  const floor = project.value.floors.find(f => f.id === floorId)
  if (floor) {
    floor.visible = !floor.visible
    renderProject()
  }
}

// ============================================================================
// History Management
// ============================================================================

function saveHistory() {
  if (!project.value) return
  const state = JSON.stringify(project.value)
  
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }
  
  history.value.push(state)
  historyIndex.value = history.value.length - 1
  
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
  
  // 标记有未保存的更改
  markUnsaved()
}

function undo() {
  if (!canUndo.value) return
  historyIndex.value--
  restoreFromHistory()
}

function redo() {
  if (!canRedo.value) return
  historyIndex.value++
  restoreFromHistory()
}

function restoreFromHistory() {
  const state = history.value[historyIndex.value]
  if (!state) return
  
  project.value = JSON.parse(state)
  
  if (currentFloorId.value && !project.value?.floors.find(f => f.id === currentFloorId.value)) {
    currentFloorId.value = project.value?.floors[0]?.id || null
  }

  selectedAreaId.value = null
  renderProject()
}

// ============================================================================
// Export/Import
// ============================================================================

// 服务器项目ID（如果已保存到服务器）
const serverProjectId = ref<string | null>(null)
const isSaving = ref(false)
const saveMessage = ref<string | null>(null)
const showProjectListModal = ref(false)
const projectList = ref<{ projectId: string; name: string; description?: string; floorCount: number; areaCount: number; createdAt: string; updatedAt: string }[]>([])
const isLoadingProjects = ref(false)

// 未保存更改跟踪
const hasUnsavedChanges = ref(false)
const lastSavedState = ref<string | null>(null)

// 离开确认弹窗
const showLeaveConfirm = ref(false)
const pendingNavigation = ref<(() => void) | null>(null)

/**
 * 标记有未保存的更改
 */
function markUnsaved() {
  hasUnsavedChanges.value = true
}

/**
 * 标记已保存
 */
function markSaved() {
  hasUnsavedChanges.value = false
  if (project.value) {
    lastSavedState.value = JSON.stringify(project.value)
  }
}

/**
 * 检查是否有未保存的更改
 */
function checkUnsavedChanges(): boolean {
  if (!project.value) return false
  if (!lastSavedState.value) return hasUnsavedChanges.value
  return JSON.stringify(project.value) !== lastSavedState.value
}

/**
 * 处理离开确认 - 保存并离开
 */
async function handleSaveAndLeave() {
  await saveToServer()
  showLeaveConfirm.value = false
  if (pendingNavigation.value) {
    pendingNavigation.value()
    pendingNavigation.value = null
  }
}

/**
 * 处理离开确认 - 不保存直接离开
 */
function handleLeaveWithoutSave() {
  hasUnsavedChanges.value = false
  showLeaveConfirm.value = false
  if (pendingNavigation.value) {
    pendingNavigation.value()
    pendingNavigation.value = null
  }
}

/**
 * 处理离开确认 - 取消
 */
function handleCancelLeave() {
  showLeaveConfirm.value = false
  pendingNavigation.value = null
}

/**
 * 保存项目到服务器
 */
async function saveToServer() {
  if (!project.value || isSaving.value) return
  
  isSaving.value = true
  saveMessage.value = null
  
  try {
    const { mallBuilderApi, toCreateRequest, toUpdateRequest, toMallProject } = await import('@/api/mall-builder.api')
    
    const isNewProject = !serverProjectId.value
    let response
    if (serverProjectId.value) {
      // 更新现有项目
      response = await mallBuilderApi.updateProject(serverProjectId.value, toUpdateRequest(project.value))
    } else {
      // 创建新项目
      response = await mallBuilderApi.createProject(toCreateRequest(project.value))
    }
    
    // 更新本地项目数据
    const savedProject = toMallProject(response)
    serverProjectId.value = response.projectId
    project.value.version = savedProject.version
    
    // 如果是新项目，更新 URL
    if (isNewProject) {
      router.replace({ params: { projectId: response.projectId } })
    }
    
    // 标记已保存
    markSaved()
    
    saveMessage.value = '保存成功'
    setTimeout(() => { saveMessage.value = null }, 2000)
  } catch (err: unknown) {
    console.error('保存失败:', err)
    const errorMessage = err instanceof Error ? err.message : '保存失败，请重试'
    saveMessage.value = errorMessage
    setTimeout(() => { saveMessage.value = null }, 3000)
  } finally {
    isSaving.value = false
  }
}

/**
 * 加载项目列表
 */
async function loadProjectList() {
  isLoadingProjects.value = true
  try {
    const { mallBuilderApi } = await import('@/api/mall-builder.api')
    projectList.value = await mallBuilderApi.getProjectList()
    showProjectListModal.value = true
  } catch (err) {
    console.error('加载项目列表失败:', err)
  } finally {
    isLoadingProjects.value = false
  }
}

/**
 * 从服务器加载项目
 */
async function loadFromServer(projectId: string) {
  try {
    const { mallBuilderApi, toMallProject } = await import('@/api/mall-builder.api')
    const response = await mallBuilderApi.getProject(projectId)
    const loadedProject = toMallProject(response)
    
    project.value = loadedProject
    serverProjectId.value = response.projectId
    currentFloorId.value = loadedProject.floors[0]?.id || null
    
    // 更新 URL
    router.replace({ params: { projectId: response.projectId } })
    
    showWizard.value = false
    showProjectListModal.value = false
    
    // 标记为已保存状态
    markSaved()
    
    renderProject()
    saveHistory()
  } catch (err) {
    console.error('加载项目失败:', err)
  }
}

/**
 * 删除服务器上的项目
 */
async function deleteFromServer(projectId: string) {
  if (!confirm('确定要删除此项目吗？此操作不可恢复。')) return
  
  try {
    const { mallBuilderApi } = await import('@/api/mall-builder.api')
    await mallBuilderApi.deleteProject(projectId)
    // 刷新列表
    await loadProjectList()
  } catch (err) {
    console.error('删除项目失败:', err)
  }
}

function exportData() {
  if (!project.value) return
  const json = exportProject(project.value)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.value.name}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const json = e.target?.result as string
      const result = importProject(json)
      if (result.success && result.project) {
        project.value = result.project
        currentFloorId.value = result.project.floors[0]?.id || null
        showWizard.value = false
        renderProject()
        saveHistory()
      }
    } catch (err) {
      console.error('导入失败:', err)
    }
  }
  reader.readAsText(file)
}

// ============================================================================
// Background Image
// ============================================================================

function handleBackgroundImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    backgroundImage.value = {
      src: e.target?.result as string,
      opacity: 0.5,
      scale: 1,
      x: 0,
      y: 0,
      locked: false,
    }
  }
  reader.readAsDataURL(file)
}

function removeBackgroundImage() {
  backgroundImage.value = null
}

// ============================================================================
// Utility Methods
// ============================================================================

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  
  return date.toLocaleDateString('zh-CN')
}

function setTool(tool: Tool) {
  if (isDrawing.value) cancelDraw()
  currentTool.value = tool
  if (tool !== 'select') deselectAll()
  
  // 只有在平移工具模式下才启用相机控制
  const ctrl = controls.value
  if (ctrl) {
    ctrl.enabled = (tool === 'pan')
  }
}

/**
 * 切换第三人称漫游模式
 * 进入时创建角色，相机跟随角色移动
 */
function toggleOrbitMode() {
  const ctrl = controls.value
  const cam = camera.value
  if (!ctrl || !cam || !containerRef.value || !renderer.value || !scene.value) return

  if (viewMode.value === 'edit') {
    // 进入第三人称漫游模式
    savedCameraState.value = {
      position: cam.position.clone(),
      target: ctrl.target.clone(),
    }
    viewMode.value = 'orbit'
    ctrl.enabled = false
    
    // 取消当前绘制和选择
    if (isDrawing.value) cancelDraw()
    deselectAll()
    
    // 重新渲染场景，只显示当前楼层的内容
    renderProject(false)
    
    // 计算当前楼层高度
    const floorIndex = project.value?.floors.findIndex(f => f.id === currentFloorId.value) || 0
    const floorHeights = project.value?.floors.map(f => f.height) || [4]
    const floorY = calculateFloorYPosition(floorIndex, floorHeights) + 0.1
    
    // 计算商城轮廓中心点作为角色出生位置
    let spawnX = 0
    let spawnZ = 0
    if (project.value?.outline?.vertices && project.value.outline.vertices.length >= 3) {
      const vertices = project.value.outline.vertices
      let sumX = 0, sumY = 0
      for (const v of vertices) {
        sumX += v.x
        sumY += v.y
      }
      spawnX = sumX / vertices.length
      spawnZ = -sumY / vertices.length  // Y 坐标取反转换为 Z
    }
    
    // 创建角色控制器（使用随机角色模型）
    characterController = new CharacterController()
    characterController.setPosition(spawnX, floorY, spawnZ)
    characterController.setFloorHeight(floorY)
    characterController.setMoveSpeed(walkSpeedPreset.value)  // 应用当前速度设置
    
    // 设置边界碰撞检测
    if (project.value?.outline?.vertices && project.value.outline.vertices.length >= 3) {
      characterController.setBoundary(project.value.outline.vertices)
    }
    
    // 设置区域障碍物碰撞检测（当前楼层的所有区域）
    if (currentFloor.value?.areas) {
      const obstacles = currentFloor.value.areas
        .filter(area => area.visible && area.shape?.vertices?.length >= 3)
        .map(area => ({ vertices: area.shape.vertices }))
      characterController.setObstacles(obstacles)
    }
    
    scene.value.add(characterController.character)
    
    // 添加漫游模式的室内灯光（增大范围以覆盖整个商城）
    const roamingLight = new THREE.PointLight(0xffffff, 2, 200)
    roamingLight.position.set(0, floorY + 3, 0)
    roamingLight.name = 'roaming-light'
    scene.value.add(roamingLight)
    
    // 添加更多分布式灯光来照亮整个空间
    const lightPositions = [
      { x: -30, z: -25 },
      { x: 30, z: -25 },
      { x: -30, z: 25 },
      { x: 30, z: 25 },
    ]
    lightPositions.forEach((pos, i) => {
      const areaLight = new THREE.PointLight(0xffffff, 1, 80)
      areaLight.position.set(pos.x, floorY + 3, pos.z)
      areaLight.name = `roaming-area-light-${i}`
      scene.value!.add(areaLight)
    })
    
    // 添加跟随角色的灯光
    const followLight = new THREE.PointLight(0xffffff, 0.8, 30)
    followLight.position.set(0, floorY + 2, 0)
    followLight.name = 'follow-light'
    characterController.character.add(followLight)
    
    // 重置相机角度
    cameraYaw.value = 0
    cameraPitch.value = 0.3  // 稍微向下看，能看到角色和地面
    
    // 调整相机裁剪平面，确保近距离和远距离物体都可见
    cam.near = 0.01
    cam.far = 500  // 增加远裁剪平面
    cam.updateProjectionMatrix()
    
    // 立即设置相机位置到角色后方（不等待 lerp）
    const charPos = characterController.getPosition()
    const horizontalDist = cameraDistance * Math.cos(cameraPitch.value)
    const verticalOffset = cameraDistance * Math.sin(cameraPitch.value) + cameraHeight
    const initCamX = charPos.x + Math.sin(cameraYaw.value) * horizontalDist
    const initCamY = charPos.y + verticalOffset
    const initCamZ = charPos.z + Math.cos(cameraYaw.value) * horizontalDist
    
    cam.position.set(initCamX, initCamY, initCamZ)
    const lookAtPos = charPos.clone()
    lookAtPos.y += 1.5
    cam.lookAt(lookAtPos)
    
    // 获取 canvas 元素
    const canvas = renderer.value.domElement
    
    // 添加鼠标移动事件监听
    document.addEventListener('mousemove', handleRoamMouseMove)
    
    // 添加点击画布锁定的监听
    canvas.addEventListener('click', handleCanvasClickForPointerLock)
    
    console.log('漫游模式已启动，请点击画布锁定鼠标')
    
    // 开始漫游动画循环
    startRoamLoop()
  } else {
    // 退出漫游模式
    exitRoamMode()
  }
}

/**
 * 处理画布点击以锁定鼠标
 */
function handleCanvasClickForPointerLock(e: MouseEvent) {
  if (viewMode.value !== 'orbit') return
  if (document.pointerLockElement) return
  if (!renderer.value) return
  
  e.stopPropagation()
  e.preventDefault()
  
  renderer.value.domElement.requestPointerLock()
}

/**
 * 处理漫游模式的鼠标移动（控制相机视角）
 */
function handleRoamMouseMove(e: MouseEvent) {
  if (viewMode.value !== 'orbit') return
  if (!document.pointerLockElement) return
  
  const movementX = e.movementX || 0
  const movementY = e.movementY || 0
  
  if (movementX === 0 && movementY === 0) return
  
  // 更新相机偏航角（左右看）- 只控制相机，不旋转角色
  cameraYaw.value -= movementX * mouseSensitivity
  
  // 更新相机俯仰角（上下看）- 鼠标上推向上看（正号）
  cameraPitch.value += movementY * mouseSensitivity
  // 限制俯仰角范围（-0.3 到 1.0，允许稍微向下看和较大幅度向上看）
  cameraPitch.value = Math.max(-0.3, Math.min(1.0, cameraPitch.value))
}

/**
 * 退出漫游模式
 */
function exitRoamMode() {
  const ctrl = controls.value
  const cam = camera.value
  if (!ctrl || !cam) return
  
  // 移除事件监听
  document.removeEventListener('mousemove', handleRoamMouseMove)
  if (renderer.value) {
    renderer.value.domElement.removeEventListener('click', handleCanvasClickForPointerLock)
  }
  
  // 解锁鼠标
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  
  // 停止漫游动画
  stopRoamLoop()
  
  // 移除漫游灯光
  if (scene.value) {
    const roamingLight = scene.value.getObjectByName('roaming-light')
    if (roamingLight) {
      scene.value.remove(roamingLight)
    }
    // 移除分布式灯光
    for (let i = 0; i < 4; i++) {
      const areaLight = scene.value.getObjectByName(`roaming-area-light-${i}`)
      if (areaLight) {
        scene.value.remove(areaLight)
      }
    }
  }
  
  // 移除角色
  if (characterController && scene.value) {
    scene.value.remove(characterController.character)
    characterController.dispose()
    characterController = null
  }
  
  // 恢复相机状态
  if (savedCameraState.value) {
    cam.position.copy(savedCameraState.value.position)
    ctrl.target.copy(savedCameraState.value.target)
    cam.lookAt(ctrl.target)
    ctrl.update()
  }
  
  // 恢复相机裁剪平面
  cam.near = 0.1
  cam.far = 1000
  cam.updateProjectionMatrix()
  
  viewMode.value = 'edit'
  savedCameraState.value = null
  
  // 恢复控制器状态
  ctrl.enabled = (currentTool.value === 'pan')
  
  // 重新渲染场景
  renderProject(false)
}

/**
 * 切换移动速度预设
 */
function cycleWalkSpeed() {
  const presets: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast']
  const currentIndex = presets.indexOf(walkSpeedPreset.value)
  const nextIndex = (currentIndex + 1) % presets.length
  walkSpeedPreset.value = presets[nextIndex]!
  
  if (characterController) {
    characterController.setMoveSpeed(walkSpeedPreset.value)
  }
}

/**
 * 设置移动速度预设
 */
function setWalkSpeed(preset: 'slow' | 'normal' | 'fast') {
  walkSpeedPreset.value = preset
  if (characterController) {
    characterController.setMoveSpeed(preset)
  }
}

/**
 * 开始漫游动画循环
 */
function startRoamLoop() {
  prevTime = performance.now()
  
  function animateRoam() {
    roamAnimationId = requestAnimationFrame(animateRoam)
    
    if (viewMode.value !== 'orbit') return
    if (!characterController) return
    
    const cam = camera.value
    if (!cam) return
    
    const time = performance.now()
    const delta = (time - prevTime) / 1000
    prevTime = time
    
    // 更新角色（传入相机偏航角，使 WASD 相对于相机视角移动）
    characterController.update(delta, cameraYaw.value)
    
    // 计算相机位置（第三人称跟随）
    const charPos = characterController.getPosition()
    const yaw = cameraYaw.value
    const pitch = cameraPitch.value
    
    // 球面坐标计算相机位置
    const horizontalDist = cameraDistance * Math.cos(pitch)
    const verticalOffset = cameraDistance * Math.sin(pitch) + cameraHeight
    
    const cameraX = charPos.x + Math.sin(yaw) * horizontalDist
    const cameraY = charPos.y + verticalOffset
    const cameraZ = charPos.z + Math.cos(yaw) * horizontalDist
    
    // 直接设置相机位置（紧跟角色，不使用 lerp）
    cam.position.set(cameraX, cameraY, cameraZ)
    
    // 相机看向角色头部位置
    const lookAtPos = charPos.clone()
    lookAtPos.y += 1.5  // 看向头部
    cam.lookAt(lookAtPos)
  }
  
  animateRoam()
}

/**
 * 停止漫游动画循环
 */
function stopRoamLoop() {
  if (roamAnimationId !== null) {
    cancelAnimationFrame(roamAnimationId)
    roamAnimationId = null
  }
}

/**
 * 处理漫游模式的键盘按下
 */
function handleRoamKeyDown(e: KeyboardEvent) {
  if (viewMode.value !== 'orbit') return
  if (!characterController) return
  
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      characterController.moveForward = true
      break
    case 'KeyS':
    case 'ArrowDown':
      characterController.moveBackward = true
      break
    case 'KeyA':
    case 'ArrowLeft':
      characterController.moveLeft = true
      break
    case 'KeyD':
    case 'ArrowRight':
      characterController.moveRight = true
      break
  }
}

/**
 * 处理漫游模式的键盘松开
 */
function handleRoamKeyUp(e: KeyboardEvent) {
  if (viewMode.value !== 'orbit') return
  if (!characterController) return
  
  switch (e.code) {
    case 'KeyW':
    case 'ArrowUp':
      characterController.moveForward = false
      break
    case 'KeyS':
    case 'ArrowDown':
      characterController.moveBackward = false
      break
    case 'KeyA':
    case 'ArrowLeft':
      characterController.moveLeft = false
      break
    case 'KeyD':
    case 'ArrowRight':
      characterController.moveRight = false
      break
  }
}

function goBack() {
  router.push('/admin')
}

function handleKeydown(e: KeyboardEvent) {
  // 漫游模式下的按键处理
  if (viewMode.value === 'orbit') {
    handleRoamKeyDown(e)
    
    // ESC 退出漫游模式
    if (e.key === 'Escape') {
      exitRoamMode()
      return
    }
    return
  }
  
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedArea.value) deleteSelectedArea()
  }
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    if (e.key === 's') {
      e.preventDefault()
      exportData()
    }
  }
  if (e.key === 'Escape') {
    if (isDrawing.value) cancelDraw()
    else deselectAll()
    setTool('select')
  }
  // 只有在编辑模式下才响应工具快捷键
  if (viewMode.value === 'edit') {
    if (e.key === 'v' || e.key === 'V') setTool('select')
    if (e.key === 'r' || e.key === 'R') setTool('draw-rect')
    if (e.key === 'p' || e.key === 'P') setTool('draw-poly')
  }
  // O 键切换漫游模式（仅在编辑模式下）
  if ((e.key === 'o' || e.key === 'O') && viewMode.value === 'edit') {
    toggleOrbitMode()
  }
}

function handleKeyup(e: KeyboardEvent) {
  // 漫游模式下的按键松开处理
  if (viewMode.value === 'orbit') {
    handleRoamKeyUp(e)
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
  initEngine()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  window.addEventListener('resize', handleResize)
  
  // 检查 URL 参数中是否有项目 ID
  const projectIdFromUrl = route.params.projectId as string | undefined
  if (projectIdFromUrl) {
    // 从服务器加载项目
    try {
      await loadFromServer(projectIdFromUrl)
    } catch (err) {
      console.error('从 URL 加载项目失败:', err)
      // 加载失败，显示向导
      showWizard.value = true
    }
  } else {
    // 没有项目 ID，检查是否有 AI 生成的商城数据
    loadAiGeneratedMall()
  }
})

/**
 * 加载 AI 生成的商城数据
 */
function loadAiGeneratedMall() {
  const savedMallData = localStorage.getItem('ai_generated_mall')
  if (savedMallData) {
    try {
      const mallData = JSON.parse(savedMallData)
      console.log('[MallBuilder] 加载 AI 生成的商城数据:', mallData)
      
      // 将 AI 生成的数据转换为项目格式
      const projectData = convertAiDataToProject(mallData)
      const result = importProject(JSON.stringify(projectData))
      
      if (result.success && result.project) {
        project.value = result.project
        currentFloorId.value = result.project.floors[0]?.id || null
        showWizard.value = false
        
        // 等待场景初始化完成后渲染
        setTimeout(() => {
          renderProject()
          saveHistory()
        }, 500)
      }
      
      // 清除 localStorage 中的数据（已加载）
      localStorage.removeItem('ai_generated_mall')
    } catch (err) {
      console.error('[MallBuilder] 加载 AI 生成数据失败:', err)
    }
  }
}

/**
 * 将 AI 生成的数据转换为项目格式
 */
function convertAiDataToProject(aiData: any): any {
  return {
    id: generateId(),
    name: aiData.name || '新商城',
    description: aiData.description || '',
    outline: aiData.outline || {
      vertices: [
        { x: -25, y: -25 },
        { x: 25, y: -25 },
        { x: 25, y: 25 },
        { x: -25, y: 25 },
      ],
      isClosed: true,
    },
    floors: (aiData.floors || []).map((floor: any, index: number) => ({
      id: generateId(),
      name: floor.name || `${index + 1}F`,
      level: floor.level || index + 1,
      height: floor.height || 4,
      visible: true,
      locked: false,
      shape: floor.inheritOutline === false ? floor.shape : undefined,
      areas: (floor.areas || []).map((area: any) => ({
        id: generateId(),
        name: area.name || '未命名区域',
        type: mapAreaType(area.type),
        shape: area.shape || {
          vertices: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 },
          ],
          isClosed: true,
        },
        color: area.color || '#3b82f6',
        properties: area.properties || {},
      })),
    })),
    settings: aiData.settings || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  }
}

/**
 * 映射区域类型
 */
function mapAreaType(type: string): AreaType {
  const typeMap: Record<string, AreaType> = {
    'store': 'retail',
    'retail': 'retail',
    'food': 'food',
    'restaurant': 'food',
    'cafe': 'food',
    'corridor': 'corridor',
    'facility': 'service',
    'service': 'service',
    'entrance': 'entrance',
    'entertainment': 'entertainment',
  }
  return typeMap[type?.toLowerCase()] || 'retail'
}

// 浏览器关闭/刷新时的提示
function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (checkUnsavedChanges()) {
    e.preventDefault()
    e.returnValue = '您有未保存的更改，确定要离开吗？'
    return e.returnValue
  }
}

// 路由离开守卫
onBeforeRouteLeave((_to, _from, next) => {
  if (checkUnsavedChanges()) {
    showLeaveConfirm.value = true
    pendingNavigation.value = () => next()
    return false
  }
  next()
})

onMounted(() => {
  // 添加浏览器关闭/刷新提示
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('pointerlockchange', handlePointerLockChange)
  document.removeEventListener('mousemove', handleRoamMouseMove)
  stopRoamLoop()
  
  // 清理角色控制器
  if (characterController) {
    characterController.dispose()
    characterController = null
  }
  if (controls.value) {
    controls.value.dispose()
  }
  if (renderer.value) {
    renderer.value.dispose()
  }
  // 清理 Builder 资源缓存
  disposeBuilderResources()
})

watch(currentFloorId, () => {
  renderProject()
})
</script>

<template>
  <div class="mall-builder">
    <!-- 加载界面 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-logo">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </div>
        <div class="loading-title">商城建模器</div>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: `${loadProgress}%` }"></div>
        </div>
        <div class="loading-text">正在初始化 3D 引擎...</div>
      </div>
    </div>

    <!-- 项目创建向导 -->
    <div v-if="showWizard && !isLoading" class="wizard-overlay">
      <div class="wizard-modal">
        <div class="wizard-header">
          <h2>创建新项目</h2>
          <p>选择一个模板开始，或创建自定义商城</p>
        </div>

        <div class="wizard-body">
          <div class="form-group">
            <label>项目名称</label>
            <input v-model="newProjectName" type="text" class="input" placeholder="输入项目名称" />
          </div>

          <div class="template-section">
            <label>选择模板</label>
            <div class="template-grid">
              <div
                v-for="template in templates"
                :key="template.id"
                :class="['template-card', { active: selectedTemplate?.id === template.id }]"
                @click="selectedTemplate = template"
              >
                <div class="template-icon">
                  <svg viewBox="0 0 48 48" fill="none">
                    <rect v-if="template.type === 'rectangle'" x="8" y="12" width="32" height="24" rx="2" stroke="currentColor" stroke-width="2"/>
                    <path v-else-if="template.type === 'l-shape'" d="M8 12h20v12h12v12H8V12z" stroke="currentColor" stroke-width="2"/>
                    <path v-else-if="template.type === 'u-shape'" d="M8 12h32v24H28V24H20v12H8V12z" stroke="currentColor" stroke-width="2"/>
                    <path v-else-if="template.type === 't-shape'" d="M8 12h32v12H28v12H20V24H8V12z" stroke="currentColor" stroke-width="2"/>
                    <circle v-else-if="template.type === 'circle'" cx="24" cy="24" r="14" stroke="currentColor" stroke-width="2"/>
                    <rect v-else x="8" y="12" width="32" height="24" rx="2" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/>
                  </svg>
                </div>
                <div class="template-name">{{ template.name }}</div>
                <div class="template-desc">{{ template.description }}</div>
              </div>

              <div
                :class="['template-card custom', { active: selectedTemplate === null }]"
                @click="selectedTemplate = null"
              >
                <div class="template-icon">
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="M24 16v16M16 24h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/>
                  </svg>
                </div>
                <div class="template-name">自定义绘制</div>
                <div class="template-desc">手动绘制商城轮廓</div>
              </div>
            </div>
          </div>
        </div>

        <div class="wizard-footer">
          <button class="btn-secondary" @click="goBack">取消</button>
          <button 
            class="btn-primary" 
            @click="selectedTemplate ? createNewProject() : createCustomProject()"
            :disabled="!newProjectName.trim()"
          >
            {{ selectedTemplate ? '创建项目' : '开始绘制' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 3D 渲染容器 -->
    <div ref="containerRef" class="canvas-container"></div>

    <!-- 顶部工具栏 -->
    <header v-if="!isLoading && !showWizard" class="top-toolbar">
      <div class="toolbar-left">
        <button class="btn-back" @click="goBack">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>返回</span>
        </button>
        <div class="toolbar-divider"></div>
        <div class="project-name">
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 8h14M8 8v9" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ project?.name || '商城布局' }}</span>
        </div>
      </div>

      <div class="toolbar-center">
        <div class="tool-group">
          <button :class="['tool-btn', { active: currentTool === 'select' }]" @click="setTool('select')" title="选择工具 (V)">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 4l5 14 2-5 5-2L4 4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </button>
          <button :class="['tool-btn', { active: currentTool === 'pan' }]" @click="setTool('pan')" title="平移工具">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="tool-divider"></div>
          <button :class="['tool-btn', { active: currentTool === 'draw-rect' }]" @click="setTool('draw-rect')" title="绘制矩形 (R)">
            <svg viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
          <button :class="['tool-btn', { active: currentTool === 'draw-poly' }]" @click="setTool('draw-poly')" title="绘制多边形 (P)">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 2l8 6-3 10H5L2 8l8-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </button>
          <button :class="['tool-btn', { active: currentTool === 'draw-outline' }]" @click="setTool('draw-outline')" title="绘制商城轮廓">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M3 3h14v14H3V3z" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
              <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="17" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="17" cy="17" r="1.5" fill="currentColor"/>
              <circle cx="3" cy="17" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          <button class="tool-btn reset-outline" @click="resetOutline" title="重置商城轮廓">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <button class="action-btn" @click="resetCamera" title="重置视图">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 6v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <button 
          :class="['action-btn preview-btn', { active: viewMode === 'orbit' }]" 
          @click="toggleOrbitMode" 
          :title="'进入漫游模式：WASD移动，鼠标转向'"
          :disabled="viewMode === 'orbit'"
        >
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/>
            <circle cx="10" cy="10" r="2" fill="currentColor"/>
            <path d="M10 5v2M10 13v2M5 10h2M13 10h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="btn-label">漫游预览</span>
        </button>
        <div class="toolbar-divider"></div>
        <button class="action-btn" @click="undo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M4 8h10a4 4 0 010 8H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M7 5L4 8l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="action-btn" @click="redo" :disabled="!canRedo" title="重做 (Ctrl+Shift+Z)">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M16 8H6a4 4 0 000 8h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M13 5l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="toolbar-divider"></div>
        <button class="action-btn" @click="exportData" title="导出">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <label class="action-btn" title="导入">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 13V3M6 7l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input type="file" accept=".json" @change="handleImport" style="display: none" />
        </label>
        <button class="btn-save" @click="saveToServer" :disabled="isSaving">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M15 17H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 3v5h5M7 13h6M7 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ isSaving ? '保存中...' : '保存' }}</span>
        </button>
        <button class="action-btn" @click="loadProjectList" title="打开项目">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M3 5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- 左侧面板容器 -->
    <div v-if="!isLoading && !showWizard" :class="['left-panel-container', { collapsed: leftPanelCollapsed }]">
      <!-- 折叠按钮 -->
      <button class="collapse-toggle" @click="toggleLeftPanel" :title="leftPanelCollapsed ? '展开面板' : '收起面板'">
        <svg viewBox="0 0 20 20" fill="none">
          <path v-if="leftPanelCollapsed" d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path v-else d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- 左侧楼层面板 -->
      <aside v-if="showFloorPanel" class="floor-panel">
        <div class="panel-header">
          <h3>楼层</h3>
          <button class="btn-icon" @click="addFloor" title="添加楼层">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="floor-list">
          <div
            v-for="floor in project?.floors"
            :key="floor.id"
            :class="['floor-item', { active: floor.id === currentFloorId }]"
            @click="selectFloor(floor.id)"
          >
            <div class="floor-info">
              <span class="floor-name">{{ floor.name }}</span>
              <span class="floor-count">{{ floor.areas.length }} 区域</span>
            </div>
            <div class="floor-actions">
              <button class="btn-mini" @click.stop="toggleFloorVisibility(floor.id)" :title="floor.visible ? '隐藏' : '显示'">
                <svg v-if="floor.visible" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <svg v-else viewBox="0 0 20 20" fill="none">
                  <path d="M3 3l14 14M10 4c-2 0-3.5.8-4.8 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
              <button class="btn-mini danger" @click.stop="deleteFloor(floor.id)" :disabled="(project?.floors.length || 0) <= 1" title="删除楼层">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M5 6h10M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 背景图片控制 -->
        <div class="panel-section">
          <div class="section-header">
            <h4>背景图片</h4>
          </div>
          <div v-if="backgroundImage" class="bg-controls">
            <div class="control-row">
              <label>透明度</label>
              <input type="range" v-model.number="backgroundImage.opacity" min="0" max="1" step="0.1" />
            </div>
            <div class="control-row">
              <label>缩放</label>
              <input type="range" v-model.number="backgroundImage.scale" min="0.1" max="3" step="0.1" />
            </div>
            <button class="btn-small danger" @click="removeBackgroundImage">移除图片</button>
          </div>
          <label v-else class="upload-btn">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M4 16l4-4 3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>导入参考图</span>
            <input type="file" accept="image/*" @change="handleBackgroundImageUpload" style="display: none" />
          </label>
        </div>
      </aside>

      <!-- 材质面板 -->
      <aside v-if="showMaterialPanel" class="material-panel">
        <div class="panel-header">
          <h3>材质</h3>
          <button 
            v-if="selectedMaterialId" 
            class="btn-icon clear" 
            @click="clearMaterialSelection" 
            title="清除选择"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
      </div>
      
      <div class="material-content">
        <div v-if="selectedMaterialId" class="selected-material-hint">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ getSelectedMaterial()?.isInfrastructure ? '点击场景放置' : '已选择材质，使用绘制工具放置' }}</span>
        </div>
        
        <div 
          v-for="category in categories" 
          :key="category" 
          class="material-category"
        >
          <button 
            class="category-header" 
            @click="toggleCategory(category)"
          >
            <svg 
              :class="['category-arrow', { expanded: expandedCategories.includes(category) }]" 
              viewBox="0 0 20 20" 
              fill="none"
            >
              <path d="M7 8l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ getCategoryDisplayName(category) }}</span>
            <span class="category-count">{{ getMaterialPresetsByCategory(category).length }}</span>
          </button>
          
          <div 
            v-if="expandedCategories.includes(category)" 
            class="material-list"
          >
            <button
              v-for="preset in getMaterialPresetsByCategory(category)"
              :key="preset.id"
              :class="['material-item', { active: selectedMaterialId === preset.id }]"
              :style="{ '--material-color': preset.color }"
              @click="selectMaterial(preset)"
            >
              <div class="material-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path :d="preset.icon" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="material-info">
                <span class="material-name">{{ preset.name }}</span>
                <span class="material-desc">{{ preset.description }}</span>
              </div>
              <div class="material-color" :style="{ background: preset.color }"></div>
            </button>
          </div>
        </div>
      </div>
    </aside>
    </div>

    <!-- 右侧属性面板 -->
    <aside v-if="!isLoading && !showWizard && showPropertyPanel" class="property-panel">
      <div class="panel-header">
        <h3>属性</h3>
      </div>
      
      <div v-if="selectedArea" class="property-content">
        <div class="property-section">
          <label>区域名称</label>
          <input type="text" class="input" :value="selectedArea.name" @input="handleNameInput" />
        </div>

        <div class="property-section">
          <label>区域类型</label>
          <div class="type-grid">
            <button
              v-for="type in areaTypes"
              :key="type.value"
              :class="['type-btn', { active: selectedArea.type === type.value }]"
              :style="{ '--type-color': type.color }"
              @click="updateSelectedAreaType(type.value)"
            >
              <span class="type-dot"></span>
              <span>{{ type.label }}</span>
            </button>
          </div>
        </div>

        <div class="property-section">
          <label>面积 / 周长</label>
          <div class="size-info">
            <div class="size-item">
              <span class="size-label">面积</span>
              <span class="size-value">{{ selectedArea.properties.area.toFixed(1) }} m²</span>
            </div>
            <div class="size-item">
              <span class="size-label">周长</span>
              <span class="size-value">{{ selectedArea.properties.perimeter.toFixed(1) }} m</span>
            </div>
          </div>
        </div>

        <div class="property-actions">
          <button class="btn-danger" @click="deleteSelectedArea">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 6h10M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>删除区域</span>
          </button>
        </div>
      </div>

      <div v-else class="empty-property">
        <svg viewBox="0 0 48 48" fill="none">
          <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
          <path d="M18 24h12M24 18v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>选择一个区域查看属性</p>
        <p class="hint">或使用绘制工具创建新区域</p>
      </div>
    </aside>

    <!-- 警告提示 -->
    <div v-if="boundaryWarning" class="warning-toast">
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span>{{ boundaryWarning }}</span>
    </div>

    <!-- Orbit 模式指示器 -->
    <div v-if="viewMode === 'orbit'" class="orbit-mode-indicator">
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/>
        <circle cx="10" cy="10" r="2" fill="currentColor"/>
        <path d="M10 5v2M10 13v2M5 10h2M13 10h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>漫游模式</span>
      <span v-if="isPointerLocked" class="orbit-hint">WASD 移动 / 鼠标转向 / ESC 退出</span>
      <span v-else class="orbit-hint pointer-lock-hint">点击画布锁定鼠标以控制视角</span>
      
      <!-- 速度选择器 -->
      <div class="speed-selector">
        <span class="speed-label">速度:</span>
        <button 
          v-for="preset in speedPresets" 
          :key="preset"
          :class="['speed-btn', { active: walkSpeedPreset === preset }]"
          @click="setWalkSpeed(preset)"
        >
          {{ speedPresetLabels[preset] }}
        </button>
      </div>
      
      <button class="exit-btn" @click="exitRoamMode">退出漫游</button>
    </div>

    <!-- 重叠警告 -->
    <div v-if="overlappingAreas.length > 0" class="overlap-warning">
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M10 2l8 14H2L10 2z" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 7v4M10 13h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>检测到区域重叠</span>
    </div>

    <!-- 场景图例说明 -->
    <div v-if="!isLoading && !showWizard && project && showSceneLegend" :class="['scene-legend', { collapsed: leftPanelCollapsed }]">
      <div class="legend-header">
        <div class="legend-title">
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 6v1M10 10v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>场景说明</span>
        </div>
        <button class="legend-close" @click="showSceneLegend = false" title="隐藏说明">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-color floor-color"></div>
          <span>透明方块 = 楼层 ({{ project.floors.length }}层)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color outline-color"></div>
          <span>蓝色边框 = 商城轮廓</span>
        </div>
        <div class="legend-item">
          <div class="legend-color area-color"></div>
          <span>彩色区域 = 店铺/区域</span>
        </div>
      </div>
      <div class="legend-tip">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M8 3v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>使用平移工具可旋转/缩放视角</span>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <footer v-if="!isLoading && !showWizard" class="status-bar">
      <div class="status-left">
        <span class="status-item">
          <svg viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          {{ currentFloor?.name || '-' }}
        </span>
        <span class="status-divider"></span>
        <span class="status-item">{{ currentFloor?.areas.length || 0 }} 个区域</span>
      </div>
      <div class="status-center">
        <span class="status-hint">
          <kbd>V</kbd> 选择
          <kbd>R</kbd> 矩形
          <kbd>P</kbd> 多边形
          <kbd>O</kbd> 观察
          <kbd>Del</kbd> 删除
          <kbd>Ctrl+Z</kbd> 撤销
        </span>
      </div>
      <div class="status-right">
        <label class="checkbox-label">
          <input type="checkbox" v-model="snapEnabled" />
          <span>对齐网格</span>
        </label>
      </div>
    </footer>

    <!-- 离开确认弹窗 -->
    <div v-if="showLeaveConfirm" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>未保存的更改</h3>
        </div>
        <div class="modal-body">
          <p style="color: #a1a1aa; line-height: 1.6;">
            您有未保存的更改，是否要在离开前保存？
          </p>
        </div>
        <div class="modal-footer" style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn-secondary" @click="handleCancelLeave">取消</button>
          <button class="btn-secondary" style="color: #f87171;" @click="handleLeaveWithoutSave">不保存</button>
          <button class="btn-primary" @click="handleSaveAndLeave" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存并离开' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加楼层弹窗 -->
    <div v-if="showAddFloorModal" class="modal-overlay" @click.self="showAddFloorModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>添加楼层</h3>
          <button class="btn-close" @click="showAddFloorModal = false">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>楼层名称</label>
            <input v-model="newFloorForm.name" type="text" class="input" placeholder="如：1F" />
          </div>
          <div class="form-group">
            <label>楼层序号</label>
            <input v-model.number="newFloorForm.level" type="number" class="input" min="-5" />
          </div>
          <div class="form-group">
            <label>楼层高度 (米)</label>
            <input v-model.number="newFloorForm.height" type="number" class="input" min="2" max="10" step="0.5" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddFloorModal = false">取消</button>
          <button class="btn-primary" @click="confirmAddFloor" :disabled="!newFloorForm.name.trim()">添加</button>
        </div>
      </div>
    </div>

    <!-- 楼层连接弹窗 -->
    <div v-if="showFloorConnectionModal" class="modal-overlay" @click.self="cancelFloorConnection">
      <div class="modal connection-modal">
        <div class="modal-header">
          <h3>设置楼层连接</h3>
          <button class="btn-close" @click="cancelFloorConnection">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="connection-info">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>选择此{{ pendingConnectionTypeName }}连接的楼层</span>
          </div>
          
          <!-- 连接类型说明 -->
          <div class="connection-type-hint">
            <template v-if="pendingConnectionArea?.type === 'stairs'">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M4 12h3v-3h3v-3h3V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>楼梯只能连接相邻的两个楼层</span>
            </template>
            <template v-else-if="pendingConnectionArea?.type === 'elevator'">
              <svg viewBox="0 0 16 16" fill="none">
                <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5v6M6 7l2-2 2 2M6 9l2 2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>电梯可以连接任意多个楼层</span>
            </template>
            <template v-else>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M3 12L13 2M3 12v-4M3 12h4M13 2v4M13 2H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>扶梯可以连接多个楼层</span>
            </template>
          </div>
          
          <div class="floor-selection">
            <button
              v-for="floor in project?.floors"
              :key="floor.id"
              :class="['floor-select-btn', { 
                selected: selectedFloorIds.includes(floor.id),
                disabled: !isFloorSelectable(floor.id)
              }]"
              :disabled="!isFloorSelectable(floor.id)"
              @click="toggleFloorSelection(floor.id)"
            >
              <svg v-if="selectedFloorIds.includes(floor.id)" viewBox="0 0 20 20" fill="none">
                <path d="M5 10l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ floor.name }}</span>
            </button>
          </div>
          <div v-if="selectedFloorIds.length < 2" class="connection-hint">
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M8 4v4M8 12h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ pendingConnectionArea?.type === 'stairs' ? '请选择两个相邻楼层' : '建议选择至少两个楼层以建立连接' }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelFloorConnection">跳过</button>
          <button 
            class="btn-primary" 
            @click="confirmFloorConnection" 
            :disabled="!canConfirmConnection"
          >
            确认连接
          </button>
        </div>
      </div>
    </div>

    <!-- 帮助按钮 -->
    <button v-if="!isLoading && !showWizard" class="help-btn" @click="showHelpPanel = true" title="使用帮助">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
        <path d="M9 9a3 3 0 115.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="12" cy="17" r="1" fill="currentColor"/>
      </svg>
    </button>

    <!-- 帮助面板 -->
    <div v-if="showHelpPanel" class="help-overlay" @click.self="showHelpPanel = false">
      <div class="help-panel">
        <div class="help-header">
          <h2>商城建模器使用指南</h2>
          <button class="btn-close" @click="showHelpPanel = false">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="help-content">
          <!-- 界面说明 -->
          <section class="help-section">
            <h3>界面说明</h3>
            <div class="help-diagram">
              <div class="diagram-item">
                <div class="diagram-color" style="background: rgba(96, 165, 250, 0.3); border: 2px solid #60a5fa;"></div>
                <div class="diagram-text">
                  <strong>蓝色透明区域</strong>
                  <span>商城轮廓/边界，所有区域应在此范围内绘制</span>
                </div>
              </div>
              <div class="diagram-item">
                <div class="diagram-color" style="background: rgba(163, 163, 163, 0.7);"></div>
                <div class="diagram-text">
                  <strong>灰色/彩色区域</strong>
                  <span>已绘制的店铺区域，不同颜色代表不同类型</span>
                </div>
              </div>
              <div class="diagram-item">
                <div class="diagram-color" style="background: #111; border: 1px solid #333;"></div>
                <div class="diagram-text">
                  <strong>网格地面</strong>
                  <span>3D场景地面，用于参考定位</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 工具说明 -->
          <section class="help-section">
            <h3>工具栏</h3>
            <div class="help-tools">
              <div class="tool-item">
                <div class="tool-icon">
                  <svg viewBox="0 0 20 20" fill="none"><path d="M4 4l5 14 2-5 5-2L4 4z" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="tool-info">
                  <strong>选择工具 (V)</strong>
                  <span>点击选中区域，查看和编辑属性</span>
                </div>
              </div>
              <div class="tool-item">
                <div class="tool-icon">
                  <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="tool-info">
                  <strong>矩形工具 (R)</strong>
                  <span>按住拖动绘制矩形区域</span>
                </div>
              </div>
              <div class="tool-item">
                <div class="tool-icon">
                  <svg viewBox="0 0 20 20" fill="none"><path d="M10 2l8 6-3 10H5L2 8l8-6z" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div class="tool-info">
                  <strong>多边形工具 (P)</strong>
                  <span>点击添加顶点，双击完成绘制</span>
                </div>
              </div>
              <div class="tool-item">
                <div class="tool-icon">
                  <svg viewBox="0 0 20 20" fill="none"><path d="M3 3h14v14H3V3z" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/></svg>
                </div>
                <div class="tool-info">
                  <strong>轮廓工具</strong>
                  <span>重新绘制商城边界轮廓</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 快捷键 -->
          <section class="help-section">
            <h3>快捷键</h3>
            <div class="shortcut-grid">
              <div class="shortcut-item"><kbd>V</kbd><span>选择工具</span></div>
              <div class="shortcut-item"><kbd>R</kbd><span>矩形工具</span></div>
              <div class="shortcut-item"><kbd>P</kbd><span>多边形工具</span></div>
              <div class="shortcut-item"><kbd>Delete</kbd><span>删除选中</span></div>
              <div class="shortcut-item"><kbd>Ctrl+Z</kbd><span>撤销</span></div>
              <div class="shortcut-item"><kbd>Ctrl+S</kbd><span>保存导出</span></div>
              <div class="shortcut-item"><kbd>Esc</kbd><span>取消/退出</span></div>
              <div class="shortcut-item"><kbd>滚轮</kbd><span>缩放视图</span></div>
            </div>
          </section>

          <!-- 操作流程 -->
          <section class="help-section">
            <h3>操作流程</h3>
            <ol class="help-steps">
              <li>
                <strong>创建项目</strong>
                <span>选择模板或自定义绘制商城轮廓</span>
              </li>
              <li>
                <strong>管理楼层</strong>
                <span>在左侧面板添加/切换楼层 (1F, 2F...)</span>
              </li>
              <li>
                <strong>绘制区域</strong>
                <span>使用矩形或多边形工具在蓝色边界内绘制店铺区域</span>
              </li>
              <li>
                <strong>设置属性</strong>
                <span>选中区域后在右侧面板设置名称和类型</span>
              </li>
              <li>
                <strong>保存项目</strong>
                <span>点击保存按钮导出 JSON 文件</span>
              </li>
            </ol>
          </section>

          <!-- 注意事项 -->
          <section class="help-section">
            <h3>注意事项</h3>
            <ul class="help-notes">
              <li>区域应绘制在<strong>蓝色商城边界内</strong>，超出会显示警告</li>
              <li>区域之间<strong>不能重叠</strong>，重叠会显示红色警告</li>
              <li>可以导入参考图片（左侧面板底部）辅助绘制</li>
              <li>支持导入之前导出的 JSON 文件继续编辑</li>
            </ul>
          </section>
        </div>
      </div>
    </div>

    <!-- 项目列表弹窗 -->
    <div v-if="showProjectListModal" class="help-overlay" @click.self="showProjectListModal = false">
      <div class="help-panel" style="width: 600px;">
        <div class="help-header">
          <h2>我的项目</h2>
          <button class="btn-close" @click="showProjectListModal = false">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <div class="help-content">
          <div v-if="isLoadingProjects" class="loading-text">加载中...</div>
          <div v-else-if="projectList.length === 0" class="empty-text">暂无保存的项目</div>
          <div v-else class="project-list">
            <div 
              v-for="item in projectList" 
              :key="item.projectId" 
              class="project-item"
            >
              <div class="project-info" @click="loadFromServer(item.projectId)">
                <div class="project-name">{{ item.name }}</div>
                <div class="project-meta">
                  <span>{{ item.floorCount }} 楼层</span>
                  <span>{{ item.areaCount }} 区域</span>
                  <span>{{ formatDate(item.updatedAt) }}</span>
                </div>
              </div>
              <button class="btn-mini danger" @click.stop="deleteFromServer(item.projectId)" title="删除">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M5 6h10M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存提示 -->
    <div v-if="saveMessage" class="save-toast" :class="{ error: saveMessage.includes('失败') }">
      {{ saveMessage }}
    </div>
  </div>
</template>

<style scoped>
.mall-builder {
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Loading */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-logo {
  width: 64px;
  height: 64px;
  color: #60a5fa;
  animation: pulse 2s ease-in-out infinite;
}

.loading-logo svg { width: 100%; height: 100%; }

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.loading-title {
  font-size: 24px;
  font-weight: 500;
  color: #e8eaed;
}

.loading-bar {
  width: 200px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #a78bfa);
  transition: width 0.3s ease;
}

.loading-text {
  font-size: 13px;
  color: #5f6368;
}

/* Wizard */
.wizard-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}

.wizard-modal {
  width: 700px;
  max-height: 90vh;
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.wizard-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.wizard-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0 0 8px 0;
}

.wizard-header p {
  font-size: 14px;
  color: #5f6368;
  margin: 0;
}

.wizard-body {
  flex: 1;
  padding: 24px 32px;
  overflow-y: auto;
}

.wizard-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.template-section {
  margin-top: 20px;
}

.template-section > label {
  display: block;
  font-size: 13px;
  color: #9aa0a6;
  margin-bottom: 12px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.template-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}

.template-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
}

.template-card.active {
  background: rgba(96, 165, 250, 0.1);
  border-color: #60a5fa;
}

.template-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  color: #5f6368;
}

.template-card.active .template-icon { color: #60a5fa; }

.template-icon svg { width: 100%; height: 100%; }

.template-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #5f6368;
}

/* Canvas */
.canvas-container {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* Toolbar */
.top-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: rgba(17, 17, 19, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 8px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #9aa0a6;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e8eaed;
}

.btn-back svg { width: 16px; height: 16px; }

.project-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e8eaed;
  font-size: 14px;
  font-weight: 500;
}

.project-name svg {
  width: 18px;
  height: 18px;
  color: #60a5fa;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9aa0a6;
  cursor: pointer;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e8eaed;
}

.tool-btn.active {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.tool-btn.reset-outline {
  color: #f28b82;
}

.tool-btn.reset-outline:hover {
  background: rgba(242, 139, 130, 0.15);
  color: #fca5a5;
}

.tool-btn svg { width: 18px; height: 18px; }

.tool-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: #9aa0a6;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: #e8eaed;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.active {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
  color: #60a5fa;
}

.action-btn svg { width: 18px; height: 18px; }

/* 预览按钮特殊样式 */
.action-btn.preview-btn {
  width: auto;
  padding: 0 12px;
  gap: 6px;
}

.action-btn.preview-btn .btn-label {
  font-size: 12px;
  font-weight: 500;
}

.action-btn.preview-btn.active {
  background: rgba(96, 165, 250, 0.2);
  border-color: #60a5fa;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #60a5fa;
  border: none;
  border-radius: 6px;
  color: #0a0a0a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-save:hover:not(:disabled) { background: #93c5fd; }
.btn-save:disabled {
  background: #4b5563;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.7;
}
.btn-save svg { width: 16px; height: 16px; }

/* Left Panel Container */
.left-panel-container {
  position: absolute;
  top: 64px;
  left: 0;
  bottom: 44px;
  display: flex;
  gap: 12px;
  padding-left: 12px;
  z-index: 50;
  transition: transform 0.3s ease;
}

.left-panel-container.collapsed {
  transform: translateX(-484px);
}

.collapse-toggle {
  position: absolute;
  right: -32px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background: rgba(17, 17, 19, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: none;
  border-radius: 0 8px 8px 0;
  color: #9aa0a6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  z-index: 51;
}

.collapse-toggle:hover {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.collapse-toggle svg {
  width: 14px;
  height: 14px;
}

.left-panel-container.collapsed .collapse-toggle {
  right: -32px;
}

/* Panels */
.floor-panel, .property-panel {
  position: relative;
  top: 0;
  bottom: 0;
  width: 240px;
  height: 100%;
  background: rgba(17, 17, 19, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.floor-panel { left: auto; }
.property-panel { 
  position: absolute;
  top: 64px;
  bottom: 44px;
  right: 12px; 
  width: 280px; 
  z-index: 50;
}

/* Material Panel */
.material-panel {
  position: relative;
  top: 0;
  left: auto;
  bottom: 0;
  width: 220px;
  height: 100%;
  background: rgba(17, 17, 19, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  z-index: 50;
  overflow: hidden;
}

.material-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.selected-material-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 8px;
  font-size: 11px;
  color: #60a5fa;
}

.selected-material-hint svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.material-category {
  margin-bottom: 4px;
}

.category-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #9aa0a6;
  cursor: pointer;
  transition: all 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.category-header:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e8eaed;
}

.category-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.category-arrow.expanded {
  transform: rotate(180deg);
}

.category-count {
  margin-left: auto;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.material-list {
  padding: 4px 0 8px 0;
}

.material-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.material-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.material-item.active {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.3);
}

.material-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  color: var(--material-color, #9aa0a6);
  flex-shrink: 0;
}

.material-icon svg {
  width: 18px;
  height: 18px;
}

.material-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.material-name {
  font-size: 13px;
  font-weight: 500;
  color: #e8eaed;
}

.material-desc {
  font-size: 10px;
  color: #5f6368;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.btn-icon.clear {
  background: rgba(242, 139, 130, 0.15);
  color: #f28b82;
}

.btn-icon.clear:hover {
  background: rgba(242, 139, 130, 0.25);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-header h3 {
  font-size: 13px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(96, 165, 250, 0.15);
  border: none;
  border-radius: 6px;
  color: #60a5fa;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover { background: rgba(96, 165, 250, 0.25); }
.btn-icon svg { width: 16px; height: 16px; }

.floor-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.floor-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 4px;
}

.floor-item:hover { background: rgba(255, 255, 255, 0.04); }

.floor-item.active {
  background: rgba(96, 165, 250, 0.15);
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.floor-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.floor-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
}

.floor-count {
  font-size: 11px;
  color: #5f6368;
}

.floor-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.floor-item:hover .floor-actions { opacity: 1; }

.btn-mini {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-mini:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #9aa0a6;
}

.btn-mini.danger:hover:not(:disabled) {
  background: rgba(242, 139, 130, 0.15);
  color: #f28b82;
}

.btn-mini:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-mini svg { width: 14px; height: 14px; }

/* Panel Section */
.panel-section {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.section-header h4 {
  font-size: 11px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px 0;
}

.bg-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.control-row label {
  font-size: 12px;
  color: #9aa0a6;
}

.control-row input[type="range"] {
  flex: 1;
  height: 4px;
  accent-color: #60a5fa;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-small.danger {
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.2);
  color: #f28b82;
}

.btn-small.danger:hover {
  background: rgba(242, 139, 130, 0.2);
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #5f6368;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.25);
  color: #9aa0a6;
}

.upload-btn svg { width: 18px; height: 18px; }

/* Property Panel */
.property-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.property-section {
  margin-bottom: 20px;
}

.property-section label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 13px;
  color: #e8eaed;
  transition: all 0.15s;
}

.input:focus {
  outline: none;
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.05);
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 12px;
  color: #9aa0a6;
  cursor: pointer;
  transition: all 0.15s;
}

.type-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #e8eaed;
}

.type-btn.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--type-color);
  color: #e8eaed;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--type-color);
}

.size-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.size-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

.size-label {
  font-size: 12px;
  color: #5f6368;
}

.size-value {
  font-size: 13px;
  font-weight: 500;
  color: #e8eaed;
  font-family: 'SF Mono', monospace;
}

.property-actions {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-danger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.2);
  border-radius: 6px;
  color: #f28b82;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger:hover { background: rgba(242, 139, 130, 0.2); }
.btn-danger svg { width: 16px; height: 16px; }

.empty-property {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.empty-property svg {
  width: 48px;
  height: 48px;
  color: #3f3f46;
  margin-bottom: 16px;
}

.empty-property p {
  font-size: 13px;
  color: #5f6368;
  margin: 0;
}

.empty-property .hint {
  font-size: 12px;
  color: #3f3f46;
  margin-top: 4px;
}

/* Warnings */
.warning-toast, .overlap-warning {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  color: #fbbf24;
  font-size: 13px;
  z-index: 200;
  animation: slideDown 0.3s ease;
}

.overlap-warning {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.warning-toast svg, .overlap-warning svg {
  width: 18px;
  height: 18px;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Orbit Mode Indicator */
.orbit-mode-indicator {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(96, 165, 250, 0.15);
  border: 1px solid rgba(96, 165, 250, 0.4);
  border-radius: 8px;
  color: #60a5fa;
  font-size: 14px;
  font-weight: 500;
  z-index: 200;
  animation: slideDown 0.3s ease;
}

.orbit-mode-indicator svg {
  width: 20px;
  height: 20px;
}

.orbit-mode-indicator .orbit-hint {
  font-size: 12px;
  font-weight: 400;
  color: #93c5fd;
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid rgba(96, 165, 250, 0.3);
}

.orbit-mode-indicator .orbit-hint.pointer-lock-hint {
  color: #fbbf24;
  animation: pulse-hint 1.5s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.orbit-mode-indicator .exit-btn {
  margin-left: 12px;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  color: #f87171;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.orbit-mode-indicator .exit-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

/* Speed Selector */
.orbit-mode-indicator .speed-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px solid rgba(96, 165, 250, 0.3);
}

.orbit-mode-indicator .speed-label {
  font-size: 12px;
  color: #93c5fd;
}

.orbit-mode-indicator .speed-btn {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #9aa0a6;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.orbit-mode-indicator .speed-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e8eaed;
}

.orbit-mode-indicator .speed-btn.active {
  background: rgba(52, 211, 153, 0.2);
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
}

/* Active Action Button */
.action-btn.active {
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.4);
  color: #60a5fa;
}

/* Status Bar */
.status-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: rgba(17, 17, 19, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 100;
}

.status-left, .status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5f6368;
}

.status-item svg { width: 14px; height: 14px; }

.status-divider {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.status-hint {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: #5f6368;
}

.status-hint kbd {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-family: 'SF Mono', monospace;
  font-size: 10px;
  color: #9aa0a6;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #5f6368;
  cursor: pointer;
}

.checkbox-label input {
  width: 14px;
  height: 14px;
  accent-color: #60a5fa;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 400px;
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0;
}

.btn-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #9aa0a6;
}

.btn-close svg { width: 16px; height: 16px; }

.modal-body { padding: 20px; }

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child { margin-bottom: 0; }

.form-group label {
  display: block;
  font-size: 13px;
  color: #9aa0a6;
  margin-bottom: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-secondary {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #9aa0a6;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e8eaed;
}

.btn-primary {
  padding: 10px 20px;
  background: #60a5fa;
  border: none;
  border-radius: 6px;
  color: #0a0a0a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover:not(:disabled) { background: #93c5fd; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Connection Modal */
.connection-modal {
  width: 420px;
}

.connection-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #60a5fa;
}

.connection-info svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.floor-selection {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.floor-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #9aa0a6;
  cursor: pointer;
  transition: all 0.15s;
}

.floor-select-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: #e8eaed;
}

.floor-select-btn.selected {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
  color: #60a5fa;
}

.floor-select-btn.disabled,
.floor-select-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.02);
}

.floor-select-btn svg {
  width: 16px;
  height: 16px;
}

.connection-type-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: #60a5fa;
}

.connection-type-hint svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.connection-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: #fbbf24;
}

.connection-hint svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Custom Blue Scrollbar */
.mall-builder ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.mall-builder ::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 4px;
}

.mall-builder ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%);
  border-radius: 4px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.3);
}

.mall-builder ::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #60a5fa 0%, #93c5fd 50%, #bfdbfe 100%);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.5);
}

.mall-builder ::-webkit-scrollbar-thumb:active {
  background: linear-gradient(180deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%);
}

.mall-builder ::-webkit-scrollbar-corner {
  background: transparent;
}

/* Firefox scrollbar */
.mall-builder * {
  scrollbar-width: thin;
  scrollbar-color: #60a5fa rgba(30, 41, 59, 0.5);
}

/* Ensure panels can scroll */
.floor-list,
.property-content,
.wizard-body {
  overflow-y: auto;
  overflow-x: hidden;
}

/* Help Button */
.help-btn {
  position: fixed;
  bottom: 52px;
  right: 20px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(96, 165, 250, 0.15);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 50%;
  color: #60a5fa;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s;
}

.help-btn:hover {
  background: rgba(96, 165, 250, 0.25);
  transform: scale(1.05);
}

.help-btn svg {
  width: 22px;
  height: 22px;
}

/* Help Panel */
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.help-panel {
  width: 680px;
  max-height: 85vh;
  background: #111113;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 40px rgba(96, 165, 250, 0.1);
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(96, 165, 250, 0.05);
}

.help-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0;
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.help-section {
  margin-bottom: 28px;
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #60a5fa;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Diagram */
.help-diagram {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diagram-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.diagram-color {
  width: 40px;
  height: 28px;
  border-radius: 4px;
  flex-shrink: 0;
}

.diagram-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.diagram-text strong {
  font-size: 14px;
  color: #e8eaed;
}

.diagram-text span {
  font-size: 12px;
  color: #9aa0a6;
}

/* Tools */
.help-tools {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.tool-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(96, 165, 250, 0.1);
  border-radius: 8px;
  color: #60a5fa;
}

.tool-icon svg {
  width: 18px;
  height: 18px;
}

.tool-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-info strong {
  font-size: 13px;
  color: #e8eaed;
}

.tool-info span {
  font-size: 11px;
  color: #9aa0a6;
}

/* Shortcuts */
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
}

.shortcut-item kbd {
  padding: 4px 8px;
  background: rgba(96, 165, 250, 0.15);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 4px;
  font-family: 'SF Mono', monospace;
  font-size: 11px;
  color: #60a5fa;
}

.shortcut-item span {
  font-size: 12px;
  color: #9aa0a6;
}

/* Steps */
.help-steps {
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}

.help-steps li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  counter-increment: step;
}

.help-steps li:last-child {
  border-bottom: none;
}

.help-steps li::before {
  content: counter(step);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: #0a0a0a;
  flex-shrink: 0;
}

.help-steps li strong {
  display: block;
  font-size: 14px;
  color: #e8eaed;
  margin-bottom: 4px;
}

.help-steps li span {
  font-size: 13px;
  color: #9aa0a6;
}

/* Notes */
.help-notes {
  margin: 0;
  padding: 0;
  list-style: none;
}

.help-notes li {
  position: relative;
  padding: 10px 0 10px 24px;
  font-size: 13px;
  color: #9aa0a6;
  line-height: 1.5;
}

.help-notes li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 16px;
  width: 6px;
  height: 6px;
  background: #60a5fa;
  border-radius: 50%;
}

.help-notes li strong {
  color: #fbbf24;
}

/* Scene Legend */
.scene-legend {
  position: absolute;
  bottom: 52px;
  left: 496px;
  background: rgba(17, 17, 19, 0.9);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  z-index: 80;
  min-width: 200px;
  transition: left 0.3s ease, opacity 0.3s ease;
}

.scene-legend.collapsed {
  left: 12px;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.legend-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #60a5fa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.legend-title svg {
  width: 16px;
  height: 16px;
}

.legend-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.15s;
}

.legend-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #9aa0a6;
}

.legend-close svg {
  width: 12px;
  height: 12px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #9aa0a6;
}

.legend-color {
  width: 20px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-color.floor-color {
  background: rgba(107, 114, 128, 0.4);
  border: 1px solid rgba(107, 114, 128, 0.6);
}

.legend-color.outline-color {
  background: transparent;
  border: 2px solid #60a5fa;
}

.legend-color.area-color {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #f97316 100%);
  opacity: 0.8;
}

.legend-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: #5f6368;
}

.legend-tip svg {
  width: 14px;
  height: 14px;
  color: #60a5fa;
}

/* Project List */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: all 0.15s;
}

.project-item:hover {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.3);
}

.project-info {
  flex: 1;
  cursor: pointer;
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
  margin-bottom: 4px;
}

.project-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9aa0a6;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 40px 20px;
  color: #9aa0a6;
  font-size: 14px;
}

/* Save Toast */
.save-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: rgba(16, 185, 129, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  font-size: 14px;
  color: white;
  z-index: 1000;
  animation: slideUp 0.3s ease;
}

.save-toast.error {
  background: rgba(239, 68, 68, 0.9);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
