# MCP 配置指南

本文档说明 Smart Mall 项目的 MCP 配置策略。

## 配置层级

MCP 配置分为两个层级，后者会覆盖前者：

1. **用户级别**（全局）：`C:\Users\Jay\.kiro\settings\mcp.json`
2. **项目级别**（工作区）：`.kiro/settings/mcp.json`

## 当前配置策略

### 用户级别（全局通用）

存储在：`C:\Users\Jay\.kiro\settings\mcp.json`

```json
{
  "mcpServers": {
    "chrome-devtools": { ... },  // 浏览器调试工具
    "fetch": { ... },             // HTTP 请求工具
    "memory": { ... }             // 知识图谱记忆
  }
}
```

**特点**：
- ✅ 所有项目共享
- ✅ 不依赖特定项目路径
- ✅ 通用性强

### 项目级别（Smart Mall 专用）

存储在：`.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "filesystem": { ... },  // 文件系统（绑定项目路径）
    "git": { ... },         // Git 操作（绑定仓库路径）
    "postgres": { ... }     // 数据库（绑定数据库连接）
  }
}
```

**特点**：
- ✅ 仅在 Smart Mall 项目中生效
- ✅ 绑定项目特定配置
- ✅ 可以提交到 Git，团队共享

## MCP 分类建议

### 🌍 适合用户级别

| MCP | 原因 |
|-----|------|
| **fetch** | 通用 HTTP 工具，所有项目都能用 |
| **memory** | 可跨项目记忆（注意数据隔离） |
| **chrome-devtools** | 浏览器调试，通用性强 |
| **sqlite**（通用） | 如果用于临时数据分析 |

### 📁 适合项目级别

| MCP | 原因 |
|-----|------|
| **filesystem** | 绑定特定项目路径 |
| **git** | 绑定特定仓库 |
| **postgres** | 绑定特定数据库连接 |
| **sqlite**（项目） | 如果是项目数据库 |

## 配置优先级

当同一个 MCP 在两个级别都配置时：

```
项目级别配置 > 用户级别配置
```

**示例**：
- 用户级别配置了 `fetch`
- 项目级别也配置了 `fetch`（不同参数）
- 最终使用项目级别的配置

## 最佳实践

### 1. 避免重复配置

❌ **不推荐**：
```
用户级别：fetch
项目级别：fetch（相同配置）
```

✅ **推荐**：
```
用户级别：fetch（通用配置）
项目级别：无需配置
```

### 2. 项目配置提交到 Git

```bash
# 项目级别配置应该提交
git add .kiro/settings/mcp.json
git commit -m "chore: 配置项目 MCP 服务器"
```

### 3. 用户配置不提交

```bash
# 用户级别配置不要提交（已在 .gitignore）
# C:\Users\Jay\.kiro\settings\mcp.json
```

### 4. 敏感信息处理

对于包含密码的配置（如 postgres），考虑：

**方案 A**：使用环境变量
```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "DATABASE_URL": "${DATABASE_URL}"
    }
  }
}
```

**方案 B**：项目级别配置 + .gitignore
```bash
# .gitignore
.kiro/settings/mcp.json
```

然后提供模板文件：
```bash
# .kiro/settings/mcp.json.example
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://USER:PASSWORD@localhost:5433/DATABASE"]
    }
  }
}
```

## 当前 Smart Mall 配置

### 用户级别
- ✅ chrome-devtools
- ✅ fetch
- ✅ memory

### 项目级别
- ✅ filesystem（绑定 Smart Mall 路径）
- ✅ git（绑定 Smart Mall 仓库）
- ✅ postgres（绑定 smartmall 数据库）

## 重新连接 MCP

配置修改后，需要重新连接：

1. 使用命令面板：`MCP: Reconnect All Servers`
2. 或重启 Kiro

## 故障排查

### 问题：MCP 未生效

**检查顺序**：
1. 查看 MCP Logs 面板
2. 确认配置文件语法正确（JSON 格式）
3. 确认 MCP 服务器已安装（如 `uvx`、`npx`）
4. 尝试重新连接

### 问题：配置冲突

**解决方案**：
1. 检查是否在两个级别都配置了同一个 MCP
2. 决定保留哪个级别的配置
3. 删除另一个级别的配置

## 相关文档

- MCP 官方文档：https://modelcontextprotocol.io
- Kiro MCP 配置：系统提示词中的 `<model_context_protocol>` 部分
