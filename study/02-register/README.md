# 注册功能学习指南

> 苏格拉底式教学：通过提问引导你理解注册功能的实现

## 第一部分：理解问题

### 问题 1：注册和登录有什么不同？

在开始之前，让我问你：

**注册功能比登录功能多了哪些复杂性？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

对比一下：

| 登录 | 注册 |
|------|------|
| 2 个字段 | 5+ 个字段 |
| 简单验证 | 复杂验证规则 |
| 无需检查重复 | 需要检查用户名/邮箱是否已存在 |
| 一次性验证 | 实时验证 + 提交验证 |

注册的额外挑战：
1. **多字段验证** - 每个字段有不同的规则
2. **实时反馈** - 用户输入时就要告诉他对不对
3. **异步检查** - 用户名是否已被占用？
4. **防抖优化** - 不能每输入一个字符就发请求

</details>

---

### 问题 2：为什么用 `computed` 而不是 `ref` 做验证？

看这段代码：

```typescript
const usernameError = computed(() => {
  if (!username.value) return ''
  if (username.value.length < 3) return '用户名至少3个字符'
  if (username.value.length > 20) return '用户名最多20个字符'
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) return '只能包含字母、数字和下划线'
  if (usernameAvailable.value === false) return '用户名已被注册'
  return ''
})
```

**为什么不这样写？**

```typescript
const usernameError = ref('')

watch(username, (val) => {
  if (!val) usernameError.value = ''
  else if (val.length < 3) usernameError.value = '用户名至少3个字符'
  // ...
})
```

---

<details>
<summary>💡 点击查看引导</summary>

两种方式的区别：

**`computed` 的优势**：
- 声明式：描述"错误是什么"，而不是"何时更新错误"
- 自动追踪依赖：`username` 或 `usernameAvailable` 变化时自动重算
- 缓存：相同输入不会重复计算
- 代码更简洁

**`watch` 的问题**：
- 命令式：需要手动管理更新时机
- 容易遗漏依赖（比如忘了监听 `usernameAvailable`）
- 代码更冗长

**关键洞察**：当一个值完全由其他值"派生"出来时，用 `computed`。

</details>

---

## 第二部分：实时验证

### 问题 3：这个正则表达式在检查什么？

```typescript
if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
  return '只能包含字母、数字和下划线'
}
```

**拆解这个正则：`/^[a-zA-Z0-9_]+$/`**

---

<details>
<summary>💡 点击查看引导</summary>

让我们逐个字符分析：

- `^` - 字符串开头
- `[a-zA-Z0-9_]` - 字符集：小写字母、大写字母、数字、下划线
- `+` - 前面的字符集出现 1 次或多次
- `$` - 字符串结尾

合起来：**整个字符串必须只由字母、数字、下划线组成**

测试一下：
- `"hello123"` → ✅ 匹配
- `"hello_world"` → ✅ 匹配
- `"hello world"` → ❌ 不匹配（有空格）
- `"hello@123"` → ❌ 不匹配（有 @）

**追问**：为什么用 `!` 取反？`test()` 返回什么？

</details>

---

### 问题 4：手机号验证的正则是什么意思？

```typescript
if (!/^1[3-9]\d{9}$/.test(phone.value)) {
  return '手机号格式不正确'
}
```

**这个正则 `/^1[3-9]\d{9}$/` 能匹配哪些手机号？**

---

<details>
<summary>💡 点击查看引导</summary>

拆解：

- `^` - 开头
- `1` - 字面量 1（中国手机号都以 1 开头）
- `[3-9]` - 第二位是 3-9 之间的数字
- `\d{9}` - 后面跟 9 个数字
- `$` - 结尾

总共：1 + 1 + 9 = 11 位数字

能匹配：
- `13812345678` ✅
- `19912345678` ✅
- `12345678901` ❌（第二位是 2）
- `1381234567` ❌（只有 10 位）

**追问**：为什么第二位要限制 `[3-9]`？`10`、`11`、`12` 开头的号码是什么？

