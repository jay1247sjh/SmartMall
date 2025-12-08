# 智能商城导购系统后端实现任务清单（TASK.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端实现任务清单
> 
> 本文档为 **实现任务清单（Implementation Task List）**，用于指导开发进度与任务追踪。

---

## 任务状态说明

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[*]` 可选任务（测试、文档等）

---

## 阶段概览

| 阶段 | 名称 | 任务数 | 预估时间 | 优先级 | 状态 |
|------|------|--------|----------|--------|------|
| P0 | 项目基础设施 | 8 | 2-3h | 最高 | 未开始 |
| P1 | 领域模型与数据库 | 16 | 5-7h | 最高 | 未开始 |
| P2 | 认证与安全模块 | 14 | 4-5h | 最高 | 未开始 |
| P3 | 商城结构管理 | 12 | 4-5h | 高 | 未开始 |
| P4 | 区域权限管理 | 16 | 5-6h | 高 | 未开始 |
| P5 | 店铺与商品管理 | 10 | 3-4h | 中 | 未开始 |
| P6 | 布局版本管理 | 12 | 3-4h | 中 | 未开始 |
| P7 | 缓存与性能优化 | 8 | 3-4h | 低 | 未开始 |
| P8 | WebSocket 通知 | 10 | 3-4h | 低 | 未开始 |
| P9 | 集成测试与文档 | 6 | 2-3h | 低 | 未开始 |

**总计**: 约 112 个任务，预估 38-48 小时

---

## P0. 项目基础设施

> 目标：搭建项目骨架，配置开发环境，建立模块结构

### 0.1 项目初始化

- [ ] 0.1.1 创建 Maven 多模块项目结构
  ```
  smart-mall-backend/
  ├── mall-interface/      # 接口层
  ├── mall-application/    # 应用层
  ├── mall-domain/         # 领域层
  ├── mall-infrastructure/ # 基础设施层
  └── mall-protocol/       # 协议定义
  ```
  - _Requirements: 架构设计_

- [ ] 0.1.2 配置父 POM 依赖管理
  - Spring Boot 3.x、MyBatis-Plus、PostgreSQL、Redis
  - _Requirements: 技术栈要求_

- [ ] 0.1.3 配置各模块依赖关系
  - interface → application → domain ← infrastructure
  - _Requirements: 分层架构_

### 0.2 基础配置

- [ ] 0.2.1 配置 application.yml
  - 数据源、Redis、日志级别
  - 多环境配置（dev/test/prod）
  - _Requirements: 运行环境_

- [ ] 0.2.2 配置 Logback JSON 日志
  - 结构化日志输出
  - 请求追踪 ID
  - _Requirements: 需求 13_

- [ ] 0.2.3 配置 Spring Boot Actuator
  - 健康检查、指标暴露
  - _Requirements: 监控要求_

### 0.3 通用组件

- [ ] 0.3.1 创建统一响应结构 (mall-protocol)
  - ApiResponse<T>、PageResult<T>
  - _Requirements: 需求 14_

- [ ] 0.3.2 创建错误码体系 (mall-protocol)
  - ErrorCode 枚举、BusinessException
  - _Requirements: 需求 14_

---

## P1. 领域模型与数据库

> 目标：定义领域模型，创建数据库表结构

### 1.1 值对象定义 (mall-domain)

- [ ] 1.1.1 创建强类型 ID
  - MallId、FloorId、AreaId、StoreId、ProductId、UserId、MerchantId
  - _Requirements: 领域模型_

- [ ] 1.1.2 创建空间值对象
  - Vector3D、BoundingBox、Geometry3D
  - _Requirements: 领域模型_

- [ ] 1.1.3 创建枚举类型
  - AreaStatus、UserType、UserStatus、ApplyStatus、LayoutVersionStatus、MerchantStatus、PermissionStatus、GrantType
  - _Requirements: 领域模型_

### 1.2 实体定义 (mall-domain)

- [ ] 1.2.1 创建商城实体
  - Mall、Floor、Area
  - _Requirements: 需求 3_

- [ ] 1.2.2 创建店铺实体
  - Store、Product
  - _Requirements: 需求 7, 8_

- [ ] 1.2.3 创建用户实体
  - User、Merchant、Admin
  - _Requirements: 需求 2_

- [ ] 1.2.4 创建权限实体
  - AreaPermission、AreaApply
  - _Requirements: 需求 4, 5_

- [ ] 1.2.5 创建版本实体
  - LayoutVersion、LayoutChange、LayoutChangeProposal
  - _Requirements: 需求 9, 10_

### 1.3 Repository 接口 (mall-domain)

- [ ] 1.3.1 定义 Repository 接口
  - MallRepository、FloorRepository、AreaRepository
  - StoreRepository、ProductRepository
  - UserRepository、AreaPermissionRepository
  - _Requirements: DDD 架构_

### 1.4 数据库表结构 (mall-infrastructure)

- [ ] 1.4.0 创建数据库通用函数与触发器
  - 创建 update_timestamp() 函数（自动更新 update_time）
  - 创建 increment_version() 函数（乐观锁版本号自增）
  - _Requirements: 需求 15（数据完整性）_

- [ ] 1.4.1 创建商城相关表
  - mall、mall_floor、mall_area、mall_store、mall_product
  - 包含 version 字段（乐观锁）和触发器
  - _Requirements: 需求 3, 7, 8, 15_

- [ ] 1.4.2 创建用户相关表
  - user、merchant、mall_area_permission、area_apply
  - 包含 version 字段（乐观锁）和触发器
  - _Requirements: 需求 2, 4, 15_

- [ ] 1.4.3 创建版本相关表
  - layout_version、layout_change、layout_change_proposal
  - 包含触发器
  - _Requirements: 需求 9, 10_

- [ ] 1.4.4 创建审计日志表
  - audit_log 表，记录关键业务操作
  - _Requirements: 需求 13（日志与审计）_

### 1.5 数据库检查点

- [ ] 1.5.0 Checkpoint - 确保数据库初始化成功
  - 确保所有表创建成功，触发器正常工作
  - 确保所有测试通过，如有问题请询问用户
  - _Requirements: 需求 15_

---

## P2. 认证与安全模块

> 目标：实现用户认证、JWT Token 管理、权限校验

### 2.1 JWT 配置

- [ ] 2.1.1 配置 RSA 密钥对
  - 私钥签发、公钥验证
  - _Requirements: 需求 1_

- [ ] 2.1.2 实现 JwtTokenProvider
  - 生成 accessToken、refreshToken
  - 解析和验证 Token
  - _Requirements: 需求 1_

### 2.2 Spring Security 配置

- [ ] 2.2.1 配置 SecurityFilterChain
  - 公开接口、认证接口、角色接口
  - _Requirements: 需求 1, 2_

- [ ] 2.2.2 实现 JwtAuthenticationFilter
  - 从请求头提取 Token
  - 验证并注入用户上下文
  - _Requirements: 需求 1_

- [ ] 2.2.3 实现 UserDetailsService
  - 从数据库加载用户信息
  - _Requirements: 需求 2_

### 2.3 认证接口

- [ ] 2.3.1 实现登录接口
  - POST /api/auth/login
  - _Requirements: 需求 1_

- [ ] 2.3.2 实现刷新 Token 接口
  - POST /api/auth/refresh
  - _Requirements: 需求 1_

- [ ] 2.3.3 实现获取当前用户接口
  - GET /api/user/me
  - _Requirements: 需求 2_

### 2.4 权限校验

- [ ] 2.4.1 实现 PermissionChecker 领域服务
  - 角色校验、区域权限校验
  - _Requirements: 需求 5_

- [ ] 2.4.2 实现 @RequireAreaPermission 注解
  - AOP 切面校验区域权限
  - _Requirements: 需求 5_

### 2.5 认证模块检查点

- [ ] 2.5.0 Checkpoint - 确保认证模块测试通过
  - 确保所有测试通过，如有问题请询问用户
  - _Requirements: 需求 1, 2_

### 2.6 认证模块测试

- [*] 2.6.1 编写 JWT 单元测试
  - Token 生成、解析、过期验证
  - _Requirements: 需求 1_

- [*] 2.6.2 编写权限校验单元测试
  - 角色权限、区域权限
  - _Requirements: 需求 5_

---

## P3. 商城结构管理

> 目标：实现商城、楼层、区域的 CRUD 操作

### 3.1 应用服务 (mall-application)

- [ ] 3.1.1 实现 MallApplicationService
  - 创建商城、更新商城、查询商城
  - _Requirements: 需求 3_

- [ ] 3.1.2 实现 FloorApplicationService
  - 创建楼层、更新楼层、删除楼层
  - _Requirements: 需求 3_

- [ ] 3.1.3 实现 AreaApplicationService
  - 创建区域、更新区域、删除区域
  - _Requirements: 需求 3_

### 3.2 领域服务 (mall-domain)

- [ ] 3.2.1 实现 MallDomainService
  - 商城状态管理、结构验证
  - _Requirements: 需求 3_

- [ ] 3.2.2 实现区域边界校验
  - 区域重叠检测
  - _Requirements: 需求 3, Property 13_

### 3.3 接口层 (mall-interface)

- [ ] 3.3.1 实现商城查询接口
  - GET /api/mall/list
  - GET /api/mall/{mallId}
  - GET /api/mall/{mallId}/structure
  - _Requirements: 需求 11_

- [ ] 3.3.2 实现管理端接口
  - POST /api/admin/mall
  - POST /api/admin/mall/{mallId}/floor
  - POST /api/admin/area
  - _Requirements: 需求 3_

### 3.4 Repository 实现 (mall-infrastructure)

- [ ] 3.4.1 实现 MyBatis Mapper
  - MallMapper、FloorMapper、AreaMapper
  - _Requirements: 数据访问_

- [ ] 3.4.2 实现 Repository
  - MallRepositoryImpl、FloorRepositoryImpl、AreaRepositoryImpl
  - _Requirements: DDD 架构_

### 3.5 商城模块检查点

- [ ] 3.5.0 Checkpoint - 确保商城模块测试通过
  - 确保所有测试通过，如有问题请询问用户
  - _Requirements: 需求 3, 11_

### 3.6 商城模块测试

- [*] 3.6.1 编写商城服务单元测试
  - 创建、更新、查询
  - _Requirements: 需求 3_

- [*] 3.6.2 编写区域边界校验属性测试
  - **Property: 区域边界不重叠**
  - 对于任意同楼层的两个区域，其边界框不应重叠
  - **验证需求: Requirements 3.3**

---

## P4. 区域权限管理

> 目标：实现区域权限申请、审批、撤销流程

### 4.1 应用服务 (mall-application)

- [ ] 4.1.1 实现 AreaApplyApplicationService
  - 提交申请、查询申请列表
  - _Requirements: 需求 4_

- [ ] 4.1.2 实现 AreaApprovalApplicationService
  - 审批通过、审批驳回
  - _Requirements: 需求 4_

- [ ] 4.1.3 实现 AreaPermissionApplicationService
  - 查询权限、撤销权限
  - _Requirements: 需求 5, 6_

### 4.2 领域服务 (mall-domain)

- [ ] 4.2.1 实现 AreaApplyDomainService
  - 申请状态机、重复申请检测
  - _Requirements: 需求 4, Property 8_

- [ ] 4.2.2 实现 AreaPermissionDomainService
  - 权限授予、权限撤销、权限校验
  - _Requirements: 需求 5, 6_

- [ ] 4.2.3 实现空间边界校验
  - 操作位置是否在授权区域内
  - _Requirements: 需求 5, Property 6_

### 4.3 接口层 (mall-interface)

- [ ] 4.3.1 实现商家申请接口
  - GET /api/area/available
  - POST /api/area/apply
  - _Requirements: 需求 4_

- [ ] 4.3.2 实现管理员审批接口
  - GET /api/area/apply/list
  - POST /api/area/apply/{id}/approve
  - POST /api/area/apply/{id}/reject
  - _Requirements: 需求 4_

- [ ] 4.3.3 实现权限管理接口
  - POST /api/area/permission/{id}/revoke
  - _Requirements: 需求 6_

### 4.4 Repository 实现 (mall-infrastructure)

- [ ] 4.4.1 实现 MyBatis Mapper
  - AreaApplyMapper、AreaPermissionMapper
  - _Requirements: 数据访问_

- [ ] 4.4.2 实现 Repository
  - AreaApplyRepositoryImpl、AreaPermissionRepositoryImpl
  - _Requirements: DDD 架构_

### 4.5 权限模块检查点

- [ ] 4.5.0 Checkpoint - 确保权限模块测试通过
  - 确保所有测试通过，如有问题请询问用户
  - _Requirements: 需求 4, 5, 6_

### 4.6 权限模块测试

- [*] 4.6.1 编写申请状态机属性测试
  - **Property: 申请状态转换合法性**
  - 对于任意申请，状态只能按 PENDING → APPROVED/REJECTED 转换
  - **验证需求: Requirements 4**

- [*] 4.6.2 编写重复申请检测属性测试
  - **Property: 同一区域不可重复申请**
  - 对于任意已有 PENDING 状态申请的区域，新申请应被拒绝
  - **验证需求: Requirements 4.6**

- [*] 4.6.3 编写空间边界校验属性测试
  - **Property: 操作位置在授权区域内**
  - 对于任意商家操作，操作位置必须在其授权区域边界内
  - **验证需求: Requirements 5.3, 5.4**

- [*] 4.6.4 编写权限撤销单元测试
  - 撤销流程、状态更新
  - _Requirements: 需求 6_

---

## P5. 店铺与商品管理

> 目标：实现店铺和商品的 CRUD 操作

### 5.1 应用服务 (mall-application)

- [ ] 5.1.1 实现 StoreApplicationService
  - 创建店铺、更新店铺、查询店铺
  - _Requirements: 需求 7_

- [ ] 5.1.2 实现 ProductApplicationService
  - 添加商品、更新商品、删除商品、查询商品
  - _Requirements: 需求 8_

### 5.2 领域服务 (mall-domain)

- [ ] 5.2.1 实现 StoreDomainService
  - 店铺位置验证、所有权校验
  - _Requirements: 需求 7_

- [ ] 5.2.2 实现 ProductDomainService
  - 商品位置验证、价格库存验证
  - _Requirements: 需求 8_

### 5.3 接口层 (mall-interface)

- [ ] 5.3.1 实现店铺接口
  - GET /api/store/{storeId}
  - PUT /api/store/{storeId}
  - _Requirements: 需求 7, 11_

- [ ] 5.3.2 实现商品接口
  - GET /api/store/{storeId}/products
  - POST /api/store/{storeId}/products
  - PUT /api/product/{productId}
  - DELETE /api/product/{productId}
  - _Requirements: 需求 8, 11_

### 5.4 店铺商品模块测试

- [*] 5.4.1 编写店铺位置校验属性测试
  - **Property: 店铺位置在授权区域内**
  - 对于任意店铺创建/更新，店铺位置必须在商家授权区域内
  - **验证需求: Requirements 7.1**

- [*] 5.4.2 编写商品位置校验属性测试
  - **Property: 商品位置在店铺范围内**
  - 对于任意商品添加/更新，商品位置必须在店铺边界内
  - **验证需求: Requirements 8.1**

- [*] 5.4.3 编写商品数据合法性属性测试
  - **Property: 商品价格和库存非负**
  - 对于任意商品，价格 >= 0 且库存 >= 0
  - **验证需求: Requirements 8.6**

---

## P6. 布局版本管理

> 目标：实现布局版本和变更提案管理

### 6.1 应用服务 (mall-application)

- [ ] 6.1.1 实现 LayoutVersionApplicationService
  - 创建版本、发布版本、查询版本
  - _Requirements: 需求 9_

- [ ] 6.1.2 实现 LayoutProposalApplicationService
  - 提交提案、审核提案
  - _Requirements: 需求 10_

### 6.2 领域服务 (mall-domain)

- [ ] 6.2.1 实现 LayoutVersionDomainService
  - 版本状态管理、单一活跃版本保证
  - _Requirements: 需求 9, Property 3_

- [ ] 6.2.2 实现 LayoutProposalDomainService
  - 提案状态管理、变更合并
  - _Requirements: 需求 10_

### 6.3 接口层 (mall-interface)

- [ ] 6.3.1 实现版本管理接口
  - GET /api/layout/versions
  - GET /api/layout/version/{versionId}
  - POST /api/layout/version/{versionId}/publish
  - _Requirements: 需求 9_

- [ ] 6.3.2 实现提案管理接口
  - POST /api/layout/proposal
  - POST /api/layout/proposal/{id}/review
  - _Requirements: 需求 10_

### 6.4 版本模块检查点

- [ ] 6.4.0 Checkpoint - 确保版本模块测试通过
  - 确保所有测试通过，如有问题请询问用户
  - _Requirements: 需求 9, 10_

### 6.5 版本模块测试

- [*] 6.5.1 编写单一活跃版本属性测试
  - **Property: 同一商城只有一个 ACTIVE 版本**
  - 对于任意商城，在任意时刻最多只有一个 ACTIVE 状态的布局版本
  - **验证需求: Requirements 9.6**

- [*] 6.5.2 编写版本状态转换属性测试
  - **Property: 版本状态转换合法性**
  - 对于任意版本，状态只能按 DRAFT → ACTIVE → ARCHIVED 转换
  - **验证需求: Requirements 9.3, 9.4, 9.5**

- [*] 6.5.3 编写提案管理单元测试
  - 提交、审核、合并
  - _Requirements: 需求 10_

---

## P7. 缓存与性能优化

> 目标：实现 Redis 缓存，优化查询性能

### 7.1 缓存配置

- [ ] 7.1.1 配置 Redis 连接
  - RedisTemplate、缓存管理器
  - _Requirements: 需求 12_

- [ ] 7.1.2 配置缓存 Key 命名规范
  - 商城结构: `mall:structure:{mallId}`
  - 楼层列表: `mall:floors:{mallId}`
  - 区域列表: `floor:areas:{floorId}`
  - 店铺列表: `area:stores:{areaId}`
  - 用户信息: `user:info:{userId}`
  - 用户权限: `user:permissions:{userId}`
  - 区域权限: `area:permission:{areaId}`
  - _Requirements: 需求 12_

- [ ] 7.1.3 配置缓存 TTL 策略
  - 商城结构: 5分钟
  - 用户权限: 1分钟
  - 用户信息: 10分钟
  - _Requirements: 需求 12_

### 7.2 缓存实现

- [ ] 7.2.1 实现商城结构缓存
  - @Cacheable、@CacheEvict
  - 商城/楼层/区域变更时级联失效
  - _Requirements: 需求 12_

- [ ] 7.2.2 实现用户权限缓存
  - 权限信息缓存
  - 权限变更时失效 user:permissions:* 和 area:permission:*
  - _Requirements: 需求 12_

- [ ] 7.2.3 实现缓存穿透防护
  - 对不存在的资源缓存空值（TTL 30秒）
  - _Requirements: 需求 12_

### 7.3 查询优化

- [ ] 7.3.1 优化数据库索引
  - 联合索引、覆盖索引
  - _Requirements: 需求 12_

- [ ] 7.3.2 优化批量查询
  - 避免 N+1、批量加载
  - _Requirements: 需求 12_

---

## P8. WebSocket 通知

> 目标：实现实时通知推送

### 8.1 WebSocket 配置

- [ ] 8.1.1 配置 WebSocket 端点
  - 端点: `ws://{host}/ws/notifications`
  - 连接时 Token 验证
  - _Requirements: 需求 16_

