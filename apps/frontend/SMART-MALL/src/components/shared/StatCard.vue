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
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.stat-card {
  @include card-base;
  border-radius: $radius-lg;
  background: rgba($color-bg-secondary, 0.8);
  transition: transform $duration-slow $ease-default, border-color $duration-slow $ease-default;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($color-accent-blue, 0.3);
  }

  :deep(.el-card__body) {
    padding: $space-5 $space-6;
  }

  .stat-content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    .stat-statistic {
      :deep(.el-statistic__head) {
        font-size: $font-size-sm;
        color: $color-text-secondary;
        margin-bottom: $space-2;
      }

      :deep(.el-statistic__content) {
        font-size: 28px;
        font-weight: $font-weight-medium;
        color: $color-text-primary;
      }
    }

    .stat-trend {
      display: inline-flex;
      align-items: center;
      gap: $space-1;
      border-radius: $radius-sm + 2;
    }
  }
}
</style>
