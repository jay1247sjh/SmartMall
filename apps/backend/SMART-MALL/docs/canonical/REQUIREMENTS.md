# 智能商城导购系统后端需求规格说明文档（REQUIREMENTS.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端系统功能需求与验收标准
> 
> 本文档为 **需求规格说明文档（Requirements Specification）**，用于定义系统功能边界与验收标准。

---

## 简介（Introduction）

本文档描述「智能商城导购系统」后端的功能需求与验收标准。后端系统作为整个系统的事实中心（SSOT）与规则裁判者，负责商城结构管理、用户认证、权限控制、数据持久化等核心功能。

系统采用 Spring Boot 3.x + Java 17 + MyBatis-Plus + PostgreSQL + Redis 技术栈，强调领域驱动设计、模块化架构与可扩展性。本文档定义系统必须实现的功能，作为设计、开发与测试的依据。

---

## 术语表（Glossary）

- **Backend System**：后端系统，本文档描述的完整服务端系统
- **Mall**：商城实体，虚拟或真实商城的数据表示
- **Floor**：楼层实体，商城的垂直空间划分
- **Area**：区域实体，空间权限的最小单位
- **Store**：店铺实体，商家经营的基本单位
- **Product**：商品实体，店铺内的可售商品
- **Merchant**：商家，拥有店铺和区域建模权的用户类型
- **Admin**：管理员，拥有商城结构管理和审批权限的用户类型
- **AreaPermission**：区域权限，商家对特定区域的建模授权
- **LayoutVersion**：布局版本，商城结构的版本化管理
- **RBAC**：Role-Based Access Control，基于角色的访问控制
- **SSOT**：Single Source of Truth，单一事实源

---

## 需求列表（Requirements）

### 需求 1：用户认证与会话管理

**User Story**: As a 用户, I want 安全地登录系统并保持会话, so that 我可以访问授权的功能

#### Acceptance Criteria

1. WHEN 用户提交正确的用户名和密码 THEN THE Backend System SHALL 颁发 accessToken 和 refreshToken
2. WHEN 用户提交错误的凭证 THEN THE Backend System SHALL 返回认证失败错误并记录日志
3. WHEN accessToken 过期 THEN THE Backend System SHALL 拒绝请求并返回 Token 过期错误
4. WHEN 用户使用有效的 refreshToken THEN THE Backend System SHALL 颁发新的 accessToken
5. WHEN refreshToken 过期 THEN THE Backend System SHALL 要求用户重新登录
6. THE Backend System SHALL 使用 RSA 非对称加密签发和验证 Token
7. THE Backend System SHALL 在 Token 中包含用户角色和权限信息

---

### 需求 2：用户与角色管理

**User Story**: As a 系统管理员, I want 管理用户和角色, so that 不同用户具备不同的系统权限

#### Acceptance Criteria

1. THE Backend System SHALL 支持 ADMIN、MERCHANT、USER 三种用户类型
2. WHEN 创建用户 THEN THE Backend System SHALL 验证用户名唯一性
3. WHEN 用户登录 THEN THE Backend System SHALL 返回用户的角色和权限列表
4. THE Backend System SHALL 支持用户状态管理（ACTIVE、FROZEN、DELETED）
5. WHEN 用户状态为 FROZEN 或 DELETED THEN THE Backend System SHALL 拒绝该用户的登录请求
6. THE Backend System SHALL 记录用户的最后登录时间

---

### 需求 3：商城结构管理

**User Story**: As a 管理员, I want 管理商城的基础结构, so that 我可以定义商城的楼层和区域划分

#### Acceptance Criteria

1. WHEN 管理员创建商城 THEN THE Backend System SHALL 生成唯一的商城 ID 并持久化
2. WHEN 管理员创建楼层 THEN THE Backend System SHALL 验证楼层序号的唯一性
3. WHEN 管理员创建区域 THEN THE Backend System SHALL 验证区域边界不与同楼层其他区域重叠
4. THE Backend System SHALL 支持商城状态管理（DRAFT、ACTIVE、CLOSED）
5. WHEN 查询商城结构 THEN THE Backend System SHALL 返回完整的楼层、区域、店铺层级数据
6. THE Backend System SHALL 支持商城配置的 JSON 格式存储
7. WHEN 删除楼层 THEN THE Backend System SHALL 级联处理关联的区域和店铺

---

### 需求 4：区域权限申请与审批

**User Story**: As a 商家, I want 申请区域建模权限, so that 我可以在授权区域内自定义店铺布局

#### Acceptance Criteria

1. WHEN 商家提交区域申请 THEN THE Backend System SHALL 创建申请记录并设置状态为 PENDING
2. WHEN 申请提交成功 THEN THE Backend System SHALL 更新区域状态为 PENDING
3. WHEN 管理员审批通过 THEN THE Backend System SHALL 创建 AreaPermission 记录
4. WHEN 管理员审批通过 THEN THE Backend System SHALL 更新区域状态为 AUTHORIZED
5. WHEN 管理员驳回申请 THEN THE Backend System SHALL 恢复区域状态为 LOCKED
6. THE Backend System SHALL 阻止对同一区域的重复申请
7. THE Backend System SHALL 支持设置权限有效期

