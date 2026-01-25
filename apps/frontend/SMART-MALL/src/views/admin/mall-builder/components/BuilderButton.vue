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
  background: linear-gradient(135deg, $color-primary, $color-accent-blue-dark);
  color: $color-text-primary;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, $color-accent-blue-dark, $color-accent-blue-darker);
    transform: translateY(-1px);
  }
}

.btn-secondary {
  background: $color-bg-tertiary;
  color: $color-text-secondary;
  border: 1px solid $color-border-muted;

  &:hover:not(:disabled) {
    background: $color-border-muted;
    color: $color-text-primary;
  }
}

.btn-danger {
  background: $color-error-muted;
  color: $color-error;
  border: 1px solid rgba($color-error, 0.2);

  &:hover:not(:disabled) {
    background: rgba($color-error, 0.2);
  }
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  color: $color-text-disabled;
  border-radius: 6px;

  &:hover:not(:disabled) {
    background: $color-bg-tertiary;
    color: $color-text-primary;
  }
}

.btn-mini {
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  color: $color-text-disabled;
  border-radius: $radius-sm;

  &:hover:not(:disabled) {
    background: $color-bg-tertiary;
    color: $color-text-primary;
  }

  &.danger:hover:not(:disabled) {
    background: $color-error-muted;
    color: $color-error;
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
