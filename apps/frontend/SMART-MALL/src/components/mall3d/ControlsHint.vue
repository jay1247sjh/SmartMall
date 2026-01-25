<script setup lang="ts">
/**
 * ControlsHint 组件
 *
 * 3D 商城页面操作提示，显示鼠标和键盘操作说明。
 *
 * 功能：
 * - 显示操作提示：展示 3D 场景的交互操作说明
 * - 可自定义提示：支持通过 props 传入自定义提示列表
 * - 默认提示：提供默认的 3D 场景操作提示
 *
 * @example
 * ```vue
 * <!-- 使用默认提示 -->
 * <ControlsHint />
 *
 * <!-- 使用自定义提示 -->
 * <ControlsHint
 *   :hints="[
 *     { icon: '🖱️', text: '拖拽旋转' },
 *     { icon: '🔍', text: '滚轮缩放' },
 *     { icon: '⌨️', text: '右键平移' }
 *   ]"
 * />
 * ```
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 单个操作提示项
 */
export interface ControlHint {
  /** 提示图标（emoji 或图标类名） */
  icon: string
  /** 提示文本 */
  text: string
}

/**
 * ControlsHint 组件 Props
 */
export interface ControlsHintProps {
  /** 操作提示列表，不传则使用默认提示 */
  hints?: ControlHint[]
}

// ============================================================================
// 默认提示
// ============================================================================

/**
 * 默认的 3D 场景操作提示
 */
const DEFAULT_HINTS: ControlHint[] = [
  { icon: '🖱️', text: '拖拽旋转' },
  { icon: '🔍', text: '滚轮缩放' },
  { icon: '⌨️', text: '右键平移' },
]

// ============================================================================
// Props
// ============================================================================

const props = withDefaults(defineProps<ControlsHintProps>(), {
  hints: undefined,
})

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 实际显示的提示列表
 * 如果没有传入 hints，则使用默认提示
 */
const displayHints = computed(() => props.hints ?? DEFAULT_HINTS)
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <div class="controls-hint">
    <span v-for="(hint, index) in displayHints" :key="index" class="hint-item">
      <span class="hint-icon">{{ hint.icon }}</span>
      <span class="hint-text">{{ hint.text }}</span>
    </span>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 操作提示
// ============================================================================
.controls-hint {
  position: absolute;
  bottom: $space-5;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: $space-6;
  padding: 10px $space-5;
  background: rgba($color-bg-secondary, 0.8);
  border-radius: $radius-pill;
  font-size: $font-size-sm;
  color: $color-text-secondary;

  .hint-item {
    display: flex;
    align-items: center;
    gap: $space-1;

    .hint-icon {
      font-size: $font-size-base;
    }

    .hint-text {
      white-space: nowrap;
    }
  }
}
</style>
