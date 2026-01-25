<script setup lang="ts">
/**
 * 消息提示组件
 * 统一的页面内消息提示样式
 */
import type { MessageType } from '@/composables/useMessage'

defineProps<{
  type: MessageType
  text: string
}>()

const icons: Record<MessageType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}
</script>

<template>
  <aside :class="['message-alert', type]" role="alert">
    <span class="icon" aria-hidden="true">{{ icons[type] }}</span>
    <span class="text">{{ text }}</span>
  </aside>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.message-alert {
  @include message-alert;

  &.warning {
    background: $color-warning-muted;
    color: $color-warning;
    border: 1px solid rgba($color-warning, 0.2);
  }

  &.info {
    background: $color-info-muted;
    color: $color-info;
    border: 1px solid rgba($color-info, 0.2);
  }

  .icon {
    flex-shrink: 0;
  }

  .text {
    flex: 1;
  }
}
</style>
