# AI 提示词配置指南

本目录包含 Smart Mall 项目的 AI 提示词配置文件，用于约束和引导 AI 助手的行为。

---

## 文件说明

| 文件 | 用途 | 使用场景 |
|------|------|----------|
| `project-context.prompt.md` | 项目上下文 | 始终加载，提供项目背景 |
| `mode-strict-coding.prompt.md` | 严格编码模式 | 生产级代码开发 |
| `mode-progressive-coding.prompt.md` | 渐进式编码模式 | 教学式开发 |
| `mode-architect-review.prompt.md` | 架构评审模式 | 设计评审 |
| `mode-debug-detective.prompt.md` | 调试排查模式 | 问题排查 |
| `mode-socratic-teaching.prompt.md` | 苏格拉底教学模式 | 概念学习 |
| `mode-ai-coding.prompt.md` | AI 服务编码模式 | Python AI 开发 |

---

## 使用方式

### 方式 1：在对话中引用

```
请使用 @.prompt/mode-strict-coding.prompt.md 模式帮我实现 xxx
```

### 方式 2：IDE 配置

在 Kiro/Cursor 等 IDE 中，将提示词文件添加到上下文。

### 方式 3：组合使用

```
请使用以下提示词：
- @.prompt/project-context.prompt.md
- @.prompt/mode-strict-coding.prompt.md

帮我实现 xxx
```

---

## 模式选择指南

```
┌─────────────────────────────────────────────────────────────┐
│                    你想做什么？                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  写生产代码 ──────────────▶ mode-strict-coding              │
│                                                             │
│  学习新概念 ──────────────▶ mode-socratic-teaching          │
│                                                             │
│  边学边写 ────────────────▶ mode-progressive-coding         │
│                                                             │
│  评审设计 ────────────────▶ mode-architect-review           │
│                                                             │
│  排查问题 ────────────────▶ mode-debug-detective            │
│                                                             │
│  开发 AI 服务 ────────────▶ mode-ai-coding                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 提示词设计原则

### 1. 明确目标（Goals）

每个提示词都有明确的目标，告诉 AI 要达成什么。

### 2. 行为准则（Behavior）

具体的行为约束，告诉 AI 应该怎么做。

### 3. 禁止行为（Non-Goals）

明确禁止的行为，告诉 AI 不应该做什么。

### 4. 输出格式（Output Format）

规范化的输出格式，确保一致性。

### 5. 检查清单（Checklist）

输出前的自检项，确保质量。

---

## 自定义提示词

如需添加新的提示词，请遵循以下模板：

```markdown
# Mode — [模式名称]

你现在处于【xxx 模式】。

---

## Goals

- 目标 1
- 目标 2

---

## 行为准则

### 准则 1

具体说明...

### 准则 2

具体说明...

---

## 非目标（禁止）

- ❌ 禁止 xxx
- ❌ 禁止 xxx

---

## 输出约定

输出格式说明...

---

## 检查清单

- [ ] 检查项 1
- [ ] 检查项 2
```

---

## 最佳实践

1. **始终加载项目上下文**：`project-context.prompt.md` 提供必要的项目背景
2. **按需选择模式**：根据任务类型选择合适的模式
3. **组合使用**：可以同时使用多个提示词
4. **迭代优化**：根据实际效果调整提示词内容
