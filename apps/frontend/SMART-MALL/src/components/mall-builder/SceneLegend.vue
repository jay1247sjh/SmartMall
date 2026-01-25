<script setup lang="ts">
/**
 * SceneLegend 组件
 *
 * 商城建模器场景图例显示组件，用于展示区域类型的颜色图例。
 *
 * 功能：
 * - 显示图例列表：展示所有区域类型及其对应颜色
 * - 可见性控制：支持显示/隐藏图例面板
 * - 响应式布局：适应不同屏幕尺寸
 *
 * @example
 * ```vue
 * <SceneLegend
 *   :visible="showSceneLegend"
 *   :items="legendItems"
 * />
 * ```
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 图例项
 */
export interface LegendItem {
  /** 图例颜色 */
  color: string
  /** 图例标签 */
  label: string
}

export interface SceneLegendProps {
  /** 是否显示图例 */
  visible?: boolean
  /** 图例项列表 */
  items?: LegendItem[]
}

// ============================================================================
// Props
// ============================================================================

const props = withDefaults(defineProps<SceneLegendProps>(), {
  visible: true,
  items: () => [],
})

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 检查是否有图例项
 */
function hasItems(): boolean {
  return props.items.length > 0
}
</script>

<template>
  <div 
    v-if="visible && hasItems()" 
    class="scene-legend"
  >
    <!-- 图例头部 -->
    <div class="scene-legend__header">
      <svg 
        class="scene-legend__icon" 
        viewBox="0 0 20 20" 
        fill="none"
      >
        <rect 
          x="3" 
          y="3" 
          width="5" 
          height="5" 
          rx="1" 
          stroke="currentColor" 
          stroke-width="1.5"
        />
        <rect 
          x="12" 
          y="3" 
          width="5" 
          height="5" 
          rx="1" 
          stroke="currentColor" 
          stroke-width="1.5"
        />
        <rect 
          x="3" 
          y="12" 
          width="5" 
          height="5" 
          rx="1" 
          stroke="currentColor" 
          stroke-width="1.5"
        />
        <rect 
          x="12" 
          y="12" 
          width="5" 
          height="5" 
          rx="1" 
          stroke="currentColor" 
          stroke-width="1.5"
        />
      </svg>
      <span class="scene-legend__title">图例</span>
    </div>
    
    <!-- 图例列表 -->
    <div class="scene-legend__list">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="scene-legend__item"
      >
        <span 
          class="scene-legend__color" 
          :style="{ backgroundColor: item.color }"
        />
        <span class="scene-legend__label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 场景图例
// ============================================================================
.scene-legend {
  position: absolute;
  left: $space-4;
  bottom: 52px;
  min-width: 140px;
  max-width: 200px;
  background: linear-gradient(
    to bottom,
    rgba($color-bg-primary, 0.95),
    rgba($color-bg-primary, 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-lg;
  z-index: 50;
  overflow: hidden;

  // ============================================================================
  // 图例头部
  // ============================================================================
  &__header {
    @include flex-center-y;
    gap: $space-2;
    padding: $space-2 $space-3;
    border-bottom: 1px solid $color-border-subtle;
    background: rgba($color-white, 0.02);
  }

  &__icon {
    width: 14px;
    height: 14px;
    color: $color-text-secondary;
    flex-shrink: 0;
  }

  &__title {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // ============================================================================
  // 图例列表
  // ============================================================================
  &__list {
    @include flex-column;
    gap: $space-1;
    padding: $space-2 $space-3;
    max-height: 200px;
    overflow-y: auto;
    @include scrollbar-custom;
  }

  &__item {
    @include flex-center-y;
    gap: $space-2;
    padding: $space-1 0;
  }

  &__color {
    width: 12px;
    height: 12px;
    border-radius: $radius-sm;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px rgba($color-white, 0.1);
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
