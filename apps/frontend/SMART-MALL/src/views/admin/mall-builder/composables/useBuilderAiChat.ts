/**
 * ============================================================================
 * 建模器 AI 聊天 composable (useBuilderAiChat)
 * ============================================================================
 *
 * 【职责】
 * 抽取 AiSidebar 中的公共聊天逻辑，供 BuilderInlineInput 和
 * BuilderBottomDrawer 共用，包括：
 * - 消息发送（intelligenceApi.chat）
 * - Agent 处理步骤动画
 * - 请求取消 / 停止响应
 *
 * 【使用方式】
 * const { aiStore, agentSteps, sendMessage, stopResponse } = useBuilderAiChat()
 *
 * Requirements: 3.1
 * ============================================================================
 */

import { ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { intelligenceApi } from '@/api/intelligence.api'
import { useAiStore } from '@/stores'

/** Agent 处理步骤 */
export interface AgentStep {
  text: string
  status: 'pending' | 'active' | 'done'
}

const AGENT_STEPS = [
  { text: 'ai.steps.analyze', delay: 400 },
  { text: 'ai.steps.retrieve', delay: 500 },
  { text: 'ai.steps.execute', delay: 600 },
  { text: 'ai.steps.generate', delay: 400 },
]

export function useBuilderAiChat() {
  const { t } = useI18n()
  const route = useRoute()
  const aiStore = useAiStore()

  const abortController = ref<AbortController | null>(null)
  const agentSteps = ref<AgentStep[]>([])
  const currentStepIndex = ref(0)
  let processingTimer: ReturnType<typeof setInterval> | null = null

  // ==========================================================================
  // Processing steps animation
  // ==========================================================================

  function startProcessing(): void {
    agentSteps.value = AGENT_STEPS.map((step, index) => ({
      text: step.text,
      status: index === 0 ? 'active' : ('pending' as const),
    }))
    currentStepIndex.value = 0

    let stepIndex = 0
    processingTimer = setInterval(() => {
      const currentStep = agentSteps.value[stepIndex]
      if (currentStep) {
        currentStep.status = 'done'
      }
      stepIndex++
      currentStepIndex.value = stepIndex

      if (stepIndex < AGENT_STEPS.length) {
        const nextStep = agentSteps.value[stepIndex]
        if (nextStep) {
          nextStep.status = 'active'
        }
      } else {
        if (processingTimer) {
          clearInterval(processingTimer)
          processingTimer = null
        }
      }
    }, 500)
  }

  function stopProcessing(): void {
    if (processingTimer) {
      clearInterval(processingTimer)
      processingTimer = null
    }
    agentSteps.value = []
    currentStepIndex.value = 0
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
      type: 'text',
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
      image_url: imageUrl || undefined,
    })

    abortController.value = new AbortController()
    aiStore.setSending(true)
    startProcessing()

    try {
      const response = await intelligenceApi.chat(
        trimmed,
        imageUrl || undefined,
        { current_floor: route.path },
        abortController.value.signal,
      )

      stopProcessing()
      aiStore.handleResponse(response)
    } catch (error: unknown) {
      stopProcessing()
      // AbortError can be either Error or DOMException depending on environment
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        (error instanceof DOMException && error.name === 'AbortError')
      ) return
      console.error('Chat error:', error)
      aiStore.addMessage({
        role: 'assistant',
        content: parseErrorMessage(error),
        type: 'error',
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
    agentSteps,
    currentStepIndex,
    sendMessage,
    startProcessing,
    stopProcessing,
    stopResponse,
    cancelRequest,
  }
}
