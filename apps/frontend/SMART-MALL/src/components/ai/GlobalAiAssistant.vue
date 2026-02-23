<script setup lang="ts">
/**
 * ============================================================================
 * 全局 AI 助手组件 (GlobalAiAssistant)
 * ============================================================================
 *
 * 【组件职责】
 * 提供全局可用的 AI 助手「小智」，包括：
 * - 悬浮按钮（点击展开聊天面板）
 * - 聊天面板（对话界面）
 * - 意图识别（导航、搜索、操作等）
 * - 思考过程展示
 * - 停止回答功能
 *
 * 【全局可用】
 * 这个组件放在 SmartMall.vue 根组件中，
 * 确保在所有页面都可以使用 AI 助手。
 *
 * 【意图识别】
 * 支持识别用户意图并执行相应操作：
 * - 导航：「打开商品管理」→ 跳转到商品管理页
 * - 搜索：「搜索 Nike」→ 执行搜索
 * - 操作：「添加商品」→ 执行添加操作
 * ============================================================================
 */
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElInput, ElButton, ElIcon, ElUpload, ElMessage } from 'element-plus'
import { Promotion, Picture, Close } from '@element-plus/icons-vue'
import { intelligenceApi } from '@/api/intelligence.api'
import AiFloatingTrigger from '@/components/ai/AiFloatingTrigger.vue'
import { useAiStore } from '@/stores'

// ============================================================================
// 状态
// ============================================================================

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const aiStore = useAiStore()

/** 是否在 Admin 或 Merchant 或 Mall Dashboard 路由下（AI 由 Layout 内的 AiSidebar 处理） */
const isAdminOrMerchantRoute = computed(() => {
  return route.path.startsWith('/admin') || route.path.startsWith('/merchant') || route.path.startsWith('/mall')
})

/** 输入框内容 */
const inputText = ref('')

/** 待上传的图片 */
const pendingImage = ref<string | null>(null)

/** 消息列表容器引用 */
const messagesContainer = ref<HTMLElement | null>(null)

/** 输入框引用 */
const inputRef = ref<InstanceType<typeof ElInput> | null>(null)

/** 当前请求的 AbortController */
const abortController = ref<AbortController | null>(null)

/** 处理步骤（企业级） */
const agentSteps = ref<Array<{ text: string; status: 'pending' | 'active' | 'done' }>>([])

/** 当前步骤索引 */
const currentStepIndex = ref(0)

/** 处理动画定时器 */
let processingTimer: ReturnType<typeof setInterval> | null = null

// Agent 处理步骤（企业级文案）
const AGENT_STEPS = computed(() => [
  { text: t('ai.steps.analyze'), delay: 400 },
  { text: t('ai.steps.retrieve'), delay: 500 },
  { text: t('ai.steps.execute'), delay: 600 },
  { text: t('ai.steps.generate'), delay: 400 },
])

// ============================================================================
// 方法
// ============================================================================

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

/** 开始处理动画 */
function startProcessing() {
  // 初始化步骤
  agentSteps.value = AGENT_STEPS.value.map((step, index) => ({
    text: step.text,
    status: index === 0 ? 'active' : 'pending'
  }))
  currentStepIndex.value = 0
  
  // 逐步推进
  let stepIndex = 0
  processingTimer = setInterval(() => {
    // 将当前步骤标记为完成
    const currentStep = agentSteps.value[stepIndex]
    if (currentStep) {
      currentStep.status = 'done'
    }
    
    stepIndex++
    currentStepIndex.value = stepIndex
    
    // 激活下一步
    if (stepIndex < AGENT_STEPS.value.length) {
      const nextStep = agentSteps.value[stepIndex]
      if (nextStep) {
        nextStep.status = 'active'
      }
      scrollToBottom()
    } else {
      // 全部完成，停止定时器
      if (processingTimer) {
        clearInterval(processingTimer)
        processingTimer = null
      }
    }
  }, 500)
}

/** 停止处理动画 */
function stopProcessing() {
  if (processingTimer) {
    clearInterval(processingTimer)
    processingTimer = null
  }
  agentSteps.value = []
  currentStepIndex.value = 0
}

/** 停止回答 */
function stopResponse() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  stopProcessing()
  aiStore.setSending(false)
  
  // 添加一条提示消息
  aiStore.addMessage({
    role: 'assistant',
    content: t('ai.sidebar.stopped'),
    type: 'text',
  })
  scrollToBottom()
}

