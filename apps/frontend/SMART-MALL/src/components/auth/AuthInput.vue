<script setup lang="ts">
/**
 * ============================================================================
 * 认证表单输入框组件 (AuthInput.vue)
 * ============================================================================
 * 
 * 【组件职责】
 * 封装 Element Plus 的 ElInput 组件，提供统一的认证表单输入框样式：
 * - 带图标的输入框（用户、密码、邮箱、手机）
 * - 验证状态显示（加载中、验证通过、错误）
 * - 必填/可选标识
 * - 深色主题样式
 * 
 * 【组件结构】
 * ┌─────────────────────────────────────────┐
 * │ 用户名 *                                │  ← 标签 + 必填标识
 * ├─────────────────────────────────────────┤
 * │ 👤 │ 请输入用户名              │ ✓/⟳  │  ← 图标 + 输入框 + 状态图标
 * └─────────────────────────────────────────┘
 * 
 * 【状态图标说明】
 * - checking=true: 显示加载动画（用于异步验证，如检查用户名是否已存在）
 * - valid=true: 显示绿色对勾（验证通过）
 * - error 有值: 显示红色边框（验证失败）
 * 
 * 【使用示例】
 * ```vue
 * <AuthInput
 *   id="username"
 *   v-model="username"
 *   label="用户名"
 *   icon="user"
 *   placeholder="请输入用户名"
 *   required
 *   :checking="isChecking"
 *   :valid="isValid"
 *   :error="errorMsg"
 * />
 * ```
 * 
 * ============================================================================
 */

import { computed } from 'vue'
import { ElInput, ElIcon, ElFormItem } from 'element-plus'
import { User, Lock, Message, Phone, Loading, CircleCheck } from '@element-plus/icons-vue'

/**
 * 组件属性
 */
const props = defineProps<{
  /** 输入框 ID，用于 label 的 for 属性和无障碍访问 */
  id: string
  
  /** 标签文字 */
  label: string
  
  /** 输入框类型 */
  type?: 'text' | 'password' | 'email' | 'tel'
  
  /** 占位符文字 */
  placeholder?: string
  
  /** 浏览器自动填充提示 */
  autocomplete?: string
  
  /** 是否必填 */
  required?: boolean
  
  /** 错误消息（有值时显示错误状态） */
  error?: string
  
  /** 是否正在验证（显示加载动画） */
  checking?: boolean
  
  /** 是否验证通过（显示绿色对勾） */
  valid?: boolean
  
  /** 前缀图标类型 */
  icon?: 'user' | 'password' | 'email' | 'phone'
}>()

/**
 * 双向绑定的输入值
 * 
 * 【Vue 3.4+ defineModel】
 * defineModel 是 Vue 3.4 引入的语法糖，简化了 v-model 的实现：
 * - 自动创建 modelValue prop
 * - 自动创建 update:modelValue emit
 * - 返回一个可直接读写的 ref
 */
const modelValue = defineModel<string>({ required: true })

/**
 * 是否有错误
 * 用于控制输入框的错误样式
 */
const hasError = computed(() => !!props.error)

/**
 * 图标组件映射
 * 
 * 根据 icon prop 返回对应的 Element Plus 图标组件
 */
const iconComponent = computed(() => {
  const iconMap = {
    user: User,       // 用户图标
    password: Lock,   // 锁图标
    email: Message,   // 邮件图标
    phone: Phone,     // 电话图标
  }
  return props.icon ? iconMap[props.icon] : null
})
</script>

