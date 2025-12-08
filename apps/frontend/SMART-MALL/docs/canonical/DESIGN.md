# 前端系统设计说明（DESIGN.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端整体架构设计（Vue 3 + TypeScript + Three.js）
> 
> 本文档为 **设计规范文档（Design Specification）**，用于指导实现、维护与演进，不等同于开发教程。

---

## 1. 设计目标与设计边界

### 1.1 前端设计目标

前端系统的核心设计目标如下：

1. **构建一个支持角色区分的 3D 智能导购系统前端原型**
   - 角色包括：管理员（Admin）、商家（Merchant）、用户（User）。
   - 不同角色在 3D 空间与 2D 面板中具备不同能力。

2. **实现“3D 场景 + 2D 面板”的协同交互体验**
   - 3D 用于空间表达、导航与沉浸感。
   - 2D 用于信息展示、配置、数据查看与确认操作。

3. **引入 AI Agent 作为“辅助交互入口”**
   - AI 仅用于意图理解与行为建议。
   - 所有 AI 行为必须经过前端校验与调度。

4. **以数据驱动方式渲染商城与店铺**
   - 商城结构、店铺内容、商品信息不写死在 Three.js 中。
   - Three.js 仅作为“渲染与表现层”。

5. **强调工程可维护性与可扩展性**
   - 支持模块解耦、行为可追踪、设计可演进。
   - 在复杂度与性能之间保持可控平衡。

---

### 1.2 设计边界（明确不做）

为保证系统可交付性与稳定性，本前端设计 **明确不覆盖或弱化以下内容**：

- 不实现真实支付与交易系统。
- 不追求高精度人物动画，仅体现基本移动与停留。
- 不构建复杂物理系统（碰撞、刚体等）。
- 不将 AI 作为唯一入口，UI 始终可用。
- 不在前端实现复杂一致性事务逻辑。

---

## 2. 前端总体架构

### 2.1 技术选型（前端）

- 框架：Vue 3 + TypeScript  
- 编码风格：**选项式 API（Options API）**
- 构建工具：Vite
- 状态管理：Pinia
- 路由：Vue Router 4
- 3D 渲染引擎：Three.js
- AI 交互：前端 Agent 接入模块（只处理 Action）

---

### 2.2 前端分层架构（核心）

前端系统采用明确的分层设计：

UI 层（Vue 组件）
↓
业务协调层（Orchestrator）
↓
领域场景层（Domain Scene）
↓
渲染引擎层（Three Core）

每一层只解决“自己该解决的问题”，禁止职责下沉或越层调用。

---

## 3. 各层职责说明

### 3.1 UI 层（Vue Components）

**职责：**

- 承载用户交互：
  - 3D 场景容器
  - 商品 / 店铺 / 数据等 2D 面板
- 接收用户输入：
  - 鼠标 / 键盘
  - 自然语言输入（文本或语音）
- 展示系统状态与反馈信息。

**约束：**

- UI 层 **不允许直接调用 Three.js API**。
- UI 层 **不解析 AI 返回结果结构**。
- UI 只通过业务协调层触发行为请求。

---

### 3.2 业务协调层（Orchestrator）

业务协调层是整个前端系统的“中枢”。

#### Orchestrator 的职责边界说明（关键设计约束）

业务协调层（Orchestrator）**不负责理解具体业务语义**。

其核心职责限定为：

- 统一接收 Action（来自 UI / AI）
- 完成行为的 **形式校验、权限校验与上下文合法性校验**
- 将合法 Action 分发至对应的领域场景处理入口
- 维护行为执行的时序与可追踪性

**Orchestrator 不关心以下内容：**

- 行为“具体如何执行”
- 不同行为的业务差异
- 不同角色在同一行为下的细节变化

上述内容应由领域场景层或能力策略层承担。

**职责：**

- 接收来自 UI 与 AI 的行为请求。
- 校验权限、上下文与系统状态。
- 将合法行为映射为“领域行为调用”。
- 负责行为日志记录与可追踪性。

**设计原则：**

- 所有行为**必须**经过该层。
- 任何角色 / AI 都不能绕过该层直接修改场景状态。

---

### 3.3 领域场景层（Domain Scene）

该层将“商城”抽象为一组 **语义对象 + 高级行为**。

Domain Scene 负责管理商城内的空间语义结构。

包括但不限于：
- 空间分区（Floor / Area / Zone）
- 空间连通关系（电梯、扶梯、坡道等）

**职责：**

Domain Scene 负责管理商城内部的空间语义结构，包括：
  - 空间分区（Floor / Area / Zone）
  - 语义对象（Store / Entrance / Facility）
  - 空间连通关系（如电梯、扶梯、坡道）
将语义行为映射为底层 Three.js 操作。

Domain Scene 对外提供目标导向的语义行为接口，
而不暴露“楼层切换”这一用户决策概念。

所有跨楼层移动行为，被视为导航路径的一部分，
由系统自动规划并执行。

**设计原则：**

- 不关心用户是谁。
- 不关心 AI 来源。
- 只保证“语义正确性”。

---

### 3.4 渲染引擎层（Three Core）

该层封装所有 Three.js 相关内容。

**职责：**

- Scene / Camera / Renderer 初始化。
- 渲染循环控制。
- 资源加载与释放。

**设计约束：**

- 不认识“商城”“店铺”“用户”等业务概念。
- 可以在理论上被替换为其他渲染引擎。

---

## 4. 角色与权限模型（RCAC）

### 4.1 角色定义

- **Admin（管理员）**  
  负责商城整体结构与商家管理。

- **Merchant（商家）**  
  可配置自身店铺内容，仅对自身店铺拥有编辑能力。

- **User（用户）**  
  以“消费者/游客”身份进入商城游览与导航。

---

### 4.2 权限模型设计

本系统采用 **RCAC（Role + Capability + Context）模型**：

- **Role（角色）**：当前用户身份
- **Capability（能力）**：允许执行的行为类型
- **Context（上下文）**：当前所在空间、运行模式

#### 核心原则

- 权限与“所在空间”强相关。
- 商家仅能编辑自身店铺。
- 普通用户无法进入配置态。
- 管理员拥有全局视角。

#### Context 的时间维度补充（Temporal Context）

在本系统中，Context 不仅表示空间与模式，
还包含系统所处的时间阶段（Temporal State）。

示意包括但不限于：

- 营业状态：OPEN / CLOSED
- 系统阶段：NORMAL / TRANSITION
- 资源状态：READY / LOADING

时间维度 Context 主要用于防止：
- 非营业时间执行配置行为
- 场景切换中执行导航行为
- AI 在不稳定阶段输出操作建议

RCAC 判断需同时满足：
Role ∧ Capability ∧ Spatial Context ∧ Temporal Context

---

## 5. 动态路由树设计（Dynamic Route Tree）

### 5.1 设计动机

为支持多角色系统、配置态与运行态区分、以及商家可扩展页面能力，本前端系统采用 **后端驱动的动态路由树设计**。

该设计的目标包括：

- 支持不同角色看到不同页面结构
- 支持商家与管理员拥有专属功能区域
- 减少前端对路由结构的硬编码
- 将“页面结构”作为一种可配置能力进行管理
- 为 AI Agent 的“页面操作建议”提供安全边界

