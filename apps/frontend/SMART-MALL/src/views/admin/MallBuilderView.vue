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
  getPublishedMallNavigationDynamicVersion,
  listNavigationDynamicEvents,
  createNavigationDynamicEvent,
  deleteNavigationDynamicEvent,
  type NavigationDynamicEventDTO,
  type CreateNavigationDynamicEventRequest,
  type NavigationPlanRequest,
  type NavigationRouteData,
  type NavigationRoutePoint,
  type NavigationRouteTransition
} from '@/api/mall-manage.api'
import { toMallProject } from '@/api/mall-builder.api'
import {
  useBuilderNavigationStore,
  type BuilderNavigationIntent
} from '@/stores/builder-navigation.store'

// 导入 builder 模块
import {
  type MallProject,
  type AreaDefinition,
  type MallTemplate,
  type MaterialPreset,
  type MaterialCategory,
  type VerticalConnection,
  type VerticalPassageProfile,
  getAllTemplates,
  calculateFloorYPosition,
  CharacterController,
  disposeBuilderResources,
  getAllMaterialPresets,
  getAllCategories,
  normalizeVerticalPassageProfile,
  createConnectionIndicator,
  clearConnectionIndicators,
  getAreaCenter,
  isPointInside,
  isPointOnEdge,
  doPolygonsOverlap,
  resolveVerticalGroundHeight,
  resolvePassageAnchors,
  buildTraversalPath3D,
  findBestVerticalConnectionAtPosition,
  exportProject,
  importProject
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
  type LegendItem
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
  useDoorPlacement
} from './mall-builder/composables'

import { areaTypes } from './mall-builder/config/areaTypes'
import {
  advanceTraversalProgress,
  computeTraversalDistance,
  interpolateTraversalPosition
} from './mall-builder/vertical-traversal'

// ============================================================================
// Composables 初始化
// ============================================================================

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()
const builderNavigationStore = useBuilderNavigationStore()
const isMerchantPreviewRoute =
  route.name === 'MerchantMallPreview' || route.path === '/merchant/mall-preview'
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
  yawConstraintCenterOffsetDeg: 180
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
const selectedArea = computed(
  () => floorMgmt.currentFloor.value?.areas.find(a => a.id === selectedAreaId.value) || null
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
const expandedCategories = ref<MaterialCategory[]>([
  'circulation',
  'service',
  'common',
  'infrastructure'
])
const materialPresets = computed(() => getAllMaterialPresets())
const categories = computed(() => getAllCategories())

// 网格设置
const gridSize = ref(1)
const snapEnabled = ref(true)

// 重叠检测
const overlappingAreas = ref<string[]>([])

// 弹窗状态
const showHelpPanel = ref(false)
const showLeaveConfirm = ref(false)
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
let autoNavigatePendingTraversal: Promise<boolean> | null = null
let autoNavigateTransitionCursor = 0
let autoNavigateControllerWaitUntil = 0
let autoNavigateInterruptGuardUntil = 0
let unregisterNavigationContextRender: (() => void) | null = null
let roamingFloorTransitionCooldownUntil = 0
let verticalTraversalRafId: number | null = null
let verticalTraversalLastTs = 0
let verticalTraversalResolve: ((success: boolean) => void) | null = null
const ROAMING_FLOOR_TRANSITION_COOLDOWN_MS = 800
const AUTO_NAV_CONTROLLER_WAIT_MS = 5000
const AUTO_NAV_INTERRUPT_GUARD_MS = 900
const DEFAULT_PASSAGE_LANE_PADDING = 0.12
const PORTAL_PREVIEW_TRIGGER_DISTANCE = 4.5
const VERTICAL_TRAVERSAL_SPEED_BY_TYPE: Record<VerticalConnection['type'], number> = {
  stairs: 1.8,
  escalator: 2.2,
  elevator: 2.8
}
const lastHandledIntentId = ref<string | null>(null)
const pendingConnectionAscendAngleDeg = ref(0)
const pendingConnectionLanePadding = ref(DEFAULT_PASSAGE_LANE_PADDING)
const activeVerticalTraversal = ref<{
  connectionId: string
  type: VerticalConnection['type']
  fromFloorId: string
  toFloorId: string
  start3D: { x: number; y: number; z: number }
  end3D: { x: number; y: number; z: number }
  progress: number
  speed: number
  source: 'manual' | 'auto'
} | null>(null)
const ROAMING_SECONDARY_MASK_RADIUS = 12
const portalPreviewState = ref<{
  activeConnectionId: string
  targetFloorId: string
  center2D: { x: number; y: number }
  radius: number
} | null>(null)
const NAV_REPLAN_COOLDOWN_MS = 8000
const NAV_OFF_ROUTE_DISTANCE_THRESHOLD = 1.2
const NAV_OFF_ROUTE_DURATION_MS = 1500
const NAV_BLOCKED_STEP_THRESHOLD = 0.15
const NAV_BLOCKED_DURATION_MS = 1500
const NAV_DYNAMIC_VERSION_POLL_MS = 5000
let navDynamicVersionPollTimer: ReturnType<typeof setInterval> | null = null
let navigationReplanInFlight = false
let navigationReplanLastAt = 0
let navigationReplanFailureCount = 0
let offRouteAccumMs = 0
let blockedAccumMs = 0
let replanLastPosition: THREE.Vector3 | null = null

const showDynamicEventPanel = ref(false)
const dynamicEvents = ref<NavigationDynamicEventDTO[]>([])
const dynamicEventsLoading = ref(false)
const dynamicEventSubmitting = ref(false)
const dynamicEventForm = ref<{
  eventType: 'BLOCK' | 'CONGESTION'
  scopeType: 'AREA' | 'CONNECTION'
  scopeId: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  startsAt: string
  endsAt: string
  reason: string
}>({
  eventType: 'BLOCK',
  scopeType: 'CONNECTION',
  scopeId: '',
  severity: 'MEDIUM',
  startsAt: '',
  endsAt: '',
  reason: ''
})

// 模板列表
const templates = computed(() => getAllTemplates())

// 图例项
const legendItems = computed<LegendItem[]>(() =>
  areaTypes.map(type => ({
    color: type.color,
    label: type.label
  }))
)

// ============================================================================
// 计算属性
// ============================================================================

const scene = computed(() => engine.value?.getScene() || null)
const camera = computed(() => engine.value?.getCamera() || null)
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
const showPreviewVersion = computed(
  () => previewContext.value === 'adminVersion' && !!previewVersionNumber.value
)
const hasNavigationPlan = computed(
  () => !!builderNavigationStore.activeRoute && !!builderNavigationStore.activeTarget
)
const isAiInputEnabled = computed(() => !isPreviewMode.value || isUserPreviewRoute)
const showPassageProfileConfig = computed(() => {
  const areaType = connections.pendingConnectionArea.value?.type
  return areaType === 'stairs' || areaType === 'escalator'
})
const dynamicEventScopeOptions = computed(() => {
  if (!project.value) return []
  if (dynamicEventForm.value.scopeType === 'CONNECTION') {
    return connections.verticalConnections.value
      .filter(item => item.type === 'stairs' || item.type === 'escalator')
      .map(item => ({
        id: item.id,
        label: `${item.type === 'stairs' ? '楼梯' : '扶梯'} · ${item.connectedFloors.join(' ↔ ')}`
      }))
  }
  return project.value.floors.flatMap(floor =>
    floor.areas.map(area => ({
      id: area.id,
      label: `${floor.name} · ${area.name}`
    }))
  )
})
const passageDirectionOptions = [
  { label: '东', angleDeg: 0 },
  { label: '东北', angleDeg: 45 },
  { label: '北', angleDeg: 90 },
  { label: '西北', angleDeg: 135 },
  { label: '西', angleDeg: 180 },
  { label: '西南', angleDeg: 225 },
  { label: '南', angleDeg: 270 },
  { label: '东南', angleDeg: 315 }
]

function normalizeAngleDeg(value: number): number {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function clampLanePadding(value: number): number {
  return Math.max(0, Math.min(0.45, value))
}

function toPlanarPoint(point: { x: number; z: number }): { x: number; y: number } {
  return { x: point.x, y: -point.z }
}

function distancePointToSegment2D(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number }
): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lenSq = dx * dx + dy * dy
  if (lenSq <= 1e-6) {
    return Math.hypot(point.x - start.x, point.y - start.y)
  }
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq))
  const projX = start.x + dx * t
  const projY = start.y + dy * t
  return Math.hypot(point.x - projX, point.y - projY)
}

function distancePointToPolygon2D(
  point: { x: number; y: number },
  polygon: { vertices: Array<{ x: number; y: number }>; isClosed: boolean }
): number {
  if (!polygon.vertices || polygon.vertices.length < 3) {
    return Number.POSITIVE_INFINITY
  }
  if (isPointInside(point, polygon) || isPointOnEdge(point, polygon)) {
    return 0
  }

  let best = Number.POSITIVE_INFINITY
  const vertices = polygon.vertices
  for (let i = 0; i < vertices.length; i += 1) {
    const start = vertices[i]!
    const end = vertices[(i + 1) % vertices.length]!
    const d = distancePointToSegment2D(point, start, end)
    if (d < best) best = d
  }
  return best
}

