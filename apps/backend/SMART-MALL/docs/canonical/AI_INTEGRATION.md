# Java 与 Python AI 服务集成规范（AI_INTEGRATION.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：Java 业务系统与 Python AI 服务的集成规范
> 
> 本文档定义 Java 后端与 Python AI 服务之间的**边界、交互协议与失败处理策略**。

---

## 1. 架构总览

### 1.1 系统分层

```
┌─────────────────────────────────────────────────────────────────┐
│                      前端 (Vue 3 + Three.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐  │
│  │   Java 业务系统          │    │   Python AI 服务             │  │
│  │   (Spring Boot 3.x)     │◄──►│   (FastAPI)                  │  │
│  │                         │    │                              │  │
│  │  • 用户认证与权限        │    │  • 大模型调用                 │  │
│  │  • 商城结构管理          │    │  • Prompt 工程               │  │
│  │  • 区域权限审批          │    │  • Agent / Skills            │  │
│  │  • 店铺商品管理          │    │  • RAG 检索                  │  │
│  │  • 布局版本控制          │    │  • Embedding 生成            │  │
│  │  • 审计日志              │    │  • 意图理解                  │  │
│  │                         │    │                              │  │
│  │  【确定性、稳定、可审计】  │    │  【非确定性、可试错、可替换】  │  │
│  └─────────────────────────┘    └─────────────────────────────┘  │
│              │                              │                     │
│              ▼                              ▼                     │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐  │
│  │   PostgreSQL            │    │   向量数据库 (Milvus/Qdrant) │  │
│  │   Redis                 │    │   模型缓存                   │  │
│  └─────────────────────────┘    └─────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 职责边界

| 系统 | 职责 | 特性 |
|------|------|------|
| **Java 业务系统** | 用户、权限、配置、流程、审计等长期运行模块 | 确定性、幂等性、可观测性、降级与回滚 |
| **Python AI 服务** | 大模型调用、Prompt 工程、Agent、RAG、Embedding | 非确定性推理、多轮决策、可试错 |

### 1.3 核心原则

1. **Java 系统不依赖 Prompt 逻辑**
   - Java 不解析 AI 返回的自然语言
   - Java 只处理结构化的 Action 协议

2. **Python 失败不导致 Java 失败**
   - AI 服务不可用时，Java 系统降级运行
   - 所有 AI 调用有超时和重试机制

3. **AI 能力可版本化、可替换**
   - Prompt、Agent、Skills 作为工程资产管理
   - 支持 OpenAI / DeepSeek / 自建模型切换

---

## 2. 通信协议

### 2.1 通信方式

| 场景 | 协议 | 说明 |
|------|------|------|
| 同步请求 | HTTP REST | 意图理解、Action 生成 |
| 异步任务 | 消息队列 (RabbitMQ/Redis Stream) | 批量 Embedding、长时推理 |
| 实时推送 | WebSocket | 流式响应、进度通知 |

### 2.2 接口契约

#### 2.2.1 请求结构

```json
{
  "requestId": "req_uuid_xxx",
  "version": "1.0",
  "timestamp": "2026-01-10T10:00:00Z",
  "context": {
    "userId": "user_001",
    "role": "USER",
    "mallId": "mall_001",
    "currentPosition": { "x": 10, "y": 0, "z": 10 },
    "sessionId": "session_xxx"
  },
  "input": {
    "type": "NATURAL_LANGUAGE",
    "text": "Nike 店在哪里？",
    "locale": "zh-CN"
  }
}
```

#### 2.2.2 响应结构

```json
{
  "requestId": "req_uuid_xxx",
  "version": "1.0",
  "timestamp": "2026-01-10T10:00:01Z",
  "status": "SUCCESS",
  "result": {
    "intent": "NAVIGATE_TO_STORE",
    "confidence": 0.95,
    "actions": [
      {
        "action": "NAVIGATE_TO_STORE",
        "target": { "type": "STORE", "id": "store_nike_001" },
        "params": { "highlight": true }
      }
    ],
    "response": {
      "text": "Nike 店位于 2 楼 A 区，我来为您导航。",
      "suggestions": ["查看店铺详情", "搜索其他品牌"]
    }
  },
  "metadata": {
    "modelUsed": "gpt-4",
    "tokensUsed": 150,
    "latencyMs": 800
  }
}
```

#### 2.2.3 错误响应

```json
{
  "requestId": "req_uuid_xxx",
  "version": "1.0",
  "timestamp": "2026-01-10T10:00:01Z",
  "status": "ERROR",
  "error": {
    "code": "AI_SERVICE_TIMEOUT",
    "message": "AI 服务响应超时",
    "retryable": true,
    "fallbackAvailable": true
  },
  "fallback": {
    "type": "KEYWORD_SEARCH",
    "suggestion": "您可以尝试使用关键词搜索"
  }
}
```

### 2.3 字段分类

| 字段类型 | 说明 | 示例 |
|----------|------|------|
| **确定字段** | 由 Java 系统提供，AI 不可修改 | userId, mallId, storeId |
| **模型建议字段** | AI 推理结果，需 Java 校验 | actions, intent, confidence |
| **元数据字段** | 用于监控和调试 | modelUsed, tokensUsed, latencyMs |

---

## 3. Java 端集成设计

### 3.1 AI 服务客户端

```java
/**
 * AI 服务客户端接口
 * 定义在 domain 层，实现在 infrastructure 层
 */