> 动态路由解决的是“**用户能看到什么页面**”，  
> 而不是“用户能在页面里做什么”。

---

### 5.2 路由层在前端架构中的位置

在本系统中，路由层被视为**前端能力暴露的入口控制平面（Entry Control Plane）**。

整体前端结构可补充为：

动态路由层（Route Layer）
↓
UI 层（Vue Components）
↓
业务协调层（Orchestrator）
↓
领域场景层（Domain Scene）
↓
渲染引擎层（Three Core）

其核心职责是：

- 决定当前用户可以访问哪些页面
- 决定页面在系统中的层级与结构
- 作为权限系统的“第一道过滤”

但需明确：

> 路由层 **不负责业务权限判断**，  
> 所有具体行为仍需通过 RCAC 校验。

---

### 5.3 页面级权限与行为级权限的区分

本系统将前端权限拆分为两个明确层级：

1. **页面级权限（Route-level Permission）**
   - 控制页面是否可见、是否可进入
   - 由动态路由树与路由守卫完成

2. **行为级权限（Action-level Permission）**
   - 控制页面内具体操作是否可执行
   - 由 RCAC（Role + Capability + Context）模型完成

两者之间的关系是：

> **能进入页面 ≠ 能执行页面内的所有操作**

该设计用于防止：
- 因页面可见而导致权限误判
- AI 或用户绕过行为校验直接操作系统能力

---

### 5.4 动态路由树的数据模型（前端视角）

前端接收的动态路由树仅作为**页面结构与权限描述数据**存在，不携带任何可执行逻辑或代码引用。  
其核心作用是描述“页面形态”，而非“页面行为”。

动态路由树的设计目标包括：

- 描述页面层级结构与父子关系  
- 标记页面的访问权限与角色范围  
- 标记页面所属系统模式（配置态 / 运行态）  
- 为前端路由解析与权限校验提供统一依据  

---

#### 路由节点结构示意

```json
{
  "path": "/merchant",
  "name": "MerchantLayout",
  "component": "LAYOUT",
  "meta": {
    "roles": ["MERCHANT", "ADMIN"],
    "pagePermission": "MERCHANT_ENTRY",
    "mode": "RUNTIME"
  },
  "children": [
    {
      "path": "store-config",
      "name": "StoreConfig",
      "component": "MerchantStoreConfig",
      "meta": {
        "pagePermission": "EDIT_STORE",
        "mode": "CONFIG"
      }
    }
  ]
}
```

**设计约束说明：**

- `component` 字段仅作为组件标识符存在，不允许下发真实文件路径
- 前端维护组件白名单映射表，将标识符映射为实际 Vue 组件
- 路由节点仅描述页面结构与可见性，不描述页面内具体业务行为

---

### 5.5 动态路由的加载与注入流程

前端在运行阶段采用统一流程完成动态路由加载与注入：

1. 用户完成登录或身份初始化
2. 前端获取当前用户的角色与基础上下文信息
3. 请求后端返回当前用户可访问的路由树
4. 前端对路由树进行结构与权限合法性校验
5. 通过 `router.addRoute` 动态注入合法路由
6. 初始化页面并渲染对应视图

该流程保证：

- 不同角色获得不同的页面拓扑结构
- 路由结构在运行期动态生成
- 非授权页面在前端层面不可见

---

### 5.6 路由与配置态 / 运行态的关系

每个路由节点通过 `meta.mode` 明确标记其所属系统模式：

- **CONFIG**：配置态页面
- **RUNTIME**：运行态页面

对应设计规则如下：

- 配置态页面仅对管理员与商家可见
- 普通用户在路由层面无法访问任何配置态页面
- 路由层负责页面级模式过滤
- 行为层（RCAC）负责页面内具体操作的权限校验

> 页面是否展示由路由层决定，而页面内是否可操作由行为权限决定。

---

### 5.7 路由权限与 RCAC 的协同机制

前端权限系统采用双层权限防线设计：

**1. 页面级权限（Route-level Permission）**

- 控制页面是否可见、是否允许进入
- 由动态路由树与路由守卫实现

**2. 行为级权限（Action-level Permission）**

- 控制页面内的具体操作能力
- 由 RCAC（Role + Capability + Context）模型实现

#### 路由刷新与上下文一致性原则

当动态路由发生变更（如角色变更、权限刷新）时，
若当前上下文不再满足路由合法性，
系统应主动退出当前页面并回退至安全态（Runtime 模式）。

该机制用于防止：
- 路由层与行为权限状态不一致
- 配置态被非法滞留

> 即使页面可访问，也不意味着具备页面内所有操作权限。  
> 该设计用于防止因页面曝光而产生的越权风险。

---

### 5.8 动态路由与 AI Agent 的边界设计

AI Agent 在前端系统中**不直接操控路由实例**，其能力被明确限制为：

- 提出“页面跳转建议”
- 不具备绕过路由守卫的能力
- 路由是否允许跳转始终由前端权限系统判定

统一设计原则如下：

- AI Agent 只能提出跳转建议，不能强制执行页面跳转。
- 即使 AI 输出合法 Action，仍需通过页面级权限校验后方可执行。

### 5.9 动态路由设计收益总结

通过引入动态路由树机制，前端系统获得以下设计收益：

- 页面结构与角色权限解耦
- 降低前端对路由配置的硬编码依赖
- 支持商家与管理员能力的可扩展性
- 强化系统入口层面的安全边界
- 更贴近真实生产级前端架构模式

动态路由作为“页面级控制平面”，与行为控制系统形成清晰分工，共同构成稳定且可演进的前端系统设计。

---

## 6. 配置态与运行态（Mode Design）

### 6.1 模式划分

- **配置态（Config Mode）**
  - 管理员 / 商家使用
  - 用于搭建和编辑商城内容

- **运行态（Runtime Mode）**
  - 所有角色可进入
  - 用于游览、导航与展示

### 6.2 模式设计意义

- 分离“编辑行为”与“游览行为”。
- 显著降低权限与状态复杂度。
- 避免用户误操作影响系统结构。

---

## 7. 商城语义建模（前端视角）

### 7.1 语义优先原则

在系统中：

> **任何 3D 对象，必须先是“语义对象”，再是 Mesh。**

Three.js 对象只是语义对象的视觉表现。

---

### 7.2 核心语义实体（示意）

- Mall（商城）
- Floor（楼层）
- Area（区域）
- Store（店铺）

每个实体都具备：

- 唯一标识
- 语义属性
- 空间定位信息

---

## 8. 行为系统设计（Action System）

### 8.1 行为抽象原则

前端不直接执行“低级 Three 操作”，而是执行 **语义行为**：

- NavigateToStore
- HighlightStore
- SwitchFloor
- OpenPanel

#### 行为执行结果的语义化建模（Domain Result）

领域行为的执行结果应当被显式建模，
而非直接抛出异常或仅以布尔值表示。

示意结果包括：

- 执行成功
- 权限不足
- 目标未就绪
- 上下文不匹配

该设计用于：
- 支持 AI 行为纠错与重试
- 提供明确的用户反馈语义
- 防止底层异常向 UI 层泄漏

---

### 8.2 Action 统一模型

```ts
interface Action {
  type: string;
  payload: Record<string, any>;
  source: 'UI' | 'AGENT';
}
```

