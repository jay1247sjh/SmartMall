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
import { useSettingsStore } from '@/stores/settings.store'
import {
  getPublishedMallData,
  planPublishedMallNavigation,
  type NavigationPlanRequest,
  type NavigationRouteData,
  type NavigationRoutePoint,
} from '@/api/mall-manage.api'
import { toMallProject } from '@/api/mall-builder.api'
import { useBuilderNavigationStore, type BuilderNavigationIntent } from '@/stores/builder-navigation.store'

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
  CommandPalette,
  BuilderInlineInput,
  BuilderBottomDrawer,
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
  useDoorPlacement,
} from './mall-builder/composables'

import { areaTypes } from './mall-builder/config/areaTypes'

// ============================================================================
// Composables 初始化
// ============================================================================

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()
const builderNavigationStore = useBuilderNavigationStore()
const isMerchantPreviewRoute = route.name === 'MerchantMallPreview' || route.path === '/merchant/mall-preview'
const isUserPreviewRoute = route.name === 'Mall3D' || route.path === '/mall/3d'
const isPublishedPreviewRoute = isMerchantPreviewRoute || isUserPreviewRoute

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
  autoAlignWhenUnlocked: false,
  yawConstraintEnabled: true,
  yawConstraintHalfAngleDeg: 45,
  yawConstraintCenterOffsetDeg: 180,
})

// 门放置
const doorPlacement = useDoorPlacement(() => engine.value)

// ============================================================================
// 本地状态
// ============================================================================

// 加载状态
const isLoading = ref(true)
const loadProgress = ref(0)

// 向导状态
const showWizard = ref(!isPublishedPreviewRoute)
const selectedTemplate = ref<MallTemplate | null>(null)
const newProjectName = ref('')

// 视图模式
const viewMode = ref<'edit' | 'orbit'>('edit')
const savedCameraState = ref<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null)

// 预览模式
type PreviewContext = 'merchant' | 'user' | 'adminVersion' | null
const isPreviewMode = ref(false)
const previewContext = ref<PreviewContext>(null)
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
const rightPanelCollapsed = ref(false)
const showCommandPalette = ref(false)
const showSceneLegend = ref(true)
const showInlineInput = ref(false)
const showBottomDrawer = ref(false)

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
const pendingRoamingSpawnPosition = ref<THREE.Vector3 | null>(null)
const pendingRoamingSpawnRotation = ref<number | null>(null)

// 保存反馈状态
const saveToastVisible = ref(false)
const saveToastType = ref<'success' | 'error'>('success')
const saveToastMessage = ref('')
const lastSavedAt = ref<Date | null>(null)
let saveToastTimer: ReturnType<typeof setTimeout> | null = null
let loadingOverlayTimer: ReturnType<typeof setTimeout> | null = null
let autoNavigateRafId: number | null = null
let autoNavigateLastTs = 0
let autoNavigatePointIndex = 0
let autoNavigatePoints: NavigationRoutePoint[] = []
let unregisterNavigationContextRender: (() => void) | null = null

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
const hasUnsavedChanges = computed(() => {
  if (isPreviewMode.value) return false
  return projectMgmt.checkUnsavedChanges(project.value)
})
const saveStatusText = computed(() => {
  if (!project.value) return ''
  if (isPreviewMode.value) return ''
  if (projectMgmt.isSaving.value) return '正在保存...'
  if (hasUnsavedChanges.value) return '有未保存更改'
  if (lastSavedAt.value) return `已保存于 ${formatSaveTime(lastSavedAt.value)}`
  return '尚未保存'
})
const previewBackTarget = computed(() => {
  if (previewContext.value === 'merchant') return '/merchant/dashboard'
  if (previewContext.value === 'user') return '/mall'
  return '/admin/layout-version'
})
const previewBackText = computed(() =>
  previewContext.value === 'adminVersion' ? t('admin.backToVersionList') : t('common.back')
)
const showPreviewVersion = computed(() =>
  previewContext.value === 'adminVersion' && !!previewVersionNumber.value
)

/**
 * 统一同步建模器 OrbitControls 状态：
 * - 仅编辑模式 + pan 工具下启用
 * - 漫游模式下强制禁用，避免与 follow 相机并发控制同一 camera
 */
function syncBuilderOrbitControlsState() {
  if (!engine.value) return
  const shouldEnableOrbit = viewMode.value === 'edit' && drawing.currentTool.value === 'pan'
  engine.value.setOrbitControlsEnabled(shouldEnableOrbit)
}

function clearSaveToastTimer() {
  if (saveToastTimer) {
    clearTimeout(saveToastTimer)
    saveToastTimer = null
  }
}

function clearLoadingOverlayTimer() {
  if (!loadingOverlayTimer) return
  clearTimeout(loadingOverlayTimer)
  loadingOverlayTimer = null
}

function hideLoadingOverlay(delayMs = 300) {
  clearLoadingOverlayTimer()
  loadingOverlayTimer = setTimeout(() => {
    isLoading.value = false
    loadingOverlayTimer = null
  }, delayMs)
}

function showSaveToast(type: 'success' | 'error', message: string, durationMs: number) {
  clearSaveToastTimer()
  saveToastType.value = type
  saveToastMessage.value = message
  saveToastVisible.value = true
  saveToastTimer = setTimeout(() => {
    saveToastVisible.value = false
    saveToastTimer = null
  }, durationMs)
}

function formatSaveTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function setLastSavedAtFromProject(loadedProject: MallProject) {
  const parsed = new Date(loadedProject.updatedAt)
  lastSavedAt.value = Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

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
      cameraPosition: { x: 0, y: 100, z: 60 },
      orbitTarget: { x: 0, y: 6, z: 0 },
      minDistance: 10,
      maxDistance: 500,
      maxPolarAngle: Math.PI / 2.2,
      orbitEnabled: false,
      initialTheme: settingsStore.theme,
    })

    // 启动渲染循环
    engine.value.start()

    loadProgress.value = 60
    setupInteraction()
    loadProgress.value = 100

    // 根据当前上下文统一同步 OrbitControls 状态
    syncBuilderOrbitControlsState()

    hideLoadingOverlay()
  } catch (error) {
    clearLoadingOverlayTimer()
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
  if (drawing.currentTool.value === 'place-door') {
    doorPlacement.handleDoorMouseMove(e, selectedArea.value)
    return
  }
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
  if (drawing.currentTool.value === 'place-door') {
    doorPlacement.handleDoorClick(
      e,
      selectedArea.value,
      () => { renderProject(); saveHistory() },
    )
    return
  }
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
  if (isPreviewMode.value) return
  if (!selectedTemplate.value) return

  project.value = projectMgmt.createFromTemplate(selectedTemplate.value, newProjectName.value)
  connections.verticalConnections.value = []
  lastSavedAt.value = null
  floorMgmt.initFloor(project.value)
  router.replace({ params: { projectId: project.value.id } })
  
  showWizard.value = false
  renderProject()
  saveHistory()
}

function createCustomProject() {
  if (isPreviewMode.value) return
  project.value = projectMgmt.createCustomProject(newProjectName.value)
  connections.verticalConnections.value = []
  lastSavedAt.value = null
  floorMgmt.initFloor(project.value)
  router.replace({ params: { projectId: project.value.id } })
  
  showWizard.value = false
  renderProject()  // 渲染空项目（显示网格和基础场景）
  saveHistory()
}

function syncNavigationMetadataToProject() {
  if (!project.value) return
  const metadata = (project.value.metadata && typeof project.value.metadata === 'object')
    ? { ...project.value.metadata as Record<string, unknown> }
    : {}
  const navigation = (metadata.navigation && typeof metadata.navigation === 'object')
    ? { ...(metadata.navigation as Record<string, unknown>) }
    : {}

  navigation.verticalConnections = connections.verticalConnections.value.map(conn => ({
    id: conn.id,
    areaId: conn.areaId,
    type: conn.type,
    connectedFloors: [...conn.connectedFloors],
    createdAt: conn.createdAt,
  }))

  metadata.navigation = navigation
  project.value.metadata = metadata
}

function restoreNavigationMetadataFromProject() {
  if (!project.value) return
  const metadata = project.value.metadata as Record<string, unknown> | undefined
  const navigation = metadata?.navigation as Record<string, unknown> | undefined
  const rawConnections = Array.isArray(navigation?.verticalConnections)
    ? navigation?.verticalConnections
    : []

  const restored: VerticalConnection[] = rawConnections
    .map((item): VerticalConnection | null => {
      if (!item || typeof item !== 'object') return null
      const data = item as Record<string, unknown>
      if (typeof data.areaId !== 'string' || typeof data.type !== 'string') return null
      if (!Array.isArray(data.connectedFloors)) return null
      const connectedFloors = data.connectedFloors
        .filter((f): f is string => typeof f === 'string' && !!f)
      if (connectedFloors.length === 0) return null
      return {
        id: typeof data.id === 'string' && data.id ? data.id : crypto.randomUUID(),
        areaId: data.areaId,
        type: data.type as VerticalConnection['type'],
        connectedFloors,
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      }
    })
    .filter((v): v is VerticalConnection => !!v)

  connections.verticalConnections.value = restored
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

  renderNavigationRouteOverlay()
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

function disposeRouteObject(obj: THREE.Object3D) {
  if (obj instanceof THREE.Line) {
    obj.geometry.dispose()
    const material = obj.material as THREE.Material | THREE.Material[]
    if (Array.isArray(material)) material.forEach(m => m.dispose())
    else material.dispose()
  }
  if (obj instanceof THREE.Mesh) {
    obj.geometry.dispose()
    const material = obj.material as THREE.Material | THREE.Material[]
    if (Array.isArray(material)) material.forEach(m => m.dispose())
    else material.dispose()
  }
  obj.children.forEach(child => disposeRouteObject(child))
}

function clearNavigationRouteOverlay() {
  if (!scene.value) return
  const toRemove: THREE.Object3D[] = []
  scene.value.traverse(obj => {
    if (obj.userData?.isBuilderNavigationRoute) {
      toRemove.push(obj)
    }
  })
  toRemove.forEach(obj => {
    scene.value?.remove(obj)
    disposeRouteObject(obj)
  })
}

function renderNavigationRouteOverlay() {
  if (!scene.value) return
  clearNavigationRouteOverlay()

  const route = builderNavigationStore.activeRoute
  const target = builderNavigationStore.activeTarget
  if (!route || !target) return

  route.segments.forEach((segment, index) => {
    if (!segment.points || segment.points.length < 2) return
    const geometry = new THREE.BufferGeometry().setFromPoints(
      segment.points.map(p => new THREE.Vector3(p.x, p.y + 0.18, p.z))
    )
    const material = new THREE.LineBasicMaterial({
      color: index % 2 === 0 ? 0x22c55e : 0x0ea5e9,
      transparent: true,
      opacity: 0.92,
    })
    const line = new THREE.Line(geometry, material)
    line.name = `builder-navigation-route-${index}`
    line.userData.isBuilderNavigationRoute = true
    scene.value?.add(line)
  })

  route.transitions.forEach((transition, index) => {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    )
    marker.position.set(
      transition.position.x,
      transition.position.y + 0.3,
      transition.position.z,
    )
    marker.name = `builder-navigation-transition-${index}`
    marker.userData.isBuilderNavigationRoute = true
    scene.value?.add(marker)
  })

  const targetMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.2, 12),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  )
  targetMarker.position.set(target.position.x, target.position.y + 0.8, target.position.z)
  targetMarker.name = 'builder-navigation-target'
  targetMarker.userData.isBuilderNavigationRoute = true
  scene.value?.add(targetMarker)
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
  if (isPreviewMode.value) return
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
  if (isPreviewMode.value) return
  selectedMaterialId.value = preset.id
  if (preset.isInfrastructure) {
    drawing.setTool('pan')
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
  history.saveHistory(project.value)
}

