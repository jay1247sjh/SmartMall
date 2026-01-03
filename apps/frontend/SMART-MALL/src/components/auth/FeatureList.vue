<script setup lang="ts">
/**
 * 功能列表组件
 * 用于品牌面板展示功能特点
 */
defineProps<{
  /** 功能列表 */
  features: string[]
}>()
</script>

<template>
  <div class="feature-list">
    <div v-for="(feature, index) in features" :key="index" class="feature-item">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span>{{ feature }}</span>
    </div>
  </div>
</template>

<style scoped>
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #bdc1c6;
  font-size: 14px;
}

.feature-item svg {
  width: 20px;
  height: 20px;
  color: #81c995;
  flex-shrink: 0;
}
</style>
