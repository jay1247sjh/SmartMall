# 前端需求规格说明文档（REQUIREMENTS.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端系统功能需求与验收标准
> 
> 本文档为 **需求规格说明文档（Requirements Specification）**，用于定义系统功能边界与验收标准。

---

## 简介（Introduction）

本文档描述「3D 智能商城」系统的功能需求与验收标准。该系统是一个 AI 驱动的三维智能导购商城，通过自然语言交互实现空间导航与智能导购。

系统采用 Vue 3 + TypeScript + Three.js 技术栈，强调工程化、模块解耦与可扩展性。本文档定义系统必须实现的功能，作为设计、开发与测试的依据。

---

## 术语表（Glossary）

- **Mall System**：三维智能商城系统，本文档描述的完整前端系统
- **Three Core**：Three.js 渲染引擎层，负责 3D 场景的底层渲染
- **Domain Layer**：领域场景层，管理商城语义实体与高级行为
- **Orchestrator**：业务协调层，系统行为的中枢控制器
- **Action**：标准化行为指令，系统内部的统一操作协议
- **Semantic Object**：语义对象，具备业务含义的 3D 实体
- **Agent Module**：AI 代理模块，负责自然语言理解与 Action 生成
- **RCAC**：Role + Capability + Context，基于角色、能力与上下文的权限模型
- **Config Mode**：配置态，用于编辑商城结构与内容的系统模式
- **Runtime Mode**：运行态，用于用户浏览与导航的系统模式
- **SSOT**：Single Source of Truth，单一事实源，状态管理原则

---

## 需求列表（Requirements）

### 需求 1：三维场景渲染与生命周期管理

**User Story**: As a 系统, I want 初始化并管理三维商城场景的完整生命周期, so that 用户可以稳定地进入、浏览和退出 3D 空间

#### Acceptance Criteria

1. WHEN 用户进入商城页面 THEN THE Mall System SHALL 初始化 Three Core 渲染引擎
2. WHEN Three Core 初始化完成 THEN THE Mall System SHALL 创建 Scene、Camera 和 Renderer 实例
3. WHEN 场景初始化完成 THEN THE Mall System SHALL 加载商城的基础几何结构
4. WHEN 用户离开商城页面 THEN THE Mall System SHALL 停止渲染循环
5. WHEN 页面卸载 THEN THE Mall System SHALL 释放所有 Three.js 资源并注销事件监听器
6. THE Mall System SHALL 支持在单页面应用中多次进入和退出 3D 场景

---

### 需求 2：语义对象建模与标识

**User Story**: As a 开发者, I want 所有 3D 对象都具备明确的语义身份, so that 系统可以理解对象的业务含义而非仅依赖几何属性

#### Acceptance Criteria

1. THE Mall System SHALL 为每个 Three.js 对象分配唯一的语义标识符
2. WHEN 创建场景对象 THEN THE Mall System SHALL 在 userData 属性中存储 semanticType 和 businessId
3. WHEN 用户交互场景对象 THEN THE Mall System SHALL 通过语义标识而非模型名称识别对象
4. THE Mall System SHALL 支持以下语义类型：Mall、Floor、Area、Store、Product、Entrance、Checkout
5. WHEN 查询场景对象 THEN THE Mall System SHALL 提供基于语义类型的过滤与检索能力

---

### 需求 3：分层架构实现

**User Story**: As a 系统架构师, I want 实现清晰的四层架构, so that 系统具备可维护性、可测试性和可扩展性

#### Acceptance Criteria

1. THE Mall System SHALL 实现 UI 层、业务协调层、领域场景层、渲染引擎层四层架构
2. THE UI Layer SHALL NOT 直接调用 Three.js API
3. THE UI Layer SHALL NOT 解析 AI 返回结果的内部结构
4. THE Orchestrator SHALL 作为所有 Action 的唯一入口
5. THE Domain Layer SHALL 提供语义级别的行为接口
6. THE Three Core SHALL NOT 包含任何业务逻辑或语义理解能力
7. WHEN 跨层调用发生 THEN THE Mall System SHALL 仅允许上层依赖下层

