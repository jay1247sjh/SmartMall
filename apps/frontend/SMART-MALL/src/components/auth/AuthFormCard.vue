<script setup lang="ts">
/**
 * ============================================================================
 * 认证表单卡片组件 (AuthFormCard.vue)
 * ============================================================================
 * 
 * 【组件职责】
 * 为认证表单提供统一的卡片容器，包含：
 * - 标题区域（标题 + 描述）
 * - 表单内容区域（默认插槽）
 * - 底部区域（footer 插槽）
 * 
 * 【组件结构】
 * ┌─────────────────────────────────┐
 * │         欢迎回来                 │  ← 标题 (h2)
 * │    登录以继续使用 Smart Mall     │  ← 描述 (p)
 * ├─────────────────────────────────┤
 * │  ┌─────────────────────────┐   │
 * │  │                         │   │
 * │  │      表单内容区域        │   │  ← 默认插槽
 * │  │      (ElCard)           │   │
 * │  │                         │   │
 * │  └─────────────────────────┘   │
 * ├─────────────────────────────────┤
 * │      忘记密码？ | 创建账号       │  ← footer 插槽
 * └─────────────────────────────────┘
 * 
 * 【设计原则】
 * - 使用 HTML5 语义化标签（article, header, hgroup, footer）
 * - 使用 Element Plus ElCard 组件
 * - 深色主题，半透明背景
 * 
 * 【使用示例】
 * ```vue
 * <AuthFormCard title="欢迎回来" description="登录以继续使用 Smart Mall">
 *   <ElForm @submit.prevent="handleLogin">
 *     <AuthInput v-model="username" label="用户名" />
 *     <AuthInput v-model="password" label="密码" type="password" />
 *     <AuthButton text="登录" :loading="loading" />
 *   </ElForm>
 *   
 *   <template #footer>
 *     <ElLink @click="router.push('/register')">创建账号</ElLink>
 *   </template>
 * </AuthFormCard>
 * ```
 * 
 * ============================================================================
 */

import { ElCard } from 'element-plus'

/**
 * 组件属性
 * 
 * @property title - 卡片标题，如"欢迎回来"、"创建账号"
 * @property description - 卡片描述，可选，如"登录以继续使用 Smart Mall"
 */
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <!--
    ============================================================================
    卡片主容器
    ============================================================================
    
    使用 <article> 语义化标签，表示独立的内容块
    整个表单卡片是一个完整的、可独立理解的内容单元
  -->
  <article class="auth-form-card">
    <!--
      ============================================================================
      标题区域
      ============================================================================
      
      使用 <header> 表示内容的头部
      使用 <hgroup> 将标题和描述组合在一起
    -->
    <header class="form-header">
      <hgroup>
        <!-- 主标题 -->
        <h2>{{ title }}</h2>
        <!-- 描述文字（可选） -->
        <p v-if="description">{{ description }}</p>
      </hgroup>
    </header>

    <!--
      ============================================================================
      表单内容区域
      ============================================================================
      
      使用 Element Plus 的 ElCard 组件作为容器
      shadow="never" 不显示阴影，保持简洁
      
      默认插槽用于放置表单元素：
      - AuthInput 输入框
      - AlertMessage 错误提示
      - AuthButton 提交按钮
      - SocialLogin 第三方登录
    -->
    <ElCard shadow="never" class="form-body">
      <slot></slot>
    </ElCard>

    <!--
      ============================================================================
      底部区域
      ============================================================================
      
      使用 <footer> 表示内容的底部
      v-if="$slots.footer" 只在有内容时渲染
      
      footer 插槽用于放置：
      - 忘记密码链接
      - 注册/登录链接
      - 测试账号提示
    -->
    <footer v-if="$slots.footer" class="form-footer-slot">
      <slot name="footer"></slot>
    </footer>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.auth-form-card {
  width: 100%;

  /* 标题区域 */
  .form-header {
    text-align: center;
    margin-bottom: 28px;

    hgroup {
      h2 {
        font-size: 26px;
        font-weight: $font-weight-medium;
        color: $color-text-primary;
        margin: 0 0 $space-2 0;
      }

      p {
        font-size: $font-size-base;
        color: $color-text-secondary;
        margin: 0;
      }
    }
  }

  /* 表单内容区域 */
  .form-body {
    background: $color-bg-hover;
    border: 1px solid rgba($color-white, 0.08);
    border-radius: $radius-xl;

    :deep(.el-card__body) {
      padding: 28px;
    }
  }

  /* 底部区域 */
  .form-footer-slot {
    margin-top: $space-6;
  }
}
</style>
