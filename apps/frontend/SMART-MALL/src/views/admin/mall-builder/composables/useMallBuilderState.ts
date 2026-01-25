/**
 * Mall Builder 状态管理 Composable
 * 集中管理所有状态变量
 */
import { ref, reactive, computed, shallowRef } from 'vue'
import type * as THREE from 'three'
import type { MallBuilderEngine } from '@/orchestrator/mall-builder/MallBuilderEngine'
import type {
  MallProject,
  AreaDefinition,
  MallTemplate,
  MaterialPreset,
  MaterialCategory,
  VerticalConnection,
} from '@/builder'
import {
  getAllMaterialPresets,
  getAllCategories,
  getAllTemplates,
} from '@/builder'

// 类型定义
export type Tool = 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline' | 'edit-vertex'
export type ViewMode = 'edit' | 'orbit'

export interface SavedCameraState {
  position: THREE.Vector3
  target: THREE.Vector3
}

export function useMallBuilderState() {
  // 容器引用
  const containerRef = ref<HTMLElement | null>(null)

  // 建模器引擎
  const engine = shallowRef<MallBuilderEngine | null>(null)

  // Three.js 对象（通过 engine 访问）
  const scene = computed(() => engine.value?.scene || null)
  const camera = computed(() => engine.value?.camera || null)
  const renderer = computed(() => engine.value?.renderer || null)
  const controls = computed(() => engine.value?.getOrbitControls() || null)

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

  // 选中状态
  const selectedAreaId = ref<string | null>(null)
  const selectedArea = computed(() =>
    currentFloor.value?.areas.find(a => a.id === selectedAreaId.value) || null
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

  // 垂直连接状态
  const verticalConnections = ref<VerticalConnection[]>([])
  const showFloorConnectionModal = ref(false)
  const pendingConnectionArea = ref<AreaDefinition | null>(null)
  const selectedFloorIds = ref<string[]>([])

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

  // 服务器项目状态
  const serverProjectId = ref<string | null>(null)
  const isSaving = ref(false)
  const saveMessage = ref<string | null>(null)
  const showProjectListModal = ref(false)
  const projectList = ref<{
    projectId: string
    name: string
    description?: string
    floorCount: number
    areaCount: number
    createdAt: string
    updatedAt: string
  }[]>([])
  const isLoadingProjects = ref(false)

  // 未保存更改跟踪
  const hasUnsavedChanges = ref(false)
  const lastSavedState = ref<string | null>(null)

  // 离开确认弹窗
  const showLeaveConfirm = ref(false)
  const pendingNavigation = ref<(() => void) | null>(null)

  return {
    // 容器和引擎
    containerRef,
    engine,
    scene,
    camera,
    renderer,
    controls,

    // 加载状态
    isLoading,
    loadProgress,

    // 项目数据
    project,
    currentFloorId,
    currentFloor,

    // 向导状态
    showWizard,
    selectedTemplate,
    newProjectName,

    // 工具状态
    currentTool,
    isDrawing,
    drawPoints,
    previewMesh,

    // 视图模式
    viewMode,
    savedCameraState,

    // 选中状态
    selectedAreaId,
    selectedArea,

    // 面板状态
    showFloorPanel,
    showPropertyPanel,
    showMaterialPanel,
    leftPanelCollapsed,
    showSceneLegend,

    // 材质面板
    selectedMaterialId,
    expandedCategories,
    materialPresets,
    categories,

    // 垂直连接
    verticalConnections,
    showFloorConnectionModal,
    pendingConnectionArea,
    selectedFloorIds,

    // 历史记录
    history,
    historyIndex,
    canUndo,
    canRedo,

    // 网格设置
    gridSize,
    snapEnabled,

    // 背景图片
    backgroundImage,

    // 重叠检测
    overlappingAreas,
    boundaryWarning,

    // 弹窗状态
    showAddFloorModal,
    showHelpPanel,
    newFloorForm,

    // 模板列表
    templates,

    // 服务器项目状态
    serverProjectId,
    isSaving,
    saveMessage,
    showProjectListModal,
    projectList,
    isLoadingProjects,

    // 未保存更改
    hasUnsavedChanges,
    lastSavedState,
    showLeaveConfirm,
    pendingNavigation,
  }
}
