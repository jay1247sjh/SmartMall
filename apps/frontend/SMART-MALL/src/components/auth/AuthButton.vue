<script setup lang="ts">
/**
 * 认证表单按钮组件
 * 使用 Element Plus 组件
 */
import { ElButton, ElIcon } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'

defineProps<{
  text: string
  loadingText?: string
  loading?: boolean
  disabled?: boolean
  type?: 'submit' | 'button'
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <ElButton
    :native-type="type || 'submit'"
    :loading="loading"
    :disabled="disabled"
    type="primary"
    size="large"
    class="auth-submit-btn"
    @click="$emit('click')"
  >
    <span>{{ loading ? (loadingText || '处理中...') : text }}</span>
    <ElIcon v-if="!loading" class="btn-arrow">
      <ArrowRight />
    </ElIcon>
  </ElButton>
</template>

<style scoped lang="scss">
.auth-submit-btn {
  width: 100%;
  margin-top: 24px;
  height: 48px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border: none;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);
    background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);

    .btn-arrow {
      transform: translateX(3px);
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #3c4043;
    color: #5f6368;
  }

  .btn-arrow {
    margin-left: 8px;
    transition: transform 0.2s;
  }
}
</style>
