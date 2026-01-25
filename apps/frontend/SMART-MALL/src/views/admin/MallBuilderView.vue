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
import * as THREE from 'three'
import { MallBuilderEngine } from '@/orchestrator/mall-builder/MallBuilderEngine'

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

// 导入子组件
import {
  BuilderWizard,
  BuilderToolbar,
  FloorPanel,
  MaterialPanel,
  PropertyPanel,
  SceneLegend,
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
const roaming = useRoamingMode()

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

    loadProgress.value = 60
    setupInteraction()
    document.addEventListener('pointerlockchange', roaming.handlePointerLockChange)

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
  drawing.handleMouseDown(e)
}

function handleMouseMove(e: MouseEvent) {
  if (viewMode.value === 'orbit') return
  drawing.handleMouseMove(e)
}

function handleMouseUp(e: MouseEvent) {
  if (viewMode.value === 'orbit') return
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
  saveHistory()
}

function renderProject(renderAllFloors: boolean = false) {
  if (!scene.value || !project.value) return
  
  const useFullHeight = viewMode.value === 'orbit'
  const isRoamingMode = viewMode.value === 'orbit'

  // 计算商城轮廓中心
  let outlineCenter = { x: 0, z: 0 }
  if (project.value.outline?.vertices?.length >= 3) {
    outlineCenter = getAreaCenter(project.value.outline.vertices)
  }

  // 更新场景中心
  if (engine.value) {
    engine.value.updateSceneCenter(outlineCenter.x, outlineCenter.z)
    engine.value.clearSceneObjects()
  }

  // 使用 useRendering composable 渲染项目
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

function addFloor() {
  if (!project.value) return
  
  const newFloor = floorMgmt.confirmAddFloor()
  
  if (newFloor) {
    renderProject()
    saveHistory()
  }
}

function openAddFloorModal() {
  floorMgmt.openAddFloorModal()
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

function enterRoamMode() {
  if (!camera.value || !controls.value || !scene.value || !project.value) return
  
  // 保存当前相机状态
  savedCameraState.value = {
    position: camera.value.position.clone(),
    target: controls.value.target.clone(),
  }
  
  viewMode.value = 'orbit'
  controls.value.enabled = false
  
  // 初始化角色控制器
  const startPos = getAreaCenter(project.value.outline.vertices)
  const controller = new CharacterController(scene.value, startPos.x, 0, startPos.z)
  roaming.setCharacterController(controller)
  
  // 请求指针锁定
  containerRef.value?.requestPointerLock()
  
  // 开始漫游动画循环
  roaming.startRoamLoop(camera.value)
  
  renderProject()
}

function exitRoamMode() {
  if (!camera.value || !controls.value) return
  
  viewMode.value = 'edit'
  
  // 停止漫游动画
  roaming.stopRoamLoop()
  
  // 退出指针锁定
  document.exitPointerLock()
  
  // 恢复相机状态
  if (savedCameraState.value) {
    camera.value.position.copy(savedCameraState.value.position)
    controls.value.target.copy(savedCameraState.value.target)
    controls.value.update()
  }
  
  controls.value.enabled = true
  renderProject()
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

// ============================================================================
// 生命周期
// ============================================================================

onMounted(async () => {
  initEngine()
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('keyup', handleKeyup)
  
  const projectIdFromUrl = route.params.projectId as string | undefined
  if (projectIdFromUrl) {
    try {
      const loaded = await projectMgmt.loadFromServer(projectIdFromUrl)
      if (loaded) {
        project.value = loaded
        floorMgmt.initFloor(loaded)
        showWizard.value = false
        renderProject()
        saveHistory()
      }
    } catch (err) {
      console.error('从 URL 加载项目失败:', err)
      showWizard.value = true
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keyup', handleKeyup)
  document.removeEventListener('pointerlockchange', roaming.handlePointerLockChange)
  roaming.dispose()
  
  if (engine.value) {
    engine.value.dispose()
    engine.value = null
  }
  
  disposeBuilderResources()
})

watch(() => floorMgmt.currentFloorId.value, () => {
  renderProject()
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
function handleSelectTool(tool: 'select' | 'draw-rect' | 'draw-poly' | 'draw-outline') {
  drawing.setTool(tool)
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
        <div class="loading-title">商城建模器</div>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: `${loadProgress}%` }"></div>
        </div>
        <div class="loading-text">正在初始化 3D 引擎...</div>
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
      @cancel="goBack"
    />

    <!-- 主界面 -->
    <template v-if="!showWizard && !isLoading">
      <!-- 顶部工具栏 (使用子组件) -->
      <BuilderToolbar
        :projectName="project?.name || '商城布局'"
        :currentTool="drawing.currentTool.value"
        :viewMode="viewMode"
        :canUndo="history.canUndo.value"
        :canRedo="history.canRedo.value"
        :isSaving="projectMgmt.isSaving.value"
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
      />

      <!-- 左侧楼层面板 (使用子组件) -->
      <FloorPanel
        v-if="showFloorPanel && viewMode === 'edit'"
        :floors="project?.floors || []"
        :currentFloorId="floorMgmt.currentFloorId.value"
        v-model:collapsed="leftPanelCollapsed"
        @select="selectFloor"
        @add="openAddFloorModal"
        @delete="deleteFloor"
      />

      <!-- 右侧属性面板 (使用子组件) -->
      <PropertyPanel
        v-if="showPropertyPanel && viewMode === 'edit'"
        :area="selectedArea"
        :areaTypes="areaTypes"
        @update:area="handleAreaUpdate"
        @delete="deleteSelectedArea"
        @close="deselectAll"
      />

      <!-- 材质面板 (使用子组件) -->
      <MaterialPanel
        v-if="showMaterialPanel && viewMode === 'edit' && !selectedArea"
        :categories="categories"
        :expandedCategories="expandedCategories"
        :selectedMaterialId="selectedMaterialId"
        @toggleCategory="toggleCategory"
        @selectMaterial="selectMaterial"
        @clearSelection="clearMaterialSelection"
      />

      <!-- 场景图例 (使用子组件) -->
      <SceneLegend
        v-if="viewMode === 'edit'"
        :visible="showSceneLegend"
        :items="legendItems"
      />

      <!-- 漫游模式指示器 -->
      <div v-if="viewMode === 'orbit'" class="roaming-indicator">
        <div class="roaming-controls">
          <div class="control-hint">
            <span class="key">W A S D</span>
            <span>移动</span>
          </div>
          <div class="control-hint">
            <span class="key">鼠标</span>
            <span>转向</span>
          </div>
          <div class="control-hint">
            <span class="key">ESC</span>
            <span>退出</span>
          </div>
        </div>
        <button class="btn-exit-roam" @click="exitRoamMode">
          退出漫游
        </button>
      </div>

      <!-- 底部状态栏 -->
      <footer class="status-bar">
        <div class="status-left">
          <span class="status-item">
            <svg viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            {{ floorMgmt.currentFloor.value?.name || '-' }}
          </span>
          <span class="status-item">
            区域: {{ floorMgmt.currentFloor.value?.areas.length || 0 }}
          </span>
        </div>
        <div class="status-right">
          <span class="status-item">
            网格: {{ gridSize }}m
          </span>
          <span class="status-item">
            对齐: {{ snapEnabled ? '开' : '关' }}
          </span>
        </div>
      </footer>
    </template>

    <!-- 3D 渲染容器 -->
    <div ref="containerRef" class="canvas-container"></div>

    <!-- 添加楼层弹窗 -->
    <div v-if="floorMgmt.showAddFloorModal.value" class="modal-overlay" @click.self="floorMgmt.showAddFloorModal.value = false">
      <div class="modal">
        <div class="modal-header">
          <h3>添加楼层</h3>
          <button class="btn-icon" @click="floorMgmt.showAddFloorModal.value = false">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>楼层名称</label>
            <input v-model="floorMgmt.newFloorForm.name" type="text" class="input" placeholder="如：2F" />
          </div>
          <div class="form-group">
            <label>楼层编号</label>
            <input v-model.number="floorMgmt.newFloorForm.level" type="number" class="input" />
          </div>
          <div class="form-group">
            <label>楼层高度 (m)</label>
            <input v-model.number="floorMgmt.newFloorForm.height" type="number" class="input" step="0.5" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="floorMgmt.showAddFloorModal.value = false">取消</button>
          <button class="btn-primary" @click="addFloor">添加</button>
        </div>
      </div>
    </div>

    <!-- 离开确认弹窗 -->
    <div v-if="showLeaveConfirm" class="modal-overlay" @click.self="cancelLeave">
      <div class="modal">
        <div class="modal-header">
          <h3>未保存的更改</h3>
        </div>
        <div class="modal-body">
          <p>您有未保存的更改，确定要离开吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="cancelLeave">取消</button>
          <button class="btn-danger" @click="confirmLeave">离开</button>
        </div>
      </div>
    </div>

    <!-- 帮助面板 -->
    <div v-if="showHelpPanel" class="modal-overlay" @click.self="showHelpPanel = false">
      <div class="modal help-modal">
        <div class="modal-header">
          <h3>快捷键帮助</h3>
          <button class="btn-icon" @click="showHelpPanel = false">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="help-section">
            <h4>工具快捷键</h4>
            <ul>
              <li><kbd>V</kbd> 选择工具</li>
              <li><kbd>R</kbd> 矩形绘制</li>
              <li><kbd>P</kbd> 多边形绘制</li>
              <li><kbd>O</kbd> 漫游模式</li>
            </ul>
          </div>
          <div class="help-section">
            <h4>编辑快捷键</h4>
            <ul>
              <li><kbd>Ctrl+Z</kbd> 撤销</li>
              <li><kbd>Ctrl+Shift+Z</kbd> 重做</li>
              <li><kbd>Ctrl+S</kbd> 保存</li>
              <li><kbd>Delete</kbd> 删除选中</li>
              <li><kbd>Esc</kbd> 取消/取消选择</li>
            </ul>
          </div>
          <div class="help-section">
            <h4>漫游模式</h4>
            <ul>
              <li><kbd>W A S D</kbd> 移动</li>
              <li><kbd>鼠标</kbd> 转向</li>
              <li><kbd>Esc</kbd> 退出漫游</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 楼层连接弹窗 -->
    <div v-if="connections.showFloorConnectionModal.value" class="modal-overlay" @click.self="connections.closeConnectionModal">
      <div class="modal">
        <div class="modal-header">
          <h3>设置{{ connections.pendingConnectionTypeName.value }}连接楼层</h3>
          <button class="btn-icon" @click="connections.closeConnectionModal">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">选择此{{ connections.pendingConnectionTypeName.value }}连接的楼层：</p>
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
              <span v-if="floor.id === floorMgmt.currentFloorId.value" class="current-badge">当前</span>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="connections.closeConnectionModal">取消</button>
          <button 
            class="btn-primary" 
            @click="connections.confirmConnection"
            :disabled="!connections.canConfirmConnection.value"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/assets/styles/views/admin/mall-builder.scss"></style>
