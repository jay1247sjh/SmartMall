<script setup lang="ts">
/**
 * 管理员布局组件
 */
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { cleanupOnLogout } from '@/router'

const userStore = useUserStore()
const router = useRouter()

const menuItems = [
  { path: '/admin/dashboard', label: '控制台', icon: '📊' },
  { path: '/admin/mall', label: '商城管理', icon: '🏬' },
  { path: '/admin/area-approval', label: '区域审批', icon: '✅' },
  { path: '/admin/layout-version', label: '版本管理', icon: '📋' },
]

function handleLogout() {
  userStore.clearUser()
  cleanupOnLogout(router)
}
</script>

<template>
  <div class="admin-layout">
    <aside class="layout-sidebar">
      <div class="sidebar-header">
        <span>🛠️ 管理中心</span>
      </div>
      <nav class="sidebar-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
        >
          <span class="icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <div class="layout-main">
      <header class="layout-header">
        <div class="breadcrumb">管理中心</div>
        <div class="user-actions">
          <span class="role-badge">ADMIN</span>
          <span>{{ userStore.currentUser?.username }}</span>
          <button @click="handleLogout">退出</button>
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
  min-height: 100vh;
  display: flex;
}

.layout-sidebar {
  width: 220px;
  background: #1a1a2e;
  color: white;
}

.sidebar-header {
  padding: 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-bottom: 1px solid #2a2a4e;
}

.sidebar-menu {
  padding: 1rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: #aaa;
  text-decoration: none;
}

.menu-item:hover,
.menu-item.router-link-active {
  background: #2a2a4e;
  color: white;
}

.menu-item .icon {
  font-size: 1.1rem;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  height: 60px;
  background: white;
  border-bottom: 1px solid #eee;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.user-actions button {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.layout-content {
  flex: 1;
  padding: 1.5rem;
  background: #f5f5f5;
}
</style>
