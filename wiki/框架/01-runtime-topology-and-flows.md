# 运行拓扑与请求链路

```mermaid
flowchart LR
    Browser["浏览器 :5173"]

    subgraph VITE["Vite 开发服务器\nvite.config.ts"]
      ProxyAPI["代理 '/api' -> http://localhost:8081"]
      ProxyIA["代理 '/intelligence-api' -> http://localhost:19191\n将 '/intelligence-api' 重写为 '/api'"]
    end

    BE["Spring Boot :8081\ncontext-path=/api"]
    IA["FastAPI :19191\n路由大多位于 /api 下"]

    Browser --> ProxyAPI --> BE
    Browser --> ProxyIA --> IA

    BE -->|"HTTP 客户端\nIntelligenceServiceClient"| IA
```

```mermaid
sequenceDiagram
    participant U as 用户
    participant FE as GlobalAiAssistant
    participant API as intelligence.api.ts
    participant JAVA as /api/ai/*
    participant PY as /api/chat

    U->>FE: 提问
    FE->>API: intelligenceApi.chat(...)
    API->>JAVA: POST /api/ai/chat
    JAVA->>PY: POST /api/chat
    PY-->>JAVA: ChatResponse
    JAVA-->>API: AiChatResponse
    API-->>FE: 渲染消息
```

```mermaid
sequenceDiagram
    participant FE as 前端
    participant API as intelligence.api.ts
    participant VITE as /intelligence-api proxy
    participant PY as 智能服务

    FE->>API: generateMall()/describeMall()
    API->>VITE: POST /intelligence-api/mall/generate or /mall/describe
    VITE->>PY: POST /api/mall/generate or /api/mall/describe
    PY-->>FE: response
```
