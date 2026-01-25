<script setup lang="ts">
/**
 * MallInfoPanel 组件
 *
 * AI 生成商城信息面板，显示商城名称、描述和操作按钮。
 *
 * 功能：
 * - 商城信息展示：显示 AI 生成的商城名称和描述
 * - AI 标识：显示 "AI 生成" 徽章标识
 * - 清除操作：提供清除并重置商城的按钮
 * - 描述截断：描述文本最多显示 2 行
 *
 * @example
 * ```vue
 * <MallInfoPanel
 *   v-if="mallData"
 *   :mall-data="mallData"
 *   @clear="clearMall"
 * />
 * ```
 *
 * @validates Requirements 1.7
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 商城数据接口
 */
export interface MallData {
  /** 商城名称 */
  name: string
  /** 商城描述 */
  description: string
}

/**
 * MallInfoPanel 组件 Props
 */
export interface MallInfoPanelProps {
  /** 商城数据，为 null 时不显示面板 */
  mallData: MallData | null
}

/**
 * MallInfoPanel 组件 Emits
 */
export interface MallInfoPanelEmits {
  /** 清除商城事件 */
  (e: 'clear'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

defineProps<MallInfoPanelProps>()

const emit = defineEmits<MallInfoPanelEmits>()

// ============================================================================
// 方法
// ============================================================================

/**
 * 处理清除按钮点击
 */
function handleClear() {
  emit('clear')
}
</script>

<template>
  <div v-if="mallData" class="mall-info-panel">
    <div class="mall-info-header">
      <span class="mall-name">{{ mallData.name }}</span>
      <span class="mall-badge">AI 生成</span>
    </div>
    <div class="mall-info-desc">{{ mallData.description }}</div>
    <button class="btn-clear-mall" @click="handleClear">清除并重置</button>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 扩展变量（全局变量中没有的）
$bg-panel-solid: rgba($color-bg-secondary, 0.95);

// ============================================================================
// 商城信息面板
// ============================================================================
.mall-info-panel {
  position: absolute;
  left: $space-5;
  top: 80px;
  width: 240px;
  padding: $space-4;
  background: $bg-panel-solid;
  border: 1px solid $color-border-muted;
  border-radius: $radius-lg;
  backdrop-filter: blur(10px);

  .mall-info-header {
    @include flex-center-y;
    gap: $space-2;
    margin-bottom: $space-2;

    .mall-name {
      font-size: 16px;
      font-weight: $font-weight-semibold;
      color: $color-text-primary;
    }

    .mall-badge {
      padding: 2px $space-2;
      background: $gradient-primary;
      border-radius: 10px;
      font-size: $font-size-xs;
      color: white;
      font-weight: $font-weight-medium;
    }
  }

  .mall-info-desc {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.5;
    margin-bottom: $space-3;
    @include line-clamp(2);
  }

  .btn-clear-mall {
    width: 100%;
    padding: $space-2;
    background: $color-error-muted;
    border: 1px solid rgba($color-error, 0.3);
    border-radius: $radius-md;
    color: $color-error;
    font-size: $font-size-sm;
    @include clickable;

    &:hover {
      background: rgba($color-error, 0.25);
      border-color: rgba($color-error, 0.5);
    }
  }
}
</style>
