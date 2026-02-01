---
inclusion: always
---

# Smart Mall 项目概述

## 项目定位

Smart Mall 是一个 **3D 可视化 + 商城建模 + AI 智能导购** 的智能商城系统。

## 技术栈

| 服务 | 技术栈 | 端口 | 目录 |
|------|--------|------|------|
| Frontend | Vue 3 + TypeScript + Three.js | 5173 | `apps/frontend/SMART-MALL` |
| Backend | Spring Boot 3 + MyBatis-Plus | 8080 | `apps/backend/SMART-MALL` |
| Intelligence | FastAPI + Qwen LLM | 8000 | `apps/intelligence/SMART-MALL` |
| Database | PostgreSQL 15 | 5433 | `infra/` |
| Cache | Redis 7 | 6379 | `infra/` |
| Vector DB | Milvus 2.3 | 19530 | `infra/` |

## 核心特性

1. **3D 商城可视化** - 基于 Three.js 的沉浸式 3D 体验
2. **区域权限管理** - 商家可申请区域建模权限
3. **智能导购** - AI Agent 驱动的自然语言导购
4. **RAG 知识库** - 向量数据库支持的智能问答
5. **版本管理** - 商城布局的版本化管理

## 角色定义

- **Admin（管理员）** - 商城结构管理、权限审批
- **Merchant（商家）** - 店铺管理、区域建模
- **User（普通用户）** - 浏览商城、智能导购

## 文档索引

### 前端文档
- 设计文档: `apps/frontend/SMART-MALL/docs/canonical/DESIGN.md`
- 需求规格: `apps/frontend/SMART-MALL/docs/canonical/REQUIREMENTS.md`
- 协议规范: `apps/frontend/SMART-MALL/docs/canonical/PROTOCOL.md`
- 样式指南: `apps/frontend/SMART-MALL/docs/canonical/STYLE_GUIDE.md`

### 后端文档
- 设计文档: `apps/backend/SMART-MALL/docs/canonical/DESIGN.md`
- 需求规格: `apps/backend/SMART-MALL/docs/canonical/REQUIREMENTS.md`
- 协议规范: `apps/backend/SMART-MALL/docs/canonical/PROTOCOL.md`

### AI 服务文档
- 设计文档: `apps/intelligence/SMART-MALL/docs/canonical/DESIGN.md`
- 需求规格: `apps/intelligence/SMART-MALL/docs/canonical/REQUIREMENTS.md`
- Function Calling: `apps/intelligence/SMART-MALL/docs/canonical/FUNCTION_CALLING.md`

### 学习文档
- 学习路径: `study/README.md`
- 共 23 个学习模块，从登录到 AI 服务

## 快速参考

当需要深入了解某个模块时，可引用对应的文档：

```
#[[file:apps/frontend/SMART-MALL/docs/canonical/DESIGN.md]]
#[[file:apps/backend/SMART-MALL/docs/canonical/DESIGN.md]]
#[[file:apps/intelligence/SMART-MALL/docs/canonical/DESIGN.md]]
```
