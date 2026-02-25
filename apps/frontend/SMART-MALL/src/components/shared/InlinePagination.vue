<script setup lang="ts">
/**
 * InlinePagination - 轻量分页器
 * 统一“上一页/页码/下一页”交互。
 */
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  change: [page: number]
}>()

const canPrev = computed(() => !props.disabled && props.currentPage > 1)
const canNext = computed(() => !props.disabled && props.currentPage < props.totalPages)

function toPrev() {
  if (canPrev.value) {
    emit('change', props.currentPage - 1)
  }
}

function toNext() {
  if (canNext.value) {
    emit('change', props.currentPage + 1)
  }
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination">
    <button class="page-btn" :disabled="!canPrev" @click="toPrev">上一页</button>
    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
    <button class="page-btn" :disabled="!canNext" @click="toNext">下一页</button>
  </nav>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.pagination {
  @include pagination;
}

.page-btn {
  @include pagination-btn;
}

.page-info {
  @include pagination-info;
}
</style>
