/**
 * Builder 模块配置验证器
 * 
 * 提供配置参数的验证功能，确保所有配置值都在有效范围内。
 * 验证失败时返回详细的错误和警告信息。
 * 
 * @example
 * ```typescript
 * const result = OptionsValidator.validate(options)
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors)
 * }
 * ```
 */

import type { BuilderEngineOptions } from '../BuilderEngine'

/**
 * 验证结果接口
 * 
 * 包含验证状态、错误列表和警告列表。
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean
  /** 错误列表（阻止操作） */
  errors: string[]
  /** 警告列表（不阻止操作） */
  warnings: string[]
}

/**
 * 配置验证器
 * 
 * 提供静态方法验证 BuilderEngineOptions 配置对象。
 * 
 * @example
 * ```typescript
 * const options: BuilderEngineOptions = {
 *   gridSize: 1,
 *   maxHistoryLength: 50,
 *   backgroundColor: 0xf0f0f0
 * }
 * 
 * const result = OptionsValidator.validate(options)
 * if (result.valid) {
 *   console.log('Configuration is valid')
 * } else {
 *   console.error('Validation errors:', result.errors)
 * }
 * 
 * if (result.warnings.length > 0) {
 *   console.warn('Validation warnings:', result.warnings)
 * }
 * ```
 */
export class OptionsValidator {
  /**
   * 验证 BuilderEngineOptions 配置对象
   * 
   * 检查所有配置参数的有效性，包括：
   * - gridSize: 必须大于 0
   * - maxHistoryLength: 必须至少为 1
   * - backgroundColor: 必须是有效的颜色值（0x000000 - 0xFFFFFF）
   * 
   * @param options - 要验证的配置对象
   * @returns 验证结果，包含 valid、errors 和 warnings
   * 
   * @example
   * ```typescript
   * // 有效配置
   * const result1 = OptionsValidator.validate({ gridSize: 1 })
   * // result1.valid === true
   * 
   * // 无效配置
   * const result2 = OptionsValidator.validate({ gridSize: -1 })
   * // result2.valid === false
   * // result2.errors === ['gridSize must be greater than 0']
   * 
   * // 有警告的配置
   * const result3 = OptionsValidator.validate({ gridSize: 150 })
   * // result3.valid === true
   * // result3.warnings === ['gridSize is very large (150), may affect performance']
   * ```
   */
  static validate(options: BuilderEngineOptions): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // 验证 gridSize
    if (options.gridSize !== undefined) {
      if (typeof options.gridSize !== 'number') {
        errors.push('gridSize must be a number')
      } else if (!Number.isFinite(options.gridSize)) {
        errors.push('gridSize must be a finite number')
      } else if (options.gridSize <= 0) {
        errors.push('gridSize must be greater than 0')
      } else if (options.gridSize > 100) {
        warnings.push(`gridSize is very large (${options.gridSize}), may affect performance`)
      } else if (options.gridSize < 0.01) {
        warnings.push(`gridSize is very small (${options.gridSize}), may affect usability`)
      }
    }
    
    // 验证 maxHistoryLength
    if (options.maxHistoryLength !== undefined) {
      if (typeof options.maxHistoryLength !== 'number') {
        errors.push('maxHistoryLength must be a number')
      } else if (!Number.isInteger(options.maxHistoryLength)) {
        errors.push('maxHistoryLength must be an integer')
      } else if (options.maxHistoryLength < 1) {
        errors.push('maxHistoryLength must be at least 1')
      } else if (options.maxHistoryLength > 1000) {
        warnings.push(`maxHistoryLength is very large (${options.maxHistoryLength}), may affect memory usage`)
      }
    }
    
    // 验证 backgroundColor
    if (options.backgroundColor !== undefined) {
      if (typeof options.backgroundColor !== 'number') {
        errors.push('backgroundColor must be a number')
      } else if (!isValidColor(options.backgroundColor)) {
        errors.push(`backgroundColor must be a valid color value (0x000000 - 0xFFFFFF), got ${options.backgroundColor}`)
      }
    }
    
    // 验证 snapToGrid
    if (options.snapToGrid !== undefined) {
      if (typeof options.snapToGrid !== 'boolean') {
        errors.push('snapToGrid must be a boolean')
      }
    }
    
    // 验证 enableCollisionDetection
    if (options.enableCollisionDetection !== undefined) {
      if (typeof options.enableCollisionDetection !== 'boolean') {
        errors.push('enableCollisionDetection must be a boolean')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
  
  /**
   * 验证单个配置项
   * 
   * @param key - 配置项名称
   * @param value - 配置项值
   * @returns 验证结果
   * 
   * @example
   * ```typescript
   * const result = OptionsValidator.validateOption('gridSize', 1)
   * // result.valid === true
   * ```
   */
  static validateOption(key: keyof BuilderEngineOptions, value: unknown): ValidationResult {
    const options: Partial<BuilderEngineOptions> = { [key]: value as any }
    return this.validate(options as BuilderEngineOptions)
  }
}

/**
 * 验证颜色值是否有效
 * 
 * 颜色值必须是 0x000000 到 0xFFFFFF 之间的整数。
 * 
 * @param color - 要验证的颜色值
 * @returns 是否为有效颜色
 * 
 * @example
 * ```typescript
 * isValidColor(0x000000)  // true (黑色)
 * isValidColor(0xFFFFFF)  // true (白色)
 * isValidColor(0xF0F0F0)  // true (浅灰色)
 * isValidColor(-1)        // false (负数)
 * isValidColor(0x1000000) // false (超出范围)
 * isValidColor(1.5)       // false (非整数)
 * ```
 */
export function isValidColor(color: number): boolean {
  return Number.isInteger(color) && color >= 0 && color <= 0xFFFFFF
}

/**
 * 验证项目数据的基本结构
 * 
 * 检查项目是否包含必需的字段（id 和 name）。
 * 
 * @param project - 要验证的项目对象
 * @returns 验证结果
 * 
 * @example
 * ```typescript
 * const result = validateProjectStructure({ id: '1', name: 'Mall' })
 * // result.valid === true
 * 
 * const result2 = validateProjectStructure({ id: '1' })
 * // result2.valid === false
 * // result2.errors === ['Project must have a name']
 * ```
 */
export function validateProjectStructure(project: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!project) {
    errors.push('Project is null or undefined')
    return { valid: false, errors, warnings }
  }
  
  if (typeof project !== 'object') {
    errors.push('Project must be an object')
    return { valid: false, errors, warnings }
  }
  
  if (!project.id) {
    errors.push('Project must have an id')
  } else if (typeof project.id !== 'string') {
    errors.push('Project id must be a string')
  }
  
  if (!project.name) {
    errors.push('Project must have a name')
  } else if (typeof project.name !== 'string') {
    errors.push('Project name must be a string')
  }
  
  if (project.outline === undefined) {
    warnings.push('Project has no outline defined')
  }
  
  if (project.floors === undefined) {
    warnings.push('Project has no floors defined')
  } else if (!Array.isArray(project.floors)) {
    errors.push('Project floors must be an array')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
