# 密码重置功能学习指南

> 苏格拉底式教学：通过提问引导你理解密码重置流程的实现

## 第一部分：理解问题

### 问题 1：密码重置为什么需要两个页面？

在这个项目中，密码重置涉及两个页面：
- `ForgotPasswordView.vue` - 忘记密码（输入邮箱）
- `ResetPasswordView.vue` - 重置密码（输入新密码）

**为什么不能在一个页面完成？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

安全性考虑：

1. **身份验证问题**
   - 用户说"我忘记密码了"，你怎么知道他是账号的主人？
   - 不能直接让他改密码，否则任何人都能改别人的密码

2. **邮箱验证流程**
   - 第一步：用户输入邮箱 → 系统发送重置链接到邮箱
   - 第二步：用户点击邮箱中的链接 → 证明他能访问这个邮箱
   - 第三步：用户设置新密码

3. **为什么邮箱能证明身份？**
   - 注册时邮箱已验证
   - 只有账号主人才能访问自己的邮箱
   - 邮箱是"你是你"的证明

**这叫"带外验证"（Out-of-Band Verification）**：通过另一个渠道（邮箱）确认身份。

</details>

---

### 问题 2：Token 是什么？为什么需要它？

看 `ResetPasswordView.vue` 中的代码：

```typescript
onMounted(async () => {
  token.value = (route.query.token as string) || ''
  
  if (!token.value) {
    errorMsg.value = '无效的重置链接'
    verifying.value = false
    return
  }
  
  try {
    const valid = await passwordApi.verifyResetToken({ token: token.value })
    tokenValid.value = valid
    // ...
  }
})
```

**这个 `token` 从哪里来？它的作用是什么？**

---

<details>
<summary>💡 点击查看引导</summary>

Token 的生命周期：

1. **生成**：用户在"忘记密码"页面提交邮箱
   - 后端生成一个随机的、唯一的 token
   - 后端把 token 和用户 ID、过期时间存起来
   - 后端发送邮件，链接中包含 token

2. **传递**：用户点击邮件中的链接
   - 链接格式：`https://example.com/reset-password?token=abc123xyz`
   - 浏览器打开页面，token 在 URL 的 query 参数中

3. **验证**：页面加载时
   - 前端从 URL 提取 token
   - 发送到后端验证
   - 后端检查：token 存在吗？过期了吗？已使用了吗？

4. **使用**：用户提交新密码
   - 前端把 token 和新密码一起发送
   - 后端再次验证 token，然后更新密码
   - 后端标记 token 已使用（防止重复使用）

**Token 的作用**：证明"这个请求来自收到邮件的人"。

</details>

---

## 第二部分：页面状态管理

### 问题 3：为什么需要 `verifying` 状态？

```typescript
const verifying = ref(true)
const tokenValid = ref(false)

onMounted(async () => {
  // 验证 token...
  verifying.value = false
})
```

**页面加载时，用户看到什么？**

---

<details>
<summary>💡 点击查看引导</summary>

三种可能的状态：

1. **验证中**（`verifying = true`）
   - 显示加载动画
   - 告诉用户"正在验证重置链接..."

2. **验证失败**（`verifying = false, tokenValid = false`）
   - 显示错误信息
   - 提供"重新申请"按钮

3. **验证成功**（`verifying = false, tokenValid = true`）
   - 显示密码重置表单

为什么需要 `verifying`？

- 页面刚加载时，还不知道 token 是否有效
- 如果直接显示表单，用户可能填完才发现 token 无效
- 如果直接显示错误，可能 token 其实是有效的（还没验证完）

**先验证，再显示**：避免给用户错误的期望。

</details>

---

### 问题 4：这段模板逻辑是什么意思？

```vue
<template v-if="verifying">
  <!-- 加载状态 -->
</template>

<template v-else-if="!tokenValid && !success">
  <!-- 令牌无效 -->
</template>

<template v-else-if="success">
  <!-- 成功状态 -->
</template>

<template v-else>
  <!-- 表单状态 -->
</template>
```

