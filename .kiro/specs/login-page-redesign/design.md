# Design Document

## Overview

本设计文档描述 Smart Mall 登录页面的视觉重构方案。采用 Linear App 风格的左右分栏布局，左侧为系统身份展示区，右侧为登录表单区。整体风格偏理性、专业、系统感强，面向工程师和管理员用户。

## Architecture

### 页面结构

```
┌─────────────────────────────────────────────────────────────┐
│                      Login Page (100vh)                      │
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│      Brand Panel            │       Login Form Panel        │
│      (45-50%)               │       (50-55%)                │
│                             │                               │
│   ┌─────────────────────┐   │   ┌───────────────────────┐   │
│   │                     │   │   │                       │   │
│   │   System Title      │   │   │   Form Container      │   │
│   │   (Gradient Text)   │   │   │   (max-width: 400px)  │   │
│   │                     │   │   │                       │   │
│   │   System Tagline    │   │   │   - Username Input    │   │
│   │   (Muted Text)      │   │   │   - Password Input    │   │
│   │                     │   │   │   - Error Message     │   │
│   └─────────────────────┘   │   │   - Submit Button     │   │
│                             │   │   - Footer Hint       │   │
│                             │   │                       │   │
│                             │   └───────────────────────┘   │
│                             │                               │
└─────────────────────────────┴───────────────────────────────┘
```

### 响应式断点

```
Desktop (> 768px):  左右分栏布局
Mobile  (≤ 768px): 单列布局，隐藏 Brand Panel
```

## Components and Interfaces

### LoginPage Component

主页面容器组件，负责整体布局。

```vue
<template>
  <div class="login-page">
    <BrandPanel class="brand-panel" />
    <LoginFormPanel class="form-panel" />
  </div>
</template>
```

### BrandPanel Component

左侧系统身份展示区，包含系统名称和描述。

```typescript
interface BrandPanelProps {
  systemName: string      // 系统名称，如 "Smart Mall"
  tagline: string         // 系统描述，如 "3D 智能商城管理系统"
}
```

### LoginFormPanel Component

右侧登录表单区，包含表单和辅助信息。

```typescript
interface LoginFormPanelProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>
  loading: boolean
  error: string | null
}

interface LoginCredentials {
  username: string
  password: string
}
```

## Data Models

### 样式变量扩展

在现有 CSS 变量基础上，新增以下变量：

```css
:root {
  /* 渐变文字 - 低饱和度 */
  --gradient-text-start: #e4e4e7;
  --gradient-text-end: #71717a;
  
  /* Brand Panel 背景 */
  --brand-bg-gradient-start: #0a0a0b;
  --brand-bg-gradient-end: #111113;
  
  /* 微妙噪点纹理 */
  --noise-opacity: 0.02;
}
```

### 间距系统

遵循现有 4px 网格系统：

| 用途 | 间距值 |
|------|--------|
| 表单元素内边距 | 10px 12px |
| 表单元素间距 | 16px |
| 区块内边距 | 24px / 32px |
| 面板内边距 | 48px / 64px |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: 间距值符合设计系统

*For any* CSS 间距属性值（padding, margin, gap），该值 SHALL 是 4px 的倍数（4, 8, 12, 16, 20, 24, 32, 40, 48, 64）

**Validates: Requirements 5.3**

### Property 2: 表单结构完整性

*For any* 登录表单渲染，表单 SHALL 包含用户名输入框、密码输入框和提交按钮

**Validates: Requirements 3.1**

### Property 3: 响应式布局切换

*For any* 视口宽度 ≤ 768px，Brand_Panel SHALL 不可见或 display: none

**Validates: Requirements 1.3, 6.1, 6.2**

## Error Handling

### 表单验证错误

```typescript
// 错误状态显示
interface FormError {
  field: 'username' | 'password' | 'general'
  message: string
}

// 错误提示样式 - 克制、不抢焦点
.error-message {
  background: rgba(239, 68, 68, 0.08);  // 更低透明度
  border: 1px solid rgba(239, 68, 68, 0.15);
  color: var(--error);
  font-size: 13px;
}
```

### 登录失败处理

- 网络错误：显示通用错误提示
- 认证失败：显示"用户名或密码错误"
- 服务器错误：显示"服务暂时不可用"

## Testing Strategy

### 单元测试

使用 Vitest 进行组件测试：

1. **BrandPanel 渲染测试**
   - 验证系统名称和描述正确显示
   - 验证渐变文字样式应用

2. **LoginFormPanel 功能测试**
   - 验证表单提交逻辑
   - 验证错误提示显示
   - 验证 loading 状态

3. **响应式布局测试**
   - 验证桌面端显示两栏
   - 验证移动端隐藏 Brand Panel

### 属性测试

使用 fast-check 进行属性测试：

1. **间距属性测试**
   - 生成随机间距值
   - 验证所有间距值是 4px 的倍数

### 视觉回归测试

使用 Playwright 进行截图对比：

1. 桌面端完整页面截图
2. 移动端完整页面截图
3. 错误状态截图
4. Loading 状态截图

---

## 视觉设计详细规范

### Brand Panel 设计

```css
.brand-panel {
  /* 布局 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 64px;
  
  /* 背景 - 极其微妙的渐变 */
  background: linear-gradient(
    135deg,
    var(--brand-bg-gradient-start) 0%,
    var(--brand-bg-gradient-end) 100%
  );
  
  /* 可选：微妙噪点纹理 */
  position: relative;
}

.brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* 噪点 SVG */
  opacity: var(--noise-opacity);
  pointer-events: none;
}
```

### 渐变文字效果

```css
.system-title {
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.1;
  
  /* 低饱和度渐变 */
  background: linear-gradient(
    135deg,
    var(--gradient-text-start) 0%,
    var(--gradient-text-end) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.system-tagline {
  font-size: 16px;
  color: var(--text-muted);
  margin-top: 16px;
  max-width: 280px;
  line-height: 1.5;
}
```

### Login Form Panel 设计

```css
.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: var(--bg-primary);
}

.form-container {
  width: 100%;
  max-width: 400px;
}

/* 减少卡片感 - 使用更轻的边框 */
.login-form {
  background: transparent;  /* 或 var(--bg-secondary) */
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 32px;
}
```

### 输入框样式

```css
.form-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--border-muted);  /* 更克制的聚焦效果 */
}

.form-input::placeholder {
  color: var(--text-muted);
}
```

### 按钮样式

```css
.btn-submit {
  width: 100%;
  padding: 12px 16px;
  background: var(--accent-primary);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-submit:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-submit:disabled {
  background: var(--bg-tertiary);
  color: var(--text-disabled);
  cursor: not-allowed;
}
```

### 响应式样式

```css
@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  
  .brand-panel {
    display: none;
  }
  
  .form-panel {
    padding: 24px;
  }
  
  .form-container {
    max-width: 100%;
  }
}
```
