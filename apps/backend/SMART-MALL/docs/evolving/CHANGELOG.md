# 变更日志（CHANGELOG.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端变更日志
> 
> 本文档为 **变更日志（Changelog）**，用于记录版本变更历史，遵循 Keep a Changelog 格式规范。
> 
> 最后更新：2026-01-07

---

## [Unreleased] - 2026-01-07

### Added
- 商品管理功能
  - 商家端 API
    - 创建商品：`POST /api/product`
    - 获取商品详情：`GET /api/product/{productId}`
    - 更新商品：`PUT /api/product/{productId}`
    - 删除商品：`DELETE /api/product/{productId}`
    - 获取店铺商品列表：`GET /api/product/store/{storeId}`
    - 更新商品状态：`POST /api/product/{productId}/status`
    - 更新库存：`POST /api/product/{productId}/stock`
  - 公开端 API
    - 获取店铺公开商品：`GET /api/public/store/{storeId}/products`
    - 获取商品公开详情：`GET /api/public/product/{productId}`
  - 新增数据库表：`product`
  - 新增实体类：`Product`
  - 新增枚举：`ProductStatus`（ON_SALE/OFF_SALE/SOLD_OUT）
  - 新增 Mapper：`ProductMapper`
  - 新增 DTO：`CreateProductRequest`、`UpdateProductRequest`、`ProductDTO`、`ProductQueryRequest`、`UpdateStatusRequest`、`UpdateStockRequest`
  - 新增服务：`ProductService`
  - 新增控制器：`ProductController`、`PublicProductController`
  - 新增错误码：`PRODUCT_NOT_FOUND`、`PRODUCT_NOT_OWNER`、`PRODUCT_NAME_INVALID`、`PRODUCT_PRICE_INVALID`、`PRODUCT_STOCK_INVALID`、`PRODUCT_INVALID_STATUS_TRANSITION`、`STORE_NOT_ACTIVE`
  - 业务规则：
    - 商品创建需要店铺状态为 ACTIVE
    - 库存为 0 时自动设置状态为 SOLD_OUT
    - 库存从 0 增加时，如果状态是 SOLD_OUT，自动恢复为 ON_SALE
    - 公开查询只返回 ON_SALE 和 SOLD_OUT 状态的商品
    - 公开查询非 ACTIVE 店铺返回空结果

- 店铺管理功能
  - 商家端 API
    - 创建店铺：`POST /api/store`（需要有该区域的 ACTIVE 权限）
    - 获取我的店铺：`GET /api/store/my`
    - 获取店铺详情：`GET /api/store/{storeId}`
    - 更新店铺信息：`PUT /api/store/{storeId}`
    - 激活店铺：`POST /api/store/{storeId}/activate`
    - 暂停营业：`POST /api/store/{storeId}/deactivate`
  - 管理员端 API
    - 获取所有店铺：`GET /api/admin/store`（支持分页、状态筛选、分类筛选）
    - 审批店铺：`POST /api/admin/store/{storeId}/approve`
    - 关闭店铺：`POST /api/admin/store/{storeId}/close`
  - 新增数据库表：`store`
  - 新增实体类：`Store`
  - 新增枚举：`StoreStatus`（PENDING/ACTIVE/INACTIVE/CLOSED）
  - 新增 Mapper：`StoreMapper`
  - 新增 DTO：`CreateStoreRequest`、`UpdateStoreRequest`、`StoreDTO`、`StoreQueryRequest`、`CloseStoreRequest`
  - 新增服务：`StoreService`
  - 新增控制器：`StoreController`、`AdminStoreController`
  - 新增错误码：`STORE_AREA_NO_PERMISSION`、`STORE_AREA_ALREADY_HAS_STORE`、`STORE_NOT_FOUND`、`STORE_NOT_OWNER`、`STORE_INVALID_STATUS_TRANSITION`、`STORE_NAME_REQUIRED`、`STORE_CATEGORY_REQUIRED`

