/**
 * ============================================================================
 * 权限规则映射表 (permission-rules.ts)
 * ============================================================================
 *
 * 【文件职责】
 * 定义 RCAC 权限模型的静态映射关系：
 * - ROLE_CAPABILITIES：角色 → 能力列表
 * - ACTION_CAPABILITY_MAP：ActionType → 所需能力列表
 * - WRITE_ACTION_TYPES：写操作集合（RUNTIME 模式下禁止）
 *
 * 【设计原则】
 * 1. 数据驱动：权限规则以声明式映射表定义，便于维护和审计
 * 2. 单一数据源：PermissionMiddleware 从此文件读取规则，不硬编码
 * 3. 与权限模型对齐：映射关系严格遵循 RCAC 权限矩阵
 *
 * ============================================================================
 */

import { Role, Capability } from '../../domain/permission/permission.enums'
import { ActionType } from '../../protocol/action.enums'

/**
 * 角色-能力映射
 *
 * 定义每个角色拥有的能力列表。
 * PermissionMiddleware 根据当前用户角色查询此表，
 * 判断用户是否具备执行某个 Action 所需的能力。
 */
export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  [Role.ADMIN]: [
    Capability.VIEW_MALL,
    Capability.NAVIGATE,
    Capability.EDIT_MALL_STRUCTURE,
    Capability.MANAGE_MERCHANTS,
    Capability.APPROVE_MODELING_PERMISSION,
    Capability.REVOKE_MODELING_PERMISSION,
    Capability.REVIEW_LAYOUT_PROPOSAL,
    Capability.PUBLISH_LAYOUT_VERSION,
    Capability.VIEW_LAYOUT_HISTORY,
  ],
  [Role.MERCHANT]: [
    Capability.VIEW_MALL,
    Capability.NAVIGATE,
    Capability.EDIT_OWN_STORE,
    Capability.APPLY_MODELING_PERMISSION,
    Capability.EDIT_AUTHORIZED_AREA,
    Capability.SUBMIT_LAYOUT_PROPOSAL,
    Capability.VIEW_LAYOUT_HISTORY,
  ],
  [Role.USER]: [
    Capability.VIEW_MALL,
    Capability.NAVIGATE,
    Capability.VIEW_LAYOUT_HISTORY,
  ],
}

/**
 * ActionType 到所需 Capability 的映射
 *
 * 定义执行每种 ActionType 所需的能力列表。
 * 若某个 ActionType 未在此表中，则视为无需特殊能力即可执行。
 * 一个 Action 可能需要多个能力（数组中所有能力都需满足）。
 */
export const ACTION_CAPABILITY_MAP: Partial<Record<ActionType, Capability[]>> = {
  // ===== 导航类 — 所有角色 =====
  [ActionType.NAVIGATE_TO_STORE]: [Capability.NAVIGATE],
  [ActionType.NAVIGATE_TO_AREA]: [Capability.NAVIGATE],
  [ActionType.NAVIGATE_TO_POSITION]: [Capability.NAVIGATE],

  // ===== 场景类 — 所有角色 =====
  [ActionType.HIGHLIGHT_STORE]: [Capability.VIEW_MALL],
  [ActionType.HIGHLIGHT_AREA]: [Capability.VIEW_MALL],
  [ActionType.CLEAR_HIGHLIGHT]: [Capability.VIEW_MALL],

  // ===== 配置类 — 商家/管理员 =====
  [ActionType.CONFIG_EDIT_STORE]: [Capability.EDIT_OWN_STORE],
  [ActionType.CONFIG_ADD_PRODUCT]: [Capability.EDIT_OWN_STORE],
  [ActionType.CONFIG_REMOVE_PRODUCT]: [Capability.EDIT_OWN_STORE],
  [ActionType.CONFIG_UPDATE_PRODUCT]: [Capability.EDIT_OWN_STORE],
  [ActionType.CONFIG_MOVE_OBJECT]: [Capability.EDIT_AUTHORIZED_AREA],
  [ActionType.CONFIG_DELETE_OBJECT]: [Capability.EDIT_AUTHORIZED_AREA],

  // ===== 权限类 =====
  [ActionType.PERMISSION_APPLY]: [Capability.APPLY_MODELING_PERMISSION],
  [ActionType.PERMISSION_APPROVE]: [Capability.APPROVE_MODELING_PERMISSION],
  [ActionType.PERMISSION_REJECT]: [Capability.APPROVE_MODELING_PERMISSION],
  [ActionType.PERMISSION_REVOKE]: [Capability.REVOKE_MODELING_PERMISSION],

  // ===== 布局类 =====
  [ActionType.LAYOUT_SUBMIT_PROPOSAL]: [Capability.SUBMIT_LAYOUT_PROPOSAL],
  [ActionType.LAYOUT_REVIEW_PROPOSAL]: [Capability.REVIEW_LAYOUT_PROPOSAL],
  [ActionType.LAYOUT_PUBLISH_VERSION]: [Capability.PUBLISH_LAYOUT_VERSION],
  [ActionType.LAYOUT_SWITCH_VERSION]: [Capability.VIEW_LAYOUT_HISTORY],

  // ===== 建模类 =====
  [ActionType.BUILDER_ENTER]: [Capability.EDIT_AUTHORIZED_AREA],
  [ActionType.BUILDER_EXIT]: [Capability.EDIT_AUTHORIZED_AREA],
  [ActionType.BUILDER_ADD_OBJECT]: [Capability.EDIT_AUTHORIZED_AREA],
  [ActionType.BUILDER_MODIFY_OBJECT]: [Capability.EDIT_AUTHORIZED_AREA],
  [ActionType.BUILDER_DELETE_OBJECT]: [Capability.EDIT_AUTHORIZED_AREA],
}

/**
 * 写操作 ActionType 集合
 *
 * 包含所有会修改系统状态的 ActionType。
 * 当系统处于 RUNTIME 模式时，PermissionMiddleware 会拒绝此集合中的所有 Action。
 * 仅 CONFIG 模式下允许执行写操作。
 */
export const WRITE_ACTION_TYPES: Set<ActionType> = new Set([
  ActionType.CONFIG_EDIT_STORE,
  ActionType.CONFIG_ADD_PRODUCT,
  ActionType.CONFIG_REMOVE_PRODUCT,
  ActionType.CONFIG_UPDATE_PRODUCT,
  ActionType.CONFIG_MOVE_OBJECT,
  ActionType.CONFIG_DELETE_OBJECT,
  ActionType.BUILDER_ENTER,
  ActionType.BUILDER_ADD_OBJECT,
  ActionType.BUILDER_MODIFY_OBJECT,
  ActionType.BUILDER_DELETE_OBJECT,
])