所有行为来源（UI / AI）最终都会被统一为 Action。

### 8.3 行为执行流程（Action Execution Flow）

所有前端行为（无论来源于 UI 还是 AI）均需要遵循统一的执行流程，以保证安全性、可维护性与一致性。

**标准流程如下：**

1. 行为产生  
   - UI 触发（按钮、面板操作、快捷指令等）
   - AI Agent 输出结构化 Action

2. 行为接收  
   - 所有 Action 进入业务协调层（Orchestrator）

3. 行为校验  
   - 角色校验（Role）
   - 能力校验（Capability）
   - 上下文校验（Context：配置态 / 运行态、所在空间）

4. 行为确认（仅限写操作）
   - 若 Action 涉及数据或结构变更，必须通过用户确认
   - AI 触发的写操作不得自动执行

5. 行为分发  
   - Orchestrator 将合法 Action 映射为领域场景层方法调用

6. 行为执行  
   - 领域场景层调用渲染引擎层（Three Core）
   - 更新场景表现或触发视图变更

7. 行为记录  
   - 可选：记录 Action 日志，用于调试、回放或分析

---

## 9. AI 在前端中的系统定位

### 9.1 AI 的角色定义

在本前端系统中，AI Agent 被定义为：

> **受控的辅助决策入口（Constrained Assistant）**

其核心定位如下：

- AI 是交互入口之一，但不是唯一入口
- AI 不具备任何超出当前用户角色的权限
- AI 不直接操作 Three.js 或前端状态
- AI 仅输出行为建议（Action）

---

### 9.2 AI 行为的约束机制

为避免 AI 输出不可控行为，前端对 AI 行为施加强约束：

1. **结构约束**
   - AI 输出必须符合预定义 JSON Action 协议
   - 非法结构直接拒绝执行

2. **权限约束**
   - AI 行为必须通过 RCAC 权限模型校验
   - AI 不可越权执行操作

3. **确认约束**
   - 所有可能改变系统状态的 Action 必须人工确认
   - 前端 UI 负责承接确认流程

> 设计原则：  
> **AI 只能“建议”，不能“决定”。**

---

## 10. 多用户在线与人物模型设计

### 10.1 多用户同步策略

在多人 3D 场景中（如智能商城、虚拟校园），
客户端之间通过 WebSocket + 心跳机制进行位置与状态同步。

由于网络抖动、浏览器切后台、移动网络波动等客观因素，
客户端可能在短时间内无法正常发送同步数据。

如果在检测到“连接中断”时立即移除人物模型，
将导致人物模型频繁消失/出现，严重影响 3D 场景的沉浸体验。

因此，本系统采用【 **弱同步（Presence-based Sync）模型** + 状态机】的方式管理在线状态，以在一致性与体验之间取得平衡。

**同步内容包括：**

- 用户/商家的空间位置（近似坐标）
- 当前停留区域或店铺标识
- 在线/离线状态

**不同步内容包括：**

- 精细动作（行走动画、姿态）
- 物理交互与碰撞
- 表情或社交动作

---

### 10.2 人物实体的系统职责

人物实体在前端系统中承担以下职责：

- **空间定位锚点**：表示用户在商城中的位置
- **角色标识**：区分管理员 / 商家 / 用户
- **权限感知载体**：与可执行行为相关联

人物实体本身不承载业务逻辑，仅用于可视化与定位。

---

### 10.3 人物状态管理设计

在多人 3D 场景中（如智能商城、虚拟校园），
客户端通过 WebSocket 心跳与位置同步机制感知其他用户的存在状态。

考虑到网络抖动、浏览器切换后台、短时丢包等客观情况，
系统采用【弱同步 + 状态机】的方式管理人物在线状态，
避免因瞬时网络异常导致人物模型频繁移除，影响用户体验。

---

#### 10.3.1 人物状态划分

系统将用户在线状态划分为以下三个阶段：

- **ONLINE**：在线状态，数据同步正常  
- **DISCONNECTED**：疑似离线（短时中断）  
- **OFFLINE**：确认离线  

---

#### 10.3.2 状态转换规则

人物状态之间的转换遵循如下规则：

```text
ONLINE
  →（心跳或位置同步超时 N 次）
DISCONNECTED
  →（持续超时达到阈值 T）
OFFLINE

N 用于吸收短时网络抖动，避免误判离线
T 用于确认用户已离开场景
状态不会因单次心跳失败立即发生跳变
```

---

#### 10.3.3 状态行为定义

当人物处于 ONLINE 状态时，系统认为该用户在线且同步正常：

- 心跳与位置同步正常
- 人物模型可交互
- 动画、位置插值、朝向更新正常
- 模型完全可见，参与碰撞与交互逻辑

当连续多次未接收到心跳或位置更新，但尚未达到离线阈值时，人物状态由 ONLINE 进入 DISCONNECTED：

- 人物模型仍然保留在场景中
- 暂停位置插值与动画更新
- 禁止交互行为
- 通过降低透明度或 UI 提示标识“连接中”

当人物在 DISCONNECTED 状态下持续超时，超过阈值 T 后，则判定用户已确认离线，进入 OFFLINE 状态：

- 不再参与同步与交互逻辑
- 人物模型从当前场景中隐藏
- 模型实例进入对象池回收，而非立即销毁

```
在线状态       │ 模型状态     │ 处理方式
──────────────┼─────────────┼──────────────────────────────────
ONLINE        │ Active      │ 正常渲染、动画与交互
DISCONNECTED  │ Inactive    │ 保留模型，暂停更新，降低透明度
OFFLINE       │ Recycled    │ 隐藏模型，对象池回收（可快速复用）
```

---

## 11. 状态管理与生命周期设计

### 11.1 单一事实源（SSOT）原则

本系统以领域场景层作为单一事实源（SSOT），
UI、Three.js 场景与 Agent 均不直接持有业务事实，
仅通过语义化意图与用例与领域状态交互，从而保证系统一致性与可演进性。

为防止状态分裂，前端遵循以下原则：

- Three.js 场景仅负责渲染，不保存业务状态
- 2D 面板组件仅负责展示与交互，不保存核心状态
- 所有业务状态集中于统一状态模块（如 Pinia）

---

### 11.2 三维场景生命周期

三维场景的生命周期如下：

1. 页面进入
   - 加载商城语义数据
   - 初始化领域场景层
   - 初始化 Three Core

2. 场景运行
   - 响应 Action 驱动内容变化
   - 进行按需渲染

3. 页面离开
   - 停止渲染循环
   - 销毁 Three.js 资源
   - 注销事件监听

该设计支持在单页面中多次进入和退出 3D 场景。

---

## 12. 渲染策略与性能控制

### 12.1 渲染策略

前端采用 **按需渲染优先** 的策略：

- 场景静止且无变更时可暂停渲染
- 发生导航、交互或动画时恢复渲染
- 避免每帧强制重绘带来的性能浪费

---

### 12.2 性能优化原则

- 使用低多边形模型表示人物
- 优先复用几何体与材质
- 按楼层或区域分批加载模型
- 必要时使用实例化渲染（InstancedMesh）

性能目标以“流畅运行、不明显卡顿”为第一优先级。

---

## 13. 编码风格与实现约定（前端）

### 13.1 Vue 编码风格

