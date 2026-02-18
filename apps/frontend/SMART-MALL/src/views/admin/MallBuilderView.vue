<script setup lang="ts">
/**
 * 商城建模器 - 重构版本
 * 
 * 使用模块化的 composables 和组件
 * 
 * 子组件：
 * - BuilderWizard: 项目创建向导
 * - BuilderToolbar: 顶部工具栏
 * - FloorPanel: 楼层管理侧边栏
 * - MaterialPanel: 材质选择侧边栏
 * - PropertyPanel: 选中区域属性编辑
 * - SceneLegend: 场景图例显示
 */
import { ref, computed, onMounted, onUnmounted, watch, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as THREE from 'three'
import { MallBuilderEngine } from '@/engine/mall-builder/MallBuilderEngine'

// 导入 builder 模块
import {
  type MallProject,
  type AreaDefinition,
  type MallTemplate,
  type MaterialPreset,
  type MaterialCategory,
  type VerticalConnection,
  getAllTemplates,
  calculateFloorYPosition,
  CharacterController,
  disposeBuilderResources,
  getAllMaterialPresets,
  getMaterialPresetsByCategory,
  getAllCategories,
  getCategoryDisplayName,
  createVerticalConnection,
  isVerticalConnectionAreaType,
  getConnectionTypeName,
  createConnectionIndicator,
  clearConnectionIndicators,
  getAreaCenter,
  exportProject,
  importProject,
} from '@/builder'
import { extractWallSegments } from '@/builder/geometry/collision'

// 导入子组件
import {
  BuilderWizard,
  BuilderToolbar,
  FloorPanel,
  MaterialPanel,
  PropertyPanel,
  SceneLegend,
  AddFloorDialog,
  type LegendItem,
} from '@/components/mall-builder'

// 导入本地模块
import {
  useProjectManagement,
  useDrawing,
  useFloorManagement,
  useHistory,
  useVerticalConnections,
  useRoamingMode,
  useRendering,
} from './mall-builder/composables'

import { areaTypes } from './mall-builder/config/areaTypes'

// ============================================================================
// Composables 初始化
// ============================================================================

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// 容器引用
const containerRef = ref<HTMLElement | null>(null)

// 建模器引擎
const engine = shallowRef<MallBuilderEngine | null>(null)

// 项目管理
const projectMgmt = useProjectManagement()

// 历史记录
const history = useHistory()

// 渲染
const rendering = useRendering()

// 项目数据
const project = ref<MallProject | null>(null)

// 楼层管理
const floorMgmt = useFloorManagement(() => project.value)

// 绘制工具
const drawing = useDrawing(
  () => engine.value,
  () => gridSize.value,
  () => snapEnabled.value
)

// 垂直连接
const connections = useVerticalConnections(() => project.value)

// 漫游模式
const roaming = useRoamingMode({
  mouseSensitivity: 0.003,
  cameraDistance: 4,
  cameraHeight: 1.2,
  smoothness: 1,
})

// ============================================================================
// 本地状态
// ============================================================================

// 加载状态
const isLoading = ref(true)
const loadProgress = ref(0)

// 向导状态
const showWizard = ref(true)
const selectedTemplate = ref<MallTemplate | null>(null)
const newProjectName = ref('我的商城')

// 视图模式
const viewMode = ref<'edit' | 'orbit'>('edit')
const savedCameraState = ref<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)

// 预览模式
const isPreviewMode = ref(false)
const previewVersionNumber = ref<string | null>(null)
const previewError = ref<string | null>(null)

// 选中状态
const selectedAreaId = ref<string | null>(null)
const selectedArea = computed(() =>
  floorMgmt.currentFloor.value?.areas.find(a => a.id === selectedAreaId.value) || null
)

// 面板状态
const showFloorPanel = ref(true)
const showPropertyPanel = ref(true)
const showMaterialPanel = ref(true)
const leftPanelCollapsed = ref(false)
const showSceneLegend = ref(true)

// 材质面板状态
const selectedMaterialId = ref<string | null>(null)
const expandedCategories = ref<MaterialCategory[]>(['circulation', 'service', 'common', 'infrastructure'])
const materialPresets = computed(() => getAllMaterialPresets())
const categories = computed(() => getAllCategories())

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

// 弹窗状态
const showHelpPanel = ref(false)
const showLeaveConfirm = ref(false)
const showProjectListModal = ref(false)
const pendingNavigation = ref<(() => void) | null>(null)

// 模板列表
const templates = computed(() => getAllTemplates())

