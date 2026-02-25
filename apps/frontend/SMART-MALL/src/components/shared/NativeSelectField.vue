<script setup lang="ts">
/**
 * NativeSelectField - 原生下拉框统一外观组件
 * 仅封装样式与基础事件，不改变原生 select 行为。
 */
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

interface Props {
  modelValue?: string | number | null
  disabled?: boolean
  name?: string
  id?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  name: '',
  id: '',
  class: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const attrs = useAttrs()

const forwardedAttrs = computed(() => {
  const raw = attrs as Record<string, unknown>
  const { class: _ignored, ...rest } = raw
  return rest
})

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', target.value)
}
</script>

<template>
  <div :class="['native-select-field', props.class]">
    <select
      class="native-select"
      :value="modelValue"
      :disabled="disabled"
      :name="name || undefined"
      :id="id || undefined"
      v-bind="forwardedAttrs"
      @change="handleChange"
    >
      <slot />
    </select>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.native-select-field {
  width: 100%;
}

.native-select {
  @include form-control;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 100%;
  padding-right: $space-8;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 12px) 50%;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  option {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }
}
</style>