- 统一使用 Vue 3 选项式 API
- 明确区分 data / computed / methods / lifecycle
- 禁止在组件中直接操作 Three.js 实例

---

### 13.2 TypeScript 规范

- 全局启用 strict 模式
- 核心数据结构强类型建模
- 禁止滥用 any
- 行为、权限、语义实体均使用接口或枚举定义

---

## 14. 数据模型设计（Data Models）

### 14.1 核心数据模型

本节定义系统中的核心数据结构，所有模型均使用 TypeScript 接口定义。

#### 14.1.1 商城结构模型

```typescript
// 商城实体
interface Mall {
  id: string;
  name: string;
  description: string;
  floors: Floor[];
  currentLayoutVersion: string;
  metadata: Record<string, any>;
}

// 楼层实体
interface Floor {
  id: string;
  mallId: string;
  level: number;
  name: string;
  areas: Area[];
  position: Vector3D;
  metadata: Record<string, any>;
}

// 区域实体
interface Area {
  id: string;
  floorId: string;
  name: string;
  type: AreaType;
  stores: Store[];
  bounds: BoundingBox;
  status: AreaStatus;
  authorizedMerchantId?: string;
  authorizationInfo?: AreaAuthorizationInfo;
  metadata: Record<string, any>;
}

// 区域状态
enum AreaStatus {
  LOCKED = 'LOCKED',           // 初始状态，不可编辑
  PENDING = 'PENDING',         // 有商家申请中，等待审批
  AUTHORIZED = 'AUTHORIZED',   // 已授权，可被特定商家编辑
  OCCUPIED = 'OCCUPIED'        // 已被占用，不可再申请
}

// 区域授权信息
interface AreaAuthorizationInfo {
  areaId: string;
  merchantId: string;
  authorizedAt: number;
  expiresAt?: number;
  layoutVersionRange?: {
    from: string;
    to?: string;
  };
  permissions: string[];
}

// 店铺实体
interface Store {
  id: string;
  areaId: string;
  name: string;
  merchantId: string;
  category: string;
  position: Vector3D;
  rotation: Vector3D;
  size: Vector3D;
  products: Product[];
  metadata: Record<string, any>;
}

// 商品实体
interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  position: Vector3D;
  metadata: Record<string, any>;
}
```

#### 14.1.2 语义对象模型

```typescript
// 语义对象基础接口
interface SemanticObject {
  id: string;
  semanticType: SemanticType;
  businessId: string;
  displayName: string;
  metadata: Record<string, any>;
}

// 语义类型枚举
enum SemanticType {
  MALL = 'mall',
  FLOOR = 'floor',
  AREA = 'area',
  STORE = 'store',
  PRODUCT = 'product',
  ENTRANCE = 'entrance',
  CHECKOUT = 'checkout',
  DECORATION = 'decoration'
}

// 空间定位信息
interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// 边界框
interface BoundingBox {
  min: Vector3D;
  max: Vector3D;
}

// 区域类型
enum AreaType {
  RETAIL = 'retail',
  FOOD = 'food',
  ENTERTAINMENT = 'entertainment',
  SERVICE = 'service'
}
```

#### 14.1.3 行为与权限模型

```typescript
// Action 标准结构
interface Action {
  type: ActionType;
  payload: Record<string, any>;
  source: ActionSource;
  timestamp: number;
}

// Action 类型
enum ActionType {
  // ===== Navigation / Scene-level (目标导向，连续空间友好) =====
  NAVIGATE_TO_STORE = 'navigation.navigateToStore',
  NAVIGATE_TO_AREA = 'navigation.navigateToArea',
  NAVIGATE_TO_POSITION = 'navigation.navigateToPosition',

  HIGHLIGHT_STORE = 'scene.highlightStore',
  HIGHLIGHT_AREA = 'scene.highlightArea',

  // ===== UI-level（表现层行为） =====
  UI_OPEN_PANEL = 'ui.openPanel',
  UI_CLOSE_PANEL = 'ui.closePanel',

  // ===== Config / Write Operations（强业务语义） =====
  CONFIG_EDIT_STORE = 'config.editStore',
  CONFIG_ADD_PRODUCT = 'config.addProduct',
  CONFIG_REMOVE_PRODUCT = 'config.removeProduct',
  CONFIG_MOVE_OBJECT = 'config.moveObject',
  CONFIG_DELETE_OBJECT = 'config.deleteObject',

  // ===== Modeling Permission Operations =====
  PERMISSION_APPLY = 'permission.apply',
  PERMISSION_APPROVE = 'permission.approve',
  PERMISSION_REJECT = 'permission.reject',
  PERMISSION_REVOKE = 'permission.revoke',

  // ===== Layout Management Operations =====
  LAYOUT_SUBMIT_PROPOSAL = 'layout.submitProposal',
  LAYOUT_REVIEW_PROPOSAL = 'layout.reviewProposal',
  LAYOUT_PUBLISH_VERSION = 'layout.publishVersion',
  LAYOUT_SWITCH_VERSION = 'layout.switchVersion',

  // ===== Builder Mode Operations =====
  BUILDER_ENTER = 'builder.enter',
  BUILDER_EXIT = 'builder.exit',
  BUILDER_ADD_OBJECT = 'builder.addObject',
  BUILDER_MODIFY_OBJECT = 'builder.modifyObject',
  BUILDER_DELETE_OBJECT = 'builder.deleteObject'
}

// Action 来源
enum ActionSource {
  UI = 'UI',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM'
}

// 角色定义
enum Role {
  ADMIN = 'ADMIN',
  MERCHANT = 'MERCHANT',
  USER = 'USER'
}

// 能力定义
enum Capability {
  VIEW_MALL = 'VIEW_MALL',
  NAVIGATE = 'NAVIGATE',
  EDIT_MALL_STRUCTURE = 'EDIT_MALL_STRUCTURE',
  EDIT_OWN_STORE = 'EDIT_OWN_STORE',
  MANAGE_MERCHANTS = 'MANAGE_MERCHANTS',
  APPLY_MODELING_PERMISSION = 'APPLY_MODELING_PERMISSION',
  APPROVE_MODELING_PERMISSION = 'APPROVE_MODELING_PERMISSION',
  REVOKE_MODELING_PERMISSION = 'REVOKE_MODELING_PERMISSION',
  EDIT_AUTHORIZED_AREA = 'EDIT_AUTHORIZED_AREA',
  SUBMIT_LAYOUT_PROPOSAL = 'SUBMIT_LAYOUT_PROPOSAL',
  REVIEW_LAYOUT_PROPOSAL = 'REVIEW_LAYOUT_PROPOSAL',
  PUBLISH_LAYOUT_VERSION = 'PUBLISH_LAYOUT_VERSION',
  VIEW_LAYOUT_HISTORY = 'VIEW_LAYOUT_HISTORY'
}

// 上下文定义
interface Context {
  mode: SystemMode;
  currentFloor: string | null;
  currentStore: string | null;
  temporalState: TemporalState;
}

currentFloor 表示系统内部判断用户所处的空间分区
用于：
- 权限与上下文校验
- 渲染优化（按区域加载/卸载）
- AI 或导航的路径推断
- 该字段不作为用户可感知或可操作状态。

// 系统模式
enum SystemMode {
  RUNTIME = 'RUNTIME',
  CONFIG = 'CONFIG'
}

// 时间状态
enum TemporalState {
  READY = 'READY',
  LOADING = 'LOADING',
  TRANSITION = 'TRANSITION',
  ERROR = 'ERROR'
}

// 权限校验结果
interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: Role;
  requiredCapability?: Capability;
}
```