// 图例项
const legendItems = computed<LegendItem[]>(() => 
  areaTypes.map(type => ({
    color: type.color,
    label: type.label,
  }))
)

// ============================================================================
// 计算属性
// ============================================================================

const scene = computed(() => engine.value?.scene || null)
const camera = computed(() => engine.value?.camera || null)
const controls = computed(() => engine.value?.getOrbitControls() || null)

// ============================================================================
// 引擎初始化
// ============================================================================

async function initEngine() {
  if (!containerRef.value) return

  loadProgress.value = 20

  try {
    engine.value = new MallBuilderEngine(containerRef.value, {
      antialias: true,
      maxPixelRatio: 2,
      gridSize: 120,
      gridDivisions: 120,
      groundSize: 140,
      groundColor: 0x0d0d0d,
      cameraPosition: { x: 0, y: 100, z: 60 },
      orbitTarget: { x: 0, y: 6, z: 0 },
      minDistance: 10,
      maxDistance: 500,
      maxPolarAngle: Math.PI / 2.2,
      orbitEnabled: false,
    })

    // 启动渲染循环
    engine.value.start()

    loadProgress.value = 60
    setupInteraction()
    loadProgress.value = 100
    setTimeout(() => { isLoading.value = false }, 300)
  } catch (error) {
    console.error('[initEngine] 初始化失败:', error)
    isLoading.value = false
  }
}

function setupInteraction() {
  if (!containerRef.value) return
  containerRef.value.addEventListener('mousedown', handleMouseDown)
  containerRef.value.addEventListener('mousemove', handleMouseMove)
  containerRef.value.addEventListener('mouseup', handleMouseUp)
  containerRef.value.addEventListener('click', handleClick)
  containerRef.value.addEventListener('dblclick', handleDoubleClick)
}

// ============================================================================
// 鼠标事件处理
// ============================================================================

function handleMouseDown(e: MouseEvent) {
  if (viewMode.value === 'orbit') return
  if (drawing.currentTool.value === 'pan') return
  drawing.handleMouseDown(e)
}

function handleMouseMove(e: MouseEvent) {
  if (viewMode.value === 'orbit') return
  if (drawing.currentTool.value === 'pan') return
  drawing.handleMouseMove(e)
}

function handleMouseUp(e: MouseEvent) {
  if (viewMode.value === 'orbit') return
  if (drawing.currentTool.value === 'pan') return
  drawing.handleMouseUp(
    e,
    project.value,
    floorMgmt.currentFloor.value,
    getSelectedMaterial(),
    handleAreaCreated
  )
}

function handleClick(e: MouseEvent) {
  if (viewMode.value === 'orbit') return
  if (drawing.currentTool.value === 'pan') return
  if (drawing.currentTool.value === 'select') {
    const intersect = raycastAreas(e.clientX, e.clientY)
    if (intersect) {
      selectArea(intersect.object.userData.areaId)
    } else {
      deselectAll()
    }
  }
}

function handleDoubleClick(_e: MouseEvent) {
  drawing.handleDoubleClick(
    project.value,
    floorMgmt.currentFloor.value,
    getSelectedMaterial(),
    handleAreaCreated,
    handleOutlineUpdated
  )
}

function handleAreaCreated(area: AreaDefinition) {
  renderProject()
  selectArea(area.id)
  saveHistory()
  
  if (drawing.needsFloorConnection(area)) {
    connections.openConnectionModal(area, floorMgmt.currentFloorId.value)
  }
  
  clearMaterialSelection()
}

function handleOutlineUpdated() {
  // 轮廓变更时标记需要重新定位相机，renderProject 中的 updateSceneCenter 会处理
  if (engine.value) {
    engine.value.invalidateSceneCenter()
  }
  renderProject()
  saveHistory()
}

function raycastAreas(clientX: number, clientY: number): THREE.Intersection | null {
  if (!engine.value || !scene.value) return null

  const mouseEvent = new MouseEvent('click', { clientX, clientY })
  const pickedObject = engine.value.pickObject(mouseEvent, (obj) => obj.userData.isArea === true)
  
  if (!pickedObject) return null
  
  let obj: THREE.Object3D | null = pickedObject
  while (obj) {
    if (obj.userData.areaId) {
      return { object: obj, distance: 0, point: new THREE.Vector3(), face: null } as THREE.Intersection
    }
    obj = obj.parent
  }

  return null
}

// ============================================================================
// 项目方法
// ============================================================================

