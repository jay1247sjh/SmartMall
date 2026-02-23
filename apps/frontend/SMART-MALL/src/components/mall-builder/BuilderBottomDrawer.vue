<script setup lang="ts">
/**
 * ============================================================================
 * BuilderBottomDrawer 组件
 * ============================================================================
 *
 * 【组件职责】
 * 底部可折叠聊天面板，absolute 定位在画布底部。
 * 用于多轮深度 AI 对话，复用 AiSidebar 的消息渲染模式。
 *
 * 【使用方式】
 * <BuilderBottomDrawer v-model:visible="showBottomDrawer" />
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.2, 5.3, 5.4
 * ============================================================================
 */
import { ref, watch, nextTick, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBuilderAiChat } from '@/views/admin/mall-builder/composables'

// ============================================================================
// Types
// ============================================================================

export interface BuilderBottomDrawerProps {
  visible: boolean
}

export interface BuilderBottomDrawerEmits {
  (e: 'update:visible', value: boolean): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<BuilderBottomDrawerProps>()
const emit = defineEmits<BuilderBottomDrawerEmits>()

// ============================================================================
// Constants
// ============================================================================

const MIN_HEIGHT = 120
const MAX_HEIGHT_RATIO = 0.6
const DEFAULT_HEIGHT = 200

const AGENT_STEPS_COUNT = 4

// ============================================================================
// State
// ============================================================================

const { t } = useI18n()
const {
  aiStore,
  agentSteps,
  currentStepIndex,
  sendMessage,
  stopResponse,
} = useBuilderAiChat()

const drawerHeight = ref(DEFAULT_HEIGHT)
const isDragging = ref(false)
const inputValue = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

/** Drag start Y position */
let dragStartY = 0
/** Height at drag start */
let dragStartHeight = 0

// ============================================================================
// Computed
// ============================================================================

const maxHeight = computed(() => Math.floor(window.innerHeight * MAX_HEIGHT_RATIO))

// ============================================================================
// Methods — Scroll
// ============================================================================

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// ============================================================================
// Methods — Drag
// ============================================================================

function onDragStart(e: MouseEvent) {
  e.preventDefault()
  isDragging.value = true
  dragStartY = e.clientY
  dragStartHeight = drawerHeight.value
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ns-resize'
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!isDragging.value) return
  const delta = dragStartY - e.clientY
  const newHeight = dragStartHeight + delta
  drawerHeight.value = Math.max(MIN_HEIGHT, Math.min(maxHeight.value, newHeight))
}

