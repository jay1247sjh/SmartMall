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
    background: rgba(var(--success-rgb), 0.2);
    color: var(--success);
  }

  &.reject,
  &.delete {
    background: rgba(var(--error-rgb), 0.2);
    color: var(--error);
  }

  &.view,
  &.edit {
    background: rgba(var(--accent-primary-rgb), 0.2);
    color: var(--accent-primary);
  }

  &.rollback {
    background: rgba(var(--warning-rgb), 0.2);
    color: var(--warning);
  }
}
</style>
