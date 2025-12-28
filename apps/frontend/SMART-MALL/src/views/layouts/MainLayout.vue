<script setup lang="ts">
/**
 * 主布局组件
 * 包含顶部导航、侧边栏、内容区
 */
import { useUserStore } from '@/stores'
import { useRouter } from 'vue-router'
import { cleanupOnLogout } from '@/router'

const userStore = useUserStore()
const router = useRouter()

function handleLogout() {
  userStore.clearUser()
  cleanupOnLogout(router)
}
</script>

<template>
  <div class="main-layout">
    <header class="layout-header">
      <div class="logo">🏬 Smart Mall</div>
      <nav class="nav-menu">
        <router-link to="/mall">商城</router-link>
        <router-link to="/user/profile">个人中心</router-link>
      </nav>
      <div class="user-actions">
        <span>{{ userStore.currentUser?.username }}</span>
        <button @click="handleLogout">退出</button>
      </div>
    </header>
    <main class="layout-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  display: flex;
  align-items: center;
  padding: 0 2rem;
  height: 60px;
  background: #1a1a2e;
  color: white;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
}

.nav-menu {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  margin-left: 3rem;
}

.nav-menu a {
  color: #aaa;
  text-decoration: none;
}

.nav-menu a:hover,
.nav-menu a.router-link-active {
  color: white;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-actions button {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #666;
  color: #aaa;
  border-radius: 4px;
  cursor: pointer;
}

.user-actions button:hover {
  border-color: #999;
  color: white;
}

.layout-content {
  flex: 1;
  background: #f5f5f5;
}
</style>
