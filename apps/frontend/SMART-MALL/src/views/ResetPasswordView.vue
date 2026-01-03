<script setup lang="ts">
/**
 * 重置密码页面
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { passwordApi } from '@/api'
import { ElForm, ElButton, ElIcon, ElResult, ElSkeleton } from 'element-plus'
import { Box, CircleCheck, CircleClose } from '@element-plus/icons-vue'
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
  <main class="reset-password-page">
    <section class="form-panel">
      <div class="form-panel-bg"></div>
      
      <article class="form-container">
        <header class="form-logo">
          <ElIcon :size="24" class="logo-icon">
            <Box />
          </ElIcon>
        </header>

        <!-- 加载状态 -->
        <template v-if="verifying">
          <ElSkeleton :rows="5" animated class="loading-skeleton" />
          <p class="loading-text">正在验证重置链接...</p>
        </template>

        <!-- 令牌无效 -->
        <template v-else-if="!tokenValid && !success">
          <ElResult
            icon="error"
            title="链接无效"
            :sub-title="errorMsg || '重置链接已过期或无效，请重新申请'"
            class="status-result error"
          >
            <template #icon>
              <ElIcon :size="64" class="error-icon">
                <CircleClose />
              </ElIcon>
            </template>
            <template #extra>
              <ElButton type="primary" @click="goToForgotPassword">重新申请</ElButton>
            </template>
          </ElResult>
        </template>

        <!-- 成功状态 -->
        <template v-else-if="success">
          <ElResult
            icon="success"
            title="密码已重置"
            sub-title="您的密码已成功重置，请使用新密码登录"
            class="status-result success"
          >
            <template #icon>
              <ElIcon :size="64" class="success-icon">
                <CircleCheck />
              </ElIcon>
            </template>
            <template #extra>
              <ElButton type="primary" @click="goToLogin">前往登录</ElButton>
            </template>
          </ElResult>
        </template>

        <!-- 表单状态 -->
        <template v-else>
          <AuthFormCard title="重置密码" description="请输入您的新密码">
            <ElForm @submit.prevent="handleSubmit">
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
            </ElForm>

            <template #footer>
              <nav class="form-footer">
                <ElButton text @click="goToLogin">← 返回登录</ElButton>
              </nav>
            </template>
          </AuthFormCard>
        </template>
      </article>
    </section>
  </main>
</template>

<style scoped lang="scss">
.reset-password-page {
  min-height: 100vh;
  display: flex;
  background-color: #0a0a0a;

  .form-panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 64px;
    position: relative;
    overflow: hidden;

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

      .form-logo {
        display: flex;
        justify-content: center;
        margin-bottom: 32px;

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
      }
    }
  }

  .loading-skeleton {
    padding: 20px;
  }

  .loading-text {
    text-align: center;
    font-size: 14px;
    color: #9aa0a6;
    margin-top: 16px;
  }

  .form-footer {
    display: flex;
    justify-content: center;

    :deep(.el-button) {
      color: #8ab4f8;
      font-size: 13px;

      &:hover {
        color: #aecbfa;
      }
    }
  }

  .status-result {
    text-align: center;

    &.success .success-icon {
      color: #34d399;
    }

    &.error .error-icon {
      color: #f28b82;
    }

    :deep(.el-result__title) {
      color: #e8eaed;
    }

    :deep(.el-result__subtitle) {
      color: #9aa0a6;
    }

    :deep(.el-button) {
      background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
      border: none;
      border-radius: 10px;
      padding: 12px 32px;
    }
  }
}

@media (max-width: 768px) {
  .reset-password-page .form-panel {
    padding: 32px 24px;

    .form-container {
      max-width: 100%;
    }
  }
}
</style>
