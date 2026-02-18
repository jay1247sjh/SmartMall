/**
 * ============================================================================
 * 历史记录中间件 (HistoryMiddleware.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 记录可撤销的 Action 历史，支持撤销/重做操作。
 * 仅在 CONFIG 模式下记录写操作类型的 Action。
 *
 * 【统一策略】
 * HistoryMiddleware 作为唯一历史源，统一替代：
 * 1. useHistory composable
 * 2. HistoryManager 类
 * 3. builder.store.ts 中的 undoStack/redoStack
 *
 * 【记录规则】
 * - 仅在 CONFIG 模式下记录
 * - 仅记录 WRITE_ACTION_TYPES 中定义的写操作
 * - 仅记录执行成功的 Action
 * - 新操作清除重做栈
 * - 撤销栈最大 50 条，超出时移除最旧记录
 *
 * ============================================================================
 */

import type {
  ActionMiddleware,
  MiddlewareContext,
  MiddlewareNext,
  ActionResult,
  HistoryRecord,
} from '../types'
import { SystemMode } from '../types'
import { WRITE_ACTION_TYPES } from '../utils/permission-rules'
import { generateActionId } from '../utils/id-generator'

/** 默认最大历史记录条数 */
const DEFAULT_MAX_LENGTH = 50

/**
 * 历史记录中间件
 *
 * 在中间件管道中透传 Action 执行，成功后根据条件记录历史。
 * 提供 undo/redo 方法供 Orchestrator 调用。
 */
export class HistoryMiddleware implements ActionMiddleware {
  /** 中间件名称 */
  name = 'HistoryMiddleware'

  /** 撤销栈 */
  private undoStack: HistoryRecord[] = []

  /** 重做栈 */
  private redoStack: HistoryRecord[] = []

  /** 最大历史长度 */
  private maxLength: number

  /**
   * @param maxLength - 最大历史记录条数，默认 50
   */
  constructor(maxLength: number = DEFAULT_MAX_LENGTH) {
    this.maxLength = maxLength
  }

  /**
   * 执行历史记录逻辑
   *
   * 透传 Action 到下一个中间件，执行成功后判断是否需要记录历史。
   * 记录条件：CONFIG 模式 + 写操作类型 + 执行成功。
   *
   * @param context - 中间件上下文（包含 action 和 state）
   * @param next - 下一个中间件
   * @returns ActionResult — 透传 next() 的返回结果
   */
  async execute(
    context: MiddlewareContext,
    next: MiddlewareNext,
  ): Promise<ActionResult> {
    const result = await next(context.action)

    // 仅在 CONFIG 模式 + 写操作 + 执行成功时记录历史
    if (
      result.success
      && context.state.systemMode === SystemMode.CONFIG
      && WRITE_ACTION_TYPES.has(context.action.type)
    ) {
      const record: HistoryRecord = {
        id: generateActionId(),
        action: context.action,
        undoData: result.data,
        redoData: result.data,
        description: `${context.action.type}`,
        timestamp: Date.now(),
      }

      // 新操作清除重做栈
      this.redoStack = []

      // 推入撤销栈
      this.undoStack.push(record)

      // 超出最大长度时移除最旧记录
      if (this.undoStack.length > this.maxLength) {
        this.undoStack.shift()
      }
    }

    return result
  }

  /**
   * 撤销最近一条操作
   *
   * 从撤销栈弹出最近一条记录，推入重做栈。
   *
   * @returns 被撤销的历史记录，栈为空时返回 null
   */
  undo(): HistoryRecord | null {
    const record = this.undoStack.pop()
    if (!record) {
      return null
    }
    this.redoStack.push(record)
    return record
  }

  /**
   * 重做最近一条被撤销的操作
   *
   * 从重做栈弹出最近一条记录，推入撤销栈。
   *
   * @returns 被重做的历史记录，栈为空时返回 null
   */
  redo(): HistoryRecord | null {
    const record = this.redoStack.pop()
    if (!record) {
      return null
    }
    this.undoStack.push(record)
    return record
  }

  /**
   * 是否可以撤销
   *
   * @returns 撤销栈非空时返回 true
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * 是否可以重做
   *
   * @returns 重做栈非空时返回 true
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }
}
