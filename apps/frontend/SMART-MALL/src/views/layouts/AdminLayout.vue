<script setup lang="ts">
/**
 * 管理员布局组件 - Gemini 风格
 */
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { cleanupOnLogout } from '@/router'

const userStore = useUserStore()
const router = useRouter()

const menuItems = [
  { path: '/admin/dashboard', label: '控制台' },
  { path: '/admin/mall', label: '商城管理' },
  { path: '/admin/area-approval', label: '区域审批' },
  { path: '/admin/layout-version', label: '版本管理' },
  { path: '/admin/builder', label: '商城建模' },
]

function handleLogout() {
  userStore.clearUser()
  cleanupOnLogout(router)
}
</script>

<template>
  <div class="admin-layout">
    <!-- 背景装饰 -->
    <div class="layout-bg">
      <div class="bg-gradient"></div>
    </div>

    <aside class="layout-sidebar">
      <div class="sidebar-header">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="header-text">管理中心</span>
      </div>
      <nav class="sidebar-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
        >
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/mall" class="menu-item back-link">
          <span>返回首页</span>
        </router-link>
      </div>
    </aside>
    <div class="layout-main">
      <header class="layout-header">
        <div class="breadcrumb">管理中心</div>
        <div class="user-actions">
          <span class="role-badge">ADMIN</span>
          <span class="username">{{ userStore.currentUser?.username }}</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
      </header>
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  background: #0a0a0a;
  color: #e8eaed;
  position: relative;
  overflow: hidden;
}

.layout-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(59, 130, 246, 0.04) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 30% 90%, rgba(168, 85, 247, 0.03) 0%, transparent 50%);
}

.layout-sidebar {
  width: 220px;
  background: rgba(17, 17, 19, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

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

.logo-icon svg {
  width: 18px;
  height: 18px;
}

.header-text {
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-menu {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #9aa0a6;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.15s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e8eaed;
}

.menu-item.router-link-active {
  background: rgba(138, 180, 248, 0.1);
  color: #8ab4f8;
}

.sidebar-footer {
  padding: 12px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.back-link:hover {
  background: rgba(255, 255, 255, 0.04);
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  min-height: 0;
  overflow: hidden;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  height: 60px;
  background: rgba(17, 17, 19, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.breadcrumb {
  font-size: 14px;
  color: #9aa0a6;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-badge {
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.username {
  font-size: 14px;
  color: #e8eaed;
}

.logout-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9aa0a6;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.logout-btn:hover {
  background: rgba(242, 139, 130, 0.1);
  border-color: rgba(242, 139, 130, 0.3);
  color: #f28b82;
}

.layout-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom Blue Scrollbar */
.layout-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.layout-content::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 4px;
}

.layout-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%);
  border-radius: 4px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.layout-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #60a5fa 0%, #93c5fd 50%, #bfdbfe 100%);
}

/* Firefox scrollbar */
.layout-content {
  scrollbar-width: thin;
  scrollbar-color: #60a5fa rgba(30, 41, 59, 0.5);
}
</style>
