<script setup lang="ts">
/**
 * 自定义下拉选择器
 * 使用 Element Plus 组件
 */
import { ElSelect, ElOption, ElIcon } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

interface Option {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleChange(value: string) {
  emit('update:modelValue', value)
}
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    :placeholder="placeholder || '请选择'"
    class="custom-select"
    @update:model-value="handleChange"
  >
    <ElOption
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    >
      <span class="option-label">{{ option.label }}</span>
      <ElIcon v-if="option.value === modelValue" class="option-check">
        <Check />
      </ElIcon>
    </ElOption>
  </ElSelect>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.custom-select {
  min-width: 140px;

  :deep(.el-select__wrapper) {
    background: rgba($color-bg-secondary, 0.9);
    border: 1px solid rgba($color-primary, 0.3);
    border-radius: 10px;
    box-shadow: none;
    transition: all $duration-normal $ease-default;

    &:hover {
      border-color: rgba($color-primary, 0.5);
      background: rgba($color-primary, 0.08);
    }

    &.is-focused {
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-primary, 0.15);
    }
  }

  :deep(.el-select__placeholder) {
    color: $color-text-secondary;
  }

  :deep(.el-select__selected-item) {
    color: $color-text-primary;
  }
}

:deep(.el-select-dropdown) {
  background: $color-bg-tertiary;
  border: 1px solid rgba($color-primary, 0.2);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba($color-black, 0.4);

  .el-select-dropdown__item {
    color: $color-text-secondary;
    border-radius: $radius-md;
    margin: 2px $space-2;
    padding: 10px $space-3;

    &:hover {
      background: rgba($color-primary, 0.1);
      color: $color-text-primary;
    }

    &.is-selected {
      background: rgba($color-primary, 0.15);
      color: $color-primary;
    }
  }
}

.option-label {
  flex: 1;
}

.option-check {
  color: $color-primary;
  margin-left: $space-2;
}
</style>
