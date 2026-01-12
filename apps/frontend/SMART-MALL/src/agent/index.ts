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
 * 3. 场景联动 - 将 AI 指令转换为 3D 场景操作
 *
 * 【使用方式】
 * 主要通过 AiChatPanel 组件使用，也可直接调用 API：
 *
 * ```typescript
 * import { intelligenceApi } from '@/api'
 *
 * // 发送对话
 * const response = await intelligenceApi.chat('Nike 店在哪？', userId)
 *
 * // 上传图片对话
 * const imageUrl = await intelligenceApi.uploadImage(file)
 * const response = await intelligenceApi.chat('推荐类似的', userId, imageUrl)
 * ```
 *
 * 【与 3D 场景的联动】
 * AI 返回的 tool_results 包含场景操作指令：
 * - navigate_to_store: 导航到店铺
 * - search_products: 搜索商品（高亮显示）
 * - get_product_detail: 显示商品详情
 *
 * 这些指令通过 AiChatPanel 的 emit 事件传递给 Mall3DView，
 * 由 Mall3DView 调用 ThreeEngine 执行实际的场景操作。
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

/**
 * AI 场景操作类型
 */
export type AiSceneAction =
  | { type: 'navigate'; storeId: string; position: { x: number; y: number; z: number } }
  | { type: 'highlight'; targetType: 'store' | 'product'; id: string }
  | { type: 'showDetail'; targetType: 'store' | 'product'; id: string }
  | { type: 'addToCart'; productId: string; quantity: number }

/**
 * 解析 AI 工具调用结果，转换为场景操作
 *
 * @param funcName - 工具函数名
 * @param result - 工具调用结果
 * @returns 场景操作指令，如果不需要场景操作则返回 null
 */
export function parseToolResultToAction(
  funcName: string,
  result: Record<string, unknown>
): AiSceneAction | null {
  if (!result.success) return null

  switch (funcName) {
    case 'navigate_to_store': {
      const store = result.store as {
        id: string
        position: { x: number; y: number; z: number }
      }
      return {
        type: 'navigate',
        storeId: store.id,
        position: store.position,
      }
    }

    case 'search_products': {
      const products = result.products as Array<{ id: string }> | undefined
      if (products && products.length > 0) {
        const firstProduct = products[0]
        if (firstProduct) {
          return {
            type: 'highlight',
            targetType: 'product',
            id: firstProduct.id,
          }
        }
      }
      return null
    }

    case 'get_product_detail': {
      const product = result.product as { id: string } | undefined
      if (product) {
        return {
          type: 'showDetail',
          targetType: 'product',
          id: product.id,
        }
      }
      return null
    }

    case 'add_to_cart': {
      const productId = result.product_id as string | undefined
      const quantity = result.quantity as number | undefined
      if (productId) {
        return {
          type: 'addToCart',
          productId,
          quantity: quantity ?? 1,
        }
      }
      return null
    }

    default:
      return null
  }
}
