# Steering Files 说明

本目录包含 Kiro AI 协作的约束规则文件，用于指导开发过程中的决策和代码生成。

## 文件列表

### 始终加载的核心约束 (inclusion: always)

| 文件 | 职责 | 说明 |
|------|------|------|
| `project-overview.md` | 项目概览 | 项目定位、技术栈、文档索引 |
| `project-context.md` | 项目上下文 | 目录结构、架构概览、渐进式披露 |
| `architecture-layers.md` | 架构分层 | 前端/后端/AI 服务的分层约束 |
| `permission-model.md` | 权限模型 | RCAC 权限模型、区域权限管理 |
| `rag-data-isolation.md` | RAG 数据隔离 | world_facts/reviews/rules 三类数据隔离 |
| `error-handling.md` | 错误处理 | 错误分类、响应结构、降级策略 |

### 上下文相关约束 (inclusion: fileMatch)

| 文件 | 触发条件 | 职责 |
|------|----------|------|
| `api-protocol.md` | `**/api/**` | API 协议、Intent/Action 结构 |
| `database-design.md` | `**/*.sql` | 数据库设计约束、JSONB 使用规范 |
| `password-security.md` | `**/auth/**` | 密码安全要求、BCrypt 加密 |
| `scss-nesting.md` | `**/*.vue` | SCSS 嵌套规则 |
| `frontend-style-guide.md` | `**/*.vue` | 前端样式指南、命名规范 |
| `i18n-convention.md` | `**/*.vue` | i18n 国际化规范、键名约定 |

## 使用方式

### 自动加载

- `inclusion: always` 的文件会在所有对话中自动加载
- `inclusion: fileMatch` 的文件会在编辑匹配文件时自动加载

### 手动引用

在对话中可以手动引用特定文件：

```
#[[file:.kiro/steering/api-protocol.md]]
```

## 设计原则

1. **职责单一** - 每个文件只负责一个领域的约束
2. **避免重复** - 相同内容不在多个文件中重复
3. **渐进式披露** - 核心约束始终加载，细节按需加载
4. **可维护性** - 文件结构清晰，易于更新和扩展

## 维护指南

### 添加新约束

1. 确定约束的职责范围
2. 选择合适的加载方式（always / fileMatch）
3. 创建新文件或更新现有文件
4. 更新本 README

### 更新现有约束

1. 找到对应的文件
2. 确保不与其他文件重复
3. 保持文件结构一致
4. 更新本 README（如有必要）

## 文件结构模板

### always 文件

```markdown
---
inclusion: always
---

# 标题

## 核心原则

## 约束规则

## 代码示例

## 验证清单
```

### fileMatch 文件

```markdown
---
inclusion: fileMatch
fileMatchPattern: "**/*.ext"
---

# 标题

## 适用范围

## 约束规则

## 代码示例

## 验证清单
```

## 相关文档

- 项目文档：`apps/*/docs/canonical/`
- 学习文档：`study/README.md`
- Prompt 模式：`prompt/README.md`
