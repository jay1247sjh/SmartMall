<script setup lang="ts">
/**
 * 主布局组件 - Gemini 风格
 * 包含顶部导航、内容区
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
    <!-- 背景装饰 -->
    <div class="layout-bg">
      <div class="bg-gradient"></div>
    </div>

    <header class="layout-header">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">Smart Mall</span>
        </div>
        <nav class="nav-menu">
          <router-link to="/mall">商城</router-link>
          <router-link to="/user/profile">个人中心</router-link>
        </nav>
      </div>
      <div class="user-actions">
        <span class="username">{{ userStore.currentUser?.username }}</span>
        <button class="logout-btn" @click="handleLogout">退出</button>
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
  background: #0a0a0a;
  color: #e8eaed;
  position: relative;
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

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 60px;
  background: rgba(17, 17, 19, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 48px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
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

.logo-text {
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-menu {
  display: flex;
  gap: 32px;
}

.nav-menu a {
  color: #9aa0a6;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.15s;
}

.nav-menu a:hover {
  color: #e8eaed;
}

.nav-menu a.router-link-active {
  color: #8ab4f8;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 16px;
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
  position: relative;
  z-index: 1;
}
</style>
