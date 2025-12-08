# 前端协议规范（PROTOCOL.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端模块间协作协议
> 
> 本文档定义前端系统内部各模块之间的**协作协议**。  
> 本协议关注"如何协商"，而非"如何实现"。

---

## 1. 协议概览（Protocol Overview）

### 1.1 编写目的

本协议用于统一约束智能导购前端系统中**不同角色、不同模块、不同能力之间的协作方式**，通过明确的语义约定与交互规则，降低模块耦合度，提升系统的可扩展性、可维护性与可演进性。

本协议关注的是 **"如何协商"**，而非 **"如何实现"**。

---

### 1.2 适用范围（Scope）

本协议适用于以下协作关系：

- 用户与前端系统之间
- UI 层与业务系统之间
- Three.js 场景系统与业务系统之间
- 智能 Agent / 自动化能力与前端系统之间
- 前端系统内部各层级之间（UI / 应用 / 领域 / 渲染）

---

### 1.3 设计原则（Design Principles）

- **语义优先（Semantic First）**：系统各模块通过语义而非实现细节进行协作
- **单向依赖（Unidirectional Dependency）**：高层依赖抽象语义，不依赖底层具体实现
- **行为可声明，不可直呼实现**：模块之间只表达"想做什么"，不直接"怎么做"
- **人机一致协议**：人类用户与 Agent 遵循同一套行为与意图协议

---

## 2. 协议参与角色定义（Actors）

### 2.1 用户（User）
- 系统的最终使用者
- 通过点击、导航、语音或文本输入表达意图
- 不关心系统内部结构

### 2.2 UI 层（UI Layer）
- 负责采集用户行为
- 将底层事件抽象为"行为事件"
- 不承担业务决策职责

### 2.3 业务协调层（Application Layer）
- 解释行为语义
- 将行为映射为具体系统意图（Intent）
- 调度用例流程（UseCase）

### 2.4 领域场景层（Domain Layer）
- 定义业务规则与约束
- 决定某一意图在当前状态下是否允许
- 维护领域状态的一致性

### 2.5 渲染/执行层（Render / Engine Layer）
- 执行视觉呈现与引擎操作
- 不理解业务含义
- 不做业务判断

### 2.6 Agent / 自动化能力（Agent）
- 以非人类方式生成系统意图
- 不直接操作 UI 或渲染引擎
- 必须遵循统一的协议约束

---

## 3. 行为与意图协议（Action & Intent Protocol）

### 3.1 行为（Action）与意图（Intent）的区分

- **行为（Action）**：表示系统中"发生了什么"，通常源自交互事件
- **意图（Intent）**：表示"系统希望做什么"，是对行为的语义解释结果

```
示例：
行为：用户点击了收银台模型
意图：checkout.open
```

---

### 3.2 意图命名规范（Intent Naming Convention）

统一采用格式：`<domain>.<action>`

```
navigation.moveTo
scene.highlight
permission.apply
builder.enter
layout.submitProposal
```

---

### 3.3 意图规范结构（Intent Canonical Form）⭐

> **协议层硬约束，所有 Intent 必须严格遵循此结构。**

```typescript
interface Intent {
  // ===== 必填字段 =====
  intentId: string;              // 全局唯一，UUID v4
  name: string;                  // domain.action 格式
  source: 'user' | 'agent' | 'system';
  timestamp: number;             // Unix 毫秒时间戳
  
  // ===== 可选字段 =====
  target?: {
    type: string;                // store / area / floor / product
    id: string;
  };
  payload?: Record<string, any>; // 业务参数，结构由 name 决定
  
  // ===== 上下文（只读，Orchestrator 自动填充）=====
  context: Readonly<{
    mode: 'RUNTIME' | 'CONFIG';
    mallId: string;
    floorId?: string;
    userId: string;
    userRole: 'ADMIN' | 'MERCHANT' | 'USER';
    authorizedAreas?: string[];  // 仅 MERCHANT
    sessionId: string;
  }>;
  
  // ===== 元信息 =====
  version: '1.0';
  traceId?: string;              // 链路追踪 ID
}
```

#### 3.3.1 字段约束表

| 字段 | 必填 | 约束说明 |
|------|------|----------|
| intentId | ✅ | UUID v4 格式 |
| name | ✅ | 必须在白名单中 |
| source | ✅ | 枚举值 |
| timestamp | ✅ | Unix 毫秒时间戳 |
| target | ❌ | 操作特定对象时必填 |
| payload | ❌ | 结构由 name 决定 |
| context | ✅ | Orchestrator 自动填充 |
| version | ✅ | 当前固定为 "1.0" |
| traceId | ❌ | 用于关联操作链 |

