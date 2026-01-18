<script setup lang="ts">
/**
 * ============================================================================
 * 聊天面板组件 (AiChatPanel)
 * ============================================================================
 *
 * 【组件职责】
 * 提供智能助手的对话界面，支持：
 * - 文字输入对话
 * - 图片上传（视觉理解）
 * - 操作确认（加购、下单等）
 * - 消息历史展示
 *
 * 【交互流程】
 * 1. 用户输入文字或上传图片
 * 2. 发送到 Intelligence Service
 * 3. 展示回复
 * 4. 如需确认，显示确认按钮
 * 5. 执行操作后更新 3D 场景
 *
 * 【与 3D 场景联动】
 * 通过 emit 事件通知父组件执行场景操作：
 * - navigate: 导航到指定店铺
 * - highlight: 高亮显示店铺/商品
 * - showDetail: 显示详情面板
 * ============================================================================
 */
import { ref, nextTick, watch, onMounted } from 'vue'
import { ElInput, ElButton, ElIcon, ElUpload, ElMessage } from 'element-plus'
import { Promotion, Picture, Close, Loading } from '@element-plus/icons-vue'
import { intelligenceApi, type ChatMessage, type ChatResponse } from '@/api/intelligence.api'
import { useUserStore } from '@/stores'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  /** 是否显示面板 */
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
})

const emit = defineEmits<{
  /** 关闭面板 */
  (e: 'close'): void
  /** 导航到店铺 */
  (e: 'navigate', payload: { storeId: string; position: { x: number; y: number; z: number } }): void
  /** 高亮显示 */
  (e: 'highlight', payload: { type: 'store' | 'product'; id: string }): void
  /** 显示详情 */
  (e: 'showDetail', payload: { type: 'store' | 'product'; id: string }): void
}>()

// ============================================================================
// 状态
// ============================================================================

const userStore = useUserStore()

/** 消息列表 */
const messages = ref<ChatMessage[]>([])

/** 输入框内容 */
const inputText = ref('')

/** 待上传的图片 */
const pendingImage = ref<string | null>(null)

/** 是否正在发送 */
const isSending = ref(false)

/** 消息列表容器引用 */
const messagesContainer = ref<HTMLElement | null>(null)

/** 待确认的操作 */
const pendingConfirmation = ref<{
  action: string
  args: Record<string, unknown>
  message: string
} | null>(null)

// ============================================================================
// 方法
// ============================================================================

/**
 * 滚动到底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

/**
 * 生成消息 ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 添加消息
 */
function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
  messages.value.push({
    ...message,
    id: generateMessageId(),
    timestamp: new Date(),
  })
  scrollToBottom()
}

/**
 * 处理 AI 响应
 */
function handleResponse(response: ChatResponse) {
  if (response.type === 'confirmation_required' || response.type === 'confirm') {
    // 需要用户确认
    pendingConfirmation.value = {
      action: response.action!,
      args: response.args!,
      message: response.message || '确认执行此操作吗？',
    }
    addMessage({
      role: 'assistant',
      content: response.message || '确认执行此操作吗？',
      type: response.type,
      action: response.action,
      args: response.args,
    })
  } else if (response.type === 'error') {
    addMessage({
      role: 'assistant',
      content: response.message || '抱歉，处理时出现错误，请重试。',
      type: 'error',
    })
  } else {
    // 普通文本响应
    addMessage({
      role: 'assistant',
      content: response.content || '',
      tool_results: response.toolResults,
    })

    // 处理工具调用结果，触发场景操作
    if (response.toolResults) {
      for (const tr of response.toolResults) {
        handleToolResult(tr.function, tr.result)
      }
    }
  }
}

/**
 * 处理工具调用结果
 */
function handleToolResult(funcName: string, result: Record<string, unknown>) {
  if (funcName === 'navigate_to_store' && result.success) {
    const store = result.store as { id: string; position: { x: number; y: number; z: number } }
    emit('navigate', { storeId: store.id, position: store.position })
  } else if (funcName === 'search_products' && result.success) {
    const products = result.products as Array<{ id: string }> | undefined
    if (products && products.length > 0) {
      emit('highlight', { type: 'product', id: products[0].id })
    }
  } else if (funcName === 'get_product_detail' && result.success) {
    const product = result.product as { id: string }
    emit('showDetail', { type: 'product', id: product.id })
  }
}

