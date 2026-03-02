# System Landscape

```mermaid
graph TB
    User["User / Browser"]

    subgraph FE["Frontend App\napps/frontend/SMART-MALL"]
      FE_UI["Vue Views + Components"]
      FE_API["API Layer\nsrc/api/*"]
      FE_ROUTER["Router + Guards\nsrc/router/*"]
      FE_STORE["Pinia Stores\nsrc/stores/*"]
      FE_3D["Three.js Engine\nsrc/engine + src/builder"]
    end

    subgraph BE["Backend Service\napps/backend/SMART-MALL"]
      BE_CTRL["Controllers\ninterfaces/controller"]
      BE_SVC["Application Services\napplication/service"]
      BE_SEC["Security\nSecurityConfig + JWT"]
      BE_MAP["MyBatis Mappers\ninfrastructure/mapper"]
    end

    subgraph IA["Intelligence Service\napps/intelligence/SMART-MALL"]
      IA_API["FastAPI Routers\napp/api/*"]
      IA_AGENT["Agent + Tools\napp/core/agent/*"]
      IA_RAG["RAG\napp/core/rag/*"]
      IA_SYNC["Sync\napp/core/sync/*"]
      IA_MEM["Memory\napp/core/memory/*"]
    end

    subgraph INFRA["Infrastructure\ninfra/docker-compose.yml"]
      PG["PostgreSQL:5433"]
      REDIS["Redis:6379"]
      MILVUS["Milvus:19530"]
      ETCD["Etcd"]
      MINIO["MinIO"]
      ATTU["Attu"]
    end

    User --> FE_UI
    FE_UI --> FE_ROUTER
    FE_UI --> FE_STORE
    FE_UI --> FE_3D
    FE_UI --> FE_API

    FE_API -->|"/api/*"| BE_CTRL
    FE_API -->|"/intelligence-api/*"| IA_API

    BE_CTRL --> BE_SEC
    BE_CTRL --> BE_SVC
    BE_SVC --> BE_MAP
    BE_MAP --> PG
    BE_SVC --> REDIS
    BE_SVC --> IA_API

    IA_API --> IA_AGENT
    IA_API --> IA_RAG
    IA_API --> IA_SYNC
    IA_API --> IA_MEM
    IA_RAG --> MILVUS
    IA_SYNC --> REDIS
    IA_MEM --> REDIS
    IA_MEM --> PG

    MILVUS --> ETCD
    MILVUS --> MINIO
    ATTU --> MILVUS
```