#### 3.3.2 Intent 示例

```json
{
  "intentId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "navigation.moveTo",
  "source": "user",
  "timestamp": 1733500000000,
  "target": { "type": "store", "id": "store-001" },
  "payload": { "animate": true, "duration": 1000 },
  "context": {
    "mode": "RUNTIME",
    "mallId": "mall-001",
    "userId": "user-123",
    "userRole": "USER",
    "sessionId": "session-abc"
  },
  "version": "1.0"
}
```

---

### 3.4 Intent 白名单（Intent Registry）

| Intent Name | 允许 Source | 需要 Target | 说明 |
|-------------|------------|-------------|------|
| navigation.moveTo | user, agent | ✅ | 导航到目标 |
| navigation.reset | user, agent | ❌ | 重置视角 |
| scene.highlight | user, agent | ✅ | 高亮对象 |
| scene.clearHighlight | user, agent | ❌ | 清除高亮 |
| floor.switch | user, agent | ✅ | 切换楼层 |
| store.select | user, agent | ✅ | 选中店铺 |
| permission.apply | user | ✅ | 申请建模权限 |
| permission.approve | user (admin) | ✅ | 批准申请 |
| permission.reject | user (admin) | ✅ | 拒绝申请 |
| builder.enter | user | ✅ | 进入建模模式 |
| builder.exit | user | ❌ | 退出建模模式 |
| builder.addObject | user | ✅ | 添加对象 |
| builder.modifyObject | user | ✅ | 修改对象 |
| builder.deleteObject | user | ✅ | 删除对象 |
| layout.submitProposal | user | ✅ | 提交变更提案 |
| layout.reviewProposal | user (admin) | ✅ | 审核提案 |
| layout.publishVersion | user (admin) | ✅ | 发布版本 |

> **约束**：不在白名单中的 Intent 将被 Orchestrator 直接拒绝。

---

## 4. 模块间通信协议（Inter-Module Protocol）

### 4.1 UI 层 → 业务协调层

以事件形式上报行为，不做意图判断，不关心后续业务结果。

```typescript
interface UIEvent {
  type: string;           // 事件类型
  target?: {
    semanticType: string;
    businessId: string;
  };
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
  timestamp: number;
}
```

---

### 4.2 业务协调层 → 领域场景层

请求领域校验意图是否合法，不直接修改领域状态，依赖领域返回结构化决策。

---

### 4.3 领域决策返回协议（Domain Decision Protocol）⭐

> **这是改进的核心：明确 Domain 层返回什么样的结构化结果。**

```typescript
interface DomainDecision {
  // ===== 决策结果 =====
  allowed: boolean;              // 是否允许执行
  
  // ===== 拒绝原因（allowed=false 时必填）=====
  rejection?: {
    code: string;                // 错误码
    reason: string;              // 机器可读原因
    message: string;             // 用户友好消息
    details?: Record<string, any>;
  };
  
  // ===== 执行效果（allowed=true 时）=====
  effects?: DomainEffect[];
  
  // ===== 建议的后续操作 =====
  suggestedIntents?: string[];   // 可替代的 Intent 名称
  
  // ===== 元信息 =====
  intentId: string;              // 关联的 Intent ID
  timestamp: number;
}

interface DomainEffect {
  type: 'STATE_CHANGE' | 'RENDER_UPDATE' | 'NOTIFICATION';
  target?: { type: string; id: string };
  data?: Record<string, any>;
}
```

#### 4.3.1 拒绝码定义

| 拒绝码 | 含义 | 示例场景 |
|--------|------|----------|
| PERMISSION_DENIED | 权限不足 | 商家编辑未授权区域 |
| INVALID_STATE | 状态不允许 | 在 RUNTIME 模式下编辑 |
| TARGET_NOT_FOUND | 目标不存在 | 导航到不存在的店铺 |
| BOUNDARY_VIOLATION | 越界操作 | 对象拖出授权区域 |
| CONTEXT_MISMATCH | 上下文不匹配 | 场景切换中执行导航 |
| AUTHORIZATION_EXPIRED | 授权过期 | 建模权限已过期 |

#### 4.3.2 Decision 示例

**允许执行：**
```json
{
  "allowed": true,
  "effects": [
    { "type": "RENDER_UPDATE", "target": { "type": "camera", "id": "main" } },
    { "type": "STATE_CHANGE", "target": { "type": "store", "id": "store-001" } }
  ],
  "intentId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1733500001000
}
```

