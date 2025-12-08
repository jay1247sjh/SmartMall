/**
 * 用户领域 - 枚举定义
 */

/**
 * 角色枚举
 * 定义系统中的用户角色
 */
export enum Role {
  ADMIN = 'ADMIN',
  MERCHANT = 'MERCHANT',
  USER = 'USER'
}

/**
 * 在线状态枚举
 * 定义用户的在线状态
 */
export enum OnlineStatus {
  ONLINE = 'ONLINE',
  DISCONNECTED = 'DISCONNECTED',
  OFFLINE = 'OFFLINE'
}