</details>

---

## 第三部分：防抖（Debounce）

### 问题 5：什么是防抖？为什么需要它？

看这段代码：

```typescript
let usernameTimer: number | null = null

watch(username, (val) => {
  usernameAvailable.value = null
  if (usernameTimer) clearTimeout(usernameTimer)
  
  if (val && val.length >= 3 && /^[a-zA-Z0-9_]+$/.test(val)) {
    usernameChecking.value = true
    usernameTimer = window.setTimeout(async () => {
      try {
        usernameAvailable.value = await registerApi.checkUsername(val)
      } catch {
        usernameAvailable.value = null
      } finally {
        usernameChecking.value = false
      }
    }, 500)
  }
})
```

**如果用户快速输入 "hello"，会发生什么？**

---

<details>
<summary>💡 点击查看引导</summary>

没有防抖时：
1. 输入 `h` → 发请求检查 "h"
2. 输入 `e` → 发请求检查 "he"
3. 输入 `l` → 发请求检查 "hel"
4. 输入 `l` → 发请求检查 "hell"
5. 输入 `o` → 发请求检查 "hello"

5 次请求！而且前 4 次都是浪费的。

有防抖时（500ms）：
1. 输入 `h` → 设置 500ms 定时器
2. 输入 `e`（100ms 后）→ 取消上一个定时器，设置新的
3. 输入 `l`（100ms 后）→ 取消上一个定时器，设置新的
4. 输入 `l`（100ms 后）→ 取消上一个定时器，设置新的
5. 输入 `o`（100ms 后）→ 取消上一个定时器，设置新的
6. 等待 500ms → 发请求检查 "hello"

只有 1 次请求！

**防抖的本质**：等用户"停下来"再执行。

</details>

---

### 问题 6：为什么要先 `clearTimeout` 再 `setTimeout`？

```typescript
if (usernameTimer) clearTimeout(usernameTimer)
usernameTimer = window.setTimeout(async () => {
  // ...
}, 500)
```

**如果不 `clearTimeout` 会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

不清除的话：

1. 输入 `h` → 设置定时器 A（500ms 后执行）
2. 输入 `e`（100ms 后）→ 设置定时器 B（500ms 后执行）
3. 400ms 后 → 定时器 A 执行，检查 "he"（但用户已经输入更多了！）
4. 500ms 后 → 定时器 B 执行，检查 "he"

问题：
- 多个请求同时发出
- 检查的是过时的值
- 响应顺序不确定，可能显示错误的结果

**关键**：每次输入都要"重置"等待时间。

</details>

---

### 问题 7：为什么防抖时间是 500ms？

**500ms 是怎么选出来的？太短或太长会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

考虑这些因素：

**太短（如 100ms）**：
- 用户还在打字就发请求了
- 请求次数还是很多
- 没有达到防抖的目的

**太长（如 2000ms）**：
- 用户等太久才看到反馈
- 体验不好，感觉系统很慢

**500ms 是一个平衡点**：
- 大多数人打字的间隔 < 500ms
- 用户停下来思考时，通常 > 500ms
- 反馈不会太慢

**实际项目中**：可能需要根据用户测试来调整。

</details>

---

## 第四部分：表单状态管理

### 问题 8：`isFormValid` 是如何工作的？

```typescript
const isFormValid = computed(() => {
  const hasRequiredFields = username.value && 
         email.value && 
         password.value && 
         confirmPassword.value
  
  const noFormatErrors = !usernameError.value &&
         !emailError.value &&
         !passwordError.value &&
         !confirmPasswordError.value &&
         !phoneError.value
  
  const availabilityOk = usernameAvailable.value !== false && 
         emailAvailable.value !== false
  
  return hasRequiredFields && noFormatErrors && availabilityOk
})
```

**为什么 `availabilityOk` 用 `!== false` 而不是 `=== true`？**

---

<details>
<summary>💡 点击查看引导</summary>