#### 14.1.4 领域行为结果模型

```typescript
// 领域操作结果
interface DomainResult<T = any> {
  success: boolean;
  data?: T;
  error?: DomainError;
}

// 领域错误
interface DomainError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}

// 错误码
enum ErrorCode {
  SUCCESS = 'SUCCESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TARGET_NOT_FOUND = 'TARGET_NOT_FOUND',
  TARGET_NOT_READY = 'TARGET_NOT_READY',
  CONTEXT_MISMATCH = 'CONTEXT_MISMATCH',
  INVALID_ACTION = 'INVALID_ACTION',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BOUNDARY_VIOLATION = 'BOUNDARY_VIOLATION',
  AREA_NOT_AUTHORIZED = 'AREA_NOT_AUTHORIZED',
  AREA_ALREADY_OCCUPIED = 'AREA_ALREADY_OCCUPIED',
  AUTHORIZATION_EXPIRED = 'AUTHORIZATION_EXPIRED',
  INVALID_LAYOUT_VERSION = 'INVALID_LAYOUT_VERSION',
  PROPOSAL_ALREADY_SUBMITTED = 'PROPOSAL_ALREADY_SUBMITTED',
  CANNOT_PUBLISH_DRAFT = 'CANNOT_PUBLISH_DRAFT'
}
```

#### 14.1.5 用户与会话模型

```typescript
// 用户信息
interface User {
  id: string;
  username: string;
  role: Role;
  merchantId?: string;
  avatar?: string;
  authorizedAreas?: string[];
  metadata: Record<string, any>;
}

// 用户会话
interface Session {
  userId: string;
  token: string;
  role: Role;
  capabilities: Capability[];
  authorizedAreas?: string[];
  expiresAt: number;
}

// 在线用户状态
interface OnlineUser {
  userId: string;
  username: string;
  role: Role;
  position: Vector3D;
  currentFloor: string;
  currentStore: string | null;
  status: OnlineStatus;
  lastHeartbeat: number;
}

// 在线状态
enum OnlineStatus {
  ONLINE = 'ONLINE',
  DISCONNECTED = 'DISCONNECTED',
  OFFLINE = 'OFFLINE'
}
```

---

#### 14.1.6 建模权限与版本管理模型

```typescript
// 建模权限申请
interface ModelingPermissionRequest {
  requestId: string;
  applicantId: string;
  applicantName: string;
  mallId: string;
  areaId: string;
  areaName: string;
  reason: string;
  requestedDuration?: number;
  status: PermissionRequestStatus;
  reviewerId?: string;
  reviewComment?: string;
  createdAt: number;
  reviewedAt?: number;
}

// 权限申请状态
enum PermissionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED'
}

// Layout 版本
interface LayoutVersion {
  versionId: string;
  mallId: string;
  version: number;
  status: LayoutVersionStatus;
  createdBy: string;
  createdByRole: Role;
  createdAt: number;
  publishedAt?: number;
  description: string;
  changes: LayoutChange[];
  affectedAreas: string[];
}

// Layout 版本状态
enum LayoutVersionStatus {
  DRAFT = 'DRAFT',       // 草稿，未发布
  ACTIVE = 'ACTIVE',     // 当前生效版本
  ARCHIVED = 'ARCHIVED'  // 已归档
}

// Layout 变更记录
interface LayoutChange {
  changeId: string;
  areaId: string;
  merchantId?: string;
  changeType: LayoutChangeType;
  objectsBefore: SemanticObject[];
  objectsAfter: SemanticObject[];
  timestamp: number;
}

// Layout 变更类型
enum LayoutChangeType {
  AREA_CREATED = 'AREA_CREATED',
  AREA_MODIFIED = 'AREA_MODIFIED',
  AREA_DELETED = 'AREA_DELETED',
  OBJECTS_ADDED = 'OBJECTS_ADDED',
  OBJECTS_MODIFIED = 'OBJECTS_MODIFIED',
  OBJECTS_REMOVED = 'OBJECTS_REMOVED'
}

// 建模变更提案
interface LayoutChangeProposal {
  proposalId: string;
  areaId: string;
  merchantId: string;
  merchantName: string;
  changes: {
    added: SemanticObject[];
    modified: SemanticObject[];
    removed: string[];
  };
  description: string;
  status: ProposalStatus;
  submittedAt: number;
  reviewedAt?: number;
  reviewComment?: string;
}

// 提案状态
enum ProposalStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MERGED = 'MERGED'
}

// 可申请区域信息
interface AvailableArea {
  areaId: string;
  areaName: string;
  floorId: string;
  floorName: string;
  bounds: BoundingBox;
  status: AreaStatus;
  currentOccupant?: {
    merchantId: string;
    merchantName: string;
    authorizedAt: number;
  };
  canApply: boolean;
}

// Builder 约束信息
interface BuilderConstraints {
  authorizedAreaId: string;
  areaBounds: BoundingBox;
  allowedActions: ActionType[];
  forbiddenZones: BoundingBox[];
  maxObjectCount?: number;
  allowedObjectTypes?: SemanticType[];
}
```

---

### 14.2 数据流设计

#### 14.2.1 商城数据加载流程

```
1. 应用启动
   ↓
2. 从后端 API 获取商城配置数据
   ↓
3. 数据验证与格式化
   ↓
4. 存储到 Pinia Store
   ↓
5. Domain Layer 订阅数据变更
   ↓
6. Three Core 根据数据渲染场景
```

#### 14.2.2 状态同步流程

```
Pinia Store (SSOT)
   ↓
   ├─→ UI Components (响应式更新)
   ├─→ Domain Layer (业务逻辑)
   └─→ Three Core (场景渲染)
```

---

## 15. 正确性属性（Correctness Properties）

*属性（Property）是系统在所有有效执行中都应保持为真的特征或行为。属性是人类可读规格说明与机器可验证正确性保证之间的桥梁。*

本节定义系统必须满足的正确性属性，这些属性将通过属性测试（Property-Based Testing）进行验证。

### 15.1 架构层级属性

**Property 1: 分层依赖单向性**
*对于任意* Action 执行路径，调用链必须严格遵循 UI → Orchestrator → Domain → Three Core 的单向依赖，不允许反向调用或跨层调用
**验证需求: Requirements 3**

**Property 2: Action 必经 Orchestrator**
*对于任意* 来源的 Action（UI 或 Agent），都必须经过 Orchestrator 的校验流程，不存在绕过 Orchestrator 直接修改场景状态的路径
**验证需求: Requirements 4**

**Property 3: UI 层隔离性**
*对于任意* UI 组件，其代码中不应包含对 Three.js API 的直接调用
**验证需求: Requirements 3**

---

### 15.2 权限与安全属性

**Property 4: RCAC 完整性**
*对于任意* Action 执行请求，Orchestrator 必须同时校验 Role、Capability 和 Context 三个维度，缺一不可
**验证需求: Requirements 6**

