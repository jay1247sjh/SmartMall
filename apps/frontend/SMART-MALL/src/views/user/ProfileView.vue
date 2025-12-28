<script setup lang="ts">
/**
 * 用户个人信息页面
 */
import { useUserStore } from '@/stores'

const userStore = useUserStore()
</script>

<template>
  <div class="profile-view">
    <h2>个人信息</h2>
    <div class="profile-card">
      <div class="avatar">👤</div>
      <div class="info">
        <p><strong>用户名：</strong>{{ userStore.currentUser?.username }}</p>
        <p><strong>角色：</strong>{{ userStore.role }}</p>
        <p><strong>状态：</strong>{{ userStore.currentUser?.status }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
h2 { margin-bottom: 1.5rem; color: #333; }

.profile-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  gap: 2rem;
  align-items: center;
}

.avatar {
  font-size: 4rem;
  width: 100px;
  height: 100px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info p {
  margin: 0.5rem 0;
  color: #666;
}

.info strong {
  color: #333;
}
</style>
