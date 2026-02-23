<script setup lang="ts">
/**
 * 商家布局组件
 *
 * 这是商家后台的整体布局框架，包含侧边栏导航和顶部栏。
 *
 * 业务职责：
 * - 提供商家后台的统一布局结构
 * - 侧边栏导航：工作台、店铺配置、区域申请、建模工具
 * - 顶部栏：显示当前用户信息和退出按钮
 * - 路由出口：渲染子路由对应的视图
 *
 * 设计原则：
 * - 使用 Element Plus 布局组件（ElContainer、ElAside、ElHeader、ElMain）
 * - 使用 HTML5 语义化标签（header、nav、footer）
 * - 粉橙色主题，与管理员后台区分
 * - 毛玻璃效果（backdrop-filter: blur）
 *
 * 布局结构：
 * ┌─────────────────────────────────────┐
 * │  侧边栏    │      顶部导航栏         │
 * │  - 工作台  ├──────────────────────────┤
 * │  - 店铺配置│                          │
 * │  - 区域申请│       主内容区           │
 * │  - 建模工具│    （router-view）       │
 * │  ─────────│                          │
 * │  返回首页  │                          │
 * └───────────┴──────────────────────────┘
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可访问
 * - 路由守卫会验证用户角色
 */
import { ref } from 'vue'
import { useUserStore } from '@/stores'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { cleanupOnLogout } from '@/router'
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
  ElIcon,
  ElButton,
  ElTooltip,
} from 'element-plus'
import { Box, HomeFilled, Shop, Document, Tools, ChatDotRound, Back, RefreshRight } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const aiVisible = ref(false)

function toggleAi() {
  aiVisible.value = !aiVisible.value
}

const menuItems = [
  { path: '/merchant/dashboard', labelKey: 'nav.workspace', icon: HomeFilled },
  { path: '/merchant/store-config', labelKey: 'nav.storeConfig', icon: Shop },
  { path: '/merchant/area-apply', labelKey: 'nav.areaApply', icon: Document },
  { path: '/merchant/builder', labelKey: 'nav.builderTool', icon: Tools },
]

function handleLogout() {
  userStore.clearUser()
  cleanupOnLogout(router)
}

function goBack() {
  router.push('/mall')
}

function refreshPage() {
  router.go(0)
}

function handleMenuSelect(path: string) {
  router.push(path)
}
</script>

<template>
  <ElContainer class="merchant-layout">
    <div class="layout-bg"></div>

    <ElAside width="220px" class="layout-sidebar">
      <header class="sidebar-header">
        <ElIcon :size="18" class="logo-icon"><Box /></ElIcon>
        <span class="header-text">{{ t('nav.merchantCenter') }}</span>
      </header>

      <ElMenu
        :default-active="$route.path"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <ElMenuItem v-for="item in menuItems" :key="item.path" :index="item.path">
          <ElIcon><component :is="item.icon" /></ElIcon>
          <span>{{ t(item.labelKey) }}</span>
        </ElMenuItem>
      </ElMenu>

      <footer class="sidebar-footer">
        <UserCard show-logout @logout="handleLogout" />
      </footer>
    </ElAside>

    <ElContainer class="layout-main">
      <ElHeader class="layout-header">
        <div class="topbar-left">
          <span class="breadcrumb">{{ t('nav.merchantCenter') }}</span>
        </div>
        <nav class="topbar-actions">
          <ElTooltip :content="t('common.back')" placement="bottom">
            <ElButton :icon="Back" circle size="small" class="topbar-btn" @click="goBack" />
          </ElTooltip>
          <ElTooltip :content="t('common.refresh')" placement="bottom">
            <ElButton :icon="RefreshRight" circle size="small" class="topbar-btn" @click="refreshPage" />
          </ElTooltip>
          <button class="btn-ai-trigger" :class="{ active: aiVisible }" @click="toggleAi">
            <ElIcon :size="18"><ChatDotRound /></ElIcon>
          </button>
          <SettingsPanel trigger-mode="avatar" :avatar-size="32" show-logout @logout="handleLogout" />
        </nav>
      </ElHeader>

      <div class="layout-body">
        <ElMain class="layout-content">
          <router-view />
        </ElMain>
        <AiSidebar v-model:visible="aiVisible" />
      </div>
    </ElContainer>
  </ElContainer>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.merchant-layout {
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
    background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(236, 72, 153, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 30% 90%, rgba(249, 115, 22, 0.03) 0%, transparent 50%);
  }

  .layout-sidebar {
    background: rgba(var(--bg-secondary-rgb), 0.8);
    backdrop-filter: blur(20px);
    border-right: 1px solid var(--border-subtle);
    @include flex-column;
    position: relative;
    z-index: 10;

    .sidebar-header {
      @include flex-center-y;
      gap: $space-3;
      padding: $space-5 $space-4;
      border-bottom: 1px solid var(--border-subtle);

      .logo-icon {
        width: 36px;
        height: 36px;
        @include flex-center;
        background: linear-gradient(135deg, rgba(244, 114, 182, 0.15) 0%, rgba(251, 146, 60, 0.15) 100%);
        border: 1px solid var(--border-muted);
        border-radius: 10px;
        color: #f472b6;
      }

      .header-text {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .sidebar-menu {
      flex: 1;
      border: none;
      background: transparent;
      padding: $space-3 $space-2;

      :deep(.el-menu-item) {
        height: 44px;
        line-height: 44px;
        margin-bottom: 2px;
        border-radius: $radius-md;
        color: var(--text-secondary);

        &:hover { background: rgba(var(--text-primary-rgb), 0.04); color: var(--text-primary); }
        &.is-active { background: rgba(244, 114, 182, 0.1); color: #f472b6; }
      }
    }

    .sidebar-footer {
      padding: $space-3 $space-2;
      border-top: 1px solid var(--border-subtle);
    }
  }

  .layout-main {
    flex-direction: column;
    position: relative;
    z-index: 1;
    min-height: 0;
    overflow: hidden;

    .layout-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 60px;
      flex-shrink: 0;
      background: rgba(var(--bg-secondary-rgb), 0.6);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);

      .topbar-left {
        display: flex;
        align-items: center;
        gap: $space-3;
      }

      .breadcrumb { font-size: $font-size-base; color: var(--text-secondary); }

      .topbar-btn {
        background: transparent;
        border-color: var(--border-subtle);
        color: var(--text-secondary);

        &:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--border-muted);
        }
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: $space-3;

        .btn-ai-trigger {
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: $radius-md;
          color: var(--text-secondary);
          @include flex-center;
          @include clickable;

          &:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
          }

          &.active {
            background: rgba(244, 114, 182, 0.1);
            border-color: rgba(244, 114, 182, 0.3);
            color: #f472b6;
          }
        }
      }
    }

    .layout-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .layout-content {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-width: thin;
      @include scrollbar-themed;
    }
  }
}
</style>
