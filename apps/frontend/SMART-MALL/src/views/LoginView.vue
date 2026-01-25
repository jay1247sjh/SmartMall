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
import { useUserStore } from '@/stores'
import { authApi } from '@/api'
import { ElForm, ElText, ElLink, ElDivider } from 'element-plus'
import {
  AuthLayout,        // 认证页面统一布局（左侧品牌区 + 右侧表单区）
  AuthFormCard,      // 表单卡片容器
  AuthInput,         // 带图标和验证状态的输入框
  AuthButton,        // 带加载状态的主按钮
  AlertMessage,      // 错误/成功提示
  TypewriterCard,    // 打字机效果卡片（展示产品特性）
  SocialLogin,       // 第三方登录按钮组（微信、GitHub 等）
} from '@/components'

// ============================================================================
// 路由和状态管理
// ============================================================================

const router = useRouter()  // 用于页面跳转
const route = useRoute()    // 用于获取当前路由信息（如 redirect 参数）
const userStore = useUserStore()  // Pinia 用户状态管理

// ============================================================================
// 表单状态
// ============================================================================

/**
 * 用户名输入值
 * 使用 ref 创建响应式变量，当值变化时 Vue 会自动更新 UI
 */
const username = ref('')

/**
 * 密码输入值
 * 注意：密码不做 trim() 处理，因为空格可能是密码的一部分
 */
const password = ref('')

/**
 * 加载状态
 * true 时禁用登录按钮，防止重复提交
 */
const loading = ref(false)

/**
 * 错误消息
 * 用于显示登录失败的原因
 */
const errorMsg = ref('')

// ============================================================================
// 产品特性文案
// ============================================================================

/**
 * 打字机效果展示的文案列表
 * 
 * 【业务目的】
 * 在登录页左侧展示产品核心卖点，吸引用户注意力
 * 打字机效果增加动态感，让页面更有生命力
 * 
 * 【文案策略】
 * 1. 3D 可视化 - 核心技术亮点
 * 2. AI 助手 - 智能化卖点
 * 3. 数据分析 - 商业价值
 * 4. 拖拽编辑 - 易用性
 * 5. 多端协同 - 便捷性
 */
