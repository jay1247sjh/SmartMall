# Element Plus 组件学习指南

> 苏格拉底式教学：通过提问引导你理解 Element Plus 组件库的使用

## 学习目标

通过本章学习，你将掌握：
- Element Plus 组件库使用
- 组件封装与复用
- 表单验证
- 主题定制
- SCSS 嵌套语法与组件样式覆盖

---

## 第一部分：理解组件库

### 问题 1：为什么使用组件库？

**思考**：自己写一个 DatePicker 需要考虑哪些问题？

<details>
<summary>💡 点击查看引导</summary>

自己实现需要考虑：
- 日历布局和计算
- 国际化（不同语言、日期格式）
- 键盘导航
- 无障碍访问（ARIA）
- 各种边界情况

使用组件库的好处：
1. 节省开发时间
2. 经过大量测试
3. 统一的设计风格
4. 持续维护更新

</details>

### 问题 2：Element Plus vs 原生 HTML，如何选择？

**思考**：什么时候用 `<ElButton>`，什么时候用 `<button>`？

<details>
<summary>💡 点击查看引导</summary>

**优先使用 Element Plus 组件的场景**：
- 需要统一的视觉风格
- 需要内置的交互效果（loading、disabled）
- 需要复杂功能（表单验证、数据表格）

**使用原生 HTML 的场景**：
- 简单的语义化结构（main、section、article）
- 不需要特殊样式的容器
- 性能敏感的场景

**项目设计原则**：
1. 优先级 1：Element Plus 组件
2. 优先级 2：HTML5 语义化标签
3. 优先级 3：普通 div（仅在必要时）

</details>

---

## 第二部分：核心组件使用

### 1. 按需引入配置

```typescript
// main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn })
```

### 2. 表单验证

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const form = reactive({ username: '', password: '' })

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度 3-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ]
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid) {
    // 提交表单
  }
}
</script>

<template>
  <ElForm ref="formRef" :model="form" :rules="rules">
    <ElFormItem label="用户名" prop="username">
      <ElInput v-model="form.username" />
    </ElFormItem>
    <ElFormItem label="密码" prop="password">
      <ElInput v-model="form.password" type="password" />
    </ElFormItem>
    <ElFormItem>
      <ElButton type="primary" @click="handleSubmit">登录</ElButton>
    </ElFormItem>
  </ElForm>
</template>
```

### 3. 消息提示封装

```typescript
// utils/message.ts
import { ElMessage, ElMessageBox } from 'element-plus'

