# AI 服务任务清单（TASK.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：Python AI 服务开发任务
> 
> 最后更新：2026-01-10

---

## 当前迭代

### Sprint 1: 基础架构（已完成）

- [x] FastAPI 项目初始化
- [x] 健康检查接口
- [x] 配置管理（Pydantic Settings）
- [x] LLM 抽象层设计
- [x] OpenAI Provider 实现
- [x] DeepSeek Provider 实现
- [x] 本地模型 Provider 实现
- [x] 意图理解接口
- [x] Embedding 接口
- [x] Prompt 模板（intent.yaml, action.yaml）
- [x] Dockerfile
- [x] 文档结构（docs/canonical, docs/evolving）

---

## 待办任务

### 高优先级

- [ ] 完善 schemas/request.py 请求模型
- [ ] 完善 schemas/response.py 响应模型
- [ ] 添加请求验证中间件
- [ ] 添加错误处理中间件
- [ ] 添加日志中间件

### 中优先级

- [ ] Agent 模块实现
  - [ ] NavigatorAgent - 导航 Agent
  - [ ] RecommenderAgent - 推荐 Agent
  - [ ] Skills 技能系统
- [ ] RAG 模块实现
  - [ ] 向量数据库连接
  - [ ] 检索器实现
  - [ ] 集合管理

### 低优先级

- [ ] 监控指标（Prometheus）
- [ ] 分布式追踪（OpenTelemetry）
- [ ] 单元测试
- [ ] 集成测试
- [ ] API 文档完善

---

## 已知问题

暂无

---

## 技术债务

- [ ] 添加类型注解完善
- [ ] 添加 docstring 文档
- [ ] 代码格式化（black, isort）
- [ ] 静态检查（mypy, ruff）
