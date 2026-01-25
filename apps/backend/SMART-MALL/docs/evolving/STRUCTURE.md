# 后端目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端目录结构规范
> 
> 本文档为 **目录结构说明文档（Structure Document）**，用于定义代码组织规范与模块职责。
>
> 最后更新：2026-01-26

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
│   │       ├── StoreService.java          # 店铺管理服务
│   │       ├── ProductService.java        # 商品管理服务
│   │       └── RouteService.java          # 路由配置服务
│   │
│   ├── domain/                             # 领域层
│   │   ├── entity/
│   │   │   ├── BaseEntity.java            # 基础实体
│   │   │   ├── User.java                  # 用户实体
│   │   │   ├── Mall.java                  # 商城实体
│   │   │   ├── MallProject.java           # 商城项目实体
│   │   │   ├── Floor.java                 # 楼层实体
│   │   │   ├── Area.java                  # 区域实体
│   │   │   ├── AreaApply.java             # 区域权限申请实体
│   │   │   ├── AreaPermission.java        # 区域权限实体
│   │   │   ├── Store.java                 # 店铺实体
│   │   │   └── Product.java               # 商品实体
│   │   ├── enums/
│   │   │   ├── ApplyStatus.java           # 申请状态枚举
│   │   │   ├── AreaStatus.java            # 区域状态枚举
│   │   │   ├── AreaType.java              # 区域类型枚举
│   │   │   ├── MallStatus.java            # 商城状态枚举
│   │   │   ├── PermissionStatus.java      # 权限状态枚举
│   │   │   ├── ProductStatus.java         # 商品状态枚举
│   │   │   ├── Role.java                  # 角色枚举
│   │   │   ├── StoreStatus.java           # 店铺状态枚举
│   │   │   ├── UserStatus.java            # 用户状态枚举
│   │   │   └── UserType.java              # 用户类型枚举
│   │   ├── repository/
│   │   │   └── UserRepository.java        # 用户仓储接口
│   │   ├── service/
│   │   │   └── PermissionChecker.java     # 权限校验接口
│   │   └── valueobject/
│   │       ├── AreaId.java                # 区域ID值对象
│   │       ├── FloorId.java               # 楼层ID值对象
│   │       ├── Geometry3D.java            # 3D几何值对象
│   │       ├── MallId.java                # 商城ID值对象
│   │       ├── StoreId.java               # 店铺ID值对象
│   │       ├── UserId.java                # 用户ID值对象
│   │       └── Vector3D.java              # 3D向量值对象
│   │
│   ├── infrastructure/                     # 基础设施层
│   │   ├── config/
│   │   │   ├── CorsConfig.java            # 跨域配置
│   │   │   ├── DataInitializer.java       # 数据初始化器
│   │   │   ├── IntelligenceServiceConfig.java # AI服务配置
│   │   │   ├── JacksonConfig.java         # JSON序列化配置
│   │   │   ├── MybatisPlusConfig.java     # MyBatis-Plus配置
│   │   │   ├── OpenApiConfig.java         # OpenAPI文档配置
│   │   │   ├── PostgresJsonbTypeHandler.java # JSONB类型处理器
│   │   │   ├── PostgresJsonbListTypeHandler.java # JSONB列表类型处理器
│   │   │   └── RedisConfig.java           # Redis配置
│   │   ├── mapper/
│   │   │   ├── UserMapper.java            # 用户 Mapper
│   │   │   ├── MallProjectMapper.java     # 项目 Mapper
│   │   │   ├── FloorMapper.java           # 楼层 Mapper
│   │   │   ├── AreaMapper.java            # 区域 Mapper
│   │   │   ├── AreaApplyMapper.java       # 区域申请 Mapper
│   │   │   ├── AreaPermissionMapper.java  # 区域权限 Mapper
│   │   │   ├── StoreMapper.java           # 店铺 Mapper
│   │   │   └── ProductMapper.java         # 商品 Mapper
│   │   ├── repository/
│   │   │   └── UserRepositoryImpl.java    # 用户仓储实现
│   │   ├── security/
│   │   │   ├── JwtAuthenticationFilter.java # JWT认证过滤器
│   │   │   ├── JwtTokenProvider.java      # JWT令牌提供者
│   │   │   └── SecurityConfig.java        # 安全配置
│   │   └── service/
│   │       ├── ConsoleEmailService.java   # 邮件服务（控制台实现）
│   │       ├── EmailService.java          # 邮件服务接口
│   │       ├── IntelligenceServiceClient.java # AI服务客户端
│   │       └── PermissionCheckerImpl.java # 权限校验实现
│   │
│   ├── interfaces/                         # 接口层
│   │   ├── controller/
│   │   │   ├── AdminStoreController.java  # 店铺控制器（管理员端）
│   │   │   ├── AiController.java          # AI对话控制器
│   │   │   ├── AreaApplyController.java   # 区域申请控制器
│   │   │   ├── AreaPermissionController.java # 区域权限控制器
│   │   │   ├── AuthController.java        # 认证控制器
│   │   │   ├── HealthController.java      # 健康检查控制器
│   │   │   ├── MallBuilderController.java # 建模器控制器
│   │   │   ├── ProductController.java     # 商品控制器（商家端）
│   │   │   ├── PublicProductController.java # 商品控制器（公开端）
│   │   │   ├── RouteController.java       # 路由配置控制器
│   │   │   └── StoreController.java       # 店铺控制器（商家端）
│   │   └── dto/
│   │       ├── ai/                        # AI相关 DTO
│   │       ├── auth/                      # 认证相关 DTO
│   │       ├── mallbuilder/               # 建模器相关 DTO
│   │       ├── permission/                # 区域权限相关 DTO
│   │       ├── product/                   # 商品相关 DTO
│   │       ├── route/                     # 路由相关 DTO
│   │       ├── store/                     # 店铺相关 DTO
│   │       └── user/                      # 用户相关 DTO
│   │
│   └── common/                             # 通用组件
│       ├── response/
│       │   ├── ApiResponse.java           # 统一响应
│       │   └── ResultCode.java            # 错误码
│       ├── exception/
│       │   ├── BusinessException.java     # 业务异常
│       │   └── GlobalExceptionHandler.java # 全局异常处理
│       └── util/
│           ├── IdGenerator.java           # ID 生成器
│           └── ValidationUtils.java       # 验证工具
│
└── src/main/resources/
    ├── application.yml                     # 应用配置
    └── mapper/                             # MyBatis XML 映射