**画出这个状态机的流程图。**

---

<details>
<summary>💡 点击查看引导</summary>

```
┌─────────────────┐
│   页面加载      │
│  verifying=true │
└────────┬────────┘
         │
         ▼
    ┌────────────┐
    │  验证 Token │
    └────────┬───┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌───────┐
│ 无效  │  │ 有效  │
└───┬───┘  └───┬───┘
    │          │
    ▼          ▼
┌───────┐  ┌───────┐
│显示错误│  │显示表单│
└───────┘  └───┬───┘
               │
          ┌────┴────┐
          │         │
          ▼         ▼
      ┌───────┐  ┌───────┐
      │ 失败  │  │ 成功  │
      └───────┘  └───────┘
```

**关键洞察**：这是一个"状态机"，每个状态对应一种 UI。

</details>

---

## 第三部分：安全考虑

### 问题 5：为什么"忘记密码"总是显示成功？

看 `ForgotPasswordView.vue`：

```typescript
try {
  await passwordApi.forgotPassword({ email: email.value })
  success.value = true  // 总是显示成功
} catch (error: any) {
  errorMsg.value = error?.message || '发送失败，请重试'
}
```

成功后显示：

```
如果该邮箱已注册，您将收到一封包含密码重置链接的邮件。
```

**为什么不告诉用户"这个邮箱没有注册"？**

---

<details>
<summary>💡 点击查看引导</summary>

安全原因：**防止用户枚举攻击**。

如果系统告诉你"这个邮箱没有注册"：
- 攻击者可以用大量邮箱测试
- 找出哪些邮箱在系统中注册过
- 这些邮箱可能成为钓鱼攻击的目标

正确的做法：
- 无论邮箱是否存在，都显示相同的消息
- "如果该邮箱已注册，您将收到邮件"
- 攻击者无法判断邮箱是否存在

**这叫"信息泄露防护"**：不要泄露不必要的信息。

**追问**：登录失败时，应该显示"用户名不存在"还是"用户名或密码错误"？

</details>

---

### 问题 6：Token 为什么要有过期时间？

**如果 Token 永不过期，会有什么问题？**

---

<details>
<summary>💡 点击查看引导</summary>

风险场景：

1. **邮件被截获**
   - 用户的邮箱被黑客入侵
   - 黑客看到了重置链接
   - 如果 token 永不过期，黑客随时可以重置密码

2. **链接被分享**
   - 用户不小心把链接发给了别人
   - 或者链接出现在浏览器历史记录中
   - 别人可以用这个链接重置密码

3. **用户忘记使用**
   - 用户申请了重置，但没有使用
   - 很久以后，这个链接还能用
   - 安全隐患

**过期时间的作用**：
- 限制攻击窗口
- 通常设置为 15 分钟到 24 小时
- 过期后必须重新申请

</details>

---

### 问题 7：为什么要在前端验证 Token？

```typescript
onMounted(async () => {
  const valid = await passwordApi.verifyResetToken({ token: token.value })
  tokenValid.value = valid
})
```

**后端提交时不是还要验证吗？为什么前端也要验证？**

---

<details>
<summary>💡 点击查看引导</summary>

用户体验考虑：

**不在前端验证**：
1. 用户打开页面
2. 用户填写新密码
3. 用户点击提交
4. 后端返回"token 无效"
5. 用户白填了！

**在前端验证**：
1. 用户打开页面
2. 前端立即检查 token
3. 如果无效，直接显示错误，不让用户填表单
4. 如果有效，用户填写并提交

**提前失败，快速反馈**：不要让用户做无用功。

**注意**：前端验证是为了体验，后端验证是为了安全。两者都需要。

</details>

---

## 第四部分：表单验证

### 问题 8：密码确认验证的时机

```typescript
if (newPassword.value !== confirmPassword.value) {
  errorMsg.value = '两次输入的密码不一致'
  return
}
```

**这个验证在提交时才做。为什么不在输入时实时验证？**

---

<details>
<summary>💡 点击查看引导</summary>

考虑用户的输入顺序：