function createNewProject() {
  if (!selectedTemplate.value) return

  project.value = projectMgmt.createFromTemplate(selectedTemplate.value, newProjectName.value)
  floorMgmt.initFloor(project.value)
  router.replace({ params: { projectId: project.value.id } })
  
  showWizard.value = false
  renderProject()
  saveHistory()
}

function createCustomProject() {
  project.value = projectMgmt.createCustomProject(newProjectName.value)
  floorMgmt.initFloor(project.value)
  router.replace({ params: { projectId: project.value.id } })
  
  showWizard.value = false
  drawing.setTool('draw-outline')
  renderProject()  // 渲染空项目（显示网格和基础场景）
  saveHistory()
}

function renderProject(renderAllFloors: boolean = false) {
  if (!scene.value || !project.value) return
  
  const useFullHeight = viewMode.value === 'orbit'
  const isRoamingMode = viewMode.value === 'orbit'

  // 计算商城轮廓中心（作为备用值）
  let outlineCenter = { x: 0, z: 0 }
  if (project.value.outline?.vertices?.length >= 3) {
    outlineCenter = getAreaCenter(project.value.outline.vertices)
  }

  // 先清空场景对象
  if (engine.value) {
    engine.value.clearSceneObjects()
  }

  // 渲染项目（将业务对象添加到场景）
  rendering.renderProject(
    scene.value,
    project.value,
    floorMgmt.currentFloorId.value,
    selectedAreaId.value,
    overlappingAreas.value,
    {
      renderAllFloors,
      useFullHeight,
      isRoamingMode,
    }
  )

  // 渲染完成后，基于场景中实际对象的 BoundingBox 更新中心
  if (engine.value) {
    engine.value.updateSceneCenter(outlineCenter.x, outlineCenter.z)
  }
  
  // 只在编辑模式下显示连接指示器
  if (viewMode.value === 'edit') {
    renderConnectionIndicators()
  }
}

function renderConnectionIndicators() {
  if (!scene.value || !project.value) return
  
  clearConnectionIndicators(scene.value)
  
  connections.verticalConnections.value.forEach(conn => {
    const indicator = createConnectionIndicator(conn, project.value!)
    if (indicator) {
      scene.value!.add(indicator)
    }
  })
}

// ============================================================================
// 选择方法
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
  if (!floorMgmt.currentFloor.value || !selectedArea.value) return

  const index = floorMgmt.currentFloor.value.areas.findIndex(a => a.id === selectedArea.value!.id)
  if (index !== -1) {
    floorMgmt.currentFloor.value.areas.splice(index, 1)
  }

  selectedAreaId.value = null
  renderProject()
  saveHistory()
}

// ============================================================================
// 材质方法
// ============================================================================

function getSelectedMaterial(): MaterialPreset | null {
  if (!selectedMaterialId.value) return null
  return materialPresets.value.find(p => p.id === selectedMaterialId.value) || null
}

function clearMaterialSelection() {
  selectedMaterialId.value = null
}

function selectMaterial(preset: MaterialPreset) {
  selectedMaterialId.value = preset.id
  if (preset.isInfrastructure) {
    drawing.setTool('select')
  } else {
    drawing.setTool('draw-rect')
  }
}

function toggleCategory(category: MaterialCategory) {
  const index = expandedCategories.value.indexOf(category)
  if (index === -1) {
    expandedCategories.value.push(category)
  } else {
    expandedCategories.value.splice(index, 1)
  }
}

// ============================================================================
// 历史记录
// ============================================================================

function saveHistory() {
  history.saveHistory(project.value, projectMgmt.markUnsaved)
}

function undo() {
  const restored = history.undo()
  if (restored) {
    project.value = restored
    renderProject()
  }
}

function redo() {
  const restored = history.redo()
  if (restored) {
    project.value = restored
    renderProject()
  }
}

// ============================================================================
// 楼层管理
// ============================================================================

const existingLevels = computed(() =>
  project.value?.floors.map(f => f.level) ?? []
)

function handleFloorCreated(data: { name: string; level: number; height: number; layoutDescription: string }) {
  if (!project.value) return

  // 使用 composable 的 newFloorForm 来创建楼层
  floorMgmt.newFloorForm.name = data.name
  floorMgmt.newFloorForm.level = data.level
  floorMgmt.newFloorForm.height = data.height

  const newFloor = floorMgmt.confirmAddFloor()

  if (newFloor) {
    renderProject()
    saveHistory()
  }
}

function openAddFloorModal() {
  floorMgmt.showAddFloorModal.value = true
}

