# 智能商城导购系统后端协议规范（PROTOCOL.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端语义协议规范  
> 
> 本文档定义后端系统与前端 Orchestrator Layer、AI Agent 之间的**语义契约**。  
> 本协议关注"资源是什么"、"能做什么"、"如何执行"，而非具体的传输路径或框架实现。

---

## 1. 协议设计目标与原则

### 1.1 设计目标

本协议旨在建立后端系统与外部调用方（前端 Orchestrator、AI Agent）之间的**稳定语义边界**：

1. **资源语义化**：定义系统中存在的核心资源及其结构，不暴露数据库表结构或内部实现
2. **能力显式化**：明确当前用户在特定上下文下对资源可执行的操作集合
3. **动作结构化**：规范动作的输入、输出与状态转换，支持 Orchestrator 编排与 AI Agent 推理
4. **前后端解耦**：协议不依赖 Three.js、Vue、Spring 等具体技术栈

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| 语义优先 | 协议描述业务语义，而非技术实现 |
| 能力驱动 | 权限通过 Capability 结果体现，不暴露 RBAC/RCAC 内部规则 |
| 上下文感知 | 所有能力判定均需结合当前用户、空间位置、系统模式 |
| 可推理性 | 结构稳定、字段语义明确，支持 AI Agent 进行逻辑推理 |
| 向后兼容 | 协议演进遵循版本策略，保证既有调用方平滑过渡 |

### 1.3 协议分层

本协议分为三个层次：

```
┌─────────────────────────────────────────┐
│         动作协议（Action Protocol）       │
│     描述"如何执行"与"执行结果"            │
├─────────────────────────────────────────┤
│        能力协议（Capability Protocol）    │
│     描述"当前用户能做什么"                │
├─────────────────────────────────────────┤
│         资源协议（Resource Protocol）     │
│     描述"系统中存在什么"                  │
└─────────────────────────────────────────┘
```

---

## 2. 核心语义对象说明

### 2.1 对象层级关系

```
Mall（商城）
 ├── Floor（楼层）
 │    └── Area（区域）
 │         └── Store（店铺）
 │              └── Product（商品）
 │
 ├── LayoutVersion（布局版本）
 │
 └── AreaApply（区域申请）

User（用户）
 ├── Merchant（商家）
 │    └── AreaPermission（区域权限）
 └── Admin（管理员）
```

### 2.2 核心概念约束

| 概念 | 约束说明 |
|------|----------|
| Floor | 在 3D 体验中为连续空间，用户不显式切换楼层，系统自动处理跨楼层导航 |
| Area | 权限与建模的最小空间单位，商家建模权限绑定到 Area 级别 |
| Geometry | 后端提供抽象空间边界描述，不关心 Three.js Mesh 实现 |
| ModelConfig | 统一的模型配置描述，与渲染引擎解耦 |
| Capability | 权限判定结果的外部表达，不暴露内部 RBAC/RCAC 规则 |

---

## 3. 资源协议（Resource Protocol）

资源协议定义系统中的核心语义资源结构。每个资源仅描述其属性与状态，不描述行为。

### 3.1 Mall（商城）

商城是系统的顶层容器，包含楼层、区域、店铺等子资源。

