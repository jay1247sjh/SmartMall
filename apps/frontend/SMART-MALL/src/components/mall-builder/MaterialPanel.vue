<script setup lang="ts">
/**
 * MaterialPanel 组件
 *
 * 商城建模器材质选择侧边栏，支持折叠/展开。
 * 折叠态采用与 FloorPanel 一致的 Activity Bar 风格。
 *
 * @example
 * ```vue
 * <MaterialPanel
 *   :categories="categories"
 *   :expandedCategories="expandedCategories"
 *   :selectedMaterialId="selectedMaterialId"
 *   v-model:collapsed="rightPanelCollapsed"
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ============================================================================
// 类型定义
// ============================================================================

export interface MaterialPanelProps {
  categories: MaterialCategory[]
  expandedCategories: MaterialCategory[]
  selectedMaterialId: string | null
  collapsed: boolean
}

export interface MaterialPanelEmits {
  (e: 'toggleCategory', category: MaterialCategory): void
  (e: 'selectMaterial', preset: MaterialPreset): void
  (e: 'clearSelection'): void
  (e: 'update:collapsed', value: boolean): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<MaterialPanelProps>(), {
  categories: () => [],
  expandedCategories: () => [],
  selectedMaterialId: null,
  collapsed: false,
})

const emit = defineEmits<MaterialPanelEmits>()

// ============================================================================
// 方法
// ============================================================================

function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed)
}

function handleToggleCategory(category: MaterialCategory) {
  emit('toggleCategory', category)
}

function handleSelectMaterial(preset: MaterialPreset) {
  emit('selectMaterial', preset)
}

function handleClearSelection() {
  emit('clearSelection')
}

function isCategoryExpanded(category: MaterialCategory): boolean {
  return props.expandedCategories.includes(category)
}

function isMaterialSelected(presetId: string): boolean {
  return props.selectedMaterialId === presetId
}

function getPresetsForCategory(category: MaterialCategory): MaterialPreset[] {
  return getMaterialPresetsByCategory(category)
}

function getCategoryName(category: MaterialCategory): string {
  return getCategoryDisplayName(category)
}

function getCategoryCount(category: MaterialCategory): number {
  return getMaterialPresetsByCategory(category).length
}

function getSelectedMaterial(): MaterialPreset | null {
  if (!props.selectedMaterialId) return null
  for (const category of props.categories) {
    const presets = getMaterialPresetsByCategory(category)
    const found = presets.find(p => p.id === props.selectedMaterialId)
    if (found) return found
  }
  return null
}

function getSelectedMaterialHint(): string {
  const material = getSelectedMaterial()
  if (!material) return ''
  return material.isInfrastructure 
    ? t('builder.materialPanel.placeHint')
    : t('builder.materialPanel.drawHint')
}

function hasSelectedMaterial(): boolean {
  return props.selectedMaterialId !== null
}
</script>

<template>
  <aside :class="['material-panel', { collapsed }]">
    <!-- 折叠态：Activity Bar 垂直图标条 -->
    <div
      v-if="collapsed"
      class="collapsed-bar"
      :title="t('builder.materialPanel.expand')"
      @click="toggleCollapsed"
    >
      <!-- 材质图标 -->
      <svg viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
        <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <!-- 展开箭头 ‹ (指向左侧，因为面板在右侧) -->
      <svg viewBox="0 0 20 20" fill="none" class="expand-arrow">
        <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- 展开态：完整面板 -->
    <template v-else>
      <div class="panel-header">
        <h3>{{ t('builder.materialPanel.title') }}</h3>
        <div class="panel-actions">
          <button
            v-if="hasSelectedMaterial()"
            class="btn-icon clear"
            :title="t('builder.materialPanel.clearSelection')"
            @click="handleClearSelection"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="btn-icon" :title="t('builder.materialPanel.collapse')" @click="toggleCollapsed">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="material-content">
        <!-- 选中材质提示 -->
        <div v-if="hasSelectedMaterial()" class="selected-material-hint">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <span>{{ getSelectedMaterialHint() }}</span>
        </div>

        <!-- 材质分类列表 -->
        <div v-for="category in categories" :key="category" class="material-category">
          <button class="category-header" @click="handleToggleCategory(category)">
            <svg :class="['category-arrow', { expanded: isCategoryExpanded(category) }]" viewBox="0 0 20 20" fill="none">
              <path d="M7 8l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ getCategoryName(category) }}</span>
            <span class="category-count">{{ getCategoryCount(category) }}</span>
          </button>

          <div v-if="isCategoryExpanded(category)" class="material-list">
            <button
              v-for="preset in getPresetsForCategory(category)"
              :key="preset.id"
              :class="['material-item', { active: isMaterialSelected(preset.id) }]"
              :style="{ '--material-color': preset.color }"
              @click="handleSelectMaterial(preset)"
            >
              <div class="material-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path :d="preset.icon" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="material-info">
                <span class="material-name">{{ preset.name }}</span>
                <span class="material-desc">{{ preset.description }}</span>
              </div>
              <div class="material-color" :style="{ background: preset.color }"></div>
            </button>
          </div>
        </div>
      </div>
    </template>
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
    rgba(var(--bg-primary-rgb), 0.95),
    rgba(var(--bg-primary-rgb), 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-xl;
  z-index: 50;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: width $duration-normal;

  &.collapsed {
    width: 40px;
  }
}

// ============================================================================
// 折叠态：Activity Bar 图标条
// ============================================================================
.collapsed-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
  padding: $space-3 0;
  cursor: pointer;
  height: 100%;

  svg {
    width: 20px;
    height: 20px;
    color: var(--text-secondary);
    transition: color $duration-normal;
  }

  &:hover {
    background: var(--bg-hover);

    svg {
      color: var(--text-primary);
    }
  }
}

.expand-arrow {
  margin-top: auto;
}

// ============================================================================
// 面板头部
// ============================================================================
.panel-header {
  @include flex-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;

  h3 {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    margin: 0;
  }
}

.panel-actions {
  @include flex-center-y;
  gap: $space-1;
}

.btn-icon {
  @include flex-center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  &.clear {
    color: var(--text-muted);

    &:hover {
      color: var(--error);
      background: rgba(var(--error-rgb), 0.1);
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
  background: rgba(var(--accent-primary-rgb), 0.1);
  border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
  border-radius: $radius-md;
  margin-bottom: $space-3;

  svg {
    width: 16px;
    height: 16px;
    color: var(--accent-primary);
    flex-shrink: 0;
  }

  span {
    font-size: $font-size-xs;
    color: var(--accent-primary);
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
  background: rgba(var(--white-rgb), 0.03);
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $duration-normal;
  text-align: left;
  color: var(--text-primary);

  &:hover {
    background: rgba(var(--white-rgb), 0.06);
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
  color: var(--text-secondary);
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
  color: var(--text-muted);
  background: rgba(var(--white-rgb), 0.05);
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
  background: rgba(var(--white-rgb), 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $duration-normal;
  text-align: left;

  &:hover {
    background: rgba(var(--white-rgb), 0.05);
    border-color: var(--border-muted);
  }

  &.active {
    background: rgba(var(--accent-primary-rgb), 0.1);
    border-color: rgba(var(--accent-primary-rgb), 0.3);

    .material-name {
      color: var(--accent-primary);
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
    color: var(--material-color, var(--text-secondary));
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
  color: var(--text-primary);
  transition: color $duration-normal;
  @include text-truncate;
}

.material-desc {
  font-size: $font-size-xs;
  color: var(--text-muted);
  @include text-truncate;
}

.material-color {
  width: 16px;
  height: 16px;
  border-radius: $radius-sm;
  border: 1px solid rgba(var(--white-rgb), 0.1);
  flex-shrink: 0;
}
</style>