- [ ] 8.1.2 实现连接管理
  - 用户连接映射（userId -> WebSocketSession）
  - 心跳保活（PING/PONG，间隔 30 秒）
  - _Requirements: 需求 16_

- [ ] 8.1.3 实现消息订阅机制
  - 支持按消息类型订阅
  - 支持按商城/区域过滤
  - _Requirements: 需求 16_

### 8.2 通知消息实现

- [ ] 8.2.1 实现布局版本发布通知
  - 消息类型: LAYOUT_VERSION_PUBLISHED
  - 包含: mallId, versionId, affectedAreaIds
  - _Requirements: 需求 16_

- [ ] 8.2.2 实现区域状态变更通知
  - 消息类型: AREA_STATUS_CHANGED
  - 包含: areaId, previousStatus, currentStatus
  - _Requirements: 需求 16_

- [ ] 8.2.3 实现权限变更通知
  - 消息类型: PERMISSION_CHANGED
  - changeType: GRANTED, REVOKED, EXPIRED, FROZEN
  - _Requirements: 需求 16_

- [ ] 8.2.4 实现申请状态变更通知
  - 消息类型: APPLY_STATUS_CHANGED
  - 包含: applyId, previousStatus, currentStatus
  - _Requirements: 需求 16_

### 8.3 WebSocket 测试