---

### 需求 4：Action 协议与行为控制

**User Story**: As a 系统, I want 统一的行为协议, so that 来自 UI 和 AI 的操作可以被一致地校验和执行

#### Acceptance Criteria

1. THE Mall System SHALL 定义标准化的 Action 数据结构，包含 type、payload 和 source 字段
2. WHEN 接收到 Action THEN THE Orchestrator SHALL 校验 Action 的格式合法性
3. WHEN 接收到 Action THEN THE Orchestrator SHALL 校验当前用户的权限
4. WHEN 接收到 Action THEN THE Orchestrator SHALL 校验当前系统上下文的合法性
5. IF Action 校验失败 THEN THE Mall System SHALL 拒绝执行并返回明确的错误信息
6. WHEN Action 校验通过 THEN THE Orchestrator SHALL 将其分发到对应的领域场景处理器
7. THE Mall System SHALL 记录所有 Action 的执行日志以支持调试与追踪

---

### 需求 5：AI Agent 集成与约束

**User Story**: As a 用户, I want 通过自然语言与商城交互, so that 我可以用最自然的方式完成导购任务

#### Acceptance Criteria

1. WHEN 用户输入自然语言指令 THEN THE Agent Module SHALL 解析意图并生成结构化 Action
2. THE Agent Module SHALL NOT 直接操作 Three.js API
3. THE Agent Module SHALL NOT 直接修改前端状态
4. THE Agent Module SHALL NOT 绕过 Orchestrator 执行操作
5. WHEN AI 生成的 Action 涉及数据或结构变更 THEN THE Mall System SHALL 要求用户确认
6. IF AI 输出不符合 Action 协议 THEN THE Mall System SHALL 拒绝执行并提示用户
7. WHEN AI 生成 Action THEN THE Mall System SHALL 对其应用与 UI 触发相同的权限校验规则

---

### 需求 6：角色与权限管理（RCAC）

**User Story**: As a 系统管理员, I want 不同角色具备不同权限, so that 系统可以安全地支持多角色协作

#### Acceptance Criteria

1. THE Mall System SHALL 支持 Admin、Merchant、User 三种角色
2. WHEN 执行 Action THEN THE Orchestrator SHALL 校验 Role、Capability 和 Context 三个维度
3. THE Admin SHALL 拥有商城全局结构的编辑权限
4. THE Merchant SHALL ONLY 编辑自身店铺的内容
5. THE Merchant SHALL NOT 编辑其他商家的店铺
6. THE User SHALL NOT 访问配置态页面
7. THE User SHALL NOT 执行任何编辑操作
8. WHEN 权限校验失败 THEN THE Mall System SHALL 返回明确的权限不足提示

---

### 需求 7：配置态与运行态

**User Story**: As a 商家, I want 在配置态编辑店铺内容, so that 我可以管理商品和布局而不影响用户浏览体验

#### Acceptance Criteria

1. THE Mall System SHALL 支持 CONFIG 和 RUNTIME 两种系统模式
2. WHEN 进入配置态 THEN THE Mall System SHALL 启用编辑工具和配置面板
3. WHEN 进入配置态 THEN THE Mall System SHALL 显示辅助网格和坐标轴
4. WHILE 在运行态 THEN THE Mall System SHALL 禁用所有编辑操作
5. WHILE 在运行态 THEN THE Mall System SHALL 隐藏所有编辑工具
6. THE User SHALL NOT 进入配置态
7. WHEN 模式切换 THEN THE Mall System SHALL 保存当前状态并重新加载场景

---

### 需求 8：动态路由树

**User Story**: As a 系统, I want 基于角色的动态路由, so that 不同用户看到不同的页面结构

#### Acceptance Criteria

