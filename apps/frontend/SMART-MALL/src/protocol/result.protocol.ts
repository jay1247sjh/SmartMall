/**
 * 结果协议 - 类型定义
 * 定义系统中统一的结果和错误类型
 */

import type { ErrorCode } from './result.enums'

/**
 * 领域错误
 * 描述领域操作失败时的错误信息
 */
export interface DomainError {
  /** 错误码 */
  code: ErrorCode
  /** 错误消息（用户友好） */
  message: string
  /** 详细错误信息（开发者用） */
  details?: string
  /** 错误发生的字段（用于表单验证） */
  field?: string
  /** 错误元数据 */
  metadata?: Record<string, unknown>
  /** 错误堆栈（仅开发环境） */
  stack?: string
}

/**
 * 领域结果
 * 统一的操作结果类型，用于所有领域操作的返回值
 * 
 * @template T 成功时返回的数据类型
 * 
 * @example
 * ```typescript
 * // 成功的结果
 * const result: DomainResult<Store> = {
 *   success: true,
 *   data: { id: 'store-001', name: 'Apple Store', ... }
 * }
 * 
 * // 失败的结果
 * const result: DomainResult<Store> = {
 *   success: false,
 *   error: {
 *     code: ErrorCode.TARGET_NOT_FOUND,
 *     message: '店铺不存在'
 *   }
 * }
 * ```
 */
export interface DomainResult<T = void> {
  /** 操作是否成功 */
  success: boolean
  /** 成功时的数据（仅当 success 为 true 时存在） */
  data?: T
  /** 失败时的错误信息（仅当 success 为 false 时存在） */
  error?: DomainError
  /** 警告信息（即使成功也可能有警告） */
  warnings?: string[]
  /** 操作耗时（毫秒） */
  duration?: number
  /** 时间戳 */
  timestamp?: number
}

/**
 * 成功结果
 * 创建成功的 DomainResult
 */
export interface SuccessResult<T = void> extends DomainResult<T> {
  success: true
  data: T
  error?: never
}

/**
 * 失败结果
 * 创建失败的 DomainResult
 */
export interface FailureResult extends DomainResult<never> {
  success: false
  data?: never
  error: DomainError
}

/**
 * 验证错误
 * 用于表单验证或数据验证失败
 */
export interface ValidationError extends DomainError {
  code: ErrorCode.INVALID_ACTION
  /** 验证失败的字段列表 */
  fields: Array<{
    field: string
    message: string
    value?: unknown
  }>
}

/**
 * 权限错误
 * 用于权限检查失败
 */
export interface PermissionError extends DomainError {
  code: ErrorCode.PERMISSION_DENIED
  /** 缺失的能力 */
  missingCapabilities?: string[]
  /** 需要的角色 */
  requiredRole?: string
}

/**
 * 批量操作结果
 * 用于批量操作的结果
 */
export interface BatchResult<T = void> {
  /** 总数 */
  total: number
  /** 成功数 */
  succeeded: number
  /** 失败数 */
  failed: number
  /** 成功的结果列表 */
  successes: Array<{
    index: number
    data: T
  }>
  /** 失败的结果列表 */
  failures: Array<{
    index: number
    error: DomainError
  }>
}

/**
 * 分页结果
 * 用于分页查询的结果
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[]
  /** 总数 */
  total: number
  /** 当前页码（从 1 开始） */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 总页数 */
  totalPages: number
  /** 是否有下一页 */
  hasNext: boolean
  /** 是否有上一页 */
  hasPrev: boolean
}

/**
 * 异步操作状态
 * 用于长时间运行的异步操作
 */
export interface AsyncOperationStatus {
  /** 操作ID */
  operationId: string
  /** 操作状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  /** 进度（0-100） */
  progress?: number
  /** 结果（完成时） */
  result?: DomainResult<unknown>
  /** 开始时间 */
  startedAt: number
  /** 完成时间 */
  completedAt?: number
  /** 错误信息（失败时） */
  error?: DomainError
}

/**
 * 创建成功结果的辅助函数类型
 */
export type CreateSuccessResult = <T>(data: T, warnings?: string[]) => SuccessResult<T>

/**
 * 创建失败结果的辅助函数类型
 */
export type CreateFailureResult = (error: DomainError) => FailureResult

/**
 * 创建错误的辅助函数类型
 */
export type CreateError = (
  code: ErrorCode,
  message: string,
  details?: string,
  metadata?: Record<string, unknown>
) => DomainError