**Property 5: 商家权限隔离**
*对于任意* Merchant 角色的用户，其只能编辑 merchantId 与自身 userId 匹配的店铺，不能访问其他商家的店铺
**验证需求: Requirements 6**

**Property 6: 配置态访问限制**
*对于任意* User 角色的用户，其不能访问任何标记为 CONFIG 模式的页面或执行任何配置态 Action
**验证需求: Requirements 7**

**Property 7: AI 权限等价性**
*对于任意* 由 Agent 生成的 Action，其权限校验规则必须与 UI 触发的相同 Action 完全一致
**验证需求: Requirements 5**

---

### 15.3 数据一致性属性

**Property 8: 单一事实源**
*对于任意* 业务状态（如当前楼层、选中店铺），系统中只存在一个权威数据源（Pinia Store），Three.js Scene 和 UI Components 不存储该状态的副本
**验证需求: Requirements 10**

**Property 9: 状态同步一致性**
*对于任意* Pinia Store 中的状态变更，所有订阅该状态的组件和模块都应在下一个渲染周期内收到更新通知
**验证需求: Requirements 10**

**Property 10: 语义对象唯一性**
*对于任意* 业务实体（如 Store），在系统中只存在一个对应的语义对象，不存在重复的 businessId
**验证需求: Requirements 2**

---

### 15.4 行为正确性属性

**Property 11: Action 格式合法性**
*对于任意* 进入 Orchestrator 的 Action，必须包含 type、payload 和 source 字段，且 type 必须在预定义的 ActionType 枚举中
**验证需求: Requirements 4**

**Property 12: 导航目标可达性**
*对于任意* 有效的店铺 ID，执行 NavigateToStore Action 后，相机位置应移动到该店铺的可视范围内
**验证需求: Requirements 12**

**Property 13: 楼层切换完整性**
*对于任意* 楼层切换操作，当前楼层的所有对象应被隐藏，目标楼层的所有对象应被显示，且不存在对象遗漏或重复显示
**验证需求: Requirements 13**

**Property 14: 高亮状态互斥性**
*对于任意* 时刻，场景中最多只有一个店铺处于高亮状态（除非明确支持多选）
**验证需求: Requirements 12**

---

### 15.5 生命周期属性

**Property 15: 资源释放完整性**
*对于任意* 场景卸载操作，所有 Three.js 资源（Geometry、Material、Texture）都应被正确释放，不存在内存泄漏
**验证需求: Requirements 1**

**Property 16: 渲染循环可控性**
*对于任意* 场景静止状态（无动画、无交互），渲染循环应被暂停，不进行无效的帧渲染
**验证需求: Requirements 14**

**Property 17: 多次进入退出稳定性**
*对于任意* 连续的进入和退出 3D 场景操作，系统应保持稳定，不出现资源冲突或状态残留
**验证需求: Requirements 1**

---

### 15.6 数据驱动属性

**Property 18: 配置数据驱动性**
*对于任意* 有效的商城配置数据，系统应能根据数据渲染出对应的场景结构，不依赖硬编码的商城布局
**验证需求: Requirements 9**

**Property 19: 数据更新响应性**
*对于任意* 商城数据的更新（如新增店铺），系统应能在不重启应用的情况下重新渲染场景
**验证需求: Requirements 9**

**Property 20: 语义映射一致性**
*对于任意* 语义对象，其在 Domain Layer 的表示与在 Three Core 的 Mesh.userData 中的表示应保持一致
**验证需求: Requirements 2**

---

### 15.7 错误处理属性

**Property 21: 错误信息结构化**
*对于任意* 失败的 Action 执行，系统应返回结构化的 DomainError，包含明确的错误码和用户友好的错误消息
**验证需求: Requirements 16**

**Property 22: 权限拒绝明确性**
*对于任意* 因权限不足被拒绝的 Action，错误信息应明确指出缺少的角色或能力
**验证需求: Requirements 16**

**Property 23: 配置数据验证完整性**
*对于任意* 格式错误的商城配置数据，系统应在加载阶段拒绝并返回详细的验证错误信息
**验证需求: Requirements 17**

---

### 15.8 AI 集成属性

**Property 24: AI 输出格式约束**
*对于任意* Agent 生成的输出，如果不符合 Action 协议格式，系统应拒绝执行并提示用户
**验证需求: Requirements 5**

**Property 25: AI 写操作确认**
*对于任意* 由 Agent 生成的涉及数据变更的 Action，系统必须要求用户确认后才能执行
**验证需求: Requirements 5**

**Property 26: AI 不可绕过权限**
*对于任意* Agent 生成的 Action，即使格式合法，也必须通过与 UI 相同的 RCAC 权限校验
**验证需求: Requirements 5**

---

## 16. 测试策略（Testing Strategy）

### 16.1 测试方法论

本系统采用 **双轨测试策略**，结合单元测试和属性测试：

- **单元测试（Unit Testing）**：验证具体示例、边界条件和集成点
- **属性测试（Property-Based Testing）**：验证通用属性在大量随机输入下的正确性

两种测试方法互补：
- 单元测试捕获具体的 bug 和边界情况
- 属性测试验证系统的通用正确性保证

---

### 16.2 属性测试框架选择

**选用框架**: `fast-check` (JavaScript/TypeScript 的属性测试库)

**理由**:
- 与 TypeScript 深度集成
- 支持复杂数据结构的生成器
- 提供收缩（shrinking）功能，自动简化失败用例
- 社区活跃，文档完善

---

### 16.3 属性测试实施规范

#### 16.3.1 测试配置

每个属性测试应配置为运行 **至少 100 次迭代**，以确保覆盖足够的输入空间：

```typescript
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // property assertion
  }),
  { numRuns: 100 }
);
```

#### 16.3.2 测试标注规范

每个属性测试必须使用注释明确标注其对应的设计文档中的属性：

```typescript
/**
 * Feature: smart-mall, Property 1: 分层依赖单向性
 * 验证需求: Requirements 3
 */
test('property: layered dependency unidirectionality', () => {
  // test implementation
});
```

标注格式：`Feature: {feature_name}, Property {number}: {property_text}`

#### 16.3.3 属性与测试的映射关系

- 每个正确性属性应对应 **一个** 属性测试
- 属性测试应直接验证属性描述的不变量
- 不应将多个属性合并到一个测试中

---

### 16.4 单元测试策略

#### 16.4.1 测试范围

单元测试应覆盖：
- 关键业务逻辑的具体示例
- 边界条件和异常情况
- 模块间的集成点
- UI 组件的交互行为

#### 16.4.2 测试原则

- 优先测试核心功能，避免过度测试
- 使用真实数据而非 mock，除非必要
- 测试应独立且可重复执行
- 测试名称应清晰描述测试意图

---

### 16.5 测试分层

```
E2E 测试（可选）
   ↓
集成测试
   ↓
属性测试 + 单元测试
   ↓
代码实现
```

- **单元测试 + 属性测试**：验证单个模块的正确性
- **集成测试**：验证模块间协作的正确性
- **E2E 测试**：验证完整用户流程（可选，资源允许时实施）

---

### 16.6 测试覆盖率目标

- **核心模块**（Orchestrator、Domain Layer）：80% 以上代码覆盖率
- **UI 组件**：关键交互路径覆盖
- **Three Core**：资源管理和生命周期覆盖
- **属性测试**：所有定义的正确性属性都应有对应测试

