# Smart Mall 设计规范

> 以 Linear App / Gemini 为审美基准的工程系统风格指南
> 
> 最后更新：2026-01-01

## 设计原则

### 核心理念

- **克制理性**：避免任何花哨设计，专注功能表达
- **深色优先**：Dark Mode First，减少视觉疲劳
- **专业工具感**：像工程系统，而非营销页面
- **信息层级清晰**：通过排版而非装饰建立视觉重点

### 禁止事项

- ❌ 明显的渐变背景（允许微妙的光晕效果）
- ❌ 夸张阴影或大面积模糊
- ❌ 高饱和度撞色
- ❌ 过度动画效果
- ❌ 拟物化图标
- ❌ 装饰性元素
- ❌ **Emoji 图标**（必须使用 SVG 图标）

---

## 色彩系统

### 背景色

```css
--bg-primary: #0a0a0b;      /* 主背景 */
--bg-secondary: #111113;    /* 次级背景/卡片 */
--bg-tertiary: #18181b;     /* 三级背景/hover */
--bg-elevated: #1c1c1f;     /* 悬浮层 */
```

### 边框色

```css
--border-subtle: #27272a;   /* 默认边框 */
--border-muted: #3f3f46;    /* 强调边框 */
--border-focus: #52525b;    /* 聚焦边框 */
```

### 文字色

```css
--text-primary: #fafafa;    /* 主文字 */
--text-secondary: #a1a1aa;  /* 次级文字 */
--text-muted: #71717a;      /* 辅助文字 */
--text-disabled: #52525b;   /* 禁用文字 */
```

### 功能色

```css
--accent-primary: #3b82f6;  /* 主强调色 - 蓝 */
--accent-hover: #2563eb;    /* 强调色 hover */
--accent-muted: #1d4ed8;    /* 强调色 pressed */

--success: #22c55e;         /* 成功 */
--warning: #f59e0b;         /* 警告 */
--error: #ef4444;           /* 错误 */
--info: #6366f1;            /* 信息 */
```

### 色彩使用原则

1. 背景层级：primary → secondary → tertiary，逐层变亮
2. 文字对比：主文字与背景对比度 ≥ 7:1
3. 强调色使用克制，仅用于关键操作和状态
4. 错误/成功状态使用低饱和度变体

---

## 间距系统

### 基础单位

基于 4px 网格，常用值：

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### 使用场景

| 场景 | 间距 |
|------|------|
| 元素内边距（紧凑） | 8px / 12px |
| 元素内边距（标准） | 12px / 16px |
| 元素间距 | 8px / 12px / 16px |
| 区块间距 | 24px / 32px / 48px |
| 页面边距 | 24px / 32px |

---

## 字体系统

### 字体栈

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 
             'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

### 字号层级

```css
--text-xs: 11px;      /* 辅助说明 */
--text-sm: 13px;      /* 次要文字 */
--text-base: 14px;    /* 正文 */
--text-lg: 16px;      /* 小标题 */
--text-xl: 18px;      /* 标题 */
--text-2xl: 24px;     /* 大标题 */
--text-3xl: 32px;     /* 页面标题 */
```

### 字重

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
```

### 行高

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

---

## 圆角系统

```css
--radius-sm: 4px;     /* 小元素：tag、badge */
--radius-md: 6px;     /* 中等元素：按钮、输入框 */
--radius-lg: 8px;     /* 大元素：卡片、弹窗 */
--radius-xl: 12px;    /* 特大元素：模态框 */
```

---

## 组件规范

### 按钮

#### Primary Button

```css
.btn-primary {
  background: var(--accent-primary);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-primary:disabled {
  background: var(--bg-tertiary);
  color: var(--text-disabled);
}
```

#### Secondary Button

```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-muted);
}
```

#### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.15s ease;
}

.btn-ghost:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
```

### 输入框

```css
.input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color 0.15s ease;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.input:disabled {
  background: var(--bg-tertiary);
  color: var(--text-disabled);
}

.input.error {
  border-color: var(--error);
}
```

### 卡片

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 24px;
}

/* 避免使用 box-shadow，使用 border 代替 */
```

### 分割线

```css
.divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 16px 0;
}
```

---

## 动效规范

### 过渡时间

```css
--duration-fast: 0.1s;
--duration-normal: 0.15s;
--duration-slow: 0.25s;
```

### 缓动函数

```css
--ease-default: ease;
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 使用原则

