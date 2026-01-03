<script setup lang="ts">
/**
 * 忘记密码页面
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { passwordApi } from '@/api'

const router = useRouter()

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)

async function handleSubmit() {
  if (!email.value.trim()) {
    errorMsg.value = '请输入邮箱地址'
    return
  }
  
  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errorMsg.value = '请输入有效的邮箱地址'
    return
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    await passwordApi.forgotPassword({ email: email.value })
    success.value = true
  } catch (error: any) {
    errorMsg.value = error?.message || '发送失败，请重试'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/login')
}
</script>

<template>
  <div class="forgot-password-page">
    <div class="form-panel">
      <div class="form-panel-bg"></div>
      
      <div class="form-container">
        <!-- Logo -->
        <div class="form-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 成功状态 -->
        <template v-if="success">
          <div class="success-content">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2>邮件已发送</h2>
            <p>如果该邮箱已注册，您将收到一封包含密码重置链接的邮件。请检查您的收件箱。</p>
            <button class="btn-primary" @click="goBack">返回登录</button>
          </div>
        </template>

        <!-- 表单状态 -->
        <template v-else>
          <div class="form-header">
            <h2>忘记密码</h2>
            <p>输入您的邮箱地址，我们将发送密码重置链接</p>
          </div>

          <form class="forgot-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="email">邮箱地址</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M2 6l8 5 8-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <input id="email" v-model="email" type="email" placeholder="输入邮箱地址"
                  autocomplete="email" :class="{ error: errorMsg }" />
              </div>
            </div>

            <div v-if="errorMsg" class="error-message">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span>{{ errorMsg }}</span>
            </div>

            <button type="submit" class="btn-submit" :disabled="loading">
              <span v-if="loading" class="loading-spinner"></span>
              <span>{{ loading ? '发送中...' : '发送重置链接' }}</span>
            </button>
          </form>

          <div class="form-footer">
            <a href="#" class="footer-link" @click.prevent="goBack">← 返回登录</a>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  background-color: #0a0a0a;
}

.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 64px;
  position: relative;
  overflow: hidden;
}

.form-panel-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 100% 80% at 50% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 50%);
  pointer-events: none;
}

.form-container {
  position: relative;
  width: 100%;
  max-width: 380px;
}

.form-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #8ab4f8;
}

.logo-icon svg {
  width: 24px;
  height: 24px;
}

.form-header {
  text-align: center;
  margin-bottom: 28px;
}

.form-header h2 {
  font-size: 26px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0 0 8px 0;
}

.form-header p {
  font-size: 14px;
  color: #9aa0a6;
  margin: 0;
}

.forgot-form {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #9aa0a6;
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #5f6368;
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrapper:focus-within .input-icon {
  color: #8ab4f8;
}

.form-group input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 14px;
  color: #e8eaed;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.form-group input::placeholder {
  color: #5f6368;
}

.form-group input:focus {
  outline: none;
  border-color: #8ab4f8;
  background: rgba(138, 180, 248, 0.05);
  box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.1);
}

.form-group input.error {
  border-color: #f28b82;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.2);
  border-radius: 10px;
  margin: 20px 0 0 0;
  font-size: 13px;
  color: #f28b82;
}

.btn-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  background: #3c4043;
  color: #5f6368;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-footer {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.footer-link {
  font-size: 13px;
  color: #8ab4f8;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #aecbfa;
}

/* 成功状态 */
.success-content {
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 50%;
  color: #34d399;
}

.success-icon svg {
  width: 32px;
  height: 32px;
}

.success-content h2 {
  font-size: 24px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0 0 12px 0;
}

.success-content p {
  font-size: 14px;
  color: #9aa0a6;
  line-height: 1.6;
  margin: 0 0 28px 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 32px;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .form-panel {
    padding: 32px 24px;
  }
  .form-container {
    max-width: 100%;
  }
}
</style>
