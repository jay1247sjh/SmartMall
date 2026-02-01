---
inclusion: fileMatch
fileMatchPattern: "**/*.vue"
---

# 前端样式指南

> 参考 Linear App / Gemini 的审美基准

## 设计原则

### 核心理念
- **克制理性** - 避免花哨设计，专注功能表达
- **深色优先** - Dark Mode First，减少视觉疲劳
- **专业工具感** - 像工程系统，而非营销页面
- **信息层级清晰** - 通过排版而非装饰建立视觉重点

### 禁止事项
- ❌ 明显的渐变背景（允许微妙的光晕效果）
- ❌ 夸张阴影或大面积模糊
- ❌ 高饱和度撞色
- ❌ 过度动画效果
- ❌ 拟物化图标
- ❌ 装饰性元素
- ❌ **Emoji 图标**（必须使用 SVG 图标）

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

## 间距系统

基于 4px 网格：
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

## 字体系统

### 字体栈
```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
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
```

## 圆角系统

```css
--radius-sm: 4px;     /* 小元素：tag、badge */
--radius-md: 6px;     /* 中等元素：按钮、输入框 */
--radius-lg: 8px;     /* 大元素：卡片、弹窗 */
--radius-xl: 12px;    /* 特大元素：模态框 */
```

## 组件规范

### 按钮

```scss
// Primary Button
.btn-primary {
  background: var(--accent-primary);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.15s ease;

  &:hover {
    background: var(--accent-hover);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-disabled);
  }
}

// Secondary Button
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  padding: 8px 16px;
  border-radius: 6px;
  
  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-muted);
  }
}
```

### 输入框

```scss
.input {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: border-color 0.15s ease;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  &.error {
    border-color: var(--error);
  }
}
```

### 卡片

```scss
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 24px;
  
  // 避免使用 box-shadow，使用 border 代替
}
```

## 动效规范

### 过渡时间
```css
--duration-fast: 0.1s;
--duration-normal: 0.15s;
--duration-slow: 0.25s;
```

### 使用原则
- 所有交互反馈使用 0.15s
- 避免弹跳、回弹等夸张效果
- hover 状态变化要快速、轻微
- 禁止使用 transform scale 放大效果

## SVG 图标规范

### 风格要求
- 线性图标（stroke-based）
- 线宽：1.5px - 2px
- 尺寸：16px / 20px / 24px
- 颜色跟随文字色（currentColor）

### 推荐图标库
- Lucide Icons
- Heroicons (outline)
- Phosphor Icons (light)

### 使用示例

```vue
<template>
  <!-- ✅ 正确：使用 SVG 图标 -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
  </svg>
  
  <!-- ❌ 错误：使用 emoji -->
  <span>🏪</span>
</template>
```

## 特殊效果

### 毛玻璃效果

```scss
.glass-effect {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 渐变光晕背景

```scss
.glow-background {
  background: 
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.15), transparent),
    radial-gradient(ellipse 60% 40% at 80% 50%, rgba(78, 81, 102, 0.1), transparent);
}
```

## 验证清单

- [ ] 是否使用了渐变背景？（微妙光晕除外）
- [ ] 是否使用了 box-shadow？
- [ ] 动画时长是否超过 0.25s？
- [ ] 间距是否为 4px 的倍数？
- [ ] 颜色是否在规范内？
- [ ] 元素是否严格对齐？
- [ ] **是否使用了 emoji 图标？**（必须使用 SVG）
- [ ] 是否遵循深色主题？（`#0a0a0a` 背景）

## 参考文件

良好的样式设计示例：
- `apps/frontend/SMART-MALL/src/views/Mall3DView.vue`
- `apps/frontend/SMART-MALL/src/components/ai/GlobalAiAssistant.vue`
