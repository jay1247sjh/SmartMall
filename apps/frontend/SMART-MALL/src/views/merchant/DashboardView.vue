<script setup lang="ts">
/**
 * 商家工作台
 */
import { useUserStore } from '@/stores'

const userStore = useUserStore()
</script>

<template>
  <div class="dashboard-view">
    <h2>商家工作台</h2>
    <div class="welcome-card">
      <p>欢迎回来，{{ userStore.currentUser?.username }}</p>
    </div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">2</div>
        <div class="stat-label">我的店铺</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">1</div>
        <div class="stat-label">待审批申请</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
h2 { margin-bottom: 1.5rem; color: #333; }

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #e94560;
}

.stat-label {
  color: #666;
  margin-top: 0.5rem;
}
</style>
