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
- **RAG**：Retrieval-Augmented Generation，检索增强生成，AI Agent 获取知识的核心机制
- **Vector Database**：向量数据库，存储文本嵌入向量并支持语义检索的数据库
- **World Facts Collection**：世界事实集合，存储商城客观事实的向量数据集合
- **Reviews Collection**：体验评论集合，存储用户评价的向量数据集合
- **Rules Collection**：规则指南集合，存储 Agent 行为约束的向量数据集合
- **Embedding**：嵌入向量，将文本转换为高维向量表示

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

### 需求 1.5：密码管理

**User Story**: As a 用户, I want 重置或修改我的密码, so that 我可以在忘记密码时恢复访问或定期更新密码

#### Acceptance Criteria

1. WHEN 用户请求忘记密码 THEN THE Backend System SHALL 发送密码重置链接到用户邮箱
2. THE Backend System SHALL 生成唯一的重置令牌并存储在 Redis 中，有效期 30 分钟
3. WHEN 同一邮箱在 5 分钟内重复请求 THEN THE Backend System SHALL 返回频率限制错误
4. THE Backend System SHALL 无论邮箱是否存在都返回成功响应（防止邮箱枚举攻击）
5. WHEN 用户使用有效令牌重置密码 THEN THE Backend System SHALL 更新密码并删除令牌
6. WHEN 令牌无效或过期 THEN THE Backend System SHALL 返回令牌无效错误
7. WHEN 已登录用户修改密码 THEN THE Backend System SHALL 验证旧密码正确性
8. THE Backend System SHALL 验证新密码长度不少于 6 位
9. THE Backend System SHALL 验证新密码与旧密码不同
10. THE Backend System SHALL 使用 BCrypt 加密存储密码

---

### 需求 1.6：用户注册

**User Story**: As a 访客, I want 注册新账号, so that 我可以使用系统的功能

#### Acceptance Criteria

1. WHEN 用户提交注册信息 THEN THE Backend System SHALL 验证用户名唯一性
2. WHEN 用户提交注册信息 THEN THE Backend System SHALL 验证邮箱唯一性
3. WHEN 用户名已存在 THEN THE Backend System SHALL 返回用户名已被注册错误
4. WHEN 邮箱已存在 THEN THE Backend System SHALL 返回邮箱已被注册错误
5. THE Backend System SHALL 验证用户名长度在 3-20 个字符之间
6. THE Backend System SHALL 验证用户名只包含字母、数字和下划线
7. THE Backend System SHALL 验证密码长度不少于 6 位
8. THE Backend System SHALL 验证两次输入的密码一致
9. THE Backend System SHALL 验证邮箱格式正确
10. THE Backend System SHALL 验证手机号格式正确（如果提供）
11. WHEN 注册成功 THEN THE Backend System SHALL 创建用户并设置默认角色为 USER
12. WHEN 注册成功 THEN THE Backend System SHALL 设置用户状态为 ACTIVE
13. THE Backend System SHALL 使用 BCrypt 加密存储密码
14. THE Backend System SHALL 提供用户名可用性检查接口
15. THE Backend System SHALL 提供邮箱可用性检查接口

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

### 需求 17：RAG 向量数据库存储架构

**User Story**: As a AI Agent, I want 从向量数据库检索商城知识, so that 我可以准确理解用户意图并生成正确的 Action

#### Acceptance Criteria

1. THE Backend System SHALL 维护三个独立的向量数据集合：World Facts、Reviews、Rules
2. THE Backend System SHALL 确保不同类型的数据存储在对应的集合中，禁止混存
3. WHEN 商城结构数据变更 THEN THE Backend System SHALL 同步更新 World Facts 集合
4. WHEN 用户提交评论 THEN THE Backend System SHALL 将评论存入 Reviews 集合
5. WHEN 管理员配置规则 THEN THE Backend System SHALL 将规则存入 Rules 集合
6. THE Backend System SHALL 为每条向量数据附加结构化元数据（metadata）
7. THE Backend System SHALL 支持按集合类型进行隔离检索

---

### 需求 18：世界事实型 RAG 数据管理

**User Story**: As a AI Agent, I want 检索商城的客观事实, so that 我可以准确回答"Nike 店在哪"等位置类问题

#### Acceptance Criteria

1. THE Backend System SHALL 将商城实体（Mall、Floor、Area、Store、Product）同步到 World Facts 集合
2. WHEN 存储世界事实 THEN THE Backend System SHALL 使用实体级粒度（一个实体一条记录）
3. THE Backend System SHALL 确保世界事实的文本表述稳定、客观、无主观评价
4. WHEN 实体创建或更新 THEN THE Backend System SHALL 自动生成或更新对应的向量记录
5. WHEN 实体删除 THEN THE Backend System SHALL 同步删除对应的向量记录
6. THE Backend System SHALL 在元数据中包含实体类型、ID、空间位置、所属关系等结构化信息
7. THE Backend System SHALL 支持按实体类型、楼层、区域等维度过滤检索

