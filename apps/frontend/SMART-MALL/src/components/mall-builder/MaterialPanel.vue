<script setup lang="ts">
/**
 * MaterialPanel 组件
 *
 * 商城建模器材质选择侧边栏，用于选择和管理材质预设。
 *
 * 功能：
 * - 显示材质分类：按分类展示所有材质预设
 * - 分类折叠：支持展开/折叠材质分类
 * - 材质选择：点击材质预设进行选择
 * - 清除选择：清除当前选中的材质
 * - 选择提示：显示当前选中材质的使用提示
 *
 * @example
 * ```vue
 * <MaterialPanel
 *   :categories="categories"
 *   :expandedCategories="expandedCategories"
 *   :selectedMaterialId="selectedMaterialId"
 *   @toggleCategory="toggleCategory"
 *   @selectMaterial="selectMaterial"
 *   @clearSelection="clearMaterialSelection"
 * />
 * ```
 */
import type { MaterialCategory, MaterialPreset } from '@/builder'
import {
  getMaterialPresetsByCategory,
  getCategoryDisplayName,
} from '@/builder'

// ============================================================================
// 类型定义
// ============================================================================

export interface MaterialPanelProps {
  /** 材质分类列表 */
  categories: MaterialCategory[]
  /** 当前展开的分类列表 */
  expandedCategories: MaterialCategory[]
  /** 当前选中的材质 ID */
  selectedMaterialId: string | null
}

export interface MaterialPanelEmits {
  (e: 'toggleCategory', category: MaterialCategory): void
  (e: 'selectMaterial', preset: MaterialPreset): void
  (e: 'clearSelection'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<MaterialPanelProps>(), {
  categories: () => [],
  expandedCategories: () => [],
  selectedMaterialId: null,
})

const emit = defineEmits<MaterialPanelEmits>()

// ============================================================================
// 方法
// ============================================================================

/**
 * 切换分类展开状态
 * @param category 材质分类
 */
function handleToggleCategory(category: MaterialCategory) {
  emit('toggleCategory', category)
}

/**
 * 选择材质
 * @param preset 材质预设
 */
function handleSelectMaterial(preset: MaterialPreset) {
  emit('selectMaterial', preset)
}

/**
 * 清除选择
 */
function handleClearSelection() {
  emit('clearSelection')
}

/**
 * 检查分类是否展开
 * @param category 材质分类
 */
function isCategoryExpanded(category: MaterialCategory): boolean {
  return props.expandedCategories.includes(category)
}

/**
 * 检查材质是否被选中
 * @param presetId 材质预设 ID
 */
function isMaterialSelected(presetId: string): boolean {
  return props.selectedMaterialId === presetId
}

/**
 * 获取分类下的材质预设列表
 * @param category 材质分类
 */
function getPresetsForCategory(category: MaterialCategory): MaterialPreset[] {
  return getMaterialPresetsByCategory(category)
}

/**
 * 获取分类显示名称
 * @param category 材质分类
 */
function getCategoryName(category: MaterialCategory): string {
  return getCategoryDisplayName(category)
}

/**
 * 获取分类下材质数量
 * @param category 材质分类
 */
function getCategoryCount(category: MaterialCategory): number {
  return getMaterialPresetsByCategory(category).length
}

/**
 * 获取当前选中的材质预设
 */
function getSelectedMaterial(): MaterialPreset | null {
  if (!props.selectedMaterialId) return null
  
  for (const category of props.categories) {
    const presets = getMaterialPresetsByCategory(category)
    const found = presets.find(p => p.id === props.selectedMaterialId)
    if (found) return found
  }
  return null
}

/**
 * 获取选中材质的提示文本
 */
function getSelectedMaterialHint(): string {
  const material = getSelectedMaterial()
  if (!material) return ''
  return material.isInfrastructure 
    ? '点击场景放置' 
    : '已选择材质，使用绘制工具放置'
}

/**
 * 检查是否有选中的材质
 */
function hasSelectedMaterial(): boolean {
  return props.selectedMaterialId !== null
}
</script>

<template>
  <aside class="material-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3>材质</h3>
      <!-- 清除选择按钮 -->
      <button 
        v-if="hasSelectedMaterial()" 
        class="btn-icon clear" 
        title="清除选择"
        @click="handleClearSelection"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path 
            d="M5 5l10 10M15 5L5 15" 
            stroke="currentColor" 
            stroke-width="1.5" 
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
    
    <!-- 材质内容 -->
    <div class="material-content">
      <!-- 选中材质提示 -->
      <div v-if="hasSelectedMaterial()" class="selected-material-hint">
        <svg viewBox="0 0 20 20" fill="none">
          <path 
            d="M10 6v4M10 14h.01" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round"
          />
          <circle 
            cx="10" 
            cy="10" 
            r="8" 
            stroke="currentColor" 
            stroke-width="1.5"
          />
        </svg>
        <span>{{ getSelectedMaterialHint() }}</span>
      </div>
      
