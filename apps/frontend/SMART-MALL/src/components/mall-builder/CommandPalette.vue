<script setup lang="ts">
/**
 * CommandPalette 组件
 *
 * 类 VS Code Cmd+K 的 AI 命令面板，替代建模器内的浮动聊天。
 * Ctrl+K / Cmd+K 打开，Escape 或点击遮罩关闭。
 */
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { intelligenceApi } from '@/api'
import type { ChatResponse } from '@/api/intelligence.api'

const { t } = useI18n()

// ============================================================================
// 类型定义
// ============================================================================

export interface CommandPaletteProps {
  visible: boolean
}

export interface CommandPaletteEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

defineProps<CommandPaletteProps>()
const emit = defineEmits<CommandPaletteEmits>()

// ============================================================================
// 状态
// ============================================================================

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const isProcessing = ref(false)
const responseText = ref('')
const errorText = ref('')
const abortController = ref<AbortController | null>(null)

// 处理步骤
const steps = ref<{ label: string; status: 'pending' | 'active' | 'done' }[]>([])

// ============================================================================
// 方法
// ============================================================================

function close() {
  if (isProcessing.value && abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isProcessing.value = false
  inputValue.value = ''
  responseText.value = ''
  errorText.value = ''
  steps.value = []
  emit('update:visible', false)
  emit('close')
}

function handleOverlayClick() {
  close()
}

async function handleSubmit() {
  const query = inputValue.value.trim()
  if (!query || isProcessing.value) return

  isProcessing.value = true
  responseText.value = ''
  errorText.value = ''

  steps.value = [
    { label: t('builder.commandPalette.stepAnalyze'), status: 'active' },
    { label: t('builder.commandPalette.stepSearch'), status: 'pending' },
    { label: t('builder.commandPalette.stepGenerate'), status: 'pending' },
  ]

  abortController.value = new AbortController()

  try {
    const stepAnalyze = steps.value[0]
    const stepSearch = steps.value[1]
    const stepGenerate = steps.value[2]
    if (!stepAnalyze || !stepSearch || !stepGenerate) return

    // Step 1 → 2
    stepAnalyze.status = 'done'
    stepSearch.status = 'active'

    const response: ChatResponse = await intelligenceApi.chat(
      query,
      undefined,
      undefined,
      abortController.value.signal,
    )

    // Step 2 → 3
    stepSearch.status = 'done'
    stepGenerate.status = 'active'

    responseText.value = response.content || response.message || ''

    // All done
    stepGenerate.status = 'done'
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // User cancelled, no error to show
      return
    }
    console.error('[CommandPalette] AI request failed:', error)
    errorText.value = t('builder.commandPalette.error')
  } finally {
    isProcessing.value = false
    abortController.value = null
  }
}

function handleCancel() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isProcessing.value = false
  steps.value = []
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    close()
  }
}

// Auto-focus input when panel becomes visible
watch(inputRef, (el) => {
  if (el) {
    nextTick(() => el.focus())
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="command-palette-overlay" @click.self="handleOverlayClick" @keydown="handleKeydown">
      <div class="command-palette">
        <!-- 输入区域 -->
        <div class="input-row">
          <svg class="input-icon" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input
            ref="inputRef"
            v-model="inputValue"
            type="text"
            :placeholder="t('builder.commandPalette.placeholder')"
            :disabled="isProcessing"
            @keydown.enter.prevent="handleSubmit"
          />
          <kbd class="shortcut-hint">ESC</kbd>
        </div>

        <!-- 处理步骤 -->
        <div v-if="steps.length > 0" class="steps-area">
          <div v-for="(step, i) in steps" :key="i" :class="['step-item', step.status]">
            <svg v-if="step.status === 'done'" class="step-icon" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="step.status === 'active'" class="step-icon spinning" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-dasharray="20 12"/>
            </svg>
            <svg v-else class="step-icon" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3" fill="currentColor" opacity="0.3"/>
            </svg>
            <span>{{ step.label }}</span>
          </div>
        </div>

        <!-- 响应区域 -->
        <div v-if="responseText" class="response-area">
          <p>{{ responseText }}</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorText" class="error-area">
          <svg viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8 5v3M8 10.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ errorText }}</span>
        </div>

        <!-- 取消按钮 -->
        <div v-if="isProcessing" class="action-bar">
          <button class="btn-cancel" @click="handleCancel">
            {{ t('builder.commandPalette.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
// ============================================================================
// Command Palette Overlay
// ============================================================================
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  justify-content: center;
  background: rgba(var(--black-rgb), 0.3);
  backdrop-filter: blur(4px);
}

// ============================================================================
// Command Palette Panel
// ============================================================================
.command-palette {
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
    background: rgba(var(--border-subtle-rgb), 0.5);
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
    line-height: var(--leading-normal);
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
  border-bottom: 1px solid var(--border-subtle);
  color: var(--error);
  font-size: var(--text-sm);

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
}

// ============================================================================
// Action Bar
// ============================================================================
.action-bar {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px;

  .btn-cancel {
    padding: 6px 14px;
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--duration-normal);

    &:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      border-color: var(--border-muted);
    }
  }
}

// ============================================================================
// Animation
// ============================================================================
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
