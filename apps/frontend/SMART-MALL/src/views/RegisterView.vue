<script setup lang="ts">
/**
 * 注册页面
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { registerApi } from '@/api'
import { ElForm, ElText, ElLink } from 'element-plus'
import {
  AuthLayout,
  AuthFormCard,
  AuthInput,
  AuthButton,
  AlertMessage,
  FeatureList,
} from '@/components'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const usernameChecking = ref(false)
const usernameAvailable = ref<boolean | null>(null)
const emailChecking = ref(false)
const emailAvailable = ref<boolean | null>(null)

let usernameTimer: number | null = null
let emailTimer: number | null = null

const features = [
  '免费注册，即刻体验',
  '3D 商城可视化管理',
  'AI 智能助手随时待命',
]

const usernameError = computed(() => {
  if (!username.value) return ''
  if (username.value.length < 3) return '用户名至少3个字符'
  if (username.value.length > 20) return '用户名最多20个字符'
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) return '只能包含字母、数字和下划线'
  if (usernameAvailable.value === false) return '用户名已被注册'
  return ''
})

const emailError = computed(() => {
  if (!email.value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return '邮箱格式不正确'
  if (emailAvailable.value === false) return '邮箱已被注册'
  return ''
})

const passwordError = computed(() => {
  if (!password.value) return ''
  if (password.value.length < 6) return '密码至少6个字符'
  return ''
})

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return ''
  if (confirmPassword.value !== password.value) return '两次密码不一致'
  return ''
})

const phoneError = computed(() => {
  if (!phone.value) return ''
  if (!/^1[3-9]\d{9}$/.test(phone.value)) return '手机号格式不正确'
  return ''
})

const isFormValid = computed(() => {
  const hasRequiredFields = username.value && email.value && password.value && confirmPassword.value
  const noFormatErrors = !usernameError.value && !emailError.value && !passwordError.value && !confirmPasswordError.value && !phoneError.value
  const availabilityOk = usernameAvailable.value !== false && emailAvailable.value !== false
  return hasRequiredFields && noFormatErrors && availabilityOk
})

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
    setTimeout(() => router.push('/login'), 2000)
  } catch (error: any) {
    errorMsg.value = error?.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    brand-headline="加入我们，开启智能商城之旅"
    brand-subtitle="创建账号，体验 3D 可视化与 AI 智能融合的下一代商业空间管理平台"
  >
    <template #brand-extra>
      <FeatureList :features="features" />
    </template>

    <AuthFormCard title="创建账号" description="填写以下信息完成注册">
      <ElForm @submit.prevent="handleRegister">
        <AuthInput
          id="username"
          v-model="username"
          label="用户名"
          icon="user"
          placeholder="3-20个字符，字母数字下划线"
          autocomplete="username"
          required
          :error="usernameError"
          :checking="usernameChecking"
          :valid="usernameAvailable === true"
        />

        <AuthInput
          id="email"
          v-model="email"
          label="邮箱"
          type="email"
          icon="email"
          placeholder="your@email.com"
          autocomplete="email"
          required
          :error="emailError"
          :checking="emailChecking"
          :valid="emailAvailable === true"
        />

        <AuthInput
          id="password"
          v-model="password"
          label="密码"
          type="password"
          icon="password"
          placeholder="至少6个字符"
          autocomplete="new-password"
          required
          :error="passwordError"
        />

        <AuthInput
          id="confirmPassword"
          v-model="confirmPassword"
          label="确认密码"
          type="password"
          icon="password"
          placeholder="再次输入密码"
          autocomplete="new-password"
          required
          :error="confirmPasswordError"
        />

        <AuthInput
          id="phone"
          v-model="phone"
          label="手机号"
          type="tel"
          icon="phone"
          placeholder="11位手机号"
          autocomplete="tel"
          :error="phoneError"
        />

        <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />
        <AlertMessage v-if="successMsg" type="success" :message="successMsg" />

        <AuthButton 
          text="创建账号" 
          loading-text="注册中..." 
          :loading="loading" 
          :disabled="!isFormValid" 
        />
      </ElForm>

      <template #footer>
        <nav class="form-footer">
          <ElText type="info" size="small">已有账号？</ElText>
          <ElLink type="primary" :underline="false" @click="router.push('/login')">
            立即登录
          </ElLink>
        </nav>
      </template>
    </AuthFormCard>
  </AuthLayout>
</template>

<style scoped lang="scss">
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;

  :deep(.el-text) {
    font-size: 13px;
    color: #9aa0a6;
  }

  :deep(.el-link) {
    font-size: 13px;
  }
}
</style>