function undo() {
  if (isPreviewMode.value) return
  const restored = history.undo()
  if (restored) {
    project.value = restored
    renderProject()
  }
}

function redo() {
  if (isPreviewMode.value) return
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
  if (isPreviewMode.value) return
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
  if (isPreviewMode.value) return
  floorMgmt.showAddFloorModal.value = true
}

function deleteFloor(floorId: string) {
  if (isPreviewMode.value) return
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
  if (isPreviewMode.value) return
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const imported = importProject(text)
    if (imported) {
      project.value = imported
      lastSavedAt.value = null
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

function flattenRoutePoints(route: NavigationRouteData): NavigationRoutePoint[] {
  const points: NavigationRoutePoint[] = []
  route.segments.forEach(segment => {
    segment.points.forEach(point => {
      const prev = points[points.length - 1]
      if (
        prev &&
        prev.floorId === point.floorId &&
        Math.abs(prev.x - point.x) < 0.001 &&
        Math.abs(prev.y - point.y) < 0.001 &&
        Math.abs(prev.z - point.z) < 0.001
      ) {
        return
      }
      points.push(point)
    })
  })
  return points
}

function getCurrentNavigationSource(): Pick<NavigationPlanRequest, 'sourceFloorId' | 'sourcePosition'> {
  const sourceFloorId = floorMgmt.currentFloorId.value || builderNavigationStore.currentFloorId || undefined

  const controller = roaming.getCharacterController()
  if (viewMode.value === 'orbit' && controller) {
    const pos = controller.getPosition()
    return {
      sourceFloorId,
      sourcePosition: { x: pos.x, y: pos.y, z: pos.z },
    }
  }

  if (camera.value) {
    return {
      sourceFloorId,
      sourcePosition: {
        x: camera.value.position.x,
        y: camera.value.position.y,
        z: camera.value.position.z,
      },
    }
  }

  return { sourceFloorId }
}

async function handleBuilderNavigationIntent(intent: BuilderNavigationIntent) {
  if (!project.value) {
    builderNavigationStore.setError('INVALID_STATE', '当前建模页尚未加载项目，无法执行导航')
    return
  }

  stopAutoNavigation()
  const source = getCurrentNavigationSource()

  try {
    const response = await planPublishedMallNavigation({
      targetType: intent.targetType,
      targetKeyword: intent.targetKeyword,
      sourceFloorId: source.sourceFloorId,
      sourcePosition: source.sourcePosition,
    })

    if (!response.success || !response.route || !response.target) {
      builderNavigationStore.setError(response.code, response.message || '路径规划失败')
      showSaveToast('error', response.message || '路径规划失败', 3500)
      return
    }

    builderNavigationStore.setActivePlan(response.route, response.target, response.warnings)
    builderNavigationStore.setExecutionMode('none')
    renderProject()
    showSaveToast('success', `已规划到 ${response.target.targetName}`, 2000)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '连接失败，请检查网络后重试'
    builderNavigationStore.setError('NETWORK_ERROR', message)
    showSaveToast('error', message, 3500)
  }
}

function stopAutoNavigation() {
  if (autoNavigateRafId !== null) {
    cancelAnimationFrame(autoNavigateRafId)
    autoNavigateRafId = null
  }
  autoNavigatePoints = []
  autoNavigatePointIndex = 0
  autoNavigateLastTs = 0
  builderNavigationStore.setAutoNavigating(false)
  if (builderNavigationStore.executionMode === 'auto') {
    builderNavigationStore.setExecutionMode('none')
  }
}

function startAutoNavigation() {
  if (!builderNavigationStore.activeRoute) return

  autoNavigatePoints = flattenRoutePoints(builderNavigationStore.activeRoute)
  if (autoNavigatePoints.length < 2) {
    showSaveToast('error', '当前路径点不足，无法自动导航', 3000)
    return
  }

  stopAutoNavigation()

  if (viewMode.value !== 'orbit') {
    enterRoamMode()
  }

  builderNavigationStore.setExecutionMode('auto')
  builderNavigationStore.setAutoNavigating(true)
  autoNavigatePointIndex = 0

  const tick = (timestamp: number) => {
    if (!builderNavigationStore.isAutoNavigating) return

    const controller = roaming.getCharacterController()
    if (!controller || !engine.value) {
      stopAutoNavigation()
      showSaveToast('error', '自动导航被中断，请重试', 3000)
      return
    }

    if (autoNavigateLastTs === 0) {
      autoNavigateLastTs = timestamp
    }
    const delta = Math.min(0.05, (timestamp - autoNavigateLastTs) / 1000)
    autoNavigateLastTs = timestamp

    const targetPoint = autoNavigatePoints[Math.min(autoNavigatePointIndex + 1, autoNavigatePoints.length - 1)]
    if (!targetPoint) {
      stopAutoNavigation()
      return
    }

    if (floorMgmt.currentFloorId.value !== targetPoint.floorId) {
      const currentPos = controller.getPosition()
      pendingRoamingSpawnPosition.value = new THREE.Vector3(currentPos.x, targetPoint.y, currentPos.z)
      pendingRoamingSpawnRotation.value = controller.getRotationY()
      floorMgmt.selectFloor(targetPoint.floorId)
      autoNavigateRafId = requestAnimationFrame(tick)
      return
    }

    const current = controller.getPosition()
    const target = new THREE.Vector3(targetPoint.x, targetPoint.y, targetPoint.z)
    const direction = target.clone().sub(current)
    const distance = direction.length()

    if (distance <= 0.15) {
      controller.setPosition(target.x, target.y, target.z)
      autoNavigatePointIndex += 1
      if (autoNavigatePointIndex >= autoNavigatePoints.length - 1) {
        stopAutoNavigation()
        showSaveToast('success', '自动导航已到达目标', 2200)
        return
      }
      autoNavigateRafId = requestAnimationFrame(tick)
      return
    }

    direction.normalize()
    const speed = controller.moveSpeed > 0 ? controller.moveSpeed : 2.5
    const step = Math.min(speed * delta, distance)
    const next = current.clone().add(direction.multiplyScalar(step))

    controller.setPosition(next.x, targetPoint.y, next.z)
    controller.setRotation(Math.atan2(targetPoint.x - current.x, targetPoint.z - current.z))
    engine.value.requestRender()
    autoNavigateRafId = requestAnimationFrame(tick)
  }

  autoNavigateRafId = requestAnimationFrame(tick)
}

function flyCameraToNavigationTarget() {
  const target = builderNavigationStore.activeTarget
  if (!target || !camera.value || !engine.value) return

  stopAutoNavigation()

  if (viewMode.value === 'orbit') {
    exitRoamMode()
  }

  builderNavigationStore.setExecutionMode('camera')
  const destination = new THREE.Vector3(target.position.x + 6, target.position.y + 8, target.position.z + 6)
  const lookAt = new THREE.Vector3(target.position.x, target.position.y, target.position.z)
  const startPos = camera.value.position.clone()
  const startTarget = controls.value?.target.clone() || new THREE.Vector3(0, 0, 0)
  const duration = 1000
  const startTime = performance.now()

  const animate = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)

    camera.value!.position.lerpVectors(startPos, destination, eased)
    if (controls.value) {
      controls.value.target.lerpVectors(startTarget, lookAt, eased)
      controls.value.update()
    } else {
      camera.value!.lookAt(lookAt)
    }

    engine.value?.requestRender()
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      builderNavigationStore.setExecutionMode('none')
    }
  }

  requestAnimationFrame(animate)
}