1. WHEN 用户登录 THEN THE Mall System SHALL 从后端获取该用户可访问的路由树
2. THE Mall System SHALL 校验路由树的结构与权限合法性
3. WHEN 路由树校验通过 THEN THE Mall System SHALL 动态注入路由到 Vue Router
4. THE Mall System SHALL 维护组件白名单映射表
5. IF 路由树包含未授权组件 THEN THE Mall System SHALL 拒绝注入该路由
6. WHEN 用户角色变更 THEN THE Mall System SHALL 刷新路由树并回退到安全页面
7. THE Agent Module SHALL NOT 绕过路由守卫强制跳转页面

---

### 需求 9：数据驱动渲染

**User Story**: As a 开发者, I want 商城结构由数据驱动, so that 系统可以灵活配置而无需修改代码

#### Acceptance Criteria

1. THE Mall System SHALL 从配置数据加载商城的楼层、区域和店铺结构
2. THE Mall System SHALL 从配置数据加载店铺的商品和布局信息
3. WHEN 商城数据更新 THEN THE Mall System SHALL 重新渲染场景而不重启应用
4. THE Three Core SHALL NOT 包含硬编码的商城结构
5. THE Domain Layer SHALL 提供数据到场景对象的映射能力
6. WHEN 数据格式错误 THEN THE Mall System SHALL 拒绝加载并提示错误信息

---

### 需求 10：状态管理（SSOT）

**User Story**: As a 系统, I want 单一事实源的状态管理, so that 避免状态不一致和难以调试的问题

#### Acceptance Criteria

1. THE Mall System SHALL 使用 Pinia 作为唯一的状态管理工具
2. THE Three.js Scene SHALL NOT 存储业务状态
3. THE 2D UI Components SHALL NOT 存储核心业务状态
4. WHEN 状态变更 THEN THE Mall System SHALL 通知所有订阅者
5. THE Mall System SHALL 将用户角色、当前模式、选中对象等核心状态存储在 Pinia Store 中
6. WHEN 组件需要状态 THEN THE Mall System SHALL 从 Pinia Store 读取而非本地缓存

---

### 需求 11：场景交互与事件抽象

**User Story**: As a 用户, I want 与 3D 场景中的对象交互, so that 我可以查看店铺信息和导航到目标位置

#### Acceptance Criteria

1. WHEN 用户点击场景对象 THEN THE Mall System SHALL 触发 scene.click 事件
2. WHEN 用户悬停在场景对象上 THEN THE Mall System SHALL 触发 scene.focus 事件
3. WHEN 用户进入某个区域范围 THEN THE Mall System SHALL 触发 scene.enter 事件
4. WHEN 用户离开某个区域范围 THEN THE Mall System SHALL 触发 scene.leave 事件
5. THE Mall System SHALL 将底层 Three.js 事件抽象为语义化的场景事件
6. WHEN 场景事件触发 THEN THE Mall System SHALL 通过 Orchestrator 转换为 Action

---

### 需求 12：导航与高亮行为

**User Story**: As a 用户, I want 导航到指定店铺并高亮显示, so that 我可以快速找到目标位置

#### Acceptance Criteria

1. WHEN 用户请求导航到店铺 THEN THE Domain Layer SHALL 计算相机目标位置和角度
2. WHEN 导航开始 THEN THE Mall System SHALL 平滑移动相机到目标位置
3. WHEN 导航完成 THEN THE Mall System SHALL 高亮显示目标店铺
4. WHEN 店铺被高亮 THEN THE Mall System SHALL 改变该店铺的材质或添加发光效果
5. WHEN 用户取消高亮 THEN THE Mall System SHALL 恢复店铺的原始外观
6. THE Mall System SHALL 支持同时高亮多个对象

---

### 需求 13：楼层切换

**User Story**: As a 用户, I want 切换商城楼层, so that 我可以浏览不同楼层的店铺

#### Acceptance Criteria

