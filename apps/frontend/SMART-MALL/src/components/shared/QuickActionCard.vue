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
.action-card {
  cursor: pointer;
  border-radius: 12px;
  background: rgba(17, 17, 19, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(138, 180, 248, 0.3);

    .action-arrow {
      transform: translateX(4px);
      color: #8ab4f8;
    }
  }

  :deep(.el-card__body) {
    padding: 20px 24px;
  }

  .action-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    .action-text {
      flex: 1;
      min-width: 0;

      .action-title {
        font-size: 15px;
        font-weight: 500;
        margin: 0 0 4px 0;
        color: #e8eaed;
      }

      .action-desc {
        font-size: 13px;
        margin: 0;
        color: #9aa0a6;
      }
    }

    .action-arrow {
      flex-shrink: 0;
      color: #71717a;
      transition: all 0.2s;
    }
  }
}
</style>
