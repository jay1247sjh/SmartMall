<script setup lang="ts">
/**
 * 操作按钮组件
 * 表格行内的小型操作按钮
 */
defineProps<{
  variant?: 'approve' | 'reject' | 'view' | 'edit' | 'delete' | 'publish' | 'rollback'
  disabled?: boolean
}>()

defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <button 
    class="action-btn" 
    :class="variant" 
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.action-btn {
  @include btn-action;

  &.approve,
  &.publish {
    background: rgba($color-success, 0.2);
    color: $color-success;
  }

  &.reject,
  &.delete {
    background: rgba($color-error, 0.2);
    color: $color-error;
  }

  &.view,
  &.edit {
    background: rgba($color-primary, 0.2);
    color: $color-primary;
  }

  &.rollback {
    background: rgba($color-warning, 0.2);
    color: $color-warning;
  }
}
</style>
