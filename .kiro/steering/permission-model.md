---
inclusion: always
---

# 权限模型约束

## RCAC 权限模型

RCAC = Role + Capability + Context

### 权限判定三要素

1. **Role（角色）** - 当前用户身份
   - ADMIN - 管理员
   - MERCHANT - 商家
   - USER - 普通用户

2. **Capability（能力）** - 允许执行的行为类型
   - VIEW_MALL - 查看商城
   - EDIT_MALL_STRUCTURE - 编辑商城结构
   - EDIT_OWN_STORE - 编辑自己的店铺
   - EDIT_AUTHORIZED_AREA - 编辑授权区域
   - APPROVE_MODELING_PERMISSION - 审批建模权限

3. **Context（上下文）** - 当前所在空间、运行模式
   - mode: RUNTIME / CONFIG
   - currentFloor: 当前楼层
   - currentStore: 当前店铺
   - temporalState: READY / LOADING / TRANSITION

### 权限判定流程

```
1. 校验 Role
   └─ 角色不匹配 → 拒绝

2. 校验 Capability
   └─ 能力不足 → 拒绝

3. 校验 Context
   └─ 上下文不匹配 → 拒绝

4. 通过所有检查 → 允许
```

## 区域权限管理

### 区域状态

| 状态 | 含义 | 可执行操作 |
|------|------|-----------|
| LOCKED | 初始状态，不可编辑 | 商家可申请 |
| PENDING | 申请中，等待审批 | 管理员可审批 |
| AUTHORIZED | 已授权给特定商家 | 商家可建模 |
| OCCUPIED | 已占用，不可申请 | 无 |

### 区域权限约束

**商家约束**：
- ✅ 只能编辑已授权的区域
- ✅ 只能在授权区域边界内操作
- ❌ 不能编辑其他商家的区域
- ❌ 不能修改区域边界

**管理员约束**：
- ✅ 可以审批区域申请
- ✅ 可以撤销区域权限
- ✅ 可以修改区域边界

### 权限申请流程

```
LOCKED
  →（商家申请）
PENDING
  →（管理员审批通过）
AUTHORIZED
  →（权限撤销/过期）
LOCKED
```

## 角色权限矩阵

| 操作 | ADMIN | MERCHANT | USER |
|------|-------|----------|------|
| 查看商城 | ✅ | ✅ | ✅ |
| 导航 | ✅ | ✅ | ✅ |
| 编辑商城结构 | ✅ | ❌ | ❌ |
| 申请区域权限 | ❌ | ✅ | ❌ |
| 审批区域申请 | ✅ | ❌ | ❌ |
| 编辑授权区域 | ❌ | ✅ | ❌ |
| 编辑自己店铺 | ❌ | ✅ | ❌ |
| 撤销权限 | ✅ | ❌ | ❌ |
| 发布版本 | ✅ | ❌ | ❌ |

## AI Agent 权限约束

### 核心原则

> **AI 只能"建议"，不能"决定"**

### 权限规则

1. **平权原则** - AI 生成的 Action 与 UI 触发的 Action 权限规则完全一致
2. **不可越权** - AI 不具备任何超出当前用户角色的权限
3. **必须确认** - 所有写操作必须经过用户确认
4. **不可绕过** - AI 不能绕过 Orchestrator 或权限校验

### 约束机制

```typescript
// ✅ 正确：AI 生成 Action，经过权限校验
const action = await aiAgent.generateAction(userInput)
const result = await orchestrator.execute(action)  // 会进行权限校验

// ❌ 错误：AI 直接操作
await aiAgent.executeDirectly(userInput)  // 绕过权限校验
```

## 配置态与运行态

### 模式定义

- **CONFIG（配置态）** - 编辑模式，管理员/商家使用
- **RUNTIME（运行态）** - 浏览模式，所有角色可用

### 模式约束

| 操作类型 | CONFIG | RUNTIME |
|---------|--------|---------|
| 查看商城 | ✅ | ✅ |
| 导航 | ✅ | ✅ |
| 编辑操作 | ✅ | ❌ |
| 添加对象 | ✅ | ❌ |
| 删除对象 | ✅ | ❌ |

### 角色与模式

| 角色 | 可进入 CONFIG | 可进入 RUNTIME |
|------|--------------|---------------|
| ADMIN | ✅ | ✅ |
| MERCHANT | ✅ | ✅ |
| USER | ❌ | ✅ |

## 代码示例

### ✅ 正确示例

```typescript
// 前端：权限校验
async function executeAction(action: Action) {
  // 1. 校验权限
  const permission = await orchestrator.checkPermission(action)
  if (!permission.allowed) {
    showError(permission.reason)
    return
  }
  
  // 2. 执行 Action
  await orchestrator.execute(action)
}
```

```java
// 后端：权限校验
@PostMapping("/area/{areaId}/edit")
public ApiResponse<Area> editArea(
    @PathVariable String areaId,
    @RequestBody AreaEditRequest request
) {
    // 1. 校验权限
    PermissionResult permission = permissionChecker.checkAreaPermission(
        getCurrentUser(),
        areaId,
        Permission.AREA_EDIT
    );
    
    if (!permission.isAllowed()) {
        throw new PermissionDeniedException(permission.getReason());
    }
    
    // 2. 执行业务逻辑
    return ApiResponse.success(areaService.editArea(areaId, request));
}
```

### ❌ 错误示例

```typescript
// ❌ 未进行权限校验
async function editStore(storeId: string, data: any) {
  await api.put(`/store/${storeId}`, data)  // 直接调用 API
}

// ❌ 在前端判断权限（不安全）
if (user.role === 'MERCHANT') {
  await editStore(storeId, data)  // 后端仍需校验
}
```

```java
// ❌ Controller 层判断权限（应在 Service 层）
@PostMapping("/store/{storeId}")
public ApiResponse<Store> updateStore(
    @PathVariable String storeId,
    @RequestBody Store store
) {
    if (!getCurrentUser().getRole().equals("MERCHANT")) {
        throw new PermissionDeniedException();
    }
    return ApiResponse.success(storeService.update(store));
}
```

## 验证清单

开发时自查：
- [ ] 是否进行了 RCAC 三要素校验？
- [ ] 商家是否只能编辑授权区域？
- [ ] 普通用户是否无法进入配置态？
- [ ] AI 生成的 Action 是否经过权限校验？
- [ ] 写操作是否需要用户确认？
- [ ] 是否在后端进行了权限校验？（不能只在前端）
