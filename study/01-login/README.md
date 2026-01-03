# 登录功能学习指南

> 苏格拉底式教学：通过提问引导你理解登录功能的实现

## 第一部分：理解问题

### 问题 1：登录功能的本质是什么？

在你开始写代码之前，让我问你一个问题：

**当用户点击"登录"按钮时，系统需要完成哪些事情？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

让我们一步步分析：

1. **收集用户输入** - 用户名和密码从哪里来？
2. **验证输入** - 空的用户名能登录吗？
3. **发送请求** - 数据要发到哪里？
4. **处理响应** - 登录成功后要做什么？登录失败呢？
5. **状态管理** - 如何记住用户已登录？

现在，你能用代码描述这个流程吗？

</details>

---

### 问题 2：为什么需要 `ref`？

看这段代码：

```typescript
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
```

**为什么不直接写成普通变量？**

```typescript
let username = ''
let password = ''
```

请思考：当用户在输入框中打字时，会发生什么？

---

<details>
<summary>💡 点击查看引导</summary>

Vue 3 的响应式系统需要"追踪"变量的变化。

试着回答这些问题：
- 如果 `username` 是普通变量，Vue 怎么知道它变了？
- 输入框的值变了，页面需要更新吗？
- `ref()` 做了什么让 Vue 能"看到"变化？

**关键洞察**：`ref` 创建了一个"响应式容器"，Vue 会监听这个容器的 `.value` 属性。

</details>

---

## 第二部分：表单验证

### 问题 3：验证应该在什么时候发生？

看这段代码：

```typescript
async function handleLogin() {
  if (!username.value.trim()) { 
    errorMsg.value = '请输入用户名'
    return 
  }
  if (!password.value) { 
    errorMsg.value = '请输入密码'
    return 
  }
  // ... 继续登录
}
```

**为什么要在发送请求之前验证？为什么不让后端来验证？**

---

<details>
<summary>💡 点击查看引导</summary>

思考这些场景：
- 用户网络很慢，发送一个空请求要等 3 秒才返回错误
- 后端每处理一个请求都要消耗服务器资源
- 用户体验：立即反馈 vs 等待反馈

**前端验证的目的**：
1. 快速反馈，提升用户体验
2. 减少无效请求，节省服务器资源
3. 但不能替代后端验证（安全性）

**追问**：为什么 `username.value.trim()` 而 `password.value` 不用 `trim()`？

</details>

---

### 问题 4：`return` 在这里起什么作用？

```typescript
if (!username.value.trim()) { 
  errorMsg.value = '请输入用户名'
  return  // <-- 这个 return
}
```

**如果去掉 `return` 会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

没有 `return`，代码会继续执行下去：
- 设置了错误消息
- 但还是发送了登录请求
- 用户看到错误提示，同时又在等待请求

**这叫"提前返回"（Early Return）模式**：
- 遇到错误条件，立即退出函数
- 避免深层嵌套的 if-else
- 让代码更清晰

</details>

---

## 第三部分：异步与状态

### 问题 5：为什么需要 `loading` 状态？

```typescript
loading.value = true
try {
  const response = await authApi.login(...)
  // ...
} finally {
  loading.value = false
}
```

**如果没有 `loading` 状态，用户体验会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

想象这个场景：
1. 用户点击登录
2. 网络请求需要 2 秒
3. 用户不知道发生了什么，又点了一次
4. 现在有两个请求在飞...

`loading` 状态的作用：
- 禁用按钮，防止重复提交
- 显示加载动画，告诉用户"正在处理"
- 提供视觉反馈

**追问**：为什么用 `finally` 而不是在 `try` 和 `catch` 里都写 `loading.value = false`？

</details>

---

### 问题 6：`try-catch-finally` 的执行顺序是什么？

```typescript
try {
  const response = await authApi.login(...)
  userStore.setUser(...)
  router.push('/mall')
} catch (error) {
  errorMsg.value = error?.message || '登录失败'
} finally {
  loading.value = false
}
```

**如果登录成功，`finally` 会执行吗？如果失败呢？**

---

<details>
<summary>💡 点击查看引导</summary>

`finally` 的特点：**无论成功还是失败，都会执行**。

执行流程：
- 成功：`try` → `finally`
- 失败：`try`（到错误处）→ `catch` → `finally`

这就是为什么把 `loading.value = false` 放在 `finally` 里：
- 不管结果如何，都要恢复按钮状态
- 避免代码重复

</details>

---

## 第四部分：路由与状态管理

### 问题 7：登录成功后为什么要存储用户信息？

```typescript
userStore.setUser(response.user, response.accessToken, response.refreshToken)
```

**如果不存储，用户刷新页面会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

HTTP 是无状态的：
- 每次请求都是独立的
- 服务器不记得"你是谁"

所以需要：
1. **Token**：证明"我是已登录用户"
2. **用户信息**：显示用户名、头像等
3. **持久化存储**：刷新页面后还能恢复