public interface AIServiceClient {
    
    /**
     * 处理自然语言输入，返回结构化 Action
     * 
     * @param request AI 请求
     * @return AI 响应（包含 Action 列表）
     * @throws AIServiceException AI 服务异常
     */
    AIResponse processNaturalLanguage(AIRequest request);
    
    /**
     * 检查 AI 服务健康状态
     */
    boolean isHealthy();
    
    /**
     * 获取服务降级状态
     */
    DegradationStatus getDegradationStatus();
}
```

### 3.2 降级策略

```java
/**
 * AI 服务降级处理器
 */
@Component
public class AIServiceFallbackHandler {
    
    /**
     * 当 AI 服务不可用时的降级处理
     */
    public AIResponse handleFallback(AIRequest request, Throwable cause) {
        // 1. 记录降级日志
        log.warn("AI service fallback triggered: {}", cause.getMessage());
        
        // 2. 尝试关键词匹配
        Optional<Store> store = keywordSearchService.search(request.getText());
        if (store.isPresent()) {
            return buildNavigationResponse(store.get());
        }
        
        // 3. 返回降级提示
        return AIResponse.builder()
            .status(ResponseStatus.DEGRADED)
            .fallback(FallbackInfo.builder()
                .type("KEYWORD_SEARCH")
                .suggestion("AI 服务暂时不可用，请使用搜索功能")
                .build())
            .build();
    }
}
```

### 3.3 Action 校验

```java
/**
 * AI 生成的 Action 校验器
 * Java 系统不信任 AI 输出，必须校验
 */
@Component
public class AIActionValidator {
    
    /**
     * 校验 AI 生成的 Action 是否合法
     */
    public ValidationResult validate(Action action, User user, Context context) {
        // 1. 校验 Action 格式
        if (!isValidActionFormat(action)) {
            return ValidationResult.invalid("Action 格式不合法");
        }
        
        // 2. 校验目标资源存在性
        if (!resourceExists(action.getTarget())) {
            return ValidationResult.invalid("目标资源不存在");
        }
        
        // 3. 校验用户权限
        if (!hasPermission(user, action)) {
            return ValidationResult.invalid("用户无权执行此操作");
        }
        
        // 4. 校验上下文合法性
        if (!isContextValid(action, context)) {
            return ValidationResult.invalid("操作上下文不合法");
        }
        
        return ValidationResult.valid();
    }
}
```

### 3.4 配置管理

```yaml
# application.yml
ai:
  service:
    # 服务地址
    base-url: http://ai-service:8000
    
    # 超时配置
    connect-timeout: 3000
    read-timeout: 10000
    
    # 重试配置
    retry:
      max-attempts: 3
      backoff-delay: 1000
      backoff-multiplier: 2
    
    # 熔断配置
    circuit-breaker:
      failure-rate-threshold: 50
      wait-duration-in-open-state: 30000
      sliding-window-size: 10
    
    # 降级配置
    fallback:
      enabled: true
      keyword-search-enabled: true
```

---

## 4. Python AI 服务设计

### 4.1 服务架构

```
ai-service/
├── app/
│   ├── main.py                 # FastAPI 入口
│   ├── api/
│   │   ├── v1/
│   │   │   ├── intent.py       # 意图理解接口
│   │   │   ├── action.py       # Action 生成接口
│   │   │   └── embedding.py    # Embedding 接口
│   │   └── health.py           # 健康检查
│   ├── core/
│   │   ├── config.py           # 配置管理
│   │   ├── llm/
│   │   │   ├── base.py         # LLM 基类
│   │   │   ├── openai.py       # OpenAI 实现
│   │   │   ├── deepseek.py     # DeepSeek 实现
│   │   │   └── factory.py      # LLM 工厂
│   │   ├── agent/
│   │   │   ├── navigator.py    # 导航 Agent
│   │   │   ├── recommender.py  # 推荐 Agent
│   │   │   └── skills/         # Agent Skills
│   │   └── rag/
│   │       ├── retriever.py    # RAG 检索器
│   │       └── collections.py  # 向量集合管理
│   ├── prompts/                # Prompt 模板（版本化）
│   │   ├── v1/
│   │   │   ├── intent.yaml
│   │   │   └── action.yaml
│   │   └── v2/
│   └── schemas/
│       ├── request.py          # 请求 Schema
│       └── response.py         # 响应 Schema
├── tests/
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