1. WHEN 用户请求切换楼层 THEN THE Domain Layer SHALL 隐藏当前楼层的所有对象
2. WHEN 楼层切换 THEN THE Domain Layer SHALL 显示目标楼层的所有对象
3. WHEN 楼层切换 THEN THE Mall System SHALL 调整相机位置以适配新楼层
4. WHEN 楼层切换中 THEN THE Mall System SHALL 禁用用户交互
5. WHEN 楼层切换完成 THEN THE Mall System SHALL 恢复用户交互能力
6. THE Mall System SHALL 支持楼层切换的过渡动画

---

### 需求 14：性能与渲染优化

**User Story**: As a 用户, I want 流畅的 3D 浏览体验, so that 我可以舒适地探索商城

#### Acceptance Criteria

1. THE Mall System SHALL 采用按需渲染策略
2. WHEN 场景静止且无动画 THEN THE Mall System SHALL 暂停渲染循环
3. WHEN 发生用户交互或动画 THEN THE Mall System SHALL 恢复渲染循环
4. THE Mall System SHALL 使用低多边形模型表示人物和装饰物
5. THE Mall System SHALL 复用几何体和材质以减少内存占用
6. THE Mall System SHALL 按楼层或区域分批加载模型
7. THE Mall System SHALL 在主流设备上保持 30 FPS 以上的帧率

---

### 需求 15：多用户在线状态同步

**User Story**: As a 用户, I want 看到其他在线用户的位置, so that 我可以感知商城的活跃度

#### Acceptance Criteria

1. WHEN 用户进入商城 THEN THE Mall System SHALL 通过 WebSocket 连接到同步服务器
2. WHEN 用户移动 THEN THE Mall System SHALL 广播位置更新到其他客户端
3. WHEN 接收到其他用户位置 THEN THE Mall System SHALL 更新对应的人物模型位置
4. WHEN 用户连接中断 THEN THE Mall System SHALL 将该用户标记为 DISCONNECTED 状态
5. WHEN 用户持续离线超过阈值 THEN THE Mall System SHALL 隐藏该用户的人物模型
6. WHEN 用户重新连接 THEN THE Mall System SHALL 恢复该用户的人物模型显示
7. THE Mall System SHALL 使用状态机管理用户在线状态（ONLINE / DISCONNECTED / OFFLINE）

---

### 需求 16：错误处理与用户反馈

**User Story**: As a 用户, I want 清晰的错误提示, so that 我可以理解系统状态并采取正确操作

#### Acceptance Criteria

1. WHEN 系统发生错误 THEN THE Mall System SHALL 显示用户友好的错误消息
2. WHEN Action 执行失败 THEN THE Mall System SHALL 返回结构化的错误信息
3. THE Mall System SHALL 区分以下错误类型：权限不足、目标未就绪、上下文不匹配、网络错误
4. WHEN 资源加载失败 THEN THE Mall System SHALL 显示加载失败提示并提供重试选项
5. WHEN AI 输出无效 Action THEN THE Mall System SHALL 提示用户重新表达意图
6. THE Mall System SHALL NOT 向用户暴露技术栈错误信息

---

### 需求 17：配置数据验证

**User Story**: As a 管理员, I want 系统验证配置数据的合法性, so that 避免错误配置导致系统崩溃

#### Acceptance Criteria

1. WHEN 加载商城配置数据 THEN THE Mall System SHALL 验证数据结构的完整性
2. WHEN 加载商城配置数据 THEN THE Mall System SHALL 验证必填字段的存在性
3. WHEN 加载商城配置数据 THEN THE Mall System SHALL 验证数据类型的正确性
4. IF 配置数据验证失败 THEN THE Mall System SHALL 拒绝加载并显示详细错误信息
5. THE Mall System SHALL 验证楼层、区域、店铺之间的引用关系
6. THE Mall System SHALL 验证空间坐标的合理性

---

### 需求 18：响应式布局与适配

**User Story**: As a 用户, I want 系统适配不同屏幕尺寸, so that 我可以在不同设备上使用商城

#### Acceptance Criteria

