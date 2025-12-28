# 智能商城导购系统后端设计文档（DESIGN.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端整体架构设计（单体优先，可演进至微服务）
> 
> 本文档为 **设计规范文档（Design Specification）**，用于指导实现、维护与演进，不等同于开发教程。

---

## 1. 设计目标与设计边界

### 1.1 系统目标

后端系统作为"智能商城导购系统"的**事实中心（SSOT）与规则裁判者**，主要目标包括：

1. **为前端提供统一稳定的领域数据与业务能力**
   - 为前端 3D 商城、导购 UI、AI 代理提供结构化数据
   - 所有业务规则与数据验证在后端执行

2. **对商城结构进行结构化建模与管理**
   - 商城、楼层、区域、店铺、商品的层级管理
   - 空间区域的精细化划分与权限控制

3. **实现精细化权限与安全防护**
   - 基于空间维度的区域级建模权限
   - RBAC + 空间权限的混合模型

4. **提供清晰的接口与语义协议**
   - 支持前端 UI 层 / Orchestrator 层 / AI Agent 的协同工作
   - 统一的 DTO 与错误码体系

5. **保持架构可演进性**
   - 当前以工程化单体架构（Modular Monolith）为主
   - 保留未来拆分为微服务的演进空间

### 1.2 设计原则

- **单一事实源（SSOT）**：商城结构、空间划分、权限状态等核心事实只在后端 Domain 层维护一份真相
- **领域驱动（DDD 倾向）**：以商城场景为中心构建领域模型，控制层 / 技术细节围绕领域服务展开
- **接口语义化**：前端与后端通过语义清晰的 DTO / 协议进行协作，而非暴露底层实现
- **可演进**：先单体、后可拆分，通过清晰边界 + 模块化设计为未来微服务化留出口
- **工程化**：落地 Spring Boot 3.x + Java 17 + MyBatis-Plus + PostgreSQL + Redis

### 1.3 设计边界（明确不做）

为保证系统可交付性与稳定性，本后端设计 **明确不覆盖或弱化以下内容**：

- 不实现真实支付与交易系统
- 不实现复杂的物流与库存管理
- 不实现 AI / LLM 的意图理解（由 Agent 层处理）
- 不实现 3D 渲染相关逻辑（纯前端职责）
- 不在后端存储 3D 模型文件（仅存储配置与元数据）

---

## 2. 技术栈与运行环境

### 2.1 技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 语言与运行时 | Java 17 | LTS 版本，支持现代语法特性 |
| 基础框架 | Spring Boot 3.x | 主框架 |
| Web 层 | Spring Web / Spring MVC | RESTful API |
| 参数校验 | Spring Validation | Bean Validation 2.0 |
| 安全认证 | Spring Security 6 + JWT | 公私钥分离 |
| 数据访问 | MyBatis-Plus | ORM 框架 |
| 主数据库 | PostgreSQL 15+ | 业务数据存储 |
| 缓存 | Redis 6+ | 缓存、会话、分布式锁 |
| 日志 | Logback + JSON | 结构化日志 |
| 监控 | Actuator + Micrometer + Prometheus | 指标采集 |
| 构建 | Maven | 依赖管理与构建 |
| 容器 | Docker / Docker Compose | 部署环境 |

### 2.2 运行环境

- **JDK**：17+
- **数据库**：PostgreSQL 15+
- **缓存**：Redis 6+
- **操作系统**：Linux（开发可用 Windows / WSL2，部署优先 Linux）
- **容器**：Docker 25+，Docker Compose v2+

---

## 3. 后端整体架构与模块划分

### 3.1 架构风格

当前采用 **工程化单体（Modular Monolith）** 架构：

- 单一可部署单元（一个 Spring Boot 应用）
- 内部通过 **"分模块 + 分层"** 来保持边界清晰
- 为未来拆分为微服务保留模块级边界（按业务子域划分）

### 3.2 分层架构

整体采用经典四层结构，并通过 DDD 思维做职责约束：

```
┌─────────────────────────────────────────────────────────┐
│                    接口层（Interface）                    │
│         Controller / DTO / 参数校验 / 响应封装            │
├─────────────────────────────────────────────────────────┤
│                    应用层（Application）                  │
│         用例服务 / 业务流程编排 / 事务边界                 │
├─────────────────────────────────────────────────────────┤
│                    领域层（Domain）                       │
│    聚合根 / 实体 / 值对象 / 领域服务 / Repository 接口     │
├─────────────────────────────────────────────────────────┤
│                 基础设施层（Infrastructure）              │
│      MyBatis 映射 / Redis 操作 / 外部接口 / Repository 实现│
└─────────────────────────────────────────────────────────┘
```

### 3.3 各层职责说明

#### 3.3.1 接口层（Interface / Web / Controller）

**职责：**
- 与 HTTP / REST 绑定
- 接收请求、参数校验
- DTO 转换、封装响应
- 不包含业务逻辑

**约束：**
- 接口层 **不允许直接操作数据库**
- 接口层 **不包含业务规则判断**
- 只通过应用层服务完成业务操作

#### 3.3.2 应用层（Application）

**职责：**
- 描述用例流程（用例服务 / Application Service）
- 负责业务流程编排
- 管理事务边界
- 调用领域服务完成业务操作

**约束：**
- 应用层 **不包含核心业务规则**
- 应用层 **不直接操作数据库**
- 业务规则由领域层承担

#### 3.3.3 领域层（Domain）

**职责：**
- 领域模型（聚合根、实体、值对象）
- 领域服务（跨聚合的业务逻辑）
- 领域事件定义
- 定义 Repository 接口（不关心具体数据库技术）

**约束：**
- 领域层 **不依赖任何框架**
- 领域层 **不关心持久化细节**
- 保持领域模型的纯粹性

#### 3.3.4 基础设施层（Infrastructure）

**职责：**
- MyBatis-Plus 映射
- 数据库表结构
- Redis 操作
- 外部接口集成
- Repository 接口的具体实现

**约束：**
- 技术细节全部沉到底层
- 通过依赖倒置原则与领域层解耦



---

## 4. 领域模型设计

### 4.1 核心概念与边界

#### 4.1.1 核心实体与聚合根

**Mall（商城）**
- 描述一个虚拟 / 真实商城实例
- 属性：mallId, name, description, locationMeta, config
- 作为商城结构的顶层聚合根

**Floor（楼层）**
- 隶属 Mall
- 属性：floorId, mallId, index, name, config
- 表示商城的垂直空间划分

**Area（空间区域）**
- "空间权限"的最小单位，用于划分 3D 空间中的一块区域
- 属性：areaId, mallId, floorId, geometry, status, ownerMerchantId
- 是建模权限控制的核心实体

**Store（店铺）**
- 入驻某个或多个 Area
- 属性：storeId, mallId, name, category, logoUrl, config
- 商家经营的基本单位

**Product（商品）**
- 隶属 Store
- 属性：productId, storeId, name, price, stock, attributes
- 店铺内的可售商品

**User（用户）**
- 所有登录主体的抽象
- 属性：userId, username, passwordHash, type, status
- 支持多种用户类型

**Merchant（商家）**
- 一类用户，拥有商家信息
- 可申请区域建模权
- 关联店铺与区域权限

**Admin（管理员）**
- 一类用户
- 拥有商城结构管理与审批权限

#### 4.1.2 值对象示例

```java
// 强类型 ID，避免 ID 混用
public record MallId(String value) {}
public record FloorId(String value) {}
public record AreaId(String value) {}
public record StoreId(String value) {}
public record ProductId(String value) {}

// 3D 空间边界
public record Geometry3D(
    Vector3D min,      // 边界框最小点
    Vector3D max,      // 边界框最大点
    String shapeType   // AABB / Polygon 等
) {}

// 3D 向量
public record Vector3D(
    double x,
    double y,
    double z
) {}

// 模型配置（与 Three.js 不直接耦合）
public record ModelConfig(
    String modelUrl,
    String materialType,
    Map<String, Object> layoutParams
) {}
```

### 4.2 实体关系图

```
Mall (商城)
 │
 ├── Floor (楼层) [1:N]
 │    │
 │    └── Area (区域) [1:N]
 │         │
 │         ├── Store (店铺) [1:N]
 │         │    │
 │         │    └── Product (商品) [1:N]
 │         │
 │         └── AreaPermission (区域权限) [1:N]
 │
 └── LayoutVersion (布局版本) [1:N]

User (用户)
 │
 ├── Merchant (商家) [1:1]
 │    │
 │    └── AreaPermission (区域权限) [1:N]
 │
 └── Admin (管理员) [1:1]
```

