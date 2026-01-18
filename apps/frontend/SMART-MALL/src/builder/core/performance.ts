/**
 * Builder 模块性能监控器
 * 
 * 提供性能监控功能，记录关键操作的执行时间。
 * 支持同步和异步操作的性能测量。
 * 
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor({ enabled: true, logToConsole: true, threshold: 10 })
 * 
 * // 测量同步操作
 * const result = monitor.measure('myOperation', () => {
 *   // some operation
 *   return 42
 * })
 * 
 * // 测量异步操作
 * const asyncResult = await monitor.measureAsync('myAsyncOperation', async () => {
 *   // some async operation
 *   return 42
 * })
 * 
 * // 获取统计信息
 * const stats = monitor.getStats()
 * console.log(stats)
 * ```
 */

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
  /** 是否启用性能监控 */
  enabled: boolean
  /** 是否将性能日志输出到控制台 */
  logToConsole: boolean
  /** 性能记录阈值（毫秒），只记录超过此阈值的操作 */
  threshold: number
}

/**
 * 性能记录
 */
export interface PerformanceRecord {
  /** 操作名称 */
  operation: string
  /** 执行时长（毫秒） */
  duration: number
  /** 时间戳 */
  timestamp: number
}

/**
 * 性能统计信息
 */
export interface PerformanceStats {
  /** 操作名称 */
  operation: string
  /** 执行次数 */
  count: number
  /** 总耗时（毫秒） */
  totalDuration: number
  /** 平均耗时（毫秒） */
  avgDuration: number
  /** 最大耗时（毫秒） */
  maxDuration: number
  /** 最小耗时（毫秒） */
  minDuration: number
}

/**
 * 性能监控器
 * 
 * 用于监控和记录关键操作的性能数据。
 * 
 * @example
 * ```typescript
 * // 创建监控器
 * const monitor = new PerformanceMonitor({
 *   enabled: true,
 *   logToConsole: true,
 *   threshold: 10 // 只记录超过 10ms 的操作
 * })
 * 
 * // 测量同步操作
 * const result = monitor.measure('loadProject', () => {
 *   return loadProjectFromStorage()
 * })
 * 
 * // 测量异步操作
 * const data = await monitor.measureAsync('fetchData', async () => {
 *   return await fetch('/api/data')
 * })
 * 
 * // 获取统计信息
 * const stats = monitor.getStats()
 * for (const [operation, stat] of stats) {
 *   console.log(`${operation}: avg ${stat.avgDuration.toFixed(2)}ms`)
 * }
 * 
 * // 清除记录
 * monitor.clear()
 * ```
 */
export class PerformanceMonitor {
  /** 性能记录列表 */
  private records: PerformanceRecord[] = []
  
  /** 配置 */
  private config: PerformanceConfig
  
  /**
   * 创建 PerformanceMonitor 实例
   * 
   * @param config - 性能监控配置
   * 
   * @example
   * ```typescript
   * const monitor = new PerformanceMonitor({
   *   enabled: true,
   *   logToConsole: true,
   *   threshold: 10
   * })
   * ```
   */
  constructor(config: PerformanceConfig) {
    this.config = { ...config }
  }
  
  /**
   * 测量同步操作的性能
   * 
   * 如果性能监控未启用，直接执行函数不进行测量。
   * 
   * @param operation - 操作名称
   * @param fn - 要测量的函数
   * @returns 函数的返回值
   * 
   * @example
   * ```typescript
   * const result = monitor.measure('calculateArea', () => {
   *   return polygon.vertices.reduce((sum, v) => sum + v.x * v.y, 0)
   * })
   * ```
   */
  measure<T>(operation: string, fn: () => T): T {
    if (!this.config.enabled) {
      return fn()
    }
    
    const start = performance.now()
    try {
      return fn()
    } finally {
      const duration = performance.now() - start
      this.recordOperation(operation, duration)
    }
  }
  