      <!-- 材质分类列表 -->
      <div 
        v-for="category in categories" 
        :key="category" 
        class="material-category"
      >
        <!-- 分类头部 -->
        <button 
          class="category-header" 
          @click="handleToggleCategory(category)"
        >
          <svg 
            :class="['category-arrow', { expanded: isCategoryExpanded(category) }]" 
            viewBox="0 0 20 20" 
            fill="none"
          >
            <path 
              d="M7 8l3 3 3-3" 
              stroke="currentColor" 
              stroke-width="1.5" 
              stroke-linecap="round"
            />
          </svg>
          <span>{{ getCategoryName(category) }}</span>
          <span class="category-count">{{ getCategoryCount(category) }}</span>
        </button>
        
        <!-- 材质列表 -->
        <div 
          v-if="isCategoryExpanded(category)" 
          class="material-list"
        >
          <button
            v-for="preset in getPresetsForCategory(category)"
            :key="preset.id"
            :class="['material-item', { active: isMaterialSelected(preset.id) }]"
            :style="{ '--material-color': preset.color }"
            @click="handleSelectMaterial(preset)"
          >
            <div class="material-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path 
                  :d="preset.icon" 
                  stroke="currentColor" 
                  stroke-width="1.5" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="material-info">
              <span class="material-name">{{ preset.name }}</span>
              <span class="material-desc">{{ preset.description }}</span>
            </div>
            <div 
              class="material-color" 
              :style="{ background: preset.color }"
            ></div>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 材质面板
// ============================================================================
.material-panel {
  position: absolute;
  right: $space-4;
  top: 72px;
  width: 280px;
  max-height: calc(100vh - 140px);
  background: linear-gradient(
    to bottom,
    rgba($color-bg-primary, 0.95),
    rgba($color-bg-primary, 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-xl;
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// ============================================================================
// 面板头部
// ============================================================================
.panel-header {
  @include flex-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border-subtle;
  flex-shrink: 0;

  h3 {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    margin: 0;
  }
}

.btn-icon {
  @include flex-center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: rgba($color-white, 0.08);
    color: $color-text-primary;
  }

  &.clear {
    color: $color-text-muted;

    &:hover {
      color: $color-danger;
      background: rgba($color-danger, 0.1);
    }
  }
}

// ============================================================================
// 材质内容
// ============================================================================
.material-content {
  @include flex-column;
  padding: $space-3;
  overflow-y: auto;
  flex: 1;
  @include scrollbar-custom;
}

// ============================================================================
// 选中材质提示
// ============================================================================
.selected-material-hint {
  @include flex-center-y;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: rgba($color-primary, 0.1);
  border: 1px solid rgba($color-primary, 0.2);
  border-radius: $radius-md;
  margin-bottom: $space-3;

  svg {
    width: 16px;
    height: 16px;
    color: $color-primary;
    flex-shrink: 0;
  }

  span {
    font-size: $font-size-xs;
    color: $color-primary;
    line-height: 1.4;
  }
}

// ============================================================================
// 材质分类
// ============================================================================
.material-category {
  margin-bottom: $space-2;

  &:last-child {
    margin-bottom: 0;
  }
}

.category-header {
  @include flex-center-y;
  width: 100%;
  padding: $space-2 $space-3;
  background: rgba($color-white, 0.03);
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $duration-normal;
  text-align: left;
  color: $color-text-primary;

  &:hover {
    background: rgba($color-white, 0.06);
  }

  span {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }
}

.category-arrow {
  width: 16px;
  height: 16px;
  margin-right: $space-2;
  color: $color-text-secondary;
  transition: transform $duration-normal;
  flex-shrink: 0;

  &.expanded {
    transform: rotate(0deg);
  }

  &:not(.expanded) {
    transform: rotate(-90deg);
  }
}

.category-count {
  margin-left: auto;
  font-size: $font-size-xs;
  color: $color-text-muted;
  background: rgba($color-white, 0.05);
  padding: 2px 6px;
  border-radius: $radius-sm;
}

// ============================================================================
// 材质列表
// ============================================================================
.material-list {
  @include flex-column;
  gap: $space-1;
  margin-top: $space-2;
  padding-left: $space-2;
}

.material-item {
  @include flex-center-y;
  gap: $space-3;
  width: 100%;
  padding: $space-2 $space-3;
  background: rgba($color-white, 0.02);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $duration-normal;
  text-align: left;

  &:hover {
    background: rgba($color-white, 0.05);
    border-color: $color-border-muted;
  }

  &.active {
    background: rgba($color-primary, 0.1);
    border-color: rgba($color-primary, 0.3);

    .material-name {
      color: $color-primary;
    }
  }
}

.material-icon {
  @include flex-center;
  width: 32px;
  height: 32px;
  background: rgba(var(--material-color), 0.15);
  border-radius: $radius-md;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
    color: var(--material-color, $color-text-secondary);
  }
}

.material-info {
  @include flex-column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.material-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  transition: color $duration-normal;
  @include text-truncate;
}

.material-desc {
  font-size: $font-size-xs;
  color: $color-text-muted;
  @include text-truncate;
}

.material-color {
  width: 16px;
  height: 16px;
  border-radius: $radius-sm;
  border: 1px solid rgba($color-white, 0.1);
  flex-shrink: 0;
}
</style>