### 4.3 区域状态模型

每个 Area 在系统中具有明确的状态，用于控制建模权限：

```java
public enum AreaStatus {
    LOCKED,      // 初始状态，不可编辑
    PENDING,     // 有商家申请中，等待审批
    AUTHORIZED,  // 已授权，可被特定商家编辑
    OCCUPIED     // 已被占用，不可再申请
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

## 5. 权限与角色模型

### 5.1 基本 RBAC

#### 5.1.1 角色定义

```java
public enum Role {
    ROLE_ADMIN,     // 平台管理员
    ROLE_MERCHANT,  // 商家
    ROLE_USER       // 普通用户
}
```

#### 5.1.2 权限定义

```java
public enum Permission {
    // 商城管理
    MALL_VIEW,
    MALL_MANAGE,
    MALL_STRUCTURE_EDIT,
    
    // 区域管理
    AREA_VIEW,
    AREA_APPLY,
    AREA_APPROVE,
    AREA_EDIT,
    AREA_REVOKE,
    
    // 店铺管理
    STORE_VIEW,
    STORE_EDIT,
    STORE_CREATE,
    
    // 商品管理
    PRODUCT_VIEW,
    PRODUCT_MANAGE,
    
    // 布局版本管理
    LAYOUT_VIEW,
    LAYOUT_PUBLISH,
    LAYOUT_ROLLBACK
}
```

#### 5.1.3 角色-权限映射

| 角色 | 权限集合 |
|------|----------|
| ROLE_ADMIN | 全部权限 |
| ROLE_MERCHANT | MALL_VIEW, AREA_VIEW, AREA_APPLY, AREA_EDIT(仅授权区域), STORE_EDIT(仅自己店铺), PRODUCT_MANAGE |
| ROLE_USER | MALL_VIEW, AREA_VIEW, STORE_VIEW, PRODUCT_VIEW |

### 5.2 空间级权限（区域建模权）

在商城场景下，单纯 RBAC 不足以满足需求，需要引入类似 RCAC 的概念：

- 商家不能对整个商城建模，只能对被授予的 Area 进行建模
- 引入 "区域建模授权" 概念

#### 5.2.1 区域权限模型

```java
public class AreaPermission {
    private String permissionId;
    private String areaId;           // 空间区域标识
    private String merchantId;       // 商家标识
    private GrantType grantType;     // 授权类型
    private PermissionStatus status; // 生效中 / 冻结 / 过期
    private LocalDateTime grantedAt;
    private LocalDateTime expiresAt;
    private String grantedBy;        // 授权人（管理员）
}

public enum GrantType {
    ADMIN_APPROVAL,  // 管理员审批
    AUTO_RULE        // 自动规则
}

public enum PermissionStatus {
    ACTIVE,    // 生效中
    FROZEN,    // 冻结
    EXPIRED,   // 过期
    REVOKED    // 已撤销
}
```

### 5.3 访问控制判定逻辑

后端在处理"修改商城结构 / 区域模型 / 店铺布局"等接口时，统一通过领域服务进行校验：

```java
public class PermissionChecker {
    
    /**
     * 校验用户对区域的操作权限
     */
    public PermissionResult checkAreaPermission(
        User user,
        AreaId areaId,
        Permission requiredPermission
    ) {
        // 1. 校验用户角色
        if (!hasRole(user, requiredPermission)) {
            return PermissionResult.denied("角色权限不足");
        }
        
        // 2. 校验 Area 授权（仅商家需要）
        if (user.isMerchant()) {
            AreaPermission permission = findAreaPermission(areaId, user.getMerchantId());
            if (permission == null || !permission.isActive()) {
                return PermissionResult.denied("未获得该区域的建模权限");
            }
        }
        
        // 3. 校验操作是否超出授权区域的空间范围
        // ...
        
        return PermissionResult.allowed();
    }
}
```

---

## 6. 应用场景与关键用例

### 6.1 用户登录与权限获取

#### 6.1.1 用户登录流程

```
1. 用户在前端输入账号密码
   ↓
2. 前端调用 POST /api/auth/login
   ↓
3. 后端认证成功后颁发：
   - accessToken（短期，15分钟）
   - refreshToken（长期，7天）
   ↓
4. 前端将 Token 保存在 Pinia / LocalStorage 中
   ↓
5. 后续请求携带 Authorization: Bearer {accessToken}
   ↓
6. 后端通过 Spring Security + JWT 对请求进行鉴权
```

#### 6.1.2 刷新 Token 流程

```
1. 当前 accessToken 即将过期 / 已过期
   ↓
2. 前端调用 POST /api/auth/refresh，携带 refreshToken
   ↓
3. 后端验证 refreshToken 有效性
   ↓
4. 生成新的 accessToken，返回给前端
```

### 6.2 商家申请区域建模权限

#### 6.2.1 业务场景

商家希望对某个区域进行自定义 3D 建模，需要向管理员发起 "区域建模申请"。

#### 6.2.2 流程概述

```
1. 商家在前端选中商城 / 楼层 / 目标区域
   ↓
2. 前端调用 POST /api/area/apply，提交申请
   - mallId, floorId, areaId, reason
   ↓
3. 应用层创建 AreaApply 聚合，状态为 PENDING
   ↓
4. 管理员在后台管理界面查看待审批列表
   ↓
5. 管理员审批通过：
   - 更新 Area 状态为 AUTHORIZED
   - 创建 AreaPermission 记录，绑定 merchantId
   ↓
6. 前端在下次拉取商城结构时，得到新的授权状态
```

### 6.3 管理员调整商城结构

管理员可以：
- 新增 / 删除楼层
- 调整楼层配置（例如垂直位置、展示标签）
- 拆分 / 合并 Area
- 发布新的 Layout 版本

所有操作会：
- 更新 Domain 中的 Mall / Floor / Area 聚合
- 持久化到数据库
- 创建新的 LayoutVersion 记录
- 通过 WebSocket 通知在线用户

### 6.4 普通用户导购与导航

```
1. 用户通过搜索 / 语音 / 图像表达意图
   ↓
2. AI Agent 将用户意图解析为店铺 / 区域 ID
   ↓
3. 前端调用后端获取相关数据：
   - GET /api/store/{storeId}
   - GET /api/mall/{mallId}/structure
   ↓
4. 后端返回结构化数据：
   - 店铺位置、楼层、区域 ID
   - 导航路径建议
   ↓
5. 前端基于 Three.js 执行导航
```



---

## 7. 数据模型设计（Data Models）

### 7.1 核心数据模型

本节定义系统中的核心数据结构，所有模型均使用 Java 类定义。

#### 7.1.1 商城结构模型

```java
// 商城实体
public class Mall {
    private String mallId;
    private String name;
    private String description;
    private String locationMeta;      // 地理位置元数据
    private String currentLayoutVersion;
    private MallStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Map<String, Object> config;
}

// 楼层实体
public class Floor {
    private String floorId;
    private String mallId;
    private Integer index;            // 楼层序号
    private String name;
    private Double height;            // 楼层高度
    private Vector3D position;        // 楼层位置
    private Map<String, Object> config;
}

// 区域实体
public class Area {
    private String areaId;
    private String mallId;
    private String floorId;
    private String name;
    private AreaType type;
    private Geometry3D geometry;      // 空间边界
    private AreaStatus status;
    private String authorizedMerchantId;
    private Map<String, Object> config;
}

// 店铺实体
public class Store {
    private String storeId;
    private String mallId;
    private String areaId;
    private String merchantId;
    private String name;
    private String category;
    private String logoUrl;
    private Vector3D position;
    private Vector3D rotation;
    private Vector3D size;
    private StoreStatus status;
    private Map<String, Object> config;
}

// 商品实体
public class Product {
    private String productId;
    private String storeId;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private Vector3D position;        // 在店铺内的位置
    private Map<String, Object> attributes;
}
```

#### 7.1.2 用户与权限模型

```java
// 用户实体
public class User {
    private String userId;
    private String username;
    private String passwordHash;
    private UserType type;
    private UserStatus status;
    private String email;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}

// 商家信息
public class Merchant {
    private String merchantId;
    private String userId;
    private String companyName;
    private String businessLicense;
    private String contactPerson;
    private String contactPhone;
    private MerchantStatus status;
    private List<String> authorizedAreaIds;
}

