/**
 * Action 协议 - 类型定义
 * 定义系统中所有行为的统一表示
 * 
 * 所有行为（无论来自 UI、AI Agent 还是系统内部）都必须通过 Action 协议
 * 这是 Orchestrator 层的输入协议
 */

import type { ActionType, ActionSource } from './action.enums'
import type { Vector3D } from '../domain/scene/scene.types'

/**
 * Action（行为）
 * 系统中所有行为的统一表示
 * 
 * @example
 * ```typescript
 * const action: Action = {
 *   type: ActionType.NAVIGATE_TO_STORE,
 *   payload: { storeId: 'store-001' },
 *   source: ActionSource.UI,
 *   timestamp: Date.now(),
 *   userId: 'user-001'
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

// ===== Navigation Payloads =====

/**
 * 导航到店铺 Payload
 */
export interface NavigateToStorePayload {
  storeId: string
  /** 动画持续时间（毫秒） */
  duration?: number
}

/**
 * 导航到区域 Payload
 */
export interface NavigateToAreaPayload {
  areaId: string
  duration?: number
}

/**
 * 导航到指定位置 Payload
 */
export interface NavigateToPositionPayload {
  position: Vector3D
  target?: Vector3D
  duration?: number
}

// ===== Scene Interaction Payloads =====

/**
 * 高亮店铺 Payload
 */
export interface HighlightStorePayload {
  storeId: string
  /** 高亮颜色（可选） */
  color?: string
}

/**
 * 高亮区域 Payload
 */
export interface HighlightAreaPayload {
  areaId: string
  color?: string
}

/**
 * 清除高亮 Payload
 */
export interface ClearHighlightPayload {
  /** 要清除的对象ID列表（可选，不传则清除所有） */
  objectIds?: string[]
}

// ===== UI Interaction Payloads =====

/**
 * 打开面板 Payload
 */
export interface UIOpenPanelPayload {
  panelId: string
  /** 面板数据 */
  data?: Record<string, unknown>
}

/**
 * 关闭面板 Payload
 */
export interface UIClosePanelPayload {
  panelId: string
}

/**
 * 切换面板 Payload
 */
export interface UITogglePanelPayload {
  panelId: string
}

// ===== Config / Write Operations Payloads =====

/**
 * 编辑店铺 Payload
 */
export interface ConfigEditStorePayload {
  storeId: string
  updates: {
    name?: string
    description?: string
    logoUrl?: string
    isOpen?: boolean
  }
}

/**
 * 添加商品 Payload
 */
export interface ConfigAddProductPayload {
  storeId: string
  product: {
    name: string
    description?: string
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
