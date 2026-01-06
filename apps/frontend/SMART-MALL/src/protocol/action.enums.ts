/**
 * ============================================================================
 * Action 协议 - 枚举定义 (action.enums.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 定义系统中所有可执行的行为类型（ActionType）和行为来源（ActionSource）。
 * 这是 Protocol 层的核心枚举文件，为整个系统提供统一的行为分类标准。
 * 
 * 【业务背景】
 * 智慧商城系统采用"行为驱动"架构，所有用户操作、AI 指令、系统事件
 * 都被抽象为统一的 Action。这种设计带来以下业务价值：
 * 
 * 1. 可追溯性：每个操作都有明确的类型标识，便于日志记录和问题排查
 * 2. 权限控制：基于 ActionType 进行细粒度的权限检查
 * 3. AI 集成：AI Agent 可以通过发送 Action 来控制系统
 * 4. 撤销/重做：基于 Action 历史实现操作的撤销和重做
 * 
 * 【设计原则】
 * 1. 命名空间化：使用 "domain.action" 格式（如 navigation.navigateToStore）
 * 2. 语义明确：枚举值应清晰表达业务意图
 * 3. 分类清晰：按业务领域分组（导航、场景、UI、配置、权限、布局、建模）
 * 
 * 【与其他模块的关系】
 * - action.protocol.ts：使用这些枚举定义 Action 的 Payload 类型映射
 * - domain/behaviors/：各行为处理器根据 ActionType 执行具体逻辑
 * - stores/：Store 监听特定 ActionType 更新状态
 * 
 * ============================================================================
 */

/**
 * Action 类型枚举
 * 
 * 定义系统中所有可执行的行为类型，按业务领域分组：
 * 
 * 【导航类 (Navigation)】
 * 控制 3D 场景中的相机移动和视角切换
 * - NAVIGATE_TO_STORE: 导航到指定店铺（相机飞行到店铺位置）
 * - NAVIGATE_TO_AREA: 导航到指定区域（如某楼层的某个分区）
 * - NAVIGATE_TO_POSITION: 导航到精确坐标位置
 * 
 * 【场景交互类 (Scene)】
 * 控制 3D 场景中对象的视觉效果
 * - HIGHLIGHT_STORE: 高亮显示店铺（用于搜索结果、推荐展示）
 * - HIGHLIGHT_AREA: 高亮显示区域（用于区域选择、权限可视化）
 * - CLEAR_HIGHLIGHT: 清除高亮效果
 * 
 * 【UI 类】
 * 控制界面面板的显示/隐藏
 * - UI_OPEN_PANEL: 打开面板（如店铺详情、设置面板）
 * - UI_CLOSE_PANEL: 关闭面板
 * - UI_TOGGLE_PANEL: 切换面板显示状态
 * 
 * 【配置类 (Config)】
 * 商家对自己店铺的配置操作
 * - CONFIG_EDIT_STORE: 编辑店铺信息（名称、描述、Logo）
 * - CONFIG_ADD_PRODUCT: 添加商品
 * - CONFIG_REMOVE_PRODUCT: 移除商品
 * - CONFIG_UPDATE_PRODUCT: 更新商品信息
 * - CONFIG_MOVE_OBJECT: 移动 3D 对象位置
 * - CONFIG_DELETE_OBJECT: 删除 3D 对象
 * 
 * 【权限类 (Permission)】
 * 商家建模权限的申请和审批流程
 * - PERMISSION_APPLY: 商家申请区域建模权限
 * - PERMISSION_APPROVE: 管理员批准权限申请
 * - PERMISSION_REJECT: 管理员拒绝权限申请
 * - PERMISSION_REVOKE: 管理员撤销已授予的权限
 * 
 * 【布局类 (Layout)】
 * 商城整体布局的版本管理
 * - LAYOUT_SUBMIT_PROPOSAL: 提交布局修改提案
 * - LAYOUT_REVIEW_PROPOSAL: 审核布局提案
 * - LAYOUT_PUBLISH_VERSION: 发布布局版本
 * - LAYOUT_SWITCH_VERSION: 切换到指定布局版本
 * 
 * 【建模类 (Builder)】
 * 3D 建模模式下的操作
 * - BUILDER_ENTER: 进入建模模式
 * - BUILDER_EXIT: 退出建模模式
 * - BUILDER_ADD_OBJECT: 添加 3D 对象
 * - BUILDER_MODIFY_OBJECT: 修改 3D 对象属性
 * - BUILDER_DELETE_OBJECT: 删除 3D 对象
 */
export enum ActionType {
  // ===== 导航类 (Navigation) - 控制 3D 场景相机移动 =====
  /** 导航到指定店铺（相机飞行到店铺位置，聚焦店铺） */
  NAVIGATE_TO_STORE = 'navigation.navigateToStore',
  /** 导航到指定区域（如某楼层的某个分区） */
  NAVIGATE_TO_AREA = 'navigation.navigateToArea',
  /** 导航到精确坐标位置（用于 AI 指令或精确定位） */
  NAVIGATE_TO_POSITION = 'navigation.navigateToPosition',

