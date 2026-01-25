<script setup lang="ts">
/**
 * 404 页面未找到视图
 *
 * 当用户访问不存在的路由时显示此页面。
 *
 * 业务职责：
 * - 友好地告知用户页面不存在
 * - 提供返回首页的快捷入口
 * - 保持与整体设计风格一致
 *
 * 设计原则：
 * - 使用 Element Plus 的 ElResult 组件
 * - 使用 HTML5 语义化标签（main、article）
 * - 简洁明了的错误提示
 * - 深色主题，与整体设计风格一致
 *
 * 触发场景：
 * - 用户手动输入错误的 URL
 * - 页面被删除或移动
 * - 路由配置中未匹配到任何路由
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
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.error-view {
  min-height: 100vh;
  @include flex-center;
  background: $color-bg-primary;

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
        font-weight: $font-weight-semibold;
        color: var(--el-text-color-secondary);
        margin-top: 0;
      }

      :deep(.el-result__subtitle) {
        font-size: $font-size-base + 2;
        color: var(--el-text-color-placeholder);
      }

      :deep(.el-button) {
        background: $gradient-primary;
        border: none;
        border-radius: 10px;
        padding: $space-3 $space-6;

        .btn-icon {
          margin-right: $space-2;
        }
      }
    }
  }
}
</style>
