/**
 * 用户角色枚举
 * 
 * @shared 前端、后端共用
 */
export enum UserRole {
  /** 平台管理员 */
  ADMIN = 'ADMIN',
  /** 商家 */
  MERCHANT = 'MERCHANT',
  /** 普通用户 */
  USER = 'USER'
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  /** 正常 */
  ACTIVE = 'ACTIVE',
  /** 待验证 */
  PENDING = 'PENDING',
  /** 冻结 */
  FROZEN = 'FROZEN',
  /** 已删除 */
  DELETED = 'DELETED'
}

/**
 * 用户在线状态枚举
 */
export enum OnlineStatus {
  /** 在线 */
  ONLINE = 'ONLINE',
  /** 断开连接 */
  DISCONNECTED = 'DISCONNECTED',
  /** 离线 */
  OFFLINE = 'OFFLINE'
}

/**
 * 角色显示名称映射
 */
export const USER_ROLE_NAMES: Record<UserRole, string> = {
  [UserRole.ADMIN]: '管理员',
  [UserRole.MERCHANT]: '商家',
  [UserRole.USER]: '普通用户'
}