export const message = {
  success: (msg: string) => ElMessage.success(msg),
  error: (msg: string) => ElMessage.error(msg),
  warning: (msg: string) => ElMessage.warning(msg),
  
  confirm: (msg: string, title = '提示') => 
    ElMessageBox.confirm(msg, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
}
```

---

## 第三部分：SCSS 嵌套与样式覆盖

### 问题 3：如何覆盖 Element Plus 组件样式？

**思考**：为什么直接写 `.el-button { color: red }` 不生效？

<details>
<summary>💡 点击查看引导</summary>

Vue 的 scoped 样式会给选择器添加唯一属性，导致无法匹配 Element Plus 组件内部元素。

解决方案：使用 `:deep()` 穿透选择器

```scss
// 不生效
.my-form {
  .el-input__inner {
    background: #1d1e1f;
  }
}

// 使用 :deep() 穿透
.my-form {
  :deep(.el-input__inner) {
    background: #1d1e1f;
  }
}
```

</details>

### SCSS 嵌套语法最佳实践

```scss
// 组件样式示例
.dashboard-page {
  padding: 24px;

  // 统计卡片区域
  .stats-section {
    margin-bottom: 24px;

    .stat-card {
      background: #1d1e1f;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      // 穿透 Element Plus 组件样式
      :deep(.el-statistic) {
        .el-statistic__head {
          color: #9aa0a6;
          font-size: 14px;
        }

        .el-statistic__content {
          color: #e8eaed;
        }
      }
    }
  }
}
```

---

## 第四部分：常用组件速查

### 布局组件

| 组件 | 用途 | 示例 |
|------|------|------|
| ElContainer | 布局容器 | 页面整体布局 |
| ElHeader | 顶栏容器 | 导航栏 |
| ElAside | 侧边栏容器 | 菜单栏 |
| ElMain | 主要区域容器 | 内容区 |
| ElRow / ElCol | 栅格布局 | 响应式布局 |

### 表单组件

| 组件 | 用途 | 示例 |
|------|------|------|
| ElForm | 表单容器 | 数据录入 |
| ElFormItem | 表单项 | 字段包装 |
| ElInput | 输入框 | 文本输入 |
| ElSelect | 下拉选择 | 分类选择 |

### 数据展示组件

| 组件 | 用途 | 示例 |
|------|------|------|
| ElTable | 表格 | 数据列表 |
| ElCard | 卡片 | 内容容器 |
| ElStatistic | 统计数值 | 数据展示 |
| ElTag | 标签 | 状态标记 |
| ElEmpty | 空状态 | 无数据提示 |
| ElSkeleton | 骨架屏 | 加载占位 |

### 反馈组件

| 组件 | 用途 | 示例 |
|------|------|------|
| ElDialog | 对话框 | 弹窗 |
| ElMessage | 消息提示 | 操作反馈 |
| ElAlert | 警告 | 提示信息 |
| ElResult | 结果页 | 操作结果 |

---

## 第五部分：项目组件封装示例

### 认证组件封装

项目中的认证组件展示了如何封装 Element Plus 组件：

```vue
<!-- AuthInput.vue -->
<script setup lang="ts">
import { ElInput, ElIcon, ElFormItem } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'

defineProps<{
  modelValue: string
  label: string
  type?: string
  icon?: 'user' | 'password' | 'email'
  placeholder?: string
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const iconMap = { user: User, password: Lock, email: Message }
</script>

<template>
  <ElFormItem :label="label" :error="error">
    <ElInput
      :model-value="modelValue"
      @update:model-value="emit('update:modelValue', $event)"
      :type="type"
      :placeholder="placeholder"
    >
      <template v-if="icon" #prefix>
        <ElIcon><component :is="iconMap[icon]" /></ElIcon>
      </template>
    </ElInput>
  </ElFormItem>
</template>

<style scoped lang="scss">
:deep(.el-input) {
  &.is-valid .el-input__wrapper {
    box-shadow: 0 0 0 1px #67c23a inset;
  }
}
</style>
```

---

## 延伸阅读

- [Element Plus 官方文档](https://element-plus.org/)
- [Vue 3 组件设计模式](https://vuejs.org/guide/components/registration.html)
- [SCSS 嵌套语法指南](https://sass-lang.com/documentation/style-rules#nesting)

---

## 关键文件

### 样式系统

| 文件 | 说明 | 跳转 |
|------|------|------|
| 主入口 | SCSS 主入口文件 | [main.scss](../../apps/frontend/SMART-MALL/src/assets/styles/scss/main.scss) |
| 设计令牌 | 颜色、间距、字体等变量 | [_variables.scss](../../apps/frontend/SMART-MALL/src/assets/styles/scss/_variables.scss) |
| 混入 | 响应式、Flexbox 等混入 | [_mixins.scss](../../apps/frontend/SMART-MALL/src/assets/styles/scss/_mixins.scss) |
| 动画 | 关键帧动画和工具类 | [_animations.scss](../../apps/frontend/SMART-MALL/src/assets/styles/scss/_animations.scss) |
| 工具类 | 显示、间距、尺寸等工具类 | [_utilities.scss](../../apps/frontend/SMART-MALL/src/assets/styles/scss/_utilities.scss) |
| 组件样式 | 按钮、卡片等组件样式 | [_components.scss](../../apps/frontend/SMART-MALL/src/assets/styles/scss/_components.scss) |
| 基础样式 | 重置和基础元素样式 | [_base.scss](../../apps/frontend/SMART-MALL/src/assets/styles/scss/_base.scss) |

### 认证组件

| 组件 | 说明 | 跳转 |
|------|------|------|
| AuthLayout | 认证页面统一布局 | [AuthLayout.vue](../../apps/frontend/SMART-MALL/src/components/auth/AuthLayout.vue) |
| AuthFormCard | 表单卡片容器 | [AuthFormCard.vue](../../apps/frontend/SMART-MALL/src/components/auth/AuthFormCard.vue) |
| AuthInput | 带图标、验证状态的输入框 | [AuthInput.vue](../../apps/frontend/SMART-MALL/src/components/auth/AuthInput.vue) |
| AuthButton | 带加载状态的按钮 | [AuthButton.vue](../../apps/frontend/SMART-MALL/src/components/auth/AuthButton.vue) |
| AlertMessage | 错误/成功提示 | [AlertMessage.vue](../../apps/frontend/SMART-MALL/src/components/auth/AlertMessage.vue) |
| TypewriterCard | 打字机效果卡片 | [TypewriterCard.vue](../../apps/frontend/SMART-MALL/src/components/auth/TypewriterCard.vue) |
| SocialLogin | 第三方登录按钮组 | [SocialLogin.vue](../../apps/frontend/SMART-MALL/src/components/auth/SocialLogin.vue) |
| FeatureList | 功能特点列表 | [FeatureList.vue](../../apps/frontend/SMART-MALL/src/components/auth/FeatureList.vue) |

### 共享组件

| 组件 | 说明 | 跳转 |
|------|------|------|
| StatCard | 统计卡片组件 | [StatCard.vue](../../apps/frontend/SMART-MALL/src/components/shared/StatCard.vue) |
| QuickActionCard | 快捷操作卡片 | [QuickActionCard.vue](../../apps/frontend/SMART-MALL/src/components/shared/QuickActionCard.vue) |
| DataTable | 数据表格组件 | [DataTable.vue](../../apps/frontend/SMART-MALL/src/components/shared/DataTable.vue) |
| Modal | 模态框组件 | [Modal.vue](../../apps/frontend/SMART-MALL/src/components/shared/Modal.vue) |
| CustomSelect | 自定义选择器 | [CustomSelect.vue](../../apps/frontend/SMART-MALL/src/components/common/CustomSelect.vue) |

### 布局组件

| 组件 | 说明 | 跳转 |
|------|------|------|
| AdminLayout | 管理员后台布局 | [AdminLayout.vue](../../apps/frontend/SMART-MALL/src/views/layouts/AdminLayout.vue) |
| MerchantLayout | 商户中心布局 | [MerchantLayout.vue](../../apps/frontend/SMART-MALL/src/views/layouts/MerchantLayout.vue) |
| MainLayout | 主布局（普通用户） | [MainLayout.vue](../../apps/frontend/SMART-MALL/src/views/layouts/MainLayout.vue) |
| DashboardLayout | 仪表盘通用布局 | [DashboardLayout.vue](../../apps/frontend/SMART-MALL/src/components/layouts/DashboardLayout.vue) |

### 页面视图

| 页面 | 说明 | 跳转 |
|------|------|------|
| LoginView | 登录页面 | [LoginView.vue](../../apps/frontend/SMART-MALL/src/views/LoginView.vue) |
| RegisterView | 注册页面 | [RegisterView.vue](../../apps/frontend/SMART-MALL/src/views/RegisterView.vue) |
| ForgotPasswordView | 忘记密码页面 | [ForgotPasswordView.vue](../../apps/frontend/SMART-MALL/src/views/ForgotPasswordView.vue) |
| ResetPasswordView | 重置密码页面 | [ResetPasswordView.vue](../../apps/frontend/SMART-MALL/src/views/ResetPasswordView.vue) |
| Admin DashboardView | 管理员仪表盘 | [DashboardView.vue](../../apps/frontend/SMART-MALL/src/views/admin/DashboardView.vue) |
| Merchant DashboardView | 商户仪表盘 | [DashboardView.vue](../../apps/frontend/SMART-MALL/src/views/merchant/DashboardView.vue) |

---

*"简单是终极的复杂。" —— 达芬奇*