/**
 * 发送消息
 */
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text && !pendingImage.value) return
  if (isSending.value) return

  // 添加用户消息
  addMessage({
    role: 'user',
    content: text,
    image_url: pendingImage.value || undefined,
  })

  const imageUrl = pendingImage.value
  inputText.value = ''
  pendingImage.value = null
  isSending.value = true

  try {
    const userId = userStore.currentUser?.userId || 'anonymous'
    const response = await intelligenceApi.chat(text, userId, imageUrl || undefined)
    handleResponse(response)
  } catch (error) {
    console.error('Chat error:', error)
    addMessage({
      role: 'assistant',
      content: '抱歉，网络出现问题，请稍后重试。',
      type: 'error',
    })
  } finally {
    isSending.value = false
  }
}

/**
 * 确认操作
 */
async function confirmAction(confirmed: boolean) {
  if (!pendingConfirmation.value) return

  const { action, args } = pendingConfirmation.value
  pendingConfirmation.value = null
  isSending.value = true

  try {
    const userId = userStore.currentUser?.userId || 'anonymous'
    const response = await intelligenceApi.confirm(action, args, confirmed, userId)
    handleResponse(response)
  } catch (error) {
    console.error('Confirm error:', error)
    addMessage({
      role: 'assistant',
      content: '操作失败，请重试。',
      type: 'error',
    })
  } finally {
    isSending.value = false
  }
}

/**
 * 处理图片上传
 */
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

  return false // 阻止默认上传行为
}

/**
 * 移除待上传图片
 */
function removePendingImage() {
  pendingImage.value = null
}

/**
 * 处理键盘事件
 */
function handleKeydown(event: Event) {
  const e = event as KeyboardEvent
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 添加欢迎消息
  addMessage({
    role: 'assistant',
    content: '您好，我是 Smart Mall 的智能助手。有什么可以帮您的吗？\n\n您可以问我：\n• Nike 店在哪？\n• 帮我找一双 500 以内的跑鞋\n• 推荐一家好吃的餐厅',
  })
})

// 监听 visible 变化，滚动到底部
watch(() => props.visible, (visible) => {
  if (visible) {
    scrollToBottom()
  }
})
</script>

<template>
  <div v-show="visible" class="ai-chat-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <div class="header-title">
        <ElIcon :size="20" class="ai-icon"><Promotion /></ElIcon>
        <span>智能助手</span>
      </div>
      <button class="btn-close" @click="emit('close')">
        <ElIcon><Close /></ElIcon>
      </button>
    </div>

    <!-- 消息列表 -->
    <div ref="messagesContainer" class="messages-container">
      <div
        v-for="msg in messages"
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

      <!-- 加载中 -->
      <div v-if="isSending" class="message assistant">
        <div class="message-content assistant-message loading">
          <ElIcon class="loading-icon"><Loading /></ElIcon>
          <span>处理中...</span>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 待��传图片预览 -->
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
          v-model="inputText"
          type="textarea"
          :rows="1"
          :autosize="{ minRows: 1, maxRows: 4 }"
          placeholder="输入消息，或上传图片..."
          resize="none"
          @keydown="handleKeydown"
        />

        <!-- 发送按钮 -->
        <ElButton
          type="primary"
          :icon="Promotion"
          circle
          :disabled="(!inputText.trim() && !pendingImage) || isSending"
          @click="sendMessage"
        />
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss">
.ai-chat-panel {
  position: absolute;
  right: 20px;
  bottom: 80px;
  width: 360px;
  height: 500px;
  background: var(--bg-secondary, #111113);
  border: 1px solid var(--border-subtle, #27272a);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

  &.loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary, #a1a1aa);

    .loading-icon {
      animation: spin 1s linear infinite;
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
    border-radius: 6px;
    border: 1px solid var(--border-subtle, #27272a);
  }

  .btn-remove {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: var(--error, #ef4444);
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
  .ai-chat-panel {
    right: 10px;
    left: 10px;
    bottom: 60px;
    width: auto;
    height: 60vh;
  }
}
</style>
