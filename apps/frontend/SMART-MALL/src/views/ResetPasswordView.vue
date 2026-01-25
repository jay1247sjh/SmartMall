<script setup lang="ts">
/**
 * ============================================================================
 * ResetPasswordView.vue - 重置密码页面
 * ============================================================================
 * 
 * 【页面职责】
 * 处理用户通过邮件链接重置密码的流程。
 * 用户点击邮件中的重置链接后会跳转到此页面。
 * 
 * 【业务流程】
 * 1. 用户在"忘记密码"页面提交邮箱
 * 2. 系统发送包含重置链接的邮件
 * 3. 用户点击邮件中的链接，跳转到此页面
 * 4. 页面验证 URL 中的 token 是否有效
 * 5. 用户输入新密码并提交
 * 6. 系统更新密码，用户可以使用新密码登录
 * 
 * 【页面状态】
 * - verifying: 正在验证 token
 * - tokenValid=false: token 无效或过期
 * - tokenValid=true: 显示重置密码表单
 * - success: 密码重置成功
 * 
 * 【安全考虑】
 * - Token 有时效性，过期后需要重新申请
 * - 密码长度至少 6 位
 * - 需要二次确认密码
 * 
 * 【设计原则】
 * 1. Element Plus 组件优先
 * 2. HTML5 语义化标签
 * 3. SCSS 嵌套语法
 * 
 * 【与其他模块的关系】
 * - api/password.api.ts：调用密码重置接口
 * - views/ForgotPasswordView.vue：发起重置请求的页面
 * - views/LoginView.vue：重置成功后跳转的页面
 * 
 * 【访问路径】
 * /reset-password?token=xxx
 * 
 * ============================================================================
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
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.reset-password-page {
  min-height: 100vh;
  display: flex;
  background-color: $color-bg-primary;

  .form-panel {
    flex: 1;
    @include flex-center;
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
        @include flex-center-x;
        margin-bottom: $space-8;

        .logo-icon {
          width: 48px;
          height: 48px;
          @include flex-center;
          background: linear-gradient(135deg, $color-primary-muted 0%, rgba($color-accent-violet, 0.15) 100%);
          border: 1px solid $color-border-muted;
          border-radius: $radius-lg;
          color: $color-accent-blue;
        }
      }
    }
  }

  .loading-skeleton {
    padding: $space-5;
  }

  .loading-text {
    text-align: center;
    font-size: $font-size-base;
    color: $color-text-secondary;
    margin-top: $space-4;
  }

  .form-footer {
    @include flex-center-x;

    :deep(.el-button) {
      color: $color-accent-blue;
      font-size: $font-size-sm;

      &:hover {
        color: $color-accent-blue-hover;
      }
    }
  }

  .status-result {
    text-align: center;

    &.success .success-icon {
      color: $color-success;
    }

    &.error .error-icon {
      color: $color-error;
    }

    :deep(.el-result__title) {
      color: $color-text-primary;
    }

    :deep(.el-result__subtitle) {
      color: $color-text-secondary;
    }

    :deep(.el-button) {
      background: $gradient-primary;
      border: none;
      border-radius: 10px;
      padding: $space-3 $space-8;
    }
  }
}

@media (max-width: 768px) {
  .reset-password-page .form-panel {
    padding: $space-8 $space-6;

    .form-container {
      max-width: 100%;
    }
  }
}
</style>