---

### 需求 19：体验评论型 RAG 数据管理

**User Story**: As a AI Agent, I want 检索用户评价信息, so that 我可以回答"这家店好不好"等体验类问题

#### Acceptance Criteria

1. THE Backend System SHALL 将用户评论存储到 Reviews 集合
2. WHEN 存储评论 THEN THE Backend System SHALL 使用评论级粒度（一条评论一条记录）
3. THE Backend System SHALL 允许评论内容包含主观表述和情感倾向
4. THE Backend System SHALL 在元数据中包含店铺 ID、商品 ID、评分、时间等信息
5. THE Backend System SHALL 支持按店铺、商品、评分范围、时间范围过滤检索
6. THE Backend System SHALL 支持评论的新增和删除，但不影响其他评论
7. WHEN 检索评论 THEN THE Backend System SHALL 返回多条相关评论而非单一结论

---

### 需求 20：规则指南型 RAG 数据管理

**User Story**: As a AI Agent, I want 检索行为约束规则, so that 我可以遵守"未开放区域禁止导航"等系统规则

#### Acceptance Criteria

1. THE Backend System SHALL 将系统规则存储到 Rules 集合
2. WHEN 存储规则 THEN THE Backend System SHALL 使用规则级粒度（一条规则一条记录）
3. THE Backend System SHALL 确保规则文本明确、可执行、近指令式
4. THE Backend System SHALL 在元数据中包含规则作用域、优先级、生效状态等信息
5. THE Backend System SHALL 支持按作用域（导航、编辑、权限等）过滤检索
6. WHEN Agent 执行决策 THEN THE Backend System SHALL 优先检索 Rules 集合进行约束校验
7. THE Backend System SHALL 支持规则的启用、禁用和版本管理

---

### 需求 21：RAG 多路检索与结果合并

**User Story**: As a AI Agent, I want 同时检索多个集合并合并结果, so that 我可以综合回答复杂问题

#### Acceptance Criteria

1. THE Backend System SHALL 支持指定检索的目标集合列表
2. WHEN Agent 执行导航决策 THEN THE Backend System SHALL 检索 World Facts + Rules 两个集合
3. WHEN Agent 回答推荐问题 THEN THE Backend System SHALL 检索 World Facts + Reviews 两个集合
4. THE Backend System SHALL 在返回结果中标注每条数据的来源集合
5. THE Backend System SHALL 支持设置每个集合的检索数量上限
6. THE Backend System SHALL 支持按相关性分数排序合并结果
7. THE Backend System SHALL 确保多路检索的响应时间在可接受范围内

---

### 需求 22：RAG 数据同步与一致性

**User Story**: As a 系统, I want 保证关系数据库与向量数据库的数据一致性, so that AI Agent 获取的知识始终准确

#### Acceptance Criteria

1. WHEN 关系数据库中的实体变更 THEN THE Backend System SHALL 异步同步到向量数据库
2. THE Backend System SHALL 使用事件驱动机制触发向量数据同步
3. WHEN 同步失败 THEN THE Backend System SHALL 记录失败日志并支持重试
4. THE Backend System SHALL 支持全量重建向量数据的能力
5. THE Backend System SHALL 在向量记录中存储源数据的版本号或时间戳
6. WHEN 检测到数据不一致 THEN THE Backend System SHALL 以关系数据库为准进行修复
7. THE Backend System SHALL 提供数据一致性检查的管理接口

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
- **需求 17：RAG 向量数据库存储架构**
- **需求 18：世界事实型 RAG 数据管理**

### P1（重要功能，应当实现）
- 需求 6：权限撤销
- 需求 7：店铺管理
- 需求 8：商品管理
- 需求 9：布局版本管理
- 需求 10：变更提案管理
- 需求 13：日志与审计
- **需求 19：体验评论型 RAG 数据管理**
- **需求 20：规则指南型 RAG 数据管理**
- **需求 21：RAG 多路检索与结果合并**

### P2（增强功能，可选实现）
- 需求 12：缓存与性能优化
- 需求 16：WebSocket 通知
- **需求 22：RAG 数据同步与一致性**

---

## 需求追踪矩阵

本文档中的所有需求将在后续的设计文档（DESIGN.md）和任务清单（TASK.md）中被引用和追踪。每个设计决策和实现任务都应明确标注其对应的需求编号。

---
