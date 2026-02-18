/**
 * ============================================================================
 * UI 类 Action Handler (ui.handlers.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 处理 UI 面板相关的 Action，返回面板操作意图的确认结果。
 * 实际的 UI 状态变更由消费 ActionResult 的 Vue 组件驱动。
 *
 * 【处理的 ActionType】
 * - UI_OPEN_PANEL：打开指定面板
 * - UI_CLOSE_PANEL：关闭指定面板
 * - UI_TOGGLE_PANEL：切换指定面板的开关状态
 *
 * 【设计原则】
 * 1. 纯适配器函数 — 不包含业务逻辑
 * 2. 无外部依赖 — 轻量级 Handler，仅确认意图并返回 payload 数据
 * 3. 类型安全 — 使用泛型约束 Action 类型
 *
 * ============================================================================
 */

import type { Action } from '../../protocol/action.protocol'
import type { ActionResult, ActionHandler } from '../types'
import { ActionType } from '../types'

/**
 * 创建"打开面板"Handler
 *
 * 确认打开面板的意图，将 panelId 和 data 作为结果数据返回。
 * Vue 组件根据 ActionResult 驱动实际的面板显示。
 *
 * @returns ActionHandler
 */
export function createUIOpenPanelHandler(): ActionHandler<ActionType.UI_OPEN_PANEL> {
  return {
    handle(action: Action<ActionType.UI_OPEN_PANEL>): ActionResult {
      const { panelId, data } = action.payload
      return {
        success: true,
        data: { panelId, data, operation: 'open' },
        meta: {
          actionId: action.actionId ?? '',
          actionType: action.type,
          source: action.source,
          timestamp: action.timestamp,
          duration: 0,
        },
      }
    },
  }
}

/**
 * 创建"关闭面板"Handler
 *
 * 确认关闭面板的意图，将 panelId 作为结果数据返回。
 * Vue 组件根据 ActionResult 驱动实际的面板隐藏。
 *
 * @returns ActionHandler
 */
export function createUIClosePanelHandler(): ActionHandler<ActionType.UI_CLOSE_PANEL> {
  return {
    handle(action: Action<ActionType.UI_CLOSE_PANEL>): ActionResult {
      const { panelId } = action.payload
      return {
        success: true,
        data: { panelId, operation: 'close' },
        meta: {
          actionId: action.actionId ?? '',
          actionType: action.type,
          source: action.source,
          timestamp: action.timestamp,
          duration: 0,
        },
      }
    },
  }
}

/**
 * 创建"切换面板"Handler
 *
 * 确认切换面板的意图，将 panelId 作为结果数据返回。
 * Vue 组件根据 ActionResult 驱动实际的面板状态切换。
 *
 * @returns ActionHandler
 */
export function createUITogglePanelHandler(): ActionHandler<ActionType.UI_TOGGLE_PANEL> {
  return {
    handle(action: Action<ActionType.UI_TOGGLE_PANEL>): ActionResult {
      const { panelId } = action.payload
      return {
        success: true,
        data: { panelId, operation: 'toggle' },
        meta: {
          actionId: action.actionId ?? '',
          actionType: action.type,
          source: action.source,
          timestamp: action.timestamp,
          duration: 0,
        },
      }
    },
  }
}
