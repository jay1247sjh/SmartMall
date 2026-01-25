<script setup lang="ts">
/**
 * Input - 统一输入框组件
 * 
 * 支持多种类型（text、password、number、textarea）、前后缀插槽、验证错误显示
 * 基于 Element Plus ElInput 封装，提供统一的样式和行为
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
import { computed, ref } from 'vue'
import { ElInput, ElIcon } from 'element-plus'
import { View, Hide } from '@element-plus/icons-vue'
import type { InputProps, InputType } from '@/types/ui'

interface Props extends InputProps {
  /** 输入值（v-model） */
  modelValue: string | number
  /** 输入类型 */
  type?: InputType
  /** 占位符 */
  placeholder?: string
  /** 禁用状态 */
  disabled?: boolean
  /** 只读状态 */
  readonly?: boolean
  /** 是否可清除 */
  clearable?: boolean
  /** 是否显示密码切换按钮（仅 password 类型） */
  showPassword?: boolean
  /** 文本域行数（仅 textarea 类型） */
  rows?: number
  /** 最大输入长度 */
  maxlength?: number
  /** 错误信息 */
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  readonly: false,
  clearable: false,
  showPassword: false,
  rows: 3,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}>()

// 密码可见性状态
const passwordVisible = ref(false)

/**
 * 计算实际的输入类型
 * 对于 password 类型，根据可见性状态切换
 */
const actualType = computed(() => {
  if (props.type === 'password') {
    return passwordVisible.value ? 'text' : 'password'
  }
  return props.type
})

/**
 * 计算输入框的 CSS 类
 */
const inputClasses = computed(() => [
  'smart-input',
  `input-type-${props.type}`,
  {
    'input-error': !!props.error,
    'input-disabled': props.disabled,
    'input-readonly': props.readonly,
    'has-prefix': !!slots.prefix,
    'has-suffix': !!slots.suffix || props.type === 'password' || props.clearable,
  },
])

/**
 * 获取插槽
 */
const slots = defineSlots<{
  prefix?: () => any
  suffix?: () => any
}>()

/**
 * 处理输入值变化
 */
function handleInput(value: string | number) {
  emit('update:modelValue', value)
}

/**
 * 处理聚焦事件
 */
function handleFocus(event: FocusEvent) {
  emit('focus', event)
}

/**
 * 处理失焦事件
 */
function handleBlur(event: FocusEvent) {
  emit('blur', event)
}

/**
 * 处理清除事件
 */
function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
}

/**
 * 切换密码可见性
 */
function togglePasswordVisibility() {
  passwordVisible.value = !passwordVisible.value
}
</script>

<template>
  <div :class="inputClasses">
    <!-- Text/Password/Number 输入框 -->
    <ElInput
      v-if="type !== 'textarea'"
      :model-value="modelValue"
      :type="actualType"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :clearable="clearable && !showPassword"
      :maxlength="maxlength"
      :show-word-limit="!!maxlength"
      class="smart-input__inner"
      @update:model-value="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
    >
      <!-- Prefix 插槽 -->
      <template v-if="$slots.prefix" #prefix>
        <span class="input-slot input-prefix">
          <slot name="prefix" />
        </span>
      </template>
      
      <!-- Suffix 插槽 -->
      <template #suffix>
        <span class="input-slot input-suffix">
          <!-- 自定义后缀内容 -->
          <slot name="suffix" />
          
          <!-- 密码切换按钮 -->
          <ElIcon
            v-if="type === 'password' && showPassword"
            class="input-password-toggle"
            @click="togglePasswordVisibility"
          >
            <View v-if="passwordVisible" />
            <Hide v-else />
          </ElIcon>
        </span>
      </template>
    </ElInput>
    
    <!-- Textarea 文本域 -->
    <ElInput
      v-else
      :model-value="modelValue"
      type="textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      :maxlength="maxlength"
      :show-word-limit="!!maxlength"
      class="smart-input__inner smart-input__textarea"
      @update:model-value="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    
    <!-- 错误信息显示 -->
    <div v-if="error" class="input-error-message">
      {{ error }}
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.smart-input {
  width: 100%;
  
  // ============================================================================
  // Element Plus 输入框样式覆盖
  // ============================================================================
  
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    background: $color-bg-primary;
    border: 1px solid $color-border-muted;
    border-radius: $radius-md;
    box-shadow: none;
    padding: $space-3 $space-4;
    font-size: $font-size-base;
    color: $color-text-primary;
    @include transition-base;
    
    &:hover {
      border-color: $color-border-focus;
    }
    
    &:focus,
    &.is-focus {
      border-color: $color-primary;
      box-shadow: 0 0 0 2px $color-primary-muted;
    }
  }
  
  :deep(.el-input__inner),
  :deep(.el-textarea__inner) {
    color: $color-text-primary;
    
    &::placeholder {
      color: $color-text-muted;
    }
  }
  
  // ============================================================================
  // 类型特定样式
  // ============================================================================
  
  // Number 类型 - 隐藏默认的上下箭头
  &.input-type-number {
    :deep(.el-input__inner) {
      appearance: textfield;
      -moz-appearance: textfield;
      
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        appearance: none;
        -webkit-appearance: none;
        margin: 0;
      }
    }
  }
  
  // Textarea 类型
  &.input-type-textarea {
    :deep(.el-textarea__inner) {
      min-height: 80px;
      resize: vertical;
      padding: $space-3 $space-4;
    }
  }
  
  // ============================================================================
  // 状态样式
  // ============================================================================
  
  // 错误状态
  &.input-error {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      border-color: $color-error;
      
      &:hover {
        border-color: $color-error-hover;
      }
      
      &:focus,
      &.is-focus {
        border-color: $color-error;
        box-shadow: 0 0 0 2px $color-error-muted;
      }
    }
  }
  
  // 禁用状态
  &.input-disabled {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      background: $color-bg-tertiary;
      border-color: $color-border-subtle;
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      color: $color-text-disabled;
      cursor: not-allowed;
    }
  }
  
  // 只读状态
  &.input-readonly {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      background: $color-bg-secondary;
      border-color: $color-border-subtle;
    }
    
    :deep(.el-input__inner),
    :deep(.el-textarea__inner) {
      cursor: default;
    }
  }
  
  // ============================================================================
  // 插槽样式
  // ============================================================================
  
  .input-slot {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    color: $color-text-secondary;
  }
  
  .input-prefix {
    margin-right: $space-2;
  }
  
  .input-suffix {
    margin-left: $space-2;
  }
  
  // 密码切换按钮
  .input-password-toggle {
    cursor: pointer;
    color: $color-text-secondary;
    @include transition-base;
    
    &:hover {
      color: $color-text-primary;
    }
  }
  
  // ============================================================================
  // 清除按钮样式
  // ============================================================================
  
  :deep(.el-input__clear) {
    color: $color-text-muted;
    @include transition-base;
    
    &:hover {
      color: $color-text-secondary;
    }
  }
  
  // ============================================================================
  // 字数统计样式
  // ============================================================================
  
  :deep(.el-input__count),
  :deep(.el-textarea__count) {
    background: transparent;
    color: $color-text-muted;
    font-size: $font-size-sm;
  }
  
  // ============================================================================
  // 错误信息样式
  // ============================================================================
  
  .input-error-message {
    margin-top: $space-2;
    font-size: $font-size-sm;
    color: $color-error;
    line-height: 1.4;
  }
}
</style>
