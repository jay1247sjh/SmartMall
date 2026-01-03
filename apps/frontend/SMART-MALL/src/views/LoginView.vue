<script setup lang="ts">
/**
 * 登录页面
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores'
import { authApi } from '@/api'
import { ElForm, ElText, ElLink, ElDivider } from 'element-plus'
import {
  AuthLayout,
  AuthFormCard,
  AuthInput,
  AuthButton,
  AlertMessage,
  TypewriterCard,
  SocialLogin,
} from '@/components'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const featureTexts = [
  '通过 3D 可视化技术，让商城管理变得直观高效',
  '智能 AI 助手随时待命，一句话完成复杂操作',
  '实时数据分析，洞察每一个商业机会',
  '拖拽式店铺编辑，所见即所得的空间设计',
  '多端协同工作，随时随地掌控全局',
]

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
  <AuthLayout
    brand-headline="重新定义商城管理的可能性"
    brand-subtitle="融合 3D 可视化与 AI 智能，打造下一代商业空间管理平台"
  >
    <template #brand-extra>
      <TypewriterCard :texts="featureTexts" />
    </template>

    <AuthFormCard title="欢迎回来" description="登录以继续使用 Smart Mall">
      <ElForm @submit.prevent="handleLogin">
        <AuthInput
          id="username"
          v-model="username"
          label="用户名"
          icon="user"
          placeholder="输入用户名"
          autocomplete="username"
          required
          :error="errorMsg && !username ? '请输入用户名' : ''"
        />

        <AuthInput
          id="password"
          v-model="password"
          label="密码"
          type="password"
          icon="password"
          placeholder="输入密码"
          autocomplete="current-password"
          required
          :error="errorMsg && !password ? '请输入密码' : ''"
        />

        <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />

        <AuthButton text="登录" loading-text="登录中..." :loading="loading" />
      </ElForm>

      <SocialLogin />

      <template #footer>
        <nav class="form-footer">
          <ElLink type="primary" :underline="false" @click="router.push('/forgot-password')">
            忘记密码？
          </ElLink>
          <ElDivider direction="vertical" />
          <ElLink type="primary" :underline="false" @click="router.push('/register')">
            创建账号
          </ElLink>
        </nav>

        <aside class="test-hint">
          <ElText type="info" size="small">
            测试账号: admin / merchant / user · 密码: 123456
          </ElText>
        </aside>
      </template>
    </AuthFormCard>
  </AuthLayout>
</template>

<style scoped lang="scss">
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  :deep(.el-link) {
    font-size: 13px;
  }

  :deep(.el-divider--vertical) {
    margin: 0;
    border-color: #3c4043;
  }
}

.test-hint {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;

  :deep(.el-text) {
    font-size: 11px;
    color: #5f6368;
  }
}
</style>
