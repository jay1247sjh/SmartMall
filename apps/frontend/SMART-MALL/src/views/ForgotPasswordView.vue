<script setup lang="ts">
/**
 * ============================================================================
 * 忘记密码页面 (ForgotPasswordView)
 * ============================================================================
 *
 * 【业务职责】
 * 用户忘记密码时的自助找回入口。
 * 通过邮箱发送密码重置链接，用户点击链接后可设置新密码。
 *
 * 【密码重置流程】
 * 1. 用户输入注册时使用的邮箱地址
 * 2. 点击"发送重置链接"
 * 3. 后端验证邮箱是否存在
 * 4. 如果存在，发送包含重置链接的邮件
 * 5. 前端显示成功状态（无论邮箱是否存在，都显示成功，防止邮箱枚举攻击）
 * 6. 用户查收邮件，点击链接跳转到重置密码页面
 * 7. 用户设置新密码
 *
 * 【安全设计】
 * - 无论邮箱是否存在，都返回相同的成功消息
 *   这是为了防止攻击者通过此接口枚举系统中的有效邮箱
 * - 重置链接包含一次性 Token，有效期通常为 24 小时
 * - Token 使用后立即失效，防止重复使用
 *
 * 【页面状态】
 * 页面有两种状态：
 * 1. 表单状态（success=false）：显示邮箱输入表单
 * 2. 成功状态（success=true）：显示发送成功的提示
 *
 * 【设计特点】
 * - 简洁布局：只有一个输入框，降低用户认知负担
 * - 明确引导：成功后提示用户检查收件箱
 * - 便捷返回：提供"返回登录"按钮
 *
 * 【与其他页面的关系】
 * - 从 LoginView 的"忘记密码"链接进入
 * - 成功后可返回 LoginView
 * - 邮件中的链接指向 ResetPasswordView（待实现）
 * ============================================================================
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { passwordApi } from '@/api'
import { ElResult } from 'element-plus'
import { Box, CircleCheck } from '@element-plus/icons-vue'
import { AuthFormCard, AuthInput, AuthButton, AlertMessage } from '@/components'

const router = useRouter()
const { t } = useI18n()

// ============================================================================
// 表单状态
// ============================================================================

/** 邮箱输入值 */
const email = ref('')
/** 是否正在提交请求 */
const loading = ref(false)
/** 错误消息 */
const errorMsg = ref('')
/** 是否发送成功（切换到成功状态） */
const success = ref(false)

// ============================================================================
// 事件处理
// ============================================================================

/**
 * 处理表单提交
 * 验证邮箱格式后调用密码重置 API
 */
async function handleSubmit() {
  // 验证邮箱不为空
  if (!email.value.trim()) {
    errorMsg.value = t('auth.enterEmail')
    return
  }
  
  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    errorMsg.value = t('auth.enterValidEmail')
    return
  }

  loading.value = true
  errorMsg.value = ''
  
  try {
    // 调用忘记密码 API
    // 注意：无论邮箱是否存在，API 都应返回成功，防止邮箱枚举
    await passwordApi.forgotPassword({ email: email.value })
    // 切换到成功状态
    success.value = true
  } catch (error: any) {
    errorMsg.value = error?.message || t('auth.sendFailed')
  } finally {
    loading.value = false
  }
}

/**
 * 返回登录页面
 */
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
            :title="t('auth.emailSent')"
            :sub-title="t('auth.emailSentDesc')"
            class="success-result"
          >
            <template #icon>
              <ElIcon :size="64" class="success-icon">
                <CircleCheck />
              </ElIcon>
            </template>
            <template #extra>
              <ElButton type="primary" @click="goBack">{{ t('auth.backToLogin') }}</ElButton>
            </template>
          </ElResult>
        </template>

        <!-- 表单状态 -->
        <template v-else>
          <AuthFormCard :title="t('auth.forgotPassword')" :description="t('auth.forgotPasswordDesc')">
            <ElForm @submit.prevent="handleSubmit">
              <AuthInput
                id="email"
                v-model="email"
                :label="t('auth.emailAddress')"
                type="email"
                icon="email"
                :placeholder="t('auth.enterEmailPlaceholder')"
                autocomplete="email"
                required
              />

              <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />

              <AuthButton :text="t('auth.sendResetLink')" :loading-text="t('auth.sending')" :loading="loading" />
            </ElForm>

            <template #footer>
              <nav class="form-footer">
                <ElButton text @click="goBack">← {{ t('auth.backToLogin') }}</ElButton>
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

.forgot-password-page {
  min-height: 100vh;
  display: flex;
  background-color: var(--bg-primary);

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
          background: linear-gradient(135deg, var(--accent-muted) 0%, rgba(196, 181, 253, 0.15) 100%);
          border: 1px solid var(--border-muted);
          border-radius: $radius-lg;
          color: var(--accent-primary);
        }
      }
    }
  }

  .form-footer {
    @include flex-center-x;

    :deep(.el-button) {
      color: var(--accent-primary);
      font-size: $font-size-sm;

      &:hover {
        color: var(--accent-hover);
      }
    }
  }

  .success-result {
    text-align: center;

    .success-icon {
      color: var(--success);
    }

    :deep(.el-result__title) {
      color: var(--text-primary);
    }

    :deep(.el-result__subtitle) {
      color: var(--text-secondary);
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
  .forgot-password-page .form-panel {
    padding: $space-8 $space-6;

    .form-container {
      max-width: 100%;
    }
  }
}
</style>