1. WHEN 窗口尺寸变化 THEN THE Mall System SHALL 调整渲染器和相机的宽高比
2. WHEN 窗口尺寸变化 THEN THE Mall System SHALL 调整 2D UI 面板的布局
3. THE Mall System SHALL 在移动设备上提供触摸控制支持
4. THE Mall System SHALL 在桌面设备上提供鼠标和键盘控制支持
5. WHEN 设备性能较低 THEN THE Mall System SHALL 降低渲染质量以保证流畅度

---

### 需求 19：日志与调试支持

**User Story**: As a 开发者, I want 完善的日志系统, so that 我可以快速定位和解决问题

#### Acceptance Criteria

1. THE Mall System SHALL 记录所有 Action 的执行过程
2. THE Mall System SHALL 记录权限校验的结果
3. THE Mall System SHALL 记录场景加载和资源释放的时间点
4. THE Mall System SHALL 提供日志级别控制（DEBUG / INFO / WARN / ERROR）
5. WHEN 开发模式 THEN THE Mall System SHALL 输出详细的调试信息
6. WHEN 生产模式 THEN THE Mall System SHALL 仅输出错误和警告信息

---

### 需求 20：可访问性支持

**User Story**: As a 视障用户, I want 基本的可访问性支持, so that 我可以理解商城的结构和内容

#### Acceptance Criteria

1. THE Mall System SHALL 为所有交互元素提供键盘访问支持
2. THE Mall System SHALL 为场景对象提供文本描述
3. WHEN 用户使用屏幕阅读器 THEN THE Mall System SHALL 提供语义化的 ARIA 标签
4. THE Mall System SHALL 提供高对比度模式选项
5. THE Mall System SHALL 支持通过键盘快捷键执行常用操作

---

## 需求优先级说明

### P0（核心功能，必须实现）
- 需求 1：三维场景渲染与生命周期管理
- 需求 2：语义对象建模与标识
- 需求 3：分层架构实现
- 需求 4：Action 协议与行为控制
- 需求 9：数据驱动渲染
- 需求 10：状态管理（SSOT）

### P1（重要功能，应当实现）
- 需求 5：AI Agent 集成与约束
- 需求 6：角色与权限管理（RCAC）
- 需求 7：配置态与运行态
- 需求 11：场景交互与事件抽象
- 需求 12：导航与高亮行为
- 需求 13：楼层切换
- 需求 16：错误处理与用户反馈

### P2（增强功能，可选实现）
- 需求 8：动态路由树
- 需求 14：性能与渲染优化
- 需求 15：多用户在线状态同步
- 需求 17：配置数据验证
- 需求 18：响应式布局与适配
- 需求 19：日志与调试支持

### P3（辅助功能，可选实现）
- 需求 20：可访问性支持

---

## 需求追踪矩阵

本文档中的所有需求将在后续的设计文档（DESIGN.md）和任务清单（tasks.md）中被引用和追踪。每个设计决策和实现任务都应明确标注其对应的需求编号。

---


---

### 需求 21：区域建模权限申请与审批

**User Story**: As a 商家, I want 申请特定区域的建模权限, so that 我可以在授权区域内自定义店铺布局和商品陈列

#### Acceptance Criteria

1. WHEN 商家进入商城 THEN THE Mall System SHALL 显示所有可申请建模权的区域
2. WHEN 商家选择某个区域 THEN THE Mall System SHALL 显示该区域的详细信息和申请入口
3. WHEN 商家提交建模权申请 THEN THE Mall System SHALL 要求填写申请理由
4. WHEN 申请提交成功 THEN THE Mall System SHALL 将区域状态标记为 PENDING 并通知管理员
5. THE Mall System SHALL 阻止商家对未授权区域的任何编辑操作
6. WHEN 管理员审批通过 THEN THE Mall System SHALL 更新区域状态为 AUTHORIZED 并通知商家
7. WHEN 管理员拒绝申请 THEN THE Mall System SHALL 恢复区域状态为 LOCKED 并说明拒绝理由

---

### 需求 22：商家建模沙盒约束

**User Story**: As a 系统, I want 限制商家只能在授权区域内建模, so that 防止越界编辑和空间冲突

