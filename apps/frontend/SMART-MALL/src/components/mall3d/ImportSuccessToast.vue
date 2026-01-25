<script setup lang="ts">
/**
 * ImportSuccessToast 组件
 *
 * AI 导入成功提示 Toast，显示已加载的 AI 生成商城信息。
 *
 * 功能：
 * - 显示成功提示：展示 AI 生成商城加载成功的通知
 * - 商城名称显示：显示已加载的商城名称
 * - 可关闭：支持用户手动关闭提示
 * - 动画效果：支持淡入淡出过渡动画
 *
 * @example
 * ```vue
 * <Transition name="fade">
 *   <ImportSuccessToast
 *     v-if="showImportSuccess && mallData"
 *     :visible="showImportSuccess"
 *     :mall-name="mallData.name"
 *     @close="showImportSuccess = false"
 *   />
 * </Transition>
 * ```
 *
 * @validates Requirements 1.6
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * ImportSuccessToast 组件 Props
 */
export interface ImportSuccessToastProps {
  /** 是否显示 Toast */
  visible: boolean
  /** 商城名称 */
  mallName: string
}

/**
 * ImportSuccessToast 组件 Emits
 */
export interface ImportSuccessToastEmits {
  /** 关闭事件 */
  (e: 'close'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

defineProps<ImportSuccessToastProps>()

const emit = defineEmits<ImportSuccessToastEmits>()

// ============================================================================
// 方法
// ============================================================================

/**
 * 处理关闭按钮点击
 */
function handleClose() {
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="import-success-toast">
    <span class="toast-icon">✨</span>
    <span class="toast-message">已加载 AI 生成的商城：{{ mallName }}</span>
    <button class="toast-close" @click="handleClose" aria-label="关闭提示">×</button>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// Toast 提示
// ============================================================================
.import-success-toast {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  @include flex-center-y;
  gap: 10px;
  padding: $space-3 $space-5;
  background: linear-gradient(135deg, rgba($color-success, 0.9) 0%, rgba($color-success, 0.9) 100%);
  border-radius: $radius-lg;
  color: white;
  font-size: $font-size-base;
  box-shadow: 0 4px 20px rgba($color-success, 0.4);
  z-index: 100;

  .toast-icon {
    font-size: $font-size-xl;
  }

  .toast-message {
    white-space: nowrap;
  }

  .toast-close {
    margin-left: $space-2;
    width: 20px;
    height: 20px;
    background: rgba($color-white, 0.2);
    border: none;
    border-radius: 50%;
    color: white;
    @include flex-center;
    @include clickable;

    &:hover {
      background: rgba($color-white, 0.3);
    }
  }
}

// ============================================================================
// 动画（供父组件使用 Transition 时配合）
// ============================================================================
// 注意：动画类需要在父组件中定义，因为 Transition 组件包裹在外层
// 父组件应定义以下样式：
// .fade-enter-active,
// .fade-leave-active {
//   transition: opacity $duration-slow $ease-default, transform $duration-slow $ease-default;
// }
// .fade-enter-from,
// .fade-leave-to {
//   opacity: 0;
//   transform: translateX(-50%) translateY(-10px);
// }
</style>
