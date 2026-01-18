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
import { ref, nextTick, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElInput, ElButton, ElIcon, ElUpload, ElMessage, ElBadge } from 'element-plus'
import { Promotion, Picture, Close, Loading, ChatDotRound, VideoPause } from '@element-plus/icons-vue'
import { intelligenceApi } from '@/api/intelligence.api'
import { mallBuilderApi, toCreateRequest } from '@/api/mall-builder.api'
import type { MallProject } from '@/builder/types/mall-project'
import { useUserStore, useAiStore } from '@/stores'

// ============================================================================
// 状态
// ============================================================================

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const aiStore = useAiStore()

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
const AGENT_STEPS = [
  { text: '分析请求', delay: 400 },
  { text: '检索上下文', delay: 500 },
  { text: '执行操作', delay: 600 },
  { text: '生成回复', delay: 400 },
]

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
  agentSteps.value = AGENT_STEPS.map((step, index) => ({
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
    if (stepIndex < AGENT_STEPS.length) {
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
    content: '已停止回答。',
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
        return 'AI 服务配置异常，请联系管理员检查 API 密钥配置'
      }
      // 限流错误
      if (message.includes('rate_limit') || message.includes('429')) {
        return 'AI 服务请求过于频繁，请稍后再试'
      }
      // 超时错误
      if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return 'AI 服务响应超时，请稍后重试'
      }
      // 网络错误
      if (message.includes('network') || message.includes('ECONNREFUSED')) {
        return 'AI 服务连接失败，请检查网络'
      }
    }
    
    // 检查 HTTP 状态码
    const status = err.status || err.statusCode
    if (typeof status === 'number') {
      if (status === 401) return 'AI 服务配置异常，请联系管理员'
      if (status === 429) return 'AI 服务请求过于频繁，请稍后再试'
      if (status === 503) return 'AI 服务暂时不可用，请稍后重试'
      if (status >= 500) return '服务处理异常，请稍后重试'
    }
  }
  
  // 默认错误消息
  return '抱歉，处理时出现异常，请稍后重试'
}

