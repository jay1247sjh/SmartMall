/**
 * ============================================================================
 * 权限校验中间件 (PermissionMiddleware.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 基于 RCAC（Role + Capability + Context）模型校验 Action 是否允许执行。
 * 作为 Orchestrator 中间件管道的核心环节，在 Action 到达 Handler 之前
 * 进行权限拦截。
 *
 * 【校验流程】
 * 1. 登录检查：未登录用户拒绝所有 Action
 * 2. RUNTIME 模式检查：运行态下拒绝写操作
 * 3. 能力检查：根据 ACTION_CAPABILITY_MAP 校验用户是否具备所需能力
 * 4. 上下文检查：商家区域权限校验（EDIT_AUTHORIZED_AREA 相关）
 *
 * 【AI Agent 平权】
 * Action 的 source 字段（UI / AGENT / SYSTEM）在权限判定中被忽略，
 * 所有来源的 Action 使用完全相同的权限规则。
 *
 * ============================================================================
 */

import type {
  ActionMiddleware,
  MiddlewareContext,
  MiddlewareNext,
  ActionResult,
  Action,
} from '../types'
import { Capability, SystemMode } from '../types'
import { ACTION_CAPABILITY_MAP, WRITE_ACTION_TYPES } from '../utils/permission-rules'

/**
 * 创建权限拒绝的 ActionResult
 *
 * @param action - 被拒绝的 Action
 * @param reason - 拒绝原因（用户友好的中文描述）
 * @param missingCapabilities - 缺少的能力列表（可选）
 */
function createPermissionDenied(
  action: Action,
  reason: string,
  missingCapabilities?: Capability[],
): ActionResult {
  return {
    success: false,
    error: {
      code: 'PERMISSION_DENIED',
      message: reason,
      details: missingCapabilities ? { missingCapabilities } : undefined,
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
 * 权限校验中间件
 *
 * 基于 RCAC 模型对 Action 进行三要素校验：
 * - Role（角色）：通过用户的 capabilities 列表体现
 * - Capability（能力）：ACTION_CAPABILITY_MAP 定义每种 Action 所需能力
 * - Context（上下文）：系统模式、区域授权等运行时上下文
 *
 * AI Agent 平权原则：source 字段在校验中被完全忽略。
 */
export class PermissionMiddleware implements ActionMiddleware {
  /** 中间件名称 */
  name = 'PermissionMiddleware'

  /**
   * 执行权限校验
   *
   * @param context - 中间件上下文（包含 action 和 state）
   * @param next - 下一个中间件
   * @returns ActionResult — 校验通过则调用 next，否则返回拒绝结果
   */
  async execute(
    context: MiddlewareContext,
    next: MiddlewareNext,
  ): Promise<ActionResult> {
    const { action, state } = context

    // 1. 登录检查：未登录用户拒绝所有 Action
    if (!state.user) {
      return createPermissionDenied(action, '未登录，请先登录后再操作')
    }

    // 2. RUNTIME 模式检查：运行态下拒绝写操作
    if (
      state.systemMode === SystemMode.RUNTIME
      && WRITE_ACTION_TYPES.has(action.type)
    ) {
      return createPermissionDenied(action, '运行态下不允许执行写操作')
    }

    // 3. 能力检查：校验用户是否具备执行该 Action 所需的全部能力
    const requiredCapabilities = ACTION_CAPABILITY_MAP[action.type]
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      const userCapabilities = new Set(state.user.capabilities)
      const missing = requiredCapabilities.filter(
        (cap) => !userCapabilities.has(cap),
      )

      if (missing.length > 0) {
        return createPermissionDenied(
          action,
          `权限不足，缺少以下能力：${missing.join(', ')}`,
          missing,
        )
      }
    }

    // 4. 上下文检查：商家区域权限校验
    //    当 Action 需要 EDIT_AUTHORIZED_AREA 能力且用户为商家时，
    //    校验 payload 中的 areaId 是否在用户授权范围内。
    //    注：完整的区域-商家映射由后端维护，前端做简化校验。
    if (this.requiresAreaAuthorization(action)) {
      const areaCheckResult = this.checkAreaAuthorization(action, state)
      if (areaCheckResult) {
        return areaCheckResult
      }
    }

    // 所有校验通过，继续执行下一个中间件
    return next(action)
  }

  /**
   * 判断 Action 是否需要区域授权校验
   *
   * 当 Action 所需能力包含 EDIT_AUTHORIZED_AREA 时需要校验。
   */
  private requiresAreaAuthorization(action: Action): boolean {
    const required = ACTION_CAPABILITY_MAP[action.type]
    return !!required && required.includes(Capability.EDIT_AUTHORIZED_AREA)
  }

  /**
   * 校验商家区域授权
   *
   * 简化实现：检查 payload 中是否包含 areaId，
   * 以及用户的 authorizedAreaIds（如果存在）是否包含该 areaId。
   * 完整的区域-商家映射由后端 API 校验。
   *
   * @returns 如果校验失败返回拒绝结果，通过则返回 null
   */
  private checkAreaAuthorization(
    action: Action,
    state: MiddlewareContext['state'],
  ): ActionResult | null {
    // 管理员拥有全局权限，跳过区域校验
    if (state.user?.capabilities.includes(Capability.EDIT_MALL_STRUCTURE)) {
      return null
    }

    // 从 payload 中提取 areaId（不同 ActionType 的 payload 结构不同）
    const payload = action.payload as Record<string, unknown> | undefined
    const areaId = payload?.areaId as string | undefined

    // 如果 payload 中没有 areaId，跳过前端校验（由后端兜底）
    if (!areaId) {
      return null
    }

    // 检查用户的授权区域列表
    // 注：authorizedAreaIds 由 useOrchestrator composable 从后端同步到 state
    const user = state.user
    if (user) {
      const authorizedAreas = (user as Record<string, unknown>).authorizedAreaIds as string[] | undefined
      if (authorizedAreas && !authorizedAreas.includes(areaId)) {
        return createPermissionDenied(
          action,
          `您没有编辑该区域的权限，区域ID：${areaId}`,
        )
      }
    }

    return null
  }
}
