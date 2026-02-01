---
inclusion: always
---

# 架构分层约束

## 前端分层架构

### 分层结构

```
UI 层（Vue Components）
↓
业务协调层（Orchestrator）
↓
领域场景层（Domain Scene）
↓
渲染引擎层（Three Core）
```

### 各层职责与约束

#### UI 层
**职责**：
- 承载用户交互
- 接收用户输入
- 展示系统状态

**约束**：
- ❌ 禁止直接调用 Three.js API
- ❌ 禁止解析 AI 返回结果结构
- ✅ 只通过 Orchestrator 触发行为

#### 业务协调层（Orchestrator）
**职责**：
- 接收所有 Action（UI / AI）
- 校验权限、上下文、系统状态
- 分发合法 Action 到领域层
- 记录行为日志

**约束**：
- ✅ 所有 Action 必须经过此层
- ❌ 不关心行为具体如何执行
- ❌ 不关心不同角色的细节差异

#### 领域场景层（Domain Scene）
**职责**：
- 管理商城语义结构
- 提供语义级别的行为接口
- 保证语义正确性

**约束**：
- ❌ 不关心用户是谁
- ❌ 不关心 AI 来源
- ✅ 只保证语义正确性

#### 渲染引擎层（Three Core）
**职责**：
- Scene / Camera / Renderer 初始化
- 渲染循环控制
- 资源加载与释放

**约束**：
- ❌ 不认识"商城""店铺""用户"等业务概念
- ✅ 可以在理论上被替换为其他渲染引擎

## 后端分层架构

### 分层结构

```
接口层（Interface / Controller）
↓
应用层（Application Service）
↓
领域层（Domain）
↓
基础设施层（Infrastructure）
```

### 各层职责与约束

#### 接口层
**职责**：
- 接收 HTTP 请求
- 参数校验
- DTO 转换
- 响应封装

**约束**：
- ❌ 不允许直接操作数据库
- ❌ 不包含业务逻辑
- ✅ 只通过应用层服务完成操作

#### 应用层
**职责**：
- 用例流程编排
- 事务边界管理
- 调用领域服务

**约束**：
- ❌ 不包含核心业务规则
- ❌ 不直接操作数据库
- ✅ 业务规则由领域层承担

#### 领域层
**职责**：
- 领域模型（聚合根、实体、值对象）
- 领域服务
- 定义 Repository 接口

**约束**：
- ❌ 不依赖任何框架
- ❌ 不关心持久化细节
- ✅ 保持领域模型的纯粹性

#### 基础设施层
**职责**：
- MyBatis-Plus 映射
- Redis 操作
- 外部接口集成
- Repository 实现

**约束**：
- ✅ 技术细节全部沉到底层
- ✅ 通过依赖倒置与领域层解耦

## AI 服务架构

### 模块结构

```
API 层（FastAPI Routes）
↓
Agent 层（Mall Agent）
↓
LLM 抽象层（LLM Base）
↓
具体实现（Qwen / OpenAI / DeepSeek）
```

### 约束

- ❌ AI 服务不直接访问业务数据库
- ❌ AI 服务不负责权限校验
- ✅ AI 只生成 Action，由前端/后端执行
- ✅ AI 失败不导致业务系统失败

## 跨层调用规则

### ✅ 允许的调用
- 上层依赖下层
- 同层之间通过接口调用

### ❌ 禁止的调用
- 下层依赖上层
- 跨层调用（如 UI 直接调用 Three Core）
- 绕过中间层（如 UI 绕过 Orchestrator）

## 代码示例

### ✅ 正确示例

```typescript
// UI 层通过 Orchestrator 触发 Action
const orchestrator = useOrchestrator()
orchestrator.execute({
  type: ActionType.NAVIGATE_TO_STORE,
  payload: { storeId: 'store-001' },
  source: ActionSource.UI
})
```

```java
// Controller 层调用 Application Service
@PostMapping("/area/apply")
public ApiResponse<AreaApply> applyArea(@RequestBody ApplyRequest request) {
    return ApiResponse.success(
        areaApplicationService.applyArea(request)
    );
}
```

### ❌ 错误示例

```typescript
// ❌ UI 层直接调用 Three.js
scene.camera.position.set(x, y, z)

// ❌ UI 层直接修改 Domain 状态
domainStore.currentFloor = 'floor-2'
```

```java
// ❌ Controller 层直接操作数据库
@PostMapping("/store")
public ApiResponse<Store> createStore(@RequestBody Store store) {
    storeMapper.insert(store);  // ❌ 应该调用 Service
    return ApiResponse.success(store);
}
```

## 验证清单

开发时自查：
- [ ] 是否遵循分层架构？
- [ ] 是否存在跨层调用？
- [ ] 是否通过 Orchestrator 执行 Action？
- [ ] Controller 是否包含业务逻辑？
- [ ] Domain 层是否依赖框架？