---

### 需求 5：区域权限校验

**User Story**: As a 系统, I want 校验用户对区域的操作权限, so that 防止越权操作

#### Acceptance Criteria

1. WHEN 商家尝试编辑区域 THEN THE Backend System SHALL 校验该商家是否拥有该区域的有效权限
2. WHEN 权限校验失败 THEN THE Backend System SHALL 返回权限不足错误
3. THE Backend System SHALL 校验操作对象的位置是否在授权区域边界内
4. WHEN 操作超出区域边界 THEN THE Backend System SHALL 返回边界违规错误
5. THE Backend System SHALL 支持权限状态管理（ACTIVE、FROZEN、EXPIRED、REVOKED）
6. WHEN 权限状态非 ACTIVE THEN THE Backend System SHALL 拒绝编辑操作
7. THE Backend System SHALL 记录所有被拒绝的操作尝试

---

### 需求 6：权限撤销

**User Story**: As a 管理员, I want 撤销商家的区域权限, so that 我可以处理违规行为或重新分配区域

#### Acceptance Criteria

1. WHEN 管理员撤销权限 THEN THE Backend System SHALL 更新权限状态为 REVOKED
2. WHEN 权限被撤销 THEN THE Backend System SHALL 更新区域状态为 LOCKED
3. THE Backend System SHALL 记录撤销操作的时间、操作者和理由
4. THE Backend System SHALL 保留商家已提交但未发布的变更提案
5. WHEN 权限撤销后 THEN THE Backend System SHALL 允许其他商家申请该区域

---

### 需求 7：店铺管理

**User Story**: As a 商家, I want 管理我的店铺信息, so that 我可以展示店铺和商品

#### Acceptance Criteria

1. WHEN 商家创建店铺 THEN THE Backend System SHALL 验证店铺位置在授权区域内
2. WHEN 商家更新店铺 THEN THE Backend System SHALL 校验商家对该店铺的所有权
3. THE Backend System SHALL 支持店铺状态管理（ACTIVE、CLOSED）
4. WHEN 查询店铺 THEN THE Backend System SHALL 返回店铺的位置、尺寸、配置信息
5. THE Backend System SHALL 支持店铺配置的 JSON 格式存储
6. WHEN 删除店铺 THEN THE Backend System SHALL 级联删除关联的商品

---

### 需求 8：商品管理

**User Story**: As a 商家, I want 管理店铺内的商品, so that 用户可以浏览和了解商品信息

#### Acceptance Criteria

1. WHEN 商家添加商品 THEN THE Backend System SHALL 验证商品位置在店铺范围内
2. WHEN 商家更新商品 THEN THE Backend System SHALL 校验商家对该店铺的所有权
3. THE Backend System SHALL 支持商品属性的 JSON 格式存储
4. WHEN 查询商品列表 THEN THE Backend System SHALL 支持分页和关键词搜索
5. THE Backend System SHALL 支持商品状态管理（ACTIVE、OFFLINE）
6. THE Backend System SHALL 验证商品价格和库存的合法性

---

### 需求 9：布局版本管理

**User Story**: As a 管理员, I want 管理商城布局的版本, so that 我可以控制发布时机并支持版本回滚

#### Acceptance Criteria

1. THE Backend System SHALL 为每次布局变更创建新版本
2. WHEN 创建新版本 THEN THE Backend System SHALL 记录版本号、创建者、创建时间和变更描述
3. THE Backend System SHALL 支持 DRAFT、ACTIVE、ARCHIVED 三种版本状态
4. WHEN 发布版本 THEN THE Backend System SHALL 将该版本状态设置为 ACTIVE
5. WHEN 新版本发布 THEN THE Backend System SHALL 将旧版本状态设置为 ARCHIVED
6. THE Backend System SHALL 保证同一商城同时只有一个 ACTIVE 版本
7. WHEN 查询商城结构 THEN THE Backend System SHALL 返回最新 ACTIVE 版本的数据

---

### 需求 10：变更提案管理

**User Story**: As a 商家, I want 提交建模变更供管理员审核, so that 我的设计可以在审核通过后发布

#### Acceptance Criteria

1. WHEN 商家提交变更提案 THEN THE Backend System SHALL 收集所有新增、修改、删除的对象信息
2. WHEN 变更提交成功 THEN THE Backend System SHALL 创建提案记录并设置状态为 PENDING_REVIEW
3. THE Backend System SHALL 允许商家在提交后继续编辑而不影响已提交版本
4. WHEN 管理员审核变更 THEN THE Backend System SHALL 支持 APPROVED、REJECTED 两种结果
5. WHEN 变更被批准 THEN THE Backend System SHALL 将变更合并到新的布局版本
6. WHEN 变更被驳回 THEN THE Backend System SHALL 记录驳回理由