// 区域权限
public class AreaPermission {
    private String permissionId;
    private String areaId;
    private String merchantId;
    private GrantType grantType;
    private PermissionStatus status;
    private LocalDateTime grantedAt;
    private LocalDateTime expiresAt;
    private String grantedBy;
    private String revokedBy;
    private String revokeReason;
}

// 区域申请
public class AreaApply {
    private String applyId;
    private String mallId;
    private String floorId;
    private String areaId;
    private String merchantId;
    private String reason;
    private ApplyStatus status;
    private LocalDateTime applyAt;
    private LocalDateTime reviewedAt;
    private String reviewerId;
    private String reviewComment;
}
```

#### 7.1.3 布局版本模型

```java
// 布局版本
public class LayoutVersion {
    private String versionId;
    private String mallId;
    private Integer version;
    private LayoutVersionStatus status;
    private String createdBy;
    private Role createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
    private String description;
    private List<LayoutChange> changes;
    private List<String> affectedAreaIds;
}

// 布局变更记录
public class LayoutChange {
    private String changeId;
    private String areaId;
    private String merchantId;
    private LayoutChangeType changeType;
    private String objectsBefore;     // JSON 快照
    private String objectsAfter;      // JSON 快照
    private LocalDateTime timestamp;
}

// 变更提案
public class LayoutChangeProposal {
    private String proposalId;
    private String areaId;
    private String merchantId;
    private String description;
    private ProposalStatus status;
    private String changesJson;       // 变更内容 JSON
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String reviewComment;
}
```

### 7.2 枚举类型定义

```java
// 商城状态
public enum MallStatus {
    DRAFT,      // 草稿
    ACTIVE,     // 运营中
    CLOSED      // 已关闭
}

// 区域类型
public enum AreaType {
    RETAIL,         // 零售
    FOOD,           // 餐饮
    ENTERTAINMENT,  // 娱乐
    SERVICE         // 服务
}

// 区域状态
public enum AreaStatus {
    LOCKED,      // 锁定，不可编辑
    PENDING,     // 申请中
    AUTHORIZED,  // 已授权
    OCCUPIED     // 已占用
}

// 用户类型
public enum UserType {
    ADMIN,      // 管理员
    MERCHANT,   // 商家
    USER        // 普通用户
}

// 用户状态
public enum UserStatus {
    ACTIVE,     // 正常
    FROZEN,     // 冻结
    DELETED     // 已删除
}

// 商家状态
public enum MerchantStatus {
    PENDING,    // 待审核
    APPROVED,   // 已通过
    REJECTED,   // 已拒绝
    FROZEN      // 已冻结
}

// 申请状态
public enum ApplyStatus {
    PENDING,    // 待审批
    APPROVED,   // 已通过
    REJECTED    // 已拒绝
}

// 布局版本状态
public enum LayoutVersionStatus {
    DRAFT,      // 草稿
    ACTIVE,     // 当前生效
    ARCHIVED    // 已归档
}

// 变更类型
public enum LayoutChangeType {
    AREA_CREATED,
    AREA_MODIFIED,
    AREA_DELETED,
    OBJECTS_ADDED,
    OBJECTS_MODIFIED,
    OBJECTS_REMOVED
}

// 提案状态
public enum ProposalStatus {
    PENDING_REVIEW,
    APPROVED,
    REJECTED,
    MERGED
}
```

---

## 8. 接口设计与协议约定

### 8.1 接口风格

- RESTful 风格为主
- JSON 作为传输格式
- 所有接口使用统一响应结构

#### 8.1.1 统一响应结构

```java
public class ApiResponse<T> {
    private String code;      // 响应码
    private String message;   // 响应消息
    private T data;           // 响应数据
    private Long timestamp;   // 时间戳
}

// 成功响应示例
{
    "code": "0",
    "message": "OK",
    "data": { ... },
    "timestamp": 1733644800000
}

// 错误响应示例
{
    "code": "A1001",
    "message": "参数校验失败",
    "data": null,
    "timestamp": 1733644800000
}
```

#### 8.1.2 错误码体系

| 错误码前缀 | 含义 | 示例 |
|-----------|------|------|
| 0 | 成功 | 0 |
| A | 客户端参数 / 业务错误 | A1001 参数校验失败 |
| B | 系统内部错误 | B1001 数据库异常 |
| C | 外部依赖错误 | C1001 第三方服务超时 |

### 8.2 典型接口列表

#### 8.2.1 认证与用户

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | 刷新 Token |
| POST | /api/auth/logout | 用户登出 |
| GET | /api/user/me | 获取当前用户信息 |
| PUT | /api/user/me | 更新当前用户信息 |

#### 8.2.2 商城结构

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/mall/list | 获取商城列表 |
| GET | /api/mall/{mallId} | 获取商城详情 |
| GET | /api/mall/{mallId}/structure | 获取商城完整结构 |
| GET | /api/mall/{mallId}/floors | 获取楼层列表 |
| GET | /api/floor/{floorId}/areas | 获取区域列表 |

#### 8.2.3 区域与建模申请

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/area/available | 获取可申请区域列表 |
| POST | /api/area/apply | 商家申请区域建模权限 |
| GET | /api/area/apply/list | 管理员查看申请列表 |
| POST | /api/area/apply/{id}/approve | 管理员审批通过 |
| POST | /api/area/apply/{id}/reject | 管理员驳回 |
| POST | /api/area/permission/{id}/revoke | 撤销区域权限 |

#### 8.2.4 店铺与商品

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/store/{storeId} | 获取店铺详情 |
| PUT | /api/store/{storeId} | 更新店铺信息 |
| GET | /api/store/{storeId}/products | 获取店铺商品列表 |
| POST | /api/store/{storeId}/products | 添加商品 |
| PUT | /api/product/{productId} | 更新商品 |
| DELETE | /api/product/{productId} | 删除商品 |

#### 8.2.5 布局版本管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/layout/versions | 获取版本列表 |
| GET | /api/layout/version/{versionId} | 获取版本详情 |
| POST | /api/layout/proposal | 提交变更提案 |
| POST | /api/layout/proposal/{id}/review | 审核变更提案 |
| POST | /api/layout/version/{versionId}/publish | 发布版本 |

#### 8.2.6 管理端

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/mall | 创建商城 |
| PUT | /api/admin/mall/{mallId} | 更新商城 |
| POST | /api/admin/mall/{mallId}/floor | 创建楼层 |
| PUT | /api/admin/floor/{floorId} | 更新楼层 |
| POST | /api/admin/area | 创建区域 |
| PUT | /api/admin/area/{areaId} | 更新区域 |



---

## 9. 持久化与数据库设计

### 9.1 数据库选型与规范

- 使用 PostgreSQL 15+
- 表设计原则：
  - 命名使用小写 + 下划线
  - 逻辑删除优先（is_deleted）
  - 使用 create_time, update_time 追踪记录变更
  - 使用 version 字段实现乐观锁
- 索引设计：
  - 所有主键使用雪花 ID（String 类型）
  - 常用查询字段建联合索引
- PostgreSQL 特性利用：
  - 使用 JSONB 类型存储 JSON 数据，支持索引
  - 使用 TIMESTAMP WITH TIME ZONE 存储时间
  - 使用触发器自动更新 update_time
- 外键策略：
  - 采用逻辑外键，不使用物理外键约束
  - 外键引用有效性由应用层校验
  - 级联操作由应用层事务保证

### 9.2 通用数据库函数与触发器

在创建业务表之前，需要先创建通用的数据库函数：

```sql
-- 创建自动更新 update_time 的触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建自动递增 version 的触发器函数（乐观锁）
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 9.3 主要表结构

#### 9.3.1 商城相关表

