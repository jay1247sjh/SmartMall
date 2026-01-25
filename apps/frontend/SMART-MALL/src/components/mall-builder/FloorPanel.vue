<script setup lang="ts">
/**
 * FloorPanel 组件
 *
 * 商城建模器楼层管理侧边栏，用于显示和管理楼层列表。
 *
 * 功能：
 * - 显示楼层列表：展示所有楼层及其信息
 * - 楼层选择：点击楼层切换当前编辑楼层
 * - 添加楼层：点击添加按钮创建新楼层
 * - 删除楼层：删除指定楼层（至少保留一个楼层）
 * - 面板折叠：支持折叠/展开面板
 *
 * @example
 * ```vue
 * <FloorPanel
 *   :floors="project.floors"
 *   :currentFloorId="currentFloorId"
 *   v-model:collapsed="leftPanelCollapsed"
 *   @select="selectFloor"
 *   @add="openAddFloorModal"
 *   @delete="deleteFloor"
 * />
 * ```
 */
import type { FloorDefinition } from '@/builder'

// ============================================================================
// 类型定义
// ============================================================================

export interface FloorPanelProps {
  /** 楼层列表 */
  floors: FloorDefinition[]
  /** 当前选中的楼层 ID */
  currentFloorId: string
  /** 面板是否折叠 */
  collapsed: boolean
}

export interface FloorPanelEmits {
  (e: 'update:collapsed', value: boolean): void
  (e: 'select', floorId: string): void
  (e: 'add'): void
  (e: 'delete', floorId: string): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<FloorPanelProps>(), {
  floors: () => [],
  currentFloorId: '',
  collapsed: false,
})

const emit = defineEmits<FloorPanelEmits>()

// ============================================================================
// 方法
// ============================================================================

/**
 * 切换面板折叠状态
 */
function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed)
}

/**
 * 选择楼层
 * @param floorId 楼层 ID
 */
function handleSelectFloor(floorId: string) {
  emit('select', floorId)
}

/**
 * 添加楼层
 */
function handleAddFloor() {
  emit('add')
}

/**
 * 删除楼层
 * @param floorId 楼层 ID
 */
function handleDeleteFloor(floorId: string) {
  emit('delete', floorId)
}

/**
 * 检查楼层是否为当前选中楼层
 * @param floorId 楼层 ID
 */
function isCurrentFloor(floorId: string): boolean {
  return floorId === props.currentFloorId
}

/**
 * 检查是否可以删除楼层（至少保留一个楼层）
 */
function canDeleteFloor(): boolean {
  return props.floors.length > 1
}

/**
 * 获取折叠按钮图标路径
 */
function getCollapseIconPath(): string {
  return props.collapsed ? 'M8 4l6 6-6 6' : 'M12 4l-6 6 6 6'
}
</script>

<template>
  <aside :class="['floor-panel', { collapsed }]">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3>楼层</h3>
      <div class="panel-actions">
        <!-- 添加楼层按钮 -->
        <button 
          class="btn-icon" 
          title="添加楼层"
          @click="handleAddFloor"
        >
          <svg viewBox="0 0 20 20" fill="none">
            <path 
              d="M10 4v12M4 10h12" 
              stroke="currentColor" 
              stroke-width="1.5" 
              stroke-linecap="round"
            />
          </svg>
        </button>
        <!-- 折叠按钮 -->
        <button 
          class="btn-icon" 
          title="折叠面板"
          @click="toggleCollapsed"
        >
          <svg viewBox="0 0 20 20" fill="none">
            <path 
              :d="getCollapseIconPath()" 
              stroke="currentColor" 
              stroke-width="1.5" 
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 楼层列表 -->
    <div v-if="!collapsed" class="floor-list">
      <div
        v-for="floor in floors"
        :key="floor.id"
        v-memo="[floor.id, floor.name, floor.level, isCurrentFloor(floor.id)]"
        :class="['floor-item', { active: isCurrentFloor(floor.id) }]"
        @click="handleSelectFloor(floor.id)"
      >
        <div class="floor-info">
          <span class="floor-name">{{ floor.name }}</span>
          <span class="floor-level">Level {{ floor.level }}</span>
        </div>
        <div class="floor-actions">
          <button 
            class="btn-icon small" 
            :disabled="!canDeleteFloor()"
            title="删除楼层"
            @click.stop="handleDeleteFloor(floor.id)"
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
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 楼层面板
// ============================================================================
.floor-panel {
  position: absolute;
  left: $space-4;
  top: 72px;
  width: 200px;
  background: linear-gradient(
    to bottom,
    rgba($color-bg-primary, 0.95),
    rgba($color-bg-primary, 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-xl;
  z-index: 50;
  transition: width $duration-normal;

  &.collapsed {
    width: 48px;

    .panel-header h3 {
      display: none;
    }

    .panel-actions {
      width: 100%;
      justify-content: center;
    }
  }
}

// ============================================================================
// 面板头部
// ============================================================================
.panel-header {
  @include flex-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border-subtle;

  h3 {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
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

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.small {
    width: 24px;
    height: 24px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
}

// ============================================================================
// 楼层列表
// ============================================================================
.floor-list {
  @include flex-column;
  gap: $space-1;
  padding: $space-2;
  max-height: 300px;
  overflow-y: auto;
  @include scrollbar-custom;
}

.floor-item {
  @include flex-between;
  padding: $space-2 $space-3;
  background: rgba($color-white, 0.03);
  border: 1px solid transparent;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: rgba($color-white, 0.06);
  }

  &.active {
    background: rgba($color-primary, 0.15);
    border-color: rgba($color-primary, 0.3);

    .floor-name {
      color: $color-primary;
    }
  }
}

.floor-info {
  @include flex-column;
  gap: 2px;
}

.floor-name {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  transition: color $duration-normal;
}

.floor-level {
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.floor-actions {
  @include flex-center-y;
  gap: $space-1;
  opacity: 0;
  transition: opacity $duration-normal;

  .floor-item:hover & {
    opacity: 1;
  }
}
</style>
