<script setup lang="ts">
/**
 * StatCard - 统计卡片组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ElCard, ElStatistic, ElIcon, ElTag } from 'element-plus'
import { Top, Bottom } from '@element-plus/icons-vue'

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
  <ElCard shadow="hover" class="stat-card">
    <article class="stat-content">
      <ElStatistic :title="label" :value="value" class="stat-statistic" />
      <ElTag
        v-if="trend"
        :type="trend.direction === 'up' ? 'success' : 'danger'"
        size="small"
        class="stat-trend"
      >
        <ElIcon :size="12">
          <Top v-if="trend.direction === 'up'" />
          <Bottom v-else />
        </ElIcon>
        <span>{{ trend.value }}%</span>
      </ElTag>
    </article>
  </ElCard>
</template>

<style scoped lang="scss">
.stat-card {
  border-radius: 12px;
  background: rgba(17, 17, 19, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(138, 180, 248, 0.3);
  }

  :deep(.el-card__body) {
    padding: 20px 24px;
  }

  .stat-content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    .stat-statistic {
      :deep(.el-statistic__head) {
        font-size: 13px;
        color: #9aa0a6;
        margin-bottom: 8px;
      }

      :deep(.el-statistic__content) {
        font-size: 28px;
        font-weight: 500;
        color: #e8eaed;
      }
    }

    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border-radius: 6px;
    }
  }
}
</style>