**追问**：`accessToken` 和 `refreshToken` 有什么区别？为什么需要两个？

</details>

---

### 问题 8：这段代码在做什么？

```typescript
const redirect = route.query.redirect as string
router.push(redirect && redirect !== '/login' ? redirect : '/mall')
```

**为什么要检查 `redirect` 参数？**

---

<details>
<summary>💡 点击查看引导</summary>

想象这个场景：
1. 用户想访问 `/admin/dashboard`
2. 但用户未登录，被重定向到 `/login?redirect=/admin/dashboard`
3. 用户登录成功
4. 应该跳转到哪里？

如果没有 `redirect` 参数：
- 用户总是跳转到 `/mall`
- 用户需要再次手动导航到想去的页面

**这叫"登录后重定向"**：记住用户原本想去的地方。

</details>

---

## 第五部分：UI 细节

### 问题 9：打字机效果是如何实现的？

```typescript
const type = () => {
  if (charIndex < fullText.length) {
    displayedText.value += fullText[charIndex]
    charIndex++
    typingTimer = window.setTimeout(type, Math.random() * 25 + 30)
  } else {
    // 打字完成
  }
}
```

**为什么用 `setTimeout` 而不是 `setInterval`？**

---

<details>
<summary>💡 点击查看引导</summary>

`setInterval` 的问题：
- 固定间隔，看起来很机械
- 不容易控制"打完一个字后停顿"

`setTimeout` 递归调用的好处：
- 每次间隔可以不同（`Math.random() * 25 + 30`）
- 更像真人打字的节奏
- 容易在某个点停止

**追问**：`Math.random() * 25 + 30` 产生的范围是多少？为什么选这个范围？

</details>

---

### 问题 10：为什么要在 `onUnmounted` 中清理定时器？

```typescript
onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
  if (pauseTimer) clearTimeout(pauseTimer)
})
```

**如果不清理会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

想象这个场景：
1. 用户在登录页，打字机效果正在运行
2. 用户点击"注册"，跳转到注册页
3. 登录页组件被销毁
4. 但定时器还在运行...
5. 定时器回调尝试更新已销毁组件的状态

结果：
- 内存泄漏
- 可能的控制台错误
- 性能问题

**这叫"组件清理"**：组件销毁时，清理所有副作用。

</details>

---

## 动手练习

现在你理解了登录功能的实现，试着完成这些练习：

### 练习 1：添加"记住我"功能
- 添加一个复选框
- 如果勾选，将用户名保存到 localStorage
- 下次打开页面时自动填充

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const rememberMe = ref(false)
const username = ref('')

// 页面加载时恢复
onMounted(() => {
  const savedUsername = localStorage.getItem('remembered_username')
  if (savedUsername) {
    username.value = savedUsername
    rememberMe.value = true
  }
})

// 登录成功后保存
async function handleLogin() {
  // ... 登录逻辑
  
  if (rememberMe.value) {
    localStorage.setItem('remembered_username', username.value)
  } else {
    localStorage.removeItem('remembered_username')
  }
}
</script>

<template>
  <label class="remember-me">
    <input type="checkbox" v-model="rememberMe" />
    <span>记住我</span>
  </label>
</template>
```

**关键点**：
- 使用 `localStorage` 持久化存储
- `onMounted` 时恢复数据
- 登录成功后根据复选框状态决定是否保存

</details>

---

### 练习 2：添加密码显示/隐藏切换
- 添加一个眼睛图标按钮
- 点击切换 input 的 type（password/text）

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const password = ref('')
const showPassword = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="password-input">
    <input 
      :type="showPassword ? 'text' : 'password'"
      v-model="password"
      placeholder="请输入密码"
    />
    <button 
      type="button" 
      class="toggle-btn"
      @click="togglePasswordVisibility"
    >
      <!-- 眼睛图标 -->
      <svg v-if="showPassword" viewBox="0 0 24 24">
        <!-- 睁眼图标 -->
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24">
        <!-- 闭眼图标 -->
        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27z"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.password-input {
  position: relative;
}

.toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.toggle-btn svg {
  width: 20px;
  height: 20px;
  fill: #666;
}
</style>
```

**关键点**：
- 使用 `:type` 动态绑定 input 类型
- `showPassword` 控制显示状态
- 按钮使用 `type="button"` 防止触发表单提交

</details>

---

### 练习 3：添加登录次数限制
- 连续失败 3 次后，禁用登录按钮 30 秒
- 显示倒计时

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const failCount = ref(0)
const lockoutTime = ref(0)
let lockoutTimer: number | null = null

const isLocked = computed(() => lockoutTime.value > 0)

