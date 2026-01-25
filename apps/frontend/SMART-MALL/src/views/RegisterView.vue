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
import { registerApi } from '@/api'
import {
  AuthLayout,
  AuthFormCard,
  AuthInput,
  AuthButton,
  AlertMessage,
  FeatureList,
} from '@/components'

const router = useRouter()

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
const features = [
  '免费注册，即刻体验',
  '3D 商城可视化管理',
  'AI 智能助手随时待命',
]

// ============================================================================
// 表单验证（计算属性）
// ============================================================================

/**
 * 用户名验证错误信息
 * 验证规则：3-20字符，只能包含字母、数字、下划线，且未被注册
 */
const usernameError = computed(() => {
  if (!username.value) return ''
  if (username.value.length < 3) return '用户名至少3个字符'
  if (username.value.length > 20) return '用户名最多20个字符'
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) return '只能包含字母、数字和下划线'
  if (usernameAvailable.value === false) return '用户名已被注册'
  return ''
})

/**
 * 邮箱验证错误信息
 * 验证规则：标准邮箱格式，且未被注册
 */
const emailError = computed(() => {
  if (!email.value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return '邮箱格式不正确'
  if (emailAvailable.value === false) return '邮箱已被注册'
  return ''
})

/**
 * 密码验证错误信息
 * 验证规则：至少6字符
 */
const passwordError = computed(() => {
  if (!password.value) return ''
  if (password.value.length < 6) return '密码至少6个字符'
  return ''
})

/**
 * 确认密码验证错误信息
 * 验证规则：必须与密码一致
 */
const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return ''
  if (confirmPassword.value !== password.value) return '两次密码不一致'
  return ''
})

/**
 * 手机号验证错误信息
 * 验证规则：11位中国大陆手机号（1开头，第二位3-9）
 */
const phoneError = computed(() => {
  if (!phone.value) return ''
  if (!/^1[3-9]\d{9}$/.test(phone.value)) return '手机号格式不正确'
  return ''
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
      phone: phone.value || undefined, // 空字符串转为 undefined
    })
    
    successMsg.value = '注册成功！即将跳转到登录页面...'
    // 2秒后跳转到登录页，给用户时间看到成功消息
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
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;

  :deep(.el-text) {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  :deep(.el-link) {
    font-size: $font-size-sm;
  }
}
</style>