---

### 16.7 测试执行策略

- 开发阶段：每次提交前运行单元测试和属性测试
- 集成阶段：运行完整测试套件
- 持续集成：自动化运行所有测试
- 性能测试：定期验证渲染性能和内存使用

---

## 17. 错误处理与降级策略

### 17.1 错误分类

系统错误分为以下类别：

1. **权限错误**：用户尝试执行超出权限的操作
2. **数据错误**：配置数据格式错误或缺失
3. **网络错误**：API 请求失败或 WebSocket 断开
4. **渲染错误**：Three.js 资源加载失败或渲染异常
5. **系统错误**：未预期的运行时错误

---

### 17.2 错误处理原则

- **用户友好**：向用户展示可理解的错误消息
- **可恢复性**：提供重试或替代方案
- **不泄漏技术细节**：不向用户暴露堆栈跟踪或内部错误
- **日志记录**：记录详细错误信息供开发者调试

---

### 17.3 降级策略

当系统遇到非致命错误时，应采用降级策略保证基本可用：

- **AI 不可用**：回退到纯 UI 交互模式
- **3D 渲染失败**：显示 2D 平面图或列表视图
- **网络中断**：使用本地缓存数据，禁用同步功能
- **性能不足**：降低渲染质量或禁用动画效果

---

## 18. 安全性设计

### 18.1 前端安全原则

- **不信任客户端输入**：所有用户输入都应验证
- **权限前后端双重校验**：前端权限仅用于 UI 控制，后端必须再次校验
- **敏感信息保护**：不在前端存储敏感数据
- **XSS 防护**：对用户输入进行转义和过滤

---

### 18.2 Action 安全校验

所有 Action 在执行前必须通过以下校验：

1. **格式校验**：Action 结构是否合法
2. **类型校验**：ActionType 是否在白名单中
3. **权限校验**：当前用户是否有权执行
4. **上下文校验**：当前系统状态是否允许执行
5. **参数校验**：payload 中的参数是否合法

---

### 18.3 路由安全

- 动态路由树由后端下发，前端不可篡改
- 路由守卫在每次导航前校验权限
- 非授权页面在前端层面不可见
- 路由变更时验证上下文一致性

---

## 19. 可扩展性设计

### 19.1 模块扩展点

系统设计了以下扩展点：

- **新增 ActionType**：在 ActionType 枚举中添加新类型
- **新增语义对象**：在 SemanticType 枚举中添加新类型
- **新增角色**：在 Role 枚举中添加新角色
- **新增能力**：在 Capability 枚举中添加新能力

---

### 19.2 插件化设计

未来可考虑将以下模块插件化：

- **AI Agent 实现**：支持不同的 AI 服务提供商
- **渲染引擎**：支持替换为其他 3D 引擎
- **状态管理**：支持替换为其他状态管理方案

---

## 20. 设计总结

本前端设计遵循以下核心原则：

- 决策与执行分离
- 语义先于渲染
- AI 可控且受限
- 权限与空间强关联
- 架构以"可完成性"为导向

本文档作为前端系统设计的唯一权威说明，应在设计变更时优先更新，再调整实现代码。

---

## 附录：需求追溯矩阵

| 设计章节 | 对应需求 |
|---------|---------|
| 3. 各层职责说明 | Requirements 3 |
| 4. 角色与权限模型 | Requirements 6, 21, 22 |
| 5. 动态路由树设计 | Requirements 8 |
| 6. 配置态与运行态 | Requirements 7 |
| 7. 商城语义建模 | Requirements 2 |
| 8. 行为系统设计 | Requirements 4 |
| 9. AI 在前端中的系统定位 | Requirements 5 |
| 10. 多用户在线与人物模型设计 | Requirements 15 |
| 11. 状态管理与生命周期设计 | Requirements 1, 10 |
| 12. 渲染策略与性能控制 | Requirements 14 |
| 14. 数据模型设计 | Requirements 2, 9, 21, 22, 23, 24 |
| 15. 正确性属性 | All Requirements |
| 16. 测试策略 | All Requirements |
| 21. 区域建模权限与空间治理机制 | Requirements 21, 22, 23, 24, 25, 26, 27, 28 |


---

## 21. 区域建模权限与空间治理机制

### 21.1 设计动机

为实现多角色协作的 3D 商城系统，本系统引入 **区域建模权限申请与审批机制**，这是一个完整的空间治理体系，而非简单的权限控制。

该机制的核心目标：

- 管理员控制"空间骨架"（楼层、区域划分）
- 商家在"授权区域内"进行内容建模
- 所有建模变更需经过审批才能发布
- 防止越权编辑和空间冲突
- 支持可审计、可撤销的权限管理

---

### 21.2 区域状态模型

每个 Area 在系统中具有明确的状态，用于控制建模权限：

```typescript
enum AreaStatus {
  LOCKED = 'LOCKED',           // 初始状态，不可编辑
  PENDING = 'PENDING',         // 有商家申请中，等待审批
  AUTHORIZED = 'AUTHORIZED',   // 已授权，可被特定商家编辑
  OCCUPIED = 'OCCUPIED'        // 已被占用，不可再申请
}

interface AreaAuthorizationInfo {
  areaId: string;
  status: AreaStatus;
  authorizedMerchantId?: string;
  authorizationValidUntil?: number;
  layoutVersionRange?: {
    from: string;
    to: string;
  };
}
```

**状态转换规则：**

```
LOCKED
  →（商家提交申请）
PENDING
  →（管理员审批通过）
AUTHORIZED
  →（授权到期或撤销）
LOCKED
```

---

### 21.3 建模权限申请流程（前端视角）

#### 21.3.1 商家查看可申请区域

**场景：** 商家进入商城，查看哪些区域可以申请建模权

**前端行为：**

1. 商家进入商城 Runtime 模式
2. 前端请求后端 API：`GET /api/modeling-permission/available-areas`
3. 后端返回区域列表及状态：

```typescript
interface AvailableArea {
  areaId: string;
  areaName: string;
  floorId: string;
  bounds: BoundingBox;
  status: AreaStatus;
  currentOccupant?: string;
}
```

4. 前端在 3D 场景中高亮显示可申请区域（status === LOCKED）
5. 已授权区域显示为"已占用"，不可再申请

---

#### 21.3.2 商家提交建模权申请

**场景：** 商家选中某个区域，提交建模权申请

**前端行为：**

1. 商家点击可申请区域
2. 前端弹出申请表单，要求填写：
   - 申请理由（reason）
   - 预计使用时长（optional）
3. 提交申请：`POST /api/modeling-permission/apply`

```typescript
interface ModelingPermissionRequest {
  mallId: string;
  areaId: string;
  reason: string;
  requestedDuration?: number;
}
```

4. 前端显示"申请已提交，等待管理员审批"
5. 该区域状态变为 PENDING，前端标记为"审批中"

---

#### 21.3.3 管理员审批建模权

**场景：** 管理员查看待审批申请并做出决策

**前端行为：**

1. 管理员进入管理后台
2. 查看待审批列表：`GET /api/modeling-permission/pending`
3. 前端展示申请详情：
   - 申请商家信息
   - 申请区域位置（3D 预览）
   - 申请理由