function deleteFloor(floorId: string) {
  if (floorMgmt.deleteFloor(floorId)) {
    renderProject()
    saveHistory()
  }
}

function selectFloor(floorId: string) {
  floorMgmt.selectFloor(floorId)
  renderProject()
}

// ============================================================================
// 导入导出
// ============================================================================

async function handleExport() {
  if (!project.value) return
  
  const json = exportProject(project.value)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.value.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const imported = importProject(text)
    if (imported) {
      project.value = imported
      floorMgmt.initFloor(imported)
      showWizard.value = false
      renderProject()
      saveHistory()
    }
  } catch (error) {
    console.error('导入失败:', error)
  }
  
  input.value = ''
}

// ============================================================================
// 导航
// ============================================================================

function goBack() {
  if (projectMgmt.hasUnsavedChanges.value) {
    showLeaveConfirm.value = true
    pendingNavigation.value = () => router.push('/admin')
  } else {
    router.push('/admin')
  }
}

function confirmLeave() {
  showLeaveConfirm.value = false
  if (pendingNavigation.value) {
    pendingNavigation.value()
    pendingNavigation.value = null
  }
}

function cancelLeave() {
  showLeaveConfirm.value = false
  pendingNavigation.value = null
}

function resetCamera() {
  if (!camera.value || !controls.value) return
  camera.value.position.set(0, 100, 60)
  controls.value.target.set(0, 6, 0)
  controls.value.update()
}

function resetOutline() {
  if (!project.value) return
  project.value.outline = { vertices: [] }
  drawing.setTool('draw-outline')
  renderProject()
  saveHistory()
}

// ============================================================================
// 漫游模式
// ============================================================================

function toggleOrbitMode() {
  if (viewMode.value === 'edit') {
    enterRoamMode()
  } else {
    exitRoamMode()
  }
}

/**
 * 计算当前楼层的 Y 坐标位置
 * 漫游模式下角色需要站在正确的楼层高度上
 */
function getCurrentFloorYPosition(): number {
  if (!project.value) return 0
  const floorIndex = project.value.floors.findIndex(f => f.id === floorMgmt.currentFloorId.value)
  if (floorIndex < 0) return 0
  const floorHeights = project.value.floors.map(f => f.height)
  return calculateFloorYPosition(floorIndex, floorHeights)
}

// canvas click handler 引用（漫游模式下点击画面触发 pointer lock）
let roamCanvasClickHandler: (() => void) | null = null

function enterRoamMode() {
  if (!engine.value || !camera.value || !controls.value || !scene.value || !project.value) return
  
  // 保存当前相机状态
  savedCameraState.value = {
    position: camera.value.position.clone(),
    target: controls.value.target.clone(),
  }
  
  viewMode.value = 'orbit'
  controls.value.enabled = false
  
  // 保持暗色主题背景
  if (scene.value) {
    scene.value.background = new THREE.Color(0x0a0a0a)
  }
  
  // 隐藏建模器网格和地板（漫游环境有自己的地板）
  const grid = scene.value.getObjectByName('mall-builder-grid')
  const ground = scene.value.getObjectByName('mall-builder-ground')
  if (grid) grid.visible = false
  if (ground) ground.visible = false
  
  // 先渲染漫游场景（clearSceneObjects 会清除所有非基础对象）
  renderProject()
  
  // 渲染完成后再添加角色，避免被 clearSceneObjects 清除
  const startPos = getAreaCenter(project.value.outline.vertices)
  const floorY = getCurrentFloorYPosition()
  const controller = new CharacterController()
  controller.setPosition(startPos.x, floorY, startPos.z)
  scene.value.add(controller.character)
  roaming.setCharacterController(controller)
  
  // 设置碰撞边界
  if (project.value.outline?.vertices?.length >= 3) {
    controller.setBoundary(project.value.outline.vertices)
  }
  
  // 提取当前楼层墙壁碰撞数据
  const currentFloor = project.value.floors.find(f => f.id === floorMgmt.currentFloorId.value)
  if (currentFloor) {
    const wallSegments = extractWallSegments(currentFloor)
    controller.setWallSegments(wallSegments)
  }
  
  // 通过 composable 启动漫游（内部调用引擎接口）
  roaming.startRoaming(engine.value, controller.character)

  // 设置初始相机角度：yaw 在角色背后（characterYaw + π），pitch 略微俯视
  engine.value.setCameraAngles(controller.getRotationY() + Math.PI, -0.1)

  // 注册 canvas click handler：用户点击画面时请求 pointer lock
  const canvas = engine.value.getRenderer().domElement
  roamCanvasClickHandler = () => engine.value?.requestPointerLock()
  canvas.addEventListener('click', roamCanvasClickHandler)
}

