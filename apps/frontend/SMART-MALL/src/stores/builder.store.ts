/**
 * 建模器状态 Store
 * 
 * 职责：
 * - 管理当前编辑的区域/对象
 * - 管理选中的 3D 对象
 * - 管理撤销/重做历史栈
 * - 管理建模工具状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============================================================================
// 类型定义
// ============================================================================

/** 建模工具类型 */
export type BuilderTool =
  | 'select'      // 选择工具
  | 'move'        // 移动工具
  | 'rotate'      // 旋转工具
  | 'scale'       // 缩放工具
  | 'draw-area'   // 绘制区域
  | 'draw-wall'   // 绘制墙体
  | 'place-item'  // 放置物品

/** 变换模式 */
export type TransformMode = 'translate' | 'rotate' | 'scale'

/** 变换空间 */
export type TransformSpace = 'world' | 'local'

/** 吸附模式 */
export type SnapMode = 'none' | 'grid' | 'vertex' | 'edge'

/** 3D 对象类型 */
export type Object3DType = 'area' | 'wall' | 'floor' | 'item' | 'decoration'

/** 选中的对象信息 */
export interface SelectedObject {
  id: string
  type: Object3DType
  name: string
  /** Three.js 对象的 UUID */
  uuid: string
}

/** 历史操作类型 */
export type HistoryActionType =
  | 'create'      // 创建对象
  | 'delete'      // 删除对象
  | 'transform'   // 变换（移动/旋转/缩放）
  | 'modify'      // 修改属性
  | 'batch'       // 批量操作

/** 历史记录项 */
export interface HistoryEntry {
  id: string
  type: HistoryActionType
  description: string
  timestamp: number
  /** 撤销时需要的数据 */
  undoData: unknown
  /** 重做时需要的数据 */
  redoData: unknown
}

/** 编辑中的区域信息 */
export interface EditingArea {
  areaId: string
  floorId: string
  name: string
  /** 是否有未保存的更改 */
  isDirty: boolean
}

/** 剪贴板内容 */
export interface ClipboardContent {
  type: 'cut' | 'copy'
  objects: SelectedObject[]
  data: unknown
}

// ============================================================================
// Store 定义
// ============================================================================

