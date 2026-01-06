<script setup lang="ts">
/**
 * ============================================================================
 * 第三方社交登录组件 (SocialLogin)
 * ============================================================================
 *
 * 【业务职责】
 * 提供第三方账号快捷登录入口，降低用户注册/登录门槛。
 * 支持国内外主流社交平台，覆盖不同用户群体。
 *
 * 【支持的登录方式】
 * 1. 微信登录 - 面向国内用户，最常用的社交登录方式
 * 2. GitHub 登录 - 面向开发者用户，技术社区常用
 * 3. Google 登录 - 面向国际用户，全球通用
 *
 * 【设计原则】
 * 1. Element Plus 优先 - 使用 ElButton、ElDivider、ElSpace
 * 2. HTML5 语义化 - section 包裹区块，nav 标识导航区域
 * 3. 无障碍支持 - aria-label 和 title 属性辅助屏幕阅读器
 *
 * 【OAuth 2.0 流程说明】
 * 点击按钮后，父组件负责：
 * 1. 跳转到第三方授权页面
 * 2. 用户授权后获取 authorization code
 * 3. 后端用 code 换取 access_token
 * 4. 获取用户信息并完成登录/注册
 *
 * 【视觉设计】
 * - 圆形按钮：区别于主要操作按钮，暗示"快捷入口"
 * - 统一尺寸：48x48px，便于触摸操作
 * - 品牌色图标：Google 使用官方四色，其他使用单色
 * - 分隔线"或"：明确这是替代登录方式
 *
 * 【当前状态】
 * 组件已完成 UI 实现，OAuth 集成待后续开发。
 * 点击按钮目前仅触发事件，实际跳转逻辑由父组件实现。
 * ============================================================================
 */

/**
 * 组件事件定义
 *
 * @event wechat - 微信登录按钮点击
 *   - 触发微信 OAuth 授权流程
 *   - 需要在微信开放平台注册应用
 *
 * @event github - GitHub 登录按钮点击
 *   - 触发 GitHub OAuth 授权流程
 *   - 需要在 GitHub Developer Settings 注册 OAuth App
 *
 * @event google - Google 登录按钮点击
 *   - 触发 Google OAuth 授权流程
 *   - 需要在 Google Cloud Console 配置 OAuth 2.0
 */
defineEmits<{
  wechat: []
  github: []
  google: []
}>()
</script>

<template>
  <section class="social-login-section">
    <ElDivider>
      <span class="divider-text">或</span>
    </ElDivider>

    <nav class="social-login" aria-label="第三方登录">
      <ElSpace :size="16">
        <ElButton circle class="social-btn" title="微信登录" @click="$emit('wechat')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-9.5 3c0-4.4 4-8 9-8s9 3.6 9 8-4 8-9 8c-1.1 0-2.1-.2-3-.4l-3 1.4.8-2.4C5.3 18.8 4 16.6 4 14z"/>
          </svg>
        </ElButton>
        <ElButton circle class="social-btn" title="GitHub 登录" @click="$emit('github')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </ElButton>
        <ElButton circle class="social-btn" title="Google 登录" @click="$emit('google')">
          <svg viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </ElButton>
      </ElSpace>
    </nav>
  </section>
</template>

<style scoped lang="scss">
.social-login-section {
  :deep(.el-divider) {
    margin: 24px 0;
    border-color: rgba(255, 255, 255, 0.08);

    .el-divider__text {
      background: transparent;
      padding: 0 16px;
    }
  }

  .divider-text {
    color: #5f6368;
    font-size: 12px;
  }

  .social-login {
    display: flex;
    justify-content: center;

    .social-btn {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #9aa0a6;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
        color: #e8eaed;
      }

      svg {
        width: 22px;
        height: 22px;
      }
    }
  }
}
</style>
