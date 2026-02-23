<script setup lang="ts">
/**
 * ============================================================================
 * BuilderInlineInput 组件
 * ============================================================================
 *
 * 【组件职责】
 * 轻量内联输入条，Teleport 到 body，居中显示在画布上方。
 * 用于快速单次 AI 指令，类似 Command Palette 交互模式。
 *
 * 【使用方式】
 * <BuilderInlineInput v-model:visible="showInlineInput" @switch-to-drawer="..." />
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.3, 5.4
 * ============================================================================
 */
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBuilderAiChat } from '@/views/admin/mall-builder/composables'

// ============================================================================
// Types
// ============================================================================

export interface BuilderInlineInputProps {
  visible: boolean
}

export interface BuilderInlineInputEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'switchToDrawer'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

defineProps<BuilderInlineInputProps>()
const emit = defineEmits<BuilderInlineInputEmits>()

// ============================================================================
// State
// ============================================================================

const { t } = useI18n()
const { aiStore, agentSteps, currentStepIndex, sendMessage, cancelRequest, stopProcessing } = useBuilderAiChat()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const tempResponse = ref('')
const tempError = ref('')

// ============================================================================
// Methods
// ============================================================================

function close() {
  if (aiStore.isSending) {
    cancelRequest()
    stopProcessing()
    aiStore.setSending(false)
  }
  inputValue.value = ''
  tempResponse.value = ''
  tempError.value = ''
  emit('update:visible', false)
}

function handleOverlayClick() {
  close()
}

async function handleSubmit() {
  const query = inputValue.value.trim()
  if (!query || aiStore.isSending) return

  tempResponse.value = ''
  tempError.value = ''

  // Store the message count before sending to detect the AI response
  const msgCountBefore = aiStore.messages.length

  await sendMessage(query)

  // Extract the latest assistant response as temporary display
  const newMessages = aiStore.messages.slice(msgCountBefore)
  const assistantMsg = newMessages.find(m => m.role === 'assistant')
  if (assistantMsg) {
    if (assistantMsg.type === 'error') {
      tempError.value = assistantMsg.content
    } else {
      tempResponse.value = assistantMsg.content
    }
  }

  inputValue.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  // Cmd+J / Ctrl+J → switch to drawer
  if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
    e.preventDefault()
    e.stopPropagation()
    close()
    emit('switchToDrawer')
    return
  }

  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
  }
}

// Auto-focus input when visible
watch(
  () => inputRef.value,
  (el) => {
    if (el) {
      nextTick(() => el.focus())
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="inline-input-fade">
      <div
        v-if="visible"
        class="inline-input-overlay"
        @click.self="handleOverlayClick"
      >
        <div class="inline-input-panel" @keydown="handleKeydown">
          <!-- Input Row -->
          <div class="input-row">
            <svg class="input-icon" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2a6 6 0 0 0-4.47 10.02L4 16l3.98-1.53A6 6 0 1 0 10 2Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              ref="inputRef"
              v-model="inputValue"
              type="text"
              :placeholder="t('builder.inlineInput.placeholder')"
              :disabled="aiStore.isSending"
              @keydown.stop
              @keydown.enter.prevent="handleSubmit"
            />
            <kbd class="shortcut-hint">ESC</kbd>
          </div>

          <!-- Processing Steps -->
          <div v-if="aiStore.isSending && agentSteps.length > 0" class="steps-area">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${(currentStepIndex / agentSteps.length) * 100}%` }"
              />
            </div>
            <div
              v-for="(step, i) in agentSteps"
              :key="i"
              :class="['step-item', step.status]"
            >
              <svg v-if="step.status === 'done'" class="step-icon" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="step.status === 'active'" class="step-icon spinning" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 12"/>
              </svg>
              <svg v-else class="step-icon" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="currentColor" opacity="0.3"/>
              </svg>
              <span>{{ t(step.text) }}</span>
            </div>
          </div>

          <!-- Temporary Response Card -->
          <div v-if="tempResponse" class="response-area">
            <p>{{ tempResponse }}</p>
          </div>

          <!-- Error Display -->
          <div v-if="tempError" class="error-area">
            <svg viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 5v3M8 10.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ tempError }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
// ============================================================================
// Overlay
// ============================================================================
.inline-input-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

// ============================================================================
// Panel
// ============================================================================
.inline-input-panel {
  position: absolute;
  top: 20%;
  width: 100%;
  max-width: 560px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

// ============================================================================
// Input Row
// ============================================================================
.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);

  .input-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    color: var(--text-muted);
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: var(--text-base);
    color: var(--text-primary);
    font-family: var(--font-sans);

    &::placeholder {
      color: var(--text-muted);
    }

    &:disabled {
      opacity: 0.5;
    }
  }

  .shortcut-hint {
    flex-shrink: 0;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
  }
}

// ============================================================================
// Steps Area
// ============================================================================
.steps-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);

  .progress-bar {
    height: 2px;
    background: var(--border-subtle);
    border-radius: 1px;
    margin-bottom: 8px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: 1px;
      transition: width 0.25s;
    }
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-sm);
    color: var(--text-muted);

    &.active {
      color: var(--accent-primary);
    }

    &.done {
      color: var(--success);
    }
  }

  .step-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;

    &.spinning {
      animation: spin 1s linear infinite;
    }
  }
}

// ============================================================================
// Response Area
// ============================================================================
.response-area {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);

  p {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: 1.5;
    white-space: pre-wrap;
  }
}

// ============================================================================
// Error Area
// ============================================================================
.error-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: var(--error);
  font-size: var(--text-sm);

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
}

// ============================================================================
// Transition
// ============================================================================
.inline-input-fade-enter-active,
.inline-input-fade-leave-active {
  transition: opacity 0.15s ease;
}

.inline-input-fade-enter-from,
.inline-input-fade-leave-to {
  opacity: 0;
}

// ============================================================================
// Animation
// ============================================================================
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
