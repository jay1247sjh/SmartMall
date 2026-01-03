<script setup lang="ts">
/**
 * 认证表单卡片组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ElCard } from 'element-plus'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <article class="auth-form-card">
    <header class="form-header">
      <hgroup>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </hgroup>
    </header>

    <ElCard shadow="never" class="form-body">
      <slot></slot>
    </ElCard>

    <footer v-if="$slots.footer" class="form-footer-slot">
      <slot name="footer"></slot>
    </footer>
  </article>
</template>

<style scoped lang="scss">
.auth-form-card {
  width: 100%;

  .form-header {
    text-align: center;
    margin-bottom: 28px;

    hgroup {
      h2 {
        font-size: 26px;
        font-weight: 500;
        color: #e8eaed;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: #9aa0a6;
        margin: 0;
      }
    }
  }

  .form-body {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;

    :deep(.el-card__body) {
      padding: 28px;
    }
  }

  .form-footer-slot {
    margin-top: 24px;
  }
}
</style>
