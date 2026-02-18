/**
 * ============================================================================
 * Orchestrator 核心类 (Orchestrator.ts)
 * ============================================================================
 *
 * 【文件职责】
 * Orchestrator 业务协调层的核心实现，作为所有 Action 的唯一入口和分发中心。
 * 采用单例模式 + 中间件管道（洋葱模型）+ Handler 注册表的架构。
 *
 * 【核心流程】
 * dispatch(action)
 *   → 填充 actionId / timestamp
 *   → 执行中间件管道（洋葱模型）
 *   → 查找并调用 Handler
 *   → 返回 ActionResult
 *
 * 【设计原则】
 * 1. 所有异常在内部捕获，不向 UI 层传播
 * 2. 所有结果通过 ActionResult 结构化返回
 * 3. 中间件按注册顺序执行，支持中断和增强
 * 4. Handler 注册时进行接口校验，防止运行时错误
 *
 * ============================================================================
 */

import type { Action } from './types'
import type {
  ActionResult,
  ActionHandler,
  ActionHandlerFn,
  ActionMiddleware,
  MiddlewareNext,
  OrchestratorState,
} from './types'
import { ActionType, SystemMode, TemporalState } from './types'
import { generateActionId } from './utils/id-generator'

/**
 * Orchestrator 核心类
 *
 * 单例模式，全局唯一。负责接收所有 Action，通过中间件管道处理后
 * 分发到对应的 Handler 执行。
 */
export class Orchestrator {
  /** 单例实例 */
  private static instance: Orchestrator | null = null

  /** Handler 注册表：ActionType → ActionHandler */
  private handlers: Map<ActionType, ActionHandler> = new Map()

  /** 中间件列表（按注册顺序） */
  private middlewares: ActionMiddleware[] = []

  /** 协调器运行时状态 */
  private state: OrchestratorState = {
    user: null,
    systemMode: SystemMode.RUNTIME,
    temporalState: TemporalState.READY,
    spatial: {},
    isProcessing: false,
  }

  private constructor() {}

