/**
 * ============================================================================
 * Action 协议 - 类型定义 (action.protocol.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 定义系统中所有行为（Action）的统一表示和各类型的 Payload 结构。
 * 这是 Protocol 层的核心类型文件，确保所有模块使用一致的数据结构。
 * 
 * 【业务背景】
 * 智慧商城系统采用"行为驱动"架构：
 * - 所有操作（无论来自 UI、AI Agent 还是系统内部）都必须通过 Action 协议
 * - Action 是 Orchestrator 层的输入协议
 * - 每种 ActionType 对应特定的 Payload 结构，确保类型安全
 * 
 * 【设计原则】
 * 1. 类型安全：使用 TypeScript 泛型确保 ActionType 与 Payload 的对应关系
 * 2. 可追溯性：每个 Action 包含时间戳、来源、用户ID 等元数据
 * 3. 可扩展性：新增行为只需添加枚举值和对应的 Payload 接口
 * 
 * 【数据流】
 * ```
 * 用户操作/AI指令 → 创建 Action → Orchestrator 分发 → Behavior 处理 → 返回 Result
 * ```
 * 
 * 【与其他模块的关系】
 * - action.enums.ts：提供 ActionType 和 ActionSource 枚举
 * - domain/behaviors/：各行为处理器接收 Action 并执行业务逻辑
 * - stores/：Store 可以监听特定 Action 更新状态
 * - views/：视图层创建 Action 并发送给 Orchestrator
 * 
 * ============================================================================
 */

import type { ActionType, ActionSource } from './action.enums'
import type { Vector3D } from '../domain/scene/scene.types'

/**
 * Action（行为）
 * 
 * 系统中所有行为的统一表示。这是一个泛型接口，通过 ActionType 参数
 * 自动推断对应的 Payload 类型，确保类型安全。
 * 
 * 【核心字段】
 * - type: 行为类型，决定了 payload 的结构
 * - payload: 行为数据，根据 type 不同而不同
 * - source: 行为来源（UI/AGENT/SYSTEM）
 * - timestamp: 时间戳，用于日志和排序
 * 
 * 【可选字段】
 * - userId: 触发用户ID，用于权限检查和审计
 * - sessionId: 会话ID，用于关联同一会话的操作
 * - actionId: 行为ID，用于追踪和日志
 * 
 * @template T - ActionType 枚举值，用于推断 payload 类型
 * 
 * @example
 * ```typescript
 * // 创建导航到店铺的 Action
 * const action: Action<ActionType.NAVIGATE_TO_STORE> = {
 *   type: ActionType.NAVIGATE_TO_STORE,
 *   payload: { storeId: 'store-001', duration: 1000 },
 *   source: ActionSource.UI,
 *   timestamp: Date.now(),
 *   userId: 'user-001'
 * }
 * 
 * // 创建高亮店铺的 Action
 * const highlightAction: Action<ActionType.HIGHLIGHT_STORE> = {
 *   type: ActionType.HIGHLIGHT_STORE,
 *   payload: { storeId: 'store-001', color: '#ff0000' },
 *   source: ActionSource.AGENT,
 *   timestamp: Date.now()
 * }
 * ```
 */
export interface Action<T extends ActionType = ActionType> {
  /** 行为类型 */
  type: T
  /** 行为数据（根据 type 不同而不同） */
  payload: ActionPayloadMap[T]
  /** 行为来源（UI/AGENT/SYSTEM） */
  source: ActionSource
  /** 时间戳 */
  timestamp: number
  /** 触发用户ID（可选） */
  userId?: string
  /** 会话ID（可选） */
  sessionId?: string
  /** 行为ID（用于追踪和日志） */
  actionId?: string
}

// ============================================================================
// 导航类 Payload（Navigation）
// ============================================================================

/**
 * 导航到店铺 Payload
 * 
 * 【业务场景】
 * - 用户在搜索结果中点击店铺
 * - AI 助手推荐店铺后自动导航
 * - 用户点击地图上的店铺标记
 * 
 * @example
 * ```typescript
 * const payload: NavigateToStorePayload = {
 *   storeId: 'store-starbucks-001',
 *   duration: 1500  // 1.5秒飞行动画
 * }
 * ```
 */
export interface NavigateToStorePayload {
  /** 目标店铺 ID */
  storeId: string
  /** 动画持续时间（毫秒），默认 1000ms */
  duration?: number
}

/**
 * 导航到区域 Payload
 * 
 * 【业务场景】
 * - 用户选择楼层后导航到该楼层
 * - 用户点击区域分类（如"餐饮区"）
 * - 管理员查看特定区域
 */
export interface NavigateToAreaPayload {
  /** 目标区域 ID */
  areaId: string
  /** 动画持续时间（毫秒） */
  duration?: number
}

