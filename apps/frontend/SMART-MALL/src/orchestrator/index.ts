/**
 * ============================================================================
 * Orchestrator 业务协调层 — 公共导出与初始化 (index.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 1. 提供 initOrchestrator() 初始化函数，完成中间件注册和 Handler 注册
 * 2. 统一导出核心类型、Orchestrator 类、composable、中间件、Handler
 *
 * 【初始化流程】
 * initOrchestrator(dependencies)
 *   → 获取 Orchestrator 单例
 *   → 创建并注册内置中间件（Logging → Permission → History）
 *   → 设置 composable 中间件引用
 *   → 注册所有 Handler
 *   → 返回 Orchestrator 实例
 *
 * ============================================================================
 */

import { Orchestrator } from './Orchestrator'
import { LoggingMiddleware } from './middlewares/LoggingMiddleware'
import { PermissionMiddleware } from './middlewares/PermissionMiddleware'
import { HistoryMiddleware } from './middlewares/HistoryMiddleware'
import { registerAllHandlers } from './handlers'
import type { HandlerDependencies } from './handlers'
import { setMiddlewareRefs } from './composables/useOrchestrator'

// ============================================================================
// 初始化函数
// ============================================================================

/**
 * 初始化 Orchestrator
 *
 * 创建并注册内置中间件，注册所有 Handler，返回就绪的 Orchestrator 实例。
 * 中间件注册顺序：Logging → Permission → History
 * （Logging 包裹一切以记录完整日志，Permission 在 History 之前拦截非法操作）
 *
 * @param dependencies - Handler 所需的领域层依赖（NavigationBehavior、HighlightBehavior）
 * @returns Orchestrator 实例
 */
export function initOrchestrator(dependencies: HandlerDependencies): Orchestrator {
  const orchestrator = Orchestrator.getInstance()

  // ── 创建内置中间件 ──
  const loggingMiddleware = new LoggingMiddleware()
  const permissionMiddleware = new PermissionMiddleware()
  const historyMiddleware = new HistoryMiddleware()

  // ── 按顺序注册中间件（洋葱模型：外 → 内） ──
  orchestrator.use(loggingMiddleware)
  orchestrator.use(permissionMiddleware)
  orchestrator.use(historyMiddleware)

  // ── 将中间件引用注入 composable ──
  setMiddlewareRefs(historyMiddleware, loggingMiddleware)

  // ── 注册所有 Handler ──
  registerAllHandlers(orchestrator, dependencies)

  return orchestrator
}

// ============================================================================
// 核心类型导出
// ============================================================================

export type {
  ActionResult,
  ActionHandler,
  ActionHandlerFn,
  ActionMiddleware,
  MiddlewareContext,
  MiddlewareNext,
  OrchestratorState,
  ActionLogEntry,
  HistoryRecord,
  Action,
} from './types'

export {
  ActionType,
  ActionSource,
  Role,
  Capability,
  SystemMode,
  TemporalState,
} from './types'

// ============================================================================
// 核心类导出
// ============================================================================

export { Orchestrator } from './Orchestrator'

// ============================================================================
// Composable 导出
// ============================================================================

export { useOrchestrator, setMiddlewareRefs } from './composables/useOrchestrator'

// ============================================================================
// 中间件导出
// ============================================================================

export { LoggingMiddleware } from './middlewares/LoggingMiddleware'
export { PermissionMiddleware } from './middlewares/PermissionMiddleware'
export { HistoryMiddleware } from './middlewares/HistoryMiddleware'

// ============================================================================
// Handler 导出
// ============================================================================

export { registerAllHandlers } from './handlers'
export type { HandlerDependencies } from './handlers'
