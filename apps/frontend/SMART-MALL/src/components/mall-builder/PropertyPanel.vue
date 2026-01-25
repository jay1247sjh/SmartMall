<script setup lang="ts">
/**
 * PropertyPanel 组件
 *
 * 商城建模器选中区域属性编辑面板，用于查看和编辑区域属性。
 *
 * 功能：
 * - 显示区域属性：名称、类型、面积、周长
 * - 编辑区域名称：支持修改区域名称
 * - 切换区域类型：通过下拉选择切换区域类型
 * - 删除区域：删除当前选中的区域
 * - 关闭面板：关闭属性面板并取消选择
 *
 * @example
 * ```vue
 * <PropertyPanel
 *   :area="selectedArea"
 *   :areaTypes="areaTypes"
 *   @update:area="handleAreaUpdate"
 *   @delete="deleteSelectedArea"
 *   @close="deselectAll"
 * />
 * ```
 */
import { computed } from 'vue'
import type { AreaDefinition, AreaType } from '@/builder'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 区域类型配置
 */
export interface AreaTypeConfig {
  value: AreaType
  label: string
  color?: string
}

export interface PropertyPanelProps {
  /** 当前选中的区域 */
  area: AreaDefinition | null
  /** 区域类型选项列表 */
  areaTypes: AreaTypeConfig[]
}

export interface PropertyPanelEmits {
  (e: 'update:area', area: AreaDefinition): void
  (e: 'delete'): void
  (e: 'close'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<PropertyPanelProps>(), {
  area: null,
  areaTypes: () => [],
})

const emit = defineEmits<PropertyPanelEmits>()

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 区域名称（双向绑定）
 */
const areaName = computed({
  get: () => props.area?.name || '',
  set: (value: string) => {
    if (props.area) {
      emit('update:area', { ...props.area, name: value })
    }
  },
})

/**
 * 区域类型（双向绑定）
 */
const areaType = computed({
  get: () => props.area?.type || 'other',
  set: (value: AreaType) => {
    if (props.area) {
      emit('update:area', { ...props.area, type: value })
    }
  },
})

/**
 * 格式化的面积值
 */
const formattedArea = computed(() => {
  if (!props.area?.properties?.area) return '0.00'
  return props.area.properties.area.toFixed(2)
})

/**
 * 格式化的周长值
 */
const formattedPerimeter = computed(() => {
  if (!props.area?.properties?.perimeter) return '0.00'
  return props.area.properties.perimeter.toFixed(2)
})

/**
 * 检查是否有选中的区域
 */
const hasSelectedArea = computed(() => props.area !== null)

// ============================================================================
// 方法
// ============================================================================

/**
 * 关闭面板
 */
function handleClose() {
  emit('close')
}

/**
 * 删除区域
 */
function handleDelete() {
  emit('delete')
}

/**
 * 更新区域名称
 * @param event 输入事件
 */
function handleNameChange(event: Event) {
  const target = event.target as HTMLInputElement
  areaName.value = target.value
}

/**
 * 更新区域类型
 * @param event 选择事件
 */
function handleTypeChange(event: Event) {
  const target = event.target as HTMLSelectElement
  areaType.value = target.value as AreaType
}
</script>

<template>
  <aside v-if="hasSelectedArea" class="property-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3>属性</h3>
      <button 
        class="btn-icon" 
        title="关闭"
        @click="handleClose"
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
    
    <!-- 属性内容 -->
    <div class="property-content">
      <!-- 名称 -->
      <div class="property-group">
        <label>名称</label>
        <input 
          :value="areaName" 
          type="text" 
          class="input"
          placeholder="输入区域名称"
          @input="handleNameChange"
        />
      </div>
      
      <!-- 类型 -->
      <div class="property-group">
        <label>类型</label>
        <select 
          :value="areaType" 
          class="select"
          @change="handleTypeChange"
        >
          <option 
            v-for="type in areaTypes" 
            :key="type.value" 
            :value="type.value"
          >
            {{ type.label }}
          </option>
        </select>
      </div>
      
      <!-- 尺寸信息 -->
      <div class="property-panel__size-info">
        <!-- 面积 -->
        <div class="property-panel__size-item">
          <span class="property-panel__size-label">面积</span>
          <span class="property-panel__size-value">{{ formattedArea }} m²</span>
        </div>
        
        <!-- 周长 -->
        <div class="property-panel__size-item">
          <span class="property-panel__size-label">周长</span>
          <span class="property-panel__size-value">{{ formattedPerimeter }} m</span>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="property-actions">
        <button 
          class="btn-danger" 
          @click="handleDelete"
        >
          <svg viewBox="0 0 20 20" fill="none">
            <path 
              d="M5 5l10 10M15 5L5 15" 
              stroke="currentColor" 
              stroke-width="1.5" 
              stroke-linecap="round"
            />
          </svg>
          删除区域
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 属性面板
// ============================================================================
.property-panel {
  position: absolute;
  right: $space-4;
  top: 72px;
  width: 280px;
  background: linear-gradient(
    to bottom,
    rgba($color-bg-primary, 0.95),
    rgba($color-bg-primary, 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-xl;
  z-index: 60;
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
}

// ============================================================================
// 属性内容
// ============================================================================
.property-content {
  @include flex-column;
  gap: $space-4;
  padding: $space-4;
  overflow-y: auto;
  flex: 1;
  @include scrollbar-custom;
}

// ============================================================================
// 属性组
// ============================================================================
.property-group {
  @include flex-column;
  gap: $space-2;

  label {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

// ============================================================================
// 输入框
// ============================================================================
.input {
  width: 100%;
  padding: $space-2 $space-3;
  background: rgba($color-white, 0.05);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: $color-text-primary;
  transition: all $duration-normal;

  &::placeholder {
    color: $color-text-muted;
  }

  &:hover {
    border-color: $color-border-muted;
  }

  &:focus {
    outline: none;
    border-color: $color-primary;
    background: rgba($color-white, 0.08);
  }
}

// ============================================================================
// 下拉选择
// ============================================================================
.select {
  width: 100%;
  padding: $space-2 $space-3;
  background: rgba($color-white, 0.05);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: $color-text-primary;
  cursor: pointer;
  transition: all $duration-normal;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right $space-3 center;
  padding-right: $space-8;

  &:hover {
    border-color: $color-border-muted;
  }

  &:focus {
    outline: none;
    border-color: $color-primary;
    background-color: rgba($color-white, 0.08);
  }

  option {
    background: $color-bg-primary;
    color: $color-text-primary;
  }
}

// ============================================================================
// 尺寸信息（使用 BEM 命名以匹配全局样式）
// ============================================================================
.property-panel__size-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
}

.property-panel__size-item {
  @include flex-between;
  padding: $space-2 $space-3;
  background: rgba($color-white, 0.03);
  border-radius: $radius-md;
}

.property-panel__size-label {
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.property-panel__size-value {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  font-family: $font-mono;
}

// ============================================================================
// 操作按钮
// ============================================================================
.property-actions {
  margin-top: $space-2;
  padding-top: $space-4;
  border-top: 1px solid $color-border-subtle;
}

.btn-danger {
  @include flex-center;
  gap: $space-2;
  width: 100%;
  padding: $space-2 $space-4;
  background: rgba($color-danger, 0.1);
  border: 1px solid rgba($color-danger, 0.2);
  border-radius: $radius-md;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-danger;
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba($color-danger, 0.2);
    border-color: rgba($color-danger, 0.3);
  }

  &:active {
    background: rgba($color-danger, 0.25);
  }
}
</style>