1. 所有交互反馈使用 0.15s
2. 避免弹跳、回弹等夸张效果
3. hover 状态变化要快速、轻微
4. 禁止使用 transform scale 放大效果

---

## 图标规范

### 风格要求

- 线性图标（stroke-based）
- 线宽：1.5px - 2px
- 尺寸：16px / 20px / 24px
- 颜色跟随文字色

### 推荐图标库

- Lucide Icons
- Heroicons (outline)
- Phosphor Icons (light)

---

## 布局规范

### 页面结构

```
┌─────────────────────────────────────┐
│  Header (56px)                      │
├─────────────────────────────────────┤
│                                     │
│  Content Area                       │
│  (padding: 24px - 32px)             │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### 对齐原则

1. 所有元素必须对齐到 4px 网格
2. 文字基线对齐
3. 图标与文字垂直居中
4. 表单 label 与 input 左对齐

### 留白原则

- 宁可空，不要挤
- 内容区域最大宽度：1200px
- 表单最大宽度：400px
- 段落间距 ≥ 行高

---

## 状态表达

### 交互状态

| 状态 | 表达方式 |
|------|----------|
| Default | 基础样式 |
| Hover | 背景微亮 / 边框加深 |
| Focus | 边框变为强调色 |
| Active | 背景加深 |
| Disabled | 降低透明度 / 灰色 |

### 业务状态

| 状态 | 颜色 | 使用场景 |
|------|------|----------|
| Success | #22c55e | 操作成功、在线 |
| Warning | #f59e0b | 警告、待处理 |
| Error | #ef4444 | 错误、失败 |
| Info | #6366f1 | 提示、进行中 |

---

## CSS 变量汇总

```css
:root {
  /* 背景 */
  --bg-primary: #0a0a0b;
  --bg-secondary: #111113;
  --bg-tertiary: #18181b;
  --bg-elevated: #1c1c1f;
  
  /* 边框 */
  --border-subtle: #27272a;
  --border-muted: #3f3f46;
  --border-focus: #52525b;
  
  /* 文字 */
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --text-disabled: #52525b;
  
  /* 强调色 */
  --accent-primary: #3b82f6;
  --accent-hover: #2563eb;
  --accent-muted: #1d4ed8;
  
  /* 功能色 */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #6366f1;
  
  /* 间距 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  
  /* 字体 */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'SF Mono', 'Consolas', monospace;
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  
  /* 动效 */
  --duration-fast: 0.1s;
  --duration-normal: 0.15s;
}
```

---

## 检查清单

开发时自查：

- [ ] 是否使用了渐变背景？（微妙光晕除外）
- [ ] 是否使用了 box-shadow？
- [ ] 动画时长是否超过 0.25s？
- [ ] 间距是否为 4px 的倍数？
- [ ] 颜色是否在规范内？
- [ ] 元素是否严格对齐？
- [ ] **是否使用了 emoji 图标？**（必须使用 SVG）
- [ ] 是否遵循深色主题？（`#0a0a0a` 背景）

---

## 特殊效果规范

### 毛玻璃效果（Backdrop Blur）

用于悬浮层、模态框、侧边栏等需要层次感的场景：

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 渐变光晕背景

用于页面背景，增加视觉层次：

```css
.glow-background {
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(78, 81, 102, 0.1), transparent);
}
```

### 卡片样式

统一的卡片样式：

```css
.card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}
```

---

## SVG 图标规范

### 使用原则

- 所有图标必须使用内联 SVG
- 禁止使用 emoji 作为图标
- 图标颜色使用 `currentColor` 继承文字颜色

### 常用图标示例

```html
<!-- Logo -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
  <path d="M2 17l10 5 10-5"/>
  <path d="M2 12l10 5 10-5"/>
</svg>

<!-- 箭头 -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M5 12h14M12 5l7 7-7 7"/>
</svg>

<!-- 用户 -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="8" r="4"/>
  <path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>
</svg>
```

---

## 布局组件规范

### 侧边栏

```css
.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
}

.sidebar-collapsed {
  width: 64px;
}
```

### 顶部栏

```css
.topbar {
  height: 56px;
  background: rgba(10, 10, 10, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
}
```

### 内容区域

```css
.content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
```