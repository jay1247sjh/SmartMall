<script setup lang="ts">
/**
 * 登录页面 - Gemini 风格
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores'
import { authApi } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

// 打字机效果
const featureTexts = [
  '通过 3D 可视化技术，让商城管理变得直观高效',
  '智能 AI 助手随时待命，一句话完成复杂操作',
  '实时数据分析，洞察每一个商业机会',
  '拖拽式店铺编辑，所见即所得的空间设计',
  '多端协同工作，随时随地掌控全局',
]

const currentFeatureIndex = ref(0)
const displayedText = ref('')
const isTyping = ref(true)
let typingTimer: number | null = null
let pauseTimer: number | null = null

function typeText() {
  const fullText = featureTexts[currentFeatureIndex.value]
  let charIndex = 0
  displayedText.value = ''
  isTyping.value = true

  const type = () => {
    if (charIndex < fullText.length) {
      displayedText.value += fullText[charIndex]
      charIndex++
      typingTimer = window.setTimeout(type, Math.random() * 25 + 30)
    } else {
      isTyping.value = false
      pauseTimer = window.setTimeout(() => {
        currentFeatureIndex.value = (currentFeatureIndex.value + 1) % featureTexts.length
        typeText()
      }, 2500)
    }
  }
  type()
}

onMounted(() => { typeText() })
onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
  if (pauseTimer) clearTimeout(pauseTimer)
})

async function handleLogin() {
  if (!username.value.trim()) { errorMsg.value = '请输入用户名'; return }
  if (!password.value) { errorMsg.value = '请输入密码'; return }

  loading.value = true
  errorMsg.value = ''
  
  try {
    const response = await authApi.login({ username: username.value, password: password.value })
    userStore.setUser(response.user, response.accessToken, response.refreshToken)
    if (response.merchant) userStore.setMerchantInfo(response.merchant)
    const redirect = route.query.redirect as string
    router.push(redirect && redirect !== '/login' ? redirect : '/mall')
  } catch (error: any) {
    errorMsg.value = error?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
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
        <h2 class="system-headline">重新定义商城管理的可能性</h2>
        <p class="system-subtitle">融合 3D 可视化与 AI 智能，打造下一代商业空间管理平台</p>
        
        <div class="typewriter-card">
          <div class="typewriter-content">
            <span class="typewriter-text">{{ displayedText }}</span><span class="cursor" :class="{ typing: isTyping }"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Login Form -->
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
          <h2>欢迎回来</h2>
          <p>登录以继续使用 Smart Mall</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">用户名</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 18c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input id="username" v-model="username" type="text" placeholder="输入用户名"
                autocomplete="username" :class="{ error: errorMsg && !username }" />
            </div>
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                <path d="M6 8V5a4 4 0 118 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
              </svg>
              <input id="password" v-model="password" type="password" placeholder="输入密码"
                autocomplete="current-password" :class="{ error: errorMsg && !password }" />
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
            <span>{{ loading ? '登录中...' : '登录' }}</span>
            <svg v-if="!loading" class="btn-arrow" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </form>

        <!-- 分隔线 -->
        <div class="divider">
          <span>或</span>
        </div>

        <!-- 第三方登录 -->
        <div class="social-login">
          <button class="social-btn" type="button" title="微信登录">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-9.5 3c0-4.4 4-8 9-8s9 3.6 9 8-4 8-9 8c-1.1 0-2.1-.2-3-.4l-3 1.4.8-2.4C5.3 18.8 4 16.6 4 14z"/>
            </svg>
          </button>
          <button class="social-btn" type="button" title="GitHub 登录">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </button>
          <button class="social-btn" type="button" title="Google 登录">
            <svg viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
        </div>

        <!-- 底部链接 -->
        <div class="form-footer">
          <router-link to="/forgot-password" class="footer-link">忘记密码？</router-link>
          <span class="footer-divider">·</span>
          <router-link to="/register" class="footer-link">创建账号</router-link>
        </div>

        <!-- 测试账号提示 -->
        <div class="test-hint">
          <span>测试账号: admin / merchant / user · 密码: 123456</span>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background-color: #0a0a0a;
}

/* ========================================
 * Brand Panel
 * ======================================== */
.brand-panel {
  flex: 0 0 55%;
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
  max-width: 560px;
}

.system-title {
  font-size: 64px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 32px 0;
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
  font-size: 28px;
  font-weight: 400;
  color: #e8eaed;
  line-height: 1.4;
  margin: 0 0 16px 0;
}

.system-subtitle {
  font-size: 15px;
  color: #9aa0a6;
  line-height: 1.6;
  margin: 0 0 40px 0;
}

.typewriter-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px 24px;
}

.typewriter-content {
  min-height: 24px;
  line-height: 24px;
}

.typewriter-text {
  font-size: 14px;
  color: #bdc1c6;
  line-height: 24px;
  vertical-align: middle;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: #8ab4f8;
  margin-left: 1px;
  vertical-align: middle;
  animation: blink 1s step-end infinite;
}

.cursor.typing { animation: none; }

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
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
  max-width: 380px;
}

/* Logo */
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

.login-form {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 28px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-of-type {
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

.btn-arrow {
  width: 18px;
  height: 18px;
  transition: transform 0.2s;
}

.btn-submit:hover:not(:disabled) .btn-arrow {
  transform: translateX(3px);
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

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #5f6368;
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.divider span {
  padding: 0 16px;
}

/* 社交登录 */
.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.social-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #9aa0a6;
  cursor: pointer;
  transition: all 0.2s;
}

.social-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: #e8eaed;
}

.social-btn svg {
  width: 22px;
  height: 22px;
}

/* 底部链接 */
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
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

.footer-divider {
  color: #3c4043;
}

.test-hint {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.test-hint span {
  font-size: 11px;
  color: #5f6368;
}

/* Responsive */
@media (max-width: 1200px) {
  .brand-panel { padding: 60px; }
  .system-title { font-size: 52px; }
  .system-headline { font-size: 24px; }
}

@media (max-width: 900px) {
  .brand-panel { flex: 0 0 45%; padding: 48px; }
  .system-title { font-size: 44px; }
  .system-headline { font-size: 20px; }
}

@media (max-width: 768px) {
  .brand-panel { display: none; }
  .form-panel { padding: 32px 24px; min-height: 100vh; }
  .form-container { max-width: 100%; }
}

@media (min-width: 1600px) {
  .brand-panel { padding: 100px 140px; }
  .system-title { font-size: 72px; }
  .system-headline { font-size: 32px; }
}
</style>
