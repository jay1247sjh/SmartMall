/**
 * ============================================================================
 * AI 助手状态管理 (ai.store.ts)
 * ============================================================================
 *
 * 【职责】
 * 管理全局 AI 助手「小智」的状态，包括：
 * - 面板显示/隐藏状态
 * - 对话历史
 * - 待确认操作
 * - 意图识别结果
 *
 * 【全局可用】
 * 这个 store 在整个应用中共享，确保 AI 助手状态在页面切换时保持
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatResponse } from '@/api/intelligence.api'
import { toolHandlerRegistry } from '@/agent/tool-handler-registry'
import i18n from '@/i18n'
import { devLog } from '@/utils/dev-log'

export const useAiStore = defineStore('ai', () => {
  // ========================================
  // 状态
  // ========================================

  /** 面板是否可见 */
  const isPanelVisible = ref(false)

  /** 对话消息列表 */
  const messages = ref<ChatMessage[]>([])

  /** 是否正在发送消息 */
  const isSending = ref(false)

  /** 待确认的操作 */
  const pendingConfirmation = ref<{
    action: string
    args: Record<string, unknown>
    message: string
  } | null>(null)

  /** 会话 ID */
  const sessionId = ref<string>(generateSessionId())

  // ========================================
  // 计算属性
  // ========================================

  /** 是否有未读消息 */
  const hasUnread = computed(() => {
    if (isPanelVisible.value) return false
    const lastMsg = messages.value[messages.value.length - 1]
    return lastMsg?.role === 'assistant'
  })

  /** 消息数量 */
  const messageCount = computed(() => messages.value.length)

  // ========================================
  // 方法
  // ========================================

  /** 生成会话 ID */
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /** 生成消息 ID */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /** 显示面板 */
  function showPanel() {
    isPanelVisible.value = true
  }

  /** 隐藏面板 */
  function hidePanel() {
    isPanelVisible.value = false
  }

  /** 切换面板显示状态 */
  function togglePanel() {
    isPanelVisible.value = !isPanelVisible.value
  }

  /** 添加消息 */
  function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    messages.value.push({
      ...message,
      id: generateMessageId(),
      timestamp: new Date()
    })
  }

  /** 清空消息 */
  function clearMessages() {
    messages.value = []
    sessionId.value = generateSessionId()
    pendingConfirmation.value = null
  }

  /** 设置发送状态 */
  function setSending(sending: boolean) {
    isSending.value = sending
  }

  /** 设置待确认操作 */
  function setPendingConfirmation(confirmation: typeof pendingConfirmation.value) {
    pendingConfirmation.value = confirmation
  }

  /** 清除待确认操作 */
  function clearPendingConfirmation() {
    pendingConfirmation.value = null
  }

  /** 获取翻译文本 */
  function t(key: string, params?: Record<string, unknown>): string {
    return (
      i18n.global as unknown as { t: (key: string, params?: Record<string, unknown>) => string }
    ).t(key, params)
  }

  /** 解析助手文本，避免空响应导致界面看起来无结果 */
  function resolveAssistantContent(response: ChatResponse): string {
    const content = typeof response.content === 'string' ? response.content.trim() : ''
    if (content) return response.content as string

    const message = typeof response.message === 'string' ? response.message.trim() : ''
    if (message) return response.message as string

    return t('ai.errorDefault')
  }

  /** 处理 AI 响应 */
  function handleResponse(response: ChatResponse) {
    devLog('[AI Store] handleResponse:', response.type, response)

    if (response.type === 'confirmation_required' || response.type === 'confirm') {
      setPendingConfirmation({
        action: response.action!,
        args: response.args!,
        message: response.message || t('ai.confirmAction')
      })
      addMessage({
        role: 'assistant',
        content: response.message || t('ai.confirmAction'),
        type: response.type,
        action: response.action,
        args: response.args,
        rag_used: response.ragUsed,
        retrieval_strategy: response.retrievalStrategy,
        evidence: response.evidence
      })
    } else if (response.type === 'error') {
      addMessage({
        role: 'assistant',
        content: resolveAssistantContent(response),
        type: 'error',
        rag_used: response.ragUsed,
        retrieval_strategy: response.retrievalStrategy,
        evidence: response.evidence
      })
    } else {
      // text 类型 — 统一处理
      addMessage({
        role: 'assistant',
        content: resolveAssistantContent(response),
        tool_results: response.toolResults,
        rag_used: response.ragUsed,
        retrieval_strategy: response.retrievalStrategy,
        evidence: response.evidence
      })
    }

    // 通用工具结果处理 — 通过注册表
    if (response.toolResults && response.toolResults.length > 0) {
      toolHandlerRegistry.handleToolResults(response.toolResults)
    }
  }

  /** 初始化欢迎消息 */
  function initWelcomeMessage() {
    if (messages.value.length === 0) {
      addMessage({
        role: 'assistant',
        content: t('ai.welcome')
      })
    }
  }

  return {
    // 状态
    isPanelVisible,
    messages,
    isSending,
    pendingConfirmation,
    sessionId,

    // 计算属性
    hasUnread,
    messageCount,

    // 方法
    showPanel,
    hidePanel,
    togglePanel,
    addMessage,
    clearMessages,
    setSending,
    setPendingConfirmation,
    clearPendingConfirmation,
    handleResponse,
    initWelcomeMessage
  }
})