  /**
   * 获取 Orchestrator 单例
   * @returns Orchestrator 实例
   */
  static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator()
    }
    return Orchestrator.instance
  }

  /**
   * 注册 Action 处理器
   *
   * 支持对象式 Handler（需实现 handle 方法）和函数式 Handler（自动包装）。
   * 同一 ActionType 不允许重复注册，需使用 replaceHandler 替换。
   *
   * @param actionType - 要处理的 ActionType
   * @param handler - 处理器对象或函数
   * @throws TypeError 如果 handler 不符合 ActionHandler 接口
   * @throws Error 如果该 ActionType 已注册 Handler
   */
  registerHandler<T extends ActionType>(
    actionType: T,
    handler: ActionHandler<T> | ActionHandlerFn<T>,
  ): void {
    const wrappedHandler = this.normalizeHandler(handler)

    if (this.handlers.has(actionType)) {
      throw new Error(
        `ActionType "${actionType}" 已注册 Handler，请使用 replaceHandler() 替换`,
      )
    }

    this.handlers.set(actionType, wrappedHandler as ActionHandler)
  }

  /**
   * 替换已注册的 Handler
   *
   * 允许为已注册的 ActionType 替换新的 Handler。
   * 如果该 ActionType 尚未注册，则直接注册。
   *
   * @param actionType - 要替换的 ActionType
   * @param handler - 新的处理器对象或函数
   * @throws TypeError 如果 handler 不符合 ActionHandler 接口
   */
  replaceHandler<T extends ActionType>(
    actionType: T,
    handler: ActionHandler<T> | ActionHandlerFn<T>,
  ): void {
    const wrappedHandler = this.normalizeHandler(handler)
    this.handlers.set(actionType, wrappedHandler as ActionHandler)
  }

  /**
   * 注册中间件
   *
   * 中间件按注册顺序执行（洋葱模型），可在 Action 执行前后插入横切逻辑。
   *
   * @param middleware - 中间件实例
   */
  use(middleware: ActionMiddleware): void {
    this.middlewares.push(middleware)
  }

  /**
   * 分发 Action（核心方法）
   *
   * 执行流程：
   * 1. 自动填充 actionId 和 timestamp
   * 2. 构建中间件管道（洋葱模型）
   * 3. 最内层查找并调用 Handler
   * 4. 异常兜底捕获，始终返回 ActionResult
   *
   * @param action - 要分发的 Action
   * @returns ActionResult 执行结果
   */
  async dispatch<T extends ActionType>(action: Action<T>): Promise<ActionResult> {
    const startTime = Date.now()

    // 1. 自动填充元数据
    if (!action.actionId) {
      action.actionId = generateActionId()
    }
    if (!action.timestamp) {
      action.timestamp = Date.now()
    }

    try {
      // 2. 构建中间件管道
      const result = await this.executePipeline(action as Action)
      // 补充 meta 中的 duration
      result.meta.duration = Date.now() - startTime
      return result
    } catch (error: unknown) {
      // 3. 兜底：捕获所有未预期的异常
      const message =
        error instanceof Error ? error.message : '系统内部错误，请稍后重试'
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: '系统内部错误，请稍后重试',
          details: { originalError: message },
        },
        meta: {
          actionId: action.actionId,
          actionType: action.type,
          source: action.source,
          timestamp: action.timestamp,
          duration: Date.now() - startTime,
        },
      }
    }
  }

  /**
   * 获取当前运行时状态
   */
  getState(): OrchestratorState {
    return this.state
  }

  /**
   * 更新运行时状态（部分更新）
   * @param partial - 要更新的状态字段
   */
  updateState(partial: Partial<OrchestratorState>): void {
    this.state = { ...this.state, ...partial }
  }

  /**
   * 销毁单例实例（用于测试重置）
   */
  dispose(): void {
    this.handlers.clear()
    this.middlewares = []
    this.state = {
      user: null,
      systemMode: SystemMode.RUNTIME,
      temporalState: TemporalState.READY,
      spatial: {},
      isProcessing: false,
    }
    Orchestrator.instance = null
  }

  // ==========================================================================
  // 私有方法
  // ==========================================================================

  /**
   * 校验并标准化 Handler
   *
   * 如果传入函数，包装为对象式 Handler。
   * 如果传入对象，校验是否包含 handle 方法。
   *
   * @param handler - 处理器对象或函数
   * @returns 标准化后的 ActionHandler
   * @throws TypeError 如果 handler 不符合接口
   */
  private normalizeHandler<T extends ActionType>(
    handler: ActionHandler<T> | ActionHandlerFn<T>,
  ): ActionHandler<T> {
    if (typeof handler === 'function') {
      return { handle: handler }
    }

    if (
      typeof handler !== 'object' ||
      handler === null ||
      typeof handler.handle !== 'function'
    ) {
      throw new TypeError(
        'Handler 必须是函数或包含 handle 方法的对象（INVALID_HANDLER）',
      )
    }

    return handler
  }

  /**
   * 执行中间件管道（洋葱模型）
   *
   * 从右到左构建调用链：
   * middleware[0] → middleware[1] → ... → middleware[N-1] → handlerExecutor
   *
   * @param action - 当前 Action
   * @returns ActionResult
   */
  private async executePipeline(action: Action): Promise<ActionResult> {
    // 最内层：查找并调用 Handler
    const handlerExecutor: MiddlewareNext = async (act: Action) => {
      return this.executeHandler(act)
    }

    // 从右到左包装中间件
    let next: MiddlewareNext = handlerExecutor
    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const mw = this.middlewares[i]!
      const currentNext = next
      const mwName = mw.name
      next = async (act: Action) => {
        try {
          return await mw.execute({ action: act, state: this.state }, currentNext)
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : '中间件执行异常'
          return {
            success: false,
            error: {
              code: 'MIDDLEWARE_ERROR',
              message,
              details: { middleware: mwName },
            },
            meta: {
              actionId: act.actionId ?? '',
              actionType: act.type,
              source: act.source,
              timestamp: act.timestamp,
              duration: 0,
            },
          }
        }
      }
    }

    return next(action)
  }

  /**
   * 执行 Handler
   *
   * 查找已注册的 Handler 并调用。
   * 未找到 Handler 时返回 HANDLER_NOT_FOUND 错误。
   * Handler 抛出异常时返回 HANDLER_ERROR 错误。
   *
   * @param action - 当前 Action
   * @returns ActionResult
   */
  private async executeHandler(action: Action): Promise<ActionResult> {
    const handler = this.handlers.get(action.type)

    if (!handler) {
      if (import.meta.env?.DEV) {
        console.warn(
          `[Orchestrator] 未找到 ActionType "${action.type}" 的 Handler，请确认是否已注册。`,
        )
      }
      return {
        success: false,
        error: {
          code: 'HANDLER_NOT_FOUND',
          message: `未找到 ActionType "${action.type}" 的处理器`,
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

    try {
      const result = await handler.handle(action)
      return result
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Handler 执行异常'
      return {
        success: false,
        error: {
          code: 'HANDLER_ERROR',
          message,
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
  }
}
