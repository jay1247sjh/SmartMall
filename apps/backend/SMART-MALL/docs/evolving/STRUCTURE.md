# 后端目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端目录结构规范
> 
> 本文档为 **目录结构说明文档（Structure Document）**，用于定义代码组织规范与模块职责。

---

## 当前目录结构

```
smart-mall-backend/
├── src/main/java/com/smartmall/
│   ├── SmartMallApplication.java          # 应用入口
│   │
│   ├── application/                        # 应用层
│   │   └── service/
│   │       ├── AuthService.java           # 认证服务
│   │       ├── RegisterService.java       # 注册服务
│   │       ├── PasswordService.java       # 密码服务
│   │       ├── MallBuilderService.java    # 商城建模器服务
│   │       ├── AreaApplyService.java      # 区域权限申请服务
│   │       ├── AreaPermissionService.java # 区域权限管理服务
│   │       ├── StoreService.java          # 店铺管理服务 [NEW]
│   │       └── ProductService.java        # 商品管理服务 [NEW]
│   │
│   ├── domain/                             # 领域层
│   │   ├── entity/
│   │   │   ├── User.java                  # 用户实体
│   │   │   ├── MallProject.java           # 商城项目实体
│   │   │   ├── Floor.java                 # 楼层实体
│   │   │   ├── Area.java                  # 区域实体
│   │   │   ├── AreaApply.java             # 区域权限申请实体
│   │   │   ├── AreaPermission.java        # 区域权限实体
│   │   │   ├── Store.java                 # 店铺实体 [NEW]
│   │   │   └── Product.java               # 商品实体 [NEW]
│   │   ├── enums/
│   │   │   ├── ApplyStatus.java           # 申请状态枚举
│   │   │   ├── AreaStatus.java            # 区域状态枚举
│   │   │   ├── PermissionStatus.java      # 权限状态枚举
│   │   │   ├── StoreStatus.java           # 店铺状态枚举 [NEW]
│   │   │   ├── ProductStatus.java         # 商品状态枚举 [NEW]
│   │   │   └── ...
│   │   └── service/
│   │       └── PermissionChecker.java     # 权限校验接口
│   │
│   ├── infrastructure/                     # 基础设施层
│   │   ├── config/
│   │   │   ├── SecurityConfig.java        # 安全配置
│   │   │   ├── JwtConfig.java             # JWT 配置
│   │   │   └── CorsConfig.java            # 跨域配置
│   │   ├── mapper/
│   │   │   ├── UserMapper.java            # 用户 Mapper
│   │   │   ├── MallProjectMapper.java     # 项目 Mapper
│   │   │   ├── FloorMapper.java           # 楼层 Mapper
│   │   │   ├── AreaMapper.java            # 区域 Mapper
│   │   │   ├── AreaApplyMapper.java       # 区域申请 Mapper
│   │   │   ├── AreaPermissionMapper.java  # 区域权限 Mapper
│   │   │   ├── StoreMapper.java           # 店铺 Mapper [NEW]
│   │   │   └── ProductMapper.java         # 商品 Mapper [NEW]
│   │   └── service/
│   │       ├── ConsoleEmailService.java   # 邮件服务（控制台实现）
│   │       └── PermissionCheckerImpl.java # 权限校验实现
│   │
│   ├── interfaces/                         # 接口层
│   │   ├── controller/
│   │   │   ├── AuthController.java        # 认证控制器
│   │   │   ├── MallBuilderController.java # 建模器控制器
│   │   │   ├── AreaApplyController.java   # 区域申请控制器
│   │   │   ├── AreaPermissionController.java # 区域权限控制器
│   │   │   ├── StoreController.java       # 店铺控制器（商家端）[NEW]
│   │   │   ├── AdminStoreController.java  # 店铺控制器（管理员端）[NEW]
│   │   │   ├── ProductController.java     # 商品控制器（商家端）[NEW]
│   │   │   └── PublicProductController.java # 商品控制器（公开端）[NEW]
│   │   └── dto/
│   │       ├── auth/                      # 认证相关 DTO
│   │       │   ├── LoginRequest.java
│   │       │   ├── LoginResponse.java
│   │       │   ├── RegisterRequest.java
│   │       │   └── ...
│   │       ├── mallbuilder/               # 建模器相关 DTO
│   │       │   ├── CreateProjectRequest.java
│   │       │   ├── UpdateProjectRequest.java
│   │       │   ├── ProjectResponse.java
│   │       │   ├── ProjectListItem.java
│   │       │   ├── FloorDTO.java
│   │       │   ├── AreaDTO.java
│   │       │   ├── OutlineDTO.java
│   │       │   └── SettingsDTO.java
│   │       ├── permission/                # 区域权限相关 DTO
│   │       │   ├── AreaApplyRequest.java
│   │       │   ├── AreaApplyDTO.java
│   │       │   ├── AreaPermissionDTO.java
│   │       │   ├── AvailableAreaDTO.java
│   │       │   ├── RejectRequest.java
│   │       │   └── RevokeRequest.java
│   │       └── store/                     # 店铺相关 DTO [NEW]
│   │           ├── CreateStoreRequest.java
│   │           ├── UpdateStoreRequest.java
│   │           ├── StoreDTO.java
│   │           ├── StoreQueryRequest.java
│   │           └── CloseStoreRequest.java
│       └── product/                   # 商品相关 DTO [NEW]
│   │           ├── CreateProductRequest.java
│   │           ├── UpdateProductRequest.java
│   │           ├── ProductDTO.java
│   │           ├── ProductQueryRequest.java
│   │           ├── UpdateStatusRequest.java
│   │           └── UpdateStockRequest.java
│   │
│   └── common/                             # 通用组件
│       ├── response/
│       │   ├── ApiResponse.java           # 统一响应
│       │   └── ResultCode.java            # 错误码
│       ├── exception/
│       │   ├── BusinessException.java     # 业务异常
│       │   └── GlobalExceptionHandler.java # 全局异常处理
│       └── util/
│           └── IdGenerator.java           # ID 生成器
│
└── src/main/resources/
    ├── application.yml                     # 应用配置
    └── mapper/                             # MyBatis XML 映射
```