```sql
-- 商城表
CREATE TABLE mall (
    mall_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_meta JSONB,
    current_layout_version VARCHAR(32),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_mall_status ON mall(status);
CREATE TRIGGER trigger_mall_update_time BEFORE UPDATE ON mall FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_mall_version BEFORE UPDATE ON mall FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 楼层表
CREATE TABLE mall_floor (
    floor_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall.mall_id
    floor_index INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    height NUMERIC(10,2),
    position_x NUMERIC(10,2),
    position_y NUMERIC(10,2),
    position_z NUMERIC(10,2),
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_floor_mall_id ON mall_floor(mall_id);
CREATE INDEX idx_floor_mall_floor ON mall_floor(mall_id, floor_index);
CREATE TRIGGER trigger_floor_update_time BEFORE UPDATE ON mall_floor FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_floor_version BEFORE UPDATE ON mall_floor FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 区域表
CREATE TABLE mall_area (
    area_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall.mall_id
    floor_id VARCHAR(32) NOT NULL,             -- 逻辑外键，关联 mall_floor.floor_id
    name VARCHAR(100) NOT NULL,
    area_type VARCHAR(20) NOT NULL,
    geometry JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'LOCKED',
    authorized_merchant_id VARCHAR(32),        -- 逻辑外键，关联 merchant.merchant_id
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_area_mall_id ON mall_area(mall_id);
CREATE INDEX idx_area_floor_id ON mall_area(floor_id);
CREATE INDEX idx_area_status ON mall_area(status);
CREATE INDEX idx_area_merchant ON mall_area(authorized_merchant_id);
CREATE TRIGGER trigger_area_update_time BEFORE UPDATE ON mall_area FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_area_version BEFORE UPDATE ON mall_area FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 店铺表
CREATE TABLE mall_store (
    store_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall.mall_id
    area_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall_area.area_id
    merchant_id VARCHAR(32) NOT NULL,          -- 逻辑外键，关联 merchant.merchant_id
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    logo_url VARCHAR(500),
    position_x NUMERIC(10,2),
    position_y NUMERIC(10,2),
    position_z NUMERIC(10,2),
    rotation_x NUMERIC(10,4),
    rotation_y NUMERIC(10,4),
    rotation_z NUMERIC(10,4),
    size_x NUMERIC(10,2),
    size_y NUMERIC(10,2),
    size_z NUMERIC(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_store_mall_id ON mall_store(mall_id);
CREATE INDEX idx_store_area_id ON mall_store(area_id);
CREATE INDEX idx_store_merchant_id ON mall_store(merchant_id);
CREATE TRIGGER trigger_store_update_time BEFORE UPDATE ON mall_store FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_store_version BEFORE UPDATE ON mall_store FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 商品表
CREATE TABLE mall_product (
    product_id VARCHAR(32) PRIMARY KEY,
    store_id VARCHAR(32) NOT NULL,             -- 逻辑外键，关联 mall_store.store_id
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    position_x NUMERIC(10,2),
    position_y NUMERIC(10,2),
    position_z NUMERIC(10,2),
    attributes JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_product_store_id ON mall_product(store_id);
CREATE TRIGGER trigger_product_update_time BEFORE UPDATE ON mall_product FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_product_version BEFORE UPDATE ON mall_product FOR EACH ROW EXECUTE FUNCTION increment_version();
```

#### 9.3.2 用户与权限相关表

```sql
-- 用户表
CREATE TABLE "user" (
    user_id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email VARCHAR(100),
    phone VARCHAR(20),
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_time TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_type ON "user"(user_type);
CREATE TRIGGER trigger_user_update_time BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_user_version BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 商家信息表
CREATE TABLE merchant (
    merchant_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL UNIQUE,       -- 逻辑外键，关联 user.user_id
    company_name VARCHAR(200) NOT NULL,
    business_license VARCHAR(100),
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_merchant_user_id ON merchant(user_id);
CREATE INDEX idx_merchant_status ON merchant(status);
CREATE TRIGGER trigger_merchant_update_time BEFORE UPDATE ON merchant FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_merchant_version BEFORE UPDATE ON merchant FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 区域权限表
CREATE TABLE mall_area_permission (
    permission_id VARCHAR(32) PRIMARY KEY,
    area_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall_area.area_id
    merchant_id VARCHAR(32) NOT NULL,          -- 逻辑外键，关联 merchant.merchant_id
    grant_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    granted_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    granted_by VARCHAR(32) NOT NULL,           -- 逻辑外键，关联 user.user_id
    revoked_by VARCHAR(32),                    -- 逻辑外键，关联 user.user_id
    revoke_reason VARCHAR(500),
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (area_id, merchant_id)
);
CREATE INDEX idx_permission_area_id ON mall_area_permission(area_id);
CREATE INDEX idx_permission_merchant_id ON mall_area_permission(merchant_id);
CREATE INDEX idx_permission_status ON mall_area_permission(status);
CREATE TRIGGER trigger_permission_update_time BEFORE UPDATE ON mall_area_permission FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_permission_version BEFORE UPDATE ON mall_area_permission FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 区域申请表
CREATE TABLE area_apply (
    apply_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall.mall_id
    floor_id VARCHAR(32) NOT NULL,             -- 逻辑外键，关联 mall_floor.floor_id
    area_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall_area.area_id
    merchant_id VARCHAR(32) NOT NULL,          -- 逻辑外键，关联 merchant.merchant_id
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    apply_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewer_id VARCHAR(32),                   -- 逻辑外键，关联 user.user_id
    review_comment TEXT,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_apply_merchant_id ON area_apply(merchant_id);
CREATE INDEX idx_apply_area_id ON area_apply(area_id);
CREATE INDEX idx_apply_status ON area_apply(status);
CREATE TRIGGER trigger_apply_update_time BEFORE UPDATE ON area_apply FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_apply_version BEFORE UPDATE ON area_apply FOR EACH ROW EXECUTE FUNCTION increment_version();
```

#### 9.3.3 布局版本相关表

```sql
-- 布局版本表
CREATE TABLE layout_version (
    version_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall.mall_id
    version INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR(32) NOT NULL,           -- 逻辑外键，关联 user.user_id
    created_by_role VARCHAR(20) NOT NULL,
    description TEXT,
    published_at TIMESTAMPTZ,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mall_id, version)
);
CREATE INDEX idx_layout_mall_id ON layout_version(mall_id);
CREATE INDEX idx_layout_status ON layout_version(status);
CREATE TRIGGER trigger_layout_update_time BEFORE UPDATE ON layout_version FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 布局变更记录表
CREATE TABLE layout_change (
    change_id VARCHAR(32) PRIMARY KEY,
    version_id VARCHAR(32) NOT NULL,           -- 逻辑外键，关联 layout_version.version_id
    area_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall_area.area_id
    merchant_id VARCHAR(32),                   -- 逻辑外键，关联 merchant.merchant_id
    change_type VARCHAR(30) NOT NULL,
    objects_before JSONB,
    objects_after JSONB,
    change_time TIMESTAMPTZ NOT NULL,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_change_version_id ON layout_change(version_id);
CREATE INDEX idx_change_area_id ON layout_change(area_id);

-- 变更提案表
CREATE TABLE layout_change_proposal (
    proposal_id VARCHAR(32) PRIMARY KEY,
    area_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 mall_area.area_id
    merchant_id VARCHAR(32) NOT NULL,          -- 逻辑外键，关联 merchant.merchant_id
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    changes_json JSONB NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    review_comment TEXT,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_proposal_area_id ON layout_change_proposal(area_id);
CREATE INDEX idx_proposal_merchant_id ON layout_change_proposal(merchant_id);
CREATE INDEX idx_proposal_status ON layout_change_proposal(status);
CREATE TRIGGER trigger_proposal_update_time BEFORE UPDATE ON layout_change_proposal FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_proposal_version BEFORE UPDATE ON layout_change_proposal FOR EACH ROW EXECUTE FUNCTION increment_version();
```

#### 9.3.4 审计日志表

```sql
-- 审计日志表（记录关键业务操作）
CREATE TABLE audit_log (
    log_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,              -- 操作用户 ID
    user_type VARCHAR(20) NOT NULL,            -- 用户类型
    action_type VARCHAR(50) NOT NULL,          -- 操作类型
    target_type VARCHAR(50) NOT NULL,          -- 目标资源类型
    target_id VARCHAR(32),                     -- 目标资源 ID
    old_value JSONB,                           -- 变更前的值
    new_value JSONB,                           -- 变更后的值
    ip_address VARCHAR(50),                    -- 客户端 IP
    user_agent VARCHAR(500),                   -- 客户端 User-Agent
    trace_id VARCHAR(64),                      -- 请求追踪 ID
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_action_type ON audit_log(action_type);
CREATE INDEX idx_audit_target ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_create_time ON audit_log(create_time);

-- 审计日志操作类型枚举说明
COMMENT ON TABLE audit_log IS '审计日志表，记录关键业务操作';
COMMENT ON COLUMN audit_log.action_type IS '操作类型：LOGIN, LOGOUT, CREATE, UPDATE, DELETE, APPROVE, REJECT, REVOKE, PUBLISH 等';
COMMENT ON COLUMN audit_log.target_type IS '目标类型：MALL, FLOOR, AREA, STORE, PRODUCT, USER, PERMISSION, APPLY, LAYOUT_VERSION 等';
```

