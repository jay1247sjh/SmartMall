<script setup lang="ts">
/**
 * 忘记密码页面
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { passwordApi } from '@/api'
import { ElForm, ElButton, ElIcon, ElResult } from 'element-plus'
import { Box, CircleCheck } from '@element-plus/icons-vue'
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
  <main class="forgot-password-page">
    <section class="form-panel">
      <div class="form-panel-bg"></div>
      
      <article class="form-container">
        <header class="form-logo">
          <ElIcon :size="24" class="logo-icon">
            <Box />
          </ElIcon>
        </header>

        <!-- 成功状态 -->
        <template v-if="success">
          <ElResult
            icon="success"
            title="邮件已发送"
            sub-title="如果该邮箱已注册，您将收到一封包含密码重置链接的邮件。请检查您的收件箱。"
            class="success-result"
          >
            <template #icon>
              <ElIcon :size="64" class="success-icon">
                <CircleCheck />
              </ElIcon>
            </template>
            <template #extra>
              <ElButton type="primary" @click="goBack">返回登录</ElButton>
            </template>
          </ElResult>
        </template>

        <!-- 表单状态 -->
        <template v-else>
          <AuthFormCard title="忘记密码" description="输入您的邮箱地址，我们将发送密码重置链接">
            <ElForm @submit.prevent="handleSubmit">
              <AuthInput
                id="email"
                v-model="email"
                label="邮箱地址"
                type="email"
                icon="email"
                placeholder="输入邮箱地址"
                autocomplete="email"
                required
              />

              <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />

              <AuthButton text="发送重置链接" loading-text="发送中..." :loading="loading" />
            </ElForm>

            <template #footer>
              <nav class="form-footer">
                <ElButton text @click="goBack">← 返回登录</ElButton>
              </nav>
            </template>
          </AuthFormCard>
        </template>
      </article>
    </section>
  </main>
</template>

<style scoped lang="scss">
.forgot-password-page {
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

  .success-result {
    text-align: center;

    .success-icon {
      color: #34d399;
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
  .forgot-password-page .form-panel {
    padding: 32px 24px;

    .form-container {
      max-width: 100%;
    }
  }
}
</style>
