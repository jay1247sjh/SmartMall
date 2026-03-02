<script setup lang="ts">
/**
 * ============================================================================
 * AI Copilot 侧边栏组件 (AiSidebar)
 * ============================================================================
 *
 * 【组件职责】
 * 在 Admin/Merchant 布局中以侧边栏形式集成 AI 助手，包括：
 * - 从右侧滑入的 Copilot 面板
 * - 复用 ai.store 的聊天状态管理
 * - Agent 处理步骤动画
 * - 展开/收起 CSS transition 动画
 *
 * 【使用方式】
 * <AiSidebar v-model:visible="aiVisible" />
 * ============================================================================
 */
import { ref, nextTick, watch, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElInput, ElButton, ElIcon, ElUpload, ElMessage } from 'element-plus'
import { Promotion, Picture, Close, Microphone } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { intelligenceApi } from '@/api/intelligence.api'
import type { ChatMessage } from '@/api/intelligence.api'
import { useAiStore } from '@/stores'
import { toolHandlerRegistry } from '@/agent/tool-handler-registry'
import { useVoiceSession } from '@/composables/ai/useVoiceSession'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  visible: boolean
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 380
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// ============================================================================
// State
// ============================================================================

const { t } = useI18n()
const route = useRoute()
const aiStore = useAiStore()

const inputText = ref('')
const pendingImage = ref<string | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<InstanceType<typeof ElInput> | null>(null)
const abortController = ref<AbortController | null>(null)

/** 当前 thinking 阶段索引 */
const currentThinkingIndex = ref(0)
let processingTimer: ReturnType<typeof setInterval> | null = null

const THINKING_STAGES = computed(() => [t('ai.sidebar.thinking')])

const currentThinkingText = computed(() => {
  return THINKING_STAGES.value[currentThinkingIndex.value] || t('ai.sidebar.thinking')
})

const isCollapsed = computed(() => !props.visible)

const voiceSession = useVoiceSession({
  language: 'zh-CN',
  onAsrFinal: text => {
    if (!text.trim()) return
    aiStore.addMessage({
      role: 'user',
      content: text,
      type: 'text'
    })
    scrollToBottom()
  },
  onAssistantFinal: text => {
    aiStore.addMessage({
      role: 'assistant',
      content: text,
      type: 'text'
    })
    scrollToBottom()
  },
  onConfirmationRequired: payload => {
    aiStore.setPendingConfirmation({
      action: payload.action,
      args: payload.args || {},
      message: payload.message || t('ai.confirmAction')
    })
    aiStore.addMessage({
      role: 'assistant',
      content: payload.message || t('ai.confirmAction'),
      type: 'confirmation_required',
      action: payload.action,
      args: payload.args || {}
    })
    scrollToBottom()
  },
  onError: message => {
    aiStore.addMessage({
      role: 'assistant',
      content: message || t('ai.sidebar.errorGeneral'),
      type: 'error'
    })
    scrollToBottom()
  }
})

const voiceState = computed(() => voiceSession.voiceState.value)
const isVoiceListening = computed(() => voiceSession.isListening.value)
const voicePartial = computed(() => voiceSession.asrPartial.value)
const voiceModeHint = computed(() => voiceSession.modeHint.value)
const voiceStateLabel = computed(() => {
  if (voiceState.value === 'listening') return '语音识别中...'
  if (voiceState.value === 'thinking') return '语音处理中...'
  if (voiceState.value === 'speaking') return '语音播报中...'
  if (voiceState.value === 'interrupted') return '已打断，准备新输入'
  if (voiceState.value === 'error') return '语音不可用，请改用文本'
  return '点击麦克风开始语音'
})

// ============================================================================
// Methods
// ============================================================================

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function startProcessing() {
  currentThinkingIndex.value = 0

  if (processingTimer) {
    clearInterval(processingTimer)
    processingTimer = null
  }

  processingTimer = setInterval(() => {
    const next = currentThinkingIndex.value + 1
    currentThinkingIndex.value = next % Math.max(THINKING_STAGES.value.length, 1)
  }, 1200)
}

