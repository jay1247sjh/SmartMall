# 前端架构

```mermaid
graph TB
    subgraph ENTRY["入口"]
      MAIN["src/main.ts"]
      ROOT["src/SmartMall.vue"]
    end

    subgraph ROUTING["路由"]
      RINDEX["router/index.ts"]
      RGUARD["router/guards.ts"]
      RDYN["router/dynamic.ts"]
      RMAP["router/componentMap.ts"]
    end

    subgraph STATE["状态管理"]
      USTORE["stores/user.store.ts"]
      ASTORE["stores/ai.store.ts"]
      BSTORE["stores/builder.store.ts"]
      MSTORE["stores/mall.store.ts"]
    end

    subgraph UI["页面与组件"]
      VADMIN["views/admin/*"]
      VMER["views/merchant/*"]
      VUSER["views/user/*"]
      CAI["components/ai/*"]
    end

    subgraph DOMAIN["3D 领域层"]
      BUILDER["场景构建器 src/builder/*"]
      ENGINE["渲染引擎 src/engine/*"]
      DOMAINM["src/domain/*"]
      ORCH["src/orchestrator/*"]
    end

    subgraph NET["网络层"]
      API["src/api/*.ts"]
      HTTP["src/api/http.ts"]
    end

    MAIN --> ROOT
    MAIN --> RINDEX
    MAIN --> STATE
    RINDEX --> RGUARD
    RINDEX --> RDYN
    RDYN --> RMAP

    ROOT --> UI
    UI --> STATE
    UI --> DOMAIN
    UI --> API

    API --> HTTP
    HTTP --> USTORE

    ORCH --> DOMAINM
    DOMAINM --> ENGINE
    BUILDER --> ENGINE
```

```mermaid
flowchart LR
    View["Vue 页面"] --> Action["动作 / 交互"]
    Action --> Guard["角色与模式守卫"]
    Guard --> Orchestrator["编排层"]
    Orchestrator --> Domain["领域模型"]
    Domain --> Engine["Three.js 引擎"]
    Domain --> ApiCall["API 调用"]
```
