/**
 * Builder 模块错误处理系统
 * 
 * 提供统一的错误类层次结构，用于整个 Builder 模块的错误处理。
 * 所有错误都继承自 BuilderError 基类，包含错误码、消息和可选的详细信息。
 * 
 * @example
 * ```typescript
 * throw new ConfigurationError('Invalid grid size', { gridSize: -1 })
 * ```
 */

/**
 * Builder 模块基础错误类
 * 
 * 所有 Builder 相关错误的基类，提供统一的错误结构。
 * 
 * @example
 * ```typescript
 * const error = new BuilderError('Something went wrong', 'CUSTOM_ERROR', { context: 'data' })
 * console.log(error.code)    // 'CUSTOM_ERROR'
 * console.log(error.message) // 'Something went wrong'
 * console.log(error.details) // { context: 'data' }
 * ```
 */
export class BuilderError extends Error {
  /**
   * 创建 BuilderError 实例
   * 
   * @param message - 错误消息
   * @param code - 错误码
   * @param details - 可选的详细信息
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'BuilderError'
    
    // 确保正确的原型链（用于 instanceof 检查）
    Object.setPrototypeOf(this, BuilderError.prototype)
  }
}

/**
 * 配置错误
 * 
 * 当配置参数无效时抛出此错误。
 * 通常在构造函数或配置方法中使用。
 * 
 * @example
 * ```typescript
 * if (gridSize <= 0) {
 *   throw new ConfigurationError('Grid size must be positive', { gridSize })
 * }
 * ```
 */
export class ConfigurationError extends BuilderError {
  /**
   * 创建 ConfigurationError 实例
   * 
   * @param message - 错误消息
   * @param details - 可选的详细信息
   */
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.CONFIGURATION_ERROR, details)
    this.name = 'ConfigurationError'
    Object.setPrototypeOf(this, ConfigurationError.prototype)
  }
}

/**
 * 验证错误
 * 
 * 当数据验证失败时抛出此错误。
 * 用于项目数据、区域数据等的验证。
 * 
 * @example
 * ```typescript
 * if (!project.id || !project.name) {
 *   throw new ValidationError('Project must have id and name', { project })
 * }
 * ```
 */
export class ValidationError extends BuilderError {
  /**
   * 创建 ValidationError 实例
   * 
   * @param message - 错误消息
   * @param details - 可选的详细信息
   */
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.VALIDATION_ERROR, details)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * 导入导出错误
 * 
 * 当项目导入或导出失败时抛出此错误。
 * 
 * @example
 * ```typescript
 * try {
 *   const data = JSON.parse(json)
 * } catch (e) {
 *   throw new ImportExportError('Failed to parse JSON', e)
 * }
 * ```
 */
export class ImportExportError extends BuilderError {
  /**
   * 创建 ImportExportError 实例
   * 
   * @param message - 错误消息
   * @param details - 可选的详细信息
   */
  constructor(message: string, details?: unknown) {
    super(message, ErrorCode.IMPORT_EXPORT_ERROR, details)
    this.name = 'ImportExportError'
    Object.setPrototypeOf(this, ImportExportError.prototype)
  }
}

/**
 * 操作错误
 * 
 * 当操作执行失败时抛出此错误。
 * 这是一个通用错误类，可以指定具体的错误码。
 * 
 * @example
 * ```typescript
 * throw new OperationError('Area creation failed', ErrorCode.AREA_OVERLAP, { areaId })
 * ```
 */
export class OperationError extends BuilderError {
  /**
   * 创建 OperationError 实例
   * 
   * @param message - 错误消息
   * @param code - 错误码
   * @param details - 可选的详细信息
   */
  constructor(message: string, code: string, details?: unknown) {
    super(message, code, details)
    this.name = 'OperationError'
    Object.setPrototypeOf(this, OperationError.prototype)
  }
}

/**
 * 错误码枚举
 * 
 * 定义所有可能的错误码，用于错误分类和处理。
 * 
 * @example
 * ```typescript
 * if (error.code === ErrorCode.INVALID_CONTAINER) {
 *   console.error('Container is invalid')
 * }
 * ```
 */
export enum ErrorCode {
  // ========== 配置相关 ==========
  /** 配置错误（通用） */
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  /** 无效的容器元素 */
  INVALID_CONTAINER = 'INVALID_CONTAINER',
  /** 无效的配置选项 */
  INVALID_OPTIONS = 'INVALID_OPTIONS',
  /** 无效的网格大小 */
  INVALID_GRID_SIZE = 'INVALID_GRID_SIZE',
  /** 无效的历史记录长度 */
  INVALID_HISTORY_LENGTH = 'INVALID_HISTORY_LENGTH',
  /** 无效的背景颜色 */
  INVALID_BACKGROUND_COLOR = 'INVALID_BACKGROUND_COLOR',
  
  // ========== 验证相关 ==========
  /** 验证错误（通用） */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** 无效的项目数据 */
  INVALID_PROJECT = 'INVALID_PROJECT',
  /** 项目加载失败 */
  PROJECT_LOAD_FAILED = 'PROJECT_LOAD_FAILED',
  
  // ========== 导入导出相关 ==========
  /** 导入导出错误（通用） */
  IMPORT_EXPORT_ERROR = 'IMPORT_EXPORT_ERROR',
  /** 导入失败 */
  IMPORT_FAILED = 'IMPORT_FAILED',
  /** 导出失败 */
  EXPORT_FAILED = 'EXPORT_FAILED',
  /** 无效的文件格式 */
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // ========== 区域相关 ==========
  /** 区域重叠 */
  AREA_OVERLAP = 'AREA_OVERLAP',
  /** 区域超出边界 */
  AREA_OUT_OF_BOUNDS = 'AREA_OUT_OF_BOUNDS',
  /** 多边形自相交 */
  SELF_INTERSECTING = 'SELF_INTERSECTING',
  /** 区域未找到 */
  AREA_NOT_FOUND = 'AREA_NOT_FOUND',
  
  // ========== 楼层相关 ==========
  /** 无效的楼层 */
  INVALID_FLOOR = 'INVALID_FLOOR',
  /** 楼层未找到 */
  FLOOR_NOT_FOUND = 'FLOOR_NOT_FOUND',
  
  // ========== 引擎状态相关 ==========
  /** 引擎已销毁 */
  ENGINE_DISPOSED = 'ENGINE_DISPOSED',
  /** 引擎未启动 */
  ENGINE_NOT_STARTED = 'ENGINE_NOT_STARTED',
  
  // ========== 操作相关 ==========
  /** 操作失败（通用） */
  OPERATION_FAILED = 'OPERATION_FAILED',
  /** 操作不支持 */
  OPERATION_NOT_SUPPORTED = 'OPERATION_NOT_SUPPORTED',
  /** 操作被取消 */
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
}

/**
 * 错误详情接口
 * 
 * 用于结构化错误信息，便于日志记录和错误追踪。
 */
export interface ErrorDetails {
  /** 错误码 */
  code: string
  /** 错误消息 */
  message: string
  /** 详细信息 */
  details?: unknown
  /** 堆栈跟踪 */
  stack?: string
  /** 时间戳 */
  timestamp: number
}

/**
 * 将错误转换为结构化的错误详情
 * 
 * @param error - 错误对象
 * @returns 结构化的错误详情
 * 
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (error) {
 *   const details = toErrorDetails(error)
 *   console.log(details)
 * }
 * ```
 */
export function toErrorDetails(error: unknown): ErrorDetails {
  if (error instanceof BuilderError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      stack: error.stack,
      timestamp: Date.now(),
    }
  }
  
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    }
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    timestamp: Date.now(),
  }
}
