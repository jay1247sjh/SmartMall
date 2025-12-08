/**
 * Action 协议 - 枚举定义
 * 定义系统中所有可执行的行为类型和来源
 */

/**
 * Action 类型枚举
 * 定义系统中所有可执行的行为类型
 */
export enum ActionType {
  // ===== Navigation / Scene-level =====
  NAVIGATE_TO_STORE = 'navigation.navigateToStore',
  NAVIGATE_TO_AREA = 'navigation.navigateToArea',
  NAVIGATE_TO_POSITION = 'navigation.navigateToPosition',

  HIGHLIGHT_STORE = 'scene.highlightStore',
  HIGHLIGHT_AREA = 'scene.highlightArea',
  CLEAR_HIGHLIGHT = 'scene.clearHighlight',

  // ===== UI-level =====
  UI_OPEN_PANEL = 'ui.openPanel',
  UI_CLOSE_PANEL = 'ui.closePanel',
  UI_TOGGLE_PANEL = 'ui.togglePanel',

  // ===== Config / Write Operations =====
  CONFIG_EDIT_STORE = 'config.editStore',
  CONFIG_ADD_PRODUCT = 'config.addProduct',
  CONFIG_REMOVE_PRODUCT = 'config.removeProduct',
  CONFIG_UPDATE_PRODUCT = 'config.updateProduct',
  CONFIG_MOVE_OBJECT = 'config.moveObject',
  CONFIG_DELETE_OBJECT = 'config.deleteObject',

  // ===== Modeling Permission Operations =====
  PERMISSION_APPLY = 'permission.apply',
  PERMISSION_APPROVE = 'permission.approve',
  PERMISSION_REJECT = 'permission.reject',
  PERMISSION_REVOKE = 'permission.revoke',

  // ===== Layout Management Operations =====
  LAYOUT_SUBMIT_PROPOSAL = 'layout.submitProposal',
  LAYOUT_REVIEW_PROPOSAL = 'layout.reviewProposal',
  LAYOUT_PUBLISH_VERSION = 'layout.publishVersion',
  LAYOUT_SWITCH_VERSION = 'layout.switchVersion',

  // ===== Builder Mode Operations =====
  BUILDER_ENTER = 'builder.enter',
  BUILDER_EXIT = 'builder.exit',
  BUILDER_ADD_OBJECT = 'builder.addObject',
  BUILDER_MODIFY_OBJECT = 'builder.modifyObject',
  BUILDER_DELETE_OBJECT = 'builder.deleteObject'
}

/**
 * Action 来源枚举
 * 标识 Action 的触发来源
 */
export enum ActionSource {
  UI = 'UI',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM'
}