async function handleLogin() {
  if (isLocked.value) return
  
  try {
    await authApi.login({ username: username.value, password: password.value })
    failCount.value = 0  // 成功后重置
    // ... 登录成功逻辑
  } catch (error) {
    failCount.value++
    
    if (failCount.value >= 3) {
      startLockout()
    }
    
    errorMsg.value = error?.message || '登录失败'
  }
}

function startLockout() {
  lockoutTime.value = 30
  
  lockoutTimer = window.setInterval(() => {
    lockoutTime.value--
    
    if (lockoutTime.value <= 0) {
      clearInterval(lockoutTimer!)
      lockoutTimer = null
      failCount.value = 0  // 解锁后重置失败次数
    }
  }, 1000)
}

onUnmounted(() => {
  if (lockoutTimer) clearInterval(lockoutTimer)
})
</script>

<template>
  <button 
    type="submit" 
    :disabled="loading || isLocked"
    @click="handleLogin"
  >
    <template v-if="isLocked">
      请等待 {{ lockoutTime }} 秒后重试
    </template>
    <template v-else>
      登录
    </template>
  </button>
  
  <p v-if="failCount > 0 && !isLocked" class="fail-hint">
    已失败 {{ failCount }} 次，3 次后将锁定 30 秒
  </p>
</template>
```

**关键点**：
- `failCount` 记录连续失败次数
- `lockoutTime` 倒计时秒数
- `setInterval` 实现倒计时
- 登录成功或解锁后重置计数
- `onUnmounted` 清理定时器

</details>

---

## 关键文件

- `apps/frontend/SMART-MALL/src/views/LoginView.vue` - 登录页面
- `apps/frontend/SMART-MALL/src/api/auth.api.ts` - 认证 API
- `apps/frontend/SMART-MALL/src/stores/user.ts` - 用户状态管理

---

## 组件化重构说明

登录页面已使用 Element Plus 组件 + SCSS 嵌套语法重构，大幅减少代码量：

### 使用的组件

| 组件 | 路径 | Element Plus 组件 |
|------|------|------------------|
| `AuthLayout` | `@/components/auth/AuthLayout.vue` | ElIcon |
| `AuthFormCard` | `@/components/auth/AuthFormCard.vue` | ElCard |
| `AuthInput` | `@/components/auth/AuthInput.vue` | ElInput, ElIcon, ElFormItem |
| `AuthButton` | `@/components/auth/AuthButton.vue` | ElButton, ElIcon |
| `AlertMessage` | `@/components/auth/AlertMessage.vue` | ElAlert |
| `TypewriterCard` | `@/components/auth/TypewriterCard.vue` | ElCard |
| `SocialLogin` | `@/components/auth/SocialLogin.vue` | ElButton, ElDivider, ElSpace, ElIcon |

### 重构前后对比

```
重构前：~400 行代码
重构后：~80 行代码
代码减少：80%
```

### 组件使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores'
import { authApi } from '@/api'
import { ElForm, ElText, ElLink, ElDivider } from 'element-plus'
import {
  AuthLayout,
  AuthFormCard,
  AuthInput,
  AuthButton,
  AlertMessage,
  TypewriterCard,
  SocialLogin,
} from '@/components'
</script>

<template>
  <AuthLayout
    brand-headline="重新定义商城管理的可能性"
    brand-subtitle="融合 3D 可视化与 AI 智能，打造下一代商业空间管理平台"
  >
    <template #brand-extra>
      <TypewriterCard :texts="featureTexts" />
    </template>

    <AuthFormCard title="欢迎回来" description="登录以继续使用 Smart Mall">
      <ElForm @submit.prevent="handleLogin">
        <AuthInput
          id="username"
          v-model="username"
          label="用户名"
          icon="user"
          placeholder="输入用户名"
          autocomplete="username"
          required
        />
        <AuthInput
          id="password"
          v-model="password"
          label="密码"
          type="password"
          icon="password"
          placeholder="输入密码"
          autocomplete="current-password"
          required
        />
        <AlertMessage v-if="errorMsg" type="error" :message="errorMsg" />
        <AuthButton text="登录" :loading="loading" />
      </ElForm>
      <SocialLogin />

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
      </template>
    </AuthFormCard>
  </AuthLayout>
</template>
```

### SCSS 嵌套语法示例

```scss
// 使用 SCSS 嵌套语法
.form-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  // 使用 :deep() 穿透 Element Plus 组件样式
  :deep(.el-link) {
    font-size: 13px;
  }

  :deep(.el-divider--vertical) {
    margin: 0;
    border-color: #3c4043;
  }
}

.test-hint {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;

  :deep(.el-text) {
    font-size: 11px;
    color: #5f6368;
  }
}
```

### UI 框架

项目已集成 Element Plus UI 框架：
- 全局注册在 `main.ts`
- 支持暗色主题
- 使用 `ElConfigProvider` 配置中文语言
- 可按需使用 Element Plus 组件

---

*"未经审视的代码不值得运行。" —— 改编自苏格拉底*
