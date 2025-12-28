<script setup lang="ts">
/**
 * 商城主页面
 * TODO: 集成 3D 渲染引擎
 */
import { useUserStore } from '@/stores'

const userStore = useUserStore()
</script>

<template>
  <div class="mall-view">
    <header class="mall-header">
      <h1>🏬 Smart Mall</h1>
      <div class="user-info" v-if="userStore.isAuthenticated">
        <span>{{ userStore.currentUser?.username }}</span>
        <span class="role-badge">{{ userStore.role }}</span>
      </div>
    </header>
    <main class="mall-content">
      <p>3D 商城渲染区域</p>
      <p class="placeholder">ThreeEngine 将在此渲染</p>
    </main>
  </div>
</template>

<style scoped>
.mall-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.mall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1a1a2e;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-badge {
  background: #667eea;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.mall-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0f0f23;
  color: #666;
}

.placeholder {
  font-size: 0.9rem;
  color: #444;
}
</style>