---

## 模块结构（目标架构）

```
smart-mall-backend/
├── mall-interface/           # 接口层
│   └── src/main/java/
│       └── com/smartmall/
│           ├── controller/   # REST 控制器
│           ├── dto/          # 数据传输对象
│           └── validator/    # 参数校验
│
├── mall-application/         # 应用层
│   └── src/main/java/
│       └── com/smartmall/
│           └── service/      # 应用服务
│
├── mall-domain/              # 领域层
│   └── src/main/java/
│       └── com/smartmall/
│           ├── entity/       # 实体
│           ├── valueobject/  # 值对象
│           ├── service/      # 领域服务
│           └── repository/   # Repository 接口
│
├── mall-infrastructure/      # 基础设施层
│   └── src/main/java/
│       └── com/smartmall/
│           ├── mapper/       # MyBatis Mapper
│           ├── repository/   # Repository 实现
│           └── config/       # 配置类
│
└── mall-protocol/            # 协议定义
    └── src/main/java/
        └── com/smartmall/
            ├── response/     # 统一响应
            └── errorcode/    # 错误码
```

---

## 依赖关系

```
interface → application → domain ← infrastructure
                ↓
            protocol
```

- 接口层依赖应用层
- 应用层依赖领域层
- 基础设施层实现领域层定义的接口
- 协议层被所有层共享

---

## 前端集成说明

### 区域权限 API 对接

前端已完成与后端区域权限 API 的对接，相关文件：

**前端 API 模块**
- `apps/frontend/SMART-MALL/src/api/area-permission.api.ts` - 区域权限 API 封装

**对接的后端接口**

