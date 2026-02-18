/**
 * ============================================================================
 * 日志记录中间件 (LoggingMiddleware.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 记录所有 Action 的执行过程，用于问题排查和行为分析。
 * 采用环形缓冲区存储日志（最大 200 条），超出时移除最旧记录。
 *
 * 【记录内容】
 * - Action 类型、来源、时间戳、用户ID、执行结果
 * - 权限拒绝时记录 permissionDenied 信息
 * - Handler 失败时记录 error 信息
 *
 * 【查询接口】
 * - getRecentLogs(count): 返回最近 N 条日志，按时间倒序排列
 *
 * ============================================================================
 */

import type {
  ActionMiddleware,
  MiddlewareContext,
  MiddlewareNext,
  ActionResult,
  ActionLogEntry,
} from '../types'
import { Capability } from '../types'
import { generateActionId } from '../utils/id-generator'

/** 默认最大日志条数 */
const DEFAULT_MAX_LOGS = 200

/**
 * 日志记录中间件
 *
 * 包裹 next() 调用，记录 Action 执行的完整信息。
 * 使用简单数组作为环形缓冲区（push + shift），超出 maxLogs 时移除最旧记录。
 */
export class LoggingMiddleware implements ActionMiddleware {
  /** 中间件名称 */
  name = 'LoggingMiddleware'

  /** 日志存储（环形缓冲区） */
  private logs: ActionLogEntry[] = []

  /** 最大日志条数 */
  private maxLogs: number

  /**
   * @param maxLogs - 最大日志条数，默认 200
   */
  constructor(maxLogs: number = DEFAULT_MAX_LOGS) {
    this.maxLogs = maxLogs
  }

  /**
   * 执行日志记录
   *
   * 在 next() 调用前后记录时间，根据执行结果生成日志条目。
   *
   * @param context - 中间件上下文（包含 action 和 state）
   * @param next - 下一个中间件
   * @returns ActionResult — 透传 next() 的返回结果
   */
  async execute(
    context: MiddlewareContext,
    next: MiddlewareNext,
  ): Promise<ActionResult> {
    const startTime = Date.now()
    const result = await next(context.action)
    const duration = Date.now() - startTime

    const logEntry: ActionLogEntry = {
      id: generateActionId(),
      actionId: context.action.actionId ?? '',
      actionType: context.action.type,
      source: context.action.source,
      userId: context.state.user?.userId,
      success: result.success,
      error: this.extractError(result),
      permissionDenied: this.extractPermissionDenied(result),
      duration,
      timestamp: Date.now(),
    }

    this.addLog(logEntry)
    return result
  }

  /**
   * 查询最近 N 条日志
   *
   * @param count - 要返回的日志条数
   * @returns 按时间倒序排列的日志数组（最新的在前）
   */
  getRecentLogs(count: number): ActionLogEntry[] {
    return this.logs.slice(-count).reverse()
  }

  /**
   * 添加日志条目到环形缓冲区
   *
   * 超出 maxLogs 时移除最旧的记录。
   */
  private addLog(entry: ActionLogEntry): void {
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  /**
   * 从 ActionResult 中提取错误信息
   *
   * Handler 失败（HANDLER_ERROR）或中间件失败（MIDDLEWARE_ERROR）时提取 error.message。
   */
  private extractError(result: ActionResult): string | undefined {
    if (
      result.error
      && (result.error.code === 'HANDLER_ERROR' || result.error.code === 'MIDDLEWARE_ERROR')
    ) {
      return result.error.message
    }
    return undefined
  }

  /**
   * 从 ActionResult 中提取权限拒绝信息
   *
   * 权限校验失败（PERMISSION_DENIED）时提取拒绝原因和缺少的能力列表。
   */
  private extractPermissionDenied(
    result: ActionResult,
  ): ActionLogEntry['permissionDenied'] {
    if (result.error?.code === 'PERMISSION_DENIED') {
      return {
        reason: result.error.message,
        missingCapabilities: result.error.details?.missingCapabilities as Capability[] | undefined,
      }
    }
    return undefined
  }
}
