<script setup lang="ts">
/**
 * ============================================================================
 * 用户注册页面 (RegisterView)
 * ============================================================================
 *
 * 【业务职责】
 * 新用户注册入口，收集用户信息并创建账号。
 * 注册成功后自动跳转到登录页面。
 *
 * 【注册流程】
 * 1. 用户填写注册表单（用户名、邮箱、密码、手机号）
 * 2. 前端实时验证格式 + 异步检查用户名/邮箱是否已被注册
 * 3. 用户点击"创建账号"
 * 4. 调用注册 API
 * 5. 注册成功 → 显示成功消息 → 2秒后跳转登录页
 * 6. 注册失败 → 显示错误消息
 *
 * 【表单字段说明】
 * - 用户名（必填）：3-20字符，只能包含字母、数字、下划线
 * - 邮箱（必填）：标准邮箱格式，用于账号验证和密码找回
 * - 密码（必填）：至少6字符
 * - 确认密码（必填）：必须与密码一致
 * - 手机号（选填）：11位中国大陆手机号
 *
 * 【实时可用性检查】
 * 为了提升用户体验，在用户输入时实时检查：
 * - 用户名是否已被注册（输入停止 500ms 后检查）
 * - 邮箱是否已被注册（输入停止 500ms 后检查）
 * 使用防抖（debounce）避免频繁请求。
 *
 * 【验证状态显示】
 * AuthInput 组件支持三种状态：
 * - checking=true：显示加载动画，表示正在检查
 * - valid=true：显示绿色勾，表示可用
 * - error 有值：显示红色错误信息
 *
 * 【设计原则】
 * 1. Element Plus 优先 - ElForm、ElText、ElLink
 * 2. 组件复用 - 使用 AuthLayout、AuthFormCard 等认证组件
 * 3. 即时反馈 - 实时验证，减少提交后才发现错误的挫败感
 *
 * 【安全考虑】
 * - 密码字段使用 type="password"，不显示明文
 * - autocomplete 属性帮助密码管理器正确识别字段
 * - 前端验证只是辅助，后端会再次验证所有数据
 * ============================================================================
 */
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { registerApi } from '@/api'
import {
  AuthLayout,
  AuthFormCard,
  AuthInput,
  AuthButton,
  AlertMessage,
  FeatureList,
} from '@/components'
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validatePhone,
} from '@/utils/validators'

const router = useRouter()
const { t } = useI18n()

// ============================================================================
// 表单状态
// ============================================================================

/** 用户名输入值 */
const username = ref('')
/** 邮箱输入值 */
const email = ref('')
/** 密码输入值 */
const password = ref('')
/** 确认密码输入值 */
const confirmPassword = ref('')
/** 手机号输入值（选填） */
const phone = ref('')
/** 用户类型（默认普通用户） */
const userType = ref<'USER' | 'MERCHANT'>('USER')

/** 角色选项 */
const roleOptions = computed(() => [
  { value: 'USER' as const, label: t('auth.roleUser'), description: t('auth.roleUserDesc') },
  { value: 'MERCHANT' as const, label: t('auth.roleMerchant'), description: t('auth.roleMerchantDesc') },
])

// ============================================================================
// UI 状态
// ============================================================================

/** 是否正在提交注册请求 */
const loading = ref(false)
/** 错误消息（显示在表单底部） */
const errorMsg = ref('')
/** 成功消息（注册成功后显示） */
const successMsg = ref('')

// ============================================================================
// 可用性检查状态
// ============================================================================

/** 是否正在检查用户名可用性 */
const usernameChecking = ref(false)
/** 用户名是否可用（null=未检查，true=可用，false=已被注册） */
const usernameAvailable = ref<boolean | null>(null)
/** 是否正在检查邮箱可用性 */
const emailChecking = ref(false)
/** 邮箱是否可用 */
const emailAvailable = ref<boolean | null>(null)

/** 用户名检查防抖定时器 */
let usernameTimer: number | null = null
/** 邮箱检查防抖定时器 */
let emailTimer: number | null = null

// ============================================================================
// 品牌展示内容
// ============================================================================

/** 左侧功能特性列表 */
const features = computed(() => [
  t('auth.featureFree'),
  t('auth.feature3D'),
  t('auth.featureAI'),
])

// ============================================================================
// 表单验证（计算属性）
// ============================================================================

/**
 * 用户名验证错误信息
 * 验证规则：3-20字符，只能包含字母、数字、下划线，且未被注册
 */
const usernameError = computed(() => {
  const formatError = validateUsername(username.value)
  if (formatError) return formatError
  if (usernameAvailable.value === false) return t('auth.usernameTaken')
  return ''
})

/**
 * 邮箱验证错误信息
 * 验证规则：标准邮箱格式，且未被注册
 */
const emailError = computed(() => {
  const formatError = validateEmail(email.value)
  if (formatError) return formatError
  if (emailAvailable.value === false) return t('auth.emailTaken')
  return ''
})

/**
 * 密码验证错误信息
 * 验证规则：至少6字符
 */
const passwordError = computed(() => {
  return validatePassword(password.value)
})

/**
 * 确认密码验证错误信息
 * 验证规则：必须与密码一致
 */
const confirmPasswordError = computed(() => {
  return validateConfirmPassword(confirmPassword.value, password.value)
})

/**
 * 手机号验证错误信息
 * 验证规则：11位中国大陆手机号（1开头，第二位3-9）
 */
