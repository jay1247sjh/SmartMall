<script setup lang="ts">
/**
 * DashboardLayout - 仪表盘布局组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores'
import UserCard from '@/components/layouts/UserCard.vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import AiSidebar from '@/components/ai/AiSidebar.vue'
import {
  ElContainer,
  ElAside,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElButton,
  ElAvatar,
  ElIcon,
  ElTooltip,
} from 'element-plus'
import {
  House,
  Setting,
  Goods,
  User,
  ArrowLeft,
  ArrowRight,
  Back,
  Refresh,
  ChatDotRound,
} from '@element-plus/icons-vue'

interface Props {
  pageTitle: string
}

defineProps<Props>()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const sidebarCollapsed = ref(false)
const aiVisible = ref(false)

// 一级页面不显示返回键
const TOP_LEVEL_PATHS = ['/mall', '/mall/stores', '/']
const isTopLevel = computed(() => TOP_LEVEL_PATHS.includes(route.path))

function toggleAi() {
  aiVisible.value = !aiVisible.value
}

interface MenuItem {
  titleKey: string
  path: string
  icon: typeof House
  roles?: string[]
}

const menuConfig: MenuItem[] = [
  { titleKey: 'nav.mallHome', path: '/mall', icon: House },
  { titleKey: 'nav.storeProducts', path: '/mall/stores', icon: Goods, roles: ['USER'] },
  { titleKey: 'nav.adminCenter', path: '/admin/dashboard', icon: Setting, roles: ['ADMIN'] },
  { titleKey: 'nav.workspace', path: '/merchant/dashboard', icon: Goods, roles: ['MERCHANT'] },
  { titleKey: 'nav.profile', path: '/user/profile', icon: User },
]

const filteredMenuItems = computed(() => {
  const userRole = userStore.role
  return menuConfig.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return userRole ? item.roles.includes(userRole) : false
  })
})

function navigateTo(path: string) {
  router.push(path)
}

function goBack() {
  // 如果有浏览器历史记录则返回上一页，否则回到首页
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/mall')
  }
}

function refreshPage() {
  router.replace({ path: route.fullPath, query: { ...route.query, _t: Date.now() } })
    .then(() => router.go(0))
}

function handleLogout() {
  userStore.clearUser()
  router.push('/login')
}
</script>

<template>
  <ElContainer class="dashboard-layout">
    <!-- 侧边栏 -->
    <ElAside :width="sidebarCollapsed ? '64px' : '220px'" class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
      <header class="sidebar-header" :class="{ collapsed: sidebarCollapsed }">
        <div v-if="!sidebarCollapsed" class="logo" @click="navigateTo('/mall')">
          <ElAvatar :size="36" class="logo-icon">
            <span>S</span>
          </ElAvatar>
          <span class="logo-text">Smart Mall</span>
        </div>
        <ElButton
          :icon="sidebarCollapsed ? ArrowRight : ArrowLeft"
          circle
          size="small"
          class="collapse-btn"
          @click="sidebarCollapsed = !sidebarCollapsed"
        />
      </header>

      <nav class="sidebar-nav">
        <ElMenu
          :default-active="route.path"
          :collapse="sidebarCollapsed"
          :collapse-transition="false"
          background-color="transparent"
          :text-color="'var(--el-text-color-secondary)'"
          :active-text-color="'var(--el-color-primary)'"
        >
          <ElTooltip
            v-for="item in filteredMenuItems"
            :key="item.path"
            :content="t(item.titleKey)"
            :disabled="!sidebarCollapsed"
            placement="right"
          >
            <ElMenuItem :index="item.path" @click="navigateTo(item.path)">
              <ElIcon><component :is="item.icon" /></ElIcon>
              <template #title>{{ t(item.titleKey) }}</template>
            </ElMenuItem>
          </ElTooltip>
        </ElMenu>
      </nav>

      <footer class="sidebar-footer">
        <UserCard show-logout @logout="handleLogout" />
      </footer>
    </ElAside>

    <!-- 主内容区 -->
    <ElContainer direction="vertical" class="main-container">
      <ElHeader class="topbar" height="64px">
        <div class="topbar-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="topbar-right">
          <ElTooltip v-if="!isTopLevel" :content="t('common.back')" placement="bottom">
            <ElButton :icon="Back" circle size="small" @click="goBack" />
          </ElTooltip>
          <ElTooltip :content="t('common.refresh')" placement="bottom">
            <ElButton :icon="Refresh" circle size="small" @click="refreshPage" />
          </ElTooltip>
          <button class="btn-ai-trigger" :class="{ active: aiVisible }" @click="toggleAi">
            <ElIcon :size="18"><ChatDotRound /></ElIcon>
          </button>
          <SettingsPanel trigger-mode="avatar" :avatar-size="32" show-logout @logout="handleLogout" />
        </div>
      </ElHeader>

      <ElMain class="content">
        <div class="content-body">
          <slot />
        </div>
        <AiSidebar v-model:visible="aiVisible" />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.dashboard-layout {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(var(--accent-primary-rgb), 0.04) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 30% 90%, rgba(168, 85, 247, 0.03) 0%, transparent 50%);
  }
}

.sidebar {
  background: rgba(var(--bg-secondary-rgb), 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: width $duration-normal;
  position: relative;
  z-index: 10;
  overflow: hidden;

  &--collapsed {
    .sidebar-nav {
      overflow: hidden;
    }

    :deep(.el-menu--collapse) {
      width: 100%;
    }
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-4;
    border-bottom: 1px solid var(--border-subtle);
    gap: $space-2;
    min-height: 68px;

    &.collapsed {
      justify-content: center;
      padding: $space-4 $space-3;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: $space-3;
      cursor: pointer;
      padding: $space-1;
      border-radius: $radius-md;
      transition: background $duration-normal;
      overflow: hidden;
      flex: 1;
      min-width: 0;

      &:hover {
        background: rgba(var(--text-primary-rgb), 0.04);
      }

      .logo-icon {
        background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
        border: 1px solid var(--border-muted);
        flex-shrink: 0;
      }

      .logo-text {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        background: linear-gradient(135deg, var(--accent-primary) 0%, rgba(168, 85, 247, 0.8) 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        white-space: nowrap;
      }
    }

    .collapse-btn {
      flex-shrink: 0;
      color: var(--text-secondary);
      border-color: var(--border-muted);
      background: transparent;
      z-index: 10;

      &:hover {
        background: var(--border-muted);
        color: var(--text-primary);
        border-color: rgba(var(--white-rgb), 0.2);
      }
    }
  }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: $space-2;

    :deep(.el-menu) {
      border-right: none;
      background: transparent;
    }

    :deep(.el-menu-item) {
      border-radius: $radius-md;
      margin-bottom: $space-1;
      color: var(--text-secondary);

      &:hover {
        background: rgba(var(--text-primary-rgb), 0.04);
        color: var(--text-primary);
      }

      &.is-active {
        background: rgba(var(--accent-primary-rgb), 0.1);
        color: var(--accent-primary);
      }
    }
  }

  .sidebar-footer {
    padding: $space-2;
    border-top: 1px solid var(--border-subtle);
  }
}

.main-container {
  min-width: 0;
  position: relative;
  z-index: 1;

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 $space-6;
    background: rgba(var(--bg-secondary-rgb), 0.6);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-subtle);

    .topbar-left {
      display: flex;
      align-items: center;
      gap: $space-3;

      .page-title {
        font-size: $font-size-xl;
        font-weight: $font-weight-medium;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: $space-2;

      .btn-ai-trigger {
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid var(--border-subtle);
        border-radius: $radius-md;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all $duration-normal;

        &:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        &.active {
          background: rgba(var(--accent-primary-rgb), 0.1);
          border-color: rgba(var(--accent-primary-rgb), 0.3);
          color: var(--accent-primary);
        }
      }
    }
  }

  .content {
    display: flex;
    padding: 0;
    overflow: hidden;

    .content-body {
      flex: 1;
      min-width: 0;
      padding: $space-6;
      overflow-y: auto;
    }
  }
}

@media (max-width: 768px) {
  .main-container {
    .content {
      padding: $space-4;
    }
  }
}
</style>
