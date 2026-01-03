<script setup lang="ts">
/**
 * 功能列表组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ElIcon } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'

defineProps<{
  features: string[]
}>()
</script>

<template>
  <ul class="feature-list" role="list">
    <li v-for="(feature, index) in features" :key="index" class="feature-item">
      <ElIcon :size="20" class="feature-icon">
        <CircleCheck />
      </ElIcon>
      <span>{{ feature }}</span>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  list-style: none;
  padding: 0;
  margin: 0;

  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #bdc1c6;
    font-size: 14px;

    .feature-icon {
      color: #81c995;
      flex-shrink: 0;
    }
  }
}
</style>
