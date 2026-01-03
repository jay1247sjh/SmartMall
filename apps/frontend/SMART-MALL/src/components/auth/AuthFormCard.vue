<script setup lang="ts">
/**
 * 认证表单卡片组件
 * 提供统一的表单容器样式
 */
defineProps<{
  /** 表单标题 */
  title: string
  /** 表单描述 */
  description?: string
}>()
</script>

<template>
  <div class="auth-form-card">
    <div class="form-header">
      <h2>{{ title }}</h2>
      <p v-if="description">{{ description }}</p>
    </div>

    <div class="form-body">
      <slot></slot>
    </div>

    <!-- 底部内容插槽 -->
    <div v-if="$slots.footer" class="form-footer-slot">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.auth-form-card {
  width: 100%;
}

.form-header {
  text-align: center;
  margin-bottom: 28px;
}

.form-header h2 {
  font-size: 26px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0 0 8px 0;
}

.form-header p {
  font-size: 14px;
  color: #9aa0a6;
  margin: 0;
}

.form-body {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
}

.form-footer-slot {
  margin-top: 24px;
}
</style>