function stopProcessing() {
  if (processingTimer) {
    clearInterval(processingTimer)
    processingTimer = null
  }
  currentThinkingIndex.value = 0
}

function stopResponse() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  stopProcessing()
  aiStore.setSending(false)
  aiStore.addMessage({
    role: 'assistant',
    content: t('ai.sidebar.stopped'),
    type: 'text'
  })
  scrollToBottom()
}

function closeSidebar() {
  emit('update:visible', false)
}

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

function formatEvidenceScore(score?: number): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return '-'
  return score.toFixed(2)
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text && !pendingImage.value) return
  if (aiStore.isSending) return

  aiStore.addMessage({
    role: 'user',
    content: text,
    image_url: pendingImage.value || undefined
  })

  const imageUrl = pendingImage.value
  inputText.value = ''
  pendingImage.value = null
  scrollToBottom()

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
    await intelligenceApi.chatStream(
      text,
      imageUrl || undefined,
      { current_floor: route.path },
      {
        onToken: token => {
          updateAssistantMessage(msg => {
            msg.content += token
          })
          scrollToBottom()
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
    scrollToBottom()
  } catch (error: unknown) {
    stopProcessing()
    if (error instanceof Error && error.name === 'AbortError') return
    console.error('Chat error:', error)
    updateAssistantMessage(msg => {
      msg.type = 'error'
      msg.content = parseErrorMessage(error)
    })
  } finally {
    abortController.value = null
    aiStore.setSending(false)
    scrollToBottom()
  }
}

async function confirmAction(confirmed: boolean) {
  if (!aiStore.pendingConfirmation) return
  const { action, args } = aiStore.pendingConfirmation
  aiStore.clearPendingConfirmation()
  aiStore.setSending(true)
  startProcessing()

  try {
    const response = await intelligenceApi.confirm(action, args, confirmed)
    stopProcessing()
    aiStore.handleResponse(response)
  } catch {
    stopProcessing()
    aiStore.addMessage({
      role: 'assistant',
      content: t('ai.sidebar.actionFailed'),
      type: 'error'
    })
  } finally {
    aiStore.setSending(false)
    scrollToBottom()
  }
}

async function handleImageUpload(file: File) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning(t('ai.sidebar.imageTypeError'))
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning(t('ai.sidebar.imageSizeError'))
    return false
  }
  try {
    pendingImage.value = await intelligenceApi.uploadImage(file)
  } catch {
    ElMessage.error(t('ai.sidebar.imageUploadFailed'))
  }
  return false
}

function removePendingImage() {
  pendingImage.value = null
}

