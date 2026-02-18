<script setup lang="ts">
/**
 * MiniMap 组件
 *
 * 3D 商城页面迷你地图，显示当前楼层的缩略视图。
 *
 * 功能：
 * - 显示迷你地图：展示当前楼层的缩略图
 * - 关闭按钮：点击关闭迷你地图
 * - 切换按钮：当迷你地图关闭时，显示切换按钮
 *
 * @example
 * ```vue
 * <MiniMap
 *   :visible="showMinimap"
 *   :currentFloorName="currentFloorName"
 *   @close="showMinimap = false"
 *   @toggle="showMinimap = !showMinimap"
 * />
 * ```
 */

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ============================================================================
// 类型定义
// ============================================================================

export interface MiniMapProps {
  /** 是否显示迷你地图 */
  visible: boolean
  /** 当前楼层名称 */
  currentFloorName: string
}

export interface MiniMapEmits {
  (e: 'close'): void
  (e: 'toggle'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<MiniMapProps>(), {
  visible: true,
  currentFloorName: '',
})

const emit = defineEmits<MiniMapEmits>()

// ============================================================================
// 方法
// ============================================================================

/**
 * 关闭迷你地图
 */
function handleClose() {
  emit('close')
}

/**
 * 切换迷你地图显示状态
 */
function handleToggle() {
  emit('toggle')
}
</script>

<template>
  <div class="minimap-container">
    <!-- 迷你地图面板 -->
    <div v-if="visible" class="minimap">
      <div class="minimap-header">
        <span>{{ t('mall3d.miniMap') }}</span>
        <button class="btn-close" @click="handleClose">×</button>
      </div>
      <div class="minimap-content">
        <div class="minimap-placeholder">
          {{ currentFloorName }}
        </div>
      </div>
    </div>

    <!-- 切换按钮（迷你地图关闭时显示） -->
    <button v-else class="btn-minimap" @click="handleToggle">🗺️</button>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 扩展变量（全局变量中没有的）
$bg-panel: rgba(var(--bg-secondary-rgb), 0.9);

// ============================================================================
// 迷你地图容器
// ============================================================================
.minimap-container {
  position: absolute;
  right: $space-5;
  bottom: 80px;
}

// ============================================================================
// 迷你地图面板
// ============================================================================
.minimap {
  width: 180px;
  background: $bg-panel;
  border: 1px solid var(--border-muted);
  border-radius: 10px;
  overflow: hidden;

  .minimap-header {
    @include flex-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
    font-size: $font-size-sm;
    color: var(--text-secondary);

    .btn-close {
      width: 20px;
      height: 20px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 16px;
      @include flex-center;
      @include clickable;

      &:hover {
        color: var(--text-primary);
      }
    }
  }

  .minimap-content {
    padding: $space-3;

    .minimap-placeholder {
      width: 100%;
      aspect-ratio: 1;
      background: rgba(var(--text-primary-rgb), 0.04);
      border-radius: 6px;
      @include flex-center;
      font-size: 24px;
      font-weight: $font-weight-semibold;
      color: var(--text-muted);
    }
  }
}

// ============================================================================
// 切换按钮
// ============================================================================
.btn-minimap {
  width: 44px;
  height: 44px;
  background: $bg-panel;
  border: 1px solid var(--border-muted);
  border-radius: 10px;
  font-size: $font-size-2xl;
  @include clickable;

  &:hover {
    background: var(--bg-secondary);
  }
}
</style>
