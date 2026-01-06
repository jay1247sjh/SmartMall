/**
 * ============================================================================
 * 系统状态 Store (System Store)
 * ============================================================================
 *
 * 【业务职责】
 * 管理 Smart Mall 系统级别的全局状态，包括运行模式、UI 面板、
 * 加载状态、消息提示等。这是应用的"控制中心"。
 *
 * 【双模式架构】
 * Smart Mall 采用双模式设计，同一个 3D 场景有两种使用方式：
 *
 * 1. RUNTIME（运行态）- 面向访客
 *    - 用户浏览商城、查看店铺、购物
 *    - 3D 场景只读，不可编辑
 *    - 隐藏辅助元素（网格、坐标轴）
 *    - 提供导航、搜索、购物车等功能
 *
 * 2. CONFIG（配置态）- 面向商家/管理员
 *    - 商家装修自己的店铺
 *    - 管理员配置商城布局
 *    - 3D 场景可编辑
 *    - 显示辅助元素帮助定位
 *    - 提供建模工具栏
 *
 * 【模式切换场景】
 * - 商家点击"编辑店铺" → 进入 CONFIG 模式
 * - 商家点击"预览" → 进入 RUNTIME 模式
 * - 管理员进入布局管理 → 进入 CONFIG 模式
 * - 普通用户浏览 → 始终是 RUNTIME 模式
 *
 * 【面板管理系统】
 * 管理各种可开关的 UI 面板：
 * - store-detail：店铺详情面板（显示店铺信息、商品列表）
 * - area-detail：区域详情面板（显示区域信息、入驻状态）
 * - floor-selector：楼层选择器（切换楼层）
 * - search：搜索面板（搜索店铺、商品）
 * - chat：AI 对话面板（智能导购助手）
 * - builder-tools：建模工具面板（CONFIG 模式专用）
 * - settings：设置面板（用户偏好设置）
 * - user-profile：用户信息面板（个人中心入口）
 * - notifications：通知面板（系统消息）
 *
 * 【Toast 消息系统】
 * 提供全局的消息提示功能：
 * - success()：成功提示，绿色
 * - error()：错误提示，红色
 * - warning()：警告提示，橙色
 * - info()：信息提示，蓝色
 * 支持自动消失和手动关闭。
 *
 * 【调试功能】
 * 开发和调试时使用的辅助功能：
 * - showGrid：显示地面网格，帮助定位
 * - showAxes：显示 XYZ 坐标轴
 * - debugMode：开启调试模式，显示额外信息
 * - logLevel：控制日志输出级别
 *
 * 【全局加载状态】
 * 管理全局的加载遮罩：
 * - showLoading('加载中...')：显示加载遮罩
 * - hideLoading()：隐藏加载遮罩
 * 用于页面切换、数据加载等需要阻塞用户操作的场景。
 * ============================================================================
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
