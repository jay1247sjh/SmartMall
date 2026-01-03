# Requirements Document

## Introduction

重构 Smart Mall 登录页面的视觉样式，采用左右分栏布局，整体审美严格参考 Linear App 风格。页面定位为工程系统/管理控制台的登录入口，面向工程师和管理员用户，风格偏理性、专业、系统感强。

## Glossary

- **Login_Page**: 登录页面组件，包含左侧身份展示区和右侧登录表单区
- **Brand_Panel**: 左侧系统身份展示区，用于传达系统身份与专业感
- **Login_Form**: 右侧登录表单区域，包含用户名、密码输入和提交按钮
- **Gradient_Text**: 低饱和度、克制的渐变文字效果，仅用于系统标题
- **Subtle_Border**: 细微边框样式，使用 1px 低对比度边框代替阴影

## Requirements

### Requirement 1: 左右分栏布局

**User Story:** As a 用户, I want 看到左右分栏的登录页面布局, so that 我能感受到专业工程系统的入口体验。

#### Acceptance Criteria

1. THE Login_Page SHALL 使用左右分栏布局，左侧为 Brand_Panel，右侧为 Login_Form
2. WHEN 页面宽度大于 768px, THE Login_Page SHALL 显示左右分栏布局，左侧占比约 45-50%
3. WHEN 页面宽度小于等于 768px, THE Login_Page SHALL 隐藏左侧 Brand_Panel，仅显示 Login_Form
4. THE Login_Page SHALL 占满整个视口高度（100vh）

### Requirement 2: 左侧系统身份展示区

**User Story:** As a 用户, I want 在左侧看到系统名称和简洁描述, so that 我能快速识别这是什么系统。

#### Acceptance Criteria

1. THE Brand_Panel SHALL 包含系统名称（大字号）和一句克制的系统描述
2. THE Brand_Panel 的系统名称 SHALL 使用低饱和度、克制的 Gradient_Text 效果
3. THE Brand_Panel 背景 SHALL 保持简洁，可使用非常弱的渐变或微妙的噪点纹理
4. THE Brand_Panel SHALL NOT 使用插画、人物、复杂图形或高对比背景
5. THE Brand_Panel SHALL 垂直居中显示内容
6. THE Brand_Panel 的系统描述 SHALL 使用 text-muted 颜色，字号小于系统名称

### Requirement 3: 右侧登录表单区

**User Story:** As a 用户, I want 在右侧看到简洁的登录表单, so that 我能快速完成登录操作。

#### Acceptance Criteria

1. THE Login_Form SHALL 保持现有表单结构（用户名、密码、提交按钮）
2. THE Login_Form SHALL 减少卡片感，使用 Subtle_Border 而非明显阴影
3. THE Login_Form 的输入框和按钮样式 SHALL 保持克制，遵循现有设计规范
4. WHEN 表单验证失败, THE Login_Form SHALL 显示错误提示，但不抢视觉焦点
5. THE Login_Form SHALL 垂直居中显示在右侧区域
6. THE Login_Form 最大宽度 SHALL 不超过 400px

### Requirement 4: 深色模式视觉风格

**User Story:** As a 用户, I want 看到深色模式优先的界面, so that 我能获得专业工程系统的视觉体验。

#### Acceptance Criteria

1. THE Login_Page SHALL 使用深色模式配色（dark mode first）
2. THE Login_Page SHALL 使用低饱和度配色，避免鲜艳撞色
3. THE Login_Page SHALL NOT 使用大面积渐变背景
4. THE Login_Page SHALL NOT 使用夸张阴影、发光效果或炫技动画
5. THE Login_Page SHALL 通过排版层级、间距、对齐体现高级感

### Requirement 5: 排版与间距

**User Story:** As a 用户, I want 看到层级清晰、留白充足的页面, so that 我能获得舒适的视觉体验。

#### Acceptance Criteria

1. THE Login_Page SHALL 保持充足的留白，宁可空不要挤
2. THE Login_Page 的视觉层级 SHALL 清晰：标题 > 表单 > 辅助信息
3. THE Login_Page 所有间距 SHALL 遵循统一节奏（4px / 8px / 12px / 16px / 24px / 32px 的倍数）
4. THE Login_Form 内部元素间距 SHALL 保持一致性

### Requirement 6: 响应式适配

**User Story:** As a 用户, I want 在不同设备上都能正常使用登录页面, so that 我能在任何设备上登录系统。

#### Acceptance Criteria

1. WHEN 屏幕宽度小于等于 768px, THE Login_Page SHALL 切换为单列布局
2. WHEN 屏幕宽度小于等于 768px, THE Brand_Panel SHALL 隐藏或简化显示
3. THE Login_Form SHALL 在移动端保持可用性和可读性
4. THE Login_Page SHALL 在各种屏幕尺寸下保持视觉一致性