`usernameAvailable` 有三种状态：

- `null` - 还没检查（或检查失败）
- `true` - 可用
- `false` - 已被占用

如果用 `=== true`：
- `null` → 不允许提交
- 用户必须等检查完成才能提交
- 如果网络慢或检查失败，用户被卡住

如果用 `!== false`：
- `null` → 允许提交（让后端再验证一次）
- `true` → 允许提交
- `false` → 不允许提交

**这是一种"宽松"策略**：前端检查是优化，不是强制。后端才是最终防线。

</details>

---

### 问题 9：三元状态的 UI 反馈

```vue
<span v-if="usernameChecking" class="input-status checking"></span>
<span v-else-if="usernameAvailable === true && !usernameError" class="input-status valid">✓</span>
```

**这里有几种 UI 状态？分别是什么？**

---

<details>
<summary>💡 点击查看引导</summary>

四种状态：

1. **空白** - 还没输入，或输入不符合基本格式
2. **加载中** - 正在检查可用性（显示旋转动画）
3. **可用** - 检查通过（显示绿色 ✓）
4. **错误** - 格式错误或已被占用（显示红色错误信息）

状态转换：
```
空白 → 输入 → 格式验证 → 通过 → 检查中 → 可用/已占用
                    ↓
                  格式错误
```

**追问**：为什么 `usernameAvailable === true && !usernameError`？两个条件都需要吗？

</details>

---

## 第五部分：注册流程

### 问题 10：注册成功后为什么要延迟跳转？

```typescript
successMsg.value = '注册成功！即将跳转到登录页面...'

setTimeout(() => {
  router.push('/login')
}, 2000)
```

**为什么不直接跳转？**

---

<details>
<summary>💡 点击查看引导</summary>

直接跳转的问题：
- 用户不知道发生了什么
- 突然换页面，很突兀
- 用户可能以为出错了

延迟跳转的好处：
- 给用户一个"成功"的反馈
- 让用户有心理准备
- 更好的用户体验

**2 秒是一个常见的选择**：
- 足够读完提示信息
- 不会让用户等太久

**追问**：如果用户在这 2 秒内关闭页面，会有问题吗？

</details>

---

## 动手练习

### 练习 1：添加密码强度指示器
- 显示密码强度：弱、中、强
- 根据长度、是否包含数字、是否包含特殊字符判断

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const password = ref('')

// 计算密码强度
const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return { level: 0, text: '', color: '' }
  
  let score = 0
  
  // 长度评分
  if (pwd.length >= 6) score++
  if (pwd.length >= 10) score++
  
  // 包含数字
  if (/\d/.test(pwd)) score++
  
  // 包含小写字母
  if (/[a-z]/.test(pwd)) score++
  
  // 包含大写字母
  if (/[A-Z]/.test(pwd)) score++
  
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++
  
  if (score <= 2) {
    return { level: 1, text: '弱', color: '#f56c6c' }
  } else if (score <= 4) {
    return { level: 2, text: '中', color: '#e6a23c' }
  } else {
    return { level: 3, text: '强', color: '#67c23a' }
  }
})
</script>

