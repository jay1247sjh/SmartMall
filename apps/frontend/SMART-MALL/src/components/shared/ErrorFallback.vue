<script setup lang="ts">
/**
 * ErrorFallback - 错误回退组件
 * 
 * 用于异步组件加载失败时的错误显示，支持错误信息展示和重试功能
 * 配合 defineAsyncComponent 使用，提供统一的错误处理体验
 * 
 * Requirements: 24.5
 */

/**
 * 组件尺寸类型
 */
export type FallbackSize = 'small' | 'medium' | 'large'

interface Props {
  /** 错误信息 */
  message?: string
  /** 错误详情（可选，用于调试） */
  details?: string
  /** 是否显示详情 */
  showDetails?: boolean
  /** 组件尺寸 */
  size?: FallbackSize
  /** 重试按钮文本 */
  retryText?: string
}

interface Emits {
  /** 重试事件 */
  (e: 'retry'): void
}

withDefaults(defineProps<Props>(), {
  message: '加载失败，请稍后重试',
  details: '',
  showDetails: false,
  size: 'medium',
  retryText: '重试',
})

defineEmits<Emits>()
</script>

<template>
  <div class="error-fallback" :class="`fallback-${size}`">
    <div class="error-icon">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="icon-warning"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
    
    <p class="error-message">{{ message }}</p>
    
    <p v-if="showDetails && details" class="error-details">
      {{ details }}
    </p>
    
    <button class="btn-retry" @click="$emit('retry')">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="icon-refresh"
      >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
      <span>{{ retryText }}</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;

.error-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-4;
  padding: $space-6;
  text-align: center;
  
  // ============================================================================
  // 错误图标
  // ============================================================================
  
  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-warning;
    
    .icon-warning {
      width: 48px;
      height: 48px;
    }
  }
  
  // ============================================================================
  // 错误信息
  // ============================================================================
  
  .error-message {
    margin: 0;
    color: $color-text-primary;
    font-weight: $font-weight-medium;
    line-height: 1.5;
  }
  
  // ============================================================================
  // 错误详情
  // ============================================================================
  
  .error-details {
    margin: 0;
    padding: $space-3;
    max-width: 400px;
    background-color: $color-bg-tertiary;
    border-radius: $radius-md;
    color: $color-text-secondary;
    font-size: $font-size-sm;
    font-family: monospace;
    word-break: break-word;
    white-space: pre-wrap;
  }
  
  // ============================================================================
  // 重试按钮
  // ============================================================================
  
  .btn-retry {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $space-2;
    padding: $space-2 $space-4;
    background: $gradient-button;
    border: none;
    border-radius: $radius-md;
    color: $color-white;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    cursor: pointer;
    transition: all $duration-normal $ease-in-out;
    
    .icon-refresh {
      width: 16px;
      height: 16px;
    }
    
    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px $color-border-focus;
    }
  }
  
  // ============================================================================
  // 尺寸变体
  // ============================================================================
  
  // Small 尺寸
  &.fallback-small {
    padding: $space-4;
    gap: $space-2;
    
    .error-icon .icon-warning {
      width: 32px;
      height: 32px;
    }
    
    .error-message {
      font-size: $font-size-sm;
    }
    
    .error-details {
      font-size: $font-size-xs;
      padding: $space-2;
    }
    
    .btn-retry {
      padding: $space-1 $space-3;
      font-size: $font-size-sm;
      
      .icon-refresh {
        width: 14px;
        height: 14px;
      }
    }
  }
  
  // Medium 尺寸（默认）
  &.fallback-medium {
    .error-message {
      font-size: $font-size-base;
    }
  }
  
  // Large 尺寸
  &.fallback-large {
    padding: $space-8;
    gap: $space-5;
    
    .error-icon .icon-warning {
      width: 64px;
      height: 64px;
    }
    
    .error-message {
      font-size: $font-size-lg;
    }
    
    .error-details {
      font-size: $font-size-base;
      max-width: 500px;
    }
    
    .btn-retry {
      padding: $space-3 $space-5;
      font-size: $font-size-lg;
      
      .icon-refresh {
        width: 18px;
        height: 18px;
      }
    }
  }
}
</style>
