/**
 * 商城建模器模块
 * 
 * 导出所有建模器相关的类型、函数和组合式函数
 */

// BuilderEngine 核心引擎
export { BuilderEngine } from './BuilderEngine'
export type { BuilderTool, BuilderEngineOptions, BuilderEngineEvent, EventCallback, Vector2D } from './BuilderEngine'

// 错误处理
export {
  BuilderError,
  ConfigurationError,
  ValidationError,
  ImportExportError,
  OperationError,
  ErrorCode,
  toErrorDetails,
  type ErrorDetails,
} from './core/errors'

// 配置验证
export {
  OptionsValidator,
  isValidColor,
  validateProjectStructure,
  type ValidationResult,
} from './core/validators'

// 性能监控
export {
  PerformanceMonitor,
  type PerformanceConfig,
  type PerformanceRecord,
  type PerformanceStats,
} from './core/performance'

// 核心基类
export { BaseManager } from './core/BaseManager'
export type { Callback } from './core/BaseManager'

// 管理器
export { ProjectManager } from './managers/ProjectManager'
export { ToolManager } from './managers/ToolManager'
export { HistoryManager } from './managers/HistoryManager'

// 工具函数
export { deepClone, shallowClone } from './utils/clone'
export { generateId, generateIdWithPrefix } from './utils/id-generator'

// 向后兼容的类型别名
export { BuilderError as BuilderEngineError, ErrorCode as BuilderErrorCode } from './core/errors'

// 几何模块
export * from './geometry'

// 类型定义
export * from './types'

// 工厂函数
export * from './factories'

// 工具函数（其他）
export * from './utils'

// 模板系统
export * from './templates'

// 组合式函数
export * from './composables'

// IO模块
export * from './io'

// 渲染模块
export * from './rendering'

// 材质系统
export * from './materials'

// 放置规则
export * from './rules'

// 垂直连接
export * from './connections'

// 3D 模型
export * from './objects'

// 资源管理
export * from './resources'
