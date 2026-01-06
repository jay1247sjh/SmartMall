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
import { ElResult, ElButton, ElIcon, ElSpace } from 'element-plus'
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
          <ElSpace>
            <ElButton @click="goBack">
              <ElIcon class="btn-icon"><Back /></ElIcon>
              返回上页
            </ElButton>
            <ElButton type="primary" @click="goHome">
              <ElIcon class="btn-icon"><HomeFilled /></ElIcon>
              返回首页
            </ElButton>
          </ElSpace>
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
          color: var(--el-color-danger);
        }
      }

      :deep(.el-result__title) {
        font-size: 72px;
        font-weight: 600;
        color: var(--el-color-danger-light-3);
        margin-top: 0;
      }

      :deep(.el-result__subtitle) {
        font-size: 16px;
        color: var(--el-text-color-placeholder);
      }

      :deep(.el-button--primary) {
        background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
        border: none;
        border-radius: 10px;
      }

      :deep(.el-button) {
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