  // ===== 场景交互类 (Scene) - 控制 3D 对象视觉效果 =====
  /** 高亮显示店铺（用于搜索结果、推荐展示） */
  HIGHLIGHT_STORE = 'scene.highlightStore',
  /** 高亮显示区域（用于区域选择、权限可视化） */
  HIGHLIGHT_AREA = 'scene.highlightArea',
  /** 清除高亮效果（恢复正常显示） */
  CLEAR_HIGHLIGHT = 'scene.clearHighlight',

  // ===== UI 类 - 控制界面面板显示 =====
  /** 打开面板（如店铺详情、设置面板） */
  UI_OPEN_PANEL = 'ui.openPanel',
  /** 关闭面板 */
  UI_CLOSE_PANEL = 'ui.closePanel',
  /** 切换面板显示状态（显示↔隐藏） */
  UI_TOGGLE_PANEL = 'ui.togglePanel',

  // ===== 配置类 (Config) - 商家店铺配置操作 =====
  /** 编辑店铺信息（名称、描述、Logo、营业状态） */
  CONFIG_EDIT_STORE = 'config.editStore',
  /** 添加商品到店铺 */
  CONFIG_ADD_PRODUCT = 'config.addProduct',
  /** 从店铺移除商品 */
  CONFIG_REMOVE_PRODUCT = 'config.removeProduct',
  /** 更新商品信息（价格、库存、描述等） */
  CONFIG_UPDATE_PRODUCT = 'config.updateProduct',
  /** 移动 3D 对象位置（拖拽调整） */
  CONFIG_MOVE_OBJECT = 'config.moveObject',
  /** 删除 3D 对象 */
  CONFIG_DELETE_OBJECT = 'config.deleteObject',

  // ===== 权限类 (Permission) - 建模权限申请和审批 =====
  /** 商家申请区域建模权限 */
  PERMISSION_APPLY = 'permission.apply',
  /** 管理员批准权限申请 */
  PERMISSION_APPROVE = 'permission.approve',
  /** 管理员拒绝权限申请 */
  PERMISSION_REJECT = 'permission.reject',
  /** 管理员撤销已授予的权限 */
  PERMISSION_REVOKE = 'permission.revoke',

  // ===== 布局类 (Layout) - 商城布局版本管理 =====
  /** 提交布局修改提案（商家提交，等待审核） */
  LAYOUT_SUBMIT_PROPOSAL = 'layout.submitProposal',
  /** 审核布局提案（管理员审核） */
  LAYOUT_REVIEW_PROPOSAL = 'layout.reviewProposal',
  /** 发布布局版本（将草稿发布为正式版本） */
  LAYOUT_PUBLISH_VERSION = 'layout.publishVersion',
  /** 切换到指定布局版本（版本回滚或预览） */
  LAYOUT_SWITCH_VERSION = 'layout.switchVersion',

  // ===== 建模类 (Builder) - 3D 建模模式操作 =====
  /** 进入建模模式（开始编辑 3D 场景） */
  BUILDER_ENTER = 'builder.enter',
  /** 退出建模模式（保存或放弃更改） */
  BUILDER_EXIT = 'builder.exit',
  /** 添加 3D 对象（货架、装饰物等） */
  BUILDER_ADD_OBJECT = 'builder.addObject',
  /** 修改 3D 对象属性（位置、旋转、缩放、材质） */
  BUILDER_MODIFY_OBJECT = 'builder.modifyObject',
  /** 删除 3D 对象 */
  BUILDER_DELETE_OBJECT = 'builder.deleteObject'
}

/**
 * Action 来源枚举
 * 
 * 标识 Action 的触发来源，用于：
 * 1. 日志记录：区分操作是用户手动触发还是系统自动触发
 * 2. 权限检查：某些操作可能只允许特定来源
 * 3. 行为分析：统计用户操作 vs AI 操作的比例
 * 
 * 【来源类型】
 * - UI: 用户通过界面交互触发（点击按钮、拖拽对象等）
 * - AGENT: AI Agent 通过自然语言理解后触发（语音助手、智能推荐）
 * - SYSTEM: 系统内部自动触发（定时任务、状态同步、初始化）
 * 
 * 【业务场景示例】
 * - 用户点击"导航到星巴克" → source: UI
 * - 用户说"带我去星巴克" → AI 解析后 → source: AGENT
 * - 系统检测到权限过期自动清除 → source: SYSTEM
 */
export enum ActionSource {
  /** 用户界面交互触发 */
  UI = 'UI',
  /** AI Agent 触发（语音助手、智能推荐等） */
  AGENT = 'AGENT',
  /** 系统内部自动触发（定时任务、状态同步等） */
  SYSTEM = 'SYSTEM'
}