function onDragEnd() {
  isDragging.value = false
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

// ============================================================================
// Methods — Chat
// ============================================================================

async function handleSend() {
  const text = inputValue.value.trim()
  if (!text || aiStore.isSending) return
  inputValue.value = ''
  await sendMessage(text)
  scrollToBottom()
}

function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function collapse() {
  emit('update:visible', false)
}

// ============================================================================
// Watchers & Lifecycle
// ============================================================================

watch(() => props.visible, (visible) => {
  if (visible) {
    scrollToBottom()
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

watch(() => aiStore.messages.length, () => {
  if (props.visible) {
    scrollToBottom()
  }
})

onBeforeUnmount(() => {
  // Clean up drag listeners if component unmounts during drag
  if (isDragging.value) {
    onDragEnd()
  }
})
</script>

<template>
  <Transition name="drawer-slide">
    <div
      v-if="visible"
      class="bottom-drawer"
      :style="{ height: `${drawerHeight}px` }"
    >
      <!-- Drag Handle -->
      <div
        class="drag-handle"
        :class="{ dragging: isDragging }"
        :title="t('builder.bottomDrawer.dragHint')"
        @mousedown="onDragStart"
      >
        <div class="drag-bar" />
      </div>

      <!-- Header -->
      <div class="drawer-header">
        <div class="header-left">
          <svg class="header-icon" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2a6 6 0 0 0-4.47 10.02L4 16l3.98-1.53A6 6 0 1 0 10 2Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="header-title">{{ t('ai.sidebar.title') }}</span>
        </div>
        <button class="btn-collapse" :title="t('builder.bottomDrawer.collapse')" @click="collapse">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div ref="messagesContainer" class="messages-container">
        <div
          v-for="msg in aiStore.messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <!-- User message -->
          <template v-if="msg.role === 'user'">
            <div class="message-content user-message">
              <img v-if="msg.image_url" :src="msg.image_url" class="message-image" />
              <p>{{ msg.content }}</p>
            </div>
          </template>

          <!-- Assistant message -->
          <template v-else>
            <div class="message-content assistant-message">
              <p class="message-text">{{ msg.content }}</p>
            </div>
          </template>
        </div>

        <!-- Processing steps -->
        <div v-if="aiStore.isSending" class="message assistant">
          <div class="message-content assistant-message processing">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(currentStepIndex / AGENT_STEPS_COUNT) * 100}%` }"
              />
            </div>
            <div class="agent-steps">
              <div
                v-for="(step, index) in agentSteps"
                :key="index"
                :class="['agent-step', step.status]"
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

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-row">
          <textarea
            ref="inputRef"
            v-model="inputValue"
            class="chat-input"
            rows="1"
            :placeholder="aiStore.isSending ? t('ai.sidebar.thinking') : t('builder.bottomDrawer.placeholder')"
            :disabled="aiStore.isSending"
            @keydown.stop
            @keydown="handleInputKeydown"
          />
          <button
            class="btn-send"
            :disabled="!inputValue.trim() || aiStore.isSending"
            @click="handleSend"
          >
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M14 2L2 8.5l4.5 2L10 6l-2.5 5.5L14 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ t('builder.bottomDrawer.send') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// Drawer Container
// ============================================================================

.bottom-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: rgba(var(--bg-secondary-rgb), 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(var(--accent-primary-rgb), 0.2);
}

// ============================================================================
// Drag Handle
// ============================================================================

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  cursor: ns-resize;
  flex-shrink: 0;

  &:hover,
  &.dragging {
    .drag-bar {
      background: var(--text-muted);
      width: 48px;
    }
  }
}

.drag-bar {
  width: 36px;
  height: 3px;
  background: var(--border-muted);
  border-radius: $radius-full;
  transition: all $duration-normal;
}

// ============================================================================
// Header
// ============================================================================

.drawer-header {
  @include flex-between;
  padding: 0 $space-4 $space-2;
  flex-shrink: 0;
}

.header-left {
  @include flex-center-y;
  gap: $space-2;
}

.header-icon {
  width: 16px;
  height: 16px;
  color: var(--accent-primary);
}

.header-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--text-secondary);
}

.btn-collapse {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  color: var(--text-muted);
  @include flex-center;
  @include clickable;

  svg {
    width: 14px;
    height: 14px;
  }

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
  padding: $space-2 $space-4;
  @include flex-column;
  gap: $space-2;
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
  max-width: 75%;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  font-size: $font-size-sm;
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
    max-height: 80px;
    border-radius: $radius-sm;
    margin-bottom: $space-1;
  }
}

.assistant-message {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-bottom-left-radius: 2px;

  &.processing {
    padding: $space-3;
    min-width: 160px;

    .progress-bar {
      height: 2px;
      background: var(--border-subtle);
      border-radius: 1px;
      margin-bottom: $space-3;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: 1px;
      transition: width $duration-slow;
    }
  }
}

.message-text {
  white-space: pre-wrap;
}

// ============================================================================
// Agent Steps
// ============================================================================

.agent-steps {
  @include flex-column;
  gap: $space-1;
}

.agent-step {
  @include flex-center-y;
  gap: $space-2;
  font-size: $font-size-xs;

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

.step-dot {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: $radius-full;
  background: var(--border-muted);
  transition: all $duration-normal;
}

.step-text {
  color: var(--text-muted);
  transition: color $duration-normal;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.btn-stop {
  @include flex-center-y;
  margin-top: $space-2;
  padding: $space-1 $space-2;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-sm;
  color: var(--text-muted);
  font-size: $font-size-xs;
  @include clickable;

  &:hover {
    border-color: var(--border-muted);
    color: var(--text-secondary);
  }
}

// ============================================================================
// Input Area
// ============================================================================

.input-area {
  padding: $space-2 $space-4 $space-3;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.input-row {
  @include flex-center-y;
  gap: $space-2;
}

.chat-input {
  flex: 1;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: $space-2 $space-3;
  font-size: $font-size-sm;
  font-family: $font-sans;
  color: var(--text-primary);
  resize: none;
  outline: none;
  transition: border-color $duration-normal;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--accent-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-send {
  @include flex-center-y;
  gap: $space-1;
  padding: $space-2 $space-3;
  background: var(--accent-primary);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-size: $font-size-sm;
  white-space: nowrap;
  @include clickable;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

// ============================================================================
// Transition
// ============================================================================

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform $duration-slow $ease-in-out, opacity $duration-slow;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>