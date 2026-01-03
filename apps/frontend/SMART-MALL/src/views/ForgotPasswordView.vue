<script setup lang="ts">
/**
 * 忘记密码页面 - 使用可复用组件重构
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { passwordApi } from '@/api'
import { AuthFormCard, AuthInput, AuthButton, AlertMessage } from '@/components'

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
          <AuthFormCard title="忘记密码" description="输入您的邮箱地址，我们将发送密码重置链接">
            <form @submit.prevent="handleSubmit">
              <AuthInput
                id="email"
                v-model="email"
                label="邮箱地址"
                type="email"
                icon="email"
                placeholder="输入邮箱地址"
                autocomplete="email"
                required
                :error="errorMsg ? '' : ''"
              />

              <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />

              <AuthButton text="发送重置链接" loading-text="发送中..." :loading="loading" />
            </form>

            <template #footer>
              <div class="form-footer">
                <a href="#" class="footer-link" @click.prevent="goBack">← 返回登录</a>
              </div>
            </template>
          </AuthFormCard>
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
  max-width: 400px;
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

.form-footer {
  display: flex;
  justify-content: center;
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

@media (max-width: 768px) {
  .form-panel { padding: 32px 24px; }
  .form-container { max-width: 100%; }
}
</style>