/**
 * 导航到指定位置 Payload
 * 
 * 【业务场景】
 * - AI 助手指定精确坐标
 * - 用户通过坐标输入导航
 * - 系统自动定位到特定位置
 */
export interface NavigateToPositionPayload {
  /** 目标位置坐标 */
  position: Vector3D
  /** 相机看向的目标点（可选） */
  target?: Vector3D
  /** 动画持续时间（毫秒） */
  duration?: number
}

// ============================================================================
// 场景交互类 Payload（Scene Interaction）
// ============================================================================

/**
 * 高亮店铺 Payload
 * 
 * 【业务场景】
 * - 搜索结果高亮显示匹配的店铺
 * - 鼠标悬停时高亮店铺
 * - AI 推荐时高亮推荐的店铺
 */
export interface HighlightStorePayload {
  /** 要高亮的店铺 ID */
  storeId: string
  /** 高亮颜色（可选，如 '#ff0000'） */
  color?: string
}

/**
 * 高亮区域 Payload
 * 
 * 【业务场景】
 * - 显示商家可申请的区域
 * - 显示已授权的区域范围
 * - 区域选择时的视觉反馈
 */
export interface HighlightAreaPayload {
  /** 要高亮的区域 ID */
  areaId: string
  /** 高亮颜色（可选） */
  color?: string
}

/**
 * 清除高亮 Payload
 * 
 * 【业务场景】
 * - 用户点击空白区域
 * - 搜索结果清空
 * - 切换到其他功能
 */
export interface ClearHighlightPayload {
  /** 要清除的对象ID列表（可选，不传则清除所有高亮） */
  objectIds?: string[]
}

// ============================================================================
// UI 交互类 Payload
// ============================================================================

/**
 * 打开面板 Payload
 * 
 * 【业务场景】
 * - 点击店铺打开详情面板
 * - 点击设置按钮打开设置面板
 * - AI 助手打开推荐面板
 */
export interface UIOpenPanelPayload {
  /** 面板 ID（如 'store-detail', 'settings', 'search'） */
  panelId: string
  /** 面板初始数据（可选） */
  data?: Record<string, unknown>
}

/**
 * 关闭面板 Payload
 */
export interface UIClosePanelPayload {
  /** 要关闭的面板 ID */
  panelId: string
}

/**
 * 切换面板 Payload
 * 
 * 如果面板已打开则关闭，如果已关闭则打开。
 */
export interface UITogglePanelPayload {
  /** 要切换的面板 ID */
  panelId: string
}

// ============================================================================
// 配置类 Payload（Config / Write Operations）
// ============================================================================

/**
 * 编辑店铺 Payload
 * 
 * 【业务场景】
 * - 商家编辑自己店铺的基本信息
 * - 管理员修改店铺状态
 * 
 * 【权限要求】
 * - 商家：只能编辑自己的店铺
 * - 管理员：可以编辑任何店铺
 */
export interface ConfigEditStorePayload {
  /** 店铺 ID */
  storeId: string
  /** 要更新的字段 */
  updates: {
    /** 店铺名称 */
    name?: string
    /** 店铺描述 */
    description?: string
    /** Logo URL */
    logoUrl?: string
    /** 是否营业 */
    isOpen?: boolean
  }
}

/**
 * 添加商品 Payload
 * 
 * 【业务场景】
 * - 商家在店铺中添加新商品
 */
export interface ConfigAddProductPayload {
  /** 店铺 ID */
  storeId: string
  /** 商品信息 */
  product: {
    /** 商品名称 */
    name: string
    /** 商品描述 */
    description?: string
    /** 商品价格 */
    price?: number
    imageUrl?: string
    category?: string
  }
}

/**
 * 移除商品 Payload
 */
export interface ConfigRemoveProductPayload {
  storeId: string
  productId: string
}

/**
 * 更新商品 Payload
 */
export interface ConfigUpdateProductPayload {
  storeId: string
  productId: string
  updates: {
    name?: string
    description?: string
    price?: number
    imageUrl?: string
    category?: string
    inStock?: boolean
  }
}

/**
 * 移动对象 Payload
 */
export interface ConfigMoveObjectPayload {
  objectId: string
  position: Vector3D
}

/**
 * 删除对象 Payload
 */
export interface ConfigDeleteObjectPayload {
  objectId: string
}

// ===== Permission Operations Payloads =====

/**
 * 申请建模权限 Payload
 */
export interface PermissionApplyPayload {
  areaId: string
  reason: string
}

/**
 * 批准权限 Payload
 */
export interface PermissionApprovePayload {
  requestId: string
  expiryDuration?: number
}

/**
 * 拒绝权限 Payload
 */
export interface PermissionRejectPayload {
  requestId: string
  reason: string
}

