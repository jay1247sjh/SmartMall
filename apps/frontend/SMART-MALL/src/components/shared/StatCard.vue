<script setup lang="ts">
/**
 * StatCard - 统计卡片组件
 * 用于展示数值统计信息 - Gemini 风格
 */

interface Props {
  value: string | number
  label: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

defineProps<Props>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-content">
      <span class="stat-value">{{ value }}</span>
      <span class="stat-label">{{ label }}</span>
    </div>
    <div v-if="trend" class="stat-trend" :class="trend.direction">
      <svg v-if="trend.direction === 'up'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 17l5-5 5 5" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 7l5 5 5-5" />
      </svg>
      <span>{{ trend.value }}%</span>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.2s;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.12);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-value {
  font-size: 32px;
  font-weight: 500;
  color: #e8eaed;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 13px;
  color: #9aa0a6;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: 8px;
}

.stat-trend svg {
  width: 14px;
  height: 14px;
}

.stat-trend.up {
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
}

.stat-trend.down {
  color: #f28b82;
  background: rgba(242, 139, 130, 0.1);
}
</style>
