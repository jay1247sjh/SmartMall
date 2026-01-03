<script setup lang="ts">
/**
 * 提示消息组件
 * 使用 Element Plus 组件
 */
import { ElAlert } from 'element-plus'
import { computed } from 'vue'

const props = defineProps<{
  type: 'error' | 'success' | 'warning'
  message: string
}>()

const alertType = computed(() => {
  const typeMap = {
    error: 'error',
    success: 'success',
    warning: 'warning',
  } as const
  return typeMap[props.type]
})
</script>

<template>
  <ElAlert
    :title="message"
    :type="alertType"
    :closable="false"
    show-icon
    class="auth-alert"
  />
</template>

<style scoped lang="scss">
.auth-alert {
  margin: 20px 0 0 0;
  border-radius: 10px;

  :deep(.el-alert__content) {
    .el-alert__title {
      font-size: 13px;
    }
  }

  &.el-alert--error {
    background: rgba(242, 139, 130, 0.1);
    border: 1px solid rgba(242, 139, 130, 0.2);

    :deep(.el-alert__title) {
      color: #f28b82;
    }
  }

  &.el-alert--success {
    background: rgba(129, 201, 149, 0.1);
    border: 1px solid rgba(129, 201, 149, 0.2);

    :deep(.el-alert__title) {
      color: #81c995;
    }
  }

  &.el-alert--warning {
    background: rgba(253, 186, 116, 0.1);
    border: 1px solid rgba(253, 186, 116, 0.2);

    :deep(.el-alert__title) {
      color: #fdba74;
    }
  }
}
</style>
