<script setup lang="ts">
/**
 * 注册页面 - 与登录页风格一致
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { registerApi } from '@/api'

const router = useRouter()

// 表单数据
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')

// 状态
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// 字段验证状态
const usernameChecking = ref(false)
const usernameAvailable = ref<boolean | null>(null)
const emailChecking = ref(false)
const emailAvailable = ref<boolean | null>(null)

// 防抖定时器
let usernameTimer: number | null = null
let emailTimer: number | null = null

// 用户名验证
const usernameError = computed(() => {
  if (!username.value) return ''
  if (username.value.length < 3) return '用户名至少3个字符'
  if (username.value.length > 20) return '用户名最多20个字符'
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) return '只能包含字母、数字和下划线'
  if (usernameAvailable.value === false) return '用户名已被注册'
  return ''
})

// 邮箱验证
const emailError = computed(() => {
  if (!email.value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return '邮箱格式不正确'
  if (emailAvailable.value === false) return '邮箱已被注册'
  return ''
})

// 密码验证
const passwordError = computed(() => {
  if (!password.value) return ''
  if (password.value.length < 6) return '密码至少6个字符'
  return ''
})

// 确认密码验证
const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return ''
  if (confirmPassword.value !== password.value) return '两次密码不一致'
  return ''
})

// 手机号验证
const phoneError = computed(() => {
  if (!phone.value) return ''
  if (!/^1[3-9]\d{9}$/.test(phone.value)) return '手机号格式不正确'
  return ''
})

// 表单是否有效
const isFormValid = computed(() => {
  // 基本字段必填
  const hasRequiredFields = username.value && 
         email.value && 
         password.value && 
         confirmPassword.value
  
  // 没有格式错误
  const noFormatErrors = !usernameError.value &&
         !emailError.value &&
         !passwordError.value &&
         !confirmPasswordError.value &&
         !phoneError.value
  
  // 可用性检查：不是 false 即可（null 表示未检查或检查失败，允许提交）
  const availabilityOk = usernameAvailable.value !== false && 
         emailAvailable.value !== false
  
  return hasRequiredFields && noFormatErrors && availabilityOk
})

// 监听用户名变化，防抖检查可用性
watch(username, (val) => {
  usernameAvailable.value = null
  if (usernameTimer) clearTimeout(usernameTimer)
  
  if (val && val.length >= 3 && /^[a-zA-Z0-9_]+$/.test(val)) {
    usernameChecking.value = true
    usernameTimer = window.setTimeout(async () => {
      try {
        usernameAvailable.value = await registerApi.checkUsername(val)
      } catch {
        usernameAvailable.value = null
      } finally {
        usernameChecking.value = false
      }
    }, 500)
  }
})

// 监听邮箱变化，防抖检查可用性
watch(email, (val) => {
  emailAvailable.value = null
  if (emailTimer) clearTimeout(emailTimer)
  
  if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
    emailChecking.value = true
    emailTimer = window.setTimeout(async () => {
      try {
        emailAvailable.value = await registerApi.checkEmail(val)
      } catch {
        emailAvailable.value = null
      } finally {
        emailChecking.value = false
      }
    }, 500)
  }
})

// 提交注册
async function handleRegister() {
  if (!isFormValid.value) {
    errorMsg.value = '请检查表单填写是否正确'
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  try {
    await registerApi.register({
      username: username.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      email: email.value,
      phone: phone.value || undefined,
    })
    
    successMsg.value = '注册成功！即将跳转到登录页面...'
    
    // 2秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error: any) {
    errorMsg.value = error?.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <!-- Left: Brand Panel -->
    <div class="brand-panel">
      <div class="brand-bg">
        <div class="bg-gradient"></div>
        <div class="bg-grid"></div>
        <div class="bg-glow bg-glow-1"></div>
        <div class="bg-glow bg-glow-2"></div>
      </div>
      
      <div class="brand-content">
        <h1 class="system-title">Smart Mall</h1>
        <h2 class="system-headline">加入我们，开启智能商城之旅</h2>
        <p class="system-subtitle">创建账号，体验 3D 可视化与 AI 智能融合的下一代商业空间管理平台</p>
        
        <div class="feature-list">
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>免费注册，即刻体验</span>
          </div>
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>3D 商城可视化管理</span>
          </div>
          <div class="feature-item">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>AI 智能助手随时待命</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Register Form -->
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

        <div class="form-header">
          <h2>创建账号</h2>
          <p>填写以下信息完成注册</p>
        </div>

        <form class="register-form" @submit.prevent="handleRegister">
          <!-- 用户名 -->
          <div class="form-group">
            <label for="username">用户名 <span class="required">*</span></label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 18c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input id="username" v-model="username" type="text" placeholder="3-20个字符，字母数字下划线"
                autocomplete="username" :class="{ error: usernameError }" />
              <span v-if="usernameChecking" class="input-status checking"></span>
              <span v-else-if="usernameAvailable === true && !usernameError" class="input-status valid">✓</span>
            </div>
            <span v-if="usernameError" class="field-error">{{ usernameError }}</span>
          </div>

          <!-- 邮箱 -->
          <div class="form-group">
            <label for="email">邮箱 <span class="required">*</span></label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 6l8 5 8-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input id="email" v-model="email" type="email" placeholder="your@email.com"
                autocomplete="email" :class="{ error: emailError }" />
              <span v-if="emailChecking" class="input-status checking"></span>
              <span v-else-if="emailAvailable === true && !emailError" class="input-status valid">✓</span>
            </div>
            <span v-if="emailError" class="field-error">{{ emailError }}</span>
          </div>

          <!-- 密码 -->
          <div class="form-group">
            <label for="password">密码 <span class="required">*</span></label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M6 8V5a4 4 0 118 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
              </svg>
              <input id="password" v-model="password" type="password" placeholder="至少6个字符"
                autocomplete="new-password" :class="{ error: passwordError }" />
            </div>
            <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
          </div>

          <!-- 确认密码 -->
          <div class="form-group">
            <label for="confirmPassword">确认密码 <span class="required">*</span></label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M6 8V5a4 4 0 118 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
              </svg>
              <input id="confirmPassword" v-model="confirmPassword" type="password" placeholder="再次输入密码"
                autocomplete="new-password" :class="{ error: confirmPasswordError }" />
            </div>
            <span v-if="confirmPasswordError" class="field-error">{{ confirmPasswordError }}</span>
          </div>

          <!-- 手机号（可选） -->
          <div class="form-group">
            <label for="phone">手机号 <span class="optional">(可选)</span></label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="5" y="2" width="10" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <line x1="8" y1="15" x2="12" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input id="phone" v-model="phone" type="tel" placeholder="11位手机号"
                autocomplete="tel" :class="{ error: phoneError }" />
            </div>
            <span v-if="phoneError" class="field-error">{{ phoneError }}</span>
          </div>

          <!-- 错误消息 -->
          <div v-if="errorMsg" class="error-message">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ errorMsg }}</span>
          </div>

          <!-- 成功消息 -->
          <div v-if="successMsg" class="success-message">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ successMsg }}</span>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading || !isFormValid">
            <span v-if="loading" class="loading-spinner"></span>
            <span>{{ loading ? '注册中...' : '创建账号' }}</span>
            <svg v-if="!loading" class="btn-arrow" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>

        <!-- 底部链接 -->
        <div class="form-footer">
          <span class="footer-text">已有账号？</span>
          <router-link to="/login" class="footer-link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  background-color: #0a0a0a;
}

/* ========================================
 * Brand Panel
 * ======================================== */
