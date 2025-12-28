<script setup lang="ts">
/**
 * 403 无权限页面
 */
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  router.back()
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="error-view">
    <div class="error-content">
      <h1>403</h1>
      <p>抱歉，您没有权限访问此页面</p>
      <div class="actions">
        <button @click="goBack">返回上页</button>
        <button class="secondary" @click="goHome">返回首页</button>
      </div>
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
  color: #ff6b6b;
  margin: 0;
}

p {
  color: #666;
  margin: 1rem 0 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
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

button.secondary {
  background: #999;
}

button.secondary:hover {
  background: #777;
}
</style>