function handleKeydown(event: Event) {
  const e = event as KeyboardEvent
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

async function toggleVoice() {
  try {
    await voiceSession.toggleListening()
  } catch {
    ElMessage.error('无法启动语音，请检查麦克风权限')
  }
}

// ============================================================================
// Watchers & Lifecycle
// ============================================================================

watch(
  () => props.visible,
  visible => {
    if (visible) {
      aiStore.initWelcomeMessage()
      scrollToBottom()
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
)

onUnmounted(() => {
  stopProcessing()
  if (abortController.value) {
    abortController.value.abort()
  }
  voiceSession.cleanup()
})
</script>

<template>
  <aside
    class="ai-sidebar"
    :class="{ collapsed: isCollapsed }"
    :style="{ width: isCollapsed ? '0px' : `${props.width}px` }"
  >
    <div class="sidebar-inner">
      <!-- Header -->
      <div class="sidebar-header">
        <div class="header-title">
          <ElIcon :size="18" class="ai-icon"><Promotion /></ElIcon>
          <span>{{ t('ai.sidebar.title') }}</span>
        </div>
        <button class="btn-close" @click="closeSidebar">
          <ElIcon :size="16"><Close /></ElIcon>
        </button>
      </div>

      <!-- Messages -->
      <div ref="messagesContainer" class="messages-container">
        <div v-for="msg in aiStore.messages" :key="msg.id" :class="['message', msg.role]">
          <template v-if="msg.role === 'user'">
            <div class="message-content user-message">
              <img v-if="msg.image_url" :src="msg.image_url" class="message-image" />
              <p>{{ msg.content }}</p>
            </div>
          </template>

          <template v-else>
            <div class="message-content assistant-message">
              <p class="message-text">{{ msg.content }}</p>
              <div v-if="msg.evidence?.length" class="evidence-block">
                <div class="evidence-title">Evidence</div>
                <div v-for="item in msg.evidence" :key="`${msg.id}-${item.id}`" class="evidence-item">
                  <div class="evidence-meta">
                    <span>{{ item.source_type }}/{{ item.source_collection }}</span>
                    <span>score {{ formatEvidenceScore(item.score) }}</span>
                  </div>
                  <p class="evidence-snippet">{{ item.snippet }}</p>
                </div>
              </div>
              <div
                v-if="msg.type === 'confirmation_required' || msg.type === 'confirm'"
                class="confirm-actions"
              >
                <ElButton type="primary" size="small" @click="confirmAction(true)">
                  {{ t('common.confirm') }}
                </ElButton>
                <ElButton size="small" @click="confirmAction(false)">
                  {{ t('common.cancel') }}
                </ElButton>
              </div>
            </div>
          </template>
        </div>

        <!-- Processing steps -->
        <div v-if="aiStore.isSending" class="message assistant">
          <div class="message-content assistant-message processing">
            <div class="thinking-line">
              <span class="thinking-dot" />
              <span class="thinking-text">{{ currentThinkingText }}</span>
            </div>
            <button class="btn-stop" @click="stopResponse">
              <span>{{ t('common.cancel') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="input-area">
        <div class="voice-status" :class="voiceState">
          <span>{{ voiceStateLabel }}</span>
          <span v-if="voicePartial" class="voice-partial">{{ voicePartial }}</span>
          <span v-else-if="voiceModeHint" class="voice-partial">{{ voiceModeHint }}</span>
        </div>

        <div v-if="pendingImage" class="pending-image">
          <img :src="pendingImage" :alt="t('ai.sidebar.pendingImage')" />
          <button class="btn-remove" @click="removePendingImage">
            <ElIcon :size="12"><Close /></ElIcon>
          </button>
        </div>

        <div class="input-row">
          <ElUpload
            :show-file-list="false"
            :before-upload="handleImageUpload"
            accept="image/*"
            :disabled="aiStore.isSending || isVoiceListening"
          >
            <ElButton
              :icon="Picture"
              circle
              class="btn-upload"
              :disabled="aiStore.isSending || isVoiceListening"
            />
          </ElUpload>

          <ElButton
            :icon="Microphone"
            circle
            class="btn-voice"
            :type="isVoiceListening ? 'danger' : 'default'"
            :disabled="aiStore.isSending"
            @click="toggleVoice"
          />

          <ElInput
            ref="inputRef"
            v-model="inputText"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :placeholder="
              aiStore.isSending ? t('ai.sidebar.thinking') : t('ai.sidebar.placeholder')
            "
            :disabled="aiStore.isSending || isVoiceListening"
            resize="none"
            @keydown="handleKeydown"
          />

          <ElButton
            type="primary"
            :icon="Promotion"
            circle
            :disabled="(!inputText.trim() && !pendingImage) || aiStore.isSending"
            @click="sendMessage"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// Sidebar Container
// ============================================================================

.ai-sidebar {
  position: relative;
  flex-shrink: 0;
  height: 100%;
  border-left: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  transition:
    width $duration-slow $ease-in-out,
    opacity $duration-normal;
  overflow: hidden;

  &.collapsed {
    width: 0;
    border-left: none;
    opacity: 0;
  }
}

.sidebar-inner {
  width: 380px;
  height: 100%;
  @include flex-column;
}

// ============================================================================
// Header
// ============================================================================

.sidebar-header {
  @include flex-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-tertiary);
}

.header-title {
  @include flex-center-y;
  gap: $space-2;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: var(--text-primary);

  .ai-icon {
    color: var(--accent-primary);
  }
}

.btn-close {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  color: var(--text-secondary);
  @include flex-center;
  @include clickable;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
}

// ============================================================================
// Messages
// ============================================================================

.messages-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: $space-4;
  @include flex-column;
  gap: $space-3;
  @include scrollbar-thin;
}

.message {
  display: flex;

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }
}

.message-content {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: $radius-md;
  font-size: $font-size-base;
  line-height: 1.5;

  p {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.user-message {
  background: var(--accent-primary);
  color: #fff;
  border-bottom-right-radius: 2px;

  .message-image {
    max-width: 100%;
    max-height: 120px;
    border-radius: $radius-sm;
    margin-bottom: $space-2;
  }
}

.assistant-message {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-bottom-left-radius: 2px;

  &.processing {
    padding: 12px $space-4;
    min-width: 180px;

    .thinking-line {
      @include flex-center-y;
      gap: $space-2;

      .thinking-dot {
        width: 7px;
        height: 7px;
        flex-shrink: 0;
        border-radius: $radius-full;
        background: var(--accent-primary);
        box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.18);
        animation: pulse-dot 1.3s ease-in-out infinite;
      }

      .thinking-text {
        font-size: $font-size-sm;
        font-weight: $font-weight-medium;
        background: linear-gradient(
          120deg,
          var(--text-muted) 10%,
          var(--text-primary) 45%,
          var(--text-muted) 85%
        );
        background-size: 220% 100%;
        background-position: 100% 0;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        animation: thinking-glow 1.8s linear infinite;
      }
    }

    .btn-stop {
      @include flex-center-y;
      margin-top: $space-3;
      padding: $space-1 10px;
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: $radius-sm;
      color: var(--text-muted);
      font-size: $font-size-sm;
      @include clickable;

      &:hover {
        border-color: var(--border-muted);
        color: var(--text-secondary);
      }
    }
  }
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

@keyframes thinking-glow {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

.message-text {
  white-space: pre-wrap;
}

.evidence-block {
  margin-top: $space-3;
  padding-top: $space-2;
  border-top: 1px dashed var(--border-subtle);
}

.evidence-title {
  font-size: $font-size-xs;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: $space-2;
}

.evidence-item {
  margin-bottom: $space-2;
}

.evidence-meta {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
  font-size: $font-size-xs;
  color: var(--text-muted);
}

.evidence-snippet {
  margin-top: $space-1;
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.confirm-actions {
  display: flex;
  gap: $space-2;
  margin-top: $space-3;
}

// ============================================================================
// Input Area
// ============================================================================

.input-area {
  padding: $space-3 $space-4;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-primary);
}

.voice-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
  font-size: $font-size-sm;
  color: var(--text-muted);

  .voice-partial {
    margin-left: $space-2;
    color: var(--text-secondary);
  }

  &.listening {
    color: var(--accent-primary);
  }

  &.speaking {
    color: var(--success);
  }

  &.error {
    color: var(--error);
  }
}

.pending-image {
  position: relative;
  display: inline-block;
  margin-bottom: $space-2;

  img {
    max-width: 100px;
    max-height: 80px;
    border-radius: $radius-sm;
    border: 1px solid var(--border-subtle);
  }

  .btn-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: var(--error);
    border: none;
    border-radius: $radius-full;
    color: #fff;
    @include flex-center;
    @include clickable;
  }
}

.input-row {
  @include flex-center-y;
  gap: $space-2;

  .btn-upload,
  .btn-voice {
    flex-shrink: 0;
  }

  :deep(.el-textarea__inner) {
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    color: var(--text-primary);
    padding: 10px $space-3;

    &::placeholder {
      color: var(--text-muted);
    }

    &:focus {
      border-color: var(--accent-primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--bg-tertiary);
    }
  }
}
</style>
