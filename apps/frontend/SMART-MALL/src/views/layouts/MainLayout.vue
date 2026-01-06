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
import { cleanupOnLogout } from '@/router'
import {
  ElContainer,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElButton,
  ElIcon,
} from 'element-plus'
import { Box, SwitchButton } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()

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
          <ElMenuItem index="/mall">商城</ElMenuItem>
          <ElMenuItem index="/user/profile">个人中心</ElMenuItem>
        </ElMenu>
      </nav>

      <nav class="user-actions">
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
</template>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
  background: #0a0a0a;
  color: #e8eaed;
  position: relative;

  .layout-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(59, 130, 246, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 30% 90%, rgba(168, 85, 247, 0.03) 0%, transparent 50%);
  }

  .layout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    background: rgba(17, 17, 19, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    z-index: 10;

    .header-left {
      display: flex;
      align-items: center;
      gap: 48px;

      .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;

        .logo-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #8ab4f8;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
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
          color: #9aa0a6;

          &:hover { background: transparent; color: #e8eaed; }
          &.is-active { background: transparent; color: #8ab4f8; border-bottom: 2px solid #8ab4f8; }
        }
      }
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 16px;

      .username { font-size: 14px; color: #e8eaed; }
      .mr-1 { margin-right: 4px; }
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