function clearNavigationPlan() {
  stopAutoNavigation()
  builderNavigationStore.clearActivePlan()
  builderNavigationStore.clearError()
  renderProject()
}

function goBack() {
  if (!isPreviewMode.value && projectMgmt.checkUnsavedChanges(project.value)) {
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
  if (viewMode.value === 'orbit') return
  camera.value.position.set(0, 100, 60)
  controls.value.target.set(0, 6, 0)
  controls.value.update()
}

function resetOutline() {
  if (isPreviewMode.value) return
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

function handlePreviewRoamToggle() {
  const willEnterRoam = viewMode.value === 'edit'
  toggleOrbitMode()

  if (willEnterRoam) {
    requestAnimationFrame(() => {
      engine.value?.requestPointerLock()
    })
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

  pendingRoamingSpawnPosition.value = null
  pendingRoamingSpawnRotation.value = null
  
  // 保存当前相机状态
  savedCameraState.value = {
    position: camera.value.position.clone(),
    target: controls.value.target.clone(),
  }
  
  viewMode.value = 'orbit'
  syncBuilderOrbitControlsState()
  
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
  const controller = new CharacterController(settingsStore.characterModel)
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

  stopAutoNavigation()
  
  viewMode.value = 'edit'
  
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
  
  // 恢复编辑态后统一同步 OrbitControls 状态
  syncBuilderOrbitControlsState()
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

  // 隐藏建模器网格和地板
  const grid = scene.value.getObjectByName('mall-builder-grid')
  const ground = scene.value.getObjectByName('mall-builder-ground')
  if (grid) grid.visible = false
  if (ground) ground.visible = false

  // 重新创建角色
  const floorY = getCurrentFloorYPosition()
  const controller = new CharacterController(settingsStore.characterModel)
  if (pendingRoamingSpawnPosition.value) {
    controller.setPosition(
      pendingRoamingSpawnPosition.value.x,
      pendingRoamingSpawnPosition.value.y,
      pendingRoamingSpawnPosition.value.z,
    )
    pendingRoamingSpawnPosition.value = null
  } else {
    const startPos = getAreaCenter(project.value.outline.vertices)
    controller.setPosition(startPos.x, floorY, startPos.z)
  }
  if (pendingRoamingSpawnRotation.value !== null) {
    controller.setRotation(pendingRoamingSpawnRotation.value)
    pendingRoamingSpawnRotation.value = null
  }
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

  // 更新跟随目标到新角色（复用 roaming 统一相机配置，避免配置分叉）
  roaming.rebindFollowTarget(controller.character)
}

// ============================================================================
// 键盘事件
// ============================================================================

function handleKeydown(e: KeyboardEvent) {
  if (
    builderNavigationStore.isAutoNavigating &&
    ['Escape', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)
  ) {
    stopAutoNavigation()
    showSaveToast('error', '已手动中断自动导航', 1800)
  }

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
    if (e.key === 'o' || e.key === 'O') handlePreviewRoamToggle()
    return
  }

  // 命令面板快捷键
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    showCommandPalette.value = !showCommandPalette.value
    return
  }

  // Cmd+J / Ctrl+J：切换 BottomDrawer（非漫游模式已在上方 return）
  if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
    e.preventDefault()
    showInlineInput.value = false
    showBottomDrawer.value = !showBottomDrawer.value
    return
  }

  // `/` 键：打开 InlineInput（非绘制模式、BottomDrawer 未打开时）
  if (e.key === '/' && !showBottomDrawer.value) {
    const drawTools = ['draw-rect', 'draw-poly', 'draw-outline']
    if (!drawTools.includes(drawing.currentTool.value)) {
      e.preventDefault()
      showInlineInput.value = true
      return
    }
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
    drawing.setTool('pan')
  }
  if (e.key === 'v' || e.key === 'V') drawing.setTool('pan')
  if (e.key === 'r' || e.key === 'R') drawing.setTool('draw-rect')
  if (e.key === 'p' || e.key === 'P') drawing.setTool('draw-poly')
  if (e.key === 'd' || e.key === 'D') drawing.setTool('place-door')
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
  if (isPreviewMode.value) return
  if (!project.value || projectMgmt.isSaving.value) return
  
  try {
    syncNavigationMetadataToProject()
    const saved = await projectMgmt.saveToServer(project.value)
    if (saved) {
      lastSavedAt.value = new Date()
      showSaveToast('success', '保存成功', 2000)
      return
    }

    showSaveToast('error', projectMgmt.saveMessage.value || '保存失败，请重试', 4000)
  } catch (error) {
    console.error('保存失败:', error)
    showSaveToast('error', '保存失败，请重试', 4000)
  }
}