function exitRoamMode() {
  if (!camera.value || !controls.value) return
  
  viewMode.value = 'edit'
  
  // 恢复场景背景色
  if (scene.value) {
    scene.value.background = new THREE.Color(0x0a0a0a)
  }
  
  // 移除 canvas click handler
  if (roamCanvasClickHandler && engine.value) {
    const canvas = engine.value.getRenderer().domElement
    canvas.removeEventListener('click', roamCanvasClickHandler)
    roamCanvasClickHandler = null
  }
  
  // 移除角色模型
  const controller = roaming.getCharacterController()
  if (controller && scene.value) {
    scene.value.remove(controller.character)
    controller.dispose()
  }
  
  // 通过 composable 停止漫游（内部调用引擎接口）
  roaming.stopRoaming()
  roaming.setCharacterController(null)
  
  // 恢复建模器网格和地板
  if (scene.value) {
    const grid = scene.value.getObjectByName('mall-builder-grid')
    const ground = scene.value.getObjectByName('mall-builder-ground')
    if (grid) grid.visible = true
    if (ground) ground.visible = true
  }
  
  // 恢复相机状态
  if (savedCameraState.value) {
    camera.value.position.copy(savedCameraState.value.position)
    controls.value.target.copy(savedCameraState.value.target)
    controls.value.update()
  }
  
  controls.value.enabled = true
  renderProject()
}

/**
 * 漫游模式下切换楼层
 * 需要重建角色和漫游环境，保持漫游状态不中断
 */
function handleRoamingFloorSwitch() {
  if (!engine.value || !scene.value || !project.value) return

  // 移除旧角色
  const oldController = roaming.getCharacterController()
  if (oldController && scene.value) {
    scene.value.remove(oldController.character)
    oldController.dispose()
    roaming.setCharacterController(null)
  }

  // 重新渲染场景（会重建漫游环境）
  renderProject()

  // 保持暗色背景（renderProject 不会重设，但以防万一）
  scene.value.background = new THREE.Color(0x0a0a0a)

  // 隐藏建模器网格和地板
  const grid = scene.value.getObjectByName('mall-builder-grid')
  const ground = scene.value.getObjectByName('mall-builder-ground')
  if (grid) grid.visible = false
  if (ground) ground.visible = false

  // 重新创建角色
  const startPos = getAreaCenter(project.value.outline.vertices)
  const floorY = getCurrentFloorYPosition()
  const controller = new CharacterController()
  controller.setPosition(startPos.x, floorY, startPos.z)
  scene.value.add(controller.character)
  roaming.setCharacterController(controller)

  // 设置碰撞边界
  if (project.value.outline?.vertices?.length >= 3) {
    controller.setBoundary(project.value.outline.vertices)
  }

  // 提取新楼层墙壁碰撞数据
  const currentFloor = project.value.floors.find(f => f.id === floorMgmt.currentFloorId.value)
  if (currentFloor) {
    const wallSegments = extractWallSegments(currentFloor)
    controller.setWallSegments(wallSegments)
  }

  // 更新跟随目标到新角色
  engine.value.setFollowTarget(controller.character, {
    distance: 4,
    lookAtHeightOffset: 1.2,
    smoothness: 1,
    mouseSensitivity: 0.003,
    pitchLimit: { min: -0.3, max: 1.0 },
  })
}

// ============================================================================
// 键盘事件
// ============================================================================

function handleKeydown(e: KeyboardEvent) {
  if (viewMode.value === 'orbit') {
    roaming.handleRoamKeyDown(e)
    if (e.key === 'Escape') {
      exitRoamMode()
      return
    }
    return
  }

  // 预览模式：仅允许漫游切换，屏蔽编辑快捷键
  if (isPreviewMode.value) {
    if (e.key === 'o' || e.key === 'O') toggleOrbitMode()
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
      handleSave()
    }
  }
  if (e.key === 'Escape') {
    if (drawing.isDrawing.value) drawing.cancelDraw()
    else deselectAll()
    drawing.setTool('select')
  }
  if (e.key === 'v' || e.key === 'V') drawing.setTool('select')
  if (e.key === 'r' || e.key === 'R') drawing.setTool('draw-rect')
  if (e.key === 'p' || e.key === 'P') drawing.setTool('draw-poly')
  if ((e.key === 'o' || e.key === 'O') && viewMode.value === 'edit') {
    toggleOrbitMode()
  }
}

