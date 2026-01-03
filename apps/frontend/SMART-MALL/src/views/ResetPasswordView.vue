<script setup lang="ts">
/**
 * 重置密码页面 - 使用可复用组件重构
 */
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { passwordApi } from '@/api'
import { AuthFormCard, AuthInput, AuthButton, AlertMessage } from '@/components'

const router = useRouter()
const route = useRoute()

const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const verifying = ref(true)
const errorMsg = ref('')
const tokenValid = ref(false)
const success = ref(false)

onMounted(async () => {
  token.value = (route.query.token as string) || ''
  
  if (!token.value) {
    errorMsg.value = '无效的重置链接'
    verifying.value = false
    return
  }
  
  try {
    const valid = await passwordApi.verifyResetToken({ token: token.value })
    tokenValid.value = valid
    if (!valid) {
      errorMsg.value = '重置链接已过期或无效'
    }
  } catch {
    errorMsg.value = '验证失败，请重试'
  } finally {
    verifying.value = false
  }
})

async function handleSubmit() {
  if (!newPassword.value) {
    errorMsg.value = '请输入新密码'
    return
  }
  
  if (newPassword.value.length < 6) {
    errorMsg.value = '密码长度不能少于6位'
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    await passwordApi.resetPassword({ token: token.value, newPassword: newPassword.value })
    success.value = true
  } catch (error: any) {
    errorMsg.value = error?.message || '重置失败，请重试'
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

function goToForgotPassword() {
  router.push('/forgot-password')
}
</script>

<template>
  <div class="reset-password-page">
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

        <!-- 加载状态 -->
        <template v-if="verifying">
          <div class="loading-content">
            <div class="loading-spinner large"></div>
            <p>正在验证重置链接...</p>
          </div>
        </template>

        <!-- 令牌无效 -->
        <template v-else-if="!tokenValid && !success">
          <div class="status-content error">
            <div class="status-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <h2>链接无效</h2>
            <p>{{ errorMsg || '重置链接已过期或无效，请重新申请' }}</p>
            <button class="btn-primary" @click="goToForgotPassword">重新申请</button>
          </div>
        </template>

        <!-- 成功状态 -->
        <template v-else-if="success">
          <div class="status-content success">
            <div class="status-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 12l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2>密码已重置</h2>
            <p>您的密码已成功重置，请使用新密码登录</p>
            <button class="btn-primary" @click="goToLogin">前往登录</button>
          </div>
        </template>

        <!-- 表单状态 -->
        <template v-else>
          <AuthFormCard title="重置密码" description="请输入您的新密码">
            <form @submit.prevent="handleSubmit">
              <AuthInput
                id="newPassword"
                v-model="newPassword"
                label="新密码"
                type="password"
                icon="password"
                placeholder="输入新密码（至少6位）"
                autocomplete="new-password"
                required
              />

              <AuthInput
                id="confirmPassword"
                v-model="confirmPassword"
                label="确认密码"
                type="password"
                icon="password"
                placeholder="再次输入新密码"
                autocomplete="new-password"
                required
              />

              <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />

              <AuthButton text="重置密码" loading-text="重置中..." :loading="loading" />
            </form>

            <template #footer>
              <div class="form-footer">
                <a href="#" class="footer-link" @click.prevent="goToLogin">← 返回登录</a>
              </div>
            </template>
          </AuthFormCard>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-password-page {
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

/* 加载状态 */
.loading-content {
  text-align: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto;
}

.loading-spinner.large {
  width: 32px;
  height: 32px;
  border-width: 3px;
  border-color: rgba(138, 180, 248, 0.3);
  border-top-color: #8ab4f8;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-content p {
  margin-top: 16px;
  font-size: 14px;
  color: #9aa0a6;
}

/* 状态内容 */
.status-content {
  text-align: center;
}

.status-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.status-content.success .status-icon {
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.status-content.error .status-icon {
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.2);
  color: #f28b82;
}

.status-icon svg {
  width: 32px;
  height: 32px;
}

.status-content h2 {
  font-size: 24px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0 0 12px 0;
}

.status-content p {
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