---

## 10. 安全、认证与鉴权

### 10.1 认证方式

使用 JWT 进行无状态认证：

- **accessToken**：放在 HTTP Header `Authorization: Bearer xxx`
- **refreshToken**：可放在 HttpOnly Cookie 或请求体中
- 使用非对称加密（RSA）：
  - 私钥用于签发 Token（仅后端掌握）
  - 公钥用于验证 Token（可在多服务间分发）

#### 10.1.1 Token 结构

```java
// Access Token Payload
{
    "sub": "user_id",
    "username": "xxx",
    "type": "MERCHANT",
    "roles": ["ROLE_MERCHANT"],
    "merchantId": "xxx",        // 商家专属
    "authorizedAreas": ["..."], // 授权区域列表
    "iat": 1733644800,
    "exp": 1733645700           // 15分钟有效期
}

// Refresh Token Payload
{
    "sub": "user_id",
    "type": "refresh",
    "iat": 1733644800,
    "exp": 1734249600           // 7天有效期
}
```

### 10.2 鉴权方式

使用 Spring Security 进行方法级 / URL 级鉴权：

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .authorizeHttpRequests(auth -> auth
                // 公开接口
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/mall/list").permitAll()
                // 管理员接口
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // 商家接口
                .requestMatchers("/api/area/apply").hasRole("MERCHANT")
                // 其他需要认证
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

### 10.3 区域权限校验

关键业务接口通过 AOP 进行权限校验：

```java
@Aspect
@Component
public class AreaPermissionAspect {
    
    @Around("@annotation(requireAreaPermission)")
    public Object checkAreaPermission(ProceedingJoinPoint joinPoint, 
                                       RequireAreaPermission requireAreaPermission) {
        // 1. 获取当前用户
        User currentUser = SecurityContextHolder.getContext().getUser();
        
        // 2. 获取目标区域 ID
        String areaId = extractAreaId(joinPoint);
        
        // 3. 校验权限
        PermissionResult result = permissionChecker.checkAreaPermission(
            currentUser, 
            new AreaId(areaId), 
            requireAreaPermission.permission()
        );
        
        if (!result.isAllowed()) {
            throw new PermissionDeniedException(result.getReason());
        }
        
        return joinPoint.proceed();
    }
}
```



---

## 11. 正确性属性（Correctness Properties）

*属性（Property）是系统在所有有效执行中都应保持为真的特征或行为。属性是人类可读规格说明与机器可验证正确性保证之间的桥梁。*

本节定义后端系统必须满足的正确性属性，这些属性将通过单元测试和集成测试进行验证。

### 11.1 数据一致性属性

**Property 1: 商城结构层级完整性**
*对于任意* 商城数据，Floor 必须属于有效的 Mall，Area 必须属于有效的 Floor，Store 必须属于有效的 Area
**验证需求: 数据完整性**

**Property 2: 区域权限唯一性**
*对于任意* Area，在同一时刻最多只有一个商家拥有该区域的有效建模权限
**验证需求: 权限模型**

**Property 3: 布局版本单一活跃性**
*对于任意* Mall，在同一时刻最多只有一个 LayoutVersion 处于 ACTIVE 状态
**验证需求: 版本管理**

### 11.2 权限与安全属性

**Property 4: 角色权限边界**
*对于任意* 用户操作，User 角色不能执行任何编辑操作，Merchant 角色只能编辑自己授权区域内的内容
**验证需求: RBAC 模型**

**Property 5: 区域权限隔离**
*对于任意* Merchant 用户，其只能对 AreaPermission 中 status 为 ACTIVE 且 merchantId 匹配的区域进行编辑操作
**验证需求: 空间权限**

**Property 6: 空间边界约束**
*对于任意* 商家的建模操作，所有对象的位置必须在其授权区域的 Geometry3D 边界内
**验证需求: 空间约束**

**Property 7: Token 有效性**
*对于任意* API 请求，accessToken 过期后必须被拒绝，refreshToken 过期后必须重新登录
**验证需求: 认证安全**

### 11.3 业务流程属性

**Property 8: 申请状态机完整性**
*对于任意* AreaApply，状态转换必须遵循 PENDING → APPROVED/REJECTED 的单向流程，不允许逆向转换
**验证需求: 状态机**

**Property 9: 审批权限约束**
*对于任意* 区域申请的审批操作，只有 ADMIN 角色可以执行 approve 或 reject
**验证需求: 审批流程**

**Property 10: 版本发布原子性**
*对于任意* 版本发布操作，新版本变为 ACTIVE 的同时，旧版本必须变为 ARCHIVED，不存在中间状态
**验证需求: 版本管理**

### 11.4 数据完整性属性

**Property 11: 软删除一致性**
*对于任意* 被软删除的实体，其关联的子实体也应被标记为删除或解除关联
**验证需求: 数据完整性**

**Property 12: 外键引用有效性**
*对于任意* 外键引用（如 floor_id, area_id），被引用的实体必须存在且未被删除
**验证需求: 引用完整性**

**Property 13: 空间坐标合理性**
*对于任意* 空间坐标（position, geometry），数值必须在合理范围内，且 Area 的边界不能与同楼层其他 Area 重叠
**验证需求: 空间数据**

### 11.5 并发与一致性属性

**Property 14: 乐观锁保护**
*对于任意* 并发更新操作，通过版本号机制防止丢失更新
**验证需求: 并发控制**

**Property 15: 事务边界完整性**
*对于任意* 涉及多表操作的业务流程，要么全部成功，要么全部回滚
**验证需求: 事务管理**

---

## 12. 测试策略（Testing Strategy）

### 12.1 测试方法论

本系统采用分层测试策略：

- **单元测试**：验证领域模型和业务逻辑
- **集成测试**：验证数据库操作和外部依赖
- **API 测试**：验证接口契约和端到端流程

### 12.2 测试框架选择

| 类型 | 框架 | 说明 |
|------|------|------|
| 单元测试 | JUnit 5 + Mockito | 领域层测试 |
| 集成测试 | Spring Boot Test + Testcontainers | 数据库集成 |
| API 测试 | MockMvc / RestAssured | 接口测试 |

### 12.3 测试覆盖率目标

- **领域层（Domain）**：90% 以上代码覆盖率
- **应用层（Application）**：80% 以上代码覆盖率
- **接口层（Interface）**：关键接口 100% 覆盖
- **基础设施层（Infrastructure）**：Repository 方法 80% 覆盖

### 12.4 关键测试场景

#### 12.4.1 权限测试

```java
@Test
void merchantCannotEditUnauthorizedArea() {
    // Given: 商家没有区域 A 的权限
    // When: 商家尝试编辑区域 A
    // Then: 抛出 PermissionDeniedException
}

@Test
void merchantCanEditAuthorizedArea() {
    // Given: 商家拥有区域 A 的有效权限
    // When: 商家编辑区域 A 内的对象
    // Then: 操作成功
}
```

#### 12.4.2 状态机测试

```java
@Test
void areaApplyStatusTransition() {
    // Given: 申请状态为 PENDING
    // When: 管理员审批通过
    // Then: 状态变为 APPROVED，区域状态变为 AUTHORIZED
}
```

#### 12.4.3 空间边界测试

```java
@Test
void objectPositionMustBeWithinAreaBounds() {
    // Given: 区域边界为 (0,0,0) - (10,10,10)
    // When: 尝试在 (15,5,5) 位置添加对象
    // Then: 抛出 BoundaryViolationException
}
```

---

## 13. 性能与扩展性设计

### 13.1 性能考虑

#### 13.1.1 缓存策略

使用 Redis 进行热点数据缓存：

```java
// 缓存配置
@Cacheable(value = "mall:structure", key = "#mallId")
public MallStructureDTO getMallStructure(String mallId) {
    // 从数据库加载
}

// 缓存失效
@CacheEvict(value = "mall:structure", key = "#mallId")
public void updateMallStructure(String mallId, ...) {
    // 更新数据库
}
```

**缓存 Key 命名规范：**

| 缓存类型 | Key 格式 | TTL | 说明 |
|---------|---------|-----|------|
| 商城结构 | `mall:structure:{mallId}` | 5分钟 | 完整商城层级数据 |
| 楼层列表 | `mall:floors:{mallId}` | 5分钟 | 商城下所有楼层 |
| 区域列表 | `floor:areas:{floorId}` | 5分钟 | 楼层下所有区域 |
| 店铺列表 | `area:stores:{areaId}` | 3分钟 | 区域下所有店铺 |
| 用户信息 | `user:info:{userId}` | 10分钟 | 用户基本信息 |
| 用户权限 | `user:permissions:{userId}` | 1分钟 | 用户权限列表 |
| 区域权限 | `area:permission:{areaId}` | 1分钟 | 区域授权信息 |
| 商家信息 | `merchant:info:{merchantId}` | 10分钟 | 商家基本信息 |

**缓存失效策略：**

| 触发事件 | 失效的缓存 Key |
|---------|---------------|
| 商城更新 | `mall:structure:{mallId}`, `mall:floors:{mallId}` |
| 楼层变更 | `mall:structure:{mallId}`, `mall:floors:{mallId}`, `floor:areas:{floorId}` |
| 区域变更 | `mall:structure:{mallId}`, `floor:areas:{floorId}`, `area:stores:{areaId}` |
| 店铺变更 | `area:stores:{areaId}` |
| 权限变更 | `user:permissions:{userId}`, `area:permission:{areaId}` |
| 用户信息变更 | `user:info:{userId}`, `user:permissions:{userId}` |

**缓存穿透防护：**
- 对不存在的资源缓存空值，TTL 设为 30 秒
- 使用布隆过滤器预判资源是否存在

#### 13.1.2 分页与懒加载

```java
// 分页查询
public PageResult<ProductDTO> getProducts(String storeId, PageRequest request) {
    return productRepository.findByStoreId(storeId, request);
}

// 响应结构
{
    "data": [...],
    "page": 1,
    "size": 20,
    "total": 100,
    "totalPages": 5
}
```

#### 13.1.3 SQL 优化

- 避免 N + 1 查询
- 使用 MyBatis-Plus 的批量操作
- 合理使用联合索引

### 13.2 扩展性与可演进性

#### 13.2.1 模块边界

```
smart-mall-backend/
├── mall-interface/      # 接口层
├── mall-application/    # 应用层
├── mall-domain/         # 领域层
├── mall-infrastructure/ # 基础设施层
└── mall-protocol/       # 协议定义（DTO、错误码）
```

后期可沿边界拆分为独立微服务：
- mall-structure-service（商城结构）
- mall-merchant-service（商家与权限）
- mall-product-service（商品与库存）

#### 13.2.2 协议与实现解耦

- 协议定义在 mall-protocol 与 PROTOCOL.md
- 后端实现可在不破坏协议前提下自由演进
- 领域对象与 DTO 解耦，避免前端变动导致领域层频繁调整

---

## 14. 日志、监控与运维

### 14.1 日志设计

使用 Logback 输出 JSON 日志：

```json
{
    "timestamp": "2024-12-08T10:00:00.000Z",
    "level": "INFO",
    "logger": "com.mall.application.AreaApplyService",
    "message": "Area apply approved",
    "traceId": "abc123",
    "userId": "user_001",
    "applyId": "apply_001",
    "areaId": "area_001"
}
```

记录内容：
- 请求入口（URI、方法、耗时、用户 ID、TraceId）
- 关键业务日志（审批结果、权限变更等）
- 错误栈追踪

### 14.2 监控与告警

Spring Boot Actuator 暴露基础健康指标：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

Micrometer + Prometheus 采集：
- 请求 QPS、响应时间
- 数据库连接池状态
- JVM 内存与 GC 指标

告警场景：
- 登录暴力尝试（同一 IP 短时间多次失败）
- 权限拒绝高频（可能存在越权尝试）
- 数据库连接池耗尽
- 响应时间 P99 超过阈值

### 14.3 部署与环境

环境划分：
- 本地开发（dev）
- 测试环境（test）
- 生产环境（prod）

通过环境变量或配置中心区分：
- 数据源配置
- JWT 密钥
- 外部服务地址
- 日志级别

---

## 15. 与前端 / AI Agent 的协作关系

### 15.1 与前端分层的衔接

```
┌─────────────────────────────────────────────────────────┐
│                      前端系统                            │
├─────────────────────────────────────────────────────────┤
│  UI 层 / Orchestrator 层                                │
│         ↓ HTTP API 调用                                 │
├─────────────────────────────────────────────────────────┤
│                      后端系统                            │
├─────────────────────────────────────────────────────────┤
│  接口层 → 应用层 → 领域层 → 基础设施层                    │
└─────────────────────────────────────────────────────────┘
```

- 前端 UI 层 / Orchestrator 层调用后端 HTTP 接口
- 前端 Domain 层与后端 Domain 层通过统一的协议与 DTO 进行数据交换
- Three.js 渲染层不直接感知后端实现细节，只消费结构化场景数据

### 15.2 与 AI Agent 的协作

AI Agent 通过统一网关调用后端能力：

```
AI Agent
    ↓ 意图解析
    ↓ 生成 Action
前端 Orchestrator
    ↓ 权限校验
    ↓ HTTP 调用
后端 API
    ↓ 业务处理
    ↓ 返回数据
前端渲染
```

后端只负责：
- 真正的业务规则与数据
- 不负责理解自然语言意图（由 Agent / LLM 处理）

AI Agent 可调用的后端能力：
- 查询某类商品在商城中的分布
- 查询某个店铺所在区域和楼层
- 获取导航路径建议数据

---

## 16. 错误处理与降级策略

### 16.1 错误分类

| 类型 | 错误码前缀 | 处理方式 |
|------|-----------|----------|
| 参数校验错误 | A1xxx | 返回详细字段错误信息 |
| 业务规则错误 | A2xxx | 返回业务错误描述 |
| 权限错误 | A3xxx | 返回权限不足提示 |
| 资源不存在 | A4xxx | 返回 404 |
| 系统内部错误 | B1xxx | 记录日志，返回通用错误 |
| 外部依赖错误 | C1xxx | 降级处理或重试 |

### 16.2 错误处理原则

- **用户友好**：向用户展示可理解的错误消息
- **不泄漏技术细节**：不向用户暴露堆栈跟踪或内部错误
- **日志记录**：记录详细错误信息供开发者调试
- **可恢复性**：提供重试或替代方案

### 16.3 降级策略

- **缓存降级**：Redis 不可用时，直接查询数据库
- **限流保护**：高并发时启用限流，返回友好提示
- **熔断机制**：外部服务不可用时，快速失败

---

## 17. RAG 向量数据库架构设计

### 17.1 设计动机与核心原则

为支持 AI Agent 的智能导购能力，本系统引入 **RAG（Retrieval-Augmented Generation）向量数据库架构**，用于存储和检索商城结构化知识。

**核心设计原则：**

> **RAG 的"用途"决定存储的"粒度、结构和语义密度"**

不同类型的 RAG 数据服务于不同目的，必须采用不同的存储策略：

| RAG 类型 | 用途 | 粒度 | 特点 |
|---------|------|------|------|
| 世界事实型 | Action 决策 | 实体级 | 稳定、客观、结构化 |
| 体验解释型 | 回答用户问题 | 评论级 | 主观、多样、允许冲突 |
| 规则指南型 | 约束 Agent 行为 | 规则级 | 明确、可执行、高优先级 |

**设计口诀：**

> **事实要稳，评论要散，规则要硬，用途要分**

---

### 17.2 向量数据库选型

**推荐选型：Milvus / Qdrant**

| 特性 | Milvus | Qdrant | 说明 |
|------|--------|--------|------|
| 开源协议 | Apache 2.0 | Apache 2.0 | 均可商用 |
| 部署方式 | 分布式/单机 | 分布式/单机 | 支持 Docker |
| 向量维度 | 支持高维 | 支持高维 | 1536 维（OpenAI） |
| 过滤能力 | 支持标量过滤 | 支持 Payload 过滤 | 关键能力 |
| 多租户 | 支持 Collection | 支持 Collection | 按类型隔离 |

**本系统采用 Collection 级别隔离**，不同 RAG 类型使用独立 Collection：

```
vector_db/
├── world_facts/      # 世界事实集合
├── reviews/          # 用户评论集合
└── rules/            # 规则指南集合
```

---

### 17.3 三类 RAG 数据模型设计

#### 17.3.1 世界事实集合（World Facts Collection）

**用途：** 为 Agent 提供商城客观事实，用于 Action 决策

**存储原则：**
- 粒度：实体级（店铺、区域、设施）
- 内容：稳定、低主观性
- 表述：接近结构化
- 更新频率：低频（随商城结构变更）

**数据模型：**

```java
public class WorldFactDocument {
    private String id;              // 唯一标识，如 "store:nike_001"
    private String entityType;      // 实体类型：store, area, facility
    private String entityId;        // 业务实体 ID
    private String text;            // 向量化文本
    private float[] embedding;      // 向量表示（1536 维）
    private WorldFactMeta meta;     // 元数据
}

public class WorldFactMeta {
    private String mallId;          // 所属商城
    private String floorId;         // 所属楼层
    private String areaId;          // 所属区域
    private String category;        // 分类（运动、餐饮等）
    private String[] tags;          // 标签
    private LocalDateTime updatedAt;// 更新时间
}
```

**示例数据：**

```json
{
  "id": "store:nike_001",
  "entityType": "store",
  "entityId": "nike_001",
  "text": "Nike 官方店，位于三层运动区，主营跑鞋与运动装备，营业时间 10:00-22:00",
  "meta": {
    "mallId": "mall_001",
    "floorId": "floor_3",
    "areaId": "sports_zone",
    "category": "运动",
    "tags": ["跑鞋", "运动装备", "品牌店"]
  }
}
```

**存储约束：**
- ❌ 不存评价（"这家店很好"）
- ❌ 不存情绪（"超级推荐"）
- ❌ 不存夸张描述（"全城最便宜"）
- ✅ 只存客观事实

---

#### 17.3.2 用户评论集合（Reviews Collection）

**用途：** 回答用户"好不好 / 值不值 / 适不适合我"等主观问题

**存储原则：**
- 粒度：评论级 / 段落级
- 内容：主观、多样
- 表述：自然语言
- 更新频率：高频（用户持续产生）

**数据模型：**

```java
public class ReviewDocument {
    private String id;              // 唯一标识，如 "review:20240321:001"
    private String reviewId;        // 评论业务 ID
    private String text;            // 评论原文
    private float[] embedding;      // 向量表示
    private ReviewMeta meta;        // 元数据
}

public class ReviewMeta {
    private String storeId;         // 关联店铺
    private String productId;       // 关联商品（可选）
    private String userId;          // 评论用户
    private Integer rating;         // 评分（1-5）
    private String sentiment;       // 情感倾向：positive, negative, neutral
    private String[] aspects;       // 评价维度：价格、服务、质量
    private LocalDateTime createdAt;// 评论时间
}
```

**示例数据：**

```json
{
  "id": "review:20240321:001",
  "reviewId": "r_001",
  "text": "这双跑鞋缓震很好，跑长距离不累，但脚背高的人可能偏紧。",
  "meta": {
    "storeId": "nike_001",
    "productId": "shoe_001",
    "rating": 4,
    "sentiment": "positive",
    "aspects": ["舒适度", "尺码"],
    "createdAt": "2024-03-21T10:00:00Z"
  }
}
```

**存储约束：**
- ❌ 不保证一致（允许观点冲突）
- ❌ 不保证结论（不同人有不同体验）
- ✅ 允许主观表达
- ✅ 保留情感倾向

---

#### 17.3.3 规则指南集合（Rules Collection）

**用途：** 约束 Agent 行为，告诉 Agent 什么能做、什么不能做

**存储原则：**
- 粒度：规则级
- 内容：明确、可执行
- 表述：近指令式
- 更新频率：极低频（系统配置级）

**数据模型：**

```java
public class RuleDocument {
    private String id;              // 唯一标识，如 "rule:navigation:001"
    private String ruleType;        // 规则类型：navigation, recommendation, safety
    private String text;            // 规则描述
    private float[] embedding;      // 向量表示
    private RuleMeta meta;          // 元数据
}

public class RuleMeta {
    private String scope;           // 作用范围：global, mall, area
    private String scopeId;         // 范围 ID（如 mallId）
    private RulePriority priority;  // 优先级：critical, high, normal
    private Boolean isActive;       // 是否生效
    private LocalDateTime effectiveFrom; // 生效时间
    private LocalDateTime effectiveTo;   // 失效时间
}

public enum RulePriority {
    CRITICAL,   // 关键规则，必须遵守
    HIGH,       // 高优先级
    NORMAL      // 普通规则
}
```

**示例数据：**

```json
{
  "id": "rule:navigation:001",
  "ruleType": "navigation",
  "text": "未开放区域禁止导航，仅允许高亮提示。",
  "meta": {
    "scope": "global",
    "priority": "CRITICAL",
    "isActive": true
  }
}
```

```json
{
  "id": "rule:recommendation:001",
  "ruleType": "recommendation",
  "text": "推荐商品时，优先推荐用户历史偏好类目，不推荐已下架商品。",
  "meta": {
    "scope": "global",
    "priority": "HIGH",
    "isActive": true
  }
}
```

**存储约束：**
- ✅ 规则必须明确可执行
- ✅ 规则有优先级
- ❌ 不存模糊建议
- ❌ 不参与用户问答（仅约束 Agent）

---

### 17.4 Embedding 策略

#### 17.4.1 Embedding 模型选择

| 模型 | 维度 | 适用场景 | 说明 |
|------|------|---------|------|
| OpenAI text-embedding-3-small | 1536 | 通用场景 | 推荐 |
| OpenAI text-embedding-3-large | 3072 | 高精度场景 | 成本较高 |
| 本地模型（BGE/M3E） | 768/1024 | 私有化部署 | 需自建服务 |

**推荐方案：** OpenAI text-embedding-3-small（1536 维）

#### 17.4.2 文本预处理策略

**世界事实：**
```
模板：{店铺名称}，位于{楼层}{区域}，主营{品类}，{补充信息}
示例：Nike 官方店，位于三层运动区，主营跑鞋与运动装备，营业时间 10:00-22:00
```

**用户评论：**
```
保留原文，可选添加前缀：
模板：关于{店铺/商品}的评价：{评论原文}
示例：关于 Nike 跑鞋的评价：这双跑鞋缓震很好，跑长距离不累
```

**规则指南：**
```
保留原文，确保语义完整
示例：未开放区域禁止导航，仅允许高亮提示。
```

---

### 17.5 数据同步机制

#### 17.5.1 同步架构

```
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL（主数据库）                 │
│         mall_store / mall_product / user_review         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼ 变更事件
┌─────────────────────────────────────────────────────────┐
│                    同步服务（Sync Service）               │
│         监听变更 → 生成 Embedding → 写入向量库            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    向量数据库（Milvus/Qdrant）            │
│         world_facts / reviews / rules                   │
└─────────────────────────────────────────────────────────┘
```

#### 17.5.2 同步触发机制

| 数据类型 | 触发事件 | 同步策略 |
|---------|---------|---------|
| 世界事实 | 店铺/区域创建、更新、删除 | 实时同步 |
| 用户评论 | 评论创建、审核通过 | 准实时（延迟 < 1 分钟） |
| 规则指南 | 管理员配置变更 | 实时同步 |

#### 17.5.3 同步服务实现

```java
@Service
public class VectorSyncService {
    
    private final EmbeddingService embeddingService;
    private final VectorDbClient vectorDbClient;
    
    /**
     * 同步店铺到世界事实集合
     */
    @Transactional
    @EventListener(StoreUpdatedEvent.class)
    public void syncStoreToWorldFacts(StoreUpdatedEvent event) {
        Store store = event.getStore();
        
        // 1. 生成文本描述
        String text = generateStoreDescription(store);
        
        // 2. 生成 Embedding
        float[] embedding = embeddingService.embed(text);
        
        // 3. 构建文档
        WorldFactDocument doc = WorldFactDocument.builder()
            .id("store:" + store.getStoreId())
            .entityType("store")
            .entityId(store.getStoreId())
            .text(text)
            .embedding(embedding)
            .meta(buildStoreMeta(store))
            .build();
        
        // 4. 写入向量库
        vectorDbClient.upsert("world_facts", doc);
    }
    
    /**
     * 同步评论到评论集合
     */
    @Async
    @EventListener(ReviewApprovedEvent.class)
    public void syncReviewToReviews(ReviewApprovedEvent event) {
        Review review = event.getReview();
        
        String text = review.getContent();
        float[] embedding = embeddingService.embed(text);
        
        ReviewDocument doc = ReviewDocument.builder()
            .id("review:" + review.getReviewId())
            .reviewId(review.getReviewId())
            .text(text)
            .embedding(embedding)
            .meta(buildReviewMeta(review))
            .build();
        
        vectorDbClient.upsert("reviews", doc);
    }
}
```

---

### 17.6 RAG 检索 API 设计

#### 17.6.1 检索接口定义

```java
// 世界事实检索
@PostMapping("/api/rag/world-facts/search")
public ApiResponse<List<WorldFactResult>> searchWorldFacts(
    @RequestBody WorldFactSearchRequest request
);

// 评论检索
@PostMapping("/api/rag/reviews/search")
public ApiResponse<List<ReviewResult>> searchReviews(
    @RequestBody ReviewSearchRequest request
);

// 规则检索
@PostMapping("/api/rag/rules/search")
public ApiResponse<List<RuleResult>> searchRules(
    @RequestBody RuleSearchRequest request
);

// 多路检索（综合查询）
@PostMapping("/api/rag/multi-search")
public ApiResponse<MultiSearchResult> multiSearch(
    @RequestBody MultiSearchRequest request
);
```

#### 17.6.2 请求与响应模型

```java
// 世界事实检索请求
public class WorldFactSearchRequest {
    private String query;           // 查询文本
    private Integer topK;           // 返回数量，默认 5
    private WorldFactFilter filter; // 过滤条件
}

public class WorldFactFilter {
    private String mallId;          // 限定商城
    private String floorId;         // 限定楼层
    private String category;        // 限定类目
    private String[] entityTypes;   // 限定实体类型
}

// 检索结果
public class WorldFactResult {
    private String id;
    private String entityType;
    private String entityId;
    private String text;
    private Double score;           // 相似度分数
    private WorldFactMeta meta;
}

// 多路检索请求
public class MultiSearchRequest {
    private String query;
    private Boolean includeWorldFacts;  // 是否检索世界事实
    private Boolean includeReviews;     // 是否检索评论
    private Boolean includeRules;       // 是否检索规则
    private Integer topKPerCollection;  // 每个集合返回数量
}

// 多路检索结果
public class MultiSearchResult {
    private List<WorldFactResult> worldFacts;
    private List<ReviewResult> reviews;
    private List<RuleResult> rules;
}
```

#### 17.6.3 检索策略

**Action 决策场景：**
```java
// 只查 world_facts + rules
MultiSearchRequest request = MultiSearchRequest.builder()
    .query("Nike 店在哪里")
    .includeWorldFacts(true)
    .includeRules(true)
    .includeReviews(false)
    .topKPerCollection(3)
    .build();
```

**用户问答场景：**
```java
// 只查 reviews
ReviewSearchRequest request = ReviewSearchRequest.builder()
    .query("Nike 跑鞋怎么样")
    .topK(5)
    .filter(ReviewFilter.builder()
        .storeId("nike_001")
        .minRating(3)
        .build())
    .build();
```

**综合回答场景：**
```java
// 多路检索，后端合并
MultiSearchRequest request = MultiSearchRequest.builder()
    .query("推荐一家运动品牌店")
    .includeWorldFacts(true)
    .includeReviews(true)
    .includeRules(true)
    .topKPerCollection(3)
    .build();
```

---

### 17.7 数据库表设计（PostgreSQL 侧）

为支持 RAG 数据管理，在 PostgreSQL 中增加以下表：

```sql
-- 用户评论表
CREATE TABLE user_review (
    review_id VARCHAR(32) PRIMARY KEY,
    store_id VARCHAR(32) NOT NULL,             -- 逻辑外键，关联 mall_store.store_id
    product_id VARCHAR(32),                    -- 逻辑外键，关联 mall_product.product_id
    user_id VARCHAR(32) NOT NULL,              -- 逻辑外键，关联 user.user_id
    content TEXT NOT NULL,                     -- 评论内容
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    sentiment VARCHAR(20),                     -- 情感倾向
    aspects JSONB,                             -- 评价维度
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    vector_synced BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否已同步到向量库
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_review_store_id ON user_review(store_id);
CREATE INDEX idx_review_product_id ON user_review(product_id);
CREATE INDEX idx_review_user_id ON user_review(user_id);
CREATE INDEX idx_review_status ON user_review(status);
CREATE INDEX idx_review_vector_synced ON user_review(vector_synced);
CREATE TRIGGER trigger_review_update_time BEFORE UPDATE ON user_review FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 系统规则表
CREATE TABLE system_rule (
    rule_id VARCHAR(32) PRIMARY KEY,
    rule_type VARCHAR(50) NOT NULL,            -- navigation, recommendation, safety
    content TEXT NOT NULL,                     -- 规则内容
    scope VARCHAR(20) NOT NULL DEFAULT 'global', -- global, mall, area
    scope_id VARCHAR(32),                      -- 范围 ID
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- CRITICAL, HIGH, NORMAL
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMPTZ,
    effective_to TIMESTAMPTZ,
    vector_synced BOOLEAN NOT NULL DEFAULT FALSE,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_rule_type ON system_rule(rule_type);
CREATE INDEX idx_rule_scope ON system_rule(scope, scope_id);
CREATE INDEX idx_rule_active ON system_rule(is_active);
CREATE TRIGGER trigger_rule_update_time BEFORE UPDATE ON system_rule FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 向量同步日志表（用于追踪同步状态）
CREATE TABLE vector_sync_log (
    log_id VARCHAR(32) PRIMARY KEY,
    collection_name VARCHAR(50) NOT NULL,      -- world_facts, reviews, rules
    entity_type VARCHAR(50) NOT NULL,          -- store, review, rule
    entity_id VARCHAR(32) NOT NULL,
    sync_action VARCHAR(20) NOT NULL,          -- INSERT, UPDATE, DELETE
    sync_status VARCHAR(20) NOT NULL,          -- SUCCESS, FAILED, PENDING
    error_message TEXT,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sync_log_collection ON vector_sync_log(collection_name);
CREATE INDEX idx_sync_log_entity ON vector_sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_status ON vector_sync_log(sync_status);
```

---

### 17.8 RAG 架构正确性属性

**Property 16: RAG 数据隔离性**
*对于任意* RAG 检索请求，world_facts、reviews、rules 三个集合的数据不会混合存储，检索时按用途分别查询
**验证需求: RAG 架构**

**Property 17: 世界事实客观性**
*对于任意* world_facts 集合中的文档，不包含主观评价、情感表达或夸张描述
**验证需求: 数据质量**

**Property 18: 评论多样性**
*对于任意* reviews 集合中的文档，允许存在观点冲突，不强制一致性
**验证需求: 数据特性**

**Property 19: 规则优先级**
*对于任意* Agent 决策场景，rules 集合中 priority 为 CRITICAL 的规则必须被优先考虑
**验证需求: 规则约束**

**Property 20: 数据同步一致性**
*对于任意* PostgreSQL 中的数据变更，在配置的延迟时间内必须同步到向量数据库
**验证需求: 数据同步**

---

## 18. 后续演进计划

### 17.1 短期计划

- 细化领域模型：引入领域事件（如 AreaPermissionGrantedEvent）
- 引入更细粒度的建模版本管理（区域建模版本历史）
- 补充自动化测试：单元测试（Domain / Application）、集成测试（接口 + 数据库）

### 17.2 中期计划

- 微服务演进方向：
  - mall-structure-service（商城结构）
  - mall-merchant-service（商家与权限）
  - mall-product-service（商品与库存）
- 引入消息队列处理异步任务
- 实现 WebSocket 推送版本更新通知

### 17.3 长期计划

- 支持多商城管理
- 引入搜索引擎（Elasticsearch）优化商品搜索
- 支持更复杂的空间权限模型

---

## 附录：需求追溯矩阵

| 设计章节 | 对应需求 |
|---------|---------|
| 4. 领域模型设计 | 商城结构管理、区域权限 |
| 5. 权限与角色模型 | RBAC、空间权限 |
| 6. 应用场景与关键用例 | 登录、申请、审批、导购 |
| 7. 数据模型设计 | 数据结构定义 |
| 8. 接口设计与协议约定 | API 契约 |
| 9. 持久化与数据库设计 | 数据存储 |
| 10. 安全、认证与鉴权 | 安全要求 |
| 11. 正确性属性 | 系统正确性保证 |
| 15. 与前端 / AI Agent 的协作 | 系统集成 |
| 17. RAG 向量数据库架构设计 | RAG 知识库、AI Agent 集成 |

---