```

---

## 实现状态

### 应用层服务

| 服务 | 状态 | 说明 |
|------|------|------|
| `AuthService` | ✅ 完成 | 用户认证（登录/登出） |
| `RegisterService` | ✅ 完成 | 用户注册 |
| `PasswordService` | ✅ 完成 | 密码管理（忘记/重置/修改） |
| `MallBuilderService` | ✅ 完成 | 商城建模器项目管理 |
| `AreaApplyService` | ✅ 完成 | 区域权限申请 |
| `AreaPermissionService` | ✅ 完成 | 区域权限管理 |
| `StoreService` | ✅ 完成 | 店铺管理 |
| `ProductService` | ✅ 完成 | 商品管理 |
| `RouteService` | ✅ 完成 | 动态路由配置 |

### 控制器

| 控制器 | 状态 | 说明 |
|--------|------|------|
| `AuthController` | ✅ 完成 | 认证相关接口 |
| `MallBuilderController` | ✅ 完成 | 建模器接口 |
| `AreaApplyController` | ✅ 完成 | 区域申请接口 |
| `AreaPermissionController` | ✅ 完成 | 区域权限接口 |
| `StoreController` | ✅ 完成 | 店铺接口（商家端） |
| `AdminStoreController` | ✅ 完成 | 店铺接口（管理员端） |
| `ProductController` | ✅ 完成 | 商品接口（商家端） |
| `PublicProductController` | ✅ 完成 | 商品接口（公开端） |
| `RouteController` | ✅ 完成 | 路由配置接口 |
| `AiController` | ✅ 完成 | AI对话代理接口 |
| `HealthController` | ✅ 完成 | 健康检查接口 |

### 基础设施

| 组件 | 状态 | 说明 |
|------|------|------|
| `SecurityConfig` | ✅ 完成 | Spring Security 配置 |
| `JwtTokenProvider` | ✅ 完成 | JWT 令牌生成/验证 |
| `CorsConfig` | ✅ 完成 | 跨域配置 |
| `MybatisPlusConfig` | ✅ 完成 | MyBatis-Plus 配置 |
| `RedisConfig` | ✅ 完成 | Redis 缓存配置 |
| `PostgresJsonbTypeHandler` | ✅ 完成 | JSONB 类型处理 |
| `IntelligenceServiceClient` | ✅ 完成 | AI 服务客户端 |
| `DataInitializer` | ✅ 完成 | 初始数据加载 |

---

## API 接口汇总

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| POST | `/api/auth/register` | 用户注册 |
| GET | `/api/auth/check-username` | 检查用户名可用性 |
| GET | `/api/auth/check-email` | 检查邮箱可用性 |
| POST | `/api/auth/forgot-password` | 忘记密码 |
| POST | `/api/auth/verify-reset-token` | 验证重置令牌 |
| POST | `/api/auth/reset-password` | 重置密码 |
| POST | `/api/auth/change-password` | 修改密码 |

### 商城建模器

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/mall-builder/projects` | 创建项目 |
| GET | `/api/mall-builder/projects` | 获取项目列表 |
| GET | `/api/mall-builder/projects/{id}` | 获取项目详情 |
| PUT | `/api/mall-builder/projects/{id}` | 更新项目 |
| DELETE | `/api/mall-builder/projects/{id}` | 删除项目 |

