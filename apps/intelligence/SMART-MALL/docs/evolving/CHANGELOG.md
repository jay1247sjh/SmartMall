# AI 服务变更日志（CHANGELOG.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：Python AI 服务变更记录

---

## [Unreleased]

### Added
- 阿里云百炼 Qwen LLM 提供商（app/core/llm/qwen.py）
  - 支持 Qwen3-VL-Plus 视觉模型
  - 支持 Function Calling
  - 支持流式输出
- 商城导购 Agent（app/core/agent/mall_agent.py）
  - 纯文本对话
  - 图片+文字对话（视觉理解）
  - 多轮 Function Calling
  - 安全控制（敏感操作需确认）
- Function Calling 工具定义（app/core/agent/tools.py）
  - 导航类：navigate_to_store, navigate_to_area
  - 搜索类：search_products, search_stores, search_by_image
  - 购物类：add_to_cart, get_cart, create_order
  - 推荐类：recommend_products, recommend_restaurants
- 智能对话 API（app/api/chat.py）
  - POST /api/chat - 对话接口
  - POST /api/chat/confirm - 确认操作接口
- Function Calling 设计文档（docs/canonical/FUNCTION_CALLING.md）

### Changed
- 配置管理新增 Qwen 相关配置
- LLM Factory 注册 Qwen 提供商
- 移除 prompts/v1 版本目录，简化为 prompts/
- 移除 api/v1 版本目录，简化为 api/
- API 路径从 /api/v1/* 改为 /api/*

---

## [1.0.0] - 2026-01-10

### Added
- FastAPI 项目初始化
- 健康检查接口（/health, /health/ready, /health/live）
- 配置管理（app/core/config.py）
- LLM 抽象层
  - LLMBase 基类
  - LLMFactory 工厂
  - OpenAI Provider
  - DeepSeek Provider
  - Local Model Provider
- 意图理解接口（/api/v1/intent/process）
- Embedding 接口（/api/v1/embedding/generate）
- Prompt 模板
  - intent.yaml - 意图识别
  - action.yaml - Action 生成
- Dockerfile
- requirements.txt
- README.md
