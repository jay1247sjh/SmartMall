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
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { cleanupOnLogout } from '@/router'
import {
  ElContainer,
  ElAside,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElButton,
  ElIcon,
  ElTag,
} from 'element-plus'
import { Box, HomeFilled, Shop, Document, Tools, SwitchButton } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

const menuItems = [
  { path: '/merchant/dashboard', label: '工作台', icon: HomeFilled },
  { path: '/merchant/store-config', label: '店铺配置', icon: Shop },
  { path: '/merchant/area-apply', label: '区域申请', icon: Document },
  { path: '/merchant/builder', label: '建模工具', icon: Tools },
]

function handleLogout() {
  userStore.clearUser()
  cleanupOnLogout(router)
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
        <span class="header-text">商家中心</span>
      </header>

      <ElMenu
        :default-active="$route.path"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <ElMenuItem v-for="item in menuItems" :key="item.path" :index="item.path">
          <ElIcon><component :is="item.icon" /></ElIcon>
          <span>{{ item.label }}</span>
        </ElMenuItem>
      </ElMenu>

      <footer class="sidebar-footer">
        <ElButton text class="back-link" @click="router.push('/mall')">
          <ElIcon class="mr-1"><HomeFilled /></ElIcon>
          返回首页
        </ElButton>
      </footer>
    </ElAside>

    <ElContainer class="layout-main">
      <ElHeader class="layout-header">
        <span class="breadcrumb">商家中心</span>
        <nav class="user-actions">
          <ElTag effect="dark" size="small" class="role-badge">MERCHANT</ElTag>
          <span class="username">{{ userStore.currentUser?.username }}</span>
          <ElButton text @click="handleLogout">
            <ElIcon class="mr-1"><SwitchButton /></ElIcon>
            退出
          </ElButton>
        </nav>
      </ElHeader>

      <ElMain class="layout-content">
        <router-view />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.merchant-layout {
  min-height: 100vh;
  background: $color-bg-primary;
  color: $color-text-primary;
  position: relative;

  .layout-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(236, 72, 153, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 30% 90%, rgba(249, 115, 22, 0.03) 0%, transparent 50%);
  }

  .layout-sidebar {
    background: rgba($color-bg-secondary, 0.8);
    backdrop-filter: blur(20px);
    border-right: 1px solid $color-border-subtle;
    @include flex-column;
    position: relative;
    z-index: 10;

    .sidebar-header {
      @include flex-center-y;
      gap: $space-3;
      padding: $space-5 $space-4;
      border-bottom: 1px solid $color-border-subtle;

      .logo-icon {
        width: 36px;
        height: 36px;
        @include flex-center;
        background: linear-gradient(135deg, rgba($color-accent-pink, 0.15) 0%, rgba($color-accent-orange, 0.15) 100%);
        border: 1px solid $color-border-muted;
        border-radius: 10px;
        color: $color-accent-pink;
      }

      .header-text {
        font-size: $font-size-lg;
        font-weight: $font-weight-semibold;
        background: $gradient-merchant;
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
        color: $color-text-secondary;

        &:hover { background: $color-bg-hover; color: $color-text-primary; }
        &.is-active { background: rgba($color-accent-pink, 0.1); color: $color-accent-pink; }
      }
    }

    .sidebar-footer {
      padding: $space-3 $space-2;
      border-top: 1px solid $color-border-subtle;

      .back-link { width: 100%; justify-content: flex-start; color: $color-text-secondary; }
      .mr-1 { margin-right: $space-2; }
    }
  }

  .layout-main {
    flex-direction: column;
    position: relative;
    z-index: 1;

    .layout-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 60px;
      background: rgba($color-bg-secondary, 0.6);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid $color-border-subtle;

      .breadcrumb { font-size: $font-size-base; color: $color-text-secondary; }

      .user-actions {
        display: flex;
        align-items: center;
        gap: $space-4;

        .role-badge { background: $gradient-merchant; border: none; }
        .username { font-size: $font-size-base; color: $color-text-primary; }
        .mr-1 { margin-right: $space-1; }
      }
    }

    .layout-content {
      flex: 1;
      overflow-y: auto;
    }
  }
}
</style>
