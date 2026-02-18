<script setup lang="ts">
/**
 * AI 布局生成对话框
 *
 * 商家选择店铺主题，由 AI 自动生成区域内的 3D 店铺布局。
 *
 * 业务职责：
 * - 展示主题选择列表（四种预定义主题）
 * - 触发 AI 生成并显示加载状态
 * - 处理生成失败，提供重试选项
 * - 区域已有内容时，提示替换确认
 * - 生成成功后 emit 布局数据供预览
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可使用
 *
 * Props:
 * - visible: 对话框可见性
 * - areaId: 目标区域 ID
 * - hasExistingContent: 区域是否已有内容
 *
 * Events:
 * - update:visible: 可见性变更
 * - layout-generated: 生成成功，携带 StoreLayoutData
 * - close: 对话框关闭
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal } from '@/components'
import { merchantApi } from '@/api/merchant.api'
import type { StoreLayoutData } from '@/api/merchant.api'

const { t } = useI18n()

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  visible: boolean
  areaId: string
  hasExistingContent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasExistingContent: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'layout-generated': [data: StoreLayoutData]
  close: []
}>()

// ============================================================================
// 主题预设
// ============================================================================

interface ThemeOption {
  key: string
  nameKey: string
  descKey: string
}

const themeOptions: ThemeOption[] = [
  {
    key: 'japanese_cafe',
    nameKey: 'merchant.aiLayout.themeJapaneseCafe',
    descKey: 'merchant.aiLayout.themeJapaneseCafeDesc',
  },
  {
    key: 'fashion_store',
    nameKey: 'merchant.aiLayout.themeFashionStore',
    descKey: 'merchant.aiLayout.themeFashionStoreDesc',
  },
  {
    key: 'chinese_restaurant',
    nameKey: 'merchant.aiLayout.themeChineseRestaurant',
    descKey: 'merchant.aiLayout.themeChineseRestaurantDesc',
  },
  {
    key: 'tech_store',
    nameKey: 'merchant.aiLayout.themeTechStore',
    descKey: 'merchant.aiLayout.themeTechStoreDesc',
  },
]

// ============================================================================
// State
// ============================================================================

const selectedTheme = ref<string>('')
const isGenerating = ref(false)
const errorMessage = ref('')
const showReplaceConfirm = ref(false)

// ============================================================================
// Computed
// ============================================================================

const canGenerate = computed(() => selectedTheme.value !== '' && !isGenerating.value)

// ============================================================================
// Methods
// ============================================================================

function selectTheme(key: string) {
  if (isGenerating.value) return
  selectedTheme.value = key
  errorMessage.value = ''
}

function handleGenerate() {
  if (!canGenerate.value) return

  if (props.hasExistingContent) {
    showReplaceConfirm.value = true
    return
  }

  doGenerate()
}

function confirmReplace() {
  showReplaceConfirm.value = false
  doGenerate()
}

function cancelReplace() {
  showReplaceConfirm.value = false
}

async function doGenerate() {
  isGenerating.value = true
  errorMessage.value = ''

  try {
    const response = await merchantApi.generateAILayout(props.areaId, {
      theme: selectedTheme.value,
    })

    if (response.success && response.data) {
      emit('layout-generated', response.data)
      handleClose()
    } else {
      errorMessage.value = response.message || t('merchant.aiLayout.generateFailed')
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      errorMessage.value = t('merchant.aiLayout.noPermission')
    } else if (error.response?.status === 503) {
      errorMessage.value = t('merchant.aiLayout.aiUnavailable')
    } else {
      errorMessage.value = t('merchant.aiLayout.networkError')
    }
  } finally {
    isGenerating.value = false
  }
}

function handleRetry() {
  doGenerate()
}

function handleClose() {
  selectedTheme.value = ''
  errorMessage.value = ''
  isGenerating.value = false
  showReplaceConfirm.value = false
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Modal
    :visible="visible"
    :title="t('merchant.aiLayout.title')"
    width="520px"
    @update:visible="handleClose"
  >
    <div class="ai-layout-dialog">
      <!-- 主题选择 -->
      <div class="section">
        <label class="section-label">{{ t('merchant.aiLayout.selectTheme') }}</label>
        <div class="theme-list">
          <button
            v-for="theme in themeOptions"
            :key="theme.key"
            :class="['theme-item', { active: selectedTheme === theme.key, disabled: isGenerating }]"
            @click="selectTheme(theme.key)"
          >
            <span class="theme-name">{{ t(theme.nameKey) }}</span>
            <span class="theme-desc">{{ t(theme.descKey) }}</span>
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isGenerating" class="loading-state">
        <div class="spinner" />
        <span class="loading-text">{{ t('merchant.aiLayout.generating') }}</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-state">
        <span class="error-text">{{ errorMessage }}</span>
        <button class="retry-btn" @click="handleRetry">{{ t('common.retry') }}</button>
      </div>

      <!-- 替换确认 -->
      <div v-if="showReplaceConfirm" class="replace-confirm">
        <span class="confirm-text">{{ t('merchant.aiLayout.replaceConfirm') }}</span>
        <div class="confirm-actions">
          <button class="btn btn-secondary btn-sm" @click="cancelReplace">{{ t('common.cancel') }}</button>
          <button class="btn btn-warning btn-sm" @click="confirmReplace">{{ t('merchant.aiLayout.confirmReplace') }}</button>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="handleClose">{{ t('common.cancel') }}</button>
      <button
        class="btn btn-primary"
        :disabled="!canGenerate"
        @click="handleGenerate"
      >
        {{ isGenerating ? t('merchant.aiLayout.generatingBtn') : t('merchant.aiLayout.generate') }}
      </button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// Dialog Content
// ============================================================================

.ai-layout-dialog {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

// ============================================================================
// Section
// ============================================================================

.section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.section-label {
  font-size: $font-size-sm + 1;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// ============================================================================
// Theme List
// ============================================================================

.theme-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.theme-item {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding: $space-3 $space-4;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all $duration-normal $ease-default;

  &:hover:not(.disabled) {
    border-color: var(--border-muted);
    background: rgba(var(--text-primary-rgb), 0.04);
  }

  &.active {
    border-color: var(--accent-primary);
    background: var(--accent-muted);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .theme-name {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: var(--text-primary);
  }

  .theme-desc {
    font-size: $font-size-sm;
    color: var(--text-muted);
  }
}

// ============================================================================
// Loading State
// ============================================================================

.loading-state {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  background: rgba(var(--info-rgb), 0.15);
  border-radius: $radius-md;
  border: 1px solid rgba(var(--info-rgb), 0.2);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(var(--accent-primary-rgb), 0.3);
  border-top-color: var(--accent-primary);
  border-radius: $radius-full;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: $font-size-sm + 1;
  color: var(--accent-primary);
}

// ============================================================================
// Error State
// ============================================================================

.error-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: rgba(var(--error-rgb), 0.15);
  border-radius: $radius-md;
  border: 1px solid rgba(var(--error-rgb), 0.2);
}

.error-text {
  font-size: $font-size-sm + 1;
  color: var(--error);
}

.retry-btn {
  @include btn-action;
  background: rgba(var(--error-rgb), 0.2);
  color: var(--error);
  flex-shrink: 0;

  &:hover {
    background: rgba(var(--error-rgb), 0.3);
  }
}

// ============================================================================
// Replace Confirm
// ============================================================================

.replace-confirm {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  background: rgba(var(--warning-rgb), 0.15);
  border-radius: $radius-md;
  border: 1px solid rgba(var(--warning-rgb), 0.2);
}

.confirm-text {
  font-size: $font-size-sm + 1;
  color: var(--warning);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}

// ============================================================================
// Buttons
// ============================================================================

.btn {
  @include btn-base;
  padding: $space-2 + 2 $space-5;
}

.btn-secondary {
  @include btn-secondary;
}

.btn-primary {
  @include btn-primary;
}

.btn-warning {
  background: var(--warning);
  color: var(--bg-primary);

  &:hover:not(:disabled) {
    background: var(--warning);
  }
}

.btn-sm {
  @include btn-sm;
}
</style>
