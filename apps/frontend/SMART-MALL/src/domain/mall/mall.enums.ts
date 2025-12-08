/**
 * 商城领域 - 枚举定义
 */

/**
 * 区域类型枚举
 * 定义区域的业务分类
 */
export enum AreaType {
  RETAIL = 'retail',
  FOOD = 'food',
  ENTERTAINMENT = 'entertainment',
  SERVICE = 'service'
}

/**
 * 区域状态枚举
 * 定义区域的建模权限状态
 */
export enum AreaStatus {
  LOCKED = 'LOCKED',           // 初始状态，不可编辑
  PENDING = 'PENDING',         // 有商家申请中，等待审批
  AUTHORIZED = 'AUTHORIZED',   // 已授权，可被特定商家编辑
  OCCUPIED = 'OCCUPIED'        // 已被占用，不可再申请
}

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