async function handlePublish() {
  if (isPreviewMode.value) return
  if (!project.value || !projectMgmt.serverProjectId.value) {
    // 未保存过的项目需要先保存
    if (project.value) {
      syncNavigationMetadataToProject()
      const saved = await projectMgmt.saveToServer(project.value)
      if (!saved) {
        showSaveToast('error', projectMgmt.saveMessage.value || '保存失败，无法发布', 4000)
        return
      }
      lastSavedAt.value = new Date()
    } else {
      return
    }
  }
  
  try {
    const published = await projectMgmt.publishToServer(projectMgmt.serverProjectId.value!)
    if (published) {
      showSaveToast('success', '发布成功', 2000)
      return
    }
    showSaveToast('error', projectMgmt.saveMessage.value || '发布失败，请重试', 4000)
  } catch (error) {
    console.error('发布失败:', error)
    showSaveToast('error', '发布失败，请重试', 4000)
  }
}

function backFromPreview() {
  router.push(previewBackTarget.value)
}

async function loadMerchantPublishedPreview(): Promise<boolean> {
  try {
    const published = await getPublishedMallData()
    if (!published) {
      previewError.value = '暂无已发布商城，请联系管理员发布后再预览'
      return false
    }

    const loaded = toMallProject(published)
    project.value = loaded
    restoreNavigationMetadataFromProject()
    floorMgmt.initFloor(loaded)
    renderProject()
    return true
  } catch (err: any) {
    if (err?.code === 'A5006' || err?.status === 404) {
      previewError.value = '暂无已发布商城，请联系管理员发布后再预览'
    } else {
      previewError.value = '商城预览加载失败，请稍后重试'
    }
    return false
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(async () => {
  await initEngine()

  if (engine.value) {
    unregisterNavigationContextRender = engine.value.onRender(() => {
      const controller = roaming.getCharacterController()
      if (viewMode.value === 'orbit' && controller) {
        const pos = controller.getPosition()
        builderNavigationStore.updateContext({
          floorId: floorMgmt.currentFloorId.value ?? null,
          position: { x: pos.x, y: pos.y, z: pos.z },
        })
      } else if (camera.value) {
        builderNavigationStore.updateContext({
          floorId: floorMgmt.currentFloorId.value ?? null,
          position: {
            x: camera.value.position.x,
            y: camera.value.position.y,
            z: camera.value.position.z,
          },
        })
      }
    })
  }

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)

  // 商家/用户只读预览模式（加载已发布版本）
  if (isPublishedPreviewRoute) {
    isPreviewMode.value = true
    previewContext.value = isMerchantPreviewRoute ? 'merchant' : 'user'
    showWizard.value = false
    await loadMerchantPublishedPreview()
    return
  }

  // 检测预览模式（版本快照）
  const versionId = route.query.versionId as string | undefined
  const versionNumber = route.query.versionNumber as string | undefined
  if (versionId) {
    previewContext.value = 'adminVersion'
    const loaded = await projectMgmt.loadFromVersionSnapshot(versionId)
    if (loaded) {
      project.value = loaded
      restoreNavigationMetadataFromProject()
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
      restoreNavigationMetadataFromProject()
      setLastSavedAtFromProject(loaded)
      floorMgmt.initFloor(loaded)
      showWizard.value = false
      renderProject()
      saveHistory()
      projectMgmt.markSaved(loaded)
    } else {
      // 项目不存在或加载失败，清除 URL 中的 projectId 并显示向导
      console.warn('项目加载失败，显示创建向导')
      router.replace({ name: 'Builder' })
      showWizard.value = true
    }
  }
})

onUnmounted(() => {
  clearSaveToastTimer()
  clearLoadingOverlayTimer()
  stopAutoNavigation()
  clearNavigationRouteOverlay()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  if (unregisterNavigationContextRender) {
    unregisterNavigationContextRender()
    unregisterNavigationContextRender = null
  }
  roaming.dispose()
  
  if (engine.value) {
    engine.value.dispose()
    engine.value = null
  }
  
  disposeBuilderResources()
})

watch(() => floorMgmt.currentFloorId.value, () => {
  builderNavigationStore.updateContext({ floorId: floorMgmt.currentFloorId.value ?? null })
  if (viewMode.value === 'orbit') {
    // 漫游模式下切换楼层：需要重建角色和漫游环境
    handleRoamingFloorSwitch()
  } else {
    renderProject()
  }
})

watch(
  () => connections.verticalConnections.value,
  () => {
    syncNavigationMetadataToProject()
    renderProject()
  },
  { deep: true }
)

watch(
  () => builderNavigationStore.pendingIntent,
  async intent => {
    if (!intent) return
    await handleBuilderNavigationIntent(intent)
    builderNavigationStore.clearPendingIntent()
  },
  { deep: false }
)

watch(
  [() => viewMode.value, () => drawing.currentTool.value],
  () => {
    syncBuilderOrbitControlsState()
  },
  { immediate: true }
)

// 监听主题变化，同步更新 3D 场景配色
watch(() => settingsStore.theme, (newTheme) => {
  if (engine.value) {
    engine.value.updateThemeColors(newTheme)
  }
})

// 监听门悬停状态，更新 3D 门模型高亮
watch(() => doorPlacement.hoveredDoorId.value, (newId, oldId) => {
  if (!scene.value) return
  if (newId === oldId) return
  rendering.setDoorHighlight(scene.value, newId)
})

// ============================================================================
// 子组件事件处理
// ============================================================================

/**
 * 处理向导模板选择更新
 */
function handleTemplateUpdate(template: MallTemplate | null) {
  if (isPreviewMode.value) return
  selectedTemplate.value = template
}

/**
 * 处理向导项目名称更新
 */
function handleProjectNameUpdate(name: string) {
  if (isPreviewMode.value) return
  newProjectName.value = name
}

/**
 * 处理工具选择
 */
function handleSelectTool(tool: 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline' | 'place-door') {
  if (isPreviewMode.value) return
  drawing.setTool(tool)
  // 切换工具时清除门悬停高亮
  if (tool !== 'place-door') {
    doorPlacement.hoveredDoorId.value = null
    if (scene.value) rendering.setDoorHighlight(scene.value, null)
  }
}

/**
 * 处理 AI 生成的项目
 */
function handleCreateFromAI(aiProject: MallProject) {
  if (isPreviewMode.value) return
  project.value = aiProject
  connections.verticalConnections.value = []
  lastSavedAt.value = null
  floorMgmt.initFloor(aiProject)
  router.replace({ params: { projectId: aiProject.id } })

  showWizard.value = false
  renderProject()
  saveHistory()
}

/**
 * 从向导加载已保存的项目
 */
async function handleLoadSavedProject(projectId: string) {
  if (isPreviewMode.value) return
  const loaded = await projectMgmt.loadFromServer(projectId)
  if (loaded) {
    project.value = loaded
    restoreNavigationMetadataFromProject()
    setLastSavedAtFromProject(loaded)
    floorMgmt.initFloor(loaded)
    showWizard.value = false
    renderProject()
    saveHistory()
    projectMgmt.markSaved(loaded)
  }
}

/**
 * 处理区域属性更新
 */
function handleAreaUpdate(updatedArea: AreaDefinition) {
  if (isPreviewMode.value) return
  if (!floorMgmt.currentFloor.value || !selectedArea.value) return
  
  const index = floorMgmt.currentFloor.value.areas.findIndex(a => a.id === selectedArea.value!.id)
  if (index !== -1) {
    floorMgmt.currentFloor.value.areas[index] = updatedArea
    renderProject()
    saveHistory()
  }
}

/**
 * 处理删除门
 */
function handleDeleteDoor(doorId: string) {
  if (isPreviewMode.value) return
  doorPlacement.removeDoor(
    selectedArea.value,
    doorId,
    () => { renderProject(); saveHistory() },
  )
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
      v-if="!isPreviewMode"
      :visible="showWizard && !isLoading"
      :templates="templates"
      :selectedTemplate="selectedTemplate"
      :projectName="newProjectName"
      @update:selectedTemplate="handleTemplateUpdate"
      @update:projectName="handleProjectNameUpdate"
      @create="createNewProject"
      @createCustom="createCustomProject"
      @createFromAI="handleCreateFromAI"
      @loadProject="handleLoadSavedProject"
      @cancel="goBack"
    />

    <!-- 主界面 -->
    <template v-if="!showWizard && !isLoading">
      <!-- 预览模式工具栏 -->
      <div v-if="isPreviewMode" class="preview-toolbar">
        <button class="btn-back" @click="backFromPreview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {{ previewBackText }}
        </button>
        <div class="preview-info">
          <span class="preview-badge">{{ t('admin.previewMode') }}</span>
          <span v-if="showPreviewVersion" class="preview-version">{{ previewVersionNumber }}</span>
        </div>
        <div class="preview-actions">
          <button class="btn-secondary" @click="handlePreviewRoamToggle">
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
          <button class="btn-back" @click="backFromPreview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {{ previewBackText }}
          </button>
        </div>
      </div>

      <!-- 顶部工具栏 (使用子组件) -->
      <BuilderToolbar
        v-else-if="!isPreviewMode"
        :projectName="project?.name || t('admin.mallLayout')"
        :currentTool="drawing.currentTool.value"
        :viewMode="viewMode"
        :canUndo="history.canUndo.value"
        :canRedo="history.canRedo.value"
        :isSaving="projectMgmt.isSaving.value"
        :saveStatusText="saveStatusText"
        :hasUnsavedChanges="hasUnsavedChanges"
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
      <Transition name="save-toast-fade">
        <div
          v-if="saveToastVisible"
          :class="['save-toast', `type-${saveToastType}`]"
          role="status"
          aria-live="polite"
        >
          {{ saveToastMessage }}
        </div>
      </Transition>

      <div
        v-if="builderNavigationStore.activeRoute && builderNavigationStore.activeTarget && !isPreviewMode"
        class="builder-navigation-panel"
      >
        <div class="nav-panel-header">
          <span class="nav-title">路径规划</span>
          <button class="nav-close-btn" @click="clearNavigationPlan">关闭</button>
        </div>
        <p class="nav-target">
          目标：{{ builderNavigationStore.activeTarget.targetName }}
          <span v-if="builderNavigationStore.activeTarget.floorName">
            （{{ builderNavigationStore.activeTarget.floorName }}）
          </span>
        </p>
        <p class="nav-meta">
          距离 {{ builderNavigationStore.activeRoute.distance }}m · 预计 {{ builderNavigationStore.activeRoute.eta }} 分钟
        </p>
        <ul class="nav-steps">
          <li
            v-for="(step, index) in builderNavigationStore.activeRoute.steps"
            :key="`nav-step-${index}`"
          >
            {{ step }}
          </li>
        </ul>
        <div class="nav-actions">
          <button
            class="btn-primary"
            :disabled="builderNavigationStore.isAutoNavigating"
            @click="startAutoNavigation"
          >
            {{ builderNavigationStore.isAutoNavigating ? '自动导航中...' : '开始自动导航' }}
          </button>
          <button class="btn-secondary" @click="flyCameraToNavigationTarget">
            相机飞到目标
          </button>
          <button class="btn-secondary danger" @click="clearNavigationPlan">
            取消
          </button>
        </div>
        <p
          v-if="builderNavigationStore.errorState"
          class="nav-error"
        >
          {{ builderNavigationStore.errorState.message }}
        </p>
      </div>

      <!-- 左侧楼层面板 (使用子组件) -->
      <FloorPanel
        v-if="showFloorPanel && (viewMode === 'edit' || isPreviewMode) && !(isPreviewMode && viewMode === 'orbit')"
        :floors="project?.floors || []"
        :currentFloorId="floorMgmt.currentFloorId.value"
        :doors="selectedArea?.doors ?? []"
        :hoveredDoorId="doorPlacement.hoveredDoorId.value"
        :readonly="isPreviewMode"
        v-model:collapsed="leftPanelCollapsed"
        @select="selectFloor"
        @add="openAddFloorModal"
        @delete="deleteFloor"
        @deleteDoor="handleDeleteDoor"
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
        v-model:collapsed="rightPanelCollapsed"
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

      <!-- 命令面板 -->
      <CommandPalette
        v-model:visible="showCommandPalette"
        @close="showCommandPalette = false"
      />

      <!-- AI 内联输入条 -->
      <BuilderInlineInput
        v-model:visible="showInlineInput"
        @switch-to-drawer="showInlineInput = false; showBottomDrawer = true"
      />

      <!-- AI 底部触发条 -->
      <div
        v-if="!showBottomDrawer && !showInlineInput && viewMode === 'edit' && !isPreviewMode"
        class="ai-trigger-bar"
        @click="showBottomDrawer = true"
      >
        <svg class="ai-trigger-icon" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2a6 6 0 0 0-4.47 10.02L4 16l3.98-1.53A6 6 0 1 0 10 2Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="ai-trigger-text">{{ t('builder.aiTrigger.label') }}</span>
        <kbd class="ai-trigger-kbd">Ctrl+J</kbd>
      </div>

      <!-- AI 底部抽屉 -->
      <BuilderBottomDrawer
        v-model:visible="showBottomDrawer"
      />

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
// Save Toast
// ============================================================================
.save-toast {
  position: absolute;
  top: 68px;
  right: 18px;
  z-index: 120;
  padding: 9px 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);

  &.type-success {
    background: rgba(22, 163, 74, 0.14);
    border-color: rgba(22, 163, 74, 0.32);
    color: #16a34a;
  }

  &.type-error {
    background: rgba(220, 38, 38, 0.14);
    border-color: rgba(220, 38, 38, 0.32);
    color: #dc2626;
  }
}

.save-toast-fade-enter-active,
.save-toast-fade-leave-active {
  transition: all 0.2s ease;
}

.save-toast-fade-enter-from,
.save-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.builder-navigation-panel {
  position: absolute;
  top: 68px;
  left: 14px;
  z-index: 130;
  width: 360px;
  max-width: calc(100vw - 32px);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(var(--bg-secondary-rgb), 0.94);
  backdrop-filter: blur(12px);
}

.nav-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.nav-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.nav-close-btn {
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
}

.nav-target,
.nav-meta,
.nav-error {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.nav-steps {
  margin: 0 0 10px;
  padding-left: 16px;
  max-height: 160px;
  overflow: auto;
  color: var(--text-secondary);
  font-size: 12px;
}

.nav-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nav-actions .btn-primary,
.nav-actions .btn-secondary {
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.nav-actions .btn-primary {
  border: none;
  color: #fff;
  background: #16a34a;
}

.nav-actions .btn-secondary {
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  background: transparent;
}

.nav-actions .btn-secondary.danger {
  color: #ef4444;
}

@media (max-width: 1200px) {
  .save-toast {
    right: 12px;
    top: 62px;
    font-size: 12px;
  }
}

// ============================================================================
// AI Trigger Bar
// ============================================================================
.ai-trigger-bar {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(var(--bg-secondary-rgb), 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--accent-primary-rgb), 0.15);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(var(--bg-secondary-rgb), 0.95);
    color: var(--text-secondary);
    border-color: rgba(var(--accent-primary-rgb), 0.3);
  }
}

.ai-trigger-icon {
  width: 14px;
  height: 14px;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.ai-trigger-text {
  white-space: nowrap;
}

.ai-trigger-kbd {
  display: inline-block;
  padding: 1px 5px;
  background: rgba(var(--accent-primary-rgb), 0.1);
  border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent-primary);
  line-height: 1.4;
}

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
  background: rgb(var(--bg-primary-rgb));
  border-bottom: none;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(var(--bg-secondary-rgb), 0.7);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(var(--bg-secondary-rgb), 0.95);
    color: var(--text-primary);
    border-color: var(--border-muted);
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
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 500;
}