### 4.2 接口定义

```python
# app/api/v1/intent.py
from fastapi import APIRouter, HTTPException
from app.schemas.request import AIRequest
from app.schemas.response import AIResponse
from app.core.agent.navigator import NavigatorAgent

router = APIRouter()

@router.post("/process", response_model=AIResponse)
async def process_natural_language(request: AIRequest) -> AIResponse:
    """
    处理自然语言输入，返回结构化 Action
    
    - 输入: 用户自然语言 + 上下文
    - 输出: 意图 + Action 列表 + 自然语言响应
    """
    try:
        agent = NavigatorAgent()
        result = await agent.process(request)
        return AIResponse(
            request_id=request.request_id,
            status="SUCCESS",
            result=result
        )
    except Exception as e:
        return AIResponse(
            request_id=request.request_id,
            status="ERROR",
            error={
                "code": "AI_PROCESSING_ERROR",
                "message": str(e),
                "retryable": True
            }
        )
```

### 4.3 Prompt 版本管理

```yaml
# prompts/v1/intent.yaml
version: "1.0"
name: "intent_recognition"
description: "识别用户意图"

system_prompt: |
  你是智能商城导购助手。根据用户输入，识别其意图并生成对应的 Action。
  
  可识别的意图类型：
  - NAVIGATE_TO_STORE: 导航到店铺
  - NAVIGATE_TO_AREA: 导航到区域
  - PRODUCT_SEARCH: 搜索商品
  - STORE_INFO: 查询店铺信息
  - GENERAL_QUESTION: 一般问题
  
  输出格式（JSON）：
  {
    "intent": "意图类型",
    "confidence": 0.0-1.0,
    "entities": {
      "store_name": "店铺名称（如有）",
      "product_name": "商品名称（如有）",
      "area_name": "区域名称（如有）"
    }
  }

user_prompt_template: |
  用户位置: {current_position}
  用户输入: {user_input}
  
  请识别用户意图。

parameters:
  temperature: 0.3
  max_tokens: 200
```

### 4.4 模型切换支持

```python
# app/core/llm/factory.py
from abc import ABC, abstractmethod
from typing import Dict, Any

class LLMBase(ABC):
    """LLM 基类，定义统一接口"""
    
    @abstractmethod
    async def complete(self, prompt: str, **kwargs) -> str:
        pass
    
    @abstractmethod
    async def chat(self, messages: list, **kwargs) -> str:
        pass

class LLMFactory:
    """LLM 工厂，支持模型切换"""
    
    _providers: Dict[str, type] = {}
    
    @classmethod
    def register(cls, name: str, provider: type):
        cls._providers[name] = provider
    
    @classmethod
    def create(cls, provider: str, **kwargs) -> LLMBase:
        if provider not in cls._providers:
            raise ValueError(f"Unknown LLM provider: {provider}")
        return cls._providers[provider](**kwargs)

# 注册提供商
LLMFactory.register("openai", OpenAIProvider)
LLMFactory.register("deepseek", DeepSeekProvider)
LLMFactory.register("local", LocalModelProvider)
```

---

## 5. 错误处理与降级

### 5.1 错误分类

| 错误类型 | 错误码 | 可重试 | 降级策略 |
|----------|--------|--------|----------|
| 服务超时 | AI_SERVICE_TIMEOUT | ✅ | 关键词搜索 |
| 服务不可用 | AI_SERVICE_UNAVAILABLE | ✅ | 关键词搜索 |
| 模型限流 | AI_RATE_LIMITED | ✅ | 延迟重试 |
| 输入过长 | AI_INPUT_TOO_LONG | ❌ | 截断重试 |
| 输出解析失败 | AI_OUTPUT_PARSE_ERROR | ✅ | 重新生成 |
| 意图不明确 | AI_INTENT_UNCLEAR | ❌ | 引导用户 |

### 5.2 熔断机制

```java
/**
 * AI 服务熔断器配置
 */
@Configuration
public class AICircuitBreakerConfig {
    
    @Bean
    public CircuitBreakerConfig aiCircuitBreakerConfig() {
        return CircuitBreakerConfig.custom()
            // 失败率阈值 50%
            .failureRateThreshold(50)
            // 熔断后等待 30 秒
            .waitDurationInOpenState(Duration.ofSeconds(30))
            // 滑动窗口大小 10 次调用
            .slidingWindowSize(10)
            // 最小调用次数
            .minimumNumberOfCalls(5)
            // 半开状态允许的调用次数
            .permittedNumberOfCallsInHalfOpenState(3)
            .build();
    }
}
```

