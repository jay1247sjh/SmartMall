/**
 * ============================================================================
 * 结果协议 - 类型定义 (result.protocol.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 定义系统中统一的结果（Result）和错误（Error）类型。
 * 这是 Protocol 层的输出协议，确保所有操作返回一致的结果结构。
 * 
 * 【业务背景】
 * 智慧商城系统的所有操作都需要返回明确的结果：
 * - 成功时：返回操作结果数据
 * - 失败时：返回结构化的错误信息
 * 
 * 这种设计带来以下业务价值：
 * 1. 统一错误处理：前端可以用统一的方式处理所有错误
 * 2. 用户友好：错误信息分为用户友好消息和开发者详情
 * 3. 可追溯性：错误包含元数据，便于问题排查
 * 
 * 【设计原则】
 * 1. 显式成功/失败：使用 success 字段明确标识操作结果
 * 2. 类型安全：使用泛型确保 data 类型与操作匹配
 * 3. 丰富的错误信息：包含错误码、消息、详情、字段等
 * 
 * 【与其他模块的关系】
 * - result.enums.ts：提供 ErrorCode 枚举
 * - domain/behaviors/：行为处理器返回 DomainResult
 * - api/：API 层将后端响应转换为 DomainResult
 * - views/：视图层根据 DomainResult 显示成功/错误提示
 * 
 * ============================================================================
 */

import type { ErrorCode } from './result.enums'

/**
 * 领域错误
 * 
 * 描述领域操作失败时的错误信息。设计为既对用户友好，又便于开发者调试。
 * 
 * 【字段说明】
 * - code: 错误码，用于程序判断错误类型
 * - message: 用户友好的错误消息，可直接显示给用户
 * - details: 详细错误信息，仅供开发者查看
 * - field: 错误发生的字段，用于表单验证高亮
 * - metadata: 错误元数据，包含额外的上下文信息
 * - stack: 错误堆栈，仅在开发环境可用
 * 
 * @example
 * ```typescript
 * const error: DomainError = {
 *   code: ErrorCode.PERMISSION_DENIED,
 *   message: '您没有权限编辑此店铺',
 *   details: 'User user-001 lacks EDIT_STORE capability for store-002',
 *   metadata: { userId: 'user-001', storeId: 'store-002' }
 * }
 * ```
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
 * 
 * 统一的操作结果类型，用于所有领域操作的返回值。
 * 采用"显式成功/失败"模式，避免使用异常进行流程控制。
 * 
 * 【设计理念】
 * 1. 显式结果：通过 success 字段明确标识操作是否成功
 * 2. 类型安全：泛型 T 确保 data 类型与操作匹配
 * 3. 丰富信息：即使成功也可能有警告信息
 * 4. 性能追踪：可选的 duration 字段用于性能监控
 * 
 * 【使用模式】
 * ```typescript
 * // 处理结果的推荐方式
 * const result = await someOperation()
 * if (result.success) {
 *   // 使用 result.data（TypeScript 会正确推断类型）
 *   console.log(result.data)
 * } else {
 *   // 处理错误
 *   showError(result.error.message)
 * }
 * ```
 * 
 * @template T 成功时返回的数据类型，默认为 void
 * 
 * @example
 * ```typescript
 * // 成功的结果
 * const successResult: DomainResult<Store> = {
 *   success: true,
 *   data: { id: 'store-001', name: 'Apple Store', ... },
 *   duration: 150
 * }
 * 
 * // 失败的结果
 * const failureResult: DomainResult<Store> = {
 *   success: false,
 *   error: {
 *     code: ErrorCode.TARGET_NOT_FOUND,
 *     message: '店铺不存在'
 *   }
 * }
 * 
 * // 成功但有警告
 * const warningResult: DomainResult<void> = {
 *   success: true,
 *   warnings: ['部分数据可能已过期，建议刷新']
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
 * 
 * DomainResult 的成功变体，用于类型收窄。
 * 当 success 为 true 时，TypeScript 会自动推断 data 存在且 error 不存在。
 * 
 * @template T 成功时返回的数据类型
 */
export interface SuccessResult<T = void> extends DomainResult<T> {
  success: true
  data: T
  error?: never
}

/**
 * 失败结果
 * 
 * DomainResult 的失败变体，用于类型收窄。
 * 当 success 为 false 时，TypeScript 会自动推断 error 存在且 data 不存在。
 */
export interface FailureResult extends DomainResult<never> {
  success: false
  data?: never
  error: DomainError
}

/**
 * 验证错误
 * 
 * 用于表单验证或数据验证失败的特殊错误类型。
 * 包含详细的字段级错误信息，便于前端高亮显示错误字段。
 * 
 * 【业务场景】
 * - 用户注册时用户名已存在
 * - 商品价格输入非法值
 * - 必填字段未填写
 * 
 * @example
 * ```typescript
 * const validationError: ValidationError = {
 *   code: ErrorCode.INVALID_ACTION,
 *   message: '表单验证失败',
 *   fields: [
 *     { field: 'username', message: '用户名已存在', value: 'admin' },
 *     { field: 'price', message: '价格必须大于0', value: -10 }
 *   ]
 * }
 * ```
 */