<template>
  <div class="password-field">
    <input type="password" v-model="password" placeholder="请输入密码" />
    
    <div v-if="password" class="strength-indicator">
      <div class="strength-bars">
        <span 
          v-for="i in 3" 
          :key="i"
          :class="{ active: i <= passwordStrength.level }"
          :style="{ backgroundColor: i <= passwordStrength.level ? passwordStrength.color : '#ddd' }"
        ></span>
      </div>
      <span class="strength-text" :style="{ color: passwordStrength.color }">
        {{ passwordStrength.text }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.strength-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.strength-bars {
  display: flex;
  gap: 4px;
}

.strength-bars span {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  transition: background-color 0.3s;
}

.strength-text {
  font-size: 12px;
}
</style>
```

**关键点**：
- 使用 `computed` 根据密码内容计算强度
- 多维度评分：长度、数字、大小写、特殊字符
- 视觉反馈：颜色条 + 文字

</details>

---

### 练习 2：添加用户协议复选框
- 必须勾选才能注册
- 点击"用户协议"打开弹窗或新页面

<details>
<summary>📝 参考答案</summary>

```vue
<script setup lang="ts">
const agreedToTerms = ref(false)
const showTermsModal = ref(false)

const isFormValid = computed(() => {
  return /* 其他验证条件 */ && agreedToTerms.value
})

function openTerms() {
  showTermsModal.value = true
}
</script>

<template>
  <div class="terms-checkbox">
    <label>
      <input type="checkbox" v-model="agreedToTerms" />
      <span>
        我已阅读并同意
        <a href="#" @click.prevent="openTerms">《用户协议》</a>
        和
        <a href="#" @click.prevent="openTerms">《隐私政策》</a>
      </span>
    </label>
  </div>
  
  <button :disabled="!isFormValid">注册</button>
  
  <!-- 协议弹窗 -->
  <Teleport to="body">
    <div v-if="showTermsModal" class="modal-overlay" @click="showTermsModal = false">
      <div class="modal-content" @click.stop>
        <h2>用户协议</h2>
        <div class="terms-content">
          <p>1. 服务条款...</p>
          <p>2. 隐私保护...</p>
          <!-- 更多内容 -->
        </div>
        <button @click="showTermsModal = false">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.terms-checkbox a {
  color: #409eff;
  text-decoration: none;
}

.terms-checkbox a:hover {
  text-decoration: underline;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}
</style>
```

**关键点**：
- `agreedToTerms` 控制复选框状态
- 将协议勾选加入 `isFormValid` 验证
- `@click.prevent` 阻止链接默认行为
- `Teleport` 将弹窗渲染到 body 下

</details>

---

### 练习 3：优化防抖
- 把防抖逻辑提取成一个可复用的函数
- 提示：可以用 `useDebounceFn` 或自己实现

<details>
<summary>📝 参考答案</summary>

```typescript
// composables/useDebounce.ts

import { ref, watch, type Ref } from 'vue'

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 */
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500
) {
  let timer: number | null = null
  
  const debouncedFn = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    
    timer = window.setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  return { debouncedFn, cancel }
}

/**
 * 防抖的响应式值
 * @param source 源 ref
 * @param delay 延迟时间
 */
export function useDebouncedRef<T>(source: Ref<T>, delay: number = 500): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: number | null = null
  
  watch(source, (newVal) => {
    if (timer) clearTimeout(timer)
    
    timer = window.setTimeout(() => {
      debounced.value = newVal
    }, delay)
  })
  
  return debounced
}
```

**使用示例**：

```vue
<script setup lang="ts">
import { useDebounceFn, useDebouncedRef } from '@/composables/useDebounce'

const username = ref('')
const usernameAvailable = ref<boolean | null>(null)

// 方式 1：使用防抖函数
const { debouncedFn: checkUsername } = useDebounceFn(async (name: string) => {
  usernameAvailable.value = await registerApi.checkUsername(name)
}, 500)

watch(username, (val) => {
  if (val.length >= 3) {
    checkUsername(val)
  }
})

// 方式 2：使用防抖 ref
const debouncedUsername = useDebouncedRef(username, 500)

watch(debouncedUsername, async (val) => {
  if (val.length >= 3) {
    usernameAvailable.value = await registerApi.checkUsername(val)
  }
})
</script>
```

**关键点**：
- 提取为可复用的 composable
- 提供 `cancel` 方法用于清理
- 两种模式：函数防抖 / 值防抖
- TypeScript 泛型保持类型安全

</details>

---

## 关键文件

- `apps/frontend/SMART-MALL/src/views/RegisterView.vue` - 注册页面
- `apps/frontend/SMART-MALL/src/api/register.api.ts` - 注册 API

---

*"真正的智慧是知道自己无知。" —— 苏格拉底*
