# Intelligence Architecture

```mermaid
graph TB
    subgraph ENTRY["FastAPI Entry"]
      MAIN["app/main.py"]
      LIFE["lifespan startup/shutdown"]
    end

    subgraph API["Routers"]
      CHAT["api/chat.py"]
      STREAM["api/chat_stream.py"]
      VOICE["api/voice_ws.py"]
      RAG_API["api/rag.py"]
      MG["api/mall_generator.py"]
      MD["api/mall_describe.py"]
      SYNC_API["api/sync.py"]
      HEALTH["api/health.py"]
    end

    subgraph CORE["Core Modules"]
      AGENT["core/agent/*"]
      RAG["core/rag/*"]
      MEM["core/memory/*"]
      SYNC["core/sync/*"]
      SPEECH["core/speech/*"]
      LLM["core/llm_provider.py"]
      CFG["core/config.py"]
    end

    subgraph STORAGE["Storage"]
      PG[(PostgreSQL)]
      REDIS[(Redis)]
      MILVUS[(Milvus)]
    end

    MAIN --> LIFE
    MAIN --> API
    API --> CORE

    CHAT --> AGENT
    CHAT --> MEM
    STREAM --> AGENT
    VOICE --> SPEECH
    RAG_API --> RAG
    SYNC_API --> SYNC

    AGENT --> LLM
    RAG --> MILVUS
    RAG --> PG
    MEM --> REDIS
    MEM --> PG
    SYNC --> REDIS

    CFG --> API
    CFG --> CORE
```

```mermaid
flowchart LR
    Start["Startup"] --> InitRedis["Init Redis Pool"]
    InitRedis --> InitBus["Init EventBus Group"]
    InitBus --> InitRag["Init RAG Service"]
    InitRag --> StartScanner["Start SessionScanner"]
    StartScanner --> StartConsumer["Start Sync Consumer"]
    StartConsumer --> Running["Service Running\n(degraded if partial failures)"]
```