### 区域权限

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/area/available` | 获取可申请区域 |
| POST | `/api/area/apply` | 提交区域申请 |
| GET | `/api/area/apply/my` | 获取我的申请 |
| GET | `/api/area/permission/my` | 获取我的权限 |
| GET | `/api/admin/area/apply/pending` | 获取待审批申请 |
| POST | `/api/admin/area/apply/{id}/approve` | 审批通过 |
| POST | `/api/admin/area/apply/{id}/reject` | 审批驳回 |
| POST | `/api/admin/area/permission/{id}/revoke` | 撤销权限 |

### 店铺管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/store` | 创建店铺 |
| GET | `/api/store/my` | 获取我的店铺 |
| GET | `/api/store/{id}` | 获取店铺详情 |
| PUT | `/api/store/{id}` | 更新店铺 |
| POST | `/api/store/{id}/activate` | 激活店铺 |
| POST | `/api/store/{id}/deactivate` | 暂停营业 |
| GET | `/api/admin/store` | 获取所有店铺 |
| POST | `/api/admin/store/{id}/approve` | 审批店铺 |
| POST | `/api/admin/store/{id}/close` | 关闭店铺 |

### 商品管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/product` | 创建商品 |
| GET | `/api/product/{id}` | 获取商品详情 |
| PUT | `/api/product/{id}` | 更新商品 |
| DELETE | `/api/product/{id}` | 删除商品 |
| GET | `/api/product/store/{storeId}` | 获取店铺商品 |
| POST | `/api/product/{id}/status` | 更新商品状态 |
| POST | `/api/product/{id}/stock` | 更新库存 |
| GET | `/api/public/store/{storeId}/products` | 公开商品列表 |
| GET | `/api/public/product/{id}` | 公开商品详情 |

### AI 对话

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | AI 对话 |
| POST | `/api/ai/confirm` | 确认操作 |

### 路由配置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/routes` | 获取路由配置 |

---

## 最近更新

### 2026-01-26 更新

- 更新文档，对齐实际实现状态
- 补充缺失的模块说明（AiController、RouteController、HealthController）
- 补充值对象（valueobject）目录说明
- 补充基础设施层完整配置类列表

### 2026-01-07 更新

- 新增商品管理功能（ProductService、ProductController）
- 新增店铺管理功能（StoreService、StoreController）
- 新增区域权限管理功能
