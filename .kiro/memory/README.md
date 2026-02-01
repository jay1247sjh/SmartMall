# Smart Mall 知识图谱

本目录存储项目的知识图谱备份，用于在 Memory MCP 重启后恢复数据。

## 文件说明

- `knowledge-graph.json` - 完整的知识图谱数据
- `README.md` - 本说明文件

## 知识图谱结构

### 实体类型

- **project** - 项目级别
- **service** - 服务（Frontend、Backend、Intelligence Service）
- **module** - 模块（ThreeEngine、Orchestrator、RAG System）
- **concept** - 概念（RCAC Permission Model）

### 关系类型

- **contains** - 包含关系
- **uses** - 使用关系
- **calls API of** - API 调用关系
- **implements** - 实现关系

## 如何恢复数据

如果 Memory MCP 重启后数据丢失，可以通过以下方式恢复：

### 方法 1：手动重新创建（推荐）

告诉 Kiro：
```
根据 .kiro/memory/knowledge-graph.json 恢复知识图谱
```

### 方法 2：使用脚本（未来实现）

```bash
# 待实现：自动导入脚本
node scripts/import-knowledge-graph.js
```

## 维护指南

### 更新知识图谱

当项目有重大变更时，导出最新的知识图谱：

1. 告诉 Kiro："导出当前知识图谱"
2. Kiro 会更新 `knowledge-graph.json`
3. 提交到 Git 仓库

### 添加新实体

```
记住：新增了支付模块 PaymentService
PaymentService 使用 Backend
PaymentService 集成了支付宝和微信支付
```

### 查询知识

```
Frontend 依赖哪些模块？
谁在使用 RAG System？
搜索所有与权限相关的内容
```

## 当前知识图谱概览

```
Smart Mall (project)
├── Frontend (service)
│   ├── uses ThreeEngine
│   ├── uses Orchestrator
│   │   └── implements RCAC Permission Model
│   ├── calls API of Backend
│   │   └── implements RCAC Permission Model
│   └── calls API of Intelligence Service
│       └── uses RAG System
├── Backend (service)
└── Intelligence Service (service)
```

## 版本历史

- **v1.0.0** (2026-02-01) - 初始版本，包含核心架构
  - 8 个实体
  - 10 个关系
  - 覆盖前端、后端、AI 服务的核心模块

## 相关文档

- 架构文档：`apps/*/docs/canonical/DESIGN.md`
- Steering 规则：`.kiro/steering/`
- 项目概述：`.kiro/steering/project-overview.md`