#### Acceptance Criteria

1. WHEN 商家进入 Builder 模式 THEN THE Mall System SHALL 只允许编辑已授权的区域
2. WHEN 商家尝试拖拽对象到授权区域外 THEN THE Mall System SHALL 阻止该操作并提示边界限制
3. WHEN 商家尝试编辑其他区域的对象 THEN THE Mall System SHALL 拒绝操作并提示权限不足
4. THE Mall System SHALL 在 3D 场景中可视化显示授权区域边界
5. WHEN 商家尝试修改区域边界 THEN THE Mall System SHALL 阻止该操作
6. WHEN 商家尝试删除其他商家的对象 THEN THE Mall System SHALL 拒绝操作
7. THE Mall System SHALL 实时校验所有编辑操作是否在授权范围内

---

### 需求 23：建模变更提案与审核

**User Story**: As a 商家, I want 提交建模变更供管理员审核, so that 我的设计可以在审核通过后发布到商城

#### Acceptance Criteria

1. WHEN 商家完成区域建模 THEN THE Mall System SHALL 提供"提交变更"功能
2. WHEN 商家提交变更 THEN THE Mall System SHALL 收集所有新增、修改、删除的对象信息
3. WHEN 变更提交成功 THEN THE Mall System SHALL 创建变更提案并通知管理员
4. THE Mall System SHALL 允许商家在提交后继续编辑而不影响已提交版本
5. WHEN 管理员查看变更提案 THEN THE Mall System SHALL 提供 3D 预览功能
6. WHEN 管理员审核变更 THEN THE Mall System SHALL 提供合并、驳回、暂存三种选项
7. WHEN 变更被驳回 THEN THE Mall System SHALL 通知商家并说明驳回理由

---

### 需求 24：Layout 版本管理

**User Story**: As a 管理员, I want 管理商城布局的多个版本, so that 我可以控制发布时机并支持版本回滚

#### Acceptance Criteria

1. THE Mall System SHALL 为每次 Layout 变更创建新版本
2. WHEN 创建新版本 THEN THE Mall System SHALL 记录版本号、创建者、创建时间和变更描述
3. THE Mall System SHALL 支持 DRAFT、ACTIVE、ARCHIVED 三种版本状态
4. WHEN 管理员发布版本 THEN THE Mall System SHALL 将该版本状态设置为 ACTIVE
5. WHEN 新版本发布 THEN THE Mall System SHALL 将旧版本状态设置为 ARCHIVED
6. THE Mall System SHALL 允许管理员查看和预览任意历史版本
7. WHEN 新用户进入商城 THEN THE Mall System SHALL 加载最新 ACTIVE 版本

---

### 需求 25：在线用户版本更新通知

**User Story**: As a 在线用户, I want 收到商城布局更新通知, so that 我可以选择刷新场景查看最新内容

#### Acceptance Criteria

1. WHEN 新 Layout 版本发布 THEN THE Mall System SHALL 通过 WebSocket 推送更新通知
2. WHEN 在线用户收到更新通知 THEN THE Mall System SHALL 显示"商城布局已更新"提示
3. THE Mall System SHALL 提供"立即刷新"和"稍后刷新"两个选项
4. WHEN 用户选择立即刷新 THEN THE Mall System SHALL 重新加载场景并应用新版本
5. WHEN 用户选择稍后刷新 THEN THE Mall System SHALL 在用户下次进入时应用新版本
6. THE Mall System SHALL 在版本切换过程中显示加载进度
7. WHEN 版本切换完成 THEN THE Mall System SHALL 恢复用户之前的视角和位置

---

### 需求 26：区域状态可视化

**User Story**: As a 商家, I want 清晰地看到每个区域的状态, so that 我可以了解哪些区域可申请、哪些已被占用

#### Acceptance Criteria

