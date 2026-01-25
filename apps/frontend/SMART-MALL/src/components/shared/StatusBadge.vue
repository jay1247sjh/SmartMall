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
    @include status-variant($color-success-muted, $color-success);
  }

  &.status-pending,
  &.status-frozen,
  &.status-inactive,
  &.status-draft {
    @include status-variant($color-warning-muted, $color-warning);
  }

  &.status-rejected,
  &.status-revoked,
  &.status-deleted,
  &.status-closed {
    @include status-variant($color-error-muted, $color-error);
  }

  &.status-locked,
  &.status-archived {
    @include status-variant(rgba($color-text-muted, 0.15), $color-text-muted);
  }

  &.status-authorized {
    @include status-variant($color-info-muted, $color-info);
  }
}
</style>