.preview-version {
  color: var(--text-secondary);
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.preview-actions {
  display: flex;
  gap: 8px;

  .btn-secondary {
    padding: 8px 14px;
    background: rgba(var(--bg-secondary-rgb), 0.7);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: rgba(var(--bg-secondary-rgb), 0.95);
      color: var(--text-primary);
      border-color: var(--border-muted);
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

// ============================================================================
// Modal (theme-aware)
// ============================================================================
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--black-rgb), 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  width: 400px;
  max-width: 90vw;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.modal-body {
  padding: 20px;

  p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
}

.modal-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

.btn-danger {
  padding: 8px 16px;
  background: var(--error);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--error-hover);
  }
}

.modal-footer .btn-secondary {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-muted);
  }
}

.modal-footer .btn-primary {
  padding: 8px 16px;
  background: var(--accent-primary);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--accent-hover);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

// ============================================================================
// Help Modal
// ============================================================================
.help-modal {
  width: 560px;
}

.help-section {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent-primary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
    font-size: 13px;
    color: var(--text-secondary);
  }

  kbd {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(var(--accent-primary-rgb), 0.12);
    border: 1px solid rgba(var(--accent-primary-rgb), 0.25);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--accent-primary);
  }
}

// ============================================================================
// Floor Connection Modal
// ============================================================================
.floor-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.floor-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-muted);
  }

  input[type="checkbox"] {
    accent-color: var(--accent-primary);
  }
}

.current-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: rgba(var(--accent-primary-rgb), 0.12);
  border-radius: 4px;
  font-size: 11px;
  color: var(--accent-primary);
}
</style>