1. 用户输入新密码：`123456`
2. 用户开始输入确认密码：`1`

如果实时验证：
- 用户刚输入 `1`，就显示"密码不一致"
- 但用户还没输完呢！
- 这会让用户困惑

更好的做法：
- 等用户输完确认密码，离开输入框时验证（`blur` 事件）
- 或者等用户提交时验证

**当前实现选择了提交时验证**：简单，不会打扰用户。

**追问**：如果要实现 `blur` 时验证，代码怎么写？

</details>

---

### 问题 9：为什么密码长度限制是 6 位？

```typescript
if (newPassword.value.length < 6) {
  errorMsg.value = '密码长度不能少于6位'
  return
}
```

**6 位够安全吗？应该设置多少位？**

---

<details>
<summary>💡 点击查看引导</summary>

密码安全是一个权衡：

**太短的问题**：
- 容易被暴力破解
- 4 位数字密码只有 10,000 种可能
- 6 位字母数字有 2,176,782,336 种可能

**太长的问题**：
- 用户记不住
- 用户会写在纸上（更不安全）
- 用户会用简单的重复模式

**现代建议**：
- 最少 8 位
- 要求包含大小写、数字、特殊字符
- 或者使用"密码短语"（如 "correct horse battery staple"）

**6 位是最低限度**，实际项目中建议更严格。

</details>

---

## 第五部分：UI 状态

### 问题 10：成功和错误状态的 UI 设计

```vue
<!-- 成功状态 -->
<div class="success-content">
  <div class="success-icon">✓</div>
  <h2>密码已重置</h2>
  <p>您的密码已成功重置，请使用新密码登录</p>
  <button @click="goToLogin">前往登录</button>
</div>

<!-- 错误状态 -->
<div class="error-content">
  <div class="error-icon">✗</div>
  <h2>链接无效</h2>
  <p>重置链接已过期或无效，请重新申请</p>
  <button @click="goToForgotPassword">重新申请</button>
</div>
```

**这两个状态有什么共同点？为什么这样设计？**

---

<details>
<summary>💡 点击查看引导</summary>

共同的设计模式：

1. **图标** - 视觉上立即传达状态（绿色 ✓ / 红色 ✗）
2. **标题** - 简短说明发生了什么
3. **描述** - 详细解释
4. **行动按钮** - 告诉用户下一步做什么

这叫"结果页"或"终态页"设计：
- 用户完成了一个流程
- 需要清晰地告诉他结果
- 需要引导他下一步

**好的终态页**：
- 状态一目了然
- 不让用户困惑"现在怎么办"
- 提供明确的下一步

</details>

---

## 动手练习

### 练习 1：添加 Token 过期倒计时
- 显示"此链接将在 XX 分钟后过期"
- 后端返回过期时间，前端倒计时显示

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const expiresAt = ref<Date | null>(null)
const remainingTime = ref('')
let countdownTimer: number | null = null

onMounted(async () => {
  try {
    // 假设后端返回 { valid: true, expiresAt: '2024-01-01T12:00:00Z' }
    const result = await passwordApi.verifyResetToken({ token: token.value })
    
    if (result.valid && result.expiresAt) {
      expiresAt.value = new Date(result.expiresAt)
      startCountdown()
    }
  } catch (error) {
    // 处理错误
  }
})

function startCountdown() {
  updateRemainingTime()
  
  countdownTimer = window.setInterval(() => {
    updateRemainingTime()
  }, 1000)
}

function updateRemainingTime() {
  if (!expiresAt.value) return
  
  const now = new Date()
  const diff = expiresAt.value.getTime() - now.getTime()
  
  if (diff <= 0) {
    remainingTime.value = '已过期'
    tokenValid.value = false
    if (countdownTimer) clearInterval(countdownTimer)
    return
  }
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  remainingTime.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <div v-if="tokenValid && remainingTime" class="expiry-notice">
    <svg class="clock-icon" viewBox="0 0 24 24">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
    </svg>
    <span>此链接将在 {{ remainingTime }} 后过期</span>
  </div>
</template>

<style scoped>
.expiry-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff3cd;
  border-radius: 8px;
  color: #856404;
  font-size: 14px;
}

