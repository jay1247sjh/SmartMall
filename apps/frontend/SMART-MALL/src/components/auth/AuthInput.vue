<script setup lang="ts">
/**
 * 认证表单输入框组件
 * 使用 Element Plus 组件
 */
import { computed } from 'vue'
import { ElInput, ElIcon, ElFormItem } from 'element-plus'
import { User, Lock, Message, Phone, Loading, CircleCheck } from '@element-plus/icons-vue'

const props = defineProps<{
  id: string
  label: string
  type?: 'text' | 'password' | 'email' | 'tel'
  placeholder?: string
  autocomplete?: string
  required?: boolean
  error?: string
  checking?: boolean
  valid?: boolean
  icon?: 'user' | 'password' | 'email' | 'phone'
}>()

const modelValue = defineModel<string>({ required: true })

const hasError = computed(() => !!props.error)

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
.auth-input-item {
  margin-bottom: 20px;

  &:last-of-type {
    margin-bottom: 0;
  }

  .input-label {
    font-size: 13px;
    font-weight: 500;
    color: #9aa0a6;

    .required {
      color: #f28b82;
      margin-left: 2px;
    }

    .optional {
      color: #5f6368;
      font-weight: 400;
      font-size: 12px;
      margin-left: 4px;
    }
  }

  :deep(.el-input) {
    .el-input__wrapper {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      box-shadow: none;
      padding: 4px 14px;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

      &:hover {
        border-color: rgba(255, 255, 255, 0.2);
      }

      &.is-focus {
        border-color: #8ab4f8;
        background: rgba(138, 180, 248, 0.05);
        box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.1);
      }
    }

    .el-input__inner {
      color: #e8eaed;

      &::placeholder {
        color: #5f6368;
      }
    }

    &.is-error .el-input__wrapper {
      border-color: #f28b82;
    }
  }

  .input-icon {
    color: #5f6368;
    transition: color 0.2s;
  }

  :deep(.el-input__wrapper.is-focus) .input-icon {
    color: #8ab4f8;
  }

  .status-icon {
    &.checking {
      animation: spin 0.6s linear infinite;
      color: #8ab4f8;
    }

    &.valid {
      color: #81c995;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
