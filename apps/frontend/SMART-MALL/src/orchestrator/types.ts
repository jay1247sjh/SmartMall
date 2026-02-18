/**
 * ============================================================================
 * Orchestrator 核心类型定义 (types.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 定义 Orchestrator 业务协调层的核心接口和类型，包括：
 * - ActionResult：Action 执行结果
 * - ActionHandler / ActionHandlerFn：Action 处理器接口
 * - ActionMiddleware / MiddlewareContext / MiddlewareNext：中间件接口
 * - OrchestratorState：协调器运行时状态
 * - ActionLogEntry：日志条目
 * - HistoryRecord：历史记录
 *
 * 【设计原则】
 * 1. 复用已有的 Action/ActionType/ActionPayloadMap/ActionSource 协议类型
 * 2. 所有接口面向中间件管道模式设计
 * 3. 泛型支持类型安全的 Action 分发
 *
 * ============================================================================
 */

import type { Action } from '../protocol/action.protocol'
import { ActionType, ActionSource } from '../protocol/action.enums'
import { Role, Capability } from '../domain/permission/permission.enums'
import { SystemMode, TemporalState } from '../shared/system/system.enums'

// 重新导出复用的类型，方便外部统一从 orchestrator/types 导入
export { ActionType, ActionSource, Role, Capability, SystemMode, TemporalState }
export type { Action }

/**
 * Action 执行结果
 *
 * 所有 Action 经过 Orchestrator dispatch 后的统一返回结构。
 * 无论成功、权限拒绝还是 Handler 异常，都通过此结构返回，
 * 不向 UI 层抛出异常。
 *
 * @template T - 成功时的返回数据类型
 */
export interface ActionResult<T = unknown> {
  /** 是否成功 */
  success: boolean
  /** 成功时的返回数据 */
  data?: T
  /** 失败时的错误信息 */
  error?: {
    /** 错误码（如 HANDLER_NOT_FOUND、PERMISSION_DENIED、HANDLER_ERROR） */
    code: string
    /** 用户友好的错误描述 */
    message: string
    /** 额外错误详情 */
    details?: Record<string, unknown>
  }
  /** 执行的 Action 元数据 */
  meta: {
    /** Action 唯一标识 */
    actionId: string
    /** Action 类型 */
    actionType: ActionType
    /** Action 来源 */
    source: ActionSource
    /** 时间戳 */
    timestamp: number
    /** 执行耗时（毫秒） */
    duration: number
  }
}

/**
 * Action 处理器接口
 *
 * 每个 ActionType 对应一个 Handler，负责执行具体的业务逻辑。
 * 现有领域行为层（NavigationBehavior、HighlightBehavior）的返回类型不统一，
 * Handler 包装层需要将它们适配为统一的 ActionResult。
 *
 * @template T - 处理的 ActionType
 */
export interface ActionHandler<T extends ActionType = ActionType> {
  /** 处理 Action，返回执行结果 */
  handle(action: Action<T>): Promise<ActionResult> | ActionResult
}

/**
 * 函数式 Action 处理器（简化写法）
 *
 * 允许使用普通函数代替类实例注册 Handler。
 *
 * @template T - 处理的 ActionType
 */
export type ActionHandlerFn<T extends ActionType = ActionType> =
  (action: Action<T>) => Promise<ActionResult> | ActionResult

/**
 * 中间件上下文
 *
 * 传递给每个中间件的上下文信息，包含当前 Action 和系统状态。
 * 中间件可据此进行权限校验、日志记录等横切逻辑。
 */
export interface MiddlewareContext {
  /** 当前 Action */
  action: Action
  /** 执行上下文（用户信息、系统状态等） */
  state: OrchestratorState
}

/**
 * 中间件 next 函数
 *
 * 调用 next 将控制权传递给管道中的下一个中间件。
 * 若中间件不调用 next，则后续中间件和 Handler 均不执行。
 */
export type MiddlewareNext = (action: Action) => Promise<ActionResult>

/**
 * Action 中间件接口
 *
 * 采用洋葱模型，在 Action 执行前后插入横切逻辑。
 * 内置中间件包括：LoggingMiddleware、PermissionMiddleware、HistoryMiddleware。
 */
export interface ActionMiddleware {
  /** 中间件名称（用于调试和日志） */
  name: string
  /** 执行中间件逻辑 */
  execute(context: MiddlewareContext, next: MiddlewareNext): Promise<ActionResult>
}

/**
 * Orchestrator 运行时状态
 *
 * 聚合权限校验所需的上下文信息，包括当前用户、系统模式、
 * 时间状态和空间上下文。由 useOrchestrator composable 维护。
 */
export interface OrchestratorState {
  /** 当前用户信息（未登录时为 null） */
  user: {
    /** 用户 ID */
    userId: string
    /** 用户角色 */
    role: Role
    /** 商家 ID（仅商家角色） */
    merchantId?: string
    /** 用户能力列表 */
    capabilities: Capability[]
  } | null

  /** 系统模式（RUNTIME 运行态 / CONFIG 配置态） */
  systemMode: SystemMode

  /** 时间状态（READY / LOADING / TRANSITION / ERROR） */
  temporalState: TemporalState

  /** 空间上下文（当前所在楼层、区域、店铺） */
  spatial: {
    /** 当前楼层 ID */
    currentFloorId?: string
    /** 当前区域 ID */
    currentAreaId?: string
    /** 当前店铺 ID */
    currentStoreId?: string
  }

  /** 是否正在处理 Action */
  isProcessing: boolean
}

/**
 * Action 日志条目
 *
 * 记录每次 Action dispatch 的完整信息，用于问题排查和行为分析。
 * 由 LoggingMiddleware 生成并存储在环形缓冲区中。
 */
export interface ActionLogEntry {
  /** 日志 ID */
  id: string
  /** Action ID */
  actionId: string
  /** Action 类型 */
  actionType: ActionType
  /** Action 来源 */
  source: ActionSource
  /** 用户 ID */
  userId?: string
  /** 执行结果 */
  success: boolean
  /** 错误信息（失败时） */
  error?: string
  /** 权限校验结果（被拒绝时） */
  permissionDenied?: {
    /** 拒绝原因 */
    reason: string
    /** 缺少的能力列表 */
    missingCapabilities?: Capability[]
  }
  /** 执行耗时（毫秒） */
  duration: number
  /** 时间戳 */
  timestamp: number
}

/**
 * 历史记录
 *
 * 记录可撤销的 Action 及其逆操作数据，支持撤销/重做。
 * 仅在 CONFIG 模式下由 HistoryMiddleware 记录。
 */
export interface HistoryRecord {
  /** 记录 ID */
  id: string
  /** 原始 Action */
  action: Action
  /** 撤销数据（执行逆操作所需的数据快照） */
  undoData: unknown
  /** 重做数据 */
  redoData: unknown
  /** 描述 */
  description: string
  /** 时间戳 */
  timestamp: number
}