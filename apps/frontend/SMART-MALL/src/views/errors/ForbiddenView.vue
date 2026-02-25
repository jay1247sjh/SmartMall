<script setup lang="ts">
/**
 * 403 无权限视图
 *
 * 当用户访问没有权限的页面时显示此页面。
 *
 * 业务职责：
 * - 友好地告知用户没有访问权限
 * - 提供返回上页和返回首页的快捷入口
 * - 保持与整体设计风格一致
 *
 * 设计原则：
 * - 使用 Element Plus 的 ElResult 组件
 * - 使用 HTML5 语义化标签（main、article）
 * - 红色主题表示错误/禁止
 * - 深色主题，与整体设计风格一致
 *
 * 触发场景：
 * - 普通用户访问管理员页面
 * - 商家访问其他商家的店铺配置
 * - 未登录用户访问需要登录的页面（通常会重定向到登录页）
 * - 路由守卫检测到权限不足
 */
import { useRouter } from 'vue-router'
import { ElResult, ElButton } from 'element-plus'
import { Back, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <main class="error-view">
    <article class="error-content">
      <ElResult
        icon="error"
        title="403"
        sub-title="抱歉，您没有权限访问此页面"
        class="error-result"
      >
        <template #extra>
          <div class="error-actions">
            <ElButton :icon="Back" @click="goBack">
              返回上页
            </ElButton>
            <ElButton type="primary" :icon="HomeFilled" @click="goHome">
              返回首页
            </ElButton>
          </div>
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
  background: var(--bg-primary);

  .error-content {
    text-align: center;

    .error-result {
      :deep(.el-result__icon > .el-icon) {
        font-size: 120px;
        line-height: 1;
        color: var(--el-color-danger);
      }

      :deep(.el-result__icon > .el-icon svg) {
        width: 1em;
        height: 1em;
      }

      :deep(.el-result__title) {
        font-size: 72px;
        font-weight: $font-weight-semibold;
        color: var(--el-color-danger-light-3);
        margin-top: 0;
      }

      :deep(.el-result__subtitle) {
        font-size: $font-size-base + 2;
        color: var(--el-text-color-placeholder);
      }

      :deep(.el-result__extra) {
        display: flex;
        justify-content: center;
        width: 100%;
      }

      :deep(.el-result__extra .el-button .el-icon) {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
        transform: none;
      }

      :deep(.el-result__extra .el-button .el-icon svg) {
        width: 1em;
        height: 1em;
        transform: none;
      }

      .error-actions {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: $space-4;
      }

      :deep(.el-button--primary) {
        background: $gradient-primary;
        border: none;
        border-radius: 10px;
      }

      :deep(.el-button) {
        border-radius: 10px;
        padding: $space-3 $space-6;
      }
    }
  }
}
</style>
