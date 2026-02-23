<script setup lang="ts">
/**
 * ============================================================================
 * 登录页面 (LoginView.vue)
 * ============================================================================
 * 
 * 【业务背景】
 * Smart Mall 是一个智能商城管理系统，支持三种用户角色：
 * - Admin（管理员）：管理整个商城，审批商户入驻，分配区域
 * - Merchant（商户）：在商城中租赁区域开店，管理自己的店铺
 * - User（普通用户）：浏览商城，体验 3D 漫游
 * 
 * 【页面职责】
 * 1. 收集用户凭证（用户名 + 密码）
 * 2. 调用后端 API 进行身份验证
 * 3. 存储登录状态（Token + 用户信息）
 * 4. 根据用户角色跳转到对应页面
 * 
 * 【安全考虑】
 * - 前端验证：快速反馈，提升用户体验
 * - 后端验证：真正的安全保障（前端验证可被绕过）
 * - Token 机制：accessToken（短期）+ refreshToken（长期）
 * 
 * 【组件化设计】
 * 使用 Element Plus + 自定义认证组件，代码量从 ~400 行减少到 ~80 行
 * ============================================================================
 */

import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores'
import { authApi } from '@/api'
import { ElForm, ElLink, ElDivider } from 'element-plus'
import {
  AuthLayout,
  AuthFormCard,
  AuthInput,
  AuthButton,
  AlertMessage,
  TypewriterCard,
} from '@/components'

// ============================================================================
// 路由、状态管理、国际化
// ============================================================================

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

// ============================================================================
// 表单状态
// ============================================================================

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

// ============================================================================
// 产品特性文案（i18n）
// ============================================================================

const featureTexts = [
  t('auth.login.feature3dVisualization'),
  t('auth.login.featureAiAssistant'),
  t('auth.login.featureDataAnalysis'),
  t('auth.login.featureDragEdit'),
  t('auth.login.featureMultiDevice'),
]

// ============================================================================
// 登录处理函数
// ============================================================================

/**
 * 处理登录表单提交
 * 
 * 【执行流程】
 * 1. 前端验证 - 检查用户名和密码是否为空
 * 2. 发送请求 - 调用后端登录 API
 * 3. 存储状态 - 保存 Token 和用户信息到 Pinia + localStorage
 * 4. 页面跳转 - 根据 redirect 参数或默认跳转到 /mall
 * 
 * 【错误处理】
 * - 网络错误：显示通用错误提示
 * - 认证失败：显示后端返回的错误消息
 */
async function handleLogin() {
  if (!username.value.trim()) { 
    errorMsg.value = t('auth.login.enterUsername')
    return
  }
  
  if (!password.value) { 
    errorMsg.value = t('auth.login.enterPassword')
    return 
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    const response = await authApi.login({ 
      username: username.value, 
      password: password.value 
    })
    
    userStore.setUser(response.user, response.accessToken, response.refreshToken)
    
    if (response.merchant) {
      userStore.setMerchantInfo(response.merchant)
    }
    
    /**
     * 登录后重定向逻辑
     * - 校验 redirect 为站内路径（以 / 开头），防止 Open Redirect
     * - 排除 /login 防止无限循环
     * - 默认跳转到 /mall
     */
    const redirect = route.query.redirect as string
    const isSafeRedirect = redirect && redirect.startsWith('/') && redirect !== '/login'
    router.push(isSafeRedirect ? redirect : '/mall')
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : undefined
    errorMsg.value = message || t('auth.login.loginFailed')
    
  } finally {
    loading.value = false
  }
}

/**
 * 清除错误消息（用户输入时）
 */
function clearError() {
  if (errorMsg.value) {
    errorMsg.value = ''
  }
}
</script>

<template>
  <AuthLayout
    :brand-headline="t('auth.login.brandHeadline')"
    :brand-subtitle="t('auth.login.brandSubtitle')"
  >
    <template #brand-extra>
      <TypewriterCard :texts="featureTexts" />
    </template>

    <AuthFormCard :title="t('auth.login.welcomeBack')" :description="t('auth.login.description')">
      <ElForm @submit.prevent="handleLogin">
        <AuthInput
          id="username"
          v-model="username"
          :label="t('auth.username')"
          icon="user"
          :placeholder="t('auth.login.usernamePlaceholder')"
          autocomplete="username"
          required
          :error="errorMsg && !username ? t('auth.login.enterUsername') : ''"
          @input="clearError"
        />

        <AuthInput
          id="password"
          v-model="password"
          :label="t('auth.password')"
          type="password"
          icon="password"
          :placeholder="t('auth.login.passwordPlaceholder')"
          autocomplete="current-password"
          required
          :error="errorMsg && !password ? t('auth.login.enterPassword') : ''"
          @input="clearError"
        />

        <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />

        <AuthButton :text="t('auth.login.loginBtn')" :loading-text="t('auth.login.loggingIn')" :loading="loading" />
      </ElForm>

      <template #footer>
        <nav class="form-footer">
          <ElLink type="primary" :underline="false" @click="router.push('/forgot-password')">
            {{ t('auth.forgotPassword') }}
          </ElLink>
          <ElDivider direction="vertical" />
          <ElLink type="primary" :underline="false" @click="router.push('/register')">
            {{ t('auth.login.createAccount') }}
          </ElLink>
        </nav>
      </template>
    </AuthFormCard>
  </AuthLayout>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 表单底部导航（忘记密码 | 创建账号）
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $space-2;

  :deep(.el-link) {
    font-size: $font-size-sm;
  }

  :deep(.el-divider--vertical) {
    margin: 0;
    border-color: var(--text-muted);
  }
}
</style>
