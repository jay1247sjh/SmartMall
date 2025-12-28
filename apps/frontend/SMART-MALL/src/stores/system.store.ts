/**
 * 系统状态 Store
 * 
 * 职责：
 * - 管理系统模式（CONFIG / RUNTIME）
 * - 管理全局 UI 状态（面板、加载）
 * - 管理调试选项（网格、坐标轴、日志级别）
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============================================================================
// 类型定义
// ============================================================================

/** 系统模式 */
export type SystemMode = 'CONFIG' | 'RUNTIME'

/** 日志级别 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

/** 面板ID */
export type PanelId =
  | 'store-detail'      // 店铺详情
  | 'area-detail'       // 区域详情
  | 'floor-selector'    // 楼层选择器
  | 'search'            // 搜索面板
  | 'chat'              // AI 对话
  | 'builder-tools'     // 建模工具
  | 'settings'          // 设置
  | 'user-profile'      // 用户信息
  | 'notifications'     // 通知

/** 面板状态 */
export interface PanelState {
  isOpen: boolean
  data?: Record<string, unknown>
}

/** Toast 消息类型 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/** Toast 消息 */
export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// ============================================================================
// Store 定义
// ============================================================================

export const useSystemStore = defineStore('system', () => {
  // ==========================================================================
  // 状态
  // ==========================================================================

  /** 系统模式：CONFIG（配置态）或 RUNTIME（运行态） */
  const mode = ref<SystemMode>('RUNTIME')

  /** 日志级别 */
  const logLevel = ref<LogLevel>('INFO')

  /** 面板状态 Map */
  const panels = ref<Map<PanelId, PanelState>>(new Map())

  /** 全局加载状态 */
  const isGlobalLoading = ref(false)

  /** 全局加载提示文字 */
  const loadingText = ref<string>('')

  /** 是否显示辅助网格（配置态用） */
  const showGrid = ref(false)

  /** 是否显示坐标轴（配置态用） */
  const showAxes = ref(false)

  /** 是否开启调试模式 */
  const debugMode = ref(false)

  /** Toast 消息队列 */
  const toasts = ref<ToastMessage[]>([])

  /** 是否已初始化 */
  const isInitialized = ref(false)

  // ==========================================================================
  // 计算属性
  // ==========================================================================

  /** 是否是配置态 */
  const isConfigMode = computed(() => mode.value === 'CONFIG')

  /** 是否是运行态 */
  const isRuntimeMode = computed(() => mode.value === 'RUNTIME')

  /** 是否有任何面板打开 */
  const hasOpenPanel = computed(() => {
    for (const state of panels.value.values()) {
      if (state.isOpen) return true
    }
    return false
  })

  /** 当前打开的面板列表 */
  const openPanels = computed(() => {
    const result: PanelId[] = []
    panels.value.forEach((state, id) => {
      if (state.isOpen) result.push(id)
    })
    return result
  })

  /** 是否应该显示调试工具 */
  const shouldShowDebugTools = computed(() => debugMode.value && logLevel.value === 'DEBUG')

  // ==========================================================================
  // Actions - 模式切换
  // ==========================================================================

  /** 切换到配置态 */
  function enterConfigMode() {
    mode.value = 'CONFIG'
    showGrid.value = true
    showAxes.value = true
  }

  /** 切换到运行态 */
  function enterRuntimeMode() {
    mode.value = 'RUNTIME'
    showGrid.value = false
    showAxes.value = false
    // 关闭建模相关面板
    closePanel('builder-tools')
  }

  /** 切换模式 */
  function toggleMode() {
    if (isConfigMode.value) {
      enterRuntimeMode()
    } else {
      enterConfigMode()
    }
  }

  // ==========================================================================
  // Actions - 面板管理
  // ==========================================================================

  /** 打开面板 */
  function openPanel(panelId: PanelId, data?: Record<string, unknown>) {
    panels.value.set(panelId, { isOpen: true, data })
  }

  /** 关闭面板 */
  function closePanel(panelId: PanelId) {
    const state = panels.value.get(panelId)
    if (state) {
      panels.value.set(panelId, { ...state, isOpen: false })
    }
  }

  /** 切换面板 */
  function togglePanel(panelId: PanelId, data?: Record<string, unknown>) {
    const state = panels.value.get(panelId)
    if (state?.isOpen) {
      closePanel(panelId)
    } else {
      openPanel(panelId, data)
    }
  }

  /** 关闭所有面板 */
  function closeAllPanels() {
    panels.value.forEach((_, id) => closePanel(id))
  }

  /** 获取面板数据 */
  function getPanelData(panelId: PanelId): Record<string, unknown> | undefined {
    return panels.value.get(panelId)?.data
  }

  /** 检查面板是否打开 */
  function isPanelOpen(panelId: PanelId): boolean {
    return panels.value.get(panelId)?.isOpen ?? false
  }

  /** 更新面板数据 */
  function updatePanelData(panelId: PanelId, data: Record<string, unknown>) {
    const state = panels.value.get(panelId)
    if (state) {
      panels.value.set(panelId, { ...state, data: { ...state.data, ...data } })
    }
  }

  // ==========================================================================
  // Actions - 加载状态
  // ==========================================================================

  /** 显示全局加载 */
  function showLoading(text: string = '加载中...') {
    isGlobalLoading.value = true
    loadingText.value = text
  }

  /** 隐藏全局加载 */
  function hideLoading() {
    isGlobalLoading.value = false
    loadingText.value = ''
  }

  // ==========================================================================
  // Actions - Toast 消息
  // ==========================================================================

  /** 生成唯一ID */
  function generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  /** 显示 Toast */
  function showToast(type: ToastType, message: string, duration: number = 3000) {
    const id = generateId()
    toasts.value.push({ id, type, message, duration })

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  /** 移除 Toast */
  function removeToast(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  /** 清空所有 Toast */
  function clearToasts() {
    toasts.value = []
  }

  /** 快捷方法 */
  function success(message: string, duration?: number) {
    return showToast('success', message, duration)
  }

  function error(message: string, duration?: number) {
    return showToast('error', message, duration)
  }

  function warning(message: string, duration?: number) {
    return showToast('warning', message, duration)
  }

  function info(message: string, duration?: number) {
    return showToast('info', message, duration)
  }

  // ==========================================================================
  // Actions - 调试
  // ==========================================================================

  /** 设置日志级别 */
  function setLogLevel(level: LogLevel) {
    logLevel.value = level
  }

  /** 切换调试模式 */
  function toggleDebugMode() {
    debugMode.value = !debugMode.value
  }

  /** 切换网格显示 */
  function toggleGrid() {
    showGrid.value = !showGrid.value
  }

  /** 切换坐标轴显示 */
  function toggleAxes() {
    showAxes.value = !showAxes.value
  }

  // ==========================================================================
  // Actions - 初始化
  // ==========================================================================

  /** 标记系统已初始化 */
  function setInitialized() {
    isInitialized.value = true
  }

  /** 重置系统状态 */
  function reset() {
    mode.value = 'RUNTIME'
    panels.value.clear()
    isGlobalLoading.value = false
    loadingText.value = ''
    showGrid.value = false
    showAxes.value = false
    toasts.value = []
  }

  // ==========================================================================
  // 返回
  // ==========================================================================

  return {
    // 状态
    mode,
    logLevel,
    panels,
    isGlobalLoading,
    loadingText,
    showGrid,
    showAxes,
    debugMode,
    toasts,
    isInitialized,

    // 计算属性
    isConfigMode,
    isRuntimeMode,
    hasOpenPanel,
    openPanels,
    shouldShowDebugTools,

    // Actions - 模式
    enterConfigMode,
    enterRuntimeMode,
    toggleMode,

    // Actions - 面板
    openPanel,
    closePanel,
    togglePanel,
    closeAllPanels,
    getPanelData,
    isPanelOpen,
    updatePanelData,

    // Actions - 加载
    showLoading,
    hideLoading,

    // Actions - Toast
    showToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,

    // Actions - 调试
    setLogLevel,
    toggleDebugMode,
    toggleGrid,
    toggleAxes,

    // Actions - 初始化
    setInitialized,
    reset,
  }
})