- 区域权限管理功能
  - 商家端 API
    - 获取可申请区域：`GET /api/area/available`
    - 提交区域申请：`POST /api/area/apply`
    - 查询我的申请：`GET /api/area/apply/my`
    - 查询我的权限：`GET /api/area/permission/my`
  - 管理员端 API
    - 获取待审批列表：`GET /api/admin/area/apply/pending`
    - 审批通过：`POST /api/admin/area/apply/{applyId}/approve`
    - 审批驳回：`POST /api/admin/area/apply/{applyId}/reject`
    - 撤销权限：`POST /api/admin/area/permission/{permissionId}/revoke`
  - 新增数据库表：`area_apply`、`area_permission`
  - 新增实体类：`AreaApply`、`AreaPermission`
  - 新增枚举：`ApplyStatus`、`PermissionStatus`、`AreaStatus`
  - 新增 Mapper：`AreaApplyMapper`、`AreaPermissionMapper`
  - 新增 DTO：`AreaApplyRequest`、`AreaApplyDTO`、`AreaPermissionDTO`、`AvailableAreaDTO`、`RejectRequest`、`RevokeRequest`
  - 新增服务：`AreaApplyService`、`AreaPermissionService`
  - 新增控制器：`AreaApplyController`、`AreaPermissionController`
  - 新增权限校验：`PermissionChecker` 接口及 `PermissionCheckerImpl` 实现

### Integration
- 前端店铺管理 UI 对接完成
  - 前端 API 模块：`store.api.ts`
  - 商家视图：`StoreConfigView.vue`
  - 管理员视图：`AdminStoreManageView.vue`

- 前端商品管理 UI 对接完成
  - 前端 API 模块：`product.api.ts`
  - 商家视图：`ProductManageView.vue`

- 前端区域权限 UI 对接完成
  - 前端 API 模块：`area-permission.api.ts`
  - 商家视图：`AreaApplyView.vue`、`AreaPermissionView.vue`
  - 管理员视图：`AreaApprovalView.vue`、`AreaPermissionManageView.vue`

- 商城建模器持久化 API
  - 创建项目：`POST /api/mall-builder/projects`
  - 获取项目列表：`GET /api/mall-builder/projects`
  - 获取项目详情：`GET /api/mall-builder/projects/{id}`
  - 更新项目：`PUT /api/mall-builder/projects/{id}`
  - 删除项目：`DELETE /api/mall-builder/projects/{id}`
- 新增数据库表：`mall_project`、`floor`、`area`
- 新增实体类：`MallProject`、`Floor`、`Area`
- 新增 Mapper：`MallProjectMapper`、`FloorMapper`、`AreaMapper`
- 新增 DTO：`CreateProjectRequest`、`UpdateProjectRequest`、`ProjectResponse`、`ProjectListItem`、`FloorDTO`、`AreaDTO`、`OutlineDTO`、`SettingsDTO`
- 新增服务：`MallBuilderService`
- 新增控制器：`MallBuilderController`

- 用户注册功能
  - 用户注册：创建新用户账号 (`POST /auth/register`)
  - 检查用户名可用性 (`GET /auth/check-username`)
  - 检查邮箱可用性 (`GET /auth/check-email`)
- 新增 `RegisterService` 服务类，处理用户注册逻辑
- 新增 `RegisterRequest` 和 `RegisterResponse` DTO
- 注册验证规则：
  - 用户名：3-20 字符，只能包含字母、数字和下划线
  - 密码：至少 6 位
  - 邮箱：必填，格式验证
  - 手机号：可选，格式验证（中国大陆手机号）
- 密码管理功能
  - 忘记密码：发送密码重置链接到邮箱 (`POST /auth/forgot-password`)
  - 验证重置令牌：检查令牌有效性 (`POST /auth/verify-reset-token`)
  - 重置密码：使用令牌设置新密码 (`POST /auth/reset-password`)
  - 修改密码：已登录用户修改密码 (`POST /auth/change-password`)
- 新增 `PasswordService` 服务类，处理密码重置和修改逻辑
- 新增 `EmailService` 接口和 `ConsoleEmailService` 实现（开发阶段输出到控制台）
- 新增密码相关错误码：`PASSWORD_RESET_TOKEN_INVALID`、`PASSWORD_OLD_INCORRECT`、`PASSWORD_SAME_AS_OLD`、`PASSWORD_TOO_SHORT`、`PASSWORD_RESET_RATE_LIMITED`
- 新增 `UserRepository.findByEmail()` 和 `updatePassword()` 方法

### Security
- 新注册用户默认角色为 USER，状态为 ACTIVE
- 密码重置令牌存储在 Redis 中，有效期 30 分钟
- 同一邮箱 5 分钟内只能请求一次重置链接（防止滥用）
- 无论邮箱是否存在都返回成功响应（防止邮箱枚举攻击）
- 密码使用 BCrypt 加密存储

---
