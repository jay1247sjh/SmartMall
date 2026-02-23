<script setup lang="ts">
/**
 * AiDescriptionChat 组件
 *
 * AI 辅助多轮对话面板，引导用户通过结构化问答生成商城描述。
 * 嵌入 BuilderWizard 的 AI 生成区域，与 Description_Textarea 联动。
 */

import { ref, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { intelligenceApi } from '@/api/intelligence.api'
import type { DescribeMallRequest } from '@/api/intelligence.api'

// ============================================================================
// 类型定义
// ============================================================================

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status: 'sending' | 'sent' | 'error'
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<{
  currentDescription: string
}>()

const emit = defineEmits<{
  (e: 'update:currentDescription', value: string): void
  (e: 'generate'): void
}>()

// ============================================================================
// i18n
// ============================================================================

const { t } = useI18n()

// ============================================================================
// 内部状态
// ============================================================================

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const isLoading = ref(false)
const isComplete = ref(false)
const roundInfo = ref<{ current: number; max: number }>({ current: 0, max: 50 })
const hasError = ref(false)
const messageListRef = ref<HTMLDivElement | null>(null)

/** 保存最后一次请求的 payload，用于重试 */
let lastRequestPayload: DescribeMallRequest | null = null

// ============================================================================
// 工具方法
// ============================================================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function buildApiMessages(): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.value
    .filter(m => m.status !== 'error' || m.role === 'user')
    .map(m => ({ role: m.role, content: m.content }))
}

// ============================================================================
// 核心方法
// ============================================================================

async function initConversation() {
  isLoading.value = true
  hasError.value = false

  const payload: DescribeMallRequest = {
    messages: [],
    currentDescription: props.currentDescription,
  }
  lastRequestPayload = payload

  // 添加占位 assistant 消息
  const assistantMsg: ChatMessage = {
    id: generateId(),
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    status: 'sending',
  }
  messages.value.push(assistantMsg)
  scrollToBottom()

  try {
    const response = await intelligenceApi.describeMall(payload)
    assistantMsg.content = response.reply
    assistantMsg.status = 'sent'
    roundInfo.value = response.roundInfo
    isComplete.value = response.isComplete

    if (response.description) {
      emit('update:currentDescription', response.description)
    }
    hasError.value = false
  } catch {
    assistantMsg.content = t('builder.chatError')
    assistantMsg.status = 'error'
    hasError.value = true
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

function resumeConversation() {
  isComplete.value = false
}

async function sendMessage(text: string) {
  if (!text.trim() || isLoading.value || isComplete.value) return
  if (roundInfo.value.current >= roundInfo.value.max) return

  const userMsg: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: text.trim(),
    timestamp: new Date(),
    status: 'sent',
  }
  messages.value.push(userMsg)
  inputText.value = ''
  scrollToBottom()

  isLoading.value = true
  hasError.value = false

  const payload: DescribeMallRequest = {
    messages: buildApiMessages(),
    currentDescription: props.currentDescription,
  }
  lastRequestPayload = payload

  const assistantMsg: ChatMessage = {
    id: generateId(),
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    status: 'sending',
  }
  messages.value.push(assistantMsg)
  scrollToBottom()

  try {
    const response = await intelligenceApi.describeMall(payload)
    assistantMsg.content = response.reply
    assistantMsg.status = 'sent'
    roundInfo.value = response.roundInfo
    isComplete.value = response.isComplete

    if (response.description) {
      emit('update:currentDescription', response.description)
    }
    hasError.value = false
  } catch {
    assistantMsg.content = t('builder.chatError')
    assistantMsg.status = 'error'
    hasError.value = true
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

async function finishConversation() {
  if (isLoading.value || isComplete.value) return

  isLoading.value = true
  hasError.value = false

  const payload: DescribeMallRequest = {
    messages: buildApiMessages(),
    currentDescription: props.currentDescription,
    finish: true,
  }
  lastRequestPayload = payload

  const assistantMsg: ChatMessage = {
    id: generateId(),
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    status: 'sending',
  }
  messages.value.push(assistantMsg)
  scrollToBottom()

  try {
    const response = await intelligenceApi.describeMall(payload)
    assistantMsg.content = response.reply
    assistantMsg.status = 'sent'
    roundInfo.value = response.roundInfo
    isComplete.value = true

    if (response.description) {
      emit('update:currentDescription', response.description)
    }
    hasError.value = false
  } catch {
    assistantMsg.content = t('builder.chatError')
    assistantMsg.status = 'error'
    hasError.value = true
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

async function retryLastMessage() {
  if (!lastRequestPayload) return

  // 找到最后一条 error 状态的 assistant 消息（反向查找）
  let lastErrorIdx = -1
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].role === 'assistant' && messages.value[i].status === 'error') {
      lastErrorIdx = i
      break
    }
  }
  if (lastErrorIdx === -1) return

  const errorMsg = messages.value[lastErrorIdx]
  errorMsg.status = 'sending'
  errorMsg.content = ''

  isLoading.value = true
  hasError.value = false
  scrollToBottom()

  try {
    const response = await intelligenceApi.describeMall(lastRequestPayload)
    errorMsg.content = response.reply
    errorMsg.status = 'sent'
    roundInfo.value = response.roundInfo
    isComplete.value = response.isComplete

    if (response.description) {
      emit('update:currentDescription', response.description)
    }
    hasError.value = false
  } catch {
    errorMsg.content = t('builder.chatError')
    errorMsg.status = 'error'
    hasError.value = true
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage(inputText.value)
  }
}

// ============================================================================
// 生命周期
// ============================================================================

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  initConversation()
})
</script>

