<script setup lang="ts">
/**
 * 404 页面
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { useRouter } from 'vue-router'
import { ElResult, ElButton, ElIcon } from 'element-plus'
import { HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <main class="error-view">
    <article class="error-content">
      <ElResult
        icon="warning"
        title="404"
        sub-title="页面不存在"
        class="error-result"
      >
        <template #extra>
          <ElButton type="primary" @click="goHome">
            <ElIcon class="btn-icon"><HomeFilled /></ElIcon>
            返回首页
          </ElButton>
        </template>
      </ElResult>
    </article>
  </main>
</template>

<style scoped lang="scss">
.error-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;

  .error-content {
    text-align: center;

    .error-result {
      :deep(.el-result__icon) {
        svg {
          width: 120px;
          height: 120px;
          color: var(--el-color-warning);
        }
      }

      :deep(.el-result__title) {
        font-size: 72px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
        margin-top: 0;
      }

      :deep(.el-result__subtitle) {
        font-size: 16px;
        color: var(--el-text-color-placeholder);
      }

      :deep(.el-button) {
        background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
        border: none;
        border-radius: 10px;
        padding: 12px 24px;

        .btn-icon {
          margin-right: 8px;
        }
      }
    }
  }
}
</style>