function handleKeyup(e: KeyboardEvent) {
  if (viewMode.value === 'orbit') {
    roaming.handleRoamKeyUp(e)
  }
}

// ============================================================================
// 保存
// ============================================================================

async function handleSave() {
  if (!project.value) return
  
  try {
    await projectMgmt.saveToServer(project.value)
  } catch (error) {
    console.error('保存失败:', error)
  }
}

async function handlePublish() {
  if (!project.value || !projectMgmt.serverProjectId.value) {
    // 未保存过的项目需要先保存
    if (project.value) {
      const saved = await projectMgmt.saveToServer(project.value)
      if (!saved) return
    } else {
      return
    }
  }
  
  try {
    await projectMgmt.publishToServer(projectMgmt.serverProjectId.value!)
  } catch (error) {
    console.error('发布失败:', error)
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(async () => {
  await initEngine()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)

  // 检测预览模式（版本快照）
  const versionId = route.query.versionId as string | undefined
  const versionNumber = route.query.versionNumber as string | undefined
  if (versionId) {
    const loaded = await projectMgmt.loadFromVersionSnapshot(versionId)
    if (loaded) {
      project.value = loaded
      floorMgmt.initFloor(loaded)
      isPreviewMode.value = true
      previewVersionNumber.value = versionNumber || null
      showWizard.value = false
      renderProject()
    } else {
      console.warn('版本快照加载失败')
      previewError.value = '无法加载版本快照数据，请返回版本列表重试'
      isPreviewMode.value = true
      showWizard.value = false
    }
    return
  }

  const projectIdFromUrl = route.params.projectId as string | undefined
  if (projectIdFromUrl) {
    const loaded = await projectMgmt.loadFromServer(projectIdFromUrl)
    if (loaded) {
      project.value = loaded
      floorMgmt.initFloor(loaded)
      showWizard.value = false
      renderProject()
      saveHistory()
    } else {
      // 项目不存在或加载失败，清除 URL 中的 projectId 并显示向导
      console.warn('项目加载失败，显示创建向导')
      router.replace({ name: 'Builder' })
      showWizard.value = true
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  roaming.dispose()
  
  if (engine.value) {
    engine.value.dispose()
    engine.value = null
  }
  
  disposeBuilderResources()
})

watch(() => floorMgmt.currentFloorId.value, () => {
  if (viewMode.value === 'orbit') {
    // 漫游模式下切换楼层：需要重建角色和漫游环境
    handleRoamingFloorSwitch()
  } else {
    renderProject()
  }
})

// ============================================================================
// 子组件事件处理
// ============================================================================

/**
 * 处理向导模板选择更新
 */
function handleTemplateUpdate(template: MallTemplate | null) {
  selectedTemplate.value = template
}

/**
 * 处理向导项目名称更新
 */
function handleProjectNameUpdate(name: string) {
  newProjectName.value = name
}

/**
 * 处理工具选择
 */
function handleSelectTool(tool: 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline') {
  drawing.setTool(tool)
}

/**
 * 处理 AI 生成的项目
 */
function handleCreateFromAI(aiProject: MallProject) {
  project.value = aiProject
  floorMgmt.initFloor(aiProject)
  router.replace({ params: { projectId: aiProject.id } })

  showWizard.value = false
  renderProject()
  saveHistory()
}

/**
 * 处理区域属性更新
 */
function handleAreaUpdate(updatedArea: AreaDefinition) {
  if (!floorMgmt.currentFloor.value || !selectedArea.value) return
  
  const index = floorMgmt.currentFloor.value.areas.findIndex(a => a.id === selectedArea.value!.id)
  if (index !== -1) {
    floorMgmt.currentFloor.value.areas[index] = updatedArea
    renderProject()
    saveHistory()
  }
}
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
        <div class="loading-title">{{ t('admin.mallBuilder') }}</div>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: `${loadProgress}%` }"></div>
        </div>
        <div class="loading-text">{{ t('admin.initEngine') }}</div>
      </div>
    </div>

    <!-- 项目创建向导 (使用子组件) -->
    <BuilderWizard
      :visible="showWizard && !isLoading"
      :templates="templates"
      :selectedTemplate="selectedTemplate"
      :projectName="newProjectName"
      @update:selectedTemplate="handleTemplateUpdate"
      @update:projectName="handleProjectNameUpdate"
      @create="createNewProject"
      @createCustom="createCustomProject"
      @createFromAI="handleCreateFromAI"
      @cancel="goBack"
    />

    <!-- 主界面 -->
    <template v-if="!showWizard && !isLoading">
      <!-- 预览模式工具栏 -->
      <div v-if="isPreviewMode" class="preview-toolbar">
        <button class="btn-back" @click="router.push('/admin/layout-version')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {{ t('admin.backToVersionList') }}
        </button>
        <div class="preview-info">
          <span class="preview-badge">{{ t('admin.previewMode') }}</span>
          <span v-if="previewVersionNumber" class="preview-version">{{ previewVersionNumber }}</span>
        </div>
        <div class="preview-actions">
          <button class="btn-secondary" @click="toggleOrbitMode">
            {{ viewMode === 'orbit' ? t('admin.exitRoam') : t('admin.roamMode') }}
          </button>
        </div>
      </div>

      <!-- 预览加载失败提示 -->
      <div v-if="previewError" class="preview-error-overlay">
        <div class="preview-error-card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" class="error-icon">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          <p class="error-text">{{ previewError }}</p>
          <button class="btn-back" @click="router.push('/admin/layout-version')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {{ t('admin.backToVersionList') }}
          </button>
        </div>
      </div>

      <!-- 顶部工具栏 (使用子组件) -->
      <BuilderToolbar
        v-else
        :projectName="project?.name || t('admin.mallLayout')"
        :currentTool="drawing.currentTool.value"
        :viewMode="viewMode"
        :canUndo="history.canUndo.value"
        :canRedo="history.canRedo.value"
        :isSaving="projectMgmt.isSaving.value"
        :isPublishing="projectMgmt.isPublishing.value"
        @back="goBack"
        @selectTool="handleSelectTool"
        @resetOutline="resetOutline"
        @resetCamera="resetCamera"
        @toggleOrbitMode="toggleOrbitMode"
        @undo="undo"
        @redo="redo"
        @export="handleExport"
        @import="handleImport"
        @save="handleSave"
        @publish="handlePublish"
      />

      <!-- 左侧楼层面板 (使用子组件) -->
      <FloorPanel
        v-if="showFloorPanel && (viewMode === 'edit' || isPreviewMode) && !(isPreviewMode && viewMode === 'orbit')"
        :floors="project?.floors || []"
        :currentFloorId="floorMgmt.currentFloorId.value"
        v-model:collapsed="leftPanelCollapsed"
        @select="selectFloor"
        @add="openAddFloorModal"
        @delete="deleteFloor"
      />

      <!-- 右侧属性面板 (使用子组件) -->
      <PropertyPanel
        v-if="showPropertyPanel && viewMode === 'edit' && !isPreviewMode"
        :area="selectedArea"
        :areaTypes="areaTypes"
        @update:area="handleAreaUpdate"
        @delete="deleteSelectedArea"
        @close="deselectAll"
      />

      <!-- 材质面板 (使用子组件) -->
      <MaterialPanel
        v-if="showMaterialPanel && viewMode === 'edit' && !selectedArea && !isPreviewMode"
        :categories="categories"
        :expandedCategories="expandedCategories"
        :selectedMaterialId="selectedMaterialId"
        @toggleCategory="toggleCategory"
        @selectMaterial="selectMaterial"
        @clearSelection="clearMaterialSelection"
      />

      <!-- 场景图例 (使用子组件) -->
      <SceneLegend
        v-if="viewMode === 'edit' || (isPreviewMode && viewMode !== 'orbit')"
        :visible="showSceneLegend"
        :items="legendItems"
      />

      <!-- 漫游模式指示器 -->
      <div v-if="viewMode === 'orbit'" class="roaming-indicator">
        <div class="roaming-controls">
          <div class="control-hint">
            <span class="key">W A S D</span>
            <span>{{ t('admin.roamMove') }}</span>
          </div>
          <div class="control-hint">
            <span class="key">{{ t('admin.roamMouse') }}</span>
            <span>{{ t('admin.roamLook') }}</span>
          </div>
          <div class="control-hint">
            <span class="key">ESC</span>
            <span>{{ t('admin.roamExit') }}</span>
          </div>
        </div>
        <button class="btn-exit-roam" @click="exitRoamMode">
          {{ t('admin.exitRoam') }}
        </button>
      </div>

      <!-- 底部状态栏（已隐藏） -->
    </template>

    <!-- 3D 渲染容器 -->
    <div ref="containerRef" class="canvas-container"></div>

    <!-- 添加楼层弹窗 -->
    <AddFloorDialog
      v-model:visible="floorMgmt.showAddFloorModal.value"
      :existingLevels="existingLevels"
      @created="handleFloorCreated"
    />

    <!-- 离开确认弹窗 -->
    <div v-if="showLeaveConfirm" class="modal-overlay" @click.self="cancelLeave">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ t('admin.unsavedChanges') }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ t('admin.unsavedConfirm') }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelLeave">{{ t('common.cancel') }}</button>
          <button class="btn-danger" @click="confirmLeave">{{ t('admin.leave') }}</button>
        </div>
      </div>
    </div>

    <!-- 帮助面板 -->
    <div v-if="showHelpPanel" class="modal-overlay" @click.self="showHelpPanel = false">
      <div class="modal help-modal">
        <div class="modal-header">
          <h3>{{ t('admin.hotkeyHelp') }}</h3>
          <button class="btn-icon" @click="showHelpPanel = false">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="help-section">
            <h4>{{ t('admin.hotkeyTools') }}</h4>
            <ul>
              <li><kbd>V</kbd> {{ t('admin.hotkeySelect') }}</li>
              <li><kbd>R</kbd> {{ t('admin.hotkeyRect') }}</li>
              <li><kbd>P</kbd> {{ t('admin.hotkeyPolygon') }}</li>
              <li><kbd>O</kbd> {{ t('admin.roamMode') }}</li>
            </ul>
          </div>
          <div class="help-section">
            <h4>{{ t('admin.hotkeyEdit') }}</h4>
            <ul>
              <li><kbd>Ctrl+Z</kbd> {{ t('admin.hotkeyUndo') }}</li>
              <li><kbd>Ctrl+Shift+Z</kbd> {{ t('admin.hotkeyRedo') }}</li>
              <li><kbd>Ctrl+S</kbd> {{ t('admin.hotkeySave') }}</li>
              <li><kbd>Delete</kbd> {{ t('admin.hotkeyDelete') }}</li>
              <li><kbd>Esc</kbd> {{ t('admin.hotkeyCancel') }}</li>
            </ul>
          </div>
          <div class="help-section">
            <h4>{{ t('admin.roamMode') }}</h4>
            <ul>
              <li><kbd>W A S D</kbd> {{ t('admin.roamMove') }}</li>
              <li><kbd>{{ t('admin.roamMouse') }}</kbd> {{ t('admin.roamLook') }}</li>
              <li><kbd>Esc</kbd> {{ t('admin.exitRoam') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 楼层连接弹窗 -->
    <div v-if="connections.showFloorConnectionModal.value" class="modal-overlay" @click.self="connections.closeConnectionModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ t('admin.setConnectionFloor', { type: connections.pendingConnectionTypeName.value }) }}</h3>
          <button class="btn-icon" @click="connections.closeConnectionModal">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">{{ t('admin.selectConnectionFloor', { type: connections.pendingConnectionTypeName.value }) }}</p>
          <div class="floor-checkbox-list">
            <label 
              v-for="floor in project?.floors" 
              :key="floor.id" 
              class="floor-checkbox"
            >
              <input 
                type="checkbox" 
                :value="floor.id" 
                v-model="connections.selectedFloorIds.value"
                :disabled="floor.id === floorMgmt.currentFloorId.value"
              />
              <span>{{ floor.name }}</span>
              <span v-if="floor.id === floorMgmt.currentFloorId.value" class="current-badge">{{ t('admin.current') }}</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="connections.closeConnectionModal">{{ t('common.cancel') }}</button>
          <button 
            class="btn-primary" 
            @click="connections.confirmConnection"
            :disabled="!connections.canConfirmConnection.value"
          >
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/assets/styles/views/admin/mall-builder.scss"></style>

<style scoped lang="scss">
// ============================================================================
// Preview Mode
// ============================================================================
.preview-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(10, 10, 11, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #a1a1aa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #e8eaed;
    border-color: rgba(255, 255, 255, 0.2);
  }

  svg {
    flex-shrink: 0;
  }
}

.preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-badge {
  padding: 4px 10px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 500;
}

.preview-version {
  color: #a1a1aa;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.preview-actions {
  display: flex;
  gap: 8px;

  .btn-secondary {
    padding: 8px 14px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #a1a1aa;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #e8eaed;
    }
  }
}

// ============================================================================
// Preview Error
// ============================================================================
.preview-error-overlay {
  position: absolute;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 11, 0.95);
}

.preview-error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  max-width: 360px;
  text-align: center;

  .error-icon {
    color: #ef4444;
  }

  .error-text {
    color: #a1a1aa;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
  }
}
</style>
