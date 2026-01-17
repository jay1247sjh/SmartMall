/**
 * ============================================================================
 * 智能服务 API (intelligence.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 与 Java 后端的 AI 接口通信，后端再转发到 Intelligence Service（Python AI 服务）。
 * 
 * 【架构说明】
 * 前端 (Vue) → Java 后端 (8081) → Python Intelligence Service (9001)
 * 
 * 【核心功能】
 * 1. 智能对话 - 支持纯文本和图片+文字输入
 * 2. 操作确认 - 处理需要用户确认的操作（如下单、加购）
 * 
 * ============================================================================
 */

import { http } from './http'

// ============================================================================
// 类型定义
// ============================================================================

/** 工具调用结果 */
export interface ToolResult {
  function: string
  args: Record<string, unknown>
  result: Record<string, unknown>
}

/** 对话请求 */
export interface ChatRequest {
  message: string
  imageUrl?: string
  currentPage?: string
  currentFloor?: string
  positionX?: number
  positionY?: number
  positionZ?: number
}

/** 对话响应 */
export interface ChatResponse {
  requestId: string
  type: 'text' | 'navigate' | 'confirmation_required' | 'confirm' | 'error' | 'mall_generated'
  content?: string
  message?: string
  action?: string
  args?: Record<string, unknown>
  toolResults?: ToolResult[]
  intent?: string
  confidence?: number
  suggestions?: string[]
  navigateTo?: string
  navigateLabel?: string
  timestamp: string
}

/** 确认请求 */
export interface ConfirmRequest {
  action: string
  args: Record<string, unknown>
  confirmed: boolean
}

/** 聊天消息（前端展示用） */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  image_url?: string
  timestamp: Date
  type?: 'text' | 'navigate' | 'confirmation_required' | 'confirm' | 'error' | 'mall_generated'
  action?: string
  args?: Record<string, unknown>
  tool_results?: ToolResult[]
  navigateTo?: string
  navigateLabel?: string
}

// ============================================================================
// API 方法
// ============================================================================

/**
 * 智能服务 API
 * 
 * 使用统一的 http 封装，自动处理：
 * - Token 携带
 * - 401 自动刷新/重定向登录
 * - 错误处理
 */
export const intelligenceApi = {
  /**
   * 发送对话消息
   * 
   * @param message - 用户消息
   * @param userId - 用户 ID（已废弃，从 token 获取）
   * @param imageUrl - 图片 URL（可选）
   * @param context - 上下文信息（可选）
   * @param signal - AbortSignal 用于取消请求（可选）
   * @returns 对话响应
   */
  async chat(
    message: string,
    _userId: string,
    imageUrl?: string,
    context?: {
      current_floor?: string
      current_position?: { x: number; y: number; z: number }
    },
    signal?: AbortSignal
  ): Promise<ChatResponse> {
    const request: ChatRequest = {
      message,
      imageUrl,
      currentFloor: context?.current_floor,
      positionX: context?.current_position?.x,
      positionY: context?.current_position?.y,
      positionZ: context?.current_position?.z,
    }

    // AI 请求需要更长的超时时间（LLM 响应较慢）
    return http.post<ChatResponse>('/ai/chat', request, { 
      signal,
      timeout: 60000  // 60 秒超时
    })
  },

  /**
   * 确认或取消操作
   * 
   * @param action - 操作名称
   * @param args - 操作参数
   * @param confirmed - 是否确认
   * @param userId - 用户 ID（已废弃，从 token 获取）
   * @returns 确认响应
   */
  async confirm(
    action: string,
    args: Record<string, unknown>,
    confirmed: boolean,
    _userId: string
  ): Promise<ChatResponse> {
    const request: ConfirmRequest = {
      action,
      args,
      confirmed,
    }

    return http.post<ChatResponse>('/ai/confirm', request, {
      timeout: 60000  // 60 秒超时
    })
  },

  /**
   * 上传图片并获取 URL
   * 
   * @param file - 图片文件
   * @returns 图片 URL
   * 
   * 【注意】当前返回 base64 data URL，实际项目中应上传到 OSS
   */
  async uploadImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  /**
   * AI 服务健康检查
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return http.get<{ status: string; service: string }>('/ai/health')
  },
}

export default intelligenceApi