- [*] 8.3.1 编写 WebSocket 集成测试
  - 连接、认证、消息推送
  - _Requirements: 需求 16_

- [*] 8.3.2 编写通知触发测试
  - 事件触发、消息内容验证
  - _Requirements: 需求 16_

---

## P9. 集成测试与文档

> 目标：完成集成测试，生成 API 文档

### 9.1 集成测试

- [*] 9.1.1 编写认证流程集成测试
  - 登录、刷新、权限校验
  - _Requirements: 需求 1, 2_

- [*] 9.1.2 编写商城管理集成测试
  - 创建、查询、更新
  - _Requirements: 需求 3, 11_

- [*] 9.1.3 编写权限流程集成测试
  - 申请、审批、撤销
  - _Requirements: 需求 4, 5, 6_

### 9.2 API 文档

- [*] 9.2.1 配置 Swagger/OpenAPI
  - 接口文档自动生成
  - _Requirements: 文档要求_

- [*] 9.2.2 编写接口使用示例
  - 请求/响应示例
  - _Requirements: 文档要求_

### 9.3 部署配置

- [*] 9.3.1 编写 Dockerfile
  - 镜像构建配置
  - _Requirements: 部署要求_

---

## 检查点（Checkpoints）

### Checkpoint 1: 基础设施完成
**触发条件**: P0 + P1 完成
**验证内容**:
- [ ] 项目可以正常编译
- [ ] 数据库表创建成功
- [ ] 领域模型定义完整

