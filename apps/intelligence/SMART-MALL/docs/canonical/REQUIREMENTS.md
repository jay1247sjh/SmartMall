# AI 服务需求规格（REQUIREMENTS.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：Python AI 服务需求规格
> 
> 本文档定义 AI 服务的功能需求与非功能需求。

---

## 1. 项目概述

### 1.1 服务定位

AI 服务是智能商城导购系统的智能核心，负责处理所有与大语言模型（LLM）相关的功能。与 Java 业务系统分离部署，通过 HTTP/消息队列通信。

### 1.2 核心价值

- **自然语言理解**：将用户自然语言转换为结构化 Action
- **智能导航**：基于用户意图提供商城导航服务
- **商品推荐**：基于上下文的智能商品推荐
- **知识检索**：RAG 增强的商城知识问答

---

## 2. 功能需求

### 2.1 意图理解（Intent Recognition）

**FR-AI-001**: 系统应能识别以下用户意图类型：
- `NAVIGATE_TO_STORE` - 导航到店铺
- `NAVIGATE_TO_AREA` - 导航到区域
- `PRODUCT_SEARCH` - 搜索商品
- `STORE_INFO` - 查询店铺信息
- `GENERAL_QUESTION` - 一般问题

**FR-AI-002**: 意图识别应返回置信度分数（0.0-1.0）

**FR-AI-003**: 系统应从用户输入中提取实体：
- 店铺名称
- 商品名称
- 区域名称
- 品牌名称

### 2.2 Action 生成（Action Generation）

**FR-AI-010**: 系统应根据意图生成结构化 Action：
- `NAVIGATE_TO_STORE` - 导航到指定店铺
- `NAVIGATE_TO_AREA` - 导航到指定区域
- `SEARCH_PRODUCTS` - 执行商品搜索
- `SHOW_STORE_INFO` - 显示店铺信息
- `SHOW_SUGGESTIONS` - 显示建议选项

**FR-AI-011**: Action 应包含目标对象和参数

**FR-AI-012**: 系统应生成自然语言响应文本

### 2.3 Embedding 服务

**FR-AI-020**: 系统应支持文本向量化
- 支持单条文本 Embedding
- 支持批量文本 Embedding

**FR-AI-021**: 系统应支持多种 Embedding 模型
- OpenAI text-embedding-ada-002
- 本地 Embedding 模型

### 2.4 LLM 提供商支持

**FR-AI-030**: 系统应支持多种 LLM 提供商：
- OpenAI (GPT-4, GPT-3.5)
- DeepSeek
- 本地模型（Ollama）

**FR-AI-031**: 系统应支持运行时切换 LLM 提供商

---

## 3. 非功能需求

### 3.1 性能要求

**NFR-AI-001**: 意图识别响应时间 < 2 秒（P95）

**NFR-AI-002**: Embedding 生成响应时间 < 1 秒（P95）

**NFR-AI-003**: 系统应支持 100 QPS 并发请求

### 3.2 可用性要求

**NFR-AI-010**: 服务可用性 > 99.5%

**NFR-AI-011**: 服务不可用时，Java 系统应能降级运行

**NFR-AI-012**: 支持健康检查接口（liveness/readiness）

### 3.3 安全要求

**NFR-AI-020**: API Key 等敏感信息不得硬编码

**NFR-AI-021**: 支持服务间认证（Service Token）

**NFR-AI-022**: 输入应进行安全过滤（防 Prompt 注入）

### 3.4 可观测性要求

**NFR-AI-030**: 记录请求日志（requestId, latency, status）

**NFR-AI-031**: 暴露 Prometheus 格式的监控指标

**NFR-AI-032**: 支持分布式追踪（OpenTelemetry）

### 3.5 可维护性要求

**NFR-AI-040**: Prompt 模板应支持版本化管理

**NFR-AI-041**: 配置应支持环境变量覆盖

**NFR-AI-042**: 代码覆盖率 > 80%

---

## 4. 接口契约

### 4.1 请求格式

```json
{
  "requestId": "string (UUID)",
  "version": "string",
  "timestamp": "string (ISO 8601)",
  "context": {
    "userId": "string",
    "role": "string",
    "mallId": "string",
    "currentPosition": { "x": "number", "y": "number", "z": "number" },
    "sessionId": "string"
  },
  "input": {
    "type": "NATURAL_LANGUAGE | STRUCTURED",
    "text": "string",
    "locale": "string"
  }
}
```

### 4.2 响应格式

```json
{
  "requestId": "string",
  "version": "string",
  "timestamp": "string",
  "status": "SUCCESS | ERROR | DEGRADED",
  "result": {
    "intent": "string",
    "confidence": "number",
    "actions": [],
    "response": {
      "text": "string",
      "suggestions": []
    }
  },
  "metadata": {
    "modelUsed": "string",
    "tokensUsed": "number",
    "latencyMs": "number"
  }
}
```

---

## 5. 约束与假设

### 5.1 约束

- Python 3.11+ 运行环境
- 依赖外部 LLM API（需网络访问）
- 向量数据库为可选依赖

### 5.2 假设

- Java 系统负责用户认证和权限校验
- 商城数据由 Java 系统提供
- AI 服务不直接访问业务数据库

---

## 附录 A：术语表

| 术语 | 定义 |
|------|------|
| Intent | 用户意图，从自然语言中识别的用户目的 |
| Action | 结构化操作指令，由 Java 系统执行 |
| Embedding | 文本的向量表示 |
| RAG | 检索增强生成（Retrieval-Augmented Generation） |
| Prompt | 发送给 LLM 的提示文本 |

---

## 附录 B：版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-01-10 | 初始版本 |
