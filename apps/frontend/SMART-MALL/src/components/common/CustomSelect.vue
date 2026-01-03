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
.custom-select {
  min-width: 140px;

  :deep(.el-select__wrapper) {
    background: rgba(17, 17, 19, 0.9);
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 10px;
    box-shadow: none;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(96, 165, 250, 0.5);
      background: rgba(96, 165, 250, 0.08);
    }

    &.is-focused {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
    }
  }

  :deep(.el-select__placeholder) {
    color: #9aa0a6;
  }

  :deep(.el-select__selected-item) {
    color: #e8eaed;
  }
}

:deep(.el-select-dropdown) {
  background: #1a1a1c;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  .el-select-dropdown__item {
    color: #9aa0a6;
    border-radius: 6px;
    margin: 2px 6px;
    padding: 10px 12px;

    &:hover {
      background: rgba(96, 165, 250, 0.1);
      color: #e8eaed;
    }

    &.is-selected {
      background: rgba(96, 165, 250, 0.15);
      color: #60a5fa;
    }
  }
}

.option-label {
  flex: 1;
}

.option-check {
  color: #60a5fa;
  margin-left: 8px;
}
</style>