1. WHEN 商家进入商城 THEN THE Mall System SHALL 用不同颜色标识不同状态的区域
2. THE Mall System SHALL 为 LOCKED 区域显示"可申请"标识
3. THE Mall System SHALL 为 PENDING 区域显示"审批中"标识
4. THE Mall System SHALL 为 AUTHORIZED 区域显示授权商家信息
5. THE Mall System SHALL 为 OCCUPIED 区域显示"已占用"标识
6. WHEN 商家悬停在区域上 THEN THE Mall System SHALL 显示区域详细信息
7. THE Mall System SHALL 提供区域状态筛选功能

---

### 需求 27：建模权限撤销

**User Story**: As a 管理员, I want 撤销商家的建模权限, so that 我可以处理违规行为或重新分配区域

#### Acceptance Criteria

1. WHEN 管理员选择撤销权限 THEN THE Mall System SHALL 要求填写撤销理由
2. WHEN 权限撤销确认 THEN THE Mall System SHALL 更新区域状态为 LOCKED
3. WHEN 权限被撤销 THEN THE Mall System SHALL 立即通知商家
4. WHEN 商家正在编辑被撤销的区域 THEN THE Mall System SHALL 强制退出 Builder 模式
5. THE Mall System SHALL 保留商家已提交但未发布的变更提案
6. THE Mall System SHALL 记录撤销操作的时间、操作者和理由
7. WHEN 权限撤销后 THEN THE Mall System SHALL 允许其他商家申请该区域

---

### 需求 28：建模操作边界校验

**User Story**: As a 系统, I want 实时校验所有建模操作的合法性, so that 防止数据损坏和越权操作

#### Acceptance Criteria

1. WHEN 商家添加对象 THEN THE Mall System SHALL 校验对象位置是否在授权区域内
2. WHEN 商家移动对象 THEN THE Mall System SHALL 校验目标位置是否在授权区域内
3. WHEN 商家删除对象 THEN THE Mall System SHALL 校验对象是否属于授权区域
4. WHEN 商家修改对象属性 THEN THE Mall System SHALL 校验对象是否属于授权区域
5. IF 任何操作违反边界约束 THEN THE Mall System SHALL 拒绝操作并显示明确错误信息
6. THE Mall System SHALL 在操作前进行校验而非操作后回滚
7. THE Mall System SHALL 记录所有被拒绝的操作尝试

---

## 需求优先级更新

### P0（核心功能，必须实现）
- 需求 1：三维场景渲染与生命周期管理
- 需求 2：语义对象建模与标识
- 需求 3：分层架构实现
- 需求 4：Action 协议与行为控制
- 需求 6：角色与权限管理（RCAC）
- 需求 9：数据驱动渲染
- 需求 10：状态管理（SSOT）
- **需求 21：区域建模权限申请与审批**
- **需求 22：商家建模沙盒约束**

### P1（重要功能，应当实现）
- 需求 5：AI Agent 集成与约束
- 需求 7：配置态与运行态
- 需求 11：场景交互与事件抽象
- 需求 12：导航与高亮行为
- 需求 13：楼层切换
- 需求 16：错误处理与用户反馈
- **需求 23：建模变更提案与审核**
- **需求 24：Layout 版本管理**
- **需求 26：区域状态可视化**
- **需求 28：建模操作边界校验**

### P2（增强功能，可选实现）
- 需求 8：动态路由树
- 需求 14：性能与渲染优化
- 需求 15：多用户在线状态同步
- 需求 17：配置数据验证
- 需求 18：响应式布局与适配
- 需求 19：日志与调试支持
- **需求 25：在线用户版本更新通知**
- **需求 27：建模权限撤销**

### P3（辅助功能，可选实现）
- 需求 20：可访问性支持

---



### 需求 29：AI Agent RAG 知识检索集成

**User Story**: As a AI Agent, I want 从 RAG 向量数据库检索商城知识, so that 我可以基于准确的事实信息为用户提供导购服务

#### Acceptance Criteria

