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
import { useRouter, useRoute } from 'vue-router'
import { ElInput, ElButton, ElIcon, ElUpload, ElMessage } from 'element-plus'
import { Promotion, Picture, Close } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { intelligenceApi } from '@/api/intelligence.api'
import { mallBuilderApi, toCreateRequest } from '@/api/mall-builder.api'
import type { MallProject } from '@/builder/types/mall-project'
import { useAiStore } from '@/stores'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  visible: boolean
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 380,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

// ============================================================================
// State
// ============================================================================

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const aiStore = useAiStore()

const inputText = ref('')
const pendingImage = ref<string | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<InstanceType<typeof ElInput> | null>(null)
const abortController = ref<AbortController | null>(null)

/** Agent processing steps */
const agentSteps = ref<Array<{ text: string; status: 'pending' | 'active' | 'done' }>>([])
const currentStepIndex = ref(0)
let processingTimer: ReturnType<typeof setInterval> | null = null

const AGENT_STEPS = [
  { text: 'ai.steps.analyze', delay: 400 },
  { text: 'ai.steps.retrieve', delay: 500 },
  { text: 'ai.steps.execute', delay: 600 },
  { text: 'ai.steps.generate', delay: 400 },
]

const isCollapsed = computed(() => !props.visible)

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
      scrollToBottom()
    } else {
      if (processingTimer) {
        clearInterval(processingTimer)
        processingTimer = null
      }
    }
  }, 500)
}

function stopProcessing() {
  if (processingTimer) {
    clearInterval(processingTimer)
    processingTimer = null
  }
  agentSteps.value = []
  currentStepIndex.value = 0
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
    type: 'text',
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

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text && !pendingImage.value) return
  if (aiStore.isSending) return

  aiStore.addMessage({
    role: 'user',
    content: text,
    image_url: pendingImage.value || undefined,
  })

  const imageUrl = pendingImage.value
  inputText.value = ''
  pendingImage.value = null
  scrollToBottom()

  abortController.value = new AbortController()
  aiStore.setSending(true)
  startProcessing()

  try {
    const response = await intelligenceApi.chat(
      text,
      imageUrl || undefined,
      { current_floor: route.path },
      abortController.value.signal,
    )

    stopProcessing()
    aiStore.handleResponse(response)
    scrollToBottom()

    if (response.type === 'navigate' && response.navigateTo) {
      if (route.path !== response.navigateTo) {
        router.push(response.navigateTo)
      }
    }

    if (response.type === 'mall_generated' && response.args?.mallData) {
      try {
        const mallData = response.args.mallData as MallProject
        const createRequest = toCreateRequest(mallData)
        const createdProject = await mallBuilderApi.createProject(createRequest)
        ElMessage.success(t('ai.sidebar.mallGenerated'))
        setTimeout(() => {
          router.push(`/admin/builder/${createdProject.projectId}`)
        }, 500)
      } catch {
        localStorage.setItem('ai_generated_mall', JSON.stringify(response.args.mallData))
        ElMessage.warning(t('ai.sidebar.mallSaveFailed'))
        setTimeout(() => {
          router.push('/admin/builder')
        }, 500)
      }
    }
  } catch (error: unknown) {
    stopProcessing()
    if (error instanceof Error && error.name === 'AbortError') return
    console.error('Chat error:', error)
    aiStore.addMessage({
      role: 'assistant',
      content: parseErrorMessage(error),
      type: 'error',
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
      type: 'error',
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

// ============================================================================
// Watchers & Lifecycle
// ============================================================================

watch(() => props.visible, (visible) => {
  if (visible) {
    aiStore.initWelcomeMessage()
    scrollToBottom()
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

onUnmounted(() => {
  stopProcessing()
  if (abortController.value) {
    abortController.value.abort()
  }
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
        <div
          v-for="msg in aiStore.messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <template v-if="msg.role === 'user'">
            <div class="message-content user-message">
              <img v-if="msg.image_url" :src="msg.image_url" class="message-image" />
              <p>{{ msg.content }}</p>
            </div>
          </template>

          <template v-else>
            <div class="message-content assistant-message">
              <p class="message-text">{{ msg.content }}</p>
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
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(currentStepIndex / AGENT_STEPS.length) * 100}%` }"
              />
            </div>
            <div class="agent-steps">
              <div
                v-for="(step, index) in agentSteps"
                :key="index"
                class="agent-step"
                :class="step.status"
              >
                <span class="step-dot" />
                <span class="step-text">{{ t(step.text) }}</span>
              </div>
            </div>
            <button class="btn-stop" @click="stopResponse">
              <span>{{ t('common.cancel') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="input-area">
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
            :disabled="aiStore.isSending"
          >
            <ElButton :icon="Picture" circle class="btn-upload" :disabled="aiStore.isSending" />
          </ElUpload>

          <ElInput
            ref="inputRef"
            v-model="inputText"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :placeholder="aiStore.isSending ? t('ai.sidebar.thinking') : t('ai.sidebar.placeholder')"
            :disabled="aiStore.isSending"
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
  transition: width $duration-slow $ease-in-out, opacity $duration-normal;
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
    padding: 14px $space-4;
    min-width: 180px;

    .progress-bar {
      height: 2px;
      background: var(--border-subtle);
      border-radius: 1px;
      margin-bottom: 14px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 1px;
        transition: width $duration-slow;
      }
    }

    .agent-steps {
      @include flex-column;
      gap: $space-2;
    }

    .agent-step {
      @include flex-center-y;
      gap: 10px;
      font-size: $font-size-sm + 1;

      .step-dot {
        width: 6px;
        height: 6px;
        flex-shrink: 0;
        border-radius: $radius-full;
        background: var(--border-muted);
        transition: all $duration-normal;
      }

      .step-text {
        color: var(--text-muted);
        transition: color $duration-normal;
      }

      &.pending {
        .step-dot {
          background: var(--border-muted);
        }

        .step-text {
          color: var(--text-muted);
        }
      }

      &.active {
        .step-dot {
          background: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.2);
          animation: pulse-dot 1.5s ease-in-out infinite;
        }

        .step-text {
          color: var(--text-primary);
          font-weight: $font-weight-medium;
        }
      }

      &.done {
        .step-dot {
          background: var(--success);
        }

        .step-text {
          color: var(--text-secondary);
        }
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
  0%, 100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.message-text {
  white-space: pre-wrap;
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

  .btn-upload {
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
