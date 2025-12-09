/**
 * 用户领域 - 类型定义
 * 描述用户、会话和在线状态相关的类型
 */

import type { Role, OnlineStatus } from './user.enums'
import type { Capability } from '../permission/permission.enums'
import type { Vector3D } from '../scene/scene.types'

/**
 * 用户
 * 表示系统中的用户实体
 */
export interface User {
  /** 用户唯一标识 */
  id: string
  /** 用户名 */
  username: string
  /** 用户角色（管理员、商家、普通用户） */
  role: Role
  /** 邮箱地址 */
  email?: string
  /** 头像URL */
  avatar?: string
  /** 关联的商家ID（仅当 role 为 MERCHANT 时有值） */
  merchantId?: string
  /** 用户拥有的能力列表 */
  capabilities: Capability[]
  /** 账号创建时间（时间戳） */
  createdAt: number
  /** 最后登录时间（时间戳） */
  lastLoginAt?: number
  /** 用户显示名称 */
  displayName?: string
  /** 手机号 */
  phone?: string
}

/**
 * 会话
 * 表示用户的登录会话
 */
export interface Session {
  /** 会话唯一标识 */
  sessionId: string
  /** 用户ID */
  userId: string
  /** 用户信息 */
  user: User
  /** 认证令牌 */
  token: string
  /** 会话过期时间（时间戳） */
  expiresAt: number
  /** 会话创建时间（时间戳） */
  createdAt: number
  /** 最后活动时间（时间戳） */
  lastActivityAt: number
  /** 刷新令牌（可选） */
  refreshToken?: string
  /** 客户端信息 */
  clientInfo?: {
    userAgent?: string
    ip?: string
    device?: string
  }
}

/**
 * 在线用户
 * 表示当前在线的用户及其实时状态
 */
export interface OnlineUser {
  /** 用户ID */
  userId: string
  /** 用户名 */
  username: string
  /** 用户角色 */
  role: Role
  /** 在线状态（在线、断开连接、离线） */
  status: OnlineStatus
  /** 当前所在楼层ID */
  currentFloorId?: string
  /** 当前在3D场景中的位置 */
  currentPosition?: Vector3D
  /** 最后活跃时间（时间戳） */
  lastSeenAt: number
  /** 用户头像URL */
  avatar?: string
  /** 用户显示名称 */
  displayName?: string
  /** 会话ID */
  sessionId?: string
}

/**
 * 用户创建参数
 * 用于创建新用户时的参数类型
 */
export interface UserCreateParams {
  username: string
  role: Role
  email?: string
  password: string
  merchantId?: string
  displayName?: string
  phone?: string
}

/**
 * 用户更新参数
 * 用于更新用户信息时的参数类型
 */
export interface UserUpdateParams {
  username?: string
  email?: string
  avatar?: string
  displayName?: string
  phone?: string
  capabilities?: Capability[]
}

/**
 * 登录凭证
 * 用于用户登录时的参数类型
 */
export interface LoginCredentials {
  /** 用户名或邮箱 */
  identifier: string
  /** 密码 */
  password: string
  /** 记住我 */
  rememberMe?: boolean
}

/**
 * 登录响应
 * 用户登录成功后的响应数据
 */
export interface LoginResponse {
  /** 会话信息 */
  session: Session
  /** 用户信息 */
  user: User
}