function resolvePortalPreviewTargetFloorId(
  connection: VerticalConnection,
  currentFloorId: string,
  movementIntent: 'up' | 'down' | 'none',
  floorLevelById: Map<string, number>
): string | null {
  const sorted = connection.connectedFloors
    .map(floorId => ({ floorId, level: floorLevelById.get(floorId) ?? 0 }))
    .sort((a, b) => a.level - b.level)

  const currentIndex = sorted.findIndex(item => item.floorId === currentFloorId)
  if (currentIndex < 0) return null
  if (movementIntent === 'up') return sorted[currentIndex + 1]?.floorId ?? null
  if (movementIntent === 'down') return sorted[currentIndex - 1]?.floorId ?? null
  return sorted[currentIndex + 1]?.floorId ?? sorted[currentIndex - 1]?.floorId ?? null
}

function resolvePortalPreviewByProximity(params: {
  currentFloorId: string
  position2D: { x: number; y: number }
  movementIntent: 'up' | 'down' | 'none'
  areasById: Map<string, AreaDefinition>
  floorLevelById: Map<string, number>
}): {
  activeConnectionId: string
  targetFloorId: string
  center2D: { x: number; y: number }
  radius: number
} | null {
  const { currentFloorId, position2D, movementIntent, areasById, floorLevelById } = params
  const slopeConnections = connections.verticalConnections.value.filter(
    item =>
      (item.type === 'stairs' || item.type === 'escalator') &&
      item.connectedFloors.includes(currentFloorId)
  )
  if (slopeConnections.length === 0) return null

  const matched = findBestVerticalConnectionAtPosition({
    connections: slopeConnections,
    currentFloorId,
    position2D,
    areasById
  })
  if (!matched) return null

  const distanceToArea = distancePointToPolygon2D(position2D, matched.area.shape)
  if (distanceToArea > PORTAL_PREVIEW_TRIGGER_DISTANCE) return null

  const targetFloorId = resolvePortalPreviewTargetFloorId(
    matched.connection,
    currentFloorId,
    movementIntent,
    floorLevelById
  )
  if (!targetFloorId || targetFloorId === currentFloorId) return null

  const center = getAreaCenter(matched.area.shape.vertices)
  return {
    activeConnectionId: matched.connection.id,
    targetFloorId,
    center2D: { x: center.x, y: -center.z },
    radius: ROAMING_SECONDARY_MASK_RADIUS
  }
}

function normalizePendingPassageProfileInputs() {
  pendingConnectionAscendAngleDeg.value = normalizeAngleDeg(
    Number.isFinite(pendingConnectionAscendAngleDeg.value)
      ? pendingConnectionAscendAngleDeg.value
      : 0
  )
  pendingConnectionLanePadding.value = clampLanePadding(
    Number.isFinite(pendingConnectionLanePadding.value)
      ? pendingConnectionLanePadding.value
      : DEFAULT_PASSAGE_LANE_PADDING
  )
}

function buildAreaByIdMap() {
  const map = new Map<string, AreaDefinition>()
  if (!project.value) return map
  project.value.floors.forEach(floor => {
    floor.areas.forEach(area => {
      map.set(area.id, area)
    })
  })
  return map
}

function getFloorLevelById(floorId: string): number | null {
  if (!project.value) return null
  const floor = project.value.floors.find(item => item.id === floorId)
  if (!floor) return null
  return floor.level
}

function getFloorLevelMap() {
  const map = new Map<string, number>()
  if (!project.value) return map
  project.value.floors.forEach(floor => {
    map.set(floor.id, floor.level)
  })
  return map
}

function getFloorYMap() {
  const map = new Map<string, number>()
  if (!project.value) return map
  const floorHeights = project.value.floors.map(floor => floor.height)
  project.value.floors.forEach((floor, index) => {
    map.set(floor.id, calculateFloorYPosition(index, floorHeights))
  })
  return map
}

function getControllerMovementIntent(controller: CharacterController): 'up' | 'down' | 'none' {
  if (controller.moveForward && !controller.moveBackward) return 'up'
  if (controller.moveBackward && !controller.moveForward) return 'down'
  return 'none'
}

function registerRoamingGroundResolver(controller: CharacterController | null) {
  if (!controller) return
  const areasById = buildAreaByIdMap()
  const floorLevelById = getFloorLevelMap()
  const floorYById = getFloorYMap()
  controller.setGroundResolver((x, z) => {
    if (!project.value || viewMode.value !== 'orbit') {
      return controller.currentFloorY
    }
    const currentFloorId = floorMgmt.currentFloorId.value
    if (!currentFloorId) {
      return controller.currentFloorY
    }

    const movementIntent = getControllerMovementIntent(controller)
    const result = resolveVerticalGroundHeight({
      currentFloorId,
      position2D: { x, y: -z },
      movementIntent,
      connections: connections.verticalConnections.value,
      areasById,
      floorLevelById,
      floorYById
    })

    if (!result) {
      portalPreviewState.value = resolvePortalPreviewByProximity({
        currentFloorId,
        position2D: { x, y: -z },
        movementIntent,
        areasById,
        floorLevelById
      })
      return getFloorYPositionById(currentFloorId) ?? controller.currentFloorY
    }

    const connectionArea = areasById.get(result.areaId)
    if (connectionArea) {
      const center = getAreaCenter(connectionArea.shape.vertices)
      portalPreviewState.value = {
        activeConnectionId: result.connectionId,
        targetFloorId: result.targetFloorId,
        center2D: { x: center.x, y: -center.z },
        radius: ROAMING_SECONDARY_MASK_RADIUS
      }
    }

    if (
      movementIntent !== 'none' &&
      result.shouldSwitchFloor &&
      !activeVerticalTraversal.value &&
      performance.now() >= roamingFloorTransitionCooldownUntil &&
      floorMgmt.currentFloorId.value === result.fromFloorId
    ) {
      pendingRoamingSpawnPosition.value = new THREE.Vector3(x, result.y, z)
      pendingRoamingSpawnRotation.value = controller.getRotationY()
      roamingFloorTransitionCooldownUntil = performance.now() + ROAMING_FLOOR_TRANSITION_COOLDOWN_MS
      floorMgmt.selectFloor(result.targetFloorId)
    }

    return result.y
  })
}

function estimateAreaAscendAngleDeg(area: AreaDefinition): number {
  const vertices = area.shape.vertices
  if (!vertices || vertices.length < 2) return 0

  let longest = -1
  let bestFrom = vertices[0]!
  let bestTo = vertices[1]!
  for (let i = 0; i < vertices.length; i++) {
    const from = vertices[i]!
    const to = vertices[(i + 1) % vertices.length]!
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    if (length > longest) {
      longest = length
      bestFrom = from
      bestTo = to
    }
  }
  return normalizeAngleDeg(
    (Math.atan2(bestTo.y - bestFrom.y, bestTo.x - bestFrom.x) * 180) / Math.PI
  )
}

function initPendingPassageProfile(area: AreaDefinition | null) {
  if (!area) {
    pendingConnectionAscendAngleDeg.value = 0
    pendingConnectionLanePadding.value = DEFAULT_PASSAGE_LANE_PADDING
    return
  }

  const existing = connections.verticalConnections.value.find(item => item.areaId === area.id)
  const profile = normalizeVerticalPassageProfile(
    existing?.passageProfile,
    estimateAreaAscendAngleDeg(area)
  )
  pendingConnectionAscendAngleDeg.value = profile.ascendAngleDeg
  pendingConnectionLanePadding.value = profile.lanePadding
}

function getPendingPassageProfile(): VerticalPassageProfile | undefined {
  if (!showPassageProfileConfig.value) return undefined
  normalizePendingPassageProfileInputs()
  return normalizeVerticalPassageProfile({
    ascendAngleDeg: pendingConnectionAscendAngleDeg.value,
    lanePadding: pendingConnectionLanePadding.value
  })
}

function applyLanePadding(
  anchor: { x: number; y: number },
  center: { x: number; y: number },
  lanePadding: number
) {
  return {
    x: anchor.x + (center.x - anchor.x) * lanePadding,
    y: anchor.y + (center.y - anchor.y) * lanePadding
  }
}

/**
 * 统一同步建模器 OrbitControls 状态：
 * - 编辑模式下：pan 工具、以及绘制类工具启用 Orbit
 * - 绘制类工具下改为「右键旋转 + 滚轮缩放」，避免与左键绘制冲突
 * - 漫游模式下强制禁用，避免与 follow 相机并发控制同一 camera
 */
