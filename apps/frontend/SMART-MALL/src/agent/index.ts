/**
 * ============================================================================
 * AI Agent 模块 (agent/index.ts)
 * ============================================================================
 *
 * 【模块职责】
 * 封装与 Intelligence Service 的交互逻辑，提供前端 AI 能力。
 *
 * 【核心功能】
 * 1. 智能对话 - 与 AI 导购助手对话
 * 2. 视觉理解 - 上传图片进行识别
 * 3. 场景联动 - 通过 ToolHandlerRegistry 注册表处理工具结果
 *
 * 【使用方式】
 * 主要通过 ai.store.ts 统一处理响应，也可直接调用 API：
 *
 * ```typescript
 * import { intelligenceApi } from '@/agent'
 *
 * // 发送对话
 * const response = await intelligenceApi.chat('Nike 店在哪？', userId)
 * ```
 *
 * 【工具结果处理】
 * AI 返回的 tool_results 通过 ToolHandlerRegistry 注册表分发处理。
 * 新增工具只需在 tool-handlers.ts 中注册 handler，无需修改核心代码。
 *
 * ============================================================================
 */

// 导出 Intelligence API
export { intelligenceApi } from '@/api'
export type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ToolResult,
  ConfirmRequest,
} from '@/api/intelligence.api'

// 导出注册表
export { toolHandlerRegistry } from './tool-handler-registry'
export type { ToolHandler } from './tool-handler-registry'