.clock-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}
</style>
```

**关键点**：
- 后端返回过期时间戳
- `setInterval` 每秒更新倒计时
- 过期后自动标记 token 无效
- `padStart` 格式化秒数为两位

</details>

---

### 练习 2：添加密码强度检测
- 在重置密码页面添加密码强度指示器
- 弱/中/强三个等级

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const newPassword = ref('')

const passwordStrength = computed(() => {
  const pwd = newPassword.value
  if (!pwd) return null
  
  let score = 0
  const checks = {
    length: pwd.length >= 8,
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[!@#$%^&*]/.test(pwd),
  }
  
  score = Object.values(checks).filter(Boolean).length
  
  if (score <= 2) {
    return { 
      level: 'weak', 
      text: '弱', 
      color: '#f56c6c',
      tips: '建议添加大写字母、数字或特殊字符'
    }
  } else if (score <= 3) {
    return { 
      level: 'medium', 
      text: '中', 
      color: '#e6a23c',
      tips: '再添加一种字符类型会更安全'
    }
  } else {
    return { 
      level: 'strong', 
      text: '强', 
      color: '#67c23a',
      tips: '密码强度良好'
    }
  }
})
</script>

<template>
  <div class="password-field">
    <input 
      type="password" 
      v-model="newPassword" 
      placeholder="请输入新密码"
    />
    
    <div v-if="passwordStrength" class="strength-feedback">
      <div class="strength-bar">
        <div 
          class="strength-fill"
          :class="passwordStrength.level"
          :style="{ 
            width: passwordStrength.level === 'weak' ? '33%' : 
                   passwordStrength.level === 'medium' ? '66%' : '100%',
            backgroundColor: passwordStrength.color 
          }"
        ></div>
      </div>
      <div class="strength-info">
        <span :style="{ color: passwordStrength.color }">
          密码强度：{{ passwordStrength.text }}
        </span>
        <span class="strength-tip">{{ passwordStrength.tips }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.strength-bar {
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s, background-color 0.3s;
}

.strength-info {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
}

.strength-tip {
  color: #909399;
}
</style>
```

**关键点**：
- 检查多种字符类型
- 提供改进建议
- 进度条可视化强度

</details>

---

### 练习 3：添加重发邮件功能
- 在"忘记密码"成功页面添加"没收到邮件？重新发送"
- 限制重发频率（如 60 秒一次）

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const email = ref('')
const success = ref(false)
const resendCooldown = ref(0)
let cooldownTimer: number | null = null

async function sendResetEmail() {
  await passwordApi.forgotPassword({ email: email.value })
  success.value = true
  startResendCooldown()
}

function startResendCooldown() {
  resendCooldown.value = 60
  
  cooldownTimer = window.setInterval(() => {
    resendCooldown.value--
    
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownTimer!)
      cooldownTimer = null
    }
  }, 1000)
}

