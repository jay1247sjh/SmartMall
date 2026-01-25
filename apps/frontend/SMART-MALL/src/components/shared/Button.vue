<script setup lang="ts">
/**
 * Button - 统一按钮组件
 * 
 * 支持多种变体、尺寸、加载状态和禁用状态
 * 基于 Element Plus ElButton 封装，提供统一的样式和行为
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */
import { computed } from 'vue'
import { ElButton, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import type { ButtonProps, ButtonVariant, ButtonSize } from '@/types/ui'

interface Props extends ButtonProps {
  /** 按钮变体 */
  variant?: ButtonVariant
  /** 按钮尺寸 */
  size?: ButtonSize
  /** 加载状态 */
  loading?: boolean
  /** 禁用状态 */
  disabled?: boolean
  /** 图标名称（用于 icon 变体） */
  icon?: string
  /** 是否块级按钮（占满容器宽度） */
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  loading: false,
  disabled: false,
  block: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

/**
 * 映射变体到 Element Plus 按钮类型
 */
const elButtonType = computed(() => {
  const typeMap: Record<ButtonVariant, string> = {
    primary: 'primary',
    secondary: 'default',
    danger: 'danger',
    icon: 'default',
    ghost: 'default',
  }
  return typeMap[props.variant]
})

/**
 * 映射尺寸到 Element Plus 尺寸
 */
const elButtonSize = computed(() => {
  const sizeMap: Record<ButtonSize, 'small' | 'default' | 'large'> = {
    small: 'small',
    medium: 'default',
    large: 'large',
  }
  return sizeMap[props.size]
})

/**
 * 计算按钮是否应该禁用交互
 */
const isDisabled = computed(() => props.disabled || props.loading)

/**
 * 计算按钮的 CSS 类
 */
const buttonClasses = computed(() => [
  'smart-btn',
  `btn-${props.variant}`,
  `btn-size-${props.size}`,
  {
    'btn-block': props.block,
    'btn-loading': props.loading,
    'btn-icon-only': props.variant === 'icon',
  },
])

/**
 * 处理点击事件
 * 加载状态下不触发点击事件
 */
function handleClick(event: MouseEvent) {
  if (props.loading) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  emit('click', event)
}
</script>

<template>
  <ElButton
    :type="elButtonType"
    :size="elButtonSize"
    :disabled="isDisabled"
    :class="buttonClasses"
    :text="variant === 'ghost'"
    :circle="variant === 'icon'"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <template v-if="loading">
      <ElIcon class="btn-spinner">
        <Loading />
      </ElIcon>
    </template>
    
    <!-- Button Content -->
    <span v-if="!loading || variant !== 'icon'" class="btn-content">
      <slot />
    </span>
  </ElButton>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.smart-btn {
  @include transition-base;
  font-weight: $font-weight-medium;
  
  // ============================================================================
  // 变体样式
  // ============================================================================
  
  // Primary 变体 - 主要操作按钮
  &.btn-primary {
    --el-button-bg-color: #{$color-primary};
    --el-button-border-color: #{$color-primary};
    --el-button-text-color: #{$color-bg-primary};
    --el-button-hover-bg-color: #{$color-primary-hover};
    --el-button-hover-border-color: #{$color-primary-hover};
    --el-button-hover-text-color: #{$color-bg-primary};
    --el-button-active-bg-color: #{$color-accent-blue-dark};
    --el-button-active-border-color: #{$color-accent-blue-dark};
    --el-button-disabled-bg-color: #{$color-primary};
    --el-button-disabled-border-color: #{$color-primary};
    --el-button-disabled-text-color: #{$color-bg-primary};
  }
  
  // Secondary 变体 - 次要操作按钮
  &.btn-secondary {
    --el-button-bg-color: transparent;
    --el-button-border-color: #{$color-border-muted};
    --el-button-text-color: #{$color-text-secondary};
    --el-button-hover-bg-color: #{$color-bg-hover};
    --el-button-hover-border-color: #{$color-border-muted};
    --el-button-hover-text-color: #{$color-text-primary};
    --el-button-active-bg-color: #{$color-bg-tertiary};
    --el-button-active-border-color: #{$color-border-muted};
    --el-button-disabled-bg-color: transparent;
    --el-button-disabled-border-color: #{$color-border-subtle};
    --el-button-disabled-text-color: #{$color-text-disabled};
  }
  
  // Danger 变体 - 危险操作按钮
  &.btn-danger {
    --el-button-bg-color: #{$color-error};
    --el-button-border-color: #{$color-error};
    --el-button-text-color: #{$color-bg-primary};
    --el-button-hover-bg-color: #{$color-error-hover};
    --el-button-hover-border-color: #{$color-error-hover};
    --el-button-hover-text-color: #{$color-bg-primary};
    --el-button-active-bg-color: darken($color-error, 10%);
    --el-button-active-border-color: darken($color-error, 10%);
    --el-button-disabled-bg-color: #{$color-error};
    --el-button-disabled-border-color: #{$color-error};
    --el-button-disabled-text-color: #{$color-bg-primary};
  }
  
  // Icon 变体 - 图标按钮
  &.btn-icon {
    --el-button-bg-color: #{$color-border-subtle};
    --el-button-border-color: transparent;
    --el-button-text-color: #{$color-text-secondary};
    --el-button-hover-bg-color: #{$color-border-muted};
    --el-button-hover-border-color: transparent;
    --el-button-hover-text-color: #{$color-text-primary};
    --el-button-active-bg-color: #{$color-bg-tertiary};
    --el-button-active-border-color: transparent;
    --el-button-disabled-bg-color: #{$color-border-subtle};
    --el-button-disabled-border-color: transparent;
    --el-button-disabled-text-color: #{$color-text-disabled};
    
    padding: 0;
    min-width: auto;
  }
  
  // Ghost 变体 - 幽灵按钮（无背景）
  &.btn-ghost {
    --el-button-bg-color: transparent;
    --el-button-border-color: transparent;
    --el-button-text-color: #{$color-text-secondary};
    --el-button-hover-bg-color: #{$color-bg-hover};
    --el-button-hover-border-color: transparent;
    --el-button-hover-text-color: #{$color-primary};
    --el-button-active-bg-color: #{$color-primary-muted};
    --el-button-active-border-color: transparent;
    --el-button-disabled-bg-color: transparent;
    --el-button-disabled-border-color: transparent;
    --el-button-disabled-text-color: #{$color-text-disabled};
  }
  
  // ============================================================================
  // 尺寸样式
  // ============================================================================
  
  &.btn-size-small {
    padding: $space-2 $space-4;
    font-size: $font-size-sm;
    border-radius: $radius-sm;
    
    &.btn-icon-only {
      width: 28px;
      height: 28px;
    }
  }
  
  &.btn-size-medium {
    padding: $space-3 $space-6;
    font-size: $font-size-base;
    border-radius: $radius-md;
    
    &.btn-icon-only {
      width: 36px;
      height: 36px;
    }
  }
  
  &.btn-size-large {
    padding: $space-4 $space-8;
    font-size: $font-size-lg;
    border-radius: $radius-md;
    
    &.btn-icon-only {
      width: 44px;
      height: 44px;
    }
  }
  
  // ============================================================================
  // 状态样式
  // ============================================================================
  
  // 块级按钮
  &.btn-block {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  
  // 加载状态
  &.btn-loading {
    cursor: wait;
    pointer-events: none;
    
    .btn-spinner {
      animation: spin 1s linear infinite;
      margin-right: $space-2;
    }
    
    &.btn-icon-only .btn-spinner {
      margin-right: 0;
    }
  }
  
  // 禁用状态
  &:disabled,
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  // ============================================================================
  // 内容样式
  // ============================================================================
  
  .btn-content {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
  }
  
  .btn-spinner {
    font-size: inherit;
  }
}

// 旋转动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