/**
 * 撤销权限 Payload
 */
export interface PermissionRevokePayload {
  areaId: string
  merchantId: string
}

// ===== Layout Management Payloads =====

/**
 * 提交布局提案 Payload
 */
export interface LayoutSubmitProposalPayload {
  areaId: string
  description: string
  changes: Array<{
    type: string
    data: Record<string, unknown>
  }>
}

/**
 * 审核布局提案 Payload
 */
export interface LayoutReviewProposalPayload {
  proposalId: string
  approved: boolean
  comment?: string
}

/**
 * 发布布局版本 Payload
 */
export interface LayoutPublishVersionPayload {
  versionId: string
}

/**
 * 切换布局版本 Payload
 */
export interface LayoutSwitchVersionPayload {
  versionId: string
}

// ===== Builder Mode Payloads =====

/**
 * 进入建模模式 Payload
 */
export interface BuilderEnterPayload {
  areaId: string
}

/**
 * 退出建模模式 Payload
 */
export interface BuilderExitPayload {
  saveChanges: boolean
}

/**
 * 添加对象 Payload
 */
export interface BuilderAddObjectPayload {
  type: string
  position: Vector3D
  properties?: Record<string, unknown>
}

/**
 * 修改对象 Payload
 */
export interface BuilderModifyObjectPayload {
  objectId: string
  properties: Record<string, unknown>
}

/**
 * 删除对象 Payload
 */
export interface BuilderDeleteObjectPayload {
  objectId: string
}

// ===== Action Payload 类型映射 =====

/**
 * ActionPayloadMap
 * 将 ActionType 映射到对应的 Payload 类型
 * 确保类型安全：不同的 ActionType 对应不同的 Payload
 */
export interface ActionPayloadMap {
  // Navigation
  [ActionType.NAVIGATE_TO_STORE]: NavigateToStorePayload
  [ActionType.NAVIGATE_TO_AREA]: NavigateToAreaPayload
  [ActionType.NAVIGATE_TO_POSITION]: NavigateToPositionPayload

  // Scene Interaction
  [ActionType.HIGHLIGHT_STORE]: HighlightStorePayload
  [ActionType.HIGHLIGHT_AREA]: HighlightAreaPayload
  [ActionType.CLEAR_HIGHLIGHT]: ClearHighlightPayload

  // UI
  [ActionType.UI_OPEN_PANEL]: UIOpenPanelPayload
  [ActionType.UI_CLOSE_PANEL]: UIClosePanelPayload
  [ActionType.UI_TOGGLE_PANEL]: UITogglePanelPayload

  // Config
  [ActionType.CONFIG_EDIT_STORE]: ConfigEditStorePayload
  [ActionType.CONFIG_ADD_PRODUCT]: ConfigAddProductPayload
  [ActionType.CONFIG_REMOVE_PRODUCT]: ConfigRemoveProductPayload
  [ActionType.CONFIG_UPDATE_PRODUCT]: ConfigUpdateProductPayload
  [ActionType.CONFIG_MOVE_OBJECT]: ConfigMoveObjectPayload
  [ActionType.CONFIG_DELETE_OBJECT]: ConfigDeleteObjectPayload

  // Permission
  [ActionType.PERMISSION_APPLY]: PermissionApplyPayload
  [ActionType.PERMISSION_APPROVE]: PermissionApprovePayload
  [ActionType.PERMISSION_REJECT]: PermissionRejectPayload
  [ActionType.PERMISSION_REVOKE]: PermissionRevokePayload

  // Layout
  [ActionType.LAYOUT_SUBMIT_PROPOSAL]: LayoutSubmitProposalPayload
  [ActionType.LAYOUT_REVIEW_PROPOSAL]: LayoutReviewProposalPayload
  [ActionType.LAYOUT_PUBLISH_VERSION]: LayoutPublishVersionPayload
  [ActionType.LAYOUT_SWITCH_VERSION]: LayoutSwitchVersionPayload

  // Builder
  [ActionType.BUILDER_ENTER]: BuilderEnterPayload
  [ActionType.BUILDER_EXIT]: BuilderExitPayload
  [ActionType.BUILDER_ADD_OBJECT]: BuilderAddObjectPayload
  [ActionType.BUILDER_MODIFY_OBJECT]: BuilderModifyObjectPayload
  [ActionType.BUILDER_DELETE_OBJECT]: BuilderDeleteObjectPayload
}

/**
 * ActionPayload
 * 所有 Payload 的联合类型
 */
export type ActionPayload = ActionPayloadMap[ActionType]

/**
 * 创建 Action 的辅助函数类型
 */
export type CreateAction<T extends ActionType> = (
  payload: ActionPayloadMap[T],
  source: ActionSource,
  userId?: string
) => Action<T>
