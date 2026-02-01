# Kiro Settings

本目录包含 Kiro 的配置文件。

## 文件说明

| 文件 | 说明 | 是否提交 |
|------|------|----------|
| `mcp.json` | MCP 服务器配置（个人） | ❌ 不提交 |
| `mcp.json.template` | MCP 配置模板（团队） | ✅ 提交 |
| `README.md` | 配置说明 | ✅ 提交 |

## 初次设置

### 1. 复制配置模板

```bash
cp .kiro/settings/mcp.json.template .kiro/settings/mcp.json
```

### 2. 修改配置

编辑 `mcp.json`，替换以下占位符：

- `<YOUR_PROJECT_PATH>` - 你的项目绝对路径
  - Windows: `E:/JavaProgram/Smart-mall`
  - Mac/Linux: `/Users/yourname/projects/Smart-mall`

- `<username>` - 数据库用户名（默认：`smartmall`）
- `<password>` - 数据库密码（默认：`smartmall123`）

### 3. 验证配置

重启 Kiro，检查 MCP 服务器是否正常连接。

## MCP 服务器说明

### filesystem
- **功能**: 文件系统操作
- **用途**: 读取文件、列出目录
- **自动批准**: `read_file`, `list_directory`

### git
- **功能**: Git 版本控制
- **用途**: 查看状态、差异、提交历史
- **自动批准**: `git_status`, `git_diff_unstaged`, `git_log`
- **依赖**: 需要安装 `uv` 和 `uvx`

### postgres
- **功能**: PostgreSQL 数据库查询
- **用途**: 查看表结构、执行查询
- **自动批准**: `list_tables`, `describe_table`
- **注意**: 确保数据库正在运行（`docker-compose up -d`）

## 安全注意事项

⚠️ **重要**：
- `mcp.json` 包含敏感信息（路径、密码），已被 `.gitignore` 忽略
- 不要将 `mcp.json` 提交到 Git
- 不要在配置中硬编码生产环境密码

## 故障排查

### MCP 服务器连接失败

1. 检查配置文件语法是否正确
2. 确认路径是否存在
3. 查看 Kiro 的 MCP Logs 面板
4. 尝试重新连接 MCP 服务器

### Git MCP 无法使用

确保已安装 `uv`:
```bash
# Windows (使用 pip)
pip install uv

# Mac (使用 Homebrew)
brew install uv
```

### Postgres MCP 连接失败

1. 确认数据库正在运行:
   ```bash
   docker ps | grep postgres
   ```

2. 测试数据库连接:
   ```bash
   psql -h localhost -p 5433 -U smartmall -d smartmall
   ```

3. 检查连接字符串格式:
   ```
   postgresql://username:password@host:port/database
   ```

## 参考资源

- [MCP 使用指南](~/.kiro/steering/mcp-usage-guide.md)
- [MCP 官方文档](https://modelcontextprotocol.io)