---

### 需求 11：数据查询与导航支持

**User Story**: As a 前端系统, I want 查询商城数据, so that 我可以渲染 3D 场景和支持用户导航

#### Acceptance Criteria

1. WHEN 查询商城列表 THEN THE Backend System SHALL 返回商城基本信息和统计数据
2. WHEN 查询商城结构 THEN THE Backend System SHALL 返回完整的层级数据（楼层→区域→店铺）
3. WHEN 查询店铺详情 THEN THE Backend System SHALL 返回店铺的位置、尺寸、商品列表
4. THE Backend System SHALL 支持按区域、类别筛选店铺
5. THE Backend System SHALL 支持按关键词搜索商品
6. WHEN 查询区域状态 THEN THE Backend System SHALL 返回区域的授权状态和占用信息

---

### 需求 12：缓存与性能优化

**User Story**: As a 系统, I want 缓存热点数据, so that 提高查询性能和系统响应速度

#### Acceptance Criteria

1. THE Backend System SHALL 缓存商城结构数据
2. THE Backend System SHALL 缓存用户权限信息
3. WHEN 数据更新 THEN THE Backend System SHALL 及时失效相关缓存
4. THE Backend System SHALL 支持分页查询以控制数据量
5. THE Backend System SHALL 使用合理的数据库索引优化查询
6. THE Backend System SHALL 避免 N+1 查询问题

---

### 需求 13：日志与审计

**User Story**: As a 运维人员, I want 完善的日志系统, so that 我可以追踪问题和审计操作

#### Acceptance Criteria

1. THE Backend System SHALL 记录所有 API 请求的入口日志
2. THE Backend System SHALL 记录关键业务操作（审批、权限变更等）
3. THE Backend System SHALL 记录错误和异常的详细信息
4. THE Backend System SHALL 支持日志级别控制（DEBUG / INFO / WARN / ERROR）
5. THE Backend System SHALL 使用结构化 JSON 格式输出日志
6. THE Backend System SHALL 在日志中包含请求追踪 ID

---

### 需求 14：错误处理

**User Story**: As a 调用方, I want 清晰的错误响应, so that 我可以理解错误原因并采取正确操作

#### Acceptance Criteria

1. THE Backend System SHALL 使用统一的响应结构
2. THE Backend System SHALL 使用语义化的错误码体系
3. WHEN 参数校验失败 THEN THE Backend System SHALL 返回详细的字段错误信息
4. WHEN 业务规则冲突 THEN THE Backend System SHALL 返回明确的业务错误描述
5. WHEN 系统内部错误 THEN THE Backend System SHALL 返回通用错误而不暴露技术细节
6. THE Backend System SHALL 区分客户端错误和服务端错误

---

### 需求 15：数据完整性

**User Story**: As a 系统, I want 保证数据完整性, so that 避免数据损坏和不一致

#### Acceptance Criteria

1. THE Backend System SHALL 验证所有外键引用的有效性
2. THE Backend System SHALL 使用事务保证多表操作的原子性
3. THE Backend System SHALL 使用乐观锁防止并发更新冲突
4. THE Backend System SHALL 使用软删除而非物理删除
5. WHEN 删除父实体 THEN THE Backend System SHALL 级联处理子实体
6. THE Backend System SHALL 验证空间坐标的合理性

---

### 需求 16：WebSocket 通知

**User Story**: As a 在线用户, I want 收到实时通知, so that 我可以及时了解系统变更

#### Acceptance Criteria

1. WHEN 新布局版本发布 THEN THE Backend System SHALL 通过 WebSocket 推送更新通知
2. WHEN 区域状态变更 THEN THE Backend System SHALL 通知相关用户
3. WHEN 权限被授予或撤销 THEN THE Backend System SHALL 通知相关商家
4. THE Backend System SHALL 支持 WebSocket 连接的心跳保活
5. THE Backend System SHALL 验证 WebSocket 连接的 Token 有效性

---

## 需求优先级说明

### P0（核心功能，必须实现）
- 需求 1：用户认证与会话管理
- 需求 2：用户与角色管理
- 需求 3：商城结构管理
- 需求 4：区域权限申请与审批
- 需求 5：区域权限校验
- 需求 11：数据查询与导航支持
- 需求 14：错误处理
- 需求 15：数据完整性

### P1（重要功能，应当实现）
- 需求 6：权限撤销
- 需求 7：店铺管理
- 需求 8：商品管理
- 需求 9：布局版本管理
- 需求 10：变更提案管理
- 需求 13：日志与审计

### P2（增强功能，可选实现）
- 需求 12：缓存与性能优化
- 需求 16：WebSocket 通知

---

## 需求追踪矩阵

本文档中的所有需求将在后续的设计文档（DESIGN.md）和任务清单（TASK.md）中被引用和追踪。每个设计决策和实现任务都应明确标注其对应的需求编号。

---
