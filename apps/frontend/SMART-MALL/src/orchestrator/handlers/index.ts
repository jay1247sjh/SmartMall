/**
 * ============================================================================
 * Orchestrator Action Handlers 注册入口 (handlers/index.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 1. 提供 registerAllHandlers() 统一注册所有 Handler
 * 2. 重新导出各子模块的 Handler 工厂函数
 *
 * 【设计原则】
 * 1. 依赖注入 — 通过 HandlerDependencies 接收领域层依赖
 * 2. 集中注册 — 一次调用完成所有 Handler 的创建和注册
 *
 * ============================================================================
 */

import type { NavigationBehavior } from '../../domain/behaviors/NavigationBehavior'
import type { HighlightBehavior } from '../../domain/behaviors/HighlightBehavior'
import type { Orchestrator } from '../Orchestrator'
import { ActionType } from '../types'

// 导航类 Handler 工厂
import {
  createNavigateToStoreHandler,
  createNavigateToAreaHandler,
  createNavigateToPositionHandler,
} from './navigation.handlers'

// 场景交互类 Handler 工厂
import {
  createHighlightStoreHandler,
  createHighlightAreaHandler,
  createClearHighlightHandler,
} from './scene.handlers'

// UI 类 Handler 工厂
import {
  createUIOpenPanelHandler,
  createUIClosePanelHandler,
  createUITogglePanelHandler,
} from './ui.handlers'

/**
 * Handler 注册所需的领域层依赖
 */
export interface HandlerDependencies {
  /** 导航行为实例 */
  navigationBehavior: NavigationBehavior
  /** 高亮行为实例 */
  highlightBehavior: HighlightBehavior
}

/**
 * 注册所有 Handler 到 Orchestrator
 *
 * 创建所有 Handler 实例并注册到 Orchestrator 的 Handler 注册表中。
 * 包含导航类（3 个）、场景交互类（3 个）、UI 类（3 个），共 9 个 Handler。
 *
 * @param orchestrator - Orchestrator 实例
 * @param dependencies - 领域层依赖
 */
export function registerAllHandlers(
  orchestrator: Orchestrator,
  dependencies: HandlerDependencies,
): void {
  const { navigationBehavior, highlightBehavior } = dependencies

  // ── 导航类 Handler ──
  orchestrator.registerHandler(
    ActionType.NAVIGATE_TO_STORE,
    createNavigateToStoreHandler(navigationBehavior),
  )
  orchestrator.registerHandler(
    ActionType.NAVIGATE_TO_AREA,
    createNavigateToAreaHandler(navigationBehavior),
  )
  orchestrator.registerHandler(
    ActionType.NAVIGATE_TO_POSITION,
    createNavigateToPositionHandler(navigationBehavior),
  )

  // ── 场景交互类 Handler ──
  orchestrator.registerHandler(
    ActionType.HIGHLIGHT_STORE,
    createHighlightStoreHandler(highlightBehavior),
  )
  orchestrator.registerHandler(
    ActionType.HIGHLIGHT_AREA,
    createHighlightAreaHandler(highlightBehavior),
  )
  orchestrator.registerHandler(
    ActionType.CLEAR_HIGHLIGHT,
    createClearHighlightHandler(highlightBehavior),
  )

  // ── UI 类 Handler ──
  orchestrator.registerHandler(ActionType.UI_OPEN_PANEL, createUIOpenPanelHandler())
  orchestrator.registerHandler(ActionType.UI_CLOSE_PANEL, createUIClosePanelHandler())
  orchestrator.registerHandler(ActionType.UI_TOGGLE_PANEL, createUITogglePanelHandler())
}

// ── 重新导出子模块工厂函数 ──
export {
  createNavigateToStoreHandler,
  createNavigateToAreaHandler,
  createNavigateToPositionHandler,
} from './navigation.handlers'

export {
  createHighlightStoreHandler,
  createHighlightAreaHandler,
  createClearHighlightHandler,
} from './scene.handlers'

export {
  createUIOpenPanelHandler,
  createUIClosePanelHandler,
  createUITogglePanelHandler,
} from './ui.handlers'
