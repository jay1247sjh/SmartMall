<script setup lang="ts">
/**
 * FloorSelector 组件
 *
 * 3D 商城页面楼层选择器，支持楼层切换功能。
 *
 * 功能：
 * - 显示当前楼层：点击展开/收起楼层列表
 * - 楼层列表：显示所有可用楼层，支持选择切换
 * - 高亮当前楼层：当前选中楼层有视觉区分
 *
 * @example
 * ```vue
 * <FloorSelector
 *   :floors="floors"
 *   :currentFloorId="currentFloor"
 *   v-model:visible="showFloorSelector"
 *   @select="selectFloor"
 * />
 * ```
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface Floor {
  /** 楼层 ID */
  id: number
  /** 楼层名称（如 "1F"） */
  name: string
  /** 楼层标签/描述（如 "餐饮美食"） */
  label: string
}

export interface FloorSelectorProps {
  /** 楼层列表 */
  floors: Floor[]
  /** 当前选中的楼层 ID */
  currentFloorId: number
  /** 是否显示楼层列表 */
  visible: boolean
}

export interface FloorSelectorEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', floorId: number): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<FloorSelectorProps>(), {
  floors: () => [],
  currentFloorId: 1,
  visible: false,
})

const emit = defineEmits<FloorSelectorEmits>()

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 获取当前楼层信息
 */
function getCurrentFloor(): Floor | undefined {
  return props.floors.find(f => f.id === props.currentFloorId)
}

// ============================================================================
// 方法
// ============================================================================

/**
 * 切换楼层列表显示状态
 */
function toggleFloorList() {
  emit('update:visible', !props.visible)
}

/**
 * 选择楼层
 * @param floorId 楼层 ID
 */
function handleSelectFloor(floorId: number) {
  emit('select', floorId)
  emit('update:visible', false)
}
</script>

<template>
  <div class="floor-selector">
    <!-- 当前楼层按钮 -->
    <button class="floor-btn current" @click="toggleFloorList">
      {{ getCurrentFloor()?.name ?? '选择楼层' }}
      <span class="arrow">{{ visible ? '▲' : '▼' }}</span>
    </button>

    <!-- 楼层列表 -->
    <div v-if="visible" class="floor-list">
      <button
        v-for="floor in floors"
        :key="floor.id"
        :class="['floor-item', { active: floor.id === currentFloorId }]"
        @click="handleSelectFloor(floor.id)"
      >
        <span class="floor-name">{{ floor.name }}</span>
        <span class="floor-label">{{ floor.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 扩展变量（全局变量中没有的）
$bg-panel: rgba($color-bg-secondary, 0.9);
$bg-panel-solid: rgba($color-bg-secondary, 0.95);

// ============================================================================
// 楼层选择器
// ============================================================================
.floor-selector {
  position: absolute;
  left: $space-5;
  top: 50%;
  transform: translateY(-50%);

  .floor-btn {
    @include flex-center-y;
    gap: $space-2;
    padding: $space-3 $space-5;
    background: $bg-panel;
    border: 1px solid $color-border-muted;
    border-radius: 10px;
    color: $color-text-primary;
    font-size: 16px;
    font-weight: $font-weight-semibold;
    @include clickable;

    &:hover {
      background: $color-bg-secondary;
    }

    .arrow {
      font-size: $font-size-xs;
      color: $color-text-secondary;
    }
  }

  .floor-list {
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: $space-2;
    background: $bg-panel-solid;
    border: 1px solid $color-border-muted;
    border-radius: 10px;
    overflow: hidden;
    min-width: 180px;
    z-index: 10;

    .floor-item {
      @include flex-column;
      align-items: flex-start;
      gap: $space-1;
      width: 100%;
      padding: $space-3 $space-4;
      background: transparent;
      border: none;
      @include clickable;
      @include hover-highlight;

      &.active {
        background: $color-primary-muted;
      }

      .floor-name {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        color: $color-text-primary;
      }

      .floor-label {
        font-size: $font-size-sm;
        color: $color-text-secondary;
      }
    }
  }
}
</style>
