---
inclusion: fileMatch
fileMatchPattern: "**/*.vue"
---

# SCSS 嵌套规范

## 必须使用 SCSS

所有 Vue 组件的样式必须使用 SCSS：

```vue
<style scoped lang="scss">
// 样式代码
</style>
```

## 必须嵌套的情况

### 1. 伪类和伪元素

```scss
// ✅ 正确
.btn-primary {
  background: #60a5fa;
  
  &:hover {
    background: #93c5fd;
  }
  
  &:active {
    background: #3b82f6;
  }
  
  &::before {
    content: '';
  }
}

// ❌ 错误
.btn-primary {
  background: #60a5fa;
}

.btn-primary:hover {
  background: #93c5fd;
}
```

### 2. 状态类

```scss
// ✅ 正确
.floor-item {
  background: transparent;
  
  &.active {
    background: rgba(96, 165, 250, 0.15);
  }
  
  &.disabled {
    opacity: 0.5;
  }
}

// ❌ 错误
.floor-item {
  background: transparent;
}

.floor-item.active {
  background: rgba(96, 165, 250, 0.15);
}
```

### 3. 子元素选择器

```scss
// ✅ 正确
.search-box {
  position: relative;
  
  input {
    width: 100%;
    padding: 10px;
    
    &:focus {
      border-color: #60a5fa;
    }
    
    &::placeholder {
      color: #5f6368;
    }
  }
}

// ❌ 错误
.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 10px;
}
```

### 4. 直接子元素

```scss
// ✅ 正确
.ui-overlay {
  position: absolute;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
}
```

## 嵌套深度限制

- 最大嵌套深度：3 层
- 超过 3 层时考虑重构选择器

```scss
// ✅ 可接受
.panel {
  .header {
    h3 {
      color: #e8eaed;
    }
  }
}

// ❌ 避免
.panel {
  .header {
    .title {
      span {
        color: #e8eaed;
      }
    }
  }
}
```

## Element Plus 样式覆盖

### 使用 :deep() 穿透

```scss
// ✅ 正确 - 使用 :deep() 穿透
.input-row {
  :deep(.el-textarea__inner) {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #e8eaed;

    &::placeholder {
      color: #5f6368;
    }

    &:focus {
      border-color: #60a5fa;
    }
  }
}

// ❌ 错误 - 直接写选择器无法穿透 scoped
.input-row .el-textarea__inner {
  background: rgba(255, 255, 255, 0.08);
}
```

### 常用组件覆盖

```scss
// Badge 红点样式
.ai-badge {
  :deep(.el-badge__content.is-dot) {
    top: 4px;
    right: 4px;
    background: #ef4444;
  }
}

// Button 样式
.custom-btn {
  :deep(.el-button) {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}
```

## 代码组织

### 使用注释分隔区块

```scss
// ============================================================================
// Loading Overlay
// ============================================================================
.loading-overlay {
  // ...
}

// ============================================================================
// Top Bar
// ============================================================================
.top-bar {
  // ...
}
```

### CSS 属性顺序

1. 定位属性 (position, top, right, bottom, left, z-index)
2. 盒模型 (display, flex, width, height, margin, padding)
3. 边框和背景 (border, background)
4. 文字 (font, color, text-align)
5. 其他 (cursor, transition, animation)

```scss
.example {
  // 定位
  position: absolute;
  top: 0;
  left: 0;
  z-index: 100;
  
  // 盒模型
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  
  // 边框和背景
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0a0a0a;
  border-radius: 8px;
  
  // 文字
  font-size: 14px;
  color: #e8eaed;
  
  // 其他
  cursor: pointer;
  transition: all 0.15s;
}
```

## 滚动条样式

```scss
.scrollable-container {
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}
```

## Vue Transition 动画

```scss
// 淡入淡出
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 面板滑动
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
```

## 响应式设计

```scss
.ai-chat-panel {
  width: 380px;
  height: 520px;
  
  @media (max-width: 480px) {
    width: auto;
    height: 60vh;
  }
}
```

## 验证清单

- [ ] 是否使用 `<style scoped lang="scss">`？
- [ ] 伪类和伪元素是否嵌套？
- [ ] 状态类是否嵌套？
- [ ] 嵌套深度是否不超过 3 层？
- [ ] Element Plus 样式是否使用 :deep()？
- [ ] CSS 属性是否按顺序排列？
- [ ] 是否使用注释分隔区块？
