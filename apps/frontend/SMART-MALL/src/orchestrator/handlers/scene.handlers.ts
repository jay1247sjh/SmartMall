/**
 * ============================================================================
 * 场景交互类 Action Handler (scene.handlers.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 将 HighlightBehavior 的高亮方法包装为 ActionHandler，
 * 适配 boolean/void → ActionResult 的类型转换。
 *
 * 【处理的 ActionType】
 * - HIGHLIGHT_STORE：高亮指定店铺
 * - HIGHLIGHT_AREA：高亮指定区域（HighlightBehavior 暂无此方法，使用 highlightStore 作为降级）
 * - CLEAR_HIGHLIGHT：清除所有高亮效果
 *
 * 【设计原则】
 * 1. 纯适配器函数 — 不包含业务逻辑
 * 2. 依赖注入 — 通过工厂函数接收 HighlightBehavior
 * 3. 类型安全 — 使用泛型约束 Action 类型
 *
 * ============================================================================
 */

import type { HighlightBehavior } from '../../domain/behaviors/HighlightBehavior'
import type { Action } from '../../protocol/action.protocol'
import type { ActionResult, ActionHandler } from '../types'
import { ActionType } from '../types'

/**
 * 将 boolean 结果适配为 ActionResult
 *
 * @param result - HighlightBehavior 返回的布尔值
 * @param action - 原始 Action（用于填充 meta）
 * @param errorMessage - 失败时的错误描述
 * @returns 统一的 ActionResult
 */
function adaptBooleanResult(result: boolean, action: Action, errorMessage: string): ActionResult {
  return {
    success: result,
    data: result ? { highlighted: true } : undefined,
    error: result
      ? undefined
      : {
          code: 'HIGHLIGHT_FAILED',
          message: errorMessage,
        },
    meta: {
      actionId: action.actionId ?? '',
      actionType: action.type,
      source: action.source,
      timestamp: action.timestamp,
      duration: 0,
    },
  }
}

/**
 * 创建"高亮店铺"Handler
 *
 * 包装 HighlightBehavior.highlightStore，
 * 从 payload 中提取 storeId 并调用高亮。
 *
 * @param highlightBehavior - HighlightBehavior 实例（依赖注入）
 * @returns ActionHandler
 */
export function createHighlightStoreHandler(
  highlightBehavior: HighlightBehavior
): ActionHandler<ActionType.HIGHLIGHT_STORE> {
  return {
    handle(action: Action<ActionType.HIGHLIGHT_STORE>): ActionResult {
      const { storeId } = action.payload
      const result = highlightBehavior.highlightStore(storeId)
      return adaptBooleanResult(result, action, `高亮店铺失败：找不到店铺 (${storeId})`)
    },
  }
}

/**
 * 创建"高亮区域"Handler
 *
 * 注意：HighlightBehavior 当前不支持 highlightArea 方法，
 * 使用 highlightStore 作为降级实现（通过 areaId 查找对应 Mesh）。
 *
 * TODO: 当 HighlightBehavior 支持 highlightArea 后，替换为实际调用
 *
 * @param highlightBehavior - HighlightBehavior 实例（依赖注入）
 * @returns ActionHandler
 */
export function createHighlightAreaHandler(
  highlightBehavior: HighlightBehavior
): ActionHandler<ActionType.HIGHLIGHT_AREA> {
  return {
    handle(action: Action<ActionType.HIGHLIGHT_AREA>): ActionResult {
      const { areaId } = action.payload
      // HighlightBehavior 暂无 highlightArea，降级使用 highlightStore
      const result = highlightBehavior.highlightStore(areaId)
      return adaptBooleanResult(result, action, `高亮区域失败：找不到区域 (${areaId})`)
    },
  }
}

/**
 * 创建"清除高亮"Handler
 *
 * 包装 HighlightBehavior.clearHighlight，
 * clearHighlight 返回 void，始终返回成功的 ActionResult。
 *
 * @param highlightBehavior - HighlightBehavior 实例（依赖注入）
 * @returns ActionHandler
 */
export function createClearHighlightHandler(
  highlightBehavior: HighlightBehavior
): ActionHandler<ActionType.CLEAR_HIGHLIGHT> {
  return {
    handle(action: Action<ActionType.CLEAR_HIGHLIGHT>): ActionResult {
      highlightBehavior.clearHighlight()
      return {
        success: true,
        data: { cleared: true },
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