**拒绝执行：**
```json
{
  "allowed": false,
  "rejection": {
    "code": "PERMISSION_DENIED",
    "reason": "area_not_authorized",
    "message": "您没有编辑该区域的权限",
    "details": { "areaId": "area-A1", "requiredCapability": "EDIT_AUTHORIZED_AREA" }
  },
  "suggestedIntents": ["permission.apply"],
  "intentId": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": 1733500002000
}
```

---

### 4.4 业务协调层 → 渲染层

表达"需要呈现的结果"，不下达具体引擎操作指令。

```typescript
interface RenderCommand {
  type: string;                  // 渲染指令类型
  target?: { type: string; id: string };
  params?: Record<string, any>;
}
```

---

## 5. 场景交互协议（Scene Interaction Protocol）

### 5.1 场景对象语义化原则

所有 Three.js 场景对象必须具备明确的语义身份，而不是仅依赖模型名称。

```typescript
// Three.js Mesh 的 userData 必须包含语义信息
mesh.userData = {
  semanticType: 'store',         // checkout / shelf / product / entrance
  businessId: 'store-001',
  areaId: 'area-A1',
  metadata: { ... }
}
```

交互时通过语义标识识别对象：

```typescript
const { semanticType, businessId } = intersectedMesh.userData;
// 不依赖 mesh.name 或层级结构
```

> 这套设计可迁移到 Unity / Babylon.js 等其他引擎。

---

### 5.2 场景事件抽象

| 事件类型 | 含义 |
|----------|------|
| scene.click | 用户明确指向并选择了某个场景对象 |
| scene.focus | 用户在视觉上持续关注某个对象 |
| scene.enter | 用户的"位置"进入了某个对象的作用范围 |
| scene.leave | 用户离开了某个场景对象或区域范围 |
| scene.activate | 用户满足条件，系统允许触发一个"关键行为" |

> 场景事件本身不等同于业务行为，必须经过语义解释。

---

## 6. Agent / 智能能力协作协议

### 6.1 Agent 的能力边界

Agent 可以：
- 生成 Intent
- 读取只读上下文摘要
- 请求系统执行导航或高亮等动作

### 6.2 Agent 的限制

Agent 不可以：
- 直接调用 UI 方法
- 直接操作 Three.js API
- 绕过领域规则直接修改状态

### 6.3 人与 Agent 的平权关系

```
人类用户 与 Agent = 不同行为来源 = 相同协议约束
```

系统对 Intent 只基于协议与规则判断，不区分来源类型。

---

## 7. 错误与拒绝机制（Failure Contract）

当出现以下情况时，系统必须明确拒绝执行：

- 意图不在白名单中
- 当前领域状态不允许
- 必要上下文缺失
- 能力暂不可用

失败必须返回结构化的 `DomainDecision`（见 4.3 节），包含：
- 明确的拒绝码
- 用户友好的消息
- 可选的替代建议

---

## 8. 协议扩展与演进（Protocol Evolution）

- 协议允许新增 Intent 类型
- 不允许修改已有 Intent 的语义含义
- 高层语义协议稳定，底层实现可替换
- 协议变更应通过文档版本记录体现

---

## 9. 示例：一次完整协作流程

### 场景：用户说"我要去星巴克"

```
1. 用户输入语音
2. Agent 解析语义
3. Agent 生成 Intent：
   {
     intentId: "uuid-001",
     name: "navigation.moveTo",
     source: "agent",
     target: { type: "store", id: "starbucks-001" },
     ...
   }
4. Orchestrator 接收 Intent，填充 context
5. Orchestrator 请求 Domain 校验
6. Domain 返回 DomainDecision { allowed: true, effects: [...] }
7. Orchestrator 分发 RenderCommand 到 Three Core
8. 相机平滑移动到星巴克位置
9. 店铺高亮显示
```

---

## 10. 非目标声明（Non-Goals）

本协议不负责：

- AI 模型选择或训练策略
- 推荐算法具体实现
- 后端接口定义细节（见后端 PROTOCOL.md）
- UI 视觉或交互样式设计

---

## 11. 总结

本协议的核心目标是：

> 通过明确的语义协作规则，让复杂系统依然保持清晰与可演进。

协议是系统长期稳定演进的基础，而不是短期功能实现的附属品。



---

## 12. 区域建模权限协议（Frontend ↔ Backend Shared Protocol）

