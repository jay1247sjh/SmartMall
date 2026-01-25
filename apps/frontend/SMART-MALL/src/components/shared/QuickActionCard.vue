<script setup lang="ts">
/**
 * QuickActionCard - 快捷入口卡片组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { useRouter } from 'vue-router'
import { ElCard, ElIcon } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'

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
  <ElCard shadow="hover" class="action-card" @click="handleClick">
    <article class="action-content">
      <hgroup class="action-text">
        <h4 class="action-title">{{ title }}</h4>
        <p class="action-desc">{{ description }}</p>
      </hgroup>
      <ElIcon class="action-arrow" :size="20">
        <ArrowRight />
      </ElIcon>
    </article>
  </ElCard>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.action-card {
  cursor: pointer;
  @include card-base;
  border-radius: $radius-lg;
  background: rgba($color-bg-secondary, 0.8);
  transition: transform $duration-normal, border-color $duration-normal;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($color-primary, 0.3);

    .action-arrow {
      transform: translateX($space-1);
      color: $color-primary;
    }
  }

  :deep(.el-card__body) {
    padding: $space-5 $space-6;
  }

  .action-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;

    .action-text {
      flex: 1;
      min-width: 0;

      .action-title {
        font-size: $font-size-lg;
        font-weight: $font-weight-medium;
        margin: 0 0 $space-1 0;
        color: $color-text-primary;
      }

      .action-desc {
        font-size: $font-size-sm + 1;
        margin: 0;
        color: $color-text-secondary;
      }
    }

    .action-arrow {
      flex-shrink: 0;
      color: $color-text-disabled;
      transition: all $duration-normal;
    }
  }
}
</style>