const phoneError = computed(() => {
  return validatePhone(phone.value)
})

/**
 * 表单是否有效（可以提交）
 * 条件：必填字段都有值 + 无格式错误 + 用户名邮箱可用
 */
const isFormValid = computed(() => {
  const hasRequiredFields = username.value && email.value && password.value && confirmPassword.value
  const noFormatErrors = !usernameError.value && !emailError.value && !passwordError.value && !confirmPasswordError.value && !phoneError.value
  const availabilityOk = usernameAvailable.value !== false && emailAvailable.value !== false
  return hasRequiredFields && noFormatErrors && availabilityOk
})

// ============================================================================
// 可用性检查（防抖）
// ============================================================================

/**
 * 监听用户名变化，防抖检查可用性
 * 只有当用户名格式正确时才发起检查请求
 */
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
    }, 500) // 500ms 防抖延迟
  }
})

/**
 * 监听邮箱变化，防抖检查可用性
 * 只有当邮箱格式正确时才发起检查请求
 */
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
    }, 500) // 500ms 防抖延迟
  }
})

// ============================================================================
// 事件处理
// ============================================================================

/**
 * 处理注册表单提交
 * 验证通过后调用注册 API，成功则跳转登录页
 */
async function handleRegister() {
  if (!isFormValid.value) {
    errorMsg.value = t('auth.checkForm')
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
      phone: phone.value || undefined, // 空字符串转为 undefined
      userType: userType.value,
    })
    
    successMsg.value = t('auth.registerSuccess')
    // 2秒后跳转到登录页，给用户时间看到成功消息
    setTimeout(() => router.push('/login'), 2000)
  } catch (error: any) {
    errorMsg.value = error?.message || t('auth.registerFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout
    :brand-headline="t('auth.brandHeadline')"
    :brand-subtitle="t('auth.brandSubtitle')"
  >
    <template #brand-extra>
      <FeatureList :features="features" />
    </template>

    <AuthFormCard :title="t('auth.createAccount')" :description="t('auth.createAccountDesc')">
      <ElForm @submit.prevent="handleRegister">
        <div class="role-selector">
          <label class="role-selector__label">{{ t('auth.registerRole') }}</label>
          <div class="role-selector__options">
            <div
              v-for="option in roleOptions"
              :key="option.value"
              class="role-option"
              :class="{ active: userType === option.value }"
              @click="userType = option.value"
            >
              <span class="role-option__label">{{ option.label }}</span>
              <span class="role-option__desc">{{ option.description }}</span>
            </div>
          </div>
        </div>

        <AuthInput
          id="username"
          v-model="username"
          :label="t('auth.username')"
          icon="user"
          :placeholder="t('auth.usernamePlaceholder')"
          autocomplete="username"
          required
          :error="usernameError"
          :checking="usernameChecking"
          :valid="usernameAvailable === true"
        />

        <AuthInput
          id="email"
          v-model="email"
          :label="t('auth.email')"
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
          :label="t('auth.password')"
          type="password"
          icon="password"
          :placeholder="t('auth.passwordPlaceholder')"
          autocomplete="new-password"
          required
          :error="passwordError"
        />

        <AuthInput
          id="confirmPassword"
          v-model="confirmPassword"
          :label="t('auth.confirmPassword')"
          type="password"
          icon="password"
          :placeholder="t('auth.confirmPasswordPlaceholder')"
          autocomplete="new-password"
          required
          :error="confirmPasswordError"
        />

        <AuthInput
          id="phone"
          v-model="phone"
          :label="t('auth.phone')"
          type="tel"
          icon="phone"
          :placeholder="t('auth.phonePlaceholder')"
          autocomplete="tel"
          :error="phoneError"
        />

        <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />
        <AlertMessage v-if="successMsg" type="success" :message="successMsg" />

        <AuthButton 
          :text="t('auth.createAccount')" 
          :loading-text="t('auth.registering')" 
          :loading="loading" 
          :disabled="!isFormValid" 
        />
      </ElForm>

      <template #footer>
        <nav class="form-footer">
          <ElText type="info" size="small">{{ t('auth.haveAccount') }}</ElText>
          <ElLink type="primary" :underline="false" @click="router.push('/login')">
            {{ t('auth.loginNow') }}
          </ElLink>
        </nav>
      </template>
    </AuthFormCard>
  </AuthLayout>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// Role Selector
// ============================================================================
.role-selector {
  margin-bottom: $space-4;

  &__label {
    display: block;
    margin-bottom: $space-2;
    font-size: $font-size-sm;
    color: var(--text-secondary);
  }

  &__options {
    display: flex;
    gap: $space-3;
  }
}

.role-option {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: $space-1;
  padding: $space-3 $space-4;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  background: transparent;
  cursor: pointer;
  transition: all $duration-normal $ease-default;

  &:hover {
    border-color: var(--border-muted);
    background: rgba(var(--text-primary-rgb), 0.04);
  }

  &.active {
    border-color: var(--accent-primary);
    background: rgba(var(--accent-primary-rgb), 0.15);
  }

  &__label {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: var(--text-primary);
  }

  &__desc {
    font-size: $font-size-sm;
    color: var(--text-muted);
  }
}

.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;

  :deep(.el-text) {
    font-size: $font-size-sm;
    color: var(--text-secondary);
  }

  :deep(.el-link) {
    font-size: $font-size-sm;
  }
}
</style>
