<script setup lang="ts">
/**
 * BuilderButton - Mall Builder 专用按钮组件
 * 统一的按钮样式
 */
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon' | 'mini'
  disabled?: boolean
  loading?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  disabled: false,
  loading: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function handleClick(e: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<template>
  <button
    :class="['builder-btn', `btn-${variant}`, { loading, disabled }]"
    :disabled="disabled || loading"
    :title="title"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.builder-btn {
  @include flex-center;
  gap: $space-2;
  padding: 10px $space-5;
  border: none;
  border-radius: $radius-md;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  @include clickable;

  &:disabled {
    @include disabled;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-muted));
  color: var(--text-primary);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--accent-muted), #4285f4);
    transform: translateY(-1px);
  }
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-muted);

  &:hover:not(:disabled) {
    background: var(--border-muted);
    color: var(--text-primary);
  }
}

.btn-danger {
  background: rgba(var(--error-rgb), 0.15);
  color: var(--error);
  border: 1px solid rgba(var(--error-rgb), 0.2);

  &:hover:not(:disabled) {
    background: rgba(var(--error-rgb), 0.2);
  }
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  color: var(--text-disabled);
  border-radius: 6px;

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
}

.btn-mini {
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  color: var(--text-disabled);
  border-radius: $radius-sm;

  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &.danger:hover:not(:disabled) {
    background: rgba(var(--error-rgb), 0.15);
    color: var(--error);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
