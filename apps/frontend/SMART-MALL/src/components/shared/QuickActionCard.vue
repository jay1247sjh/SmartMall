<script setup lang="ts">
/**
 * QuickActionCard - 快捷入口卡片组件
 * 用于展示快捷操作入口 - Gemini 风格
 */
import { useRouter } from 'vue-router'

interface Props {
  title: string
  description: string
  path: string
}

const props = defineProps<Props>()
const router = useRouter()

function handleClick() {
  router.push(props.path)
}
</script>

<template>
  <button class="action-card" @click="handleClick">
    <div class="action-content">
      <span class="action-title">{{ title }}</span>
      <span class="action-desc">{{ description }}</span>
    </div>
    <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</template>

<style scoped>
.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
  color: inherit;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.action-title {
  font-size: 15px;
  font-weight: 500;
  color: #e8eaed;
}

.action-desc {
  font-size: 13px;
  color: #9aa0a6;
}

.action-arrow {
  width: 20px;
  height: 20px;
  color: #5f6368;
  flex-shrink: 0;
  transition: all 0.2s;
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
  color: #8ab4f8;
}
</style>
