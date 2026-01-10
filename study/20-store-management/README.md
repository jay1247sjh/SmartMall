# 店铺管理学习指南

## 学习目标

通过本章学习，你将掌握：
- 店铺管理的完整业务流程
- 前后端店铺 API 对接
- 店铺状态机设计
- 权限校验与业务规则

---

## 苏格拉底式问答

### 问题 1：店铺有哪些状态？状态之间如何转换？

**思考**：一个店铺从创建到关闭，会经历哪些状态？

<details>
<summary>点击查看答案</summary>

店铺状态枚举（`StoreStatus`）：

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| PENDING | 待审批 | ACTIVE, CLOSED |
| ACTIVE | 营业中 | INACTIVE, CLOSED |
| INACTIVE | 暂停营业 | ACTIVE, CLOSED |
| CLOSED | 已关闭 | 无（终态） |

状态转换规则：
```
创建 → PENDING → 审批通过 → ACTIVE ↔ INACTIVE
                    ↓              ↓
                  CLOSED ←────────┘
```

关键点：
- 新创建的店铺默认是 `PENDING` 状态
- 只有管理员可以审批（PENDING → ACTIVE）
- 商家可以激活/暂停自己的店铺（ACTIVE ↔ INACTIVE）
- 管理员可以关闭任何非 CLOSED 状态的店铺
- CLOSED 是终态，不可恢复

</details>

### 问题 2：创建店铺需要什么前置条件？

**思考**：商家能随意在任何区域开店吗？

<details>
<summary>点击查看答案</summary>

创建店铺的前置条件：

1. **区域权限**：商家必须拥有该区域的 `ACTIVE` 权限
2. **区域唯一性**：每个区域只能有一个店铺
3. **必填字段**：店铺名称、分类

```java
// StoreService.java
public StoreDTO createStore(Long userId, CreateStoreRequest request) {
    // 1. 检查区域权限
    boolean hasPermission = permissionChecker.hasAreaPermission(
        userId, request.getAreaId());
    if (!hasPermission) {
        throw new BusinessException(ResultCode.STORE_AREA_NO_PERMISSION);
    }
    
    // 2. 检查区域是否已有店铺
    Store existingStore = storeMapper.selectOne(
        new LambdaQueryWrapper<Store>()
            .eq(Store::getAreaId, request.getAreaId())
            .ne(Store::getStatus, StoreStatus.CLOSED));
    if (existingStore != null) {
        throw new BusinessException(ResultCode.STORE_AREA_ALREADY_HAS_STORE);
    }
    
    // 3. 创建店铺
    Store store = new Store();
    store.setOwnerId(userId);
    store.setAreaId(request.getAreaId());
    store.setName(request.getName());
    store.setCategory(request.getCategory());
    store.setStatus(StoreStatus.PENDING);
    // ...
}
```

</details>

### 问题 3：前端如何处理店铺状态的显示和操作？

**思考**：不同状态的店铺应该显示什么标签？可以执行什么操作？

<details>
<summary>点击查看答案</summary>

前端状态处理（`StoreConfigView.vue`）：

```typescript
// 状态标签映射
const statusMap = {
  PENDING: { label: '待审批', type: 'warning' },
  ACTIVE: { label: '营业中', type: 'success' },
  INACTIVE: { label: '暂停营业', type: 'info' },
  CLOSED: { label: '已关闭', type: 'danger' }
}

// 可执行操作
const getActions = (store: Store) => {
  switch (store.status) {
    case 'PENDING':
      return [] // 等待审批，无操作
    case 'ACTIVE':
      return ['deactivate', 'edit'] // 可暂停、编辑
    case 'INACTIVE':
      return ['activate', 'edit'] // 可激活、编辑
    case 'CLOSED':
      return [] // 已关闭，无操作
  }
}
```

管理员视图（`AdminStoreManageView.vue`）：

```typescript
// 管理员可执行操作
const getAdminActions = (store: Store) => {
  switch (store.status) {
    case 'PENDING':
      return ['approve', 'close'] // 可审批、关闭
    case 'ACTIVE':
    case 'INACTIVE':
      return ['close'] // 可关闭
    case 'CLOSED':
      return [] // 已关闭，无操作
  }
}
```

</details>

---

## 核心代码解析

### 1. 后端实体设计

```java
// domain/entity/Store.java
@Data
@TableName("store")
public class Store {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long ownerId;      // 店主用户ID
    private Long areaId;       // 所在区域ID
    private String name;       // 店铺名称
    private String category;   // 店铺分类
    private String description;// 店铺描述
    private String logo;       // 店铺Logo
    private String contactPhone;// 联系电话
    private String businessHours;// 营业时间
    
    @EnumValue
    private StoreStatus status;// 店铺状态
    
    private String closeReason;// 关闭原因
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 2. 前端 API 封装

```typescript
// api/store.api.ts
import { http } from './http'

