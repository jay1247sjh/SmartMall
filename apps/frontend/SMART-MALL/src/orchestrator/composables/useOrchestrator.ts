/**
 * ============================================================================
 * useOrchestrator Composable (useOrchestrator.ts)
 * ============================================================================
 *
 * 【文件职责】
 * Vue Composable — Orchestrator 的使用入口。
 * 封装 Orchestrator 单例，提供类型安全的 dispatch 方法和响应式状态。
 *
 * 【核心功能】
 * 1. 类型安全的 dispatch<T>(type, payload, source?) — 根据 ActionType 推断 Payload
 * 2. 自动注入用户信息（userId、role、merchantId）和系统上下文（systemMode、spatial）
 * 3. 响应式状态：isProcessing、canUndo、canRedo、lastResult
 * 4. 代理方法：undo()、redo()、getRecentLogs()
 *
 * 【设计原则】
 * 1. 每次 dispatch 前同步 Pinia store 状态到 OrchestratorState
 * 2. 中间件引用通过模块级变量注入，由 initOrchestrator（Task 10）设置
 * 3. 保持最小化，不引入额外复杂度
 *
 * ============================================================================
 */

import { ref, computed } from 'vue'
import { Orchestrator } from '../Orchestrator'
import type { ActionResult, ActionLogEntry } from '../types'
import { ActionType, ActionSource, Role, SystemMode, TemporalState } from '../types'
import type { ActionPayloadMap } from '../../protocol/action.protocol'
import { ROLE_CAPABILITIES } from '../utils/permission-rules'
import { useUserStore } from '../../stores/user.store'
import { useSystemStore } from '../../stores/system.store'
import { useMallStore } from '../../stores/mall.store'
import type { HistoryMiddleware } from '../middlewares/HistoryMiddleware'
import type { LoggingMiddleware } from '../middlewares/LoggingMiddleware'

// ============================================================================
// 模块级中间件引用（由 initOrchestrator 设置）
// ============================================================================

/** HistoryMiddleware 实例引用 */
let _historyMiddleware: HistoryMiddleware | null = null

/** LoggingMiddleware 实例引用 */
let _loggingMiddleware: LoggingMiddleware | null = null

/**
 * 设置中间件引用
 *
 * 由 initOrchestrator（Task 10）调用，将中间件实例注入到 composable 中，
 * 使 undo/redo/getRecentLogs 等代理方法可以正常工作。
 */
export function setMiddlewareRefs(
  history: HistoryMiddleware | null,
  logging: LoggingMiddleware | null,
): void {
  _historyMiddleware = history
  _loggingMiddleware = logging
}

// ============================================================================
// Composable
// ============================================================================

/**
 * useOrchestrator — Vue 组件中使用 Orchestrator 的入口
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useOrchestrator } from '@/orchestrator/composables'
 * import { ActionType } from '@/orchestrator/types'
 *
 * const { dispatch, isProcessing, canUndo, undo } = useOrchestrator()
 *
 * async function handleNavigate(storeId: string) {
 *   const result = await dispatch(ActionType.NAVIGATE_TO_STORE, { storeId })
 *   if (!result.success) {
 *     console.error(result.error?.message)
 *   }
 * }
 * </script>
 * ```
 */