### 5.3 监控指标

| 指标名称 | 类型 | 说明 |
|----------|------|------|
| `ai_request_total` | Counter | AI 请求总数 |
| `ai_request_success` | Counter | 成功请求数 |
| `ai_request_failure` | Counter | 失败请求数 |
| `ai_request_latency` | Histogram | 请求延迟分布 |
| `ai_fallback_triggered` | Counter | 降级触发次数 |
| `ai_circuit_breaker_state` | Gauge | 熔断器状态 |

---

## 6. 数据同步

### 6.1 向量数据同步

Java 系统负责触发向量数据同步，Python 服务负责执行：

```java
/**
 * 向量数据同步事件
 */
public class VectorSyncEvent {
    private String eventId;
    private SyncType type;        // FULL / INCREMENTAL
    private String entityType;    // STORE / PRODUCT / AREA
    private String entityId;
    private SyncAction action;    // CREATE / UPDATE / DELETE
    private Map<String, Object> data;
}

/**
 * 向量同步服务
 */
@Service
public class VectorSyncService {
    
    @Async
    public void syncEntity(String entityType, String entityId, SyncAction action) {
        VectorSyncEvent event = VectorSyncEvent.builder()
            .eventId(IdGenerator.generate())
            .type(SyncType.INCREMENTAL)
            .entityType(entityType)
            .entityId(entityId)
            .action(action)
            .build();
        
        // 发送到消息队列
        messageQueue.send("vector-sync", event);
    }
}
```

### 6.2 同步流程

```
Java 业务系统                    消息队列                    Python AI 服务
     │                              │                              │
     │  1. 实体变更                  │                              │
     │──────────────────────────────►│                              │
     │                              │  2. 同步事件                  │
     │                              │──────────────────────────────►│
     │                              │                              │
     │                              │                              │  3. 更新向量
     │                              │                              │
     │                              │  4. 同步结果                  │
     │                              │◄──────────────────────────────│
     │  5. 更新同步状态              │                              │
     │◄──────────────────────────────│                              │
     │                              │                              │
```

---

## 7. 安全考虑

### 7.1 服务间认证

```yaml
# Java 调用 Python 服务时携带服务令牌
ai:
  service:
    auth:
      type: SERVICE_TOKEN
      token: ${AI_SERVICE_TOKEN}
      header: X-Service-Token
```

### 7.2 输入过滤

```python
# Python 服务对输入进行安全过滤
def sanitize_input(text: str) -> str:
    """
    过滤潜在的 Prompt 注入攻击
    """
    # 移除特殊控制字符
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    
    # 限制长度
    if len(text) > MAX_INPUT_LENGTH:
        text = text[:MAX_INPUT_LENGTH]
    
    # 检测 Prompt 注入模式
    if detect_injection(text):
        raise SecurityException("Potential prompt injection detected")
    
    return text
```

### 7.3 输出校验

Java 系统对 AI 输出进行严格校验：

1. **格式校验**：确保输出符合预定义 Schema
2. **权限校验**：确保 Action 不超出用户权限
3. **资源校验**：确保目标资源存在且可访问
4. **边界校验**：确保操作在合法范围内

---

## 8. 部署架构

### 8.1 容器编排

```yaml
# docker-compose.yml
services:
  java-backend:
    image: smart-mall-backend:latest
    ports:
      - "8080:8080"
    environment:
      - AI_SERVICE_URL=http://ai-service:8000
    depends_on:
      - postgres
      - redis
      - ai-service
  
  ai-service:
    image: smart-mall-ai:latest
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - VECTOR_DB_URL=http://milvus:19530
    depends_on:
      - milvus
  
  milvus:
    image: milvusdb/milvus:latest
    ports:
      - "19530:19530"
```

### 8.2 扩展策略

| 服务 | 扩展策略 | 说明 |
|------|----------|------|
| Java 后端 | 水平扩展 | 无状态，可多实例 |
| Python AI | 水平扩展 | 按 GPU 资源扩展 |
| 向量数据库 | 分片扩展 | 按数据量扩展 |

---

## 附录 A：错误码对照表

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| AI_SERVICE_TIMEOUT | AI 服务超时 | 504 |
| AI_SERVICE_UNAVAILABLE | AI 服务不可用 | 503 |
| AI_RATE_LIMITED | AI 服务限流 | 429 |
| AI_INPUT_TOO_LONG | 输入过长 | 400 |
| AI_OUTPUT_PARSE_ERROR | 输出解析失败 | 500 |
| AI_INTENT_UNCLEAR | 意图不明确 | 200 |
| AI_ACTION_INVALID | Action 不合法 | 400 |
| AI_PERMISSION_DENIED | 权限不足 | 403 |

---

## 附录 B：版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-01-10 | 初始版本 |

