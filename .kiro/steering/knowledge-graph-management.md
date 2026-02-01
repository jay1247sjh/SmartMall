---
inclusion: always
---

# 知识图谱管理规范

本文档规范 Memory MCP 知识图谱的使用和维护。

## 知识图谱结构

### 实体类型（Entity Type）

| 类型 | 说明 | 示例 |
|------|------|------|
| **project** | 项目级别 | Smart Mall |
| **service** | 服务 | Frontend, Backend, Intelligence Service |
| **module** | 模块 | ThreeEngine, Orchestrator, RAG System |
| **concept** | 概念 | RCAC Permission Model |
| **database** | 数据库表 | users, stores, products |
| **api** | API 端点 | /api/auth/login |

### 关系类型（Relation Type）

| 关系 | 说明 | 示例 |
|------|------|------|
| **contains** | 包含关系 | Smart Mall contains Frontend |
| **uses** | 使用关系 | Frontend uses ThreeEngine |
| **calls API of** | API 调用 | Frontend calls API of Backend |
| **implements** | 实现关系 | Orchestrator implements RCAC Permission Model |
| **depends on** | 依赖关系 | Module A depends on Module B |
| **extends** | 继承关系 | Class A extends Class B |

## 命名规范

### 实体命名

**✅ 推荐**：
- 使用清晰的名称：`Frontend`, `Backend`, `ThreeEngine`
- 使用完整名称：`RCAC Permission Model` 而非 `RCAC`
- 使用统一的大小写：`ThreeEngine` 而非 `threeEngine`

**❌ 避免**：
- 缩写：`FE`, `BE`
- 模糊名称：`Module1`, `Service2`
- 不一致的命名：`frontend` 和 `Frontend` 混用

### 关系命名

**✅ 推荐**：
- 使用主动语态：`uses`, `implements`, `calls API of`
- 使用清晰的动词：`depends on` 而非 `needs`

**❌ 避免**：
- 被动语态：`is used by`
- 模糊动词：`relates to`

## 观察信息（Observations）

### 内容要求

每个实体应包含：
1. **核心描述** - 实体是什么
2. **技术栈** - 使用的技术（如适用）
3. **位置信息** - 目录、端口（如适用）
4. **关键特性** - 重要的约束或特点

### 示例

```typescript
{
  "name": "Frontend",
  "entityType": "service",
  "observations": [
    "使用 Vue 3 + TypeScript + Three.js",  // 技术栈
    "端口：5173",                           // 位置信息
    "目录：apps/frontend/SMART-MALL",      // 位置信息
    "采用分层架构：UI → Orchestrator → Domain → Engine"  // 关键特性
  ]
}
```

## 数据维护

### 添加新实体

**时机**：
- 新增重要模块
- 引入新技术栈
- 做出架构决策

**示例**：
```
记住：新增了支付模块 PaymentService
PaymentService 使用 Stripe API
PaymentService 依赖 Backend
```

### 更新实体

**时机**：
- 技术栈升级
- 架构调整
- 配置变更

**示例**：
```
更新 Frontend 的观察：
- 升级到 Vue 3.5
- 新增 WebGL 性能优化
```

### 删除实体

**时机**：
- 模块被移除
- 技术被替换

**注意**：删除实体会同时删除相关的关系。

## 数据备份

### 备份策略

1. **定期备份**：每次重大变更后导出
2. **版本控制**：提交到 Git
3. **文档同步**：更新 README

### 备份命令

```
导出当前知识图谱到 .kiro/memory/knowledge-graph.json
```

### 恢复数据

```
根据 .kiro/memory/knowledge-graph.json 恢复知识图谱
```

## 查询模式

### 基础查询

```
Frontend 使用了哪些模块？
谁在使用 RAG System？
RCAC 权限模型是什么？
```

### 关系查询

```
查询所有依赖 ThreeEngine 的模块
查询 Backend 实现了哪些概念
查询 Frontend 调用了哪些服务的 API
```

### 搜索查询

```
搜索所有与权限相关的内容
搜索所有使用 Three.js 的模块
搜索所有 API 端点
```

## 使用场景

### 1. 新成员入职

```
查询项目结构
→ 了解 Smart Mall 包含哪些服务
→ 了解各服务的技术栈
→ 了解模块之间的依赖关系
```

### 2. 架构评审

```
查询模块依赖
→ 检查是否有循环依赖
→ 检查是否违反分层原则
→ 识别潜在的架构问题
```

### 3. 功能开发

```
查询相关模块
→ 了解需要修改哪些模块
→ 了解模块之间的接口
→ 避免破坏现有架构
```

### 4. Bug 排查

```
搜索相关组件
→ 快速定位问题模块
→ 了解模块的依赖关系
→ 追踪调用链路
```

## Smart Mall 知识图谱

### 当前结构

```
Smart Mall (project)
├── Frontend (service)
│   ├── uses ThreeEngine (module)
│   ├── uses Orchestrator (module)
│   │   └── implements RCAC Permission Model (concept)
│   ├── calls API of Backend (service)
│   │   └── implements RCAC Permission Model (concept)
│   └── calls API of Intelligence Service (service)
│       └── uses RAG System (module)
├── Backend (service)
└── Intelligence Service (service)
```

### 统计信息

- **实体数量**：8 个
- **关系数量**：10 个
- **覆盖范围**：前端、后端、AI 服务核心架构

## 最佳实践

### ✅ 推荐

1. **及时更新** - 架构变更后立即更新知识图谱
2. **清晰命名** - 使用统一的命名规范
3. **详细观察** - 添加足够的上下文信息
4. **定期备份** - 防止数据丢失
5. **团队共享** - 将备份文件提交到 Git

### ❌ 避免

1. **过度细节** - 不要记录每个函数和变量
2. **过时信息** - 及时删除已废弃的实体
3. **模糊关系** - 避免使用不明确的关系类型
4. **重复实体** - 同一概念不要创建多个实体

## 验证清单

- [ ] 实体命名是否清晰一致？
- [ ] 关系类型是否准确？
- [ ] 观察信息是否完整？
- [ ] 是否定期备份数据？
- [ ] 备份文件是否提交到 Git？
- [ ] 是否及时更新过时信息？

## 相关文档

- Memory MCP 使用指南：`~/.kiro/steering/mcp-usage-guide.md`
- 知识图谱备份：`.kiro/memory/knowledge-graph.json`
- 备份说明：`.kiro/memory/README.md`