/** 解析错误消息，返回用户友好的提示 */
function parseErrorMessage(error: unknown): string {
  // 如果是 HTTP 错误对象
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    
    // 检查常见的错误结构
    const message = err.message || err.msg || err.detail
    if (typeof message === 'string') {
      // API Key 错误
      if (message.includes('invalid_api_key') || message.includes('401')) {
        return t('ai.sidebar.errorApiKey')
      }
      // 限流错误
      if (message.includes('rate_limit') || message.includes('429')) {
        return t('ai.sidebar.errorRateLimit')
      }
      // 超时错误
      if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return t('ai.sidebar.errorTimeout')
      }
      // 网络错误
      if (message.includes('network') || message.includes('ECONNREFUSED')) {
        return t('ai.sidebar.errorNetwork')
      }
    }
    
    // 检查 HTTP 状态码
    const status = err.status || err.statusCode
    if (typeof status === 'number') {
      if (status === 401) return t('ai.sidebar.errorApiKey')
      if (status === 429) return t('ai.sidebar.errorRateLimit')
      if (status === 503) return t('ai.sidebar.errorTimeout')
      if (status >= 500) return t('ai.sidebar.errorGeneral')
    }
  }
  
  // 默认错误消息
  return t('ai.sidebar.errorGeneral')
}

/** 发送消息 */
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text && !pendingImage.value) return
  if (aiStore.isSending) return

  // 添加用户消息
  aiStore.addMessage({
    role: 'user',
    content: text,
    image_url: pendingImage.value || undefined,
  })

  const imageUrl = pendingImage.value
  inputText.value = ''
  pendingImage.value = null
  scrollToBottom()

  // 创建 AbortController 用于取消请求
  abortController.value = new AbortController()
  
  // 调用 AI 服务（后端会处理意图识别）
  aiStore.setSending(true)
  startProcessing()

  try {
    const response = await intelligenceApi.chat(
      text, 
      imageUrl || undefined, 
      { current_floor: route.path },
      abortController.value.signal
    )
    
    stopProcessing()
    
    console.log('[AI] Response received:', response)
    
    // 处理响应 — 统一由 ai.store 的 handleResponse + ToolHandlerRegistry 处理
    aiStore.handleResponse(response)
    scrollToBottom()
  } catch (error: unknown) {
    stopProcessing()
    
    // 检查是否是用户主动取消
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request aborted by user')
      return
    }
    
    // 显示错误消息
    console.error('Chat error:', error)
    const errorMessage = parseErrorMessage(error)
    aiStore.addMessage({
      role: 'assistant',
      content: errorMessage,
      type: 'error',
    })
  } finally {
    abortController.value = null
    aiStore.setSending(false)
    scrollToBottom()
  }
}

/** 确认操作 */
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
  } catch (error) {
    stopProcessing()
    console.error('Confirm error:', error)
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

/** 处理图片上传 */
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
    const imageUrl = await intelligenceApi.uploadImage(file)
    pendingImage.value = imageUrl
  } catch (error) {
    ElMessage.error(t('ai.sidebar.imageUploadFailed'))
  }

  return false
}

/** 移除待上传图片 */
function removePendingImage() {
  pendingImage.value = null
}

