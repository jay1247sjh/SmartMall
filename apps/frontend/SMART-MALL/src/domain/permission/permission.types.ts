/**
 * 权限领域 - 类型定义
 * 定义 RCAC（Role-Capability-Action-Context）权限模型
 */

import type { Role, Capability } from './permission.enums'
import type { ActionType } from '../../protocol/action.enums'
import type { SystemMode, TemporalState } from '../../shared/system/system.enums'

/**
 * 权限上下文
 * 描述执行 Action 时的上下文信息
 * 用于上下文相关的权限校验
 */
export interface Context {
  /** 空间上下文 */
  spatial?: {
    /** 当前楼层ID */
    currentFloorId?: string
    /** 当前区域ID */
    currentAreaId?: string
    /** 当前店铺ID */
    currentStoreId?: string
  }
  /** 时间上下文 */
  temporal?: {
    /** 系统模式（RUNTIME/CONFIG） */
    systemMode: SystemMode
    /** 时间状态（READY/LOADING/TRANSITION/ERROR） */
    temporalState: TemporalState
  }
  /** 用户上下文 */
  user?: {
    /** 用户ID */
    userId: string
    /** 用户角色 */
    role: Role
    /** 商家ID（如果是商家） */
    merchantId?: string
  }
  /** 目标上下文 */
  target?: {
    /** 目标对象ID */
    targetId?: string
    /** 目标类型 */
    targetType?: string
    /** 目标所有者ID */
    ownerId?: string
  }
}

/**
 * 权限检查结果
 * 描述权限检查的结果
 */
export interface PermissionResult {
  /** 是否允许 */
  allowed: boolean
  /** 拒绝原因（如果不允许） */
  reason?: string
  /** 缺失的能力（如果因能力不足被拒绝） */
  missingCapabilities?: Capability[]
  /** 上下文不匹配的原因（如果因上下文不匹配被拒绝） */
  contextMismatch?: string
}

/**
 * 权限规则
 * 定义一个权限规则
 */
export interface PermissionRule {
  /** 规则ID */
  id: string
  /** 规则名称 */
  name: string
  /** 适用的角色 */
  roles: Role[]
  /** 需要的能力 */
  requiredCapabilities: Capability[]
  /** 适用的 Action 类型 */
  actionTypes: ActionType[]
  /** 上下文条件（可选） */
  contextConditions?: {
    /** 系统模式要求 */
    systemMode?: SystemMode[]
    /** 时间状态要求 */
    temporalState?: TemporalState[]
    /** 是否需要所有者匹配 */
    requireOwnership?: boolean
  }
  /** 规则优先级（数字越大优先级越高） */
  priority?: number
}

/**
 * 角色能力映射
 * 定义每个角色拥有的能力集合
 */
export interface RoleCapabilityMapping {
  [Role.ADMIN]: Capability[]
  [Role.MERCHANT]: Capability[]
  [Role.USER]: Capability[]
}

/**
 * RCAC 权限检查请求
 * 用于请求权限检查的参数
 */
export interface PermissionCheckRequest {
  /** 用户角色 */
  role: Role
  /** 用户能力列表 */
  capabilities: Capability[]
  /** 要执行的 Action 类型 */
  actionType: ActionType
  /** 上下文信息 */
  context: Context
  /** 用户ID */
  userId?: string
  /** 商家ID（如果是商家） */
  merchantId?: string
}

/**
 * 权限策略
 * 定义权限检查的策略配置
 */
export interface PermissionPolicy {
  /** 策略ID */
  id: string
  /** 策略名称 */
  name: string
  /** 策略描述 */
  description?: string
  /** 包含的规则列表 */
  rules: PermissionRule[]
  /** 是否启用 */
  enabled: boolean
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 权限审计日志
 * 记录权限检查的历史
 */
export interface PermissionAuditLog {
  /** 日志ID */
  id: string
  /** 用户ID */
  userId: string
  /** 用户角色 */
  role: Role
  /** Action 类型 */
  actionType: ActionType
  /** 检查结果 */
  result: PermissionResult
  /** 上下文快照 */
  context: Context
  /** 时间戳 */
  timestamp: number
  /** 会话ID */
  sessionId?: string
}