// 商家端 API
export const storeApi = {
  // 创建店铺
  createStore: (data: CreateStoreRequest) =>
    http.post<StoreDTO>('/api/store', data),
  
  // 获取我的店铺列表
  getMyStores: () =>
    http.get<StoreDTO[]>('/api/store/my'),
  
  // 激活店铺
  activateStore: (storeId: number) =>
    http.post<void>(`/api/store/${storeId}/activate`),
  
  // 暂停营业
  deactivateStore: (storeId: number) =>
    http.post<void>(`/api/store/${storeId}/deactivate`),
}

// 管理员端 API
export const adminStoreApi = {
  // 获取所有店铺
  getAllStores: (params: StoreQueryRequest) =>
    http.get<PageResult<StoreDTO>>('/api/admin/store', { params }),
  
  // 审批店铺
  approveStore: (storeId: number) =>
    http.post<void>(`/api/admin/store/${storeId}/approve`),
  
  // 关闭店铺
  closeStore: (storeId: number, reason: string) =>
    http.post<void>(`/api/admin/store/${storeId}/close`, { reason }),
}
```

### 3. 权限校验实现

```java
// infrastructure/service/PermissionCheckerImpl.java
@Service
public class PermissionCheckerImpl implements PermissionChecker {
    
    @Autowired
    private AreaPermissionMapper areaPermissionMapper;
    
    @Override
    public boolean hasAreaPermission(Long userId, Long areaId) {
        AreaPermission permission = areaPermissionMapper.selectOne(
            new LambdaQueryWrapper<AreaPermission>()
                .eq(AreaPermission::getUserId, userId)
                .eq(AreaPermission::getAreaId, areaId)
                .eq(AreaPermission::getStatus, PermissionStatus.ACTIVE));
        return permission != null;
    }
}
```

---

## API 接口一览

### 商家端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/store` | 创建店铺 |
| GET | `/api/store/my` | 获取我的店铺 |
| GET | `/api/store/{id}` | 获取店铺详情 |
| PUT | `/api/store/{id}` | 更新店铺信息 |
| POST | `/api/store/{id}/activate` | 激活店铺 |
| POST | `/api/store/{id}/deactivate` | 暂停营业 |

### 管理员接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/store` | 获取所有店铺（分页） |
| POST | `/api/admin/store/{id}/approve` | 审批店铺 |
| POST | `/api/admin/store/{id}/close` | 关闭店铺 |

---

## 实践练习

### 练习 1：追踪创建店铺的完整流程

从前端点击"创建店铺"按钮开始，追踪到数据库插入记录：

```
StoreConfigView.vue: handleCreateStore()
    ↓
store.api.ts: storeApi.createStore()
    ↓
StoreController.createStore()
    ↓
StoreService.createStore()
    ↓
PermissionChecker.hasAreaPermission()
    ↓
StoreMapper.insert()
```

### 练习 2：实现店铺搜索功能

假设要添加按名称搜索店铺的功能，需要修改哪些文件？

<details>
<summary>点击查看答案</summary>

1. **后端**：
   - `StoreQueryRequest.java` - 添加 `name` 字段
   - `StoreMapper.java` - 添加模糊查询条件
   - `StoreService.java` - 处理搜索逻辑

2. **前端**：
   - `AdminStoreManageView.vue` - 添加搜索输入框
   - 调用 API 时传递 `name` 参数

</details>

---

## 关键文件

### 后端文件

| 文件 | 说明 |
|------|------|
| [Store.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/domain/entity/Store.java) | 店铺实体 |
| [StoreStatus.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/domain/enums/StoreStatus.java) | 店铺状态枚举 |
| [StoreService.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/application/service/StoreService.java) | 店铺服务 |
| [StoreController.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/interfaces/controller/StoreController.java) | 商家端控制器 |
| [AdminStoreController.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/interfaces/controller/AdminStoreController.java) | 管理员控制器 |
| [StoreMapper.java](../../apps/backend/SMART-MALL/src/main/java/com/smartmall/infrastructure/mapper/StoreMapper.java) | 数据访问层 |

### 前端文件

| 文件 | 说明 |
|------|------|
| [store.api.ts](../../apps/frontend/SMART-MALL/src/api/store.api.ts) | 店铺 API |
| [StoreConfigView.vue](../../apps/frontend/SMART-MALL/src/views/merchant/StoreConfigView.vue) | 商家店铺配置 |
| [AdminStoreManageView.vue](../../apps/frontend/SMART-MALL/src/views/admin/AdminStoreManageView.vue) | 管理员店铺管理 |

---

## 延伸阅读

- [状态机设计模式](https://refactoring.guru/design-patterns/state)
- [RESTful API 设计最佳实践](https://restfulapi.net/)
- [Vue 3 组合式 API](https://vuejs.org/guide/extras/composition-api-faq.html)
