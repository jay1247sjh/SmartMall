<script setup lang="ts">
/**
 * LoadingSpinner - 加载动画组件
 * 
 * 用于异步组件加载状态显示，支持不同尺寸和自定义文本
 * 配合 defineAsyncComponent 使用，提供统一的加载体验
 * 
 * Requirements: 24.4
 */

/**
 * 组件尺寸类型
 */
export type SpinnerSize = 'small' | 'medium' | 'large'

interface Props {
  /** 加载提示文本 */
  text?: string
  /** 组件尺寸 */
  size?: SpinnerSize
}

withDefaults(defineProps<Props>(), {
  text: '',
  size: 'medium',
})
</script>

<template>
  <div class="loading-spinner" :class="`spinner-${size}`">
    <div class="spinner">
      <div class="spinner-ring"></div>
    </div>
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/animations' as *;

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-3;
  padding: $space-6;
  
  // ============================================================================
  // Spinner 动画
  // ============================================================================
  
  .spinner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .spinner-ring {
    border-radius: $radius-full;
    border-style: solid;
    border-color: $color-border-subtle;
    border-top-color: $color-primary;
    animation: spin 1s linear infinite;
  }
  
  // ============================================================================
  // 加载文本
  // ============================================================================
  
  .loading-text {
    color: $color-text-secondary;
    font-weight: $font-weight-medium;
    text-align: center;
  }
  
  // ============================================================================
  // 尺寸变体
  // ============================================================================
  
  // Small 尺寸
  &.spinner-small {
    padding: $space-4;
    gap: $space-2;
    
    .spinner-ring {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }
    
    .loading-text {
      font-size: $font-size-sm;
    }
  }
  
  // Medium 尺寸（默认）
  &.spinner-medium {
    .spinner-ring {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }
    
    .loading-text {
      font-size: $font-size-base;
    }
  }
  
  // Large 尺寸
  &.spinner-large {
    padding: $space-8;
    gap: $space-4;
    
    .spinner-ring {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }
    
    .loading-text {
      font-size: $font-size-lg;
    }
  }
}
</style>