.brand-panel {
  flex: 0 0 50%;
  display: flex;
  align-items: center;
  padding: 80px 100px;
  position: relative;
  overflow: hidden;
}

.brand-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 60% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.bg-glow-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -50px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  opacity: 0.4;
}

.bg-glow-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: 10%;
  background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
  opacity: 0.25;
}

.brand-content {
  position: relative;
  z-index: 1;
  max-width: 500px;
}

.system-title {
  font-size: 56px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 28px 0;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #f472b6 70%, #fb923c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 200% 200%;
  animation: gradientShift 6s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.system-headline {
  font-size: 24px;
  font-weight: 400;
  color: #e8eaed;
  line-height: 1.4;
  margin: 0 0 14px 0;
}

.system-subtitle {
  font-size: 14px;
  color: #9aa0a6;
  line-height: 1.6;
  margin: 0 0 36px 0;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #bdc1c6;
  font-size: 14px;
}

.feature-item svg {
  width: 20px;
  height: 20px;
  color: #81c995;
  flex-shrink: 0;
}

/* ========================================
 * Form Panel
 * ======================================== */
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
  background: radial-gradient(ellipse 100% 80% at 80% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 50%);
  pointer-events: none;
}

.form-container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

/* Logo */
.form-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #8ab4f8;
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
}

.form-header h2 {
  font-size: 24px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0 0 6px 0;
}

.form-header p {
  font-size: 13px;
  color: #9aa0a6;
  margin: 0;
}

.register-form {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #9aa0a6;
  margin-bottom: 6px;
}

.required {
  color: #f28b82;
}

.optional {
  color: #5f6368;
  font-weight: 400;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #5f6368;
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrapper:focus-within .input-icon {
  color: #8ab4f8;
}

.form-group input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
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

.input-status {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.input-status.checking {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(138, 180, 248, 0.3);
  border-top-color: #8ab4f8;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.input-status.valid {
  color: #81c995;
}

@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.field-error {
  display: block;
  font-size: 11px;
  color: #f28b82;
  margin-top: 4px;
  padding-left: 2px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(242, 139, 130, 0.1);
  border: 1px solid rgba(242, 139, 130, 0.2);
  border-radius: 8px;
  margin: 16px 0 0 0;
  font-size: 12px;
  color: #f28b82;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(129, 201, 149, 0.1);
  border: 1px solid rgba(129, 201, 149, 0.2);
  border-radius: 8px;
  margin: 16px 0 0 0;
  font-size: 12px;
  color: #81c995;
}

.btn-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
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
  opacity: 0.7;
}

.btn-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.btn-submit:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* 底部链接 */
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
}

.footer-text {
  font-size: 13px;
  color: #9aa0a6;
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

/* Responsive */
@media (max-width: 1200px) {
  .brand-panel { padding: 60px; }
  .system-title { font-size: 48px; }
  .system-headline { font-size: 22px; }
}

@media (max-width: 900px) {
  .brand-panel { flex: 0 0 40%; padding: 48px; }
  .system-title { font-size: 40px; }
  .system-headline { font-size: 20px; }
}

@media (max-width: 768px) {
  .brand-panel { display: none; }
  .form-panel { padding: 32px 24px; min-height: 100vh; }
  .form-container { max-width: 100%; }
}

@media (min-width: 1600px) {
  .brand-panel { padding: 100px 140px; }
  .system-title { font-size: 64px; }
  .system-headline { font-size: 28px; }
}
</style>
