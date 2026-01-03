<script setup lang="ts">
/**
 * 商家布局组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
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
.merchant-layout {
  min-height: 100vh;
  background: #0a0a0a;
  color: #e8eaed;
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
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .logo-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #f472b6;
      }

      .header-text {
        font-size: 15px;
        font-weight: 600;
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
      padding: 12px 8px;

      :deep(.el-menu-item) {
        height: 44px;
        line-height: 44px;
        margin-bottom: 2px;
        border-radius: 8px;
        color: #9aa0a6;

        &:hover { background: rgba(255, 255, 255, 0.04); color: #e8eaed; }
        &.is-active { background: rgba(244, 114, 182, 0.1); color: #f472b6; }
      }
    }

    .sidebar-footer {
      padding: 12px 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);

      .back-link { width: 100%; justify-content: flex-start; color: #9aa0a6; }
      .mr-1 { margin-right: 8px; }
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
      background: rgba(17, 17, 19, 0.6);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      .breadcrumb { font-size: 14px; color: #9aa0a6; }

      .user-actions {
        display: flex;
        align-items: center;
        gap: 16px;

        .role-badge { background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%); border: none; }
        .username { font-size: 14px; color: #e8eaed; }
        .mr-1 { margin-right: 4px; }
      }
    }

    .layout-content {
      flex: 1;
      overflow-y: auto;
    }
  }
}
</style>
