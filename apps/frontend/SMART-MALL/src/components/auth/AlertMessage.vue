<script setup lang="ts">
/**
 * 提示消息组件
 * 支持错误、成功、警告类型
 */
defineProps<{
  /** 消息类型 */
  type: 'error' | 'success' | 'warning'
  /** 消息内容 */
  message: string
}>()
</script>

<template>
  <div class="alert-message" :class="type">
    <!-- Error Icon -->
    <svg v-if="type === 'error'" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <!-- Success Icon -->
    <svg v-else-if="type === 'success'" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <!-- Warning Icon -->
    <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L1 14h14L8 1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M8 6v4M8 12v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span>{{ message }}</span>
  </div>
</template>

<style scoped>
.alert-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  margin: 20px 0 0 0;
  font-size: 13px;
}

.alert-message.error {
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.2);
  color: #f28b82;
}

.alert-message.success {
  background: rgba(129, 201, 149, 0.1);
  border: 1px solid rgba(129, 201, 149, 0.2);
  color: #81c995;
}

.alert-message.warning {
  background: rgba(253, 186, 116, 0.1);
  border: 1px solid rgba(253, 186, 116, 0.2);
  color: #fdba74;
}
</style>
