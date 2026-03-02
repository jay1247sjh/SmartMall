<script setup lang="ts">
import type { Component } from 'vue'
import {
  Bell,
  Box,
  Document,
  HomeFilled,
  User,
  View,
} from '@element-plus/icons-vue'
import {
  ElContainer,
  ElHeader,
  ElIcon,
  ElMain,
  ElMenu,
  ElMenuItem,
} from 'element-plus'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import { cleanupOnLogout } from '@/router'
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

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

interface NavItem {
  key: string
  labelKey: string
  icon: Component
  to: string
  roles?: Array<'ADMIN' | 'MERCHANT' | 'USER'>
}

const navItems: NavItem[] = [
  { key: '/mall', labelKey: 'nav.mall', icon: HomeFilled, to: '/mall' },
  { key: '/mall/3d', labelKey: 'nav.mall3d', icon: View, to: '/mall/3d' },
  {
    key: '/mall/stores',
    labelKey: 'nav.storeProducts',
    icon: Document,
    to: '/mall/stores',
    roles: ['USER'],
  },
  { key: '/user/profile', labelKey: 'nav.profile', icon: User, to: '/user/profile' },
  {
    key: '/user/profile?tab=notices',
    labelKey: 'nav.messages',
    icon: Bell,
    to: '/user/profile?tab=notices',
  },
]

const currentRole = computed(() => userStore.currentUser?.userType || 'USER')

const visibleNavItems = computed(() =>
  navItems.filter(item => !item.roles || item.roles.includes(currentRole.value as 'ADMIN' | 'MERCHANT' | 'USER')),
)

const activeMenuIndex = computed(() => {
  if (route.path === '/user/profile' && route.query.tab === 'notices') {
    return '/user/profile?tab=notices'
  }
  if (route.path.startsWith('/user/profile')) {
    return '/user/profile'
  }
  if (route.path.startsWith('/mall/stores')) {
    return '/mall/stores'
  }
  if (route.path.startsWith('/mall/3d')) {
    return '/mall/3d'
  }
  return '/mall'
})

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
    <div class="layout-bg" />

    <ElHeader class="layout-header">
      <nav class="header-left">
        <router-link to="/mall" class="logo">
          <ElIcon :size="18" class="logo-icon">
            <Box />
          </ElIcon>
          <span class="logo-text">Smart Mall</span>
        </router-link>

        <div class="nav-menu-wrap">
          <ElMenu
            :default-active="activeMenuIndex"
            :ellipsis="false"
            mode="horizontal"
            class="nav-menu"
            @select="handleMenuSelect"
          >
            <ElMenuItem v-for="item in visibleNavItems" :key="item.key" :index="item.key">
              <ElIcon class="nav-item-icon">
                <component :is="item.icon" />
              </ElIcon>
              <span>{{ t(item.labelKey) }}</span>
            </ElMenuItem>
          </ElMenu>
        </div>
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
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
  overflow: hidden;

  .layout-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      radial-gradient(ellipse 50% 30% at 70% 10%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 50%),
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
        min-width: max-content;

        :deep(.el-menu-item) {
          height: 60px;
          line-height: 60px;
          border-bottom: none;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          gap: $space-2;

          &:hover {
            background: transparent;
            color: var(--text-primary);
          }
          &.is-active {
            background: transparent;
            color: var(--accent-primary);
            border-bottom: 2px solid var(--accent-primary);
          }
        }

        .nav-item-icon {
          font-size: 14px;
        }
      }

      .nav-menu-wrap {
        max-width: min(900px, calc(100vw - 420px));
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
        @include scrollbar-themed;
      }
    }

    .user-actions {
      @include flex-center-y;
      gap: $space-4;

      .username {
        font-size: $font-size-base;
        color: var(--text-primary);
      }
      .mr-1 {
        margin-right: $space-1;
      }
    }
  }

  .layout-content {
    flex: 1;
    min-height: 0;
    position: relative;
    z-index: 1;
    padding: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    @include scrollbar-themed;
  }

  @media (max-width: 860px) {
    .layout-header {
      .header-left {
        gap: $space-4;

        .nav-menu-wrap {
          max-width: min(620px, calc(100vw - 250px));
        }
      }

      .user-actions {
        .username {
          display: none;
        }
      }
    }
  }
}
</style>