> ⚠️ **协议定位说明**  
> 本章为 **前后端共享协议子集**，仅描述：
> - 前端可见的状态
> - 前端可触发的 Intent
> 
> 真实状态机、持久化逻辑、审批语义由后端 PROTOCOL.md 定义。

---

### 12.1 协议目标

定义商家申请区域建模权限、管理员审批、以及商家在授权区域内建模的**前端交互规则**。

---

### 12.2 前端可见的区域状态

| 状态 | 前端含义 | 可触发的 Intent |
|------|----------|-----------------|
| LOCKED | 可申请 | permission.apply |
| PENDING | 审批中 | 无（等待） |
| AUTHORIZED | 已授权给当前商家 | builder.enter |
| OCCUPIED | 已被其他商家占用 | 无 |

> 状态由后端 API 返回，前端不维护状态机。

---

### 12.3 权限申请 Intent

```typescript
// 商家申请建模权限
Intent: permission.apply
Target: { type: "area", id: "area-A1" }
Payload: {
  reason: string;              // 申请理由（必填）
  requestedDuration?: number;  // 期望时长（天）
}
Source: user (merchant)
```

**前端行为**：
1. 校验当前用户为 MERCHANT
2. 校验目标区域状态为 LOCKED
3. 提交 Intent 到 Orchestrator
4. 等待后端返回 DomainDecision

---

### 12.4 权限审批 Intent

```typescript
// 管理员批准
Intent: permission.approve
Target: { type: "request", id: "req-001" }
Payload: { comment?: string }
Source: user (admin)

// 管理员拒绝
Intent: permission.reject
Target: { type: "request", id: "req-001" }
Payload: { comment?: string; reason: string }
Source: user (admin)
```

---

### 12.5 建模操作 Intent

```typescript
// 进入建模模式
Intent: builder.enter
Target: { type: "area", id: "area-A1" }
Source: user (merchant)

// 添加对象
Intent: builder.addObject
Target: { type: "area", id: "area-A1" }
Payload: {
  objectType: string;
  position: { x: number; y: number; z: number };
  data?: Record<string, any>;
}
Source: user (merchant)

// 修改对象
Intent: builder.modifyObject
Target: { type: "object", id: "obj-001" }
Payload: {
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  data?: Record<string, any>;
}
Source: user (merchant)

// 删除对象
Intent: builder.deleteObject
Target: { type: "object", id: "obj-001" }
Source: user (merchant)
```

**前端边界约束**：
- 所有操作必须在授权区域边界内
- 操作前校验 → 操作中实时反馈 → 提交时最终校验

---

### 12.6 变更提案 Intent

```typescript
// 提交变更提案
Intent: layout.submitProposal
Target: { type: "area", id: "area-A1" }
Payload: {
  changes: {
    added: string[];      // 新增对象 ID 列表
    modified: string[];   // 修改对象 ID 列表
    removed: string[];    // 删除对象 ID 列表
  };
  description: string;
}
Source: user (merchant)

// 审核提案
Intent: layout.reviewProposal
Target: { type: "proposal", id: "prop-001" }
Payload: {
  action: 'approve' | 'reject' | 'request_changes';
  comment?: string;
}
Source: user (admin)

// 发布版本
Intent: layout.publishVersion
Target: { type: "version", id: "v-001" }
Payload: { description: string }
Source: user (admin)
```

---

### 12.7 前端错误处理

建模相关的 DomainDecision 拒绝码：

| 拒绝码 | 场景 | 用户消息 |
|--------|------|----------|
| AREA_NOT_AUTHORIZED | 编辑未授权区域 | "请先申请该区域的建模权限" |
| BOUNDARY_VIOLATION | 对象越界 | "对象位置超出授权区域边界" |
| AUTHORIZATION_EXPIRED | 授权过期 | "您的建模权限已过期" |
| PROPOSAL_PENDING | 已有待审核提案 | "请等待当前提案审核完成" |

---

### 12.8 前端协议边界

**前端协议负责**：
- ✅ 描述可见状态
- ✅ 描述可触发 Intent
- ✅ 描述前端校验规则
- ✅ 描述错误展示

**后端协议负责**：
- ✅ 真实状态机转换
- ✅ 持久化与事务
- ✅ 审批业务逻辑
- ✅ 权限过期处理

---

### 12.9 协议合规性检查清单

前端实现时必须确保：

- [ ] 所有建模 Intent 都经过 Orchestrator
- [ ] 边界校验在操作前执行
- [ ] 错误信息使用 DomainDecision 结构
- [ ] 状态展示与后端 API 返回一致
- [ ] 不在前端维护区域状态机

---