| 前端方法 | HTTP 方法 | 后端路径 | 控制器 |
|---------|----------|---------|--------|
| `getAvailableAreas()` | GET | `/api/area/available` | AreaApplyController |
| `submitApplication()` | POST | `/api/area/apply` | AreaApplyController |
| `getMyApplications()` | GET | `/api/area/apply/my` | AreaApplyController |
| `getMyPermissions()` | GET | `/api/area/permission/my` | AreaPermissionController |
| `getPendingApplications()` | GET | `/api/admin/area/apply/pending` | AreaApplyController |
| `approveApplication()` | POST | `/api/admin/area/apply/{applyId}/approve` | AreaApplyController |
| `rejectApplication()` | POST | `/api/admin/area/apply/{applyId}/reject` | AreaApplyController |
| `revokePermission()` | POST | `/api/admin/area/permission/{permissionId}/revoke` | AreaPermissionController |

**前端视图**
- `AreaApplyView.vue` - 商家区域申请页面
- `AreaPermissionView.vue` - 商家权限查看页面
- `AreaApprovalView.vue` - 管理员审批页面
- `AreaPermissionManageView.vue` - 管理员权限管理页面

### 店铺管理 API 对接

前端已完成与后端店铺管理 API 的对接，相关文件：

**前端 API 模块**
- `apps/frontend/SMART-MALL/src/api/store.api.ts` - 店铺管理 API 封装

**对接的后端接口**

| 前端方法 | HTTP 方法 | 后端路径 | 控制器 |
|---------|----------|---------|--------|
| `createStore()` | POST | `/api/store` | StoreController |
| `getMyStores()` | GET | `/api/store/my` | StoreController |
| `getStoreById()` | GET | `/api/store/{storeId}` | StoreController |
| `updateStore()` | PUT | `/api/store/{storeId}` | StoreController |
| `activateStore()` | POST | `/api/store/{storeId}/activate` | StoreController |
| `deactivateStore()` | POST | `/api/store/{storeId}/deactivate` | StoreController |
| `getAllStores()` | GET | `/api/admin/store` | AdminStoreController |
| `approveStore()` | POST | `/api/admin/store/{storeId}/approve` | AdminStoreController |
| `closeStore()` | POST | `/api/admin/store/{storeId}/close` | AdminStoreController |

**前端视图**
- `StoreConfigView.vue` - 商家店铺配置页面
- `AdminStoreManageView.vue` - 管理员店铺管理页面

**店铺状态流转**
- `PENDING` - 待审批（新创建的店铺）
- `ACTIVE` - 营业中（审批通过或商家激活）
- `INACTIVE` - 暂停营业（商家主动暂停）
- `CLOSED` - 已关闭（管理员关闭，不可恢复）

### 商品管理 API 对接

前端已完成与后端商品管理 API 的对接，相关文件：

**前端 API 模块**
- `apps/frontend/SMART-MALL/src/api/product.api.ts` - 商品管理 API 封装

**对接的后端接口**

| 前端方法 | HTTP 方法 | 后端路径 | 控制器 |
|---------|----------|---------|--------|
| `createProduct()` | POST | `/api/product` | ProductController |
| `getProduct()` | GET | `/api/product/{productId}` | ProductController |
| `updateProduct()` | PUT | `/api/product/{productId}` | ProductController |
| `deleteProduct()` | DELETE | `/api/product/{productId}` | ProductController |
| `getStoreProducts()` | GET | `/api/product/store/{storeId}` | ProductController |
| `updateProductStatus()` | POST | `/api/product/{productId}/status` | ProductController |
| `updateProductStock()` | POST | `/api/product/{productId}/stock` | ProductController |
| `getPublicStoreProducts()` | GET | `/api/public/store/{storeId}/products` | PublicProductController |
| `getPublicProduct()` | GET | `/api/public/product/{productId}` | PublicProductController |

**前端视图**
- `ProductManageView.vue` - 商家商品管理页面

**商品状态流转**
- `ON_SALE` - 在售（商家上架，库存 > 0）
- `OFF_SALE` - 下架（商家主动下架）
- `SOLD_OUT` - 售罄（库存 = 0 时自动设置）

**业务规则**
- 商品创建需要店铺状态为 ACTIVE
- 库存为 0 时自动设置状态为 SOLD_OUT
- 库存从 0 增加时，如果状态是 SOLD_OUT，自动恢复为 ON_SALE
- 公开查询只返回 ON_SALE 和 SOLD_OUT 状态的商品
- 公开查询非 ACTIVE 店铺返回空结果