export function useOrchestrator() {
  const orchestrator = Orchestrator.getInstance()
  const userStore = useUserStore()
  const systemStore = useSystemStore()
  const mallStore = useMallStore()

  // ==========================================================================
  // 响应式状态
  // ==========================================================================

  /** 是否正在处理 Action */
  const isProcessing = ref(false)

  /** 最近一次 dispatch 的结果 */
  const lastResult = ref<ActionResult | null>(null)

  /** 是否可以撤销 */
  const canUndo = computed(() => _historyMiddleware?.canUndo() ?? false)

  /** 是否可以重做 */
  const canRedo = computed(() => _historyMiddleware?.canRedo() ?? false)

  // ==========================================================================
  // 内部方法
  // ==========================================================================

  /**
   * 将 UserType 字符串映射为 Role 枚举
   */
  function mapRole(userType: string | null): Role {
    switch (userType) {
      case 'ADMIN': return Role.ADMIN
      case 'MERCHANT': return Role.MERCHANT
      case 'USER': return Role.USER
      default: return Role.USER
    }
  }

  /**
   * 将 SystemMode 字符串映射为 SystemMode 枚举
   */
  function mapSystemMode(mode: string): SystemMode {
    return mode === 'CONFIG' ? SystemMode.CONFIG : SystemMode.RUNTIME
  }

  /**
   * 同步 Pinia store 状态到 OrchestratorState
   *
   * 每次 dispatch 前调用，确保 Orchestrator 拥有最新的用户和系统上下文。
   */
  function syncState(): void {
    const role = mapRole(userStore.role)

    orchestrator.updateState({
      user: userStore.isAuthenticated
        ? {
            userId: userStore.userId ?? '',
            role,
            merchantId: userStore.merchantId ?? undefined,
            capabilities: ROLE_CAPABILITIES[role] ?? [],
          }
        : null,
      systemMode: mapSystemMode(systemStore.mode),
      temporalState: TemporalState.READY,
      spatial: {
        currentFloorId: mallStore.currentFloorId ?? undefined,
        currentAreaId: mallStore.selectedAreaId ?? undefined,
        currentStoreId: mallStore.selectedStoreId ?? undefined,
      },
    })
  }

  // ==========================================================================
  // 公共方法
  // ==========================================================================

  /**
   * 分发 Action（类型安全，自动注入上下文）
   *
   * @param type - ActionType 枚举值
   * @param payload - 对应 ActionType 的 Payload（自动推断类型）
   * @param source - Action 来源，默认 ActionSource.UI
   * @returns ActionResult 执行结果
   */
  async function dispatch<T extends ActionType>(
    type: T,
    payload: ActionPayloadMap[T],
    source: ActionSource = ActionSource.UI,
  ): Promise<ActionResult> {
    // 同步最新状态
    syncState()

    isProcessing.value = true

    try {
      const result = await orchestrator.dispatch({
        type,
        payload,
        source,
        timestamp: 0,   // Orchestrator.dispatch 会自动填充
        actionId: '',    // Orchestrator.dispatch 会自动填充
        userId: userStore.userId ?? undefined,
      })

      lastResult.value = result
      return result
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 撤销最近一条操作
   */
  async function undo(): Promise<ActionResult> {
    if (!_historyMiddleware) {
      return {
        success: false,
        error: { code: 'UNDO_FAILED', message: '历史记录中间件未初始化' },
        meta: {
          actionId: '',
          actionType: ActionType.BUILDER_EXIT,
          source: ActionSource.SYSTEM,
          timestamp: Date.now(),
          duration: 0,
        },
      }
    }

    const record = _historyMiddleware.undo()
    if (!record) {
      return {
        success: false,
        error: { code: 'UNDO_FAILED', message: '没有可撤销的操作' },
        meta: {
          actionId: '',
          actionType: ActionType.BUILDER_EXIT,
          source: ActionSource.SYSTEM,
          timestamp: Date.now(),
          duration: 0,
        },
      }
    }

    return {
      success: true,
      data: record,
      meta: {
        actionId: record.id,
        actionType: record.action.type,
        source: ActionSource.SYSTEM,
        timestamp: Date.now(),
        duration: 0,
      },
    }
  }

  /**
   * 重做最近一条被撤销的操作
   */
  async function redo(): Promise<ActionResult> {
    if (!_historyMiddleware) {
      return {
        success: false,
        error: { code: 'REDO_FAILED', message: '历史记录中间件未初始化' },
        meta: {
          actionId: '',
          actionType: ActionType.BUILDER_EXIT,
          source: ActionSource.SYSTEM,
          timestamp: Date.now(),
          duration: 0,
        },
      }
    }

    const record = _historyMiddleware.redo()
    if (!record) {
      return {
        success: false,
        error: { code: 'REDO_FAILED', message: '没有可重做的操作' },
        meta: {
          actionId: '',
          actionType: ActionType.BUILDER_EXIT,
          source: ActionSource.SYSTEM,
          timestamp: Date.now(),
          duration: 0,
        },
      }
    }

    return {
      success: true,
      data: record,
      meta: {
        actionId: record.id,
        actionType: record.action.type,
        source: ActionSource.SYSTEM,
        timestamp: Date.now(),
        duration: 0,
      },
    }
  }

  /**
   * 查询最近 N 条 Action 日志
   *
   * @param count - 要返回的日志条数
   * @returns 按时间倒序排列的日志数组
   */
  function getRecentLogs(count: number = 20): ActionLogEntry[] {
    if (!_loggingMiddleware) {
      return []
    }
    return _loggingMiddleware.getRecentLogs(count)
  }

  // ==========================================================================
  // 返回
  // ==========================================================================

  return {
    dispatch,
    isProcessing,
    canUndo,
    canRedo,
    lastResult,
    undo,
    redo,
    getRecentLogs,
  }
}