<template>
  <div class="ai-description-chat">
    <!-- ================================================================== -->
    <!-- Header: 轮次计数 + 完成按钮 -->
    <!-- ================================================================== -->
    <div class="chat-header">
      <div class="header-left">
        <svg class="header-icon" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
          <path d="M5.5 6.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" fill="currentColor" />
          <path d="M8.5 6.5a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" fill="currentColor" />
          <path d="M6 10c0 0 .8 1.5 2 1.5s2-1.5 2-1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span class="round-counter">{{ t('builder.roundCount', { current: roundInfo.current, max: roundInfo.max }) }}</span>
      </div>
      <button
        v-if="!isComplete"
        class="btn-finish"
        :disabled="isLoading"
        @click="finishConversation"
      >
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none">
          <path d="M4 8h8M8 4v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" transform="rotate(45 8 8)" />
        </svg>
        {{ t('builder.finishConversation') }}
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- 消息列表 -->
    <!-- ================================================================== -->
    <div ref="messageListRef" class="message-list">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message-item', msg.role]"
      >
        <div :class="['message-bubble', msg.role, { error: msg.status === 'error' }]">
          <!-- 发送中占位 -->
          <div v-if="msg.status === 'sending'" class="message-loading">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
          <!-- 消息内容 -->
          <span v-else class="message-text">{{ msg.content }}</span>
          <!-- 错误重试按钮 -->
          <button
            v-if="msg.status === 'error' && msg.role === 'assistant'"
            class="btn-retry"
            @click="retryLastMessage"
          >
            <svg class="retry-icon" viewBox="0 0 16 16" fill="none">
              <path d="M2 8a6 6 0 0 1 10.3-4.2M14 8a6 6 0 0 1-10.3 4.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <path d="M12 1v3.5h-3.5M4 15v-3.5h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ t('builder.retry') }}
          </button>
        </div>
      </div>

      <!-- 轮次接近上限警告 -->
      <div v-if="roundInfo.current >= 45 && roundInfo.current < 50 && !isComplete" class="round-warning">
        <svg class="warning-icon" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5L1 14h14L8 1.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M8 6v4M8 12h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span>{{ t('builder.roundWarning') }}</span>
      </div>

      <!-- 对话完成提示 -->
      <div v-if="isComplete" class="conversation-complete">
        <svg class="complete-icon" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ t('builder.conversationComplete') }}</span>
      </div>

    </div>

    <!-- ================================================================== -->
    <!-- 操作按钮区域（固定，不随消息滚动） -->
    <!-- ================================================================== -->
    <div v-if="isComplete" class="chat-actions">
      <button
        class="btn-resume"
        @click="resumeConversation"
      >
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        {{ t('builder.resumeConversation') }}
      </button>
      <button
        v-if="currentDescription.trim()"
        class="btn-generate-from-desc"
        @click="emit('generate')"
      >
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none">
          <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4z" stroke="currentColor" stroke-width="1.5" />
          <path d="M6 8h4M8 6v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        {{ t('builder.generateFromDescription') }}
      </button>
    </div>

    <!-- ================================================================== -->
    <!-- 输入区域 -->
    <!-- ================================================================== -->
    <div class="chat-input">
      <input
        v-model="inputText"
        type="text"
        class="input-field"
        :placeholder="t('builder.chatPlaceholder')"
        :disabled="isLoading || isComplete || roundInfo.current >= roundInfo.max"
        @keydown="handleKeydown"
      />
      <button
        class="btn-send"
        :disabled="!inputText.trim() || isLoading || isComplete || roundInfo.current >= roundInfo.max"
        @click="sendMessage(inputText)"
      >
        <svg class="send-icon" viewBox="0 0 16 16" fill="none">
          <path d="M2 8l12-5-5 12-2-5-5-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
        {{ t('builder.sendMessage') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 根容器
// ============================================================================
.ai-description-chat {
  display: flex;
  flex-direction: column;
  max-height: 500px;
  margin-top: $space-3;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-lg;
  background: var(--bg-secondary);
  overflow: hidden;
}

// ============================================================================
// 头部（始终可见）
// ============================================================================
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.header-icon {
  width: 16px;
  height: 16px;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.round-counter {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.btn-finish {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 + 2 $space-3;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-muted);
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-icon {
  width: 12px;
  height: 12px;
}

// ============================================================================
// 消息列表
// ============================================================================
.message-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: $space-3 $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  @include scrollbar-thin;
}

// ============================================================================
// 消息项
// ============================================================================
.message-item {
  display: flex;

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }
}

.message-bubble {
  max-width: 85%;
  padding: $space-2 + 2 $space-3;
  border-radius: $radius-lg;
  font-size: $font-size-base;
  line-height: 1.5;
  word-break: break-word;

  &.user {
    background: var(--accent-primary);
    color: #fff;
    border-bottom-right-radius: $radius-sm;
  }

  &.assistant {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-bottom-left-radius: $radius-sm;
  }

  &.error {
    border: 1px solid rgba(var(--error-rgb), 0.3);
  }
}

.message-text {
  white-space: pre-wrap;
}

// ============================================================================
// 加载动画（三点跳动）
// ============================================================================
.message-loading {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: $space-1 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: $radius-full;
  background: var(--text-muted);
  animation: dotBounce 1.2s infinite ease-in-out;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes dotBounce {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

// ============================================================================
// 重试按钮
// ============================================================================
.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  margin-top: $space-2;
  padding: $space-1 $space-2;
  background: rgba(var(--error-rgb), 0.1);
  border: 1px solid rgba(var(--error-rgb), 0.2);
  border-radius: $radius-sm;
  color: var(--error);
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: rgba(var(--error-rgb), 0.2);
  }
}

.retry-icon {
  width: 12px;
  height: 12px;
}

// ============================================================================
// 轮次警告
// ============================================================================
.round-warning {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: rgba(var(--warning-rgb), 0.1);
  border: 1px solid rgba(var(--warning-rgb), 0.2);
  border-radius: $radius-md;
  color: var(--warning);
  font-size: $font-size-sm;
}

.warning-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

// ============================================================================
// 对话完成提示
// ============================================================================
.conversation-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  color: var(--text-muted);
  font-size: $font-size-sm;
}

.complete-icon {
  width: 14px;
  height: 14px;
  color: var(--success);
}

// ============================================================================
// 操作按钮区域（固定，不随消息滚动）
// ============================================================================
.chat-actions {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid var(--border-subtle);
}

// ============================================================================
// 继续补充按钮
// ============================================================================
.btn-resume {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-muted);
    color: var(--text-primary);
  }

  .btn-icon {
    width: 14px;
    height: 14px;
  }
}

// ============================================================================
// 按照描述生成按钮
// ============================================================================
.btn-generate-from-desc {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: var(--accent-primary);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: background $duration-normal;

  &:hover {
    background: var(--accent-hover);
  }

  .btn-icon {
    width: 16px;
    height: 16px;
  }
}

// ============================================================================
// 输入区域
// ============================================================================
.chat-input {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid var(--border-subtle);
}

.input-field {
  flex: 1;
  padding: $space-2 $space-3;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-muted);
  border-radius: $radius-md;
  color: var(--text-primary);
  font-size: $font-size-base;
  font-family: inherit;
  transition: border-color $duration-normal;

  &:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-send {
  display: inline-flex;
  align-items: center;
  gap: $space-1;
  padding: $space-2 $space-3;
  background: var(--accent-primary);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  white-space: nowrap;
  transition: background $duration-normal;

  &:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
}

.send-icon {
  width: 14px;
  height: 14px;
}
</style>