function syncBuilderOrbitControlsState() {
  if (!engine.value) return
  const tool = drawing.currentTool.value
  const isDrawTool = tool === 'draw-rect' || tool === 'draw-poly' || tool === 'draw-outline'
  const shouldEnableOrbit = viewMode.value === 'edit' && (tool === 'pan' || isDrawTool)
  engine.value.setOrbitControlsEnabled(shouldEnableOrbit)

  const orbitControls = engine.value.getOrbitControls()
  if (!orbitControls) return

  if (isDrawTool) {
    orbitControls.mouseButtons = {
      LEFT: null as unknown as THREE.MOUSE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    }
    return
  }

  orbitControls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: null as unknown as THREE.MOUSE
  }
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
      initialTheme: settingsStore.theme
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
    doorPlacement.handleDoorClick(e, selectedArea.value, () => {
      renderProject()
      saveHistory()
    })
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
    initPendingPassageProfile(area)
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
  const pickedObject = engine.value.pickObject(mouseEvent, obj => obj.userData.isArea === true)

  if (!pickedObject) return null

  let obj: THREE.Object3D | null = pickedObject
  while (obj) {
    if (obj.userData.areaId) {
      return {
        object: obj,
        distance: 0,
        point: new THREE.Vector3(),
        face: null
      } as THREE.Intersection
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
  renderProject() // 渲染空项目（显示网格和基础场景）
  saveHistory()
}

function selectPassageDirection(angleDeg: number) {
  pendingConnectionAscendAngleDeg.value = normalizeAngleDeg(angleDeg)
}

function confirmFloorConnectionWithProfile() {
  const profile = getPendingPassageProfile()
  const created = connections.confirmFloorConnection(profile)
  if (created && profile) {
    pendingConnectionAscendAngleDeg.value = profile.ascendAngleDeg
    pendingConnectionLanePadding.value = profile.lanePadding
  }
}

function syncNavigationMetadataToProject() {
  if (!project.value) return
  const metadata =
    project.value.metadata && typeof project.value.metadata === 'object'
      ? { ...(project.value.metadata as Record<string, unknown>) }
      : {}
  const navigation =
    metadata.navigation && typeof metadata.navigation === 'object'
      ? { ...(metadata.navigation as Record<string, unknown>) }
      : {}

  navigation.verticalConnections = connections.verticalConnections.value.map(conn => ({
    id: conn.id,
    areaId: conn.areaId,
    type: conn.type,
    connectedFloors: [...conn.connectedFloors],
    passageProfile: conn.passageProfile
      ? {
          ascendAngleDeg: conn.passageProfile.ascendAngleDeg,
          lanePadding: conn.passageProfile.lanePadding
        }
      : undefined,
    createdAt: conn.createdAt
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
      const connectedFloors = data.connectedFloors.filter(
        (f): f is string => typeof f === 'string' && !!f
      )
      if (connectedFloors.length === 0) return null
      const rawProfile = data.passageProfile
      const parsedProfile =
        rawProfile && typeof rawProfile === 'object'
          ? normalizeVerticalPassageProfile(rawProfile as Partial<VerticalPassageProfile>)
          : undefined

      return {
        id: typeof data.id === 'string' && data.id ? data.id : crypto.randomUUID(),
        areaId: data.areaId,
        type: data.type as VerticalConnection['type'],
        connectedFloors,
        passageProfile: parsedProfile,
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now()
      }
    })
    .filter((v): v is VerticalConnection => !!v)

  const deduplicatedByArea = new Map<string, VerticalConnection>()
  restored.forEach(connection => {
    deduplicatedByArea.set(connection.areaId, connection)
  })
  const normalized = Array.from(deduplicatedByArea.values()).map(connection => {
    if (connection.type === 'elevator') {
      return connection
    }

    if (connection.passageProfile) {
      return {
        ...connection,
        passageProfile: normalizeVerticalPassageProfile(connection.passageProfile)
      }
    }

    const area = getConnectionAreaById(connection.areaId)
    if (!area) return connection

    return {
      ...connection,
      passageProfile: normalizeVerticalPassageProfile(undefined, estimateAreaAscendAngleDeg(area))
    }
  })
  connections.verticalConnections.value = normalized
}

function renderProject(renderAllFloors: boolean = false) {
  if (!scene.value || !project.value) return

  const useFullHeight = viewMode.value === 'orbit'
  const isRoamingMode = viewMode.value === 'orbit'
  const roamingVisibleFloorIds = isRoamingMode
    ? activeVerticalTraversal.value
      ? [activeVerticalTraversal.value.fromFloorId, activeVerticalTraversal.value.toFloorId]
      : floorMgmt.currentFloorId.value
        ? [floorMgmt.currentFloorId.value]
        : []
    : []
  const roamingSecondaryFloorMask =
    isRoamingMode && portalPreviewState.value
      ? [
          {
            floorId: portalPreviewState.value.targetFloorId,
            center2D: portalPreviewState.value.center2D,
            radius: portalPreviewState.value.radius
          }
        ]
      : []

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
      verticalConnections: connections.verticalConnections.value,
      roamingVisibleFloorIds,
      roamingSecondaryFloorMask
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

  const floorPositions = new Map<string, number>()
  const floorHeights = project.value.floors.map(floor => floor.height)
  project.value.floors.forEach((floor, index) => {
    floorPositions.set(floor.id, calculateFloorYPosition(index, floorHeights))
  })
  const renderedAreaIds = new Set<string>()

  connections.verticalConnections.value.forEach(conn => {
    if (renderedAreaIds.has(conn.areaId)) return

    let area: AreaDefinition | undefined
    for (const floor of project.value!.floors) {
      area = floor.areas.find(a => a.id === conn.areaId)
      if (area) break
    }
    if (!area) return

    const center = getAreaCenter(area.shape.vertices)
    const indicator = createConnectionIndicator(conn, floorPositions, center)
    scene.value!.add(indicator)
    renderedAreaIds.add(conn.areaId)
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
  const routeYOffset = viewMode.value === 'orbit' ? 0.35 : 0.22
  const routeRadius = viewMode.value === 'orbit' ? 0.14 : 0.18

  route.segments.forEach((segment, index) => {
    if (!segment.points || segment.points.length < 2) return
    const routePoints = segment.points.map(p => new THREE.Vector3(p.x, p.y + routeYOffset, p.z))
    const curve = new THREE.CatmullRomCurve3(routePoints, false, 'centripetal')
    const geometry = new THREE.TubeGeometry(
      curve,
      Math.max(16, segment.points.length * 24),
      routeRadius,
      10,
      false
    )
    const color = index % 2 === 0 ? 0x22c55e : 0x0ea5e9
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.96,
      depthTest: false,
      depthWrite: false
    })
    const tube = new THREE.Mesh(geometry, material)
    tube.name = `builder-navigation-route-${index}`
    tube.userData.isBuilderNavigationRoute = true
    tube.renderOrder = 920
    scene.value?.add(tube)

    const waypointGeometry = new THREE.SphereGeometry(routeRadius * 0.9, 12, 12)
    const waypointMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
      depthWrite: false
    })
    const waypointStart = new THREE.Mesh(waypointGeometry, waypointMaterial.clone())
    const waypointEnd = new THREE.Mesh(waypointGeometry, waypointMaterial.clone())
    waypointStart.position.copy(routePoints[0]!)
    waypointEnd.position.copy(routePoints[routePoints.length - 1]!)
    waypointStart.userData.isBuilderNavigationRoute = true
    waypointEnd.userData.isBuilderNavigationRoute = true
    waypointStart.renderOrder = 921
    waypointEnd.renderOrder = 921
    scene.value?.add(waypointStart)
    scene.value?.add(waypointEnd)
  })

  route.transitions.forEach((transition, index) => {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        depthTest: false,
        depthWrite: false
      })
    )
    marker.position.set(
      transition.position.x,
      transition.position.y + routeYOffset + 0.12,
      transition.position.z
    )
    marker.name = `builder-navigation-transition-${index}`
    marker.userData.isBuilderNavigationRoute = true
    marker.renderOrder = 922
    scene.value?.add(marker)
  })

  const targetMarker = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.2, 12),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      depthTest: false,
      depthWrite: false
    })
  )
  targetMarker.position.set(
    target.position.x,
    target.position.y + routeYOffset + 0.6,
    target.position.z
  )
  targetMarker.name = 'builder-navigation-target'
  targetMarker.userData.isBuilderNavigationRoute = true
  targetMarker.renderOrder = 923
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

const existingLevels = computed(() => project.value?.floors.map(f => f.level) ?? [])

