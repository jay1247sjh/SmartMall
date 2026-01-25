<script setup lang="ts">
/**
 * 筛选栏组件
 * 统一的列表页筛选栏样式
 */
defineProps<{
  total?: number
  totalLabel?: string
}>()
</script>

<template>
  <header class="filter-bar">
    <div class="filter-group">
      <slot />
    </div>
    <div v-if="total !== undefined" class="filter-stats">
      共 {{ total }} {{ totalLabel || '条记录' }}
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-4 $space-5;
  @include card-base;

  .filter-group {
    display: flex;
    align-items: center;
    gap: $space-3;

    :deep(label) {
      font-size: $font-size-base;
      color: $color-text-secondary;
    }
  }

  .filter-stats {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}
</style>
