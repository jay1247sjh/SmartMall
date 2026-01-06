<script setup lang="ts">
/**
 * ============================================================================
 * 认证表单提交按钮组件 (AuthButton)
 * ============================================================================
 *
 * 【业务职责】
 * 统一的认证表单提交按钮，用于登录、注册、密码重置等认证流程。
 * 提供一致的视觉风格和交互体验，包括加载状态反馈。
 *
 * 【设计原则】
 * 1. Element Plus 优先 - 基于 ElButton 封装，继承其完整功能
 * 2. 状态反馈 - 加载时显示 loading 动画和文字提示
 * 3. 视觉引导 - 箭头图标暗示"前进/提交"的操作方向
 *
 * 【使用场景】
 * - 登录页面的"登录"按钮
 * - 注册页面的"注册"按钮
 * - 密码重置页面的"发送验证码"/"重置密码"按钮
 *
 * 【交互设计】
 * - 悬停时轻微上浮 + 阴影扩散，暗示可点击
 * - 悬停时箭头右移，强化"前进"的视觉暗示
 * - 禁用时灰色显示，明确不可操作状态
 * - 加载时隐藏箭头，显示 loading 动画
 *
 * 【样式特点】
 * - 渐变背景：蓝紫渐变，与系统主题一致
 * - 圆角设计：10px 圆角，现代感
 * - 全宽布局：占满父容器宽度，便于表单对齐
 * ============================================================================
 */
import { ArrowRight } from '@element-plus/icons-vue'

/**
 * 组件属性定义
 *
 * @property text - 按钮显示文字（如"登录"、"注册"）
 * @property loadingText - 加载状态时显示的文字，默认"处理中..."
 * @property loading - 是否处于加载状态（显示 loading 动画）
 * @property disabled - 是否禁用按钮（表单验证未通过时使用）
 * @property type - 按钮类型，submit 用于表单提交，button 用于普通点击
 */
defineProps<{
  text: string
  loadingText?: string
  loading?: boolean
  disabled?: boolean
  type?: 'submit' | 'button'
}>()

/**
 * 组件事件定义
 *
 * @event click - 按钮点击事件
 *   - 用于非表单提交场景（type="button"）
 *   - 表单提交场景通常由 form 的 submit 事件处理
 */
defineEmits<{
  click: []
}>()
</script>

<template>
  <ElButton
    :native-type="type || 'submit'"
    :loading="loading"
    :disabled="disabled"
    type="primary"
    size="large"
    class="auth-submit-btn"
    @click="$emit('click')"
  >
    <span>{{ loading ? (loadingText || '处理中...') : text }}</span>
    <ElIcon v-if="!loading" class="btn-arrow">
      <ArrowRight />
    </ElIcon>
  </ElButton>
</template>

<style scoped lang="scss">
.auth-submit-btn {
  width: 100%;
  margin-top: 24px;
  height: 48px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border: none;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);
    background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);

    .btn-arrow {
      transform: translateX(3px);
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: #3c4043;
    color: #5f6368;
  }

  .btn-arrow {
    margin-left: 8px;
    transition: transform 0.2s;
  }
}
</style>
