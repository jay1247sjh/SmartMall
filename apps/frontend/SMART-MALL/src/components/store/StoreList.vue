<script setup lang="ts">
/**
 * StoreList 子组件
 * 
 * 店铺列表显示和选择组件
 * 
 * 业务职责：
 * - 显示店铺列表
 * - 支持店铺选择
 * - 触发编辑和删除事件
 * - 使用 v-memo 优化渲染性能
 * 
 * Requirements: 2.1, 25.3
 */
import type { StoreDTO } from '@/api/store.api'
import StoreCard from './StoreCard.vue'

// ============================================================================
// Props & Emits
// ============================================================================

interface StoreListProps {
  /** 店铺列表数据 */
  stores: StoreDTO[]
  /** 当前选中的店铺ID */
  selectedId: string | null
  /** 是否正在加载 */
  loading: boolean
}

interface StoreListEmits {
  (e: 'select', store: StoreDTO): void
  (e: 'edit', store: StoreDTO): void
  (e: 'delete', store: StoreDTO): void
}

defineProps<StoreListProps>()
const emit = defineEmits<StoreListEmits>()

// ============================================================================
// Methods
// ============================================================================

function handleSelect(store: StoreDTO) {
  emit('select', store)
}

function handleEdit(store: StoreDTO) {
  emit('edit', store)
}

function handleDelete(store: StoreDTO) {
  emit('delete', store)
}
</script>

<template>
  <div class="store-list-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 空状态 -->
    <div v-else-if="stores.length === 0" class="empty">
      <p>暂无店铺</p>
      <slot name="empty-action"></slot>
    </div>

    <!-- 店铺列表 - 使用 v-memo 优化渲染 -->
    <div v-else class="store-list">
      <StoreCard
        v-for="store in stores"
        :key="store.storeId"
        v-memo="[store.storeId, store.name, store.status, store.floorName, store.areaName, selectedId === store.storeId]"
        :store="store"
        :selected="selectedId === store.storeId"
        @click="handleSelect(store)"
        @edit="handleEdit(store)"
        @delete="handleDelete(store)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.store-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading,
.empty {
  @include table-empty-state;
}

.store-list {
  flex: 1;
  overflow-y: auto;
  padding: $space-3;
}
</style>