  /**
   * 测量异步操作的性能
   * 
   * 如果性能监控未启用，直接执行函数不进行测量。
   * 
   * @param operation - 操作名称
   * @param fn - 要测量的异步函数
   * @returns Promise，解析为函数的返回值
   * 
   * @example
   * ```typescript
   * const data = await monitor.measureAsync('importProject', async () => {
   *   const text = await file.text()
   *   return JSON.parse(text)
   * })
   * ```
   */
  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return fn()
    }
    
    const start = performance.now()
    try {
      return await fn()
    } finally {
      const duration = performance.now() - start
      this.recordOperation(operation, duration)
    }
  }
  
  /**
   * 记录操作性能
   * 
   * 只记录超过阈值的操作。
   * 如果启用了控制台日志，会输出性能信息。
   * 
   * @param operation - 操作名称
   * @param duration - 执行时长（毫秒）
   */
  private recordOperation(operation: string, duration: number): void {
    // 只记录超过阈值的操作
    if (duration < this.config.threshold) {
      return
    }
    
    const record: PerformanceRecord = {
      operation,
      duration,
      timestamp: Date.now(),
    }
    
    this.records.push(record)
    
    // 输出到控制台
    if (this.config.logToConsole) {
      const color = duration > 100 ? '\x1b[31m' : duration > 50 ? '\x1b[33m' : '\x1b[32m'
      const reset = '\x1b[0m'
      console.log(`${color}[Performance]${reset} ${operation}: ${duration.toFixed(2)}ms`)
    }
  }
  
  /**
   * 获取性能统计信息
   * 
   * 返回每个操作的统计数据，包括执行次数、总耗时、平均耗时、最大/最小耗时。
   * 
   * @returns Map，键为操作名称，值为统计信息
   * 
   * @example
   * ```typescript
   * const stats = monitor.getStats()
   * 
   * for (const [operation, stat] of stats) {
   *   console.log(`Operation: ${operation}`)
   *   console.log(`  Count: ${stat.count}`)
   *   console.log(`  Avg: ${stat.avgDuration.toFixed(2)}ms`)
   *   console.log(`  Max: ${stat.maxDuration.toFixed(2)}ms`)
   *   console.log(`  Min: ${stat.minDuration.toFixed(2)}ms`)
   * }
   * ```
   */
  getStats(): Map<string, PerformanceStats> {
    const stats = new Map<string, PerformanceStats>()
    
    for (const record of this.records) {
      if (!stats.has(record.operation)) {
        stats.set(record.operation, {
          operation: record.operation,
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
        })
      }
      
      const stat = stats.get(record.operation)!
      stat.count++
      stat.totalDuration += record.duration
      stat.maxDuration = Math.max(stat.maxDuration, record.duration)
      stat.minDuration = Math.min(stat.minDuration, record.duration)
      stat.avgDuration = stat.totalDuration / stat.count
    }
    
    return stats
  }
  
  /**
   * 获取所有性能记录
   * 
   * @returns 性能记录数组的副本
   * 
   * @example
   * ```typescript
   * const records = monitor.getRecords()
   * console.log(`Total records: ${records.length}`)
   * ```
   */
  getRecords(): PerformanceRecord[] {
    return [...this.records]
  }
  
  /**
   * 获取指定操作的记录
   * 
   * @param operation - 操作名称
   * @returns 该操作的所有记录
   * 
   * @example
   * ```typescript
   * const exportRecords = monitor.getRecordsByOperation('exportProject')
   * console.log(`Export called ${exportRecords.length} times`)
   * ```
   */
  getRecordsByOperation(operation: string): PerformanceRecord[] {
    return this.records.filter(r => r.operation === operation)
  }
  
  /**
   * 清除所有性能记录
   * 
   * @example
   * ```typescript
   * monitor.clear()
   * console.log('Performance records cleared')
   * ```
   */
  clear(): void {
    this.records = []
  }
  
  /**
   * 更新配置
   * 
   * @param config - 新的配置（部分更新）
   * 
   * @example
   * ```typescript
   * // 启用性能监控
   * monitor.updateConfig({ enabled: true })
   * 
   * // 调整阈值
   * monitor.updateConfig({ threshold: 20 })
   * ```
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config }
  }
  
  /**
   * 获取当前配置
   * 
   * @returns 配置对象的副本
   * 
   * @example
   * ```typescript
   * const config = monitor.getConfig()
   * console.log(`Enabled: ${config.enabled}`)
   * ```
   */
  getConfig(): PerformanceConfig {
    return { ...this.config }
  }
  
  /**
   * 是否启用
   * 
   * @returns 是否启用性能监控
   */
  isEnabled(): boolean {
    return this.config.enabled
  }
}
