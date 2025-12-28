<script setup lang="ts">
/**
 * 登录页面
 * TODO: 实现完整登录表单
 */
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  
  try {
    // Mock 登录逻辑
    const mockUser = {
      userId: '1',
      username: username.value,
      userType: username.value === 'admin' ? 'ADMIN' : 
                username.value === 'merchant' ? 'MERCHANT' : 'USER',
      status: 'ACTIVE',
    } as const
    
    userStore.setUser(
      { ...mockUser, userType: mockUser.userType as 'ADMIN' | 'MERCHANT' | 'USER', status: 'ACTIVE' },
      'mock-access-token',
      'mock-refresh-token'
    )
    
    // 跳转到原目标或商城首页（不是 / 避免循环）
    const redirect = route.query.redirect as string
    if (redirect && redirect !== '/login') {
      router.push(redirect)
    } else {
      router.push('/mall')
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-view">
    <div class="login-card">
      <h1>Smart Mall</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-item">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="admin / merchant / user" />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="任意密码" />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="hint">提示：输入 admin/merchant/user 体验不同角色</p>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 360px;
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-item {
  margin-bottom: 1rem;
}

.form-item label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.form-item input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

button:hover:not(:disabled) {
  background: #5a6fd6;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hint {
  text-align: center;
  color: #999;
  font-size: 0.8rem;
  margin-top: 1rem;
}
</style>