1. WHEN Agent 需要决策导航目标 THEN THE Mall System SHALL 从 world_facts 集合检索店铺位置信息
2. WHEN Agent 需要回答用户主观问题 THEN THE Mall System SHALL 从 reviews 集合检索用户评价
3. WHEN Agent 生成 Action 前 THEN THE Mall System SHALL 从 rules 集合检索行为约束规则
4. THE Mall System SHALL 支持多路检索，同时查询多个 RAG 集合
5. THE Mall System SHALL 对检索结果按相关性分数排序
6. WHEN 检索结果为空 THEN THE Mall System SHALL 返回明确的"未找到相关信息"提示
7. THE Agent Module SHALL NOT 混淆不同 RAG 集合的数据用途

---

### 需求 30：RAG 数据类型区分与用途隔离

**User Story**: As a 系统, I want 严格区分三类 RAG 数据的用途, so that Agent 不会将评论当作事实、不会将事实当作规则

#### Acceptance Criteria

1. THE Mall System SHALL 将 RAG 数据分为三类：世界事实（world_facts）、用户评论（reviews）、规则指南（rules）
2. WHEN Agent 执行导航决策 THEN THE Mall System SHALL 仅使用 world_facts 和 rules 数据
3. WHEN Agent 回答"好不好/值不值"类问题 THEN THE Mall System SHALL 使用 reviews 数据
4. THE Mall System SHALL NOT 将 reviews 数据用于 Action 决策
5. THE Mall System SHALL NOT 将 world_facts 数据用于主观评价回答
6. WHEN rules 集合返回 CRITICAL 优先级规则 THEN THE Agent SHALL 强制遵守该规则
7. THE Mall System SHALL 在 Agent 上下文中明确标注每条检索结果的数据类型

---

### 需求 31：RAG 检索结果展示与溯源

**User Story**: As a 用户, I want 了解 AI 回答的信息来源, so that 我可以判断信息的可信度

#### Acceptance Criteria

1. WHEN Agent 基于 RAG 数据回答问题 THEN THE Mall System SHALL 提供信息来源标注
2. WHEN 回答基于 world_facts THEN THE Mall System SHALL 标注为"商城信息"
3. WHEN 回答基于 reviews THEN THE Mall System SHALL 标注为"用户评价"并显示评分
4. THE Mall System SHALL 支持用户点击查看原始评论详情
5. WHEN 多条评论观点冲突 THEN THE Mall System SHALL 展示多元观点而非单一结论
6. THE Mall System SHALL 在 UI 中区分"客观事实"与"主观评价"的展示样式

---

## 需求优先级汇总（含 RAG 需求）

### P0（核心功能，必须实现）
- 需求 1：三维场景渲染与生命周期管理
- 需求 2：语义对象建模与标识
- 需求 3：分层架构实现
- 需求 4：Action 协议与行为控制
- 需求 6：角色与权限管理（RCAC）
- 需求 9：数据驱动渲染
- 需求 10：状态管理（SSOT）
- 需求 21：区域建模权限申请与审批
- 需求 22：商家建模沙盒约束

### P1（重要功能，应当实现）
- 需求 5：AI Agent 集成与约束
- 需求 7：配置态与运行态
- 需求 11：场景交互与事件抽象
- 需求 12：导航与高亮行为
- 需求 13：楼层切换
- 需求 16：错误处理与用户反馈
- 需求 23：建模变更提案与审核
- 需求 24：Layout 版本管理
- 需求 26：区域状态可视化
- 需求 28：建模操作边界校验
- **需求 29：AI Agent RAG 知识检索集成**
- **需求 30：RAG 数据类型区分与用途隔离**

### P2（增强功能，可选实现）
- 需求 8：动态路由树
- 需求 14：性能与渲染优化
- 需求 15：多用户在线状态同步
- 需求 17：配置数据验证
- 需求 18：响应式布局与适配
- 需求 19：日志与调试支持
- 需求 25：在线用户版本更新通知
- 需求 27：建模权限撤销
- **需求 31：RAG 检索结果展示与溯源**

### P3（辅助功能，可选实现）
- 需求 20：可访问性支持

---