4. 管理员选择：
   - **批准**：`POST /api/modeling-permission/{requestId}/approve`
   - **拒绝**：`POST /api/modeling-permission/{requestId}/reject`

**批准后的系统行为：**

- 后端更新 Area 状态：PENDING → AUTHORIZED
- 后端创建授权记录（Merchant + Area + LayoutVersion）
- 前端刷新区域状态，商家可进入 Builder 模式

---

### 21.4 商家建模沙盒约束（前端实现）

当商家获得区域建模权后，前端必须实施严格的"沙盒约束"，防止越界编辑。

#### 21.4.1 前端沙盒边界检查

```typescript
interface BuilderConstraints {
  authorizedAreaId: string;
  areaBounds: BoundingBox;
  allowedActions: ActionType[];
  forbiddenZones: BoundingBox[];
}

class BuilderSandbox {
  // 检查对象是否在授权区域内
  isWithinAuthorizedArea(position: Vector3D): boolean {
    return this.bounds.contains(position);
  }

  // 检查拖拽操作是否越界
  validateDrag(objectId: string, newPosition: Vector3D): DomainResult {
    if (!this.isWithinAuthorizedArea(newPosition)) {
      return {
        success: false,
        error: {
          code: ErrorCode.BOUNDARY_VIOLATION,
          message: '不能将对象拖拽到授权区域外'
        }
      };
    }
    return { success: true };
  }

  // 检查是否尝试编辑其他区域对象
  validateEdit(objectId: string): DomainResult {
    const object = this.getObjectById(objectId);
    if (object.areaId !== this.authorizedAreaId) {
      return {
        success: false,
        error: {
          code: ErrorCode.PERMISSION_DENIED,
          message: '不能编辑其他区域的对象'
        }
      };
    }
    return { success: true };
  }
}
```

#### 21.4.2 前端要"死守"的三条红线

❌ **商家永远不能编辑未授权 Area**
- 前端在 Builder 模式下禁用未授权区域的所有交互
- 拖拽、点击、选中等操作仅限授权区域

❌ **商家不能发布 Layout**
- 商家只能"提交变更提案"，不能直接发布
- 发布按钮对商家不可见

❌ **商家不能改变空间骨架**
- 不能修改区域边界
- 不能删除或移动其他商家的店铺
- 不能修改楼层结构

---

### 21.5 商家提交建模成果

**场景：** 商家完成区域建模，提交变更供管理员审核

**前端行为：**

1. 商家在 Builder 模式下完成编辑
2. 点击"提交变更"按钮
3. 前端收集变更数据：

```typescript
interface LayoutChangeProposal {
  areaId: string;
  merchantId: string;
  changes: {
    added: SemanticObject[];
    modified: SemanticObject[];
    removed: string[];
  };
  description: string;
  timestamp: number;
}
```

4. 提交到后端：`POST /api/area/{areaId}/modeling/submit`
5. 前端显示"变更已提交，等待管理员审核"
6. 商家可继续编辑，但不影响已提交的版本

---

### 21.6 管理员审核与发布

**场景：** 管理员审核商家建模成果并决定是否发布

**前端行为：**

1. 管理员查看待审核变更列表
2. 前端提供 3D 预览功能：
   - 显示变更前后对比
   - 高亮新增/修改/删除的对象
3. 管理员选择：
   - **合并并发布**：创建新 LayoutVersion，状态为 ACTIVE
   - **驳回**：要求商家修改
   - **暂存**：保留变更但不发布

**发布后的前端行为：**

- 新用户进入商城时自动加载最新 LayoutVersion
- 在线用户收到通知，可选择刷新场景
- 前端缓存失效，重新加载商城数据

---

### 21.7 Layout 版本管理（前端视角）

#### 21.7.1 版本数据模型

```typescript
interface LayoutVersion {
  versionId: string;
  mallId: string;
  version: number;
  status: LayoutVersionStatus;
  createdBy: string;
  createdAt: number;
  publishedAt?: number;
  description: string;
  changes: LayoutChangeProposal[];
}

enum LayoutVersionStatus {
  DRAFT = 'DRAFT',       // 草稿，未发布
  ACTIVE = 'ACTIVE',     // 当前生效版本
  ARCHIVED = 'ARCHIVED'  // 已归档
}
```

#### 21.7.2 前端版本切换策略

**新用户进入：**
- 前端请求：`GET /api/mall/{mallId}/layout?version=latest`
- 后端返回最新 ACTIVE 版本
- 前端渲染场景

**在线用户版本更新：**
- 后端通过 WebSocket 推送版本更新通知
- 前端显示提示："商城布局已更新，是否刷新？"
- 用户确认后重新加载场景

**管理员预览历史版本：**
- 管理员可选择查看任意历史版本
- 前端请求：`GET /api/mall/{mallId}/layout?version={versionId}`
- 以只读模式渲染历史场景

---

### 21.8 权限校验的双重防线

本系统采用 **前后端双重权限校验** 机制：

#### 21.8.1 前端防线（UI 控制）

- 未授权区域在 Builder 模式下不可交互
- 未授权操作的按钮不可见或禁用
- 拖拽、编辑操作实时校验边界

**目的：** 提升用户体验，避免无效操作

#### 21.8.2 后端防线（安全保障）

- 所有 API 请求必须校验用户身份与授权状态
- 即使前端被篡改，后端也会拒绝非法请求
- 记录所有越权尝试，用于安全审计

**后端要"死守"的三条红线：**

❌ **未授权请求必须被拒绝**（即使前端被篡改）
❌ **已撤销授权不可继续提交**
❌ **同一 Area 同一时间只能存在一个有效授权主体**

---

### 21.9 区域建模权限的正确性属性

**Property 27: 区域授权唯一性**
*对于任意* Area 和时间点，最多只有一个 Merchant 拥有该区域的建模权
**验证需求: Requirements 6**

**Property 28: 沙盒边界约束**
*对于任意* 商家在 Builder 模式下的编辑操作，所有新增或移动的对象必须位于授权区域边界内
**验证需求: Requirements 6**

**Property 29: 建模权申请状态一致性**
*对于任意* 建模权申请，前端显示的状态必须与后端数据库中的状态一致
**验证需求: Requirements 6**

**Property 30: 商家不可发布 Layout**
*对于任意* Merchant 角色的用户，其不能执行 Layout 发布操作，只能提交变更提案
**验证需求: Requirements 6**

**Property 31: 版本切换一致性**
*对于任意* LayoutVersion 切换操作，前端渲染的场景必须与该版本的数据完全一致
**验证需求: Requirements 9**

---

### 21.10 设计收益总结

通过引入区域建模权限与空间治理机制，系统获得以下收益：

✅ **清晰的权力边界**
- 管理员与商家职责明确
- 避免权限冲突和越界编辑

✅ **可审计的变更流程**
- 所有建模变更都有记录
- 支持版本回滚和历史追溯

✅ **平台级治理能力**
- 支持多商家协作
- 管理员拥有最终审批权

✅ **安全的沙盒环境**
- 商家只能在授权区域内操作
- 前后端双重防线保障安全

✅ **可扩展的架构**
- 支持未来引入更复杂的权限模型
- 支持区域租赁、转让等业务场景

---

