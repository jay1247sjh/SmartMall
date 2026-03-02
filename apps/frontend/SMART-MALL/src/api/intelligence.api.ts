/**
 * ============================================================================
 * 智能服务 API (intelligence.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 与 Java 后端的 AI 接口通信，后端再转发到 Intelligence Service（Python AI 服务）。
 * 
 * 【架构说明】
 * 前端 (Vue) → Java 后端 (8081) → Python Intelligence Service (19191)
 * 
 * 【核心功能】
 * 1. 智能对话 - 支持纯文本和图片+文字输入
 * 2. 操作确认 - 处理需要用户确认的操作（如下单、加购）
 * 
 * ============================================================================
 */

import axios from 'axios'
import { http } from './http'
import type { MallLayoutData } from '@/builder/converters/layout-converter'

// ============================================================================
// 类型定义
// ============================================================================

/** 商城生成请求 */
export interface GenerateMallRequest {
  description: string
  userId?: string
}

/** 商城生成响应 */
export interface GenerateMallResponse {
  success: boolean
  message: string
  data: MallLayoutData | null
  parseInfo?: Record<string, unknown>
}

/** 商城描述对话消息 */
export interface DescribeMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 商城描述对话请求 */
export interface DescribeMallRequest {
  messages: DescribeMessage[]
  currentDescription: string
  finish?: boolean
}

/** 轮次信息 */
export interface DescribeRoundInfo {
  current: number
  max: number
}

/** 商城描述对话响应 */
export interface DescribeMallResponse {
  reply: string
  description: string
  isComplete: boolean
  roundInfo: DescribeRoundInfo
}

/** 工具调用结果 */
export interface ToolResult {
  function: string
  args: Record<string, unknown>
  result: Record<string, unknown>
}

export interface EvidenceItem {
  id: string
  source_type: string
  source_collection: string
  score: number
  snippet: string
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
  type: 'text' | 'confirmation_required' | 'confirm' | 'error'
  content?: string
  message?: string
  action?: string
  args?: Record<string, unknown>
  toolResults?: ToolResult[]
  ragUsed?: boolean
  retrievalStrategy?: string
  evidence?: EvidenceItem[]
  timestamp: string
}

/** 确认请求 */
export interface ConfirmRequest {
  action: string
  args: Record<string, unknown>
  confirmed: boolean
}

/** 语音会话创建请求 */
export interface VoiceSessionRequest {
  scene?: string
  language?: string
}

/** 语音会话创建响应 */
export interface VoiceSessionResponse {
  sessionId: string
  wsUrl: string
  expiresAt: string
}

export interface VoiceCapabilities {
  provider?: string
  asr_mode?: string
  tts_mode?: string
  degraded?: boolean
  message?: string
}

/** 语音 WebSocket 事件 */
export type VoiceWsEvent =
  | { type: 'session_ready'; session_id: string; capabilities?: VoiceCapabilities }
  | { type: 'started' }
  | { type: 'asr_partial'; text: string }
  | { type: 'asr_final'; text: string }
  | { type: 'assistant_text_delta'; text: string }
  | { type: 'assistant_text_final'; text: string }
  | { type: 'tts_chunk'; audio_base64: string }
  | { type: 'confirmation_required'; action: string; args?: Record<string, unknown>; message?: string }
  | { type: 'done'; status?: 'ok' | 'interrupted' }
  | { type: 'pong' }
  | { type: 'error'; message: string; error_type?: string }

/** 聊天消息（前端展示用） */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  image_url?: string
  timestamp: Date
  type?: 'text' | 'confirmation_required' | 'confirm' | 'error'
  action?: string
  args?: Record<string, unknown>
  tool_results?: ToolResult[]
  rag_used?: boolean
  retrieval_strategy?: string
  evidence?: EvidenceItem[]
}

export interface ChatStreamConfirmation {
  action: string
  args: Record<string, unknown>
  message?: string
}