const featureTexts = [
  '通过 3D 可视化技术，让商城管理变得直观高效',
  '智能 AI 助手随时待命，一句话完成复杂操作',
  '实时数据分析，洞察每一个商业机会',
  '拖拽式店铺编辑，所见即所得的空间设计',
  '多端协同工作，随时随地掌控全局',
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
 * - 网络错误：显示"登录失败，请重试"
 * - 认证失败：显示后端返回的错误消息（如"用户名或密码错误"）
 */
async function handleLogin() {
  // ========================================
  // 第一步：前端验证
  // ========================================
  
  /**
   * 用户名验证
   * - 使用 trim() 去除首尾空格，因为用户名不应该包含空格
   * - 如果用户输入 "  " (纯空格)，trim() 后变成 ""，验证不通过
   */
  if (!username.value.trim()) { 
    errorMsg.value = '请输入用户名'
    return  // 提前返回，不继续执行
  }
  
  /**
   * 密码验证
   * - 不使用 trim()，因为密码中的空格可能是有意义的
   * - 只检查是否为空
   */
  if (!password.value) { 
    errorMsg.value = '请输入密码'
    return 
  }

  // ========================================
  // 第二步：准备发送请求
  // ========================================
  
  loading.value = true   // 显示加载状态，禁用按钮
  errorMsg.value = ''    // 清除之前的错误消息
  
  try {
    // ========================================
    // 第三步：调用登录 API
    // ========================================
    
    /**
     * 发送登录请求到后端
     * 
     * 请求体：{ username: string, password: string }
     * 响应体：{
     *   user: UserInfo,           // 用户基本信息
     *   accessToken: string,      // 访问令牌（短期有效，如 15 分钟）
     *   refreshToken: string,     // 刷新令牌（长期有效，如 7 天）
     *   merchant?: MerchantInfo   // 商户信息（仅商户角色有）
     * }
     */
    const response = await authApi.login({ 
      username: username.value, 
      password: password.value 
    })
    
    // ========================================
    // 第四步：存储登录状态
    // ========================================
    
    /**
     * 保存用户信息和 Token
     * - 存储到 Pinia store（内存中，页面刷新会丢失）
     * - 同时持久化到 localStorage（刷新页面后可恢复）
     */
    userStore.setUser(response.user, response.accessToken, response.refreshToken)
    
    /**
     * 如果是商户用户，额外保存商户信息
     * 
     * 【业务说明】
     * 商户用户除了基本的用户信息外，还有：
     * - merchantId: 商户唯一标识
     * - companyName: 公司名称
     * - authorizedAreaIds: 被授权的商城区域列表
     */
    if (response.merchant) {
      userStore.setMerchantInfo(response.merchant)
    }
    
    // ========================================
    // 第五步：页面跳转
    // ========================================
    
    /**
     * 登录后重定向逻辑
     * 
     * 【场景说明】
     * 用户可能从其他页面被重定向到登录页，例如：
     * 1. 用户访问 /admin/dashboard
     * 2. 路由守卫发现未登录，重定向到 /login?redirect=/admin/dashboard
     * 3. 用户登录成功后，应该跳转回 /admin/dashboard 而不是默认首页
     * 
     * 【安全检查】
     * - redirect !== '/login'：防止无限循环
     * - 如果没有 redirect 参数，默认跳转到 /mall（商城首页）
     */
    const redirect = route.query.redirect as string
    router.push(redirect && redirect !== '/login' ? redirect : '/mall')
    
  } catch (error: any) {
    // ========================================
    // 错误处理
    // ========================================
    
    /**
     * 显示错误消息
     * - 优先使用后端返回的错误消息（如"用户名或密码错误"）
     * - 如果没有，显示通用错误消息
     */
    errorMsg.value = error?.message || '登录失败，请重试'
    
  } finally {
    // ========================================
    // 清理工作
    // ========================================
    
    /**
     * 无论成功还是失败，都要恢复按钮状态
     * finally 块保证这段代码一定会执行
     */
    loading.value = false
  }
}
</script>

<template>
  <!--
    ============================================================================
    页面布局结构
    ============================================================================
    
    AuthLayout 提供左右分栏布局：
    - 左侧：品牌展示区（标题、副标题、打字机效果）
    - 右侧：登录表单区
    
    这种布局在 SaaS 产品中很常见，如 Notion、Figma 的登录页
  -->
  <AuthLayout
    brand-headline="重新定义商城管理的可能性"
    brand-subtitle="融合 3D 可视化与 AI 智能，打造下一代商业空间管理平台"
  >
    <!-- 
      品牌区额外内容：打字机效果卡片
      展示产品特性，增加页面动态感
    -->
    <template #brand-extra>
      <TypewriterCard :texts="featureTexts" />
    </template>

    <!--
      登录表单卡片
      - title: 卡片标题
      - description: 卡片描述
    -->
    <AuthFormCard title="欢迎回来" description="登录以继续使用 Smart Mall">
      <!--
        表单元素
        @submit.prevent 阻止表单默认提交行为，改用 handleLogin 处理
      -->
      <ElForm @submit.prevent="handleLogin">
        <!--
          用户名输入框
          - v-model: 双向绑定到 username 变量
          - icon: 显示用户图标
          - autocomplete: 浏览器自动填充提示
          - :error: 动态显示验证错误
        -->
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

        <!--
          密码输入框
          - type="password": 密码类型，显示为圆点
          - autocomplete="current-password": 提示浏览器这是当前密码
        -->
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

        <!--
          错误提示
          只在有错误消息时显示
        -->
        <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />

        <!--
          登录按钮
          - :loading: 加载状态时显示 loading-text 并禁用按钮
        -->
        <AuthButton text="登录" loading-text="登录中..." :loading="loading" />
      </ElForm>

      <!--
        第三方登录
        提供微信、GitHub 等社交账号登录选项
      -->
      <SocialLogin />

      <!--
        表单底部区域
        - 忘记密码链接
        - 注册链接
        - 测试账号提示
      -->
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

        <!--
          测试账号提示
          
          【业务说明】
          提供三种角色的测试账号，方便体验不同角色的功能：
          - admin: 管理员，可以管理整个商城
          - merchant: 商户，可以管理自己的店铺
          - user: 普通用户，可以浏览商城
        -->
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
    border-color: $color-text-muted;
  }
}

// 测试账号提示区域
.test-hint {
  margin-top: $space-5;
  padding-top: $space-5;
  border-top: 1px solid $color-border-subtle;
  text-align: center;

  :deep(.el-text) {
    font-size: $font-size-xs + 1;
    color: $color-text-muted;
  }
}
</style>