export interface ValidationError extends DomainError {
  code: ErrorCode.INVALID_ACTION
  /** 验证失败的字段列表 */
  fields: Array<{
    /** 字段名 */
    field: string
    /** 错误消息 */
    message: string
    /** 当前值（可选，用于调试） */
    value?: unknown
  }>
}

/**
 * 权限错误
 * 
 * 用于权限检查失败的特殊错误类型。
 * 包含缺失的能力和需要的角色信息，便于前端显示具体的权限要求。
 * 
 * 【业务场景】
 * - 普通用户尝试访问管理员功能
 * - 商家尝试编辑未授权的区域
 * - 用户尝试执行超出其角色权限的操作
 * 
 * @example
 * ```typescript
 * const permissionError: PermissionError = {
 *   code: ErrorCode.PERMISSION_DENIED,
 *   message: '您没有权限执行此操作',
 *   missingCapabilities: ['EDIT_STORE', 'MANAGE_PRODUCTS'],
 *   requiredRole: 'MERCHANT'
 * }
 * ```
 */
export interface PermissionError extends DomainError {
  code: ErrorCode.PERMISSION_DENIED
  /** 缺失的能力列表 */
  missingCapabilities?: string[]
  /** 需要的角色 */
  requiredRole?: string
}

/**
 * 批量操作结果
 * 
 * 用于批量操作的结果，记录每个操作的成功/失败状态。
 * 适用于批量导入、批量删除、批量更新等场景。
 * 
 * 【业务场景】
 * - 批量导入商品（部分成功、部分失败）
 * - 批量删除用户（记录每个用户的删除结果）
 * - 批量发送通知（统计发送成功率）
 * 
 * @template T 单个操作成功时返回的数据类型
 * 
 * @example
 * ```typescript
 * const batchResult: BatchResult<Product> = {
 *   total: 100,
 *   succeeded: 95,
 *   failed: 5,
 *   successes: [
 *     { index: 0, data: { id: 'p1', name: '商品1' } },
 *     // ...
 *   ],
 *   failures: [
 *     { index: 3, error: { code: ErrorCode.INVALID_ACTION, message: '价格无效' } },
 *     // ...
 *   ]
 * }
 * ```
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
 * 
 * 用于分页查询的结果，包含数据列表和分页元信息。
 * 遵循常见的分页模式，便于前端实现分页组件。
 * 
 * 【业务场景】
 * - 商品列表分页
 * - 用户列表分页
 * - 订单历史分页
 * 
 * @template T 列表项的数据类型
 * 
 * @example
 * ```typescript
 * const paginatedResult: PaginatedResult<Product> = {
 *   items: [{ id: 'p1', name: '商品1' }, ...],
 *   total: 150,
 *   page: 2,
 *   pageSize: 20,
 *   totalPages: 8,
 *   hasNext: true,
 *   hasPrev: true
 * }
 * ```
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
 * 
 * 用于长时间运行的异步操作，如文件上传、数据导入、报表生成等。
 * 前端可以轮询此状态来显示进度条和操作结果。
 * 
 * 【业务场景】
 * - 大文件上传（显示上传进度）
 * - 批量数据导入（显示处理进度）
 * - 报表生成（等待生成完成）
 * - 3D 模型渲染（显示渲染进度）
 * 
 * 【状态流转】
 * pending → running → completed/failed/cancelled
 * 
 * @example
 * ```typescript
 * const asyncStatus: AsyncOperationStatus = {
 *   operationId: 'op-001',
 *   status: 'running',
 *   progress: 45,
 *   startedAt: 1704067200000
 * }
 * 
 * // 完成后
 * const completedStatus: AsyncOperationStatus = {
 *   operationId: 'op-001',
 *   status: 'completed',
 *   progress: 100,
 *   result: { success: true, data: { ... } },
 *   startedAt: 1704067200000,
 *   completedAt: 1704067260000
 * }
 * ```
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

// ============================================================================
// 辅助函数类型
// ============================================================================

/**
 * 创建成功结果的辅助函数类型
 * 
 * @example
 * ```typescript
 * const createSuccess: CreateSuccessResult = (data, warnings) => ({
 *   success: true,
 *   data,
 *   warnings,
 *   timestamp: Date.now()
 * })
 * ```
 */
export type CreateSuccessResult = <T>(data: T, warnings?: string[]) => SuccessResult<T>

/**
 * 创建失败结果的辅助函数类型
 * 
 * @example
 * ```typescript
 * const createFailure: CreateFailureResult = (error) => ({
 *   success: false,
 *   error,
 *   timestamp: Date.now()
 * })
 * ```
 */
export type CreateFailureResult = (error: DomainError) => FailureResult

/**
 * 创建错误的辅助函数类型
 * 
 * @example
 * ```typescript
 * const createError: CreateError = (code, message, details, metadata) => ({
 *   code,
 *   message,
 *   details,
 *   metadata
 * })
 * ```
 */
export type CreateError = (
  code: ErrorCode,
  message: string,
  details?: string,
  metadata?: Record<string, unknown>
) => DomainError