### Checkpoint 2: 认证模块完成
**触发条件**: P2 完成
**验证内容**:
- [ ] 登录接口正常工作
- [ ] Token 验证正常
- [ ] 权限校验正常

### Checkpoint 3: 商城管理完成
**触发条件**: P3 完成
**验证内容**:
- [ ] 商城 CRUD 正常
- [ ] 结构查询正常
- [ ] 区域边界校验正常

### Checkpoint 4: 权限管理完成
**触发条件**: P4 完成
**验证内容**:
- [ ] 申请流程正常
- [ ] 审批流程正常
- [ ] 权限校验正常

### Checkpoint 5: 核心功能完成
**触发条件**: P5 + P6 完成
**验证内容**:
- [ ] 店铺商品管理正常
- [ ] 版本管理正常
- [ ] 所有核心接口可用

### Checkpoint 6: 系统完成
**触发条件**: P7 + P8 + P9 完成
**验证内容**:
- [ ] 缓存正常工作
- [ ] WebSocket 通知正常
- [ ] 集成测试通过

---

## 附录：任务依赖关系

```
P0 (基础设施)
 └─→ P1 (领域模型)
      └─→ P2 (认证安全)
           └─→ P3 (商城管理)
                └─→ P4 (权限管理)
                     └─→ P5 (店铺商品)
                          └─→ P6 (版本管理)
                               └─→ P7 (缓存优化)
                                    └─→ P8 (WebSocket)
                                         └─→ P9 (集成测试)
```

**并行可能性**:
- P5 (店铺商品) 可以与 P4 (权限管理) 并行开发
- P7 (缓存优化) 可以独立开发，最后集成
- P8 (WebSocket) 可以独立开发，最后集成

---
