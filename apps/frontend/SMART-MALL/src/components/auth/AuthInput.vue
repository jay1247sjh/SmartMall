<script setup lang="ts">
/**
 * ============================================================================
 * 认证表单输入框组件 (AuthInput.vue)
 * ============================================================================
 *
 * 【组件职责】
 * 封装 Element Plus 的 ElInput 组件，提供统一的认证表单输入框样式：
 * - 带图标的输入框（用户、密码、邮箱、手机）
 * - 验证状态显示（加载中、验证通过、错误）
 * - 必填/可选标识
 * - 深色主题样式
 *
 * 【使用示例】
 * ```vue
 * <AuthInput
 *   id="username"
 *   v-model="username"
 *   label="用户名"
 *   icon="user"
 *   placeholder="请输入用户名"
 *   required
 *   :checking="isChecking"
 *   :valid="isValid"
 *   :error="errorMsg"
 * />
 * ```
 *
 * ============================================================================
 */

import { computed } from 'vue'
import { ElInput, ElIcon, ElFormItem } from 'element-plus'
import { User, Lock, Message, Phone, Loading, CircleCheck } from '@element-plus/icons-vue'

/** 组件属性 */
const props = defineProps<{
  /** 输入框 ID，用于 label 的 for 属性和无障碍访问 */
  id: string
  /** 标签文字 */
  label: string
  /** 输入框类型 */
  type?: 'text' | 'password' | 'email' | 'tel'
  /** 占位符文字 */
  placeholder?: string
  /** 浏览器自动填充提示 */
  autocomplete?: string
  /** 是否必填 */
  required?: boolean
  /** 错误消息（有值时显示错误状态） */
  error?: string
  /** 是否正在验证（显示加载动画） */
  checking?: boolean
  /** 是否验证通过（显示绿色对勾） */
  valid?: boolean
  /** 前缀图标类型 */
  icon?: 'user' | 'password' | 'email' | 'phone'
}>()

/** 双向绑定的输入值 */
const modelValue = defineModel<string>({ required: true })

/** 是否有错误 */
const hasError = computed(() => !!props.error)

/** 图标组件映射 */
const iconComponent = computed(() => {
  const iconMap = {
    user: User,
    password: Lock,
    email: Message,
    phone: Phone,
  }
  return props.icon ? iconMap[props.icon] : null
})
</script>

<template>
  <ElFormItem :label="label" :error="error" class="auth-input-item">
    <template #label>
      <span class="input-label">
        {{ label }}
        <span v-if="required" class="required">*</span>
        <span v-else class="optional">(可选)</span>
      </span>
    </template>

    <ElInput
      :id="id"
      v-model="modelValue"
      :type="type || 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :class="{ 'is-error': hasError }"
      size="large"
      clearable
    >
      <template v-if="iconComponent" #prefix>
        <ElIcon class="input-icon">
          <component :is="iconComponent" />
        </ElIcon>
      </template>

      <template #suffix>
        <ElIcon v-if="checking" class="status-icon checking">
          <Loading />
        </ElIcon>
        <ElIcon v-else-if="valid && !hasError" class="status-icon valid">
          <CircleCheck />
        </ElIcon>
      </template>
    </ElInput>
  </ElFormItem>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.auth-input-item {
  margin-bottom: $space-5;

  &:last-of-type {
    margin-bottom: 0;
  }

  /* 标签样式 */
  .input-label {
    font-size: 13px;
    font-weight: $font-weight-medium;
    color: var(--text-secondary);

    .required {
      color: var(--error);
      margin-left: 2px;
    }

    .optional {
      @include text-muted;
      font-weight: $font-weight-normal;
      font-size: $font-size-sm;
      margin-left: $space-1;
    }
  }

  /* 穿透 Element Plus 输入框样式 */
  :deep(.el-input) {
    .el-input__wrapper {
      background: rgba(var(--black-rgb), 0.3);
      border: 1px solid var(--border-muted);
      border-radius: 10px;
      box-shadow: none;
      padding: $space-1 14px;
      transition: border-color $duration-normal, box-shadow $duration-normal, background $duration-normal;

      &:hover {
        border-color: rgba(var(--white-rgb), 0.2);
      }

      &.is-focus {
        border-color: var(--accent-primary);
        background: rgba(var(--accent-primary-rgb), 0.05);
        box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
      }
    }

    .el-input__inner {
      color: var(--text-primary);

      &::placeholder {
        color: var(--text-muted);
      }

      /* 覆盖浏览器 autofill 的白色背景 */
      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus {
        -webkit-text-fill-color: var(--text-primary);
        -webkit-box-shadow: 0 0 0 1000px transparent inset;
        transition: background-color 5000s ease-in-out 0s;
      }
    }

    &.is-error .el-input__wrapper {
      border-color: var(--error);
    }
  }

  /* 前缀图标样式 */
  .input-icon {
    @include text-muted;
    transition: color $duration-normal;
  }

  :deep(.el-input__wrapper.is-focus) .input-icon {
    color: var(--accent-primary);
  }

  /* 状态图标样式 */
  .status-icon {
    &.checking {
      animation: spin 0.6s linear infinite;
      color: var(--accent-primary);
    }

    &.valid {
      color: var(--success);
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
