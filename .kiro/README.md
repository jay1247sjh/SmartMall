# Kiro 项目配置

本目录包含 Kiro AI 协作的配置和资产。

## 目录结构

```
.kiro/
├── steering/          # 开发规范和约束（团队资产）
├── hooks/             # 自动化工作流（团队资产）
├── specs/             # 功能规格文档（团队资产）
├── memory/            # 知识库（部分个人）
├── settings/          # 配置文件（个人）
└── README.md          # 本文件（团队资产）
```

## 团队资产 vs 个人配置

### ✅ 团队资产（已提交到 Git）

| 目录/文件 | 说明 | 用途 |
|----------|------|------|
| `steering/` | 开发规范和架构约束 | 指导团队开发，保持一致性 |
| `hooks/` | 自动化工作流 | 提高开发效率，减少重复工作 |
| `specs/` | 功能规格文档 | 记录需求、设计、任务 |
| `memory/README.md` | 知识库使用说明 | 帮助团队使用记忆系统 |
| `settings/README.md` | 配置说明 | 指导新成员配置环境 |
| `settings/mcp.json.template` | MCP 配置模板 | 提供标准配置参考 |

### ❌ 个人配置（不提交到 Git）

| 文件 | 说明 | 原因 |
|------|------|------|
| `settings/mcp.json` | MCP 服务器配置 | 包含本地路径和密码 |
| `memory/knowledge-graph.json` | 知识图谱数据 | 个人知识积累 |

## 快速开始

### 新成员入职

1. **克隆仓库后，配置 MCP**
   ```bash
   cd .kiro/settings
   cp mcp.json.template mcp.json
   # 编辑 mcp.json，替换占位符
   ```

2. **了解开发规范**
   - 阅读 `steering/README.md`
   - 重点关注 `architecture-layers.md` 和 `permission-model.md`

3. **查看现有功能规格**
   ```bash
   ls specs/
   ```

4. **启用自动化 Hooks**
   - Hooks 会自动生效
   - 查看 `hooks/` 目录了解有哪些自动化

### 开发新功能

1. **创建 Spec**
   ```bash
   mkdir .kiro/specs/your-feature
   # 创建 requirements.md, design.md, tasks.md
   ```

2. **遵循 Steering 规范**
   - 开发时 Kiro 会自动加载相关规范
   - 可以手动引用：`#[[file:.kiro/steering/xxx.md]]`

3. **使用 Hooks**
   - 代码变更时自动触发质量检查
   - Git 提交时自动生成规范的 commit message

## 各目录详细说明

### steering/ - 开发规范

包含项目的核心约束和最佳实践：

- `architecture-layers.md` - 分层架构约束
- `permission-model.md` - RCAC 权限模型
- `rag-data-isolation.md` - RAG 数据隔离规范
- `error-handling.md` - 错误处理规范
- `api-protocol.md` - API 协议规范
- `database-design.md` - 数据库设计约束
- `frontend-style-guide.md` - 前端样式指南
- `password-security.md` - 密码安全规范
- `scss-nesting.md` - SCSS 嵌套规则

详见 [steering/README.md](steering/README.md)

### hooks/ - 自动化工作流

包含自动触发的 AI 协作流程：

- `code-quality-analysis.kiro.hook` - 代码质量分析
- `doc-sync-on-code-change.kiro.hook` - 文档同步
- `git-commit-helper.kiro.hook` - Git 提交助手

### specs/ - 功能规格

每个功能一个目录，包含：
- `requirements.md` - 需求文档
- `design.md` - 设计文档
- `tasks.md` - 任务列表

### memory/ - 知识库

- `README.md` - 使用说明（团队）
- `knowledge-graph.json` - 知识图谱数据（个人）

使用 Memory MCP 存储项目知识：
- 架构决策
- 模块依赖
- 技术选型

### settings/ - 配置文件

- `README.md` - 配置说明
- `mcp.json.template` - MCP 配置模板
- `mcp.json` - 个人 MCP 配置（不提交）

## 最佳实践

### 1. 保持 Steering 文件更新

当做出重要架构决策时，更新对应的 steering 文件：

```bash
# 例如：新增了一个架构约束
vim .kiro/steering/architecture-layers.md
git add .kiro/steering/architecture-layers.md
git commit -m "docs(steering): 新增 XXX 架构约束"
```

### 2. 为重要功能创建 Spec

不要直接开始编码，先创建 spec：

```bash
mkdir .kiro/specs/new-feature
# 编写 requirements.md, design.md, tasks.md
git add .kiro/specs/new-feature
git commit -m "docs(spec): 新增 XXX 功能规格"
```

### 3. 定期备份知识图谱

虽然知识图谱是个人的，但可以定期导出重要内容到文档：

```bash
# 将重要的架构知识写入 steering 文件
# 将功能设计写入 specs 文件
```

### 4. 团队协作

- **Pull 代码后**：检查 steering 和 specs 是否有更新
- **提交代码前**：确保遵循 steering 规范
- **Code Review**：参考 specs 中的设计文档

## 维护指南

### 添加新的 Steering 规则

1. 确定规则的职责范围
2. 创建新文件或更新现有文件
3. 更新 `steering/README.md`
4. 提交到 Git

### 添加新的 Hook

1. 创建 `.kiro.hook` 文件
2. 定义触发条件和执行动作
3. 测试 Hook 是否正常工作
4. 提交到 Git

### 清理过时的 Spec

定期清理已完成或废弃的 spec：

```bash
# 移动到归档目录
mkdir .kiro/specs/_archived
mv .kiro/specs/old-feature .kiro/specs/_archived/
```

## 故障排查

### Steering 规则没有生效

1. 检查文件的 frontmatter 配置
2. 确认 `inclusion` 设置正确
3. 重启 Kiro

### Hook 没有触发

1. 检查 Hook 文件格式
2. 确认触发条件是否满足
3. 查看 Kiro 日志

### MCP 连接失败

参考 [settings/README.md](settings/README.md)

## 相关资源

- [项目文档](../apps/*/docs/canonical/)
- [学习文档](../study/README.md)
- [Prompt 模式](../prompt/README.md)
- [Kiro 官方文档](https://kiro.ai/docs)

## 贡献指南

欢迎团队成员贡献：

1. **改进 Steering 规则** - 发现更好的实践
2. **优化 Hooks** - 提高自动化效率
3. **完善 Specs** - 补充设计细节
4. **更新文档** - 保持文档最新

提交 PR 时，请遵循 [Git 提交规范](~/.kiro/steering/git-commit-convention.md)。