/** 处理面板显示 */
function handleTogglePanel() {
  aiStore.togglePanel()
  if (aiStore.isPanelVisible) {
    aiStore.initWelcomeMessage()
    scrollToBottom()
    // 聚焦输入框
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
}

/** 处理导航意图 */
function handleNavigationIntent(path: string, label: string) {
  // 检查是否已在目标页面
  if (route.path === path) {
    aiStore.addMessage({
      role: 'assistant',
      content: `您已经在「${label}」页面了哦~`,
    })
    return
  }
  
  // 执行导航
  router.push(path)
  aiStore.addMessage({
    role: 'assistant',
    content: `好的，正在为您打开「${label}」...`,
  })
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
    const userId = userStore.currentUser?.userId || 'anonymous'
    const response = await intelligenceApi.chat(
      text, 
      userId, 
      imageUrl || undefined, 
      { current_floor: route.path },
      abortController.value.signal
    )
    
    stopProcessing()
    
    console.log('[AI] Response received:', response)
    
    // 处理响应
    aiStore.handleResponse(response)
    scrollToBottom()
    
    // 如果是导航类型，执行导航
    if (response.type === 'navigate' && response.navigateTo) {
      console.log('[AI] Navigate to:', response.navigateTo, 'Current:', route.path)
      // 检查是否已在目标页面
      if (route.path !== response.navigateTo) {
        console.log('[AI] Executing navigation...')
        router.push(response.navigateTo)
      } else {
        console.log('[AI] Already at target page')
      }
    }
    
    // 如果是商城生成类型，创建项目并导航到建模器页面
    if (response.type === 'mall_generated' && response.args?.mallData) {
      try {
        // 将 AI 生成的数据转换为 MallProject 格式
        const mallData = response.args.mallData as MallProject
        
        // 调用 API 创建项目
        const createRequest = toCreateRequest(mallData)
        const createdProject = await mallBuilderApi.createProject(createRequest)
        
        ElMessage.success('商城布局已生成！正在打开建模器...')
        
        // 导航到带有项目 ID 的建模器页面
        setTimeout(() => {
          router.push(`/admin/builder/${createdProject.projectId}`)
        }, 500)
      } catch (error) {
        console.error('Failed to create project:', error)
        // 如果创建失败，回退到旧方式（存储到 localStorage）
        localStorage.setItem('ai_generated_mall', JSON.stringify(response.args.mallData))
        ElMessage.warning('项目保存失败，使用临时存储')
        setTimeout(() => {
          router.push('/admin/builder')
        }, 500)
      }
    }
    
    // 处理工具调用结果
    if (response.toolResults) {
      for (const tr of response.toolResults) {
        handleToolResult(tr.function, tr.result)
      }
    }
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

/** 处理工具调用结果 */
function handleToolResult(funcName: string, result: Record<string, unknown>) {
  if (funcName === 'navigate_to_store' && result.success) {
    const store = result.store as { id: string; position: { x: number; y: number; z: number } }
    // 如果不在商城页面，先导航过去
    if (!route.path.startsWith('/mall')) {
      router.push('/mall')
    }
    // TODO: 通过事件总线或 store 通知 3D 场景导航
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
    const userId = userStore.currentUser?.userId || 'anonymous'
    const response = await intelligenceApi.confirm(action, args, confirmed, userId)
    stopProcessing()
    aiStore.handleResponse(response)
  } catch (error) {
    stopProcessing()
    console.error('Confirm error:', error)
    aiStore.addMessage({
      role: 'assistant',
      content: '操作失败，请重试。',
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
    ElMessage.warning('请上传图片文件')
    return false
  }

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }

  try {
    const imageUrl = await intelligenceApi.uploadImage(file)
    pendingImage.value = imageUrl
  } catch (error) {
    ElMessage.error('图片上传失败')
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

// 监听面板显示状态
watch(() => aiStore.isPanelVisible, (visible) => {
  if (visible) {
    scrollToBottom()
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
  <div class="global-ai-assistant">
    <!-- 悬浮按钮 -->
    <ElBadge :is-dot="aiStore.hasUnread" class="ai-badge">
      <button 
        class="ai-fab" 
        :class="{ active: aiStore.isPanelVisible }"
        @click="handleTogglePanel"
        title="智能助手"
      >
        <ElIcon :size="24">
          <Close v-if="aiStore.isPanelVisible" />
          <ChatDotRound v-else />
        </ElIcon>
      </button>
    </ElBadge>

    <!-- 聊天面板 -->
    <Transition name="panel-slide">
      <div v-show="aiStore.isPanelVisible" class="ai-chat-panel">
        <!-- 头部 -->
        <div class="panel-header">
          <div class="header-title">
            <ElIcon :size="20" class="ai-icon"><Promotion /></ElIcon>
            <span>智能助手</span>
          </div>
          <button class="btn-close" @click="aiStore.hidePanel">
            <ElIcon><Close /></ElIcon>
          </button>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <button class="quick-btn" @click="quickNavigate('控制台')">控制台</button>
          <button class="quick-btn" @click="quickNavigate('商品管理')">商品管理</button>
          <button class="quick-btn" @click="quickNavigate('商城建模')">商城建模</button>
          <button class="quick-btn" @click="quickNavigate('商城')">3D商城</button>
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
                    确认
                  </ElButton>
                  <ElButton size="small" @click="confirmAction(false)">
                    取消
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
                <span>取消</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 待上传图片预览 -->
          <div v-if="pendingImage" class="pending-image">
            <img :src="pendingImage" alt="待发送图片" />
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
            >
              <ElButton :icon="Picture" circle class="btn-upload" />
            </ElUpload>

            <!-- 文本输入 -->
            <ElInput
              ref="inputRef"
              v-model="inputText"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="输入消息，如「打开商品管理」..."
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
.global-ai-assistant {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
}

/* 悬浮按钮 */
.ai-badge {
  :deep(.el-badge__content.is-dot) {
    top: 4px;
    right: 4px;
    background: #ef4444;
  }
}

.ai-fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--accent-primary, #3b82f6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:hover {
    background: var(--accent-hover, #2563eb);
  }

  &.active {
    background: var(--bg-tertiary, #18181b);
    border: 1px solid var(--border-subtle, #27272a);
  }
}

/* 聊天面板 */
.ai-chat-panel {
  position: absolute;
  right: 0;
  bottom: 64px;
  width: 380px;
  height: 520px;
  background: var(--bg-secondary, #111113);
  border: 1px solid var(--border-subtle, #27272a);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面板动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* 头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle, #27272a);
  background: var(--bg-tertiary, #18181b);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #fafafa);

  .ai-icon {
    color: var(--accent-primary, #3b82f6);
  }
}

.btn-close {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #a1a1aa);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-tertiary, #18181b);
    color: var(--text-primary, #fafafa);
  }
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle, #27272a);
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.quick-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-subtle, #27272a);
  border-radius: 6px;
  color: var(--text-secondary, #a1a1aa);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--bg-tertiary, #18181b);
    border-color: var(--border-muted, #3f3f46);
    color: var(--text-primary, #fafafa);
  }
}

/* 消息列表 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
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
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;

  p {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.user-message {
  background: var(--accent-primary, #3b82f6);
  color: #ffffff;
  border-bottom-right-radius: 2px;

  .message-image {
    max-width: 100%;
    max-height: 150px;
    border-radius: 6px;
    margin-bottom: 8px;
  }
}

.assistant-message {
  background: var(--bg-tertiary, #18181b);
  color: var(--text-primary, #fafafa);
  border-bottom-left-radius: 2px;

  /* 处理中状态 - 企业级 Agent 步骤 */
  &.processing {
    padding: 14px 16px;
    min-width: 200px;
    
    /* 进度条 */
    .progress-bar {
      height: 2px;
      background: var(--border-subtle, #27272a);
      border-radius: 1px;
      margin-bottom: 14px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: var(--accent-primary, #3b82f6);
        border-radius: 1px;
        transition: width 0.3s ease;
      }
    }
    
    /* Agent 步骤列表 */
    .agent-steps {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .agent-step {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      
      .step-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--border-muted, #3f3f46);
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .step-text {
        color: var(--text-muted, #71717a);
        transition: color 0.2s ease;
      }
      
      /* 待处理 */
      &.pending {
        .step-dot {
          background: var(--border-muted, #3f3f46);
        }
        .step-text {
          color: var(--text-muted, #71717a);
        }
      }
      
      /* 进行中 */
      &.active {
        .step-dot {
          background: var(--accent-primary, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        .step-text {
          color: var(--text-primary, #fafafa);
          font-weight: 500;
        }
      }
      
      /* 已完成 */
      &.done {
        .step-dot {
          background: var(--success, #22c55e);
        }
        .step-text {
          color: var(--text-secondary, #a1a1aa);
        }
      }
    }
    
    /* 取消按钮 */
    .btn-stop {
      display: inline-flex;
      align-items: center;
      margin-top: 12px;
      padding: 4px 10px;
      background: transparent;
      border: 1px solid var(--border-subtle, #27272a);
      border-radius: 4px;
      color: var(--text-muted, #71717a);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
      
      &:hover {
        border-color: var(--border-muted, #3f3f46);
        color: var(--text-secondary, #a1a1aa);
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
  gap: 8px;
  margin-top: 12px;
}

/* 输入区域 */
.input-area {
  padding: 12px 16px;
  border-top: 1px solid var(--border-subtle, #27272a);
  background: var(--bg-primary, #0a0a0b);
}

.pending-image {
  position: relative;
  display: inline-block;
  margin-bottom: 8px;

  img {
    max-width: 100px;
    max-height: 80px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: #ef4444;
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;

  .btn-upload {
    flex-shrink: 0;
  }

  :deep(.el-textarea__inner) {
    background: var(--bg-secondary, #111113);
    border: 1px solid var(--border-subtle, #27272a);
    border-radius: 6px;
    color: var(--text-primary, #fafafa);
    padding: 10px 12px;

    &::placeholder {
      color: var(--text-muted, #71717a);
    }

    &:focus {
      border-color: var(--accent-primary, #3b82f6);
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
    right: 16px;
    bottom: 16px;
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
