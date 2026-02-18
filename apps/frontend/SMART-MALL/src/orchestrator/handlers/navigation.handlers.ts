/**
 * ============================================================================
 * 导航类 Action Handler (navigation.handlers.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 将 NavigationBehavior 的导航方法包装为 ActionHandler，
 * 适配 NavigationResult → ActionResult 的类型转换。
 *
 * 【处理的 ActionType】
 * - NAVIGATE_TO_STORE：导航到指定店铺
 * - NAVIGATE_TO_AREA：导航到指定区域
 * - NAVIGATE_TO_POSITION：导航到指定坐标位置
 *
 * 【设计原则】
 * 1. 纯适配器函数 — 不包含业务逻辑
 * 2. 依赖注入 — 通过工厂函数接收 NavigationBehavior
 * 3. 类型安全 — 使用泛型约束 Action 类型
 *
 * ============================================================================
 */

import type { NavigationBehavior, NavigationResult } from '../../domain/behaviors/NavigationBehavior'
import type { Action } from '../../protocol/action.protocol'
import type { ActionResult, ActionHandler } from '../types'
import { ActionType } from '../types'

/**
 * 将 NavigationResult 适配为 ActionResult
 *
 * @param navResult - NavigationBehavior 返回的导航结果
 * @param action - 原始 Action（用于填充 meta）
 * @returns 统一的 ActionResult
 */
function adaptNavigationResult(navResult: NavigationResult, action: Action): ActionResult {
  return {
    success: navResult.success,
    data: navResult.success ? { navigated: true } : undefined,
    error: navResult.success
      ? undefined
      : {
          code: 'NAVIGATION_FAILED',
          message: navResult.message ?? '导航失败',
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
 * 创建"导航到店铺"Handler
 *
 * 包装 NavigationBehavior.navigateToStore，
 * 从 payload 中提取 storeId 和 duration 并调用导航。
 *
 * @param navigationBehavior - NavigationBehavior 实例（依赖注入）
 * @returns ActionHandler
 */
export function createNavigateToStoreHandler(
  navigationBehavior: NavigationBehavior
): ActionHandler<ActionType.NAVIGATE_TO_STORE> {
  return {
    handle(action: Action<ActionType.NAVIGATE_TO_STORE>): ActionResult {
      const { storeId, duration } = action.payload
      const navResult = navigationBehavior.navigateToStore(storeId, { duration })
      return adaptNavigationResult(navResult, action)
    },
  }
}

/**
 * 创建"导航到区域"Handler
 *
 * 包装 NavigationBehavior.navigateToArea，
 * 从 payload 中提取 areaId 和 duration 并调用导航。
 *
 * @param navigationBehavior - NavigationBehavior 实例（依赖注入）
 * @returns ActionHandler
 */
export function createNavigateToAreaHandler(
  navigationBehavior: NavigationBehavior
): ActionHandler<ActionType.NAVIGATE_TO_AREA> {
  return {
    handle(action: Action<ActionType.NAVIGATE_TO_AREA>): ActionResult {
      const { areaId, duration } = action.payload
      const navResult = navigationBehavior.navigateToArea(areaId, { duration })
      return adaptNavigationResult(navResult, action)
    },
  }
}

/**
 * 创建"导航到坐标位置"Handler
 *
 * 注意：NavigationBehavior 当前不支持 navigateToPosition 方法，
 * 此 Handler 返回成功结果作为占位实现，待后续扩展。
 *
 * TODO: 当 NavigationBehavior 支持 navigateToPosition 后，替换为实际调用
 *
 * @param _navigationBehavior - NavigationBehavior 实例（当前未使用）
 * @returns ActionHandler
 */
export function createNavigateToPositionHandler(
  _navigationBehavior: NavigationBehavior
): ActionHandler<ActionType.NAVIGATE_TO_POSITION> {
  return {
    handle(action: Action<ActionType.NAVIGATE_TO_POSITION>): ActionResult {
      // TODO: NavigationBehavior 尚未实现 navigateToPosition，暂返回成功
      return {
        success: true,
        data: { navigated: true, position: action.payload.position },
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