export interface ChatStreamHandlers {
  onToken?: (token: string) => void
  onMeta?: (meta: { rag_used?: boolean; retrieval_strategy?: string; evidence?: EvidenceItem[] }) => void
  onToolResults?: (toolResults: ToolResult[]) => void
  onConfirmationRequired?: (confirmation: ChatStreamConfirmation) => void
  onDone?: () => void
  onError?: (error: string) => void
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
   * @param imageUrl - 图片 URL（可选）
   * @param context - 上下文信息（可选）
   * @param signal - AbortSignal 用于取消请求（可选）
   * @returns 对话响应
   */
  async chat(
    message: string,
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
   * @returns 确认响应
   */
  async confirm(
    action: string,
    args: Record<string, unknown>,
    confirmed: boolean
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
   * 流式聊天（SSE over fetch）
   */
  async chatStream(
    message: string,
    imageUrl?: string,
    context?: {
      current_floor?: string
      current_position?: { x: number; y: number; z: number }
    },
    handlers?: ChatStreamHandlers,
    signal?: AbortSignal
  ): Promise<void> {
    const request: ChatRequest = {
      message,
      imageUrl,
      currentFloor: context?.current_floor,
      positionX: context?.current_position?.x,
      positionY: context?.current_position?.y,
      positionZ: context?.current_position?.z,
    }

    const token = localStorage.getItem('sm_accessToken')
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
      signal,
    })

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const evt of events) {
        const line = evt
          .split('\n')
          .find((l) => l.startsWith('data:'))
        if (!line) continue
        const payloadText = line.replace(/^data:\s*/, '')
        if (!payloadText) continue

        let payload: Record<string, unknown>
        try {
          payload = JSON.parse(payloadText)
        } catch {
          continue
        }

        if (typeof payload.token === 'string') {
          handlers?.onToken?.(payload.token)
        }
        if (typeof payload.error === 'string') {
          handlers?.onError?.(payload.error)
        }
        if (payload.meta && typeof payload.meta === 'object') {
          handlers?.onMeta?.(
            payload.meta as {
              rag_used?: boolean
              retrieval_strategy?: string
              evidence?: EvidenceItem[]
            }
          )
        }
        if (Array.isArray(payload.tool_results)) {
          handlers?.onToolResults?.(payload.tool_results as ToolResult[])
        }
        if (payload.confirmation_required && typeof payload.confirmation_required === 'object') {
          handlers?.onConfirmationRequired?.(
            payload.confirmation_required as ChatStreamConfirmation
          )
        }
        if (payload.done === true) {
          handlers?.onDone?.()
        }
      }
    }
  },

  /**
   * 创建语音会话
   */
  async createVoiceSession(request?: VoiceSessionRequest): Promise<VoiceSessionResponse> {
    return http.post<VoiceSessionResponse>('/ai/voice/session', request ?? {}, {
      timeout: 15000,
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

  /**
   * AI 生成商城布局
   *
   * 直接调用 Intelligence Service 的 /mall/generate 端点。
   * 通过 Vite 代理 /intelligence-api → Python 服务 (19191)。
   * 注意：不能使用 http.post（baseURL 为 /api），需要直接用 axios。
   *
   * @param description - 自然语言描述
   * @returns 生成响应（包含 MallLayoutData）
   */
  async generateMall(description: string): Promise<GenerateMallResponse> {
    const { data } = await axios.post<GenerateMallResponse>(
      '/intelligence-api/mall/generate',
      { description } as GenerateMallRequest,
      { timeout: 60000 },
    )
    return data
  },

  /**
   * AI 多轮对话生成商城描述
   *
   * 直接调用 Intelligence Service 的 /mall/describe 端点。
   * 通过 Vite 代理 /intelligence-api → Python 服务。
   *
   * @param request - 对话请求（消息历史 + 当前描述 + 完成标志）
   * @returns 对话响应（AI回复 + 更新描述 + 完成状态 + 轮次信息）
   */
  async describeMall(request: DescribeMallRequest): Promise<DescribeMallResponse> {
    const { data } = await axios.post<DescribeMallResponse>(
      '/intelligence-api/mall/describe',
      request,
      { timeout: 60000 },
    )
    return data
  },
}

export default intelligenceApi