<template>
  <!--
    ============================================================================
    表单项容器
    ============================================================================
    
    使用 Element Plus 的 ElFormItem 组件：
    - 提供标签和输入框的布局
    - 支持错误消息显示
    - 支持表单验证集成
  -->
  <ElFormItem :label="label" :error="error" class="auth-input-item">
    <!--
      自定义标签模板
      显示标签文字 + 必填/可选标识
    -->
    <template #label>
      <span class="input-label">
        {{ label }}
        <!-- 必填标识：红色星号 -->
        <span v-if="required" class="required">*</span>
        <!-- 可选标识：灰色文字 -->
        <span v-else class="optional">(可选)</span>
      </span>
    </template>
    
    <!--
      ============================================================================
      输入框
      ============================================================================
      
      Element Plus ElInput 组件配置：
      - v-model: 双向绑定输入值
      - type: 输入类型（text/password/email/tel）
      - size="large": 大尺寸，更易点击
      - clearable: 显示清除按钮
    -->
    <ElInput
      :id="id"
      v-model="modelValue"
      :type="type || 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :class="{ 'is-error': hasError }"
      size="large"
      clearable
    >
      <!--
        前缀图标
        根据 icon prop 显示对应的图标
      -->
      <template v-if="iconComponent" #prefix>
        <ElIcon class="input-icon">
          <component :is="iconComponent" />
        </ElIcon>
      </template>
      
      <!--
        后缀状态图标
        - checking: 加载动画（正在验证）
        - valid: 绿色对勾（验证通过）
      -->
      <template #suffix>
        <!-- 加载动画 -->
        <ElIcon v-if="checking" class="status-icon checking">
          <Loading />
        </ElIcon>
        <!-- 验证通过图标 -->
        <ElIcon v-else-if="valid && !hasError" class="status-icon valid">
          <CircleCheck />
        </ElIcon>
      </template>
    </ElInput>
  </ElFormItem>
</template>

<style scoped lang="scss">
/**
 * ============================================================================
 * 样式说明
 * ============================================================================
 * 
 * 【设计风格】
 * - 深色主题
 * - 半透明背景
 * - 聚焦时蓝色边框和光晕
 * - 错误时红色边框
 */

.auth-input-item {
  margin-bottom: 20px;

  /* 最后一个输入框不需要底部间距 */
  &:last-of-type {
    margin-bottom: 0;
  }

  /* 标签样式 */
  .input-label {
    font-size: 13px;
    font-weight: 500;
    color: #9aa0a6;

    /* 必填标识：红色星号 */
    .required {
      color: #f28b82;
      margin-left: 2px;
    }

    /* 可选标识：灰色文字 */
    .optional {
      color: #5f6368;
      font-weight: 400;
      font-size: 12px;
      margin-left: 4px;
    }
  }

  /* 穿透 Element Plus 输入框样式 */
  :deep(.el-input) {
    .el-input__wrapper {
      /* 深色半透明背景 */
      background: rgba(0, 0, 0, 0.3);
      /* 细边框 */
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      box-shadow: none;
      padding: 4px 14px;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

      /* 悬停状态 */
      &:hover {
        border-color: rgba(255, 255, 255, 0.2);
      }

      /* 聚焦状态：蓝色边框 + 光晕 */
      &.is-focus {
        border-color: #8ab4f8;
        background: rgba(138, 180, 248, 0.05);
        box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.1);
      }
    }

    /* 输入文字样式 */
    .el-input__inner {
      color: #e8eaed;

      &::placeholder {
        color: #5f6368;
      }
    }

    /* 错误状态：红色边框 */
    &.is-error .el-input__wrapper {
      border-color: #f28b82;
    }
  }

  /* 前缀图标样式 */
  .input-icon {
    color: #5f6368;
    transition: color 0.2s;
  }

  /* 聚焦时图标变蓝 */
  :deep(.el-input__wrapper.is-focus) .input-icon {
    color: #8ab4f8;
  }

  /* 状态图标样式 */
  .status-icon {
    /* 加载动画：旋转 */
    &.checking {
      animation: spin 0.6s linear infinite;
      color: #8ab4f8;
    }

    /* 验证通过：绿色 */
    &.valid {
      color: #81c995;
    }
  }
}

/* 旋转动画 */
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
