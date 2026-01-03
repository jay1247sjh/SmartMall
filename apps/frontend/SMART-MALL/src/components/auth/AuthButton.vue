<script setup lang="ts">
/**
 * 认证表单按钮组件
 * 带加载状态和箭头动画的主按钮
 */
defineProps<{
  /** 按钮文字 */
  text: string
  /** 加载中文字 */
  loadingText?: string
  /** 是否加载中 */
  loading?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 按钮类型 */
  type?: 'submit' | 'button'
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button 
    :type="type || 'submit'" 
    class="btn-submit" 
    :disabled="loading || disabled"
    @click="$emit('click')"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <span>{{ loading ? (loadingText || '处理中...') : text }}</span>
    <svg v-if="!loading" class="btn-arrow" viewBox="0 0 20 20" fill="none">
      <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</template>

<style scoped>
.btn-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  background: #3c4043;
  color: #5f6368;
  cursor: not-allowed;
}

.btn-arrow {
  width: 18px;
  height: 18px;
  transition: transform 0.2s;
}

.btn-submit:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
