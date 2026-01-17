/**
 * 商城领域 - 枚举定义
 * 
 * 从共享类型包导入核心枚举，确保跨服务一致性
 */

// 从共享类型包导入
export { 
  AreaType, 
  AreaStatus,
  AREA_TYPE_NAMES,
  AREA_TYPE_COLORS,
  isShopAreaType
} from '@smart-mall/shared-types'

/**
 * 权限申请状态枚举
 */
export enum PermissionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED'
}

/**
 * Layout 版本状态枚举
 */
export enum LayoutVersionStatus {
  DRAFT = 'DRAFT',       // 草稿，未发布
  ACTIVE = 'ACTIVE',     // 当前生效版本
  ARCHIVED = 'ARCHIVED'  // 已归档
}

/**
 * Layout 变更类型枚举
 */
export enum LayoutChangeType {
  AREA_CREATED = 'AREA_CREATED',
  AREA_MODIFIED = 'AREA_MODIFIED',
  AREA_DELETED = 'AREA_DELETED',
  OBJECTS_ADDED = 'OBJECTS_ADDED',
  OBJECTS_MODIFIED = 'OBJECTS_MODIFIED',
  OBJECTS_REMOVED = 'OBJECTS_REMOVED'
}

/**
 * 提案状态枚举
 */
export enum ProposalStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MERGED = 'MERGED'
}
