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
  <div class="filter-bar" role="toolbar" aria-label="筛选工具栏">
    <div class="filter-group">
      <slot />
    </div>
    <div v-if="$slots.actions || total !== undefined" class="filter-right">
      <slot name="actions" />
      <div v-if="total !== undefined" class="filter-stats">
        共 {{ total }} {{ totalLabel || '条记录' }}
      </div>
    </div>
  </div>
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
    flex: 1;
    min-width: 0;
    gap: $space-3;

    :deep(label) {
      font-size: $font-size-base;
      color: var(--text-secondary);
    }
  }

  .filter-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: $space-4;

    .filter-stats {
      font-size: $font-size-sm;
      color: var(--text-secondary);
      white-space: nowrap;
    }
  }
}

@media (max-width: 1100px) {
  .filter-bar {
    align-items: flex-start;
    flex-direction: column;

    .filter-group,
    .filter-right {
      width: 100%;
    }

    .filter-right {
      justify-content: flex-end;
    }
  }
}
</style>
