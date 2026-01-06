/**
 * 认证相关组件模块
 *
 * 这个模块包含用户认证流程中使用的所有 UI 组件，
 * 用于登录、注册、密码重置等页面。
 *
 * 设计原则：
 * - 组件化：每个组件专注于单一功能
 * - 可复用：组件可以在不同认证页面中复用
 * - 一致性：统一的视觉风格和交互体验
 *
 * 包含的组件：
 *
 * 1. 布局组件
 *    - AuthLayout：认证页面的整体布局（左侧品牌区 + 右侧表单区）
 *    - AuthFormCard：表单卡片容器（标题、描述、表单内容）
 *
 * 2. 表单组件
 *    - AuthInput：带图标和验证的输入框
 *    - AuthButton：主要操作按钮（登录、注册、提交）
 *
 * 3. 反馈组件
 *    - AlertMessage：错误/成功/警告提示消息
 *
 * 4. 装饰组件
 *    - TypewriterCard：打字机效果的品牌展示卡片
 *    - FeatureList：功能特性列表
 *    - SocialLogin：第三方登录按钮组
 *
 * 使用示例：
 * ```vue
 * <template>
 *   <AuthLayout>
 *     <AuthFormCard title="登录" description="欢迎回来">
 *       <AuthInput v-model="email" type="email" placeholder="邮箱" />
 *       <AuthInput v-model="password" type="password" placeholder="密码" />
 *       <AuthButton @click="handleLogin">登录</AuthButton>
 *     </AuthFormCard>
 *   </AuthLayout>
 * </template>
 * ```
 */
export { default as AuthLayout } from './AuthLayout.vue'
export { default as AuthFormCard } from './AuthFormCard.vue'
export { default as AuthInput } from './AuthInput.vue'
export { default as AuthButton } from './AuthButton.vue'
export { default as AlertMessage } from './AlertMessage.vue'
export { default as TypewriterCard } from './TypewriterCard.vue'
export { default as SocialLogin } from './SocialLogin.vue'
export { default as FeatureList } from './FeatureList.vue'
