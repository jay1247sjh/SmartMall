/**
 * ============================================================================
 * 工具处理器注册表 (tool-handler-registry.ts)
 * ============================================================================
 *
 * 【职责】
 * 提供通用的工具结果处理注册表，Python 新增工具时前端零修改。
 * 仅需在 tool-handlers.ts 中注册新 handler 即可。
 *
 * 【设计】
 * - 全局单例模式
 * - 未注册的工具名 console.warn 并跳过
 * - handler 执行异常 try-catch 捕获，不影响其他 handler
 * ============================================================================
 */

import type { ToolResult } from '@/api/intelligence.api'

export type ToolHandler = (
  funcName: string,
  args: Record<string, unknown>,
  result: Record<string, unknown>,
) => void | Promise<void>

class ToolHandlerRegistry {
  private handlers = new Map<string, ToolHandler>()

  /** 注册工具处理器 */
  register(toolName: string, handler: ToolHandler): void {
    this.handlers.set(toolName, handler)
  }

  /** 批量注册 */
  registerAll(entries: Record<string, ToolHandler>): void {
    for (const [name, handler] of Object.entries(entries)) {
      this.handlers.set(name, handler)
    }
  }

  /** 注销工具处理器 */
  unregister(toolName: string): void {
    this.handlers.delete(toolName)
  }

  /** 处理工具结果列表 */
  async handleToolResults(toolResults: ToolResult[]): Promise<void> {
    for (const tr of toolResults) {
      const handler = this.handlers.get(tr.function)
      if (handler) {
        try {
          await handler(tr.function, tr.args ?? {}, tr.result ?? {})
        } catch (e) {
          console.error(`[ToolHandler] ${tr.function} 执行失败:`, e)
        }
      } else {
        console.warn(`[ToolHandler] 未注册的工具: ${tr.function}，已跳过`)
      }
    }
  }

  /** 检查是否已注册 */
  has(toolName: string): boolean {
    return this.handlers.has(toolName)
  }
}

/** 全局单例 */
export const toolHandlerRegistry = new ToolHandlerRegistry()
