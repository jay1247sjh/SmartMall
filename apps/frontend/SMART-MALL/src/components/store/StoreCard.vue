<script setup lang="ts">
/**
 * StoreCard 子组件
 * 
 * 单个店铺卡片显示组件
 * 
 * 业务职责：
 * - 显示店铺基本信息（名称、位置）
 * - 显示店铺状态
 * - 支持选中状态
 * - 触发点击、编辑、删除事件
 * 
 * Requirements: 2.3
 */
import type { StoreDTO } from '@/api/store.api'

// ============================================================================
// Props & Emits
// ============================================================================

interface StoreCardProps {
  /** 店铺数据 */
  store: StoreDTO
  /** 是否选中 */
  selected: boolean
}

interface StoreCardEmits {
  (e: 'click'): void
  (e: 'edit'): void
  (e: 'delete'): void
}

defineProps<StoreCardProps>()
const emit = defineEmits<StoreCardEmits>()

// ============================================================================
// Methods
// ============================================================================

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'status-active',
    INACTIVE: 'status-inactive',
    PENDING: 'status-pending',
    CLOSED: 'status-closed',
  }
  return map[status] || ''
}

function handleClick() {
  emit('click')
}

function handleEdit(event: Event) {
  event.stopPropagation()
  emit('edit')
}

function handleDelete(event: Event) {
  event.stopPropagation()
  emit('delete')
}
</script>

<template>
  <div
    :class="['store-card', { active: selected }]"
    @click="handleClick"
  >
    <div class="store-avatar">
      {{ store.name.charAt(0) }}
    </div>
    <div class="store-info">
      <span class="store-name">{{ store.name }}</span>
      <span class="store-location">{{ store.floorName }} · {{ store.areaName }}</span>
    </div>
    <span :class="['status-dot', getStatusClass(store.status)]"></span>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.store-card {
  @include flex-center-y;
  gap: $space-3;
  padding: $space-3 + 2 $space-4;
  border-radius: $radius-md + 2;
  margin-bottom: $space-2;
  border: 1px solid transparent;
  @include clickable;
  @include hover-highlight;

  &.active {
    background: $color-primary-muted;
    border-color: rgba($color-primary, 0.3);
  }
}

.store-avatar {
  width: 40px;
  height: 40px;
  border-radius: $radius-md + 2;
  background: $gradient-admin;
  @include flex-center;
  font-size: $font-size-base + 2;
  font-weight: $font-weight-semibold;
  color: white;
  flex-shrink: 0;
}

.store-info {
  flex: 1;
  @include flex-column;
  gap: $space-1;
  min-width: 0;
}

.store-name {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  @include text-ellipsis;
}

.store-location {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

// 状态点
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: $radius-full;
  flex-shrink: 0;

  &.status-active { background: $color-success; }
  &.status-inactive { background: $color-warning; }
  &.status-pending { background: $color-primary; }
  &.status-closed { background: $color-text-muted; }
}
</style>
