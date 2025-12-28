<script setup lang="ts">
/**
 * 商家建模工具页面
 * 商家只能编辑自己授权的区域
 */
import { useUserStore } from '@/stores'

const userStore = useUserStore()
</script>

<template>
  <div class="builder-view">
    <h2>建模工具</h2>
    <div class="info-card">
      <p>您已授权的区域：</p>
      <ul v-if="userStore.authorizedAreaIds.length">
        <li v-for="areaId in userStore.authorizedAreaIds" :key="areaId">
          {{ areaId }}
        </li>
      </ul>
      <p v-else class="empty">暂无授权区域，请先申请</p>
    </div>
    <p class="placeholder">3D 建模工具开发中...</p>
  </div>
</template>

<style scoped>
h2 { margin-bottom: 1rem; color: #333; }

.info-card {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.empty { color: #999; }
.placeholder { color: #999; }
</style>