/** 处理键盘事件 */
function handleKeydown(event: Event) {
  const e = event as KeyboardEvent
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

/** 快捷导航 - 通过 AI 处理 */
function quickNavigate(label: string) {
  inputText.value = `打开${label}`
  sendMessage()
}

// ============================================================================
// 生命周期
// ============================================================================

// 监听面板显示状态 — 初始化欢迎消息并聚焦输入框
watch(() => aiStore.isPanelVisible, (visible) => {
  if (visible) {
    aiStore.initWelcomeMessage()
    scrollToBottom()
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopProcessing()
  if (abortController.value) {
    abortController.value.abort()
  }
})
</script>

<template>
  <div v-if="!isAdminOrMerchantRoute" class="global-ai-assistant">
    <!-- FAB trigger (extracted component) -->
    <AiFloatingTrigger />

    <!-- 聊天面板 -->
    <Transition name="panel-slide">
      <div v-show="aiStore.isPanelVisible" class="ai-chat-panel">
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-title">
            <ElIcon :size="20" class="ai-icon"><Promotion /></ElIcon>
            <span>{{ t('ai.panel.title') }}</span>
          </div>
          <button class="btn-close" @click="aiStore.hidePanel">
            <ElIcon><Close /></ElIcon>
          </button>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <button class="quick-btn" @click="quickNavigate(t('ai.quick.dashboard'))">{{ t('ai.quick.dashboard') }}</button>
          <button class="quick-btn" @click="quickNavigate(t('ai.quick.productManage'))">{{ t('ai.quick.productManage') }}</button>
          <button class="quick-btn" @click="quickNavigate(t('ai.quick.mallBuilder'))">{{ t('ai.quick.mallBuilder') }}</button>
          <button class="quick-btn" @click="quickNavigate(t('ai.quick.mall3d'))">{{ t('ai.quick.mall3d') }}</button>
        </div>

        <!-- 消息列表 -->
        <div ref="messagesContainer" class="messages-container">
          <div
            v-for="msg in aiStore.messages"
            :key="msg.id"
            :class="['message', msg.role]"
          >
            <!-- 用户消息 -->
            <template v-if="msg.role === 'user'">
              <div class="message-content user-message">
                <img v-if="msg.image_url" :src="msg.image_url" class="message-image" />
                <p>{{ msg.content }}</p>
              </div>
            </template>

            <!-- AI 消息 -->
            <template v-else>
              <div class="message-content assistant-message">
                <p class="message-text">{{ msg.content }}</p>
                
                <!-- 确认按钮 -->
                <div v-if="msg.type === 'confirmation_required' || msg.type === 'confirm'" class="confirm-actions">
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

          <!-- 加载中 - 企业级 Agent 步骤 -->
          <div v-if="aiStore.isSending" class="message assistant">
            <div class="message-content assistant-message processing">
              <!-- 进度条 -->
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${(currentStepIndex / AGENT_STEPS.length) * 100}%` }"
                />
              </div>
              
              <!-- Agent 步骤列表 -->
              <div class="agent-steps">
                <div 
                  v-for="(step, index) in agentSteps" 
                  :key="index"
                  class="agent-step"
                  :class="step.status"
                >
                  <span class="step-dot" />
                  <span class="step-text">{{ step.text }}</span>
                </div>
              </div>
              
              <!-- 取消按钮 -->
              <button class="btn-stop" @click="stopResponse">
                <span>{{ t('common.cancel') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 待上传图片预览 -->
          <div v-if="pendingImage" class="pending-image">
            <img :src="pendingImage" :alt="t('ai.sidebar.pendingImage')" />
            <button class="btn-remove" @click="removePendingImage">
              <ElIcon><Close /></ElIcon>
            </button>
          </div>

          <div class="input-row">
            <!-- 图片上传 -->
            <ElUpload
              :show-file-list="false"
              :before-upload="handleImageUpload"
              accept="image/*"
              :disabled="aiStore.isSending"
            >
              <ElButton :icon="Picture" circle class="btn-upload" :disabled="aiStore.isSending" />
            </ElUpload>

            <!-- 文本输入 -->
            <ElInput
              ref="inputRef"
              v-model="inputText"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 4 }"
              :placeholder="aiStore.isSending ? t('ai.sidebar.thinking') : t('ai.inputPlaceholder')"
              :disabled="aiStore.isSending"
              resize="none"
              @keydown="handleKeydown"
            />

            <!-- 发送按钮 -->
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
    </Transition>
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.global-ai-assistant {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
}

/* 聊天面板 */
.ai-chat-panel {
  position: absolute;
  right: 0;
  bottom: 64px;
  width: 380px;
  height: 520px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  @include flex-column;
  overflow: hidden;
}

/* 面板动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity $duration-normal, transform $duration-normal;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 头部 */
.panel-header {
  @include flex-between;
  padding: 14px $space-4;
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
  border-radius: 6px;
  color: var(--text-secondary);
  @include flex-center;
  @include clickable;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: $space-2;
  padding: 10px $space-4;
  border-bottom: 1px solid var(--border-subtle);
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.quick-btn {
  flex-shrink: 0;
  padding: 6px $space-3;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  @include clickable;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-muted);
    color: var(--text-primary);
  }
}

/* 消息列表 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: $space-4;
  @include flex-column;
  gap: $space-3;

  @include scrollbar-thin;
}

/* 消息 */
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
    max-height: 150px;
    border-radius: 6px;
    margin-bottom: $space-2;
  }
}

.assistant-message {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-bottom-left-radius: 2px;

  /* 处理中状态 - 企业级 Agent 步骤 */
  &.processing {
    padding: 14px $space-4;
    min-width: 200px;
    
    /* 进度条 */
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
    
    /* Agent 步骤列表 */
    .agent-steps {
      @include flex-column;
      gap: $space-2;
    }
    
    .agent-step {
      @include flex-center-y;
      gap: 10px;
      font-size: 13px;
      
      .step-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--border-muted);
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .step-text {
        color: var(--text-muted);
        transition: color 0.2s ease;
      }
      
      /* 待处理 */
      &.pending {
        .step-dot {
          background: var(--border-muted);
        }
        .step-text {
          color: var(--text-muted);
        }
      }
      
      /* 进行中 */
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
      
      /* 已完成 */
      &.done {
        .step-dot {
          background: var(--success);
        }
        .step-text {
          color: var(--text-secondary);
        }
      }
    }
    
    /* 取消按钮 */
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

/* 确认按钮 */
.confirm-actions {
  display: flex;
  gap: $space-2;
  margin-top: $space-3;
}

/* 输入区域 */
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
    border-radius: $radius-md;
    border: 1px solid rgba(var(--white-rgb), 0.1);
  }

  .btn-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: var(--error);
    border: none;
    border-radius: 50%;
    color: white;
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
    border-radius: 6px;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 480px) {
  .global-ai-assistant {
    right: $space-4;
    bottom: $space-4;
  }

  .ai-chat-panel {
    position: fixed;
    right: 10px;
    left: 10px;
    bottom: 70px;
    width: auto;
    height: 60vh;
  }
}
</style>