export const useBuilderStore = defineStore('builder', () => {
  // ==========================================================================
  // 状态
  // ==========================================================================

  /** 当前编辑的区域 */
  const editingArea = ref<EditingArea | null>(null)

  /** 当前选中的工具 */
  const currentTool = ref<BuilderTool>('select')

  /** 选中的对象列表（支持多选） */
  const selectedObjects = ref<SelectedObject[]>([])

  /** 变换模式 */
  const transformMode = ref<TransformMode>('translate')

  /** 变换空间 */
  const transformSpace = ref<TransformSpace>('world')

  /** 吸附模式 */
  const snapMode = ref<SnapMode>('grid')

  /** 网格吸附大小 */
  const gridSnapSize = ref(0.5)

  /** 角度吸附大小（度） */
  const angleSnapSize = ref(15)

  /** 撤销历史栈 */
  const undoStack = ref<HistoryEntry[]>([])

  /** 重做历史栈 */
  const redoStack = ref<HistoryEntry[]>([])

  /** 历史栈最大长度 */
  const maxHistoryLength = ref(50)

  /** 剪贴板 */
  const clipboard = ref<ClipboardContent | null>(null)

  /** 是否正在拖拽 */
  const isDragging = ref(false)

  /** 是否显示变换控制器 */
  const showTransformControls = ref(true)

  /** 是否显示边界框 */
  const showBoundingBox = ref(true)

  // ==========================================================================
  // 计算属性
  // ==========================================================================

  /** 是否有选中的对象 */
  const hasSelection = computed(() => selectedObjects.value.length > 0)

  /** 是否多选 */
  const isMultiSelect = computed(() => selectedObjects.value.length > 1)

  /** 选中的第一个对象 */
  const primarySelection = computed(() => selectedObjects.value[0] ?? null)

  /** 是否可以撤销 */
  const canUndo = computed(() => undoStack.value.length > 0)

  /** 是否可以重做 */
  const canRedo = computed(() => redoStack.value.length > 0)

  /** 是否有未保存的更改 */
  const hasUnsavedChanges = computed(() => editingArea.value?.isDirty ?? false)

  /** 是否有剪贴板内容 */
  const hasClipboard = computed(() => clipboard.value !== null)

  /** 选中对象的 ID 列表 */
  const selectedIds = computed(() => selectedObjects.value.map((o) => o.id))

  // ==========================================================================
  // Actions - 编辑区域
  // ==========================================================================

  /** 开始编辑区域 */
  function startEditing(areaId: string, floorId: string, name: string) {
    editingArea.value = {
      areaId,
      floorId,
      name,
      isDirty: false,
    }
    // 清空选择和历史
    clearSelection()
    clearHistory()
  }

  /** 结束编辑 */
  function stopEditing() {
    editingArea.value = null
    clearSelection()
    clearHistory()
  }

  /** 标记为已修改 */
  function markDirty() {
    if (editingArea.value) {
      editingArea.value.isDirty = true
    }
  }

  /** 标记为已保存 */
  function markSaved() {
    if (editingArea.value) {
      editingArea.value.isDirty = false
    }
  }

  // ==========================================================================
  // Actions - 工具选择
  // ==========================================================================

  /** 设置当前工具 */
  function setTool(tool: BuilderTool) {
    currentTool.value = tool
    // 根据工具自动设置变换模式
    if (tool === 'move') {
      transformMode.value = 'translate'
    } else if (tool === 'rotate') {
      transformMode.value = 'rotate'
    } else if (tool === 'scale') {
      transformMode.value = 'scale'
    }
  }

  /** 设置变换模式 */
  function setTransformMode(mode: TransformMode) {
    transformMode.value = mode
  }

  /** 切换变换空间 */
  function toggleTransformSpace() {
    transformSpace.value = transformSpace.value === 'world' ? 'local' : 'world'
  }

  /** 设置吸附模式 */
  function setSnapMode(mode: SnapMode) {
    snapMode.value = mode
  }

  /** 设置网格吸附大小 */
  function setGridSnapSize(size: number) {
    gridSnapSize.value = size
  }

  // ==========================================================================
  // Actions - 对象选择
  // ==========================================================================

  /** 选中对象 */
  function selectObject(obj: SelectedObject, addToSelection: boolean = false) {
    if (addToSelection) {
      // 多选模式：如果已选中则取消，否则添加
      const index = selectedObjects.value.findIndex((o) => o.id === obj.id)
      if (index > -1) {
        selectedObjects.value.splice(index, 1)
      } else {
        selectedObjects.value.push(obj)
      }
    } else {
      // 单选模式：替换选择
      selectedObjects.value = [obj]
    }
  }

  /** 选中多个对象 */
  function selectObjects(objects: SelectedObject[]) {
    selectedObjects.value = [...objects]
  }

  /** 取消选中对象 */
  function deselectObject(id: string) {
    const index = selectedObjects.value.findIndex((o) => o.id === id)
    if (index > -1) {
      selectedObjects.value.splice(index, 1)
    }
  }

  /** 清空选择 */
  function clearSelection() {
    selectedObjects.value = []
  }

  /** 全选（需要外部提供所有对象） */
  function selectAll(allObjects: SelectedObject[]) {
    selectedObjects.value = [...allObjects]
  }

  /** 检查对象是否被选中 */
  function isSelected(id: string): boolean {
    return selectedObjects.value.some((o) => o.id === id)
  }

  // ==========================================================================
  // Actions - 历史记录（撤销/重做）
  // ==========================================================================

  /** 生成唯一ID */
  function generateId(): string {
    return `history-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  /** 添加历史记录 */
  function pushHistory(
    type: HistoryActionType,
    description: string,
    undoData: unknown,
    redoData: unknown
  ) {
    const entry: HistoryEntry = {
      id: generateId(),
      type,
      description,
      timestamp: Date.now(),
      undoData,
      redoData,
    }

    undoStack.value.push(entry)

    // 限制历史栈长度
    if (undoStack.value.length > maxHistoryLength.value) {
      undoStack.value.shift()
    }

    // 添加新操作时清空重做栈
    redoStack.value = []

    // 标记为已修改
    markDirty()
  }

  /** 撤销 */
  function undo(): HistoryEntry | null {
    const entry = undoStack.value.pop()
    if (entry) {
      redoStack.value.push(entry)
      return entry
    }
    return null
  }

  /** 重做 */
  function redo(): HistoryEntry | null {
    const entry = redoStack.value.pop()
    if (entry) {
      undoStack.value.push(entry)
      return entry
    }
    return null
  }

  /** 清空历史 */
  function clearHistory() {
    undoStack.value = []
    redoStack.value = []
  }

  // ==========================================================================
  // Actions - 剪贴板
  // ==========================================================================

  /** 复制选中对象 */
  function copy(data: unknown) {
    if (selectedObjects.value.length === 0) return

    clipboard.value = {
      type: 'copy',
      objects: [...selectedObjects.value],
      data,
    }
  }

  /** 剪切选中对象 */
  function cut(data: unknown) {
    if (selectedObjects.value.length === 0) return

    clipboard.value = {
      type: 'cut',
      objects: [...selectedObjects.value],
      data,
    }
  }

  /** 清空剪贴板 */
  function clearClipboard() {
    clipboard.value = null
  }

  // ==========================================================================
  // Actions - 拖拽状态
  // ==========================================================================

  /** 开始拖拽 */
  function startDragging() {
    isDragging.value = true
  }

  /** 结束拖拽 */
  function stopDragging() {
    isDragging.value = false
  }

  // ==========================================================================
  // Actions - 显示选项
  // ==========================================================================

  /** 切换变换控制器显示 */
  function toggleTransformControls() {
    showTransformControls.value = !showTransformControls.value
  }

  /** 切换边界框显示 */
  function toggleBoundingBox() {
    showBoundingBox.value = !showBoundingBox.value
  }

  // ==========================================================================
  // Actions - 重置
  // ==========================================================================

  /** 重置所有状态 */
  function reset() {
    editingArea.value = null
    currentTool.value = 'select'
    selectedObjects.value = []
    transformMode.value = 'translate'
    transformSpace.value = 'world'
    snapMode.value = 'grid'
    undoStack.value = []
    redoStack.value = []
    clipboard.value = null
    isDragging.value = false
  }

  // ==========================================================================
  // 返回
  // ==========================================================================

  return {
    // 状态
    editingArea,
    currentTool,
    selectedObjects,
    transformMode,
    transformSpace,
    snapMode,
    gridSnapSize,
    angleSnapSize,
    undoStack,
    redoStack,
    maxHistoryLength,
    clipboard,
    isDragging,
    showTransformControls,
    showBoundingBox,

    // 计算属性
    hasSelection,
    isMultiSelect,
    primarySelection,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    hasClipboard,
    selectedIds,

    // Actions - 编辑区域
    startEditing,
    stopEditing,
    markDirty,
    markSaved,

    // Actions - 工具
    setTool,
    setTransformMode,
    toggleTransformSpace,
    setSnapMode,
    setGridSnapSize,

    // Actions - 选择
    selectObject,
    selectObjects,
    deselectObject,
    clearSelection,
    selectAll,
    isSelected,

    // Actions - 历史
    pushHistory,
    undo,
    redo,
    clearHistory,

    // Actions - 剪贴板
    copy,
    cut,
    clearClipboard,

    // Actions - 拖拽
    startDragging,
    stopDragging,

    // Actions - 显示
    toggleTransformControls,
    toggleBoundingBox,

    // Actions - 重置
    reset,
  }
})
