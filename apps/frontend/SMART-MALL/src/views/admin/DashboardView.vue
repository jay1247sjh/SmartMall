<script setup lang="ts">
/**
 * 管理员控制台
 */
</script>

<template>
  <div class="dashboard-view">
    <h2>管理员控制台</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">128</div>
        <div class="stat-label">商家总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">56</div>
        <div class="stat-label">待审批</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">3</div>
        <div class="stat-label">楼层数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">89%</div>
        <div class="stat-label">入驻率</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-view h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  color: #667eea;
}

.stat-label {
  color: #666;
  margin-top: 0.5rem;
}
</style>