```json
{
  "mallId": "mall_001",
  "name": "智能商城一号店",
  "description": "首家智能导购商城",
  "status": "ACTIVE",
  "currentLayoutVersion": "v1.2.0",
  "config": {
    "openTime": "09:00",
    "closeTime": "22:00",
    "timezone": "Asia/Shanghai"
  },
  "statistics": {
    "floorCount": 5,
    "areaCount": 48,
    "storeCount": 120
  }
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| mallId | String | 商城唯一标识 |
| name | String | 商城名称 |
| description | String | 商城描述 |
| status | Enum | 商城状态：DRAFT / ACTIVE / CLOSED |
| currentLayoutVersion | String | 当前生效的布局版本号 |
| config | Object | 商城配置信息 |
| statistics | Object | 统计信息（只读） |

### 3.2 Floor（楼层）

楼层是商城的垂直空间划分单元。

```json
{
  "floorId": "floor_001",
  "mallId": "mall_001",
  "index": 1,
  "name": "一楼",
  "height": 5.0,
  "position": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "areaCount": 10
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| floorId | String | 楼层唯一标识 |
| mallId | String | 所属商城标识 |
| index | Integer | 楼层序号（1 表示一楼，-1 表示地下一层） |
| name | String | 楼层名称 |
| height | Number | 楼层高度（米） |
| position | Vector3D | 楼层在 3D 空间中的基准位置 |
| areaCount | Integer | 包含的区域数量 |

### 3.3 Area（区域）

区域是权限与建模的最小空间单位。

```json
{
  "areaId": "area_001",
  "mallId": "mall_001",
  "floorId": "floor_001",
  "name": "A区",
  "type": "RETAIL",
  "geometry": {
    "type": "AABB",
    "min": { "x": 0, "y": 0, "z": 0 },
    "max": { "x": 20, "y": 5, "z": 20 }
  },
  "status": "AUTHORIZED",
  "authorization": {
    "merchantId": "merchant_001",
    "merchantName": "示例商家",
    "grantedAt": "2024-12-01T10:00:00Z",
    "expiresAt": "2025-12-01T10:00:00Z"
  },
  "storeCount": 5
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| areaId | String | 区域唯一标识 |
| mallId | String | 所属商城标识 |
| floorId | String | 所属楼层标识 |
| name | String | 区域名称 |
| type | Enum | 区域类型：RETAIL / FOOD / ENTERTAINMENT / SERVICE |
| geometry | Geometry3D | 区域空间边界 |
| status | Enum | 区域状态：LOCKED / PENDING / AUTHORIZED / OCCUPIED |
| authorization | Object | 授权信息（仅当 status 为 AUTHORIZED 时存在） |
| storeCount | Integer | 包含的店铺数量 |

#### 3.3.1 AreaStatus 状态说明

| 状态 | 语义说明 |
|------|----------|
| LOCKED | 初始状态，无商家占用，可申请 |
| PENDING | 有商家申请中，等待管理员审批 |
| AUTHORIZED | 已授权给特定商家，可进行建模 |
| OCCUPIED | 已被占用且不可再申请（特殊保留区域） |

### 3.4 Store（店铺）

店铺是商家经营的基本单位。

```json
{
  "storeId": "store_001",
  "mallId": "mall_001",
  "areaId": "area_001",
  "merchantId": "merchant_001",
  "name": "示例店铺",
  "category": "服装",
  "logoUrl": "https://example.com/logo.png",
  "position": { "x": 5, "y": 0, "z": 5 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "size": { "x": 10, "y": 3, "z": 10 },
  "status": "ACTIVE",
  "productCount": 50
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| storeId | String | 店铺唯一标识 |
| mallId | String | 所属商城标识 |
| areaId | String | 所属区域标识 |
| merchantId | String | 所属商家标识 |
| name | String | 店铺名称 |
| category | String | 店铺类别 |
| logoUrl | String | 店铺 Logo 地址 |
| position | Vector3D | 店铺在区域内的位置 |
| rotation | Vector3D | 店铺旋转角度 |
| size | Vector3D | 店铺尺寸 |
| status | Enum | 店铺状态：ACTIVE / CLOSED |
| productCount | Integer | 商品数量 |

### 3.5 Product（商品）

商品是店铺内的可售物品。

```json
{
  "productId": "product_001",
  "storeId": "store_001",
  "name": "示例商品",
  "description": "这是一个示例商品",
  "price": 99.00,
  "stock": 100,
  "imageUrl": "https://example.com/product.png",
  "position": { "x": 1, "y": 0, "z": 1 },
  "attributes": {
    "color": "红色",
    "size": "M"
  },
  "status": "ACTIVE"
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| productId | String | 商品唯一标识 |
| storeId | String | 所属店铺标识 |
| name | String | 商品名称 |
| description | String | 商品描述 |
| price | Number | 商品价格 |
| stock | Integer | 库存数量 |
| imageUrl | String | 商品图片地址 |
| position | Vector3D | 商品在店铺内的展示位置 |
| attributes | Object | 商品属性（颜色、尺寸等） |
| status | Enum | 商品状态：ACTIVE / OFFLINE |

### 3.6 User（用户）

用户是系统的登录主体。

```json
{
  "userId": "user_001",
  "username": "zhangsan",
  "type": "MERCHANT",
  "status": "ACTIVE",
  "profile": {
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.png"
  },
  "merchant": {
    "merchantId": "merchant_001",
    "companyName": "示例商家",
    "status": "APPROVED"
  }
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| userId | String | 用户唯一标识 |
| username | String | 用户名 |
| type | Enum | 用户类型：ADMIN / MERCHANT / USER |
| status | Enum | 用户状态：ACTIVE / FROZEN / DELETED |
| profile | Object | 用户资料 |
| merchant | Object | 商家信息（仅当 type 为 MERCHANT 时存在） |

### 3.7 AreaApply（区域申请）

区域申请是商家申请区域建模权限的记录。

```json
{
  "applyId": "apply_001",
  "mallId": "mall_001",
  "floorId": "floor_001",
  "areaId": "area_002",
  "merchantId": "merchant_001",
  "merchantName": "示例商家",
  "reason": "计划开设服装店铺，需要自定义店铺布局",
  "status": "PENDING",
  "applyAt": "2024-12-08T10:00:00Z",
  "reviewedAt": null,
  "reviewerId": null,
  "reviewComment": null
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| applyId | String | 申请唯一标识 |
| mallId | String | 目标商城标识 |
| floorId | String | 目标楼层标识 |
| areaId | String | 目标区域标识 |
| merchantId | String | 申请商家标识 |
| merchantName | String | 申请商家名称 |
| reason | String | 申请理由 |
| status | Enum | 申请状态：PENDING / APPROVED / REJECTED |
| applyAt | DateTime | 申请时间 |
| reviewedAt | DateTime | 审核时间（可为空） |
| reviewerId | String | 审核人标识（可为空） |
| reviewComment | String | 审核意见（可为空） |

### 3.8 通用值对象

#### 3.8.1 Vector3D（三维向量）

```json
{
  "x": 0,
  "y": 0,
  "z": 0
}
```

#### 3.8.2 Geometry3D（空间几何）

```json
{
  "type": "AABB",
  "min": { "x": 0, "y": 0, "z": 0 },
  "max": { "x": 20, "y": 5, "z": 20 }
}
```

| type 值 | 说明 |
|---------|------|
| AABB | 轴对齐包围盒 |
| POLYGON | 多边形（含顶点列表） |



---

## 4. 能力协议（Capability Protocol）

能力协议描述"当前用户在特定上下文下，对某个资源可以执行哪些动作"。

### 4.1 Capability 数据模型

每个资源在返回时可携带 `capabilities` 字段，描述当前用户对该资源的可执行动作集合。

```json
{
  "capabilities": [
    {
      "action": "AREA_APPLY",
      "enabled": true,
      "reason": null
    },
    {
      "action": "AREA_EDIT",
      "enabled": false,
      "reason": "NOT_AUTHORIZED"
    },
    {
      "action": "STORE_CREATE",
      "enabled": false,
      "reason": "AREA_NOT_AUTHORIZED"
    }
  ]
}
```

#### Capability 结构定义

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| action | Enum | 动作类型（见 ActionType 枚举） |
| enabled | Boolean | 当前是否可执行 |
| reason | Enum | 不可执行原因（enabled 为 false 时必填） |

### 4.2 ActionType 枚举定义

#### 4.2.1 导航类动作

| ActionType | 语义说明 | 适用角色 |
|------------|----------|----------|
| NAVIGATE_TO_STORE | 导航到指定店铺 | ALL |
| NAVIGATE_TO_AREA | 导航到指定区域 | ALL |
| NAVIGATE_TO_POSITION | 导航到指定坐标 | ALL |
| HIGHLIGHT_STORE | 高亮指定店铺 | ALL |
| HIGHLIGHT_AREA | 高亮指定区域 | ALL |

#### 4.2.2 查询类动作

| ActionType | 语义说明 | 适用角色 |
|------------|----------|----------|
| MALL_VIEW | 查看商城信息 | ALL |
| FLOOR_VIEW | 查看楼层信息 | ALL |
| AREA_VIEW | 查看区域信息 | ALL |
| STORE_VIEW | 查看店铺信息 | ALL |
| PRODUCT_VIEW | 查看商品信息 | ALL |
| PRODUCT_SEARCH | 搜索商品 | ALL |

#### 4.2.3 区域权限类动作

| ActionType | 语义说明 | 适用角色 |
|------------|----------|----------|
| AREA_APPLY | 申请区域建模权限 | MERCHANT |
| AREA_APPLY_CANCEL | 取消区域申请 | MERCHANT |
| AREA_APPROVE | 审批通过区域申请 | ADMIN |
| AREA_REJECT | 驳回区域申请 | ADMIN |
| AREA_REVOKE | 撤销区域权限 | ADMIN |

#### 4.2.4 建模类动作

| ActionType | 语义说明 | 适用角色 |
|------------|----------|----------|
| AREA_EDIT | 编辑区域内容 | MERCHANT（需授权） |
| STORE_CREATE | 创建店铺 | MERCHANT（需授权） |
| STORE_EDIT | 编辑店铺 | MERCHANT（需所有权） |
| STORE_DELETE | 删除店铺 | MERCHANT（需所有权） |
| PRODUCT_CREATE | 创建商品 | MERCHANT（需所有权） |
| PRODUCT_EDIT | 编辑商品 | MERCHANT（需所有权） |
| PRODUCT_DELETE | 删除商品 | MERCHANT（需所有权） |

#### 4.2.5 管理类动作

| ActionType | 语义说明 | 适用角色 |
|------------|----------|----------|
| MALL_CREATE | 创建商城 | ADMIN |
| MALL_EDIT | 编辑商城 | ADMIN |
| FLOOR_CREATE | 创建楼层 | ADMIN |
| FLOOR_EDIT | 编辑楼层 | ADMIN |
| FLOOR_DELETE | 删除楼层 | ADMIN |
| AREA_CREATE | 创建区域 | ADMIN |
| AREA_MANAGE | 管理区域（拆分/合并） | ADMIN |
| LAYOUT_PUBLISH | 发布布局版本 | ADMIN |

#### 4.2.6 提案类动作

| ActionType | 语义说明 | 适用角色 |
|------------|----------|----------|
| PROPOSAL_SUBMIT | 提交变更提案 | MERCHANT |
| PROPOSAL_REVIEW | 审核变更提案 | ADMIN |

### 4.3 DisabledReason 枚举定义

当 `enabled` 为 `false` 时，`reason` 字段说明不可执行的原因。

| Reason | 语义说明 |
|--------|----------|
| NOT_AUTHENTICATED | 未登录 |
| ROLE_NOT_ALLOWED | 角色不允许执行此操作 |
| NOT_AUTHORIZED | 未获得该资源的操作授权 |
| AREA_NOT_AUTHORIZED | 未获得该区域的建模权限 |
| NOT_OWNER | 非资源所有者 |
| RESOURCE_NOT_FOUND | 目标资源不存在 |
| RESOURCE_STATUS_INVALID | 资源状态不允许此操作 |
| AREA_ALREADY_APPLIED | 该区域已有待审批申请 |
| AREA_ALREADY_AUTHORIZED | 该区域已被授权给其他商家 |
| PERMISSION_EXPIRED | 权限已过期 |
| PERMISSION_FROZEN | 权限已被冻结 |
| SYSTEM_MODE_INVALID | 当前系统模式不允许此操作 |
| BOUNDARY_VIOLATION | 操作超出授权区域边界 |
| QUOTA_EXCEEDED | 超出配额限制 |

### 4.4 能力判定规则

能力判定遵循以下优先级顺序：

```
1. 认证检查
   └─ 未登录 → NOT_AUTHENTICATED

2. 角色检查
   └─ 角色不匹配 → ROLE_NOT_ALLOWED

3. 资源存在性检查
   └─ 资源不存在 → RESOURCE_NOT_FOUND

4. 资源状态检查
   └─ 状态不允许 → RESOURCE_STATUS_INVALID

5. 所有权检查（针对 MERCHANT）
   └─ 非所有者 → NOT_OWNER

6. 区域授权检查（针对建模类动作）
   └─ 未授权 → AREA_NOT_AUTHORIZED
   └─ 已过期 → PERMISSION_EXPIRED
   └─ 已冻结 → PERMISSION_FROZEN

7. 空间边界检查
   └─ 超出边界 → BOUNDARY_VIOLATION

8. 通过所有检查 → enabled: true
```

### 4.5 不同角色的 Capability 差异示例

以下示例展示同一 Area 资源在不同角色下的 Capability 差异：

#### 4.5.1 普通用户（USER）视角

```json
{
  "areaId": "area_001",
  "name": "A区",
  "status": "AUTHORIZED",
  "capabilities": [
    { "action": "AREA_VIEW", "enabled": true, "reason": null },
    { "action": "NAVIGATE_TO_AREA", "enabled": true, "reason": null },
    { "action": "HIGHLIGHT_AREA", "enabled": true, "reason": null },
    { "action": "AREA_APPLY", "enabled": false, "reason": "ROLE_NOT_ALLOWED" },
    { "action": "AREA_EDIT", "enabled": false, "reason": "ROLE_NOT_ALLOWED" }
  ]
}
```

#### 4.5.2 商家（MERCHANT，未授权）视角

```json
{
  "areaId": "area_001",
  "name": "A区",
  "status": "AUTHORIZED",
  "capabilities": [
    { "action": "AREA_VIEW", "enabled": true, "reason": null },
    { "action": "NAVIGATE_TO_AREA", "enabled": true, "reason": null },
    { "action": "AREA_APPLY", "enabled": false, "reason": "AREA_ALREADY_AUTHORIZED" },
    { "action": "AREA_EDIT", "enabled": false, "reason": "AREA_NOT_AUTHORIZED" },
    { "action": "STORE_CREATE", "enabled": false, "reason": "AREA_NOT_AUTHORIZED" }
  ]
}
```

#### 4.5.3 商家（MERCHANT，已授权）视角

```json
{
  "areaId": "area_001",
  "name": "A区",
  "status": "AUTHORIZED",
  "capabilities": [
    { "action": "AREA_VIEW", "enabled": true, "reason": null },
    { "action": "NAVIGATE_TO_AREA", "enabled": true, "reason": null },
    { "action": "AREA_EDIT", "enabled": true, "reason": null },
    { "action": "STORE_CREATE", "enabled": true, "reason": null },
    { "action": "PROPOSAL_SUBMIT", "enabled": true, "reason": null }
  ]
}
```

#### 4.5.4 管理员（ADMIN）视角

```json
{
  "areaId": "area_001",
  "name": "A区",
  "status": "AUTHORIZED",
  "capabilities": [
    { "action": "AREA_VIEW", "enabled": true, "reason": null },
    { "action": "NAVIGATE_TO_AREA", "enabled": true, "reason": null },
    { "action": "AREA_MANAGE", "enabled": true, "reason": null },
    { "action": "AREA_REVOKE", "enabled": true, "reason": null },
    { "action": "PROPOSAL_REVIEW", "enabled": true, "reason": null }
  ]
}
```

---

## 5. 动作协议（Action Protocol）

动作协议定义执行某个动作的输入结构、执行结果与后续可执行动作。

### 5.1 通用 Action 结构

所有动作请求遵循统一的结构：

```json
{
  "action": "ACTION_TYPE",
  "target": {
    "type": "RESOURCE_TYPE",
    "id": "resource_id"
  },
  "params": {
    // 动作特定参数
  },
  "context": {
    "mallId": "mall_001",
    "floorId": "floor_001",
    "position": { "x": 10, "y": 0, "z": 10 }
  }
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| action | Enum | 动作类型 |
| target | Object | 动作作用对象 |
| target.type | Enum | 资源类型：MALL / FLOOR / AREA / STORE / PRODUCT |
| target.id | String | 资源标识 |
| params | Object | 动作参数（各动作不同） |
| context | Object | 执行上下文（可选） |

### 5.2 通用 ActionResult 结构

所有动作响应遵循统一的结构：

```json
{
  "success": true,
  "action": "ACTION_TYPE",
  "target": {
    "type": "RESOURCE_TYPE",
    "id": "resource_id"
  },
  "result": {
    // 动作执行结果
  },
  "nextActions": [
    {
      "action": "NEXT_ACTION_TYPE",
      "target": { "type": "...", "id": "..." },
      "description": "建议的后续动作描述"
    }
  ],
  "error": null
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| success | Boolean | 执行是否成功 |
| action | Enum | 执行的动作类型 |
| target | Object | 动作作用对象 |
| result | Object | 执行结果数据 |
| nextActions | Array | 建议的后续可执行动作 |
| error | Object | 错误信息（success 为 false 时存在） |

### 5.3 导航类 Action

#### 5.3.1 NAVIGATE_TO_STORE

导航到指定店铺。

**请求：**
```json
{
  "action": "NAVIGATE_TO_STORE",
  "target": {
    "type": "STORE",
    "id": "store_001"
  },
  "params": {
    "highlight": true,
    "showInfo": true
  }
}
```

**响应：**
```json
{
  "success": true,
  "action": "NAVIGATE_TO_STORE",
  "target": { "type": "STORE", "id": "store_001" },
  "result": {
    "store": {
      "storeId": "store_001",
      "name": "示例店铺",
      "position": { "x": 5, "y": 0, "z": 5 },
      "floorId": "floor_001",
      "areaId": "area_001"
    },
    "navigationPath": {
      "startPosition": { "x": 0, "y": 0, "z": 0 },
      "endPosition": { "x": 5, "y": 0, "z": 5 },
      "waypoints": []
    }
  },
  "nextActions": [
    {
      "action": "STORE_VIEW",
      "target": { "type": "STORE", "id": "store_001" },
      "description": "查看店铺详情"
    },
    {
      "action": "PRODUCT_SEARCH",
      "target": { "type": "STORE", "id": "store_001" },
      "description": "搜索店铺商品"
    }
  ]
}
```

#### 5.3.2 NAVIGATE_TO_AREA

导航到指定区域。

**请求：**
```json
{
  "action": "NAVIGATE_TO_AREA",
  "target": {
    "type": "AREA",
    "id": "area_001"
  },
  "params": {
    "highlight": true
  }
}
```

**响应：**
```json
{
  "success": true,
  "action": "NAVIGATE_TO_AREA",
  "target": { "type": "AREA", "id": "area_001" },
  "result": {
    "area": {
      "areaId": "area_001",
      "name": "A区",
      "type": "RETAIL",
      "floorId": "floor_001",
      "geometry": {
        "type": "AABB",
        "min": { "x": 0, "y": 0, "z": 0 },
        "max": { "x": 20, "y": 5, "z": 20 }
      }
    },
    "navigationPath": {
      "startPosition": { "x": 50, "y": 0, "z": 50 },
      "endPosition": { "x": 10, "y": 0, "z": 10 },
      "waypoints": []
    }
  },
  "nextActions": [
    {
      "action": "AREA_VIEW",
      "target": { "type": "AREA", "id": "area_001" },
      "description": "查看区域详情"
    }
  ]
}
```

#### 5.3.3 PRODUCT_SEARCH

搜索商品。

**请求：**
```json
{
  "action": "PRODUCT_SEARCH",
  "target": {
    "type": "MALL",
    "id": "mall_001"
  },
  "params": {
    "keyword": "红色连衣裙",
    "category": "服装",
    "priceRange": {
      "min": 100,
      "max": 500
    },
    "page": 1,
    "size": 20
  }
}
```

**响应：**
```json
{
  "success": true,
  "action": "PRODUCT_SEARCH",
  "target": { "type": "MALL", "id": "mall_001" },
  "result": {
    "products": [
      {
        "productId": "product_001",
        "name": "红色连衣裙",
        "price": 299.00,
        "storeId": "store_001",
        "storeName": "示例店铺",
        "position": { "x": 5, "y": 0, "z": 5 }
      }
    ],
    "total": 15,
    "page": 1,
    "totalPages": 1
  },
  "nextActions": [
    {
      "action": "NAVIGATE_TO_STORE",
      "target": { "type": "STORE", "id": "store_001" },
      "description": "前往店铺查看"
    },
    {
      "action": "PRODUCT_VIEW",
      "target": { "type": "PRODUCT", "id": "product_001" },
      "description": "查看商品详情"
    }
  ]
}
```



### 5.4 区域申请与审批类 Action（完整闭环）

本节描述商家申请区域建模权限、管理员审批的完整业务闭环。

#### 5.4.1 业务流程状态机

```
                    ┌─────────────┐
                    │   LOCKED    │ ← 初始状态 / 撤销后状态
                    └──────┬──────┘
                           │ AREA_APPLY
                           ▼
                    ┌─────────────┐
                    │   PENDING   │ ← 等待审批
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
       AREA_APPROVE        │      AREA_REJECT
              │            │            │
              ▼            │            ▼
       ┌─────────────┐     │     ┌─────────────┐
       │ AUTHORIZED  │     │     │   LOCKED    │
       └──────┬──────┘     │     └─────────────┘
              │            │
              │ AREA_REVOKE│
              └────────────┘
```

#### 5.4.2 AREA_APPLY（商家申请区域权限）

**前置条件：**
- 用户角色为 MERCHANT
- 目标区域状态为 LOCKED
- 该商家对该区域无待审批申请

**请求：**
```json
{
  "action": "AREA_APPLY",
  "target": {
    "type": "AREA",
    "id": "area_002"
  },
  "params": {
    "reason": "计划开设服装店铺，需要自定义店铺布局",
    "expectedDuration": 365
  }
}
```

| 参数 | 类型 | 必填 | 语义说明 |
|------|------|------|----------|
| reason | String | 是 | 申请理由 |
| expectedDuration | Integer | 否 | 期望授权时长（天） |

**成功响应：**
```json
{
  "success": true,
  "action": "AREA_APPLY",
  "target": { "type": "AREA", "id": "area_002" },
  "result": {
    "applyId": "apply_001",
    "status": "PENDING",
    "applyAt": "2024-12-08T10:00:00Z",
    "area": {
      "areaId": "area_002",
      "name": "B区",
      "status": "PENDING"
    }
  },
  "nextActions": [
    {
      "action": "AREA_APPLY_CANCEL",
      "target": { "type": "AREA_APPLY", "id": "apply_001" },
      "description": "取消申请"
    }
  ]
}
```

**失败响应（区域已被授权）：**
```json
{
  "success": false,
  "action": "AREA_APPLY",
  "target": { "type": "AREA", "id": "area_001" },
  "result": null,
  "nextActions": [],
  "error": {
    "code": "AREA_ALREADY_AUTHORIZED",
    "message": "该区域已被授权给其他商家",
    "details": {
      "currentMerchantId": "merchant_002",
      "currentMerchantName": "其他商家"
    }
  }
}
```

#### 5.4.3 AREA_APPROVE（管理员审批通过）

**前置条件：**
- 用户角色为 ADMIN
- 目标申请状态为 PENDING

**请求：**
```json
{
  "action": "AREA_APPROVE",
  "target": {
    "type": "AREA_APPLY",
    "id": "apply_001"
  },
  "params": {
    "comment": "审批通过，授权有效期一年",
    "expiresAt": "2025-12-08T10:00:00Z"
  }
}
```

| 参数 | 类型 | 必填 | 语义说明 |
|------|------|------|----------|
| comment | String | 否 | 审批意见 |
| expiresAt | DateTime | 否 | 授权过期时间 |

**成功响应：**
```json
{
  "success": true,
  "action": "AREA_APPROVE",
  "target": { "type": "AREA_APPLY", "id": "apply_001" },
  "result": {
    "apply": {
      "applyId": "apply_001",
      "status": "APPROVED",
      "reviewedAt": "2024-12-08T11:00:00Z"
    },
    "permission": {
      "permissionId": "perm_001",
      "areaId": "area_002",
      "merchantId": "merchant_001",
      "status": "ACTIVE",
      "grantedAt": "2024-12-08T11:00:00Z",
      "expiresAt": "2025-12-08T10:00:00Z"
    },
    "area": {
      "areaId": "area_002",
      "name": "B区",
      "status": "AUTHORIZED"
    }
  },
  "nextActions": [
    {
      "action": "AREA_REVOKE",
      "target": { "type": "AREA_PERMISSION", "id": "perm_001" },
      "description": "撤销该区域权限"
    }
  ]
}
```

#### 5.4.4 AREA_REJECT（管理员驳回申请）

**前置条件：**
- 用户角色为 ADMIN
- 目标申请状态为 PENDING

**请求：**
```json
{
  "action": "AREA_REJECT",
  "target": {
    "type": "AREA_APPLY",
    "id": "apply_001"
  },
  "params": {
    "comment": "该区域已有其他规划，暂不开放"
  }
}
```

| 参数 | 类型 | 必填 | 语义说明 |
|------|------|------|----------|
| comment | String | 是 | 驳回理由 |

**成功响应：**
```json
{
  "success": true,
  "action": "AREA_REJECT",
  "target": { "type": "AREA_APPLY", "id": "apply_001" },
  "result": {
    "apply": {
      "applyId": "apply_001",
      "status": "REJECTED",
      "reviewedAt": "2024-12-08T11:00:00Z",
      "reviewComment": "该区域已有其他规划，暂不开放"
    },
    "area": {
      "areaId": "area_002",
      "name": "B区",
      "status": "LOCKED"
    }
  },
  "nextActions": []
}
```

#### 5.4.5 AREA_REVOKE（管理员撤销权限）

**前置条件：**
- 用户角色为 ADMIN
- 目标区域状态为 AUTHORIZED

**请求：**
```json
{
  "action": "AREA_REVOKE",
  "target": {
    "type": "AREA_PERMISSION",
    "id": "perm_001"
  },
  "params": {
    "reason": "商家违规操作，撤销建模权限"
  }
}
```

| 参数 | 类型 | 必填 | 语义说明 |
|------|------|------|----------|
| reason | String | 是 | 撤销理由 |

**成功响应：**
```json
{
  "success": true,
  "action": "AREA_REVOKE",
  "target": { "type": "AREA_PERMISSION", "id": "perm_001" },
  "result": {
    "permission": {
      "permissionId": "perm_001",
      "status": "REVOKED",
      "revokedAt": "2024-12-08T15:00:00Z",
      "revokeReason": "商家违规操作，撤销建模权限"
    },
    "area": {
      "areaId": "area_002",
      "name": "B区",
      "status": "LOCKED"
    },
    "affectedStores": [
      {
        "storeId": "store_002",
        "name": "被影响的店铺",
        "status": "FROZEN"
      }
    ]
  },
  "nextActions": []
}
```

### 5.5 建模类 Action

#### 5.5.1 STORE_CREATE（创建店铺）

**前置条件：**
- 用户角色为 MERCHANT
- 用户拥有目标区域的有效建模权限
- 店铺位置在授权区域边界内

**请求：**
```json
{
  "action": "STORE_CREATE",
  "target": {
    "type": "AREA",
    "id": "area_001"
  },
  "params": {
    "name": "新店铺",
    "category": "服装",
    "logoUrl": "https://example.com/logo.png",
    "position": { "x": 8, "y": 0, "z": 8 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "size": { "x": 5, "y": 3, "z": 5 }
  }
}
```

**成功响应：**
```json
{
  "success": true,
  "action": "STORE_CREATE",
  "target": { "type": "AREA", "id": "area_001" },
  "result": {
    "store": {
      "storeId": "store_003",
      "name": "新店铺",
      "category": "服装",
      "position": { "x": 8, "y": 0, "z": 8 },
      "status": "ACTIVE"
    }
  },
  "nextActions": [
    {
      "action": "STORE_EDIT",
      "target": { "type": "STORE", "id": "store_003" },
      "description": "编辑店铺信息"
    },
    {
      "action": "PRODUCT_CREATE",
      "target": { "type": "STORE", "id": "store_003" },
      "description": "添加商品"
    }
  ]
}
```

**失败响应（超出边界）：**
```json
{
  "success": false,
  "action": "STORE_CREATE",
  "target": { "type": "AREA", "id": "area_001" },
  "result": null,
  "nextActions": [],
  "error": {
    "code": "BOUNDARY_VIOLATION",
    "message": "店铺位置超出授权区域边界",
    "details": {
      "requestedPosition": { "x": 25, "y": 0, "z": 25 },
      "areaBounds": {
        "min": { "x": 0, "y": 0, "z": 0 },
        "max": { "x": 20, "y": 5, "z": 20 }
      }
    }
  }
}
```

#### 5.5.2 PROPOSAL_SUBMIT（提交变更提案）

**前置条件：**
- 用户角色为 MERCHANT
- 用户拥有目标区域的有效建模权限

**请求：**
```json
{
  "action": "PROPOSAL_SUBMIT",
  "target": {
    "type": "AREA",
    "id": "area_001"
  },
  "params": {
    "description": "更新店铺布局，新增展示区",
    "changes": {
      "added": [
        {
          "type": "DECORATION",
          "position": { "x": 3, "y": 0, "z": 3 },
          "modelConfig": {
            "modelType": "DISPLAY_STAND",
            "scale": 1.0
          }
        }
      ],
      "modified": [
        {
          "objectId": "obj_001",
          "position": { "x": 5, "y": 0, "z": 5 }
        }
      ],
      "removed": ["obj_002"]
    }
  }
}
```

**成功响应：**
```json
{
  "success": true,
  "action": "PROPOSAL_SUBMIT",
  "target": { "type": "AREA", "id": "area_001" },
  "result": {
    "proposal": {
      "proposalId": "proposal_001",
      "status": "PENDING_REVIEW",
      "submittedAt": "2024-12-08T14:00:00Z",
      "changesSummary": {
        "addedCount": 1,
        "modifiedCount": 1,
        "removedCount": 1
      }
    }
  },
  "nextActions": []
}
```

---

## 6. 状态、错误与拒绝原因语义

### 6.1 资源状态枚举

#### 6.1.1 MallStatus

| 状态 | 语义说明 |
|------|----------|
| DRAFT | 草稿，未发布 |
| ACTIVE | 运营中 |
| CLOSED | 已关闭 |

#### 6.1.2 AreaStatus

| 状态 | 语义说明 |
|------|----------|
| LOCKED | 锁定，无商家占用，可申请 |
| PENDING | 有商家申请中，等待审批 |
| AUTHORIZED | 已授权给特定商家 |
| OCCUPIED | 已被占用，不可申请（特殊保留） |

#### 6.1.3 ApplyStatus

| 状态 | 语义说明 |
|------|----------|
| PENDING | 待审批 |
| APPROVED | 已通过 |
| REJECTED | 已驳回 |

#### 6.1.4 PermissionStatus

| 状态 | 语义说明 |
|------|----------|
| ACTIVE | 生效中 |
| FROZEN | 已冻结 |
| EXPIRED | 已过期 |
| REVOKED | 已撤销 |

#### 6.1.5 ProposalStatus

| 状态 | 语义说明 |
|------|----------|
| PENDING_REVIEW | 待审核 |
| APPROVED | 已通过 |
| REJECTED | 已驳回 |
| MERGED | 已合并 |

### 6.2 错误码体系

错误码采用分类前缀 + 序号的格式。

| 前缀 | 分类 | 说明 |
|------|------|------|
| A1 | 参数错误 | 请求参数校验失败 |
| A2 | 业务错误 | 业务规则冲突 |
| A3 | 权限错误 | 认证或授权失败 |
| A4 | 资源错误 | 资源不存在或状态异常 |
| B1 | 系统错误 | 服务端内部错误 |
| C1 | 依赖错误 | 外部服务异常 |

#### 6.2.1 常用错误码

| 错误码 | 语义说明 |
|--------|----------|
| A1001 | 参数校验失败 |
| A1002 | 参数格式错误 |
| A1003 | 必填参数缺失 |
| A2001 | 业务规则冲突 |
| A2002 | 状态不允许操作 |
| A2003 | 重复操作 |
| A3001 | 未登录 |
| A3002 | Token 已过期 |
| A3003 | 权限不足 |
| A3004 | 区域权限不足 |
| A3005 | 非资源所有者 |
| A4001 | 资源不存在 |
| A4002 | 资源已被删除 |
| A4003 | 资源状态异常 |
| B1001 | 系统内部错误 |
| B1002 | 数据库异常 |
| C1001 | 外部服务超时 |

### 6.3 错误响应结构

```json
{
  "success": false,
  "error": {
    "code": "A3004",
    "message": "未获得该区域的建模权限",
    "details": {
      "areaId": "area_001",
      "requiredPermission": "AREA_EDIT",
      "currentStatus": "NOT_AUTHORIZED"
    }
  }
}
```

| 字段 | 类型 | 语义说明 |
|------|------|----------|
| code | String | 错误码 |
| message | String | 用户可读的错误描述 |
| details | Object | 错误详情（可选，用于调试） |

---

## 7. 协议版本与兼容策略

### 7.1 版本标识

协议版本采用语义化版本号：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的协议变更
- **MINOR**：向后兼容的功能新增
- **PATCH**：向后兼容的问题修复

当前版本：`1.0.0`

### 7.2 版本协商

调用方可通过请求头声明期望的协议版本：

```
X-Protocol-Version: 1.0
```

后端响应头返回实际使用的协议版本：

```
X-Protocol-Version: 1.0.0
```

### 7.3 兼容性保证

1. **字段新增**：新增字段不影响既有调用方，调用方应忽略未知字段
2. **字段废弃**：废弃字段在至少两个 MINOR 版本内保持可用
3. **枚举扩展**：新增枚举值不影响既有调用方，调用方应对未知枚举值做容错处理
4. **Breaking Change**：仅在 MAJOR 版本升级时引入，并提供迁移指南

### 7.4 废弃声明

废弃的字段或动作将在响应中携带废弃警告：

```json
{
  "deprecations": [
    {
      "field": "oldFieldName",
      "message": "该字段将在 v2.0 中移除，请使用 newFieldName",
      "removeVersion": "2.0.0"
    }
  ]
}
```

---

## 附录 A：完整 ActionType 枚举

```json
{
  "ActionType": {
    "navigation": [
      "NAVIGATE_TO_STORE",
      "NAVIGATE_TO_AREA",
      "NAVIGATE_TO_POSITION",
      "HIGHLIGHT_STORE",
      "HIGHLIGHT_AREA"
    ],
    "query": [
      "MALL_VIEW",
      "FLOOR_VIEW",
      "AREA_VIEW",
      "STORE_VIEW",
      "PRODUCT_VIEW",
      "PRODUCT_SEARCH"
    ],
    "areaPermission": [
      "AREA_APPLY",
      "AREA_APPLY_CANCEL",
      "AREA_APPROVE",
      "AREA_REJECT",
      "AREA_REVOKE"
    ],
    "modeling": [
      "AREA_EDIT",
      "STORE_CREATE",
      "STORE_EDIT",
      "STORE_DELETE",
      "PRODUCT_CREATE",
      "PRODUCT_EDIT",
      "PRODUCT_DELETE"
    ],
    "management": [
      "MALL_CREATE",
      "MALL_EDIT",
      "FLOOR_CREATE",
      "FLOOR_EDIT",
      "FLOOR_DELETE",
      "AREA_CREATE",
      "AREA_MANAGE",
      "LAYOUT_PUBLISH"
    ],
    "proposal": [
      "PROPOSAL_SUBMIT",
      "PROPOSAL_REVIEW"
    ]
  }
}
```

---

## 附录 B：DisabledReason 枚举

```json
{
  "DisabledReason": [
    "NOT_AUTHENTICATED",
    "ROLE_NOT_ALLOWED",
    "NOT_AUTHORIZED",
    "AREA_NOT_AUTHORIZED",
    "NOT_OWNER",
    "RESOURCE_NOT_FOUND",
    "RESOURCE_STATUS_INVALID",
    "AREA_ALREADY_APPLIED",
    "AREA_ALREADY_AUTHORIZED",
    "PERMISSION_EXPIRED",
    "PERMISSION_FROZEN",
    "SYSTEM_MODE_INVALID",
    "BOUNDARY_VIOLATION",
    "QUOTA_EXCEEDED"
  ]
}
```

---

## 附录 C：AI Agent 集成指南

### C.1 协议对 AI Agent 的友好性设计

1. **结构化输出**：所有响应采用固定 JSON 结构，便于解析
2. **语义明确**：字段命名自解释，枚举值语义清晰
3. **nextActions 提示**：每个动作响应包含建议的后续动作，支持 Agent 推理
4. **Capability 显式化**：Agent 可通过 Capability 判断当前可执行的动作

### C.2 Agent 调用示例

**场景：用户说"我想找红色的连衣裙"**

Agent 解析意图后，构造 Action：

```json
{
  "action": "PRODUCT_SEARCH",
  "target": { "type": "MALL", "id": "mall_001" },
  "params": {
    "keyword": "红色连衣裙",
    "category": "服装"
  }
}
```

根据响应中的 `nextActions`，Agent 可建议用户：

- "找到了 15 件商品，要去最近的店铺看看吗？"
- 对应动作：`NAVIGATE_TO_STORE`

### C.3 Agent 权限边界

- Agent 生成的 Action 必须经过 Orchestrator 的 Capability 校验
- Agent 不能绕过权限系统直接执行操作
- Agent 应根据 `capabilities` 字段判断动作可行性，避免生成无效 Action

---

## 附录 D：WebSocket 实时通知协议

### D.1 WebSocket 连接

**连接端点：** `ws://{host}/ws/notifications`

**连接认证：**
- 连接时需在 URL 参数或首条消息中携带有效的 accessToken
- Token 验证失败将断开连接

```
ws://localhost:8080/ws/notifications?token={accessToken}
```

### D.2 消息格式

所有 WebSocket 消息采用统一的 JSON 格式：

```json
{
  "type": "MESSAGE_TYPE",
  "payload": { ... },
  "timestamp": 1733644800000,
  "version": "1.0"
}
```

### D.3 消息类型定义

#### D.3.1 布局版本更新通知

当新的布局版本发布时，通知所有在线用户：

```json
{
  "type": "LAYOUT_VERSION_PUBLISHED",
  "payload": {
    "mallId": "mall_001",
    "versionId": "version_001",
    "version": 5,
    "publishedBy": "admin_001",
    "publishedAt": "2024-12-08T10:00:00Z",
    "description": "新增 A 区店铺布局",
    "affectedAreaIds": ["area_001", "area_002"]
  },
  "timestamp": 1733644800000,
  "version": "1.0"
}
```

#### D.3.2 区域状态变更通知

当区域状态发生变化时，通知相关用户：

```json
{
  "type": "AREA_STATUS_CHANGED",
  "payload": {
    "mallId": "mall_001",
    "areaId": "area_001",
    "areaName": "A区",
    "previousStatus": "LOCKED",
    "currentStatus": "AUTHORIZED",
    "merchantId": "merchant_001",
    "merchantName": "示例商家",
    "changedAt": "2024-12-08T10:00:00Z"
  },
  "timestamp": 1733644800000,
  "version": "1.0"
}
```

#### D.3.3 权限变更通知

当商家的区域权限发生变化时，通知该商家：

```json
{
  "type": "PERMISSION_CHANGED",
  "payload": {
    "permissionId": "perm_001",
    "areaId": "area_001",
    "areaName": "A区",
    "merchantId": "merchant_001",
    "changeType": "GRANTED",
    "previousStatus": null,
    "currentStatus": "ACTIVE",
    "grantedBy": "admin_001",
    "expiresAt": "2025-12-08T10:00:00Z",
    "changedAt": "2024-12-08T10:00:00Z"
  },
  "timestamp": 1733644800000,
  "version": "1.0"
}
```

**changeType 枚举值：**
- `GRANTED`：权限授予
- `REVOKED`：权限撤销
- `EXPIRED`：权限过期
- `FROZEN`：权限冻结
- `UNFROZEN`：权限解冻

#### D.3.4 申请状态变更通知

当区域申请状态变化时，通知申请人：

```json
{
  "type": "APPLY_STATUS_CHANGED",
  "payload": {
    "applyId": "apply_001",
    "areaId": "area_001",
    "areaName": "A区",
    "merchantId": "merchant_001",
    "previousStatus": "PENDING",
    "currentStatus": "APPROVED",
    "reviewerId": "admin_001",
    "reviewComment": "审批通过",
    "reviewedAt": "2024-12-08T10:00:00Z"
  },
  "timestamp": 1733644800000,
  "version": "1.0"
}
```

#### D.3.5 心跳消息

客户端应定期发送心跳消息保持连接：

**客户端发送：**
```json
{
  "type": "PING",
  "timestamp": 1733644800000
}
```

**服务端响应：**
```json
{
  "type": "PONG",
  "timestamp": 1733644800001
}
```

**心跳间隔：** 建议 30 秒

### D.4 消息订阅与过滤

客户端可以订阅特定类型的消息：

```json
{
  "type": "SUBSCRIBE",
  "payload": {
    "topics": ["LAYOUT_VERSION_PUBLISHED", "PERMISSION_CHANGED"],
    "mallIds": ["mall_001"],
    "areaIds": ["area_001", "area_002"]
  }
}
```

**订阅规则：**
- 不指定 `topics` 则订阅所有消息类型
- 不指定 `mallIds` 则订阅所有商城的消息
- 商家用户自动订阅与自己相关的权限和申请消息

### D.5 错误消息

当发生错误时，服务端发送错误消息：

```json
{
  "type": "ERROR",
  "payload": {
    "code": "WS_AUTH_FAILED",
    "message": "Token 已过期，请重新登录"
  },
  "timestamp": 1733644800000,
  "version": "1.0"
}
```

**错误码：**
- `WS_AUTH_FAILED`：认证失败
- `WS_TOKEN_EXPIRED`：Token 过期
- `WS_INVALID_MESSAGE`：消息格式错误
- `WS_SUBSCRIBE_FAILED`：订阅失败

---

## 附录 E：API 版本控制

### E.1 版本策略

API 版本采用 URL 路径版本控制：

```
/api/v1/mall/list
/api/v1/auth/login
```

### E.2 版本兼容性

| 变更类型 | 是否兼容 | 处理方式 |
|---------|---------|---------|
| 新增字段 | ✅ 兼容 | 客户端忽略未知字段 |
| 新增接口 | ✅ 兼容 | 不影响既有接口 |
| 新增枚举值 | ✅ 兼容 | 客户端对未知枚举做容错 |
| 字段废弃 | ✅ 兼容 | 保留两个版本周期 |
| 字段删除 | ❌ 不兼容 | 仅在主版本升级时 |
| 字段类型变更 | ❌ 不兼容 | 仅在主版本升级时 |
| 接口删除 | ❌ 不兼容 | 仅在主版本升级时 |

### E.3 废弃声明

废弃的字段或接口在响应头中声明：

```
X-Deprecated-Fields: oldFieldName
X-Deprecated-Message: 该字段将在 v2.0 中移除，请使用 newFieldName
X-Deprecated-Remove-Version: 2.0.0
```

### E.4 版本协商

客户端可通过请求头声明期望的 API 版本：

```
X-API-Version: 1.0
```

服务端响应头返回实际使用的版本：

```
X-API-Version: 1.0.3
```

---
