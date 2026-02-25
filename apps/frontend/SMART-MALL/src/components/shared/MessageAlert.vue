<script setup lang="ts">
/**
 * 消息提示组件
 * 统一的页面内消息提示样式
 */
import type { MessageType } from '@/composables/useMessage'

const props = withDefaults(defineProps<{
  type: MessageType
  text: string
  closableOnClick?: boolean
}>(), {
  closableOnClick: false,
})
const emit = defineEmits<{
  (e: 'close'): void
}>()

const icons: Record<MessageType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
}

function handleClose() {
  emit('close')
}

function handleAlertClick() {
  if (!props.closableOnClick) {
    return
  }
  emit('close')
}
</script>

<template>
  <aside :class="['message-alert', type, { clickable: closableOnClick }]" role="alert" @click="handleAlertClick">
    <span class="icon" aria-hidden="true">{{ icons[type] }}</span>
    <span class="text">{{ text }}</span>
    <button class="close-btn" type="button" @click.stop="handleClose">×</button>
  </aside>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.message-alert {
  @include message-alert;

  &.warning {
    background: rgba(var(--warning-rgb), 0.15);
    color: var(--warning);
    border: 1px solid rgba(var(--warning-rgb), 0.2);
  }

  &.info {
    background: rgba(var(--info-rgb), 0.15);
    color: var(--info);
    border: 1px solid rgba(var(--info-rgb), 0.2);
  }

  .icon {
    flex-shrink: 0;
  }

  &.clickable {
    cursor: pointer;
  }

  .text {
    flex: 1;
  }

  .close-btn {
    margin-left: auto;
    border: none;
    background: transparent;
    color: currentColor;
    font-size: $font-size-lg;
    line-height: 1;
    cursor: pointer;
    opacity: 0.7;
    padding: 0;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
