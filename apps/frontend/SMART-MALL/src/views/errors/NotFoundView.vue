<script setup lang="ts">
/**
 * 404 页面
 */
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="error-view">
    <div class="error-content">
      <h1>404</h1>
      <p>页面不存在</p>
      <button @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.error-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.error-content {
  text-align: center;
}

h1 {
  font-size: 6rem;
  color: #ddd;
  margin: 0;
}

p {
  color: #666;
  margin: 1rem 0 2rem;
}

button {
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #5a6fd6;
}
</style>
