<script setup lang="ts">
/**
 * 主布局组件
 *
 * 这是普通用户的整体布局框架，包含顶部导航栏。
 *
 * 业务职责：
 * - 提供用户端的统一布局结构
 * - 顶部导航：Logo、商城入口、个人中心
 * - 用户信息：显示当前用户名和退出按钮
 * - 路由出口：渲染子路由对应的视图
 *
 * 设计原则：
 * - 使用 Element Plus 布局组件（ElContainer、ElHeader、ElMain）
 * - 使用 HTML5 语义化标签（nav）
 * - 深色主题，与整体设计风格一致
 * - 简洁的顶部导航，不占用过多空间
 *
 * 布局结构：
 * ┌─────────────────────────────────────┐
 * │  Logo  │  商城  │  个人中心  │ 用户  │
 * ├─────────────────────────────────────┤
 * │                                     │
 * │           主内容区                   │
 * │        （router-view）              │
 * │                                     │
 * └─────────────────────────────────────┘
 *
 * 用户角色：
 * - 所有已登录用户可访问
 */
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { cleanupOnLogout } from '@/router'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import {
  ElContainer,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElIcon,
} from 'element-plus'
import { Box } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const { t } = useI18n()

function handleLogout() {
  userStore.clearUser()
  cleanupOnLogout(router)
}

function handleMenuSelect(path: string) {
  router.push(path)
}
</script>

<template>
  <ElContainer class="main-layout" direction="vertical">
    <div class="layout-bg"></div>

    <ElHeader class="layout-header">
      <nav class="header-left">
        <router-link to="/mall" class="logo">
          <ElIcon :size="18" class="logo-icon"><Box /></ElIcon>
          <span class="logo-text">Smart Mall</span>
        </router-link>

        <ElMenu
          :default-active="$route.path"
          mode="horizontal"
          class="nav-menu"
          @select="handleMenuSelect"
        >
          <ElMenuItem index="/mall">{{ t('nav.mall') }}</ElMenuItem>
          <ElMenuItem index="/user/profile">{{ t('nav.profile') }}</ElMenuItem>
        </ElMenu>
      </nav>

      <nav class="user-actions">
        <span class="username">{{ userStore.currentUser?.username }}</span>
        <SettingsPanel show-logout @logout="handleLogout" />
      </nav>
    </ElHeader>

    <ElMain class="layout-content">
      <router-view />
    </ElMain>
  </ElContainer>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.main-layout {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;

  .layout-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 30% 90%, rgba(168, 85, 247, 0.03) 0%, transparent 50%);
  }

  .layout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    background: rgba(var(--bg-secondary-rgb), 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);
    position: relative;
    z-index: 10;

    .header-left {
      @include flex-center-y;
      gap: 48px;

      .logo {
        @include flex-center-y;
        gap: $space-3;
        text-decoration: none;

        .logo-icon {
          width: 36px;
          height: 36px;
          @include flex-center;
          background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
          border: 1px solid var(--border-muted);
          border-radius: 10px;
          color: var(--accent-primary);
        }

        .logo-text {
          font-size: $font-size-base + 2;
          font-weight: $font-weight-semibold;
          background: linear-gradient(135deg, var(--accent-primary), rgba(168, 85, 247, 0.8));
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }

      .nav-menu {
        border: none;
        background: transparent;

        :deep(.el-menu-item) {
          height: 60px;
          line-height: 60px;
          border-bottom: none;
          color: var(--text-secondary);

          &:hover { background: transparent; color: var(--text-primary); }
          &.is-active { background: transparent; color: var(--accent-primary); border-bottom: 2px solid var(--accent-primary); }
        }
      }
    }

    .user-actions {
      @include flex-center-y;
      gap: $space-4;

      .username { font-size: $font-size-base; color: var(--text-primary); }
      .mr-1 { margin-right: $space-1; }
    }
  }

  .layout-content {
    flex: 1;
    position: relative;
    z-index: 1;
    padding: 0;
  }
}
</style>