function handleFloorCreated(data: {
  name: string
  level: number
  height: number
  layoutDescription: string
}) {
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
    if (imported.success && imported.project) {
      project.value = imported.project
      lastSavedAt.value = null
      floorMgmt.initFloor(imported.project)
      showWizard.value = false
      renderProject()
      saveHistory()
    } else {
      console.error('导入失败:', imported.error ?? '未知错误')
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

function getCurrentNavigationSource(): Pick<
  NavigationPlanRequest,
  'sourceFloorId' | 'sourcePosition'
> {
  const sourceFloorId =
    floorMgmt.currentFloorId.value || builderNavigationStore.currentFloorId || undefined

  const controller = roaming.getCharacterController()
  if (viewMode.value === 'orbit' && controller) {
    const pos = controller.getPosition()
    return {
      sourceFloorId,
      sourcePosition: { x: pos.x, y: pos.y, z: pos.z }
    }
  }

  if (camera.value) {
    return {
      sourceFloorId,
      sourcePosition: {
        x: camera.value.position.x,
        y: camera.value.position.y,
        z: camera.value.position.z
      }
    }
  }

  return { sourceFloorId }
}

function toLocalDateTimeInput(date: Date): string {
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

function normalizeDateTimeInput(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 19)
}

function resetDynamicEventForm() {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  dynamicEventForm.value = {
    eventType: 'BLOCK',
    scopeType: 'CONNECTION',
    scopeId: dynamicEventScopeOptions.value[0]?.id || '',
    severity: 'MEDIUM',
    startsAt: toLocalDateTimeInput(now),
    endsAt: toLocalDateTimeInput(oneHourLater),
    reason: ''
  }
}

function ensureDynamicEventScopeDefault() {
  if (dynamicEventScopeOptions.value.length === 0) {
    dynamicEventForm.value.scopeId = ''
    return
  }
  const exists = dynamicEventScopeOptions.value.some(item => item.id === dynamicEventForm.value.scopeId)
  if (!exists) {
    dynamicEventForm.value.scopeId = dynamicEventScopeOptions.value[0]!.id
  }
}

async function loadNavigationDynamicEvents() {
  if (!project.value?.id || isPreviewMode.value) return
  dynamicEventsLoading.value = true
  try {
    dynamicEvents.value = await listNavigationDynamicEvents(project.value.id)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '动态事件加载失败'
    showSaveToast('error', message, 2800)
  } finally {
    dynamicEventsLoading.value = false
  }
}

async function createDynamicEventFromForm() {
  if (!project.value?.id || dynamicEventSubmitting.value) return
  if (!dynamicEventForm.value.scopeId) {
    showSaveToast('error', '请选择作用对象', 2200)
    return
  }
  const startsAt = normalizeDateTimeInput(dynamicEventForm.value.startsAt)
  if (!startsAt) {
    showSaveToast('error', '开始时间格式不正确', 2200)
    return
  }
  const endsAt = normalizeDateTimeInput(dynamicEventForm.value.endsAt)
  if (endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) {
    showSaveToast('error', '结束时间不能早于开始时间', 2200)
    return
  }

  const payload: CreateNavigationDynamicEventRequest = {
    projectId: project.value.id,
    eventType: dynamicEventForm.value.eventType,
    scopeType: dynamicEventForm.value.scopeType,
    scopeId: dynamicEventForm.value.scopeId,
    startsAt,
    endsAt,
    reason: dynamicEventForm.value.reason || undefined
  }
  if (dynamicEventForm.value.eventType === 'CONGESTION') {
    payload.severity = dynamicEventForm.value.severity
  }

  dynamicEventSubmitting.value = true
  try {
    await createNavigationDynamicEvent(payload)
    showSaveToast('success', '动态事件已生效', 1800)
    await loadNavigationDynamicEvents()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '创建动态事件失败'
    showSaveToast('error', message, 2800)
  } finally {
    dynamicEventSubmitting.value = false
  }
}

async function deactivateDynamicEvent(eventId: string) {
  try {
    await deleteNavigationDynamicEvent(eventId)
    showSaveToast('success', '动态事件已失效', 1800)
    await loadNavigationDynamicEvents()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '失效动态事件失败'
    showSaveToast('error', message, 2800)
  }
}

function resolveCurrentNavigationKeyword(): string | null {
  if (builderNavigationStore.activeTargetKeyword) {
    return builderNavigationStore.activeTargetKeyword
  }
  const targetName = builderNavigationStore.activeTarget?.targetName
  if (targetName && targetName.trim()) {
    return targetName.trim()
  }
  return null
}

function findNearestRoutePointIndex(
  points: NavigationRoutePoint[],
  pos: { x: number; y: number; z: number }
): number {
  if (points.length <= 1) return 0
  let bestIdx = 0
  let bestDist = Number.POSITIVE_INFINITY
  for (let i = 0; i < points.length; i += 1) {
    const point = points[i]!
    const d = Math.hypot(point.x - pos.x, point.z - pos.z)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return Math.max(0, Math.min(points.length - 2, bestIdx))
}

function distanceToRouteOnFloor(
  point: { x: number; y: number },
  floorId: string,
  routePoints: NavigationRoutePoint[]
): number {
  let best = Number.POSITIVE_INFINITY
  for (let i = 0; i < routePoints.length - 1; i += 1) {
    const start = routePoints[i]!
    const end = routePoints[i + 1]!
    if (start.floorId !== floorId || end.floorId !== floorId) continue
    const d = distancePointToSegment2D(
      point,
      { x: start.x, y: -start.z },
      { x: end.x, y: -end.z }
    )
    if (d < best) best = d
  }
  return best
}

async function requestNavigationReplan(
  reason: 'OFF_ROUTE' | 'BLOCKED_AHEAD' | 'EVENT_UPDATE' | 'MANUAL_REFRESH'
) {
  if (!project.value || !builderNavigationStore.activeTarget || !builderNavigationStore.activeRoute) return
  const now = performance.now()
  if (navigationReplanInFlight) return
  if (navigationReplanFailureCount >= 3) return
  if (now - navigationReplanLastAt < NAV_REPLAN_COOLDOWN_MS) return

  const keyword = resolveCurrentNavigationKeyword()
  if (!keyword) return
  const source = getCurrentNavigationSource()
  navigationReplanInFlight = true
  try {
    const response = await planPublishedMallNavigation({
      targetType: builderNavigationStore.activeTarget.targetType,
      targetKeyword: keyword,
      sourceFloorId: source.sourceFloorId,
      sourcePosition: source.sourcePosition,
      requestMode: 'REROUTE',
      rerouteReason: reason,
      currentRouteId: builderNavigationStore.activeRoute.routeId,
      currentRouteVersion: builderNavigationStore.activeRoute.routeVersion,
      dynamicVersion: builderNavigationStore.activeRoute.dynamicVersion
    })
    navigationReplanLastAt = performance.now()

    if (!response.success || !response.route || !response.target) {
      navigationReplanFailureCount += 1
      showSaveToast('error', '实时改道失败，已继续当前路线', 2200)
      return
    }

    if (response.route.changed) {
      builderNavigationStore.setActivePlan(response.route, response.target, response.warnings)
      renderProject()
      navigationReplanFailureCount = 0
      if (builderNavigationStore.isAutoNavigating) {
        const controller = roaming.getCharacterController()
        const pos = controller?.getPosition()
        const nextPoints = flattenRoutePoints(response.route)
        if (pos && nextPoints.length > 1) {
          autoNavigatePoints = nextPoints
          autoNavigatePointIndex = findNearestRoutePointIndex(nextPoints, pos)
          autoNavigateTransitionCursor = 0
        }
        showSaveToast('success', '已为你切换更优路线', 1800)
      } else {
        showSaveToast('success', '路线已根据实时情况更新', 1800)
      }
    } else if (reason === 'EVENT_UPDATE') {
      builderNavigationStore.setActivePlan(response.route, response.target, response.warnings)
      renderProject()
    }
  } catch (err: unknown) {
    navigationReplanFailureCount += 1
    showSaveToast('error', '实时改道失败，已继续当前路线', 2200)
  } finally {
    navigationReplanInFlight = false
  }
}

async function pollNavigationDynamicVersionIfNeeded() {
  if (!hasNavigationPlan.value || !builderNavigationStore.activeRoute || !project.value?.id) return
  if (navigationReplanInFlight) return
  try {
    const response = await getPublishedMallNavigationDynamicVersion(project.value.id)
    const current = builderNavigationStore.activeRoute.dynamicVersion
    if (response.dynamicVersion && current && response.dynamicVersion !== current) {
      await requestNavigationReplan('EVENT_UPDATE')
    }
  } catch {
    // 轮询失败不打断主流程
  }
}

function updateReplanSignalsDuringAutoNavigation(
  deltaSeconds: number,
  controller: CharacterController,
  routePoints: NavigationRoutePoint[]
) {
  if (!builderNavigationStore.activeRoute) return
  const currentPos = controller.getPosition()
  const floorId = floorMgmt.currentFloorId.value || builderNavigationStore.currentFloorId
  if (floorId) {
    const distance = distanceToRouteOnFloor(
      { x: currentPos.x, y: -currentPos.z },
      floorId,
      routePoints
    )
    if (Number.isFinite(distance) && distance > NAV_OFF_ROUTE_DISTANCE_THRESHOLD) {
      offRouteAccumMs += deltaSeconds * 1000
      if (offRouteAccumMs >= NAV_OFF_ROUTE_DURATION_MS) {
        offRouteAccumMs = 0
        void requestNavigationReplan('OFF_ROUTE')
      }
    } else {
      offRouteAccumMs = 0
    }
  }

  if (replanLastPosition) {
    const moved = Math.hypot(currentPos.x - replanLastPosition.x, currentPos.z - replanLastPosition.z)
    if (moved < NAV_BLOCKED_STEP_THRESHOLD) {
      blockedAccumMs += deltaSeconds * 1000
      if (blockedAccumMs >= NAV_BLOCKED_DURATION_MS) {
        blockedAccumMs = 0
        void requestNavigationReplan('BLOCKED_AHEAD')
      }
    } else {
      blockedAccumMs = 0
    }
  }
  replanLastPosition = currentPos.clone()
}

async function handleBuilderNavigationIntent(intent: BuilderNavigationIntent) {
  if (!project.value) {
    builderNavigationStore.setError('INVALID_STATE', '当前建模页尚未加载项目，无法执行导航')
    return
  }

  stopAutoNavigation()
  const source = getCurrentNavigationSource()
  builderNavigationStore.setActiveTargetKeyword(intent.targetKeyword)

  try {
    const response = await planPublishedMallNavigation({
      targetType: intent.targetType,
      targetKeyword: intent.targetKeyword,
      sourceFloorId: source.sourceFloorId,
      sourcePosition: source.sourcePosition
    })

    if (!response.success || !response.route || !response.target) {
      builderNavigationStore.setError(response.code, response.message || '路径规划失败')
      showSaveToast('error', response.message || '路径规划失败', 3500)
      return
    }

    builderNavigationStore.setActivePlan(response.route, response.target, response.warnings)
    navigationReplanFailureCount = 0
    renderProject()

    if (intent.executionPreference === 'auto') {
      startAutoNavigation()
    } else {
      builderNavigationStore.setExecutionMode('none')
    }

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
  if (autoNavigatePendingTraversal) {
    autoNavigatePendingTraversal = null
  }
  autoNavigateTransitionCursor = 0
  const controller = roaming.getCharacterController()
  controller?.resetMovement()
  autoNavigatePoints = []
  autoNavigatePointIndex = 0
  autoNavigateLastTs = 0
  autoNavigateControllerWaitUntil = 0
  autoNavigateInterruptGuardUntil = 0
  offRouteAccumMs = 0
  blockedAccumMs = 0
  replanLastPosition = null
  if (activeVerticalTraversal.value?.source === 'auto') {
    cancelActiveVerticalTraversal(false)
  }
  builderNavigationStore.setAutoNavigating(false)
  if (builderNavigationStore.executionMode === 'auto') {
    builderNavigationStore.setExecutionMode('none')
  }
}

function cancelActiveVerticalTraversal(success: boolean) {
  if (verticalTraversalRafId !== null) {
    cancelAnimationFrame(verticalTraversalRafId)
    verticalTraversalRafId = null
  }
  verticalTraversalLastTs = 0
  const resolver = verticalTraversalResolve
  verticalTraversalResolve = null
  activeVerticalTraversal.value = null
  if (resolver) {
    resolver(success)
  }
  renderProject()
}

function getTransitionByCursor(
  fromFloorId: string,
  toFloorId: string
): NavigationRouteTransition | null {
  const route = builderNavigationStore.activeRoute
  if (!route || !Array.isArray(route.transitions)) return null

  for (let i = autoNavigateTransitionCursor; i < route.transitions.length; i += 1) {
    const item = route.transitions[i]
    if (!item) continue
    if (item.fromFloorId === fromFloorId && item.toFloorId === toFloorId) {
      autoNavigateTransitionCursor = i + 1
      return item
    }
  }

  for (let i = 0; i < route.transitions.length; i += 1) {
    const item = route.transitions[i]
    if (!item) continue
    if (item.fromFloorId === fromFloorId && item.toFloorId === toFloorId) {
      return item
    }
  }
  return null
}

function fallbackTeleportFloorSwitch(targetFloorId: string, message?: string): boolean {
  const controller = roaming.getCharacterController()
  if (!controller) return false
  const targetFloorY = getFloorYPositionById(targetFloorId)
  if (targetFloorY === null) return false
  const currentPos = controller.getPosition()
  pendingRoamingSpawnPosition.value = new THREE.Vector3(currentPos.x, targetFloorY, currentPos.z)
  pendingRoamingSpawnRotation.value = controller.getRotationY()
  autoNavigateControllerWaitUntil = performance.now() + AUTO_NAV_CONTROLLER_WAIT_MS
  floorMgmt.selectFloor(targetFloorId)
  if (message) {
    showSaveToast('error', message, 2500)
  }
  return true
}

function resolveVerticalTraversalConnection(
  fromFloorId: string,
  toFloorId: string,
  currentPos2D: { x: number; y: number },
  transition?: NavigationRouteTransition | null
) {
  const areaById = buildAreaByIdMap()
  return findBestVerticalConnectionAtPosition({
    connections: connections.verticalConnections.value.filter(
      item =>
        item.connectedFloors.includes(fromFloorId) &&
        item.connectedFloors.includes(toFloorId) &&
        item.type !== 'elevator'
    ),
    currentFloorId: fromFloorId,
    position2D: transition
      ? toPlanarPoint({ x: transition.position.x, z: transition.position.z })
      : currentPos2D,
    areasById: areaById,
    expectedConnectionId: transition?.connectionId,
    expectedAreaId: transition?.connectionAreaId
  })
}

function startVerticalTraversal(params: {
  connection: VerticalConnection
  area: AreaDefinition
  fromFloorId: string
  toFloorId: string
  source: 'manual' | 'auto'
}): Promise<boolean> {
  const { connection, area, fromFloorId, toFloorId, source } = params

  if (!engine.value) return Promise.resolve(false)
  const controller = roaming.getCharacterController()
  if (!controller) return Promise.resolve(false)

  const fromFloorY = getFloorYPositionById(fromFloorId)
  const toFloorY = getFloorYPositionById(toFloorId)
  if (fromFloorY === null || toFloorY === null) {
    return Promise.resolve(false)
  }

  const profile = normalizeVerticalPassageProfile(
    connection.passageProfile,
    estimateAreaAscendAngleDeg(area)
  )
  const anchors = resolvePassageAnchors(area.shape, profile.ascendAngleDeg)
  if (!anchors) {
    return Promise.resolve(false)
  }

  const paddedEntry = applyLanePadding(anchors.entry2D, anchors.center2D, profile.lanePadding)
  const paddedExit = applyLanePadding(anchors.exit2D, anchors.center2D, profile.lanePadding)
  const ascending = (getFloorLevelById(toFloorId) ?? 0) >= (getFloorLevelById(fromFloorId) ?? 0)
  const start2D = ascending ? paddedEntry : paddedExit
  const end2D = ascending ? paddedExit : paddedEntry
  const traversalPath = buildTraversalPath3D(fromFloorY, toFloorY, start2D, end2D)
  if (!Number.isFinite(traversalPath.length) || traversalPath.length <= 0.001) {
    return Promise.resolve(false)
  }

  const startPos = controller.getPosition()
  const start3D = {
    x: startPos.x,
    y: fromFloorY,
    z: startPos.z
  }
  const end3D = traversalPath.end3D
  const speed = VERTICAL_TRAVERSAL_SPEED_BY_TYPE[connection.type]

  if (verticalTraversalRafId !== null) {
    cancelActiveVerticalTraversal(false)
  }

  activeVerticalTraversal.value = {
    connectionId: connection.id,
    type: connection.type,
    fromFloorId,
    toFloorId,
    start3D,
    end3D,
    progress: 0,
    speed,
    source
  }
  renderProject()

  return new Promise<boolean>(resolve => {
    verticalTraversalResolve = resolve
    verticalTraversalLastTs = 0

    const tick = (timestamp: number) => {
      const active = activeVerticalTraversal.value
      if (!active) {
        return
      }
      const liveController = roaming.getCharacterController()
      if (!liveController || !engine.value) {
        cancelActiveVerticalTraversal(false)
        return
      }

      if (verticalTraversalLastTs === 0) {
        verticalTraversalLastTs = timestamp
      }
      const delta = Math.min(0.05, (timestamp - verticalTraversalLastTs) / 1000)
      verticalTraversalLastTs = timestamp

      liveController.resetMovement()

      const totalDist = computeTraversalDistance(active.start3D, active.end3D)
      if (!Number.isFinite(totalDist) || totalDist <= 0.001) {
        cancelActiveVerticalTraversal(false)
        return
      }

      active.progress = advanceTraversalProgress({
        progress: active.progress,
        speed: active.speed,
        deltaSeconds: delta,
        totalDistance: totalDist
      })
      const next = interpolateTraversalPosition({
        start: active.start3D,
        end: active.end3D,
        progress: active.progress
      })

      liveController.setPosition(next.x, next.y, next.z)
      liveController.setFloorHeight(next.y)
      liveController.setRotation(Math.atan2(active.end3D.x - next.x, active.end3D.z - next.z))
      engine.value.requestRender()

      if (active.progress >= 1) {
        pendingRoamingSpawnPosition.value = new THREE.Vector3(
          active.end3D.x,
          active.end3D.y,
          active.end3D.z
        )
        pendingRoamingSpawnRotation.value = liveController.getRotationY()
        roamingFloorTransitionCooldownUntil =
          performance.now() + ROAMING_FLOOR_TRANSITION_COOLDOWN_MS
        autoNavigateControllerWaitUntil = performance.now() + AUTO_NAV_CONTROLLER_WAIT_MS
        const targetFloorId = active.toFloorId
        cancelActiveVerticalTraversal(true)
        floorMgmt.selectFloor(targetFloorId)
        return
      }

      verticalTraversalRafId = requestAnimationFrame(tick)
    }

    verticalTraversalRafId = requestAnimationFrame(tick)
  })
}

function startAutoNavigation() {
  const route = builderNavigationStore.activeRoute
  if (!route) return

  const routePoints = flattenRoutePoints(route)
  if (routePoints.length < 2) {
    showSaveToast('error', '当前路径点不足，无法自动导航', 3000)
    return
  }

  stopAutoNavigation()
  autoNavigatePoints = routePoints

  if (viewMode.value !== 'orbit') {
    enterRoamMode()
  }

  const initialController = roaming.getCharacterController()
  initialController?.resetMovement()
  builderNavigationStore.setExecutionMode('auto')
  builderNavigationStore.setAutoNavigating(true)
  autoNavigatePointIndex = 0
  autoNavigateTransitionCursor = 0
  autoNavigateControllerWaitUntil = performance.now() + AUTO_NAV_CONTROLLER_WAIT_MS
  autoNavigateInterruptGuardUntil = performance.now() + AUTO_NAV_INTERRUPT_GUARD_MS

  const tick = (timestamp: number) => {
    if (!builderNavigationStore.isAutoNavigating) return

    const controller = roaming.getCharacterController()
    if (!engine.value) {
      stopAutoNavigation()
      showSaveToast('error', '自动导航被中断，请重试', 3000)
      return
    }

    if (!controller) {
      if (timestamp < autoNavigateControllerWaitUntil) {
        autoNavigateRafId = requestAnimationFrame(tick)
        return
      }
      stopAutoNavigation()
      showSaveToast('error', '角色尚未就绪，自动导航启动失败，请重试', 3000)
      return
    }

    if (autoNavigateLastTs === 0) {
      autoNavigateLastTs = timestamp
    }
    const delta = Math.min(0.05, (timestamp - autoNavigateLastTs) / 1000)
    autoNavigateLastTs = timestamp

    updateReplanSignalsDuringAutoNavigation(delta, controller, autoNavigatePoints)

    const currentPoint =
      autoNavigatePoints[Math.min(autoNavigatePointIndex, autoNavigatePoints.length - 1)]
    const targetPoint =
      autoNavigatePoints[Math.min(autoNavigatePointIndex + 1, autoNavigatePoints.length - 1)]
    if (!targetPoint || !currentPoint) {
      stopAutoNavigation()
      return
    }

    if (floorMgmt.currentFloorId.value !== targetPoint.floorId) {
      if (activeVerticalTraversal.value) {
        autoNavigateRafId = requestAnimationFrame(tick)
        return
      }

      if (!autoNavigatePendingTraversal) {
        const currentPos = controller.getPosition()
        const transition = getTransitionByCursor(currentPoint.floorId, targetPoint.floorId)
        const resolved = resolveVerticalTraversalConnection(
          currentPoint.floorId,
          targetPoint.floorId,
          { x: currentPos.x, y: -currentPos.z },
          transition
        )

        if (!resolved) {
          const switched = fallbackTeleportFloorSwitch(
            targetPoint.floorId,
            '未能解析楼梯/扶梯通道，已回退切层'
          )
          if (!switched) {
            stopAutoNavigation()
            showSaveToast('error', '自动导航跨层失败，请检查连接配置', 3000)
            return
          }
        } else {
          autoNavigatePendingTraversal = startVerticalTraversal({
            connection: resolved.connection,
            area: resolved.area,
            fromFloorId: currentPoint.floorId,
            toFloorId: targetPoint.floorId,
            source: 'auto'
          }).then(success => {
            autoNavigatePendingTraversal = null
            if (!success) {
              const switched = fallbackTeleportFloorSwitch(
                targetPoint.floorId,
                '连续爬升失败，已回退切层'
              )
              if (!switched) {
                stopAutoNavigation()
                showSaveToast('error', '自动导航跨层失败，请重试', 3000)
              }
            }
            return success
          })
        }
      }

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
  const destination = new THREE.Vector3(
    target.position.x + 6,
    target.position.y + 8,
    target.position.z + 6
  )
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
  navigationReplanFailureCount = 0
  navigationReplanInFlight = false
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
  project.value.outline = { vertices: [], isClosed: true }
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

function getFloorYPositionById(floorId: string): number | null {
  if (!project.value) return null
  const floorIndex = project.value.floors.findIndex(f => f.id === floorId)
  if (floorIndex < 0) return null
  const floorHeights = project.value.floors.map(f => f.height)
  return calculateFloorYPosition(floorIndex, floorHeights)
}

function getConnectionAreaById(areaId: string): AreaDefinition | null {
  if (!project.value) return null
  for (const floor of project.value.floors) {
    const area = floor.areas.find(item => item.id === areaId)
    if (area) return area
  }
  return null
}

function resolveTransitionTargetFloorId(
  connection: VerticalConnection,
  currentFloorId: string,
  goUp: boolean
): string | null {
  if (!project.value) return null

  const connectedFloors = connection.connectedFloors
    .map(floorId => project.value!.floors.find(f => f.id === floorId))
    .filter((floor): floor is NonNullable<typeof floor> => !!floor)
    .sort((a, b) => a.level - b.level)

  const currentIndex = connectedFloors.findIndex(f => f.id === currentFloorId)
  if (currentIndex < 0) return null

  const nextIndex = goUp ? currentIndex + 1 : currentIndex - 1
  if (nextIndex < 0 || nextIndex >= connectedFloors.length) return null

  return connectedFloors[nextIndex]!.id
}

function handleRoamingVerticalConnectionTransition() {
  if (viewMode.value !== 'orbit' || !project.value) return
  if (activeVerticalTraversal.value) return

  const controller = roaming.getCharacterController()
  const currentFloorId = floorMgmt.currentFloorId.value
  if (!controller || !currentFloorId) return

  const now = performance.now()
  if (now < roamingFloorTransitionCooldownUntil) return

  const shouldGoUp = controller.moveForward && !controller.moveBackward
  const shouldGoDown = controller.moveBackward && !controller.moveForward
  if (!shouldGoUp && !shouldGoDown) return

  const characterPos = controller.getPosition()
  const point2D = toPlanarPoint(characterPos)
  const areaById = buildAreaByIdMap()

  const matched = findBestVerticalConnectionAtPosition({
    connections: connections.verticalConnections.value,
    currentFloorId,
    position2D: point2D,
    areasById: areaById
  })
  if (!matched) return
  const isInsideMatchedArea =
    isPointInside(point2D, matched.area.shape) || isPointOnEdge(point2D, matched.area.shape)
  if (!isInsideMatchedArea) return

  const targetFloorId = resolveTransitionTargetFloorId(
    matched.connection,
    currentFloorId,
    shouldGoUp
  )
  if (!targetFloorId || targetFloorId === currentFloorId) return

  if (matched.connection.type === 'elevator') {
    const switched = fallbackTeleportFloorSwitch(targetFloorId)
    if (switched) {
      roamingFloorTransitionCooldownUntil = now + ROAMING_FLOOR_TRANSITION_COOLDOWN_MS
    }
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
  roamingFloorTransitionCooldownUntil = 0

  // 保存当前相机状态
  savedCameraState.value = {
    position: camera.value.position.clone(),
    target: controls.value.target.clone()
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
  controller.setFloorHeight(floorY)
  registerRoamingGroundResolver(controller)
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
  if (activeVerticalTraversal.value) {
    cancelActiveVerticalTraversal(false)
  }
  roamingFloorTransitionCooldownUntil = 0

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
    controller.clearGroundResolver()
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
  portalPreviewState.value = null
  renderProject()
}

/**
 * 漫游模式下切换楼层
 * 需要重建角色和漫游环境，保持漫游状态不中断
 */
function handleRoamingFloorSwitch() {
  if (!engine.value || !scene.value || !project.value) return

  // 复用已有角色实例，避免跨层时销毁/重建带来的卡顿
  let controller = roaming.getCharacterController()
  if (controller && scene.value) {
    controller.clearGroundResolver()
    scene.value.remove(controller.character)
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
  if (!controller) {
    controller = new CharacterController(settingsStore.characterModel)
  }
  let spawnY = floorY
  if (pendingRoamingSpawnPosition.value) {
    controller.setPosition(
      pendingRoamingSpawnPosition.value.x,
      pendingRoamingSpawnPosition.value.y,
      pendingRoamingSpawnPosition.value.z
    )
    spawnY = pendingRoamingSpawnPosition.value.y
    pendingRoamingSpawnPosition.value = null
  } else {
    const startPos = getAreaCenter(project.value.outline.vertices)
    controller.setPosition(startPos.x, floorY, startPos.z)
  }
  controller.setFloorHeight(spawnY)
  registerRoamingGroundResolver(controller)
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
  if (builderNavigationStore.isAutoNavigating) {
    if (e.code === 'Escape') {
      stopAutoNavigation()
      showSaveToast('error', '已手动中断自动导航', 1800)
      return
    }
    const canInterruptByMoveKey = performance.now() >= autoNavigateInterruptGuardUntil
    if (
      canInterruptByMoveKey &&
      ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
        e.code
      )
    ) {
      stopAutoNavigation()
      showSaveToast('error', '已手动中断自动导航', 1800)
      return
    }
  }

  if (viewMode.value === 'orbit') {
    if ((e.metaKey || e.ctrlKey) && e.key === 'j' && isAiInputEnabled.value) {
      e.preventDefault()
      showInlineInput.value = false
      showBottomDrawer.value = !showBottomDrawer.value
      return
    }
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

    if ((e.metaKey || e.ctrlKey) && e.key === 'j' && isUserPreviewRoute) {
      e.preventDefault()
      showInlineInput.value = false
      showBottomDrawer.value = !showBottomDrawer.value
    }

    if (e.key === '/' && !showBottomDrawer.value && isUserPreviewRoute) {
      e.preventDefault()
      showInlineInput.value = true
    }

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

function isTransitStairsOrEscalator(type: string): boolean {
  return type === 'stairs' || type === 'escalator'
}

function validateNoTransitOverlap(currentProject: MallProject): string | null {
  const areas: Array<{ floorName: string; area: AreaDefinition }> = []
  currentProject.floors.forEach(floor => {
    floor.areas.forEach(area => {
      areas.push({ floorName: floor.name, area })
    })
  })

  for (let i = 0; i < areas.length; i += 1) {
    for (let j = i + 1; j < areas.length; j += 1) {
      const a = areas[i]!
      const b = areas[j]!
      const restricted =
        isTransitStairsOrEscalator(String(a.area.type)) ||
        isTransitStairsOrEscalator(String(b.area.type))
      if (!restricted) continue
      if (!doPolygonsOverlap(a.area.shape, b.area.shape)) continue
      return `楼梯/扶梯区域存在重叠：${a.area.name}（${a.floorName}） 与 ${b.area.name}（${b.floorName}）`
    }
  }

  return null
}

// ============================================================================
// 保存
// ============================================================================

async function handleSave() {
  if (isPreviewMode.value) return
  if (!project.value || projectMgmt.isSaving.value) return

  const overlapError = validateNoTransitOverlap(project.value)
  if (overlapError) {
    showSaveToast('error', overlapError, 4200)
    return
  }

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
  if (!project.value) return
  if (!projectMgmt.serverProjectId.value) {
    const overlapError = validateNoTransitOverlap(project.value)
    if (overlapError) {
      showSaveToast('error', overlapError, 4200)
      return
    }
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

  const overlapError = validateNoTransitOverlap(project.value)
  if (overlapError) {
    showSaveToast('error', overlapError, 4200)
    return
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
          position: { x: pos.x, y: pos.y, z: pos.z }
        })
        handleRoamingVerticalConnectionTransition()
      } else if (camera.value) {
        builderNavigationStore.updateContext({
          floorId: floorMgmt.currentFloorId.value ?? null,
          position: {
            x: camera.value.position.x,
            y: camera.value.position.y,
            z: camera.value.position.z
          }
        })
      }
    })
  }

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  resetDynamicEventForm()
  navDynamicVersionPollTimer = setInterval(() => {
    void pollNavigationDynamicVersionIfNeeded()
  }, NAV_DYNAMIC_VERSION_POLL_MS)

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
      if (!isPreviewMode.value) {
        await loadNavigationDynamicEvents()
      }
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
  portalPreviewState.value = null
  if (activeVerticalTraversal.value) {
    cancelActiveVerticalTraversal(false)
  }
  clearNavigationRouteOverlay()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  if (navDynamicVersionPollTimer) {
    clearInterval(navDynamicVersionPollTimer)
    navDynamicVersionPollTimer = null
  }
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

watch(
  () => floorMgmt.currentFloorId.value,
  () => {
    builderNavigationStore.updateContext({ floorId: floorMgmt.currentFloorId.value ?? null })
    if (viewMode.value === 'orbit') {
      // 漫游模式下切换楼层：需要重建角色和漫游环境
      handleRoamingFloorSwitch()
    } else {
      renderProject()
    }
  }
)

watch(
  () => connections.verticalConnections.value,
  () => {
    syncNavigationMetadataToProject()
    renderProject()
  },
  { deep: true }
)

watch(
  () => connections.showFloorConnectionModal.value,
  visible => {
    if (!visible) return
    initPendingPassageProfile(connections.pendingConnectionArea.value)
  }
)

watch(
  [() => builderNavigationStore.pendingIntent, () => project.value?.id ?? null],
  async ([intent]) => {
    if (!intent) return
    if (!project.value) return
    if (intent.intentId === lastHandledIntentId.value) return

    lastHandledIntentId.value = intent.intentId
    await handleBuilderNavigationIntent(intent)
    builderNavigationStore.clearPendingIntent()
  },
  { deep: false, immediate: true }
)

watch(
  [() => viewMode.value, () => drawing.currentTool.value],
  () => {
    syncBuilderOrbitControlsState()
  },
  { immediate: true }
)

// 监听主题变化，同步更新 3D 场景配色
watch(
  () => settingsStore.theme,
  newTheme => {
    if (engine.value) {
      engine.value.updateThemeColors(newTheme)
    }
  }
)

watch(
  () => project.value?.id ?? null,
  async projectId => {
    if (!projectId || isPreviewMode.value) {
      dynamicEvents.value = []
      return
    }
    await loadNavigationDynamicEvents()
    ensureDynamicEventScopeDefault()
  }
)

watch(
  () => dynamicEventForm.value.scopeType,
  () => {
    ensureDynamicEventScopeDefault()
  }
)

watch(
  () => showDynamicEventPanel.value,
  visible => {
    if (visible) {
      ensureDynamicEventScopeDefault()
    }
  }
)

// 监听门悬停状态，更新 3D 门模型高亮
watch(
  () => doorPlacement.hoveredDoorId.value,
  (newId, oldId) => {
    if (!scene.value) return
    if (newId === oldId) return
    rendering.setDoorHighlight(scene.value, newId)
  }
)

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
function handleSelectTool(
  tool: 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline' | 'edit-vertex' | 'place-door'
) {
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
  doorPlacement.removeDoor(selectedArea.value, doorId, () => {
    renderProject()
    saveHistory()
  })
}
</script>

<template>
  <div class="mall-builder">
    <!-- 加载界面 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-logo">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" />
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" />
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" />
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="16"
            height="16"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            width="32"
            height="32"
            class="error-icon"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p class="error-text">{{ previewError }}</p>
          <button class="btn-back" @click="backFromPreview">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="16"
              height="16"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
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
        v-if="hasNavigationPlan || (isPreviewMode && builderNavigationStore.errorState)"
        class="builder-navigation-panel"
        @mousedown.stop
        @click.stop
      >
        <div class="nav-panel-header">
          <span class="nav-title">{{ hasNavigationPlan ? '路径规划' : '导航状态' }}</span>
          <button class="nav-close-btn" @click.stop="clearNavigationPlan">关闭</button>
        </div>
        <template
          v-if="
            hasNavigationPlan &&
            builderNavigationStore.activeRoute &&
            builderNavigationStore.activeTarget
          "
        >
          <p class="nav-target">
            目标：{{ builderNavigationStore.activeTarget.targetName }}
            <span v-if="builderNavigationStore.activeTarget.floorName">
              （{{ builderNavigationStore.activeTarget.floorName }}）
            </span>
          </p>
          <p class="nav-meta">
            距离 {{ builderNavigationStore.activeRoute.distance }}m · 预计
            {{ builderNavigationStore.activeRoute.eta }} 分钟
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
              @click.stop="startAutoNavigation"
            >
              {{ builderNavigationStore.isAutoNavigating ? '自动导航中...' : '开始自动导航' }}
            </button>
            <button
              v-if="!isPreviewMode"
              class="btn-secondary"
              @click.stop="flyCameraToNavigationTarget"
            >
              相机飞到目标
            </button>
            <button class="btn-secondary" @click.stop="requestNavigationReplan('MANUAL_REFRESH')">
              刷新路线
            </button>
            <button class="btn-secondary danger" @click.stop="clearNavigationPlan">取消</button>
          </div>
        </template>
        <p v-if="builderNavigationStore.errorState" class="nav-error">
          {{ builderNavigationStore.errorState.message }}
        </p>
      </div>

      <div
        v-if="viewMode === 'edit' && !isPreviewMode"
        class="builder-dynamic-event-panel"
        @mousedown.stop
        @click.stop
      >
        <div class="nav-panel-header">
          <span class="nav-title">动态路况</span>
          <button class="nav-close-btn" @click.stop="showDynamicEventPanel = !showDynamicEventPanel">
            {{ showDynamicEventPanel ? '收起' : '展开' }}
          </button>
        </div>
        <template v-if="showDynamicEventPanel">
          <div class="dynamic-event-form">
            <label class="dynamic-field">
              <span>类型</span>
              <select v-model="dynamicEventForm.eventType">
                <option value="BLOCK">封闭</option>
                <option value="CONGESTION">拥堵</option>
              </select>
            </label>
            <label class="dynamic-field">
              <span>作用范围</span>
              <select v-model="dynamicEventForm.scopeType">
                <option value="CONNECTION">楼梯/扶梯连接</option>
                <option value="AREA">区域</option>
              </select>
            </label>
            <label class="dynamic-field">
              <span>对象</span>
              <select v-model="dynamicEventForm.scopeId">
                <option v-for="item in dynamicEventScopeOptions" :key="item.id" :value="item.id">
                  {{ item.label }}
                </option>
              </select>
            </label>
            <label v-if="dynamicEventForm.eventType === 'CONGESTION'" class="dynamic-field">
              <span>拥堵等级</span>
              <select v-model="dynamicEventForm.severity">
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
              </select>
            </label>
            <label class="dynamic-field">
              <span>开始时间</span>
              <input v-model="dynamicEventForm.startsAt" type="datetime-local" />
            </label>
            <label class="dynamic-field">
              <span>结束时间</span>
              <input v-model="dynamicEventForm.endsAt" type="datetime-local" />
            </label>
            <label class="dynamic-field">
              <span>备注</span>
              <input v-model="dynamicEventForm.reason" type="text" placeholder="如：保洁临时封闭" />
            </label>
            <div class="nav-actions">
              <button class="btn-primary" :disabled="dynamicEventSubmitting" @click.stop="createDynamicEventFromForm">
                {{ dynamicEventSubmitting ? '提交中...' : '立即生效' }}
              </button>
              <button class="btn-secondary" @click.stop="loadNavigationDynamicEvents">刷新</button>
            </div>
          </div>

          <div class="dynamic-event-list">
            <p class="dynamic-list-title">已生效事件</p>
            <p v-if="dynamicEventsLoading" class="nav-meta">加载中...</p>
            <p v-else-if="dynamicEvents.length === 0" class="nav-meta">暂无动态事件</p>
            <ul v-else class="nav-steps">
              <li v-for="item in dynamicEvents" :key="item.eventId" class="dynamic-event-item">
                <span>
                  {{ item.eventType === 'BLOCK' ? '封闭' : '拥堵' }} ·
                  {{ item.scopeType === 'CONNECTION' ? '连接' : '区域' }} · {{ item.scopeId }}
                </span>
                <button class="btn-secondary danger small" @click.stop="deactivateDynamicEvent(item.eventId)">
                  失效
                </button>
              </li>
            </ul>
          </div>
        </template>
      </div>

      <!-- 左侧楼层面板 (使用子组件) -->
        <FloorPanel
        v-if="
          showFloorPanel &&
          (viewMode === 'edit' || isPreviewMode) &&
          !(isPreviewMode && viewMode === 'orbit')
        "
        :floors="project?.floors || []"
        :currentFloorId="floorMgmt.currentFloorId.value || ''"
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
      <CommandPalette v-model:visible="showCommandPalette" @close="showCommandPalette = false" />

      <!-- AI 内联输入条 -->
      <BuilderInlineInput
        v-if="isAiInputEnabled"
        v-model:visible="showInlineInput"
        @switch-to-drawer="showInlineInput = false; showBottomDrawer = true"
      />

      <!-- AI 底部触发条 -->
      <div
        v-if="!showBottomDrawer && !showInlineInput && isAiInputEnabled"
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
      <BuilderBottomDrawer v-if="isAiInputEnabled" v-model:visible="showBottomDrawer" />

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
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
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
              <li>
                <kbd>{{ t('admin.roamMouse') }}</kbd> {{ t('admin.roamLook') }}
              </li>
              <li><kbd>Esc</kbd> {{ t('admin.exitRoam') }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 楼层连接弹窗 -->
    <div
      v-if="connections.showFloorConnectionModal.value"
      class="modal-overlay"
      @click.self="connections.cancelFloorConnection"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>
            {{
              t('admin.setConnectionFloor', { type: connections.pendingConnectionTypeName.value })
            }}
          </h3>
          <button class="btn-icon" @click="connections.cancelFloorConnection">
            <svg viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">
            {{
              t('admin.selectConnectionFloor', {
                type: connections.pendingConnectionTypeName.value
              })
            }}
          </p>
          <div class="floor-checkbox-list">
            <label v-for="floor in project?.floors" :key="floor.id" class="floor-checkbox">
              <input
                type="checkbox"
                :value="floor.id"
                v-model="connections.selectedFloorIds.value"
                :disabled="
                  floor.id === floorMgmt.currentFloorId.value ||
                  !connections.isFloorSelectable(floor.id)
                "
              />
              <span>{{ floor.name }}</span>
              <span v-if="floor.id === floorMgmt.currentFloorId.value" class="current-badge">{{
                t('admin.current')
              }}</span>
            </label>
          </div>
          <div v-if="showPassageProfileConfig" class="passage-profile-config">
            <p class="modal-hint">上行方向与通道参数（楼梯/扶梯）</p>
            <div class="passage-direction-grid">
              <button
                v-for="option in passageDirectionOptions"
                :key="option.angleDeg"
                type="button"
                class="btn-secondary passage-direction-btn"
                :class="{
                  active: normalizeAngleDeg(pendingConnectionAscendAngleDeg) === option.angleDeg
                }"
                @click="selectPassageDirection(option.angleDeg)"
              >
                {{ option.label }}
              </button>
            </div>
            <div class="passage-input-row">
              <label class="passage-input-item">
                <span>方向角(°)</span>
                <input
                  v-model.number="pendingConnectionAscendAngleDeg"
                  type="number"
                  step="1"
                  min="0"
                  max="359"
                  @change="normalizePendingPassageProfileInputs"
                />
              </label>
              <label class="passage-input-item">
                <span>内缩比例</span>
                <input
                  v-model.number="pendingConnectionLanePadding"
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.45"
                  @change="normalizePendingPassageProfileInputs"
                />
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="connections.cancelFloorConnection">
            {{ t('common.cancel') }}
          </button>
          <button
            class="btn-primary"
            @click="confirmFloorConnectionWithProfile"
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
// Loading Overlay
// ============================================================================
.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: var(--bg-primary);
}

.loading-content {
  width: min(420px, 84vw);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.loading-logo {
  width: 120px;
  height: 120px;
  margin-bottom: 16px;
  color: var(--text-primary);

  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
}

.loading-title {
  width: 100%;
  margin: 0 0 12px;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: var(--text-primary);
}

.loading-bar {
  width: min(320px, 80vw);
  height: 10px;
  margin: 0 auto 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(var(--text-primary-rgb), 0.12);
}

.loading-progress {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  transition: width 0.2s ease;
}

.loading-text {
  margin: 0;
  font-size: 16px;
  text-align: center;
  color: var(--text-secondary);
}

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
  position: fixed;
  top: 68px;
  left: 14px;
  z-index: 360;
  width: 360px;
  max-width: calc(100vw - 32px);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(var(--bg-secondary-rgb), 0.98);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
  isolation: isolate;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
}

.builder-dynamic-event-panel {
  position: fixed;
  top: 68px;
  right: 14px;
  z-index: 355;
  width: 360px;
  max-width: calc(100vw - 32px);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: rgba(var(--bg-secondary-rgb), 0.98);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
  isolation: isolate;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
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

.nav-actions .btn-secondary.small {
  padding: 4px 8px;
  font-size: 11px;
}

.dynamic-event-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.dynamic-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dynamic-field input,
.dynamic-field select {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: rgba(var(--bg-primary-rgb), 0.8);
  color: var(--text-primary);
  padding: 6px 8px;
  font-size: 12px;
}

.dynamic-list-title {
  margin: 8px 0 6px;
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
}

.dynamic-event-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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

  input[type='checkbox'] {
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

.passage-profile-config {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
}

.passage-direction-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.passage-direction-btn {
  padding: 6px 8px;
  font-size: 12px;
  border-radius: 6px;

  &.active {
    border-color: rgba(var(--accent-primary-rgb), 0.6);
    color: var(--accent-primary);
    background: rgba(var(--accent-primary-rgb), 0.1);
  }
}

.passage-input-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.passage-input-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);

  input {
    width: 100%;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-hover);
    color: var(--text-primary);
    outline: none;

    &:focus {
      border-color: rgba(var(--accent-primary-rgb), 0.6);
      box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
    }
  }
}
</style>
