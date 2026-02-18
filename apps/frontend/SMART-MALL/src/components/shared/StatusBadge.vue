<script setup lang="ts">
/**
 * 状态徽章组件
 * 统一的状态显示样式
 */
import { computed } from 'vue'
import { useStatusConfig } from '@/composables/useStatusConfig'

const props = defineProps<{
  status: string
  domain?: 'user' | 'store' | 'approval' | 'permission' | 'version' | 'area'
}>()

const { getStatusConfig } = useStatusConfig(props.domain || 'approval')
const config = computed(() => getStatusConfig(props.status))
</script>

<template>
  <span class="status-badge" :class="config.class">
    {{ config.text }}
  </span>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.status-badge {
  @include status-badge;

  &.status-active,
  &.status-approved,
  &.status-occupied {
    @include status-variant(rgba(var(--success-rgb), 0.15), var(--success));
  }

  &.status-pending,
  &.status-frozen,
  &.status-inactive,
  &.status-draft {
    @include status-variant(rgba(var(--warning-rgb), 0.15), var(--warning));
  }

  &.status-rejected,
  &.status-revoked,
  &.status-deleted,
  &.status-closed {
    @include status-variant(rgba(var(--error-rgb), 0.15), var(--error));
  }

  &.status-published {
    @include status-variant(rgba(var(--info-rgb), 0.15), var(--info));
  }

  &.status-locked,
  &.status-archived {
    @include status-variant(rgba(var(--text-muted-rgb), 0.15), var(--text-muted));
  }

  &.status-authorized {
    @include status-variant(rgba(var(--info-rgb), 0.15), var(--info));
  }
}
</style>
