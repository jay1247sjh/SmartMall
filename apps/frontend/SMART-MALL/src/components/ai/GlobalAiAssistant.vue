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

/** 思考步骤 */
const thinkingSteps = ref<Array<{ text: string; status: 'pending' | 'done' | 'active'; icon?: string }>>([])

/** 当前思考阶段 */
const thinkingPhase = ref<'thinking' | 'tool' | 'executing' | 'generating'>('thinking')

/** 当前调用的工具名称 */
const currentTool = ref<string>('')

/** 思考动画定时器 */
let thinkingTimer: ReturnType<typeof setInterval> | null = null

// Agent 决策流程步骤
const AGENT_STEPS = [
  { text: '🧠 理解用户意图...', phase: 'thinking' },
  { text: '🔍 分析上下文信息...', phase: 'thinking' },
  { text: '🛠️ 选择合适的工具...', phase: 'tool' },
  { text: '⚡ 执行操作中...', phase: 'executing' },
  { text: '✨ 生成回复...', phase: 'generating' },
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

/** 开始思考动画 */
function startThinking(userInput?: string) {
  thinkingSteps.value = []
  thinkingPhase.value = 'thinking'
  currentTool.value = ''
  
  // 根据用户输入智能判断可能调用的工具
  const toolHint = detectToolFromInput(userInput || '')
  
  // 立即显示第一步
  thinkingSteps.value.push({ 
    text: '🧠 理解用户意图...', 
    status: 'active',
    icon: '🧠'
  })
  
  let stepIndex = 0
  const steps = [
    { text: '🔍 分析上下文信息...', delay: 600 },
    { text: `🛠️ 调用工具: ${toolHint}`, delay: 800, phase: 'tool' as const },
    { text: '⚡ 执行操作中...', delay: 1000, phase: 'executing' as const },
    { text: '✨ 生成回复...', delay: 600, phase: 'generating' as const },
  ]
  
  // 每隔一段时间显示下一步
  thinkingTimer = setInterval(() => {
    // 将当前步骤标记为完成
    if (thinkingSteps.value.length > 0) {
      thinkingSteps.value[thinkingSteps.value.length - 1].status = 'done'
    }
    
    if (stepIndex < steps.length) {
      const step = steps[stepIndex]
      thinkingSteps.value.push({ 
        text: step.text, 
        status: 'active' 
      })
      if (step.phase) {
        thinkingPhase.value = step.phase
      }
      if (step.text.includes('调用工具')) {
        currentTool.value = toolHint
      }
      stepIndex++
      scrollToBottom()
    }
  }, 700)
}

/** 根据用户输入检测可能调用的工具 */
function detectToolFromInput(input: string): string {
  const lowerInput = input.toLowerCase()
  
  if (lowerInput.includes('打开') || lowerInput.includes('进入') || lowerInput.includes('去')) {
    return 'navigate_to_page'
  }
  if (lowerInput.includes('创建') || lowerInput.includes('生成') || lowerInput.includes('商城')) {
    return 'generate_mall_layout'
  }
  if (lowerInput.includes('搜索') || lowerInput.includes('找') || lowerInput.includes('查')) {
    return 'search_products'
  }
  if (lowerInput.includes('店') || lowerInput.includes('在哪')) {
    return 'locate_store'
  }
  if (lowerInput.includes('推荐')) {
    return 'recommend_products'
  }
  return 'intent_recognition'
}

/** 停止思考动画 */
function stopThinking() {
  if (thinkingTimer) {
    clearInterval(thinkingTimer)
    thinkingTimer = null
  }
  thinkingSteps.value = []
  thinkingPhase.value = 'thinking'
  currentTool.value = ''
}

/** 停止回答 */
function stopResponse() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  stopThinking()
  aiStore.setSending(false)
  
  // 添加一条提示消息
  aiStore.addMessage({
    role: 'assistant',
    content: '已停止回答。',
    type: 'text',
  })
  scrollToBottom()
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
  startThinking(text)

  try {
    const userId = userStore.currentUser?.userId || 'anonymous'
    const response = await intelligenceApi.chat(
      text, 
      userId, 
      imageUrl || undefined, 
      { current_floor: route.path },
      abortController.value.signal
    )
    
    stopThinking()
    
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
    stopThinking()
    
    // 检查是否是用户主动取消
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request aborted by user')
      return
    }
    
    // 服务连接异常时静默处理，不显示错误提示
    console.error('Chat error:', error)
    // 不再显示错误消息，让用户可以重试
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
  startThinking()

  try {
    const userId = userStore.currentUser?.userId || 'anonymous'
    const response = await intelligenceApi.confirm(action, args, confirmed, userId)
    stopThinking()
    aiStore.handleResponse(response)
  } catch (error) {
    stopThinking()
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
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
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
  stopThinking()
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
        title="小智 · AI 助手"
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
            <span>小智 · AI 助手</span>
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

          <!-- 加载中 - Agent 决策流程 -->
          <div v-if="aiStore.isSending" class="message assistant">
            <div class="message-content assistant-message thinking">
              <div class="thinking-header">
                <div class="thinking-avatar">
                  <span class="avatar-icon">🤖</span>
                  <span class="status-dot" :class="thinkingPhase"></span>
                </div>
                <div class="thinking-title">
                  <span class="title-text">小智正在处理...</span>
                  <span class="phase-badge" :class="thinkingPhase">
                    {{ thinkingPhase === 'thinking' ? '思考中' : 
                       thinkingPhase === 'tool' ? '调用工具' : 
                       thinkingPhase === 'executing' ? '执行中' : '生成中' }}
                  </span>
                </div>
              </div>
              
              <!-- Agent 决策步骤 -->
              <div v-if="thinkingSteps.length > 0" class="agent-steps">
                <div 
                  v-for="(step, index) in thinkingSteps" 
                  :key="index"
                  class="agent-step"
                  :class="step.status"
                >
                  <span class="step-indicator">
                    <span v-if="step.status === 'done'" class="done-icon">✓</span>
                    <span v-else-if="step.status === 'active'" class="active-icon">
                      <ElIcon class="spinning"><Loading /></ElIcon>
                    </span>
                    <span v-else class="pending-icon">○</span>
                  </span>
                  <span class="step-text">{{ step.text }}</span>
                </div>
              </div>
              
              <!-- 当前工具调用提示 -->
              <div v-if="currentTool" class="tool-call-hint">
                <span class="tool-icon">⚙️</span>
                <code class="tool-name">{{ currentTool }}</code>
              </div>
              
              <button class="btn-stop" @click="stopResponse">
                <ElIcon><VideoPause /></ElIcon>
                <span>停止回答</span>
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
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(96, 165, 250, 0.4);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 24px rgba(96, 165, 250, 0.5);
  }

  &.active {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

/* 聊天面板 */
.ai-chat-panel {
  position: absolute;
  right: 0;
  bottom: 70px;
  width: 380px;
  height: 520px;
  background: rgba(17, 17, 19, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 面板动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(96, 165, 250, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #e8eaed;

  .ai-icon {
    color: #60a5fa;
  }
}

.btn-close {
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #9aa0a6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e8eaed;
  }
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.quick-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: #9aa0a6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(96, 165, 250, 0.15);
    border-color: rgba(96, 165, 250, 0.3);
    color: #60a5fa;
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
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;

  p {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.user-message {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  border-bottom-right-radius: 4px;

  .message-image {
    max-width: 100%;
    max-height: 150px;
    border-radius: 8px;
    margin-bottom: 8px;
  }
}

.assistant-message {
  background: rgba(255, 255, 255, 0.08);
  color: #e8eaed;
  border-bottom-left-radius: 4px;

  &.loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #9aa0a6;

    .loading-icon {
      animation: spin 1s linear infinite;
    }
  }
  
  &.thinking {
    padding: 16px;
    
    .thinking-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .thinking-avatar {
      position: relative;
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .avatar-icon {
        font-size: 18px;
      }
      
      .status-dot {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid rgba(17, 17, 19, 0.95);
        
        &.thinking { background: #f59e0b; }
        &.tool { background: #8b5cf6; }
        &.executing { background: #3b82f6; }
        &.generating { background: #22c55e; }
      }
    }
    
    .thinking-title {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .title-text {
        font-weight: 500;
        color: #e8eaed;
        font-size: 14px;
      }
      
      .phase-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 500;
        width: fit-content;
        
        &.thinking {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }
        &.tool {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }
        &.executing {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
        &.generating {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }
      }
    }
    
    .agent-steps {
      margin: 12px 0;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
      border-left: 3px solid rgba(96, 165, 250, 0.5);
    }
    
    .agent-step {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      font-size: 13px;
      transition: all 0.3s ease;
      
      .step-indicator {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .done-icon {
          color: #22c55e;
          font-size: 14px;
          font-weight: bold;
        }
        
        .active-icon {
          color: #60a5fa;
          
          .spinning {
            animation: spin 1s linear infinite;
          }
        }
        
        .pending-icon {
          color: #5f6368;
          font-size: 12px;
        }
      }
      
      .step-text {
        color: #9aa0a6;
      }
      
      &.done .step-text {
        color: #9aa0a6;
      }
      
      &.active .step-text {
        color: #e8eaed;
        font-weight: 500;
      }
    }
    
    .tool-call-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      padding: 8px 12px;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 8px;
      
      .tool-icon {
        font-size: 14px;
      }
      
      .tool-name {
        font-family: 'Fira Code', 'Consolas', monospace;
        font-size: 12px;
        color: #a78bfa;
        background: rgba(139, 92, 246, 0.15);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
    
    .btn-stop {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 6px 12px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #ef4444;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
      
      &:hover {
        background: rgba(239, 68, 68, 0.25);
        border-color: rgba(239, 68, 68, 0.5);
      }
    }
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
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
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
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #e8eaed;
    padding: 10px 14px;

    &::placeholder {
      color: #5f6368;
    }

    &:focus {
      border-color: #60a5fa;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
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
    bottom: 80px;
    width: auto;
    height: 60vh;
  }
}
</style>
