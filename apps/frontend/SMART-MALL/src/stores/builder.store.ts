/**
 * ============================================================================
 * 建模器状态 Store (Builder Store)
 * ============================================================================
 *
 * 【业务职责】
 * 管理 Smart Mall 3D 建模器的编辑状态。建模器是商家装修店铺的核心工具，
 * 允许商家在获得区域授权后，自主设计和布置自己的 3D 店铺空间。
 *
 * 【建模器功能概述】
 * 建模器提供类似 3D 建模软件的操作体验：
 * 1. 对象选择 - 点击选中 3D 对象，支持多选
 * 2. 变换操作 - 移动、旋转、缩放选中的对象
 * 3. 绘制工具 - 绘制区域边界、墙体等
 * 4. 物品放置 - 从素材库拖拽物品到场景
 * 5. 撤销重做 - 完整的操作历史记录
 * 6. 复制粘贴 - 快速复制场景元素
 *
 * 【工具类型说明】
 * - select（选择）：默认工具，点击选中对象
 * - move（移动）：拖拽移动选中对象的位置
 * - rotate（旋转）：旋转选中对象的朝向
 * - scale（缩放）：调整选中对象的大小
 * - draw-area（绘制区域）：绘制店铺的功能区域
 * - draw-wall（绘制墙体）：绘制隔断墙
 * - place-item（放置物品）：从素材库放置家具、货架等
 *
 * 【变换控制】
 * 变换操作支持两种坐标空间：
 * - world（世界坐标）：相对于场景原点，适合精确定位
 * - local（本地坐标）：相对于对象自身，适合沿对象方向移动
 *
 * 【吸附功能】
 * 为了方便对齐，提供多种吸附模式：
 * - none（无吸附）：自由移动
 * - grid（网格吸附）：吸附到网格点，默认 0.5 米
 * - vertex（顶点吸附）：吸附到其他对象的顶点
 * - edge（边缘吸附）：吸附到其他对象的边缘
 *
 * 【历史记录机制】
 * 采用命令模式实现撤销/重做：
 * - 每个操作记录 undoData（撤销数据）和 redoData（重做数据）
 * - undoStack 存储可撤销的操作
 * - redoStack 存储可重做的操作
 * - 新操作会清空 redoStack
 * - 历史栈有最大长度限制（默认 50），防止内存溢出
 *
 * 【编辑会话管理】
 * - startEditing()：开始编辑某个区域，初始化编辑状态
 * - stopEditing()：结束编辑，清理状态
 * - isDirty：标记是否有未保存的更改，用于离开提示
 *
 * 【与 Three.js 的集成】
 * - selectedObjects 中的 uuid 对应 Three.js 对象的 UUID
 * - 变换操作通过 TransformControls 实现
 * - 选择操作通过 Raycaster 射线检测实现
 * ============================================================================
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