async function resendEmail() {
  if (resendCooldown.value > 0) return
  
  try {
    await passwordApi.forgotPassword({ email: email.value })
    startResendCooldown()
    // 显示成功提示
  } catch (error) {
    // 处理错误
  }
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<template>
  <div v-if="success" class="success-content">
    <div class="success-icon">✓</div>
    <h2>邮件已发送</h2>
    <p>如果该邮箱已注册，您将收到一封包含密码重置链接的邮件。</p>
    
    <div class="resend-section">
      <p class="resend-hint">没收到邮件？请检查垃圾邮件文件夹</p>
      <button 
        class="resend-btn"
        :disabled="resendCooldown > 0"
        @click="resendEmail"
      >
        <template v-if="resendCooldown > 0">
          {{ resendCooldown }} 秒后可重新发送
        </template>
        <template v-else>
          重新发送邮件
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.resend-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.resend-hint {
  color: #909399;
  font-size: 14px;
  margin-bottom: 12px;
}

.resend-btn {
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.resend-btn:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.resend-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
```

**关键点**：
- `resendCooldown` 控制冷却时间
- 发送后自动开始倒计时
- 按钮禁用状态显示剩余时间
- 提示用户检查垃圾邮件

</details>

---

## 关键文件

- `apps/frontend/SMART-MALL/src/views/ForgotPasswordView.vue` - 忘记密码页面
- `apps/frontend/SMART-MALL/src/views/ResetPasswordView.vue` - 重置密码页面
- `apps/frontend/SMART-MALL/src/api/password.api.ts` - 密码相关 API

---

## 组件化重构说明

密码重置相关页面已使用 Element Plus 组件 + SCSS 嵌套语法重构：

### 使用的组件

| 组件 | 路径 | Element Plus 组件 |
|------|------|------------------|
| `AuthFormCard` | `@/components/auth/AuthFormCard.vue` | ElCard |
| `AuthInput` | `@/components/auth/AuthInput.vue` | ElInput, ElIcon, ElFormItem |
| `AuthButton` | `@/components/auth/AuthButton.vue` | ElButton, ElIcon |
| `AlertMessage` | `@/components/auth/AlertMessage.vue` | ElAlert |

### 页面级 Element Plus 组件

| 页面 | Element Plus 组件 |
|------|------------------|
| `ForgotPasswordView` | ElForm, ElButton, ElIcon, ElResult |
| `ResetPasswordView` | ElForm, ElButton, ElIcon, ElResult, ElSkeleton |

### 重构前后对比

```
ForgotPasswordView:
  重构前：~250 行代码
  重构后：~120 行代码
  
ResetPasswordView:
  重构前：~350 行代码
  重构后：~180 行代码
```

### 页面状态管理模式

密码重置页面展示了多状态页面的设计模式，使用 Element Plus 组件：

```vue
<template>
  <!-- 加载状态 - 使用 ElSkeleton -->
  <template v-if="verifying">
    <section class="loading-content">
      <ElSkeleton :rows="3" animated />
    </section>
  </template>

  <!-- 令牌无效 - 使用 ElResult -->
  <template v-else-if="!tokenValid && !success">
    <ElResult
      icon="error"
      title="链接无效"
      sub-title="重置链接已过期或无效，请重新申请"
    >
      <template #extra>
        <ElButton type="primary" @click="goToForgotPassword">
          重新申请
        </ElButton>
      </template>
    </ElResult>
  </template>

  <!-- 成功状态 - 使用 ElResult -->
  <template v-else-if="success">
    <ElResult
      icon="success"
      title="密码已重置"
      sub-title="您的密码已成功重置，请使用新密码登录"
    >
      <template #extra>
        <ElButton type="primary" @click="goToLogin">
          前往登录
        </ElButton>
      </template>
    </ElResult>
  </template>

  <!-- 表单状态 -->
  <template v-else>
    <AuthFormCard title="重置密码">
      <ElForm @submit.prevent="handleReset">
        <!-- 表单内容 -->
      </ElForm>
    </AuthFormCard>
  </template>
</template>
```

### SCSS 嵌套语法示例

```scss
// 密码重置页面样式
.reset-password-page {
  .loading-content {
    padding: 40px;
    text-align: center;

    :deep(.el-skeleton) {
      max-width: 300px;
      margin: 0 auto;
    }
  }

  .password-strength {
    margin-top: 8px;

    .strength-bar {
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;

      .strength-fill {
        height: 100%;
        transition: width 0.3s, background-color 0.3s;

        &.weak { background-color: #f56c6c; }
        &.medium { background-color: #e6a23c; }
        &.strong { background-color: #67c23a; }
      }
    }
  }
}
```

这种模式确保：
- 用户不会在 token 验证完成前看到表单
- 每种状态都有清晰的 UI 反馈（使用 ElResult 组件）
- 加载状态使用 ElSkeleton 提供骨架屏
- 状态转换逻辑清晰可维护

---

*"问题的提出往往比解决更重要。" —— 爱因斯坦（苏格拉底会同意的）*
