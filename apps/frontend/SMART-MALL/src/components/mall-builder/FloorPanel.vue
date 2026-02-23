<script setup lang="ts">
/**
 * FloorPanel 组件
 *
 * 商城建模器楼层管理侧边栏，用于显示和管理楼层列表。
 * 折叠态采用 Activity Bar 风格的垂直图标条。
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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ============================================================================
// 类型定义
// ============================================================================

export interface FloorPanelProps {
  floors: FloorDefinition[]
  currentFloorId: string
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

function toggleCollapsed() {
  emit('update:collapsed', !props.collapsed)
}

function handleSelectFloor(floorId: string) {
  emit('select', floorId)
}

function handleAddFloor() {
  emit('add')
}

function handleDeleteFloor(floorId: string) {
  emit('delete', floorId)
}

function isCurrentFloor(floorId: string): boolean {
  return floorId === props.currentFloorId
}

function canDeleteFloor(): boolean {
  return props.floors.length > 1
}
</script>

<template>
  <aside :class="['floor-panel', { collapsed }]">
    <!-- 折叠态：Activity Bar 垂直图标条 -->
    <div
      v-if="collapsed"
      class="collapsed-bar"
      :title="t('builder.floorPanel.expand')"
      @click="toggleCollapsed"
    >
      <!-- 楼层图标 -->
      <svg viewBox="0 0 20 20" fill="none">
        <path d="M3 4h14M3 10h14M3 16h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <!-- 展开箭头 › -->
      <svg viewBox="0 0 20 20" fill="none" class="expand-arrow">
        <path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

    <!-- 展开态：完整面板 -->
    <template v-else>
      <div class="panel-header">
        <h3>{{ t('builder.floorPanel.title') }}</h3>
        <div class="panel-actions">
          <button class="btn-icon" :title="t('builder.floorPanel.addFloor')" @click="handleAddFloor">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="btn-icon" :title="t('builder.floorPanel.collapse')" @click="toggleCollapsed">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="floor-list">
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
              :title="t('builder.floorPanel.deleteFloor')"
              @click.stop="handleDeleteFloor(floor.id)"
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
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
// 楼层面板
// ============================================================================
.floor-panel {
  position: absolute;
  left: $space-4;
  top: 72px;
  width: 200px;
  max-height: calc(100vh - 360px);
  background: linear-gradient(
    to bottom,
    rgba(var(--bg-primary-rgb), 0.95),
    rgba(var(--bg-primary-rgb), 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-xl;
  z-index: 50;
  transition: width $duration-normal;
  display: flex;
  flex-direction: column;
  overflow: hidden;

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
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  @include scrollbar-custom;
}

.floor-item {
  @include flex-between;
  padding: $space-2 $space-3;
  background: rgba(var(--white-rgb), 0.03);
  border: 1px solid transparent;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: rgba(var(--white-rgb), 0.06);
  }

  &.active {
    background: rgba(var(--accent-primary-rgb), 0.15);
    border-color: rgba(var(--accent-primary-rgb), 0.3);

    .floor-name {
      color: var(--accent-primary);
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
  color: var(--text-primary);
  transition: color $duration-normal;
}

.floor-level {
  font-size: $font-size-xs;
  color: var(--text-secondary);
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
