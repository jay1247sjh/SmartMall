/**
 * ============================================================================
 * 建模器 AI 聊天 composable (useBuilderAiChat)
 * ============================================================================
 *
 * 【职责】
 * 抽取 AiSidebar 中的公共聊天逻辑，供 BuilderInlineInput 和
 * BuilderBottomDrawer 共用，包括：
 * - 消息发送（intelligenceApi.chat）
 * - Thinking 动态动画
 * - 请求取消 / 停止响应
 *
 * 【使用方式】
 * const { aiStore, currentThinkingText, sendMessage, stopResponse } = useBuilderAiChat()
 *
 * Requirements: 3.1
 * ============================================================================
 */

import { computed, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { intelligenceApi } from '@/api/intelligence.api'
import type { ChatMessage } from '@/api/intelligence.api'
import { useAiStore } from '@/stores'
import { useBuilderNavigationStore } from '@/stores/builder-navigation.store'
import { toolHandlerRegistry } from '@/agent/tool-handler-registry'

const THINKING_STAGES = ['Thinking...']

export function useBuilderAiChat() {
  const { t } = useI18n()
  const route = useRoute()
  const aiStore = useAiStore()
  const builderNavigationStore = useBuilderNavigationStore()

  const abortController = ref<AbortController | null>(null)
  const currentThinkingIndex = ref(0)
  let processingTimer: ReturnType<typeof setInterval> | null = null
  const currentThinkingText = computed(
    () => THINKING_STAGES[currentThinkingIndex.value] || 'Thinking...'
  )

  // ==========================================================================
  // Thinking animation
  // ==========================================================================

  function startProcessing(): void {
    currentThinkingIndex.value = 0
    if (processingTimer) {
      clearInterval(processingTimer)
      processingTimer = null
    }

    processingTimer = setInterval(() => {
      const next = currentThinkingIndex.value + 1
      currentThinkingIndex.value = next % Math.max(THINKING_STAGES.length, 1)
    }, 1200)
  }

  function stopProcessing(): void {
    if (processingTimer) {
      clearInterval(processingTimer)
      processingTimer = null
    }
    currentThinkingIndex.value = 0
  }

  // ==========================================================================
  // Request control
  // ==========================================================================

  function cancelRequest(): void {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
  }

  function stopResponse(): void {
    cancelRequest()
    stopProcessing()
    aiStore.setSending(false)
    aiStore.addMessage({
      role: 'assistant',
      content: t('ai.sidebar.stopped'),
      type: 'text'
    })
  }

  // ==========================================================================
  // Error parsing
  // ==========================================================================

  function parseErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>
      const message = err.message || err.msg || err.detail
      if (typeof message === 'string') {
        if (message.includes('invalid_api_key') || message.includes('401')) {
          return t('ai.sidebar.errorApiKey')
        }
        if (message.includes('rate_limit') || message.includes('429')) {
          return t('ai.sidebar.errorRateLimit')
        }
        if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
          return t('ai.sidebar.errorTimeout')
        }
        if (message.includes('network') || message.includes('ECONNREFUSED')) {
          return t('ai.sidebar.errorNetwork')
        }
      }
    }
    return t('ai.sidebar.errorGeneral')
  }

  // ==========================================================================
  // Send message
  // ==========================================================================

  async function sendMessage(text: string, imageUrl?: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed && !imageUrl) return
    if (aiStore.isSending) return

    aiStore.addMessage({
      role: 'user',
      content: trimmed,
      image_url: imageUrl || undefined
    })

    abortController.value = new AbortController()
    aiStore.setSending(true)
    startProcessing()
    let assistantMessageId: string | null = null

    const ensureAssistantMessage = () => {
      if (assistantMessageId) return
      aiStore.addMessage({
        role: 'assistant',
        content: '',
        type: 'text'
      })
      const last = aiStore.messages[aiStore.messages.length - 1]
      assistantMessageId = last?.id || null
    }

    const updateAssistantMessage = (
      updater: (message: ChatMessage) => void
    ) => {
      ensureAssistantMessage()
      const target = aiStore.messages.find(msg => msg.id === assistantMessageId)
      if (target) updater(target)
    }

    try {
      const contextFloor = builderNavigationStore.currentFloorId || route.path
      const contextPosition = builderNavigationStore.currentPosition || undefined

      await intelligenceApi.chatStream(
        trimmed,
        imageUrl || undefined,
        {
          current_floor: contextFloor,
          current_position: contextPosition
        },
        {
          onToken: token => {
            updateAssistantMessage(msg => {
              msg.content += token
            })
          },
          onMeta: meta => {
            updateAssistantMessage(msg => {
              msg.rag_used = meta.rag_used
              msg.retrieval_strategy = meta.retrieval_strategy
              msg.evidence = meta.evidence
            })
          },
          onToolResults: toolResults => {
            updateAssistantMessage(msg => {
              msg.tool_results = toolResults
            })
            toolHandlerRegistry.handleToolResults(toolResults)
          },
          onConfirmationRequired: confirmation => {
            aiStore.setPendingConfirmation({
              action: confirmation.action,
              args: confirmation.args,
              message: confirmation.message || t('ai.confirmAction')
            })
            updateAssistantMessage(msg => {
              msg.type = 'confirmation_required'
              msg.action = confirmation.action
              msg.args = confirmation.args
              if (!msg.content.trim()) {
                msg.content = confirmation.message || t('ai.confirmAction')
              }
            })
          },
          onError: message => {
            throw new Error(message || t('ai.sidebar.errorGeneral'))
          },
        },
        abortController.value.signal
      )

      stopProcessing()
      updateAssistantMessage(msg => {
        if (!msg.content.trim()) {
          msg.content = t('ai.errorDefault')
        }
      })
    } catch (error: unknown) {
      stopProcessing()
      // AbortError can be either Error or DOMException depending on environment
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof DOMException && error.name === 'AbortError')
      )
        return
      console.error('Chat error:', error)
      updateAssistantMessage(msg => {
        msg.type = 'error'
        msg.content = parseErrorMessage(error)
      })
    } finally {
      abortController.value = null
      aiStore.setSending(false)
    }
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  onUnmounted(() => {
    stopProcessing()
    cancelRequest()
  })

  return {
    aiStore,
    currentThinkingText,
    sendMessage,
    startProcessing,
    stopProcessing,
    stopResponse,
    cancelRequest
  }
}
