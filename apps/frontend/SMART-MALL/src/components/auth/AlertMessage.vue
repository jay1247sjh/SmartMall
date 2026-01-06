<script setup lang="ts">
/**
 * ============================================================================
 * 认证流程提示消息组件 (AlertMessage)
 * ============================================================================
 *
 * 【业务职责】
 * 在认证流程中向用户展示操作结果反馈，包括：
 * - 错误提示：登录失败、密码错误、账号不存在等
 * - 成功提示：注册成功、密码重置成功等
 * - 警告提示：账号即将过期、需要验证邮箱等
 *
 * 【设计原则】
 * 1. Element Plus 优先 - 基于 ElAlert 封装
 * 2. 视觉一致性 - 与暗色主题协调的配色方案
 * 3. 即时反馈 - 操作后立即显示结果
 *
 * 【使用场景】
 * - 登录失败时显示错误原因
 * - 注册成功后显示确认信息
 * - 密码重置邮件发送成功提示
 * - 表单验证错误汇总显示
 *
 * 【配色方案】（暗色主题适配）
 * - 错误(error)：红色系 #f28b82，柔和的珊瑚红
 * - 成功(success)：绿色系 #81c995，清新的薄荷绿
 * - 警告(warning)：橙色系 #fdba74，温和的琥珀色
 *
 * 【交互特点】
 * - 不可关闭(closable=false)：避免用户误关重要提示
 * - 带图标(show-icon)：快速识别消息类型
 * - 圆角设计：与整体 UI 风格一致
 * ============================================================================
 */
import { computed } from 'vue'

/**
 * 组件属性定义
 *
 * @property type - 消息类型，决定颜色和图标
 *   - 'error': 错误消息，红色，用于操作失败
 *   - 'success': 成功消息，绿色，用于操作成功
 *   - 'warning': 警告消息，橙色，用于需要注意的情况
 * @property message - 显示的消息内容
 */
const props = defineProps<{
  type: 'error' | 'success' | 'warning'
  message: string
}>()

/**
 * 计算 Element Plus Alert 组件的类型
 *
 * 【设计说明】
 * 虽然当前类型映射是 1:1 的，但保留这个计算属性有以下好处：
 * 1. 类型安全 - 确保只传入有效的 Alert 类型
 * 2. 扩展性 - 未来可能需要映射到不同的类型
 * 3. 解耦 - 组件接口与 Element Plus 实现解耦
 */
const alertType = computed(() => {
  const typeMap = {
    error: 'error',
    success: 'success',
    warning: 'warning',
  } as const
  return typeMap[props.type]
})
</script>

<template>
  <ElAlert
    :title="message"
    :type="alertType"
    :closable="false"
    show-icon
    class="auth-alert"
  />
</template>

<style scoped lang="scss">
.auth-alert {
  margin: 20px 0 0 0;
  border-radius: 10px;

  :deep(.el-alert__content) {
    .el-alert__title {
      font-size: 13px;
    }
  }

  &.el-alert--error {
    background: rgba(242, 139, 130, 0.1);
    border: 1px solid rgba(242, 139, 130, 0.2);

    :deep(.el-alert__title) {
      color: #f28b82;
    }
  }

  &.el-alert--success {
    background: rgba(129, 201, 149, 0.1);
    border: 1px solid rgba(129, 201, 149, 0.2);

    :deep(.el-alert__title) {
      color: #81c995;
    }
  }

  &.el-alert--warning {
    background: rgba(253, 186, 116, 0.1);
    border: 1px solid rgba(253, 186, 116, 0.2);

    :deep(.el-alert__title) {
      color: #fdba74;
    }
  }
}
</style>
