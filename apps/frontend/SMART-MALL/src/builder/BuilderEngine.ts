/**
 * BuilderEngine - 商城建模器引擎
 * 
 * 这是建模器的核心类，负责：
 * - 封装所有建模器功能
 * - 管理项目数据和状态
 * - 协调各个功能模块
 * - 提供统一的 API 接口
 * 
 * 设计原则：
 * - 与 UI 框架解耦（可在 Vue、React、原生 JS 中使用）
 * - 通过事件系统与外部通信
 * - 模块化设计，职责清晰
 * - 高性能，优化渲染和内存使用
 */

import { ThreeEngine } from '@/engine/ThreeEngine'
import type { MallProject, AreaDefinition, FloorDefinition, AreaType } from './types'
import { ProjectManager } from './managers/ProjectManager'
import { ToolManager } from './managers/ToolManager'
import { HistoryManager } from './managers/HistoryManager'
import { ConfigurationError, ValidationError, ImportExportError, ErrorCode } from './core/errors'
import { OptionsValidator, validateProjectStructure } from './core/validators'
import { PerformanceMonitor, type PerformanceConfig } from './core/performance'
import { exportProject, importProject } from './io/project-io'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 建模工具类型
 */
export type BuilderTool = 
  | 'select'        // 选择工具
  | 'pan'           // 平移工具
  | 'draw-rect'     // 绘制矩形
  | 'draw-poly'     // 绘制多边形
  | 'draw-outline'  // 绘制商城轮廓
  | 'edit-vertex'   // 编辑顶点

/**
 * 引擎配置选项
 */
export interface BuilderEngineOptions {
  /** 是否启用网格吸附 */
  snapToGrid?: boolean
  /** 网格大小 */
  gridSize?: number
  /** 历史记录最大长度 */
  maxHistoryLength?: number
  /** 是否启用碰撞检测 */
  enableCollisionDetection?: boolean
  /** 背景颜色 */
  backgroundColor?: number
}

/**
 * 引擎事件类型
 */
export type BuilderEngineEvent =
  | 'area-selected'
  | 'area-created'
  | 'area-deleted'
  | 'area-updated'
  | 'project-changed'
  | 'floor-changed'
  | 'tool-changed'
  | 'history-changed'
  | 'error'

/**
 * 事件回调函数类型
 */
export type EventCallback = (data?: any) => void

/**
 * 2D 向量
 */
export interface Vector2D {
  x: number
  y: number
}

// ============================================================================
// 向后兼容的类型别名
// ============================================================================

/**
 * @deprecated 使用 BuilderError 代替
 */
export { BuilderError as BuilderEngineError } from './core/errors'

/**
 * @deprecated 使用 ErrorCode 代替
 */
export { ErrorCode as BuilderErrorCode } from './core/errors'

// ============================================================================
// BuilderEngine 主类
// ============================================================================

/**
 * BuilderEngine - 商城建模器引擎
 * 
 * @example
 * ```typescript
 * const container = document.getElementById('canvas')
 * const project = createEmptyProject('My Mall')
 * const engine = new BuilderEngine(container, project, {
 *   snapToGrid: true,
 *   gridSize: 1
 * })
 * 
 * // 监听事件
 * engine.on('area-selected', (area) => {
 *   console.log('Selected area:', area)
 * })
 * 
 * // 启动引擎
 * engine.start()
 * 
 * // 使用完毕后清理
 * engine.dispose()
 * ```
 */
export class BuilderEngine {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /** ThreeEngine 实例 */
  private threeEngine: ThreeEngine

  /** DOM 容器 */
  private container: HTMLElement

  /** 引擎配置选项 */
  private options: BuilderEngineOptions

  /** 项目管理器 */
  private projectManager: ProjectManager

  /** 工具管理器 */
  private toolManager: ToolManager

  /** 历史记录管理器 */
  private historyManager: HistoryManager

  /** 性能监控器 */
  private performanceMonitor: PerformanceMonitor

  /** 事件监听器映射 */
  private eventListeners: Map<BuilderEngineEvent, Set<EventCallback>> = new Map()

  /** 引擎是否已启动 */
  private isStarted: boolean = false

  /** 引擎是否已销毁 */
  private isDisposed: boolean = false

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建 BuilderEngine 实例
   * 
   * @param container - 用于挂载 3D 画布的 DOM 元素
   * @param project - 商城项目数据
   * @param options - 引擎配置选项
   * @throws {BuilderEngineError} 当容器无效或项目数据无效时
   */
  constructor(
    container: HTMLElement,
    project: MallProject,
    options: BuilderEngineOptions = {}
  ) {
    // 1. 验证容器
    if (!container || !(container instanceof HTMLElement)) {
      throw new ConfigurationError(
        'Invalid container: must be a valid HTMLElement',
        { container }
      )
    }

    // 2. 验证配置
    const validation = OptionsValidator.validate(options)
    if (!validation.valid) {
      throw new ConfigurationError(
        `Invalid options: ${validation.errors.join(', ')}`,
        { errors: validation.errors, warnings: validation.warnings, options }
      )
    }

    // 输出配置警告
    if (validation.warnings.length > 0) {
      console.warn('[BuilderEngine] Configuration warnings:', validation.warnings)
    }

    // 3. 验证项目
    const projectValidation = validateProjectStructure(project)
    if (!projectValidation.valid) {
      throw new ValidationError(
        `Invalid project: ${projectValidation.errors.join(', ')}`,
        { errors: projectValidation.errors, project }
      )
    }

    // 输出项目警告
    if (projectValidation.warnings.length > 0) {
      console.warn('[BuilderEngine] Project warnings:', projectValidation.warnings)
    }

    this.container = container

    // 4. 合并默认配置
    this.options = {
      snapToGrid: options.snapToGrid ?? true,
      gridSize: options.gridSize ?? 1,
      maxHistoryLength: options.maxHistoryLength ?? 50,
      enableCollisionDetection: options.enableCollisionDetection ?? true,
      backgroundColor: options.backgroundColor ?? 0xf0f0f0,
    }

    // 5. 初始化性能监控器
    this.performanceMonitor = new PerformanceMonitor({
      enabled: false, // 默认关闭
      logToConsole: true,
      threshold: 10, // 只记录超过 10ms 的操作
    })

    // 6. 初始化项目管理器
    this.projectManager = new ProjectManager(project)

    // 监听项目数据变更
    this.projectManager.onChange((updatedProject) => {
      this.emit('project-changed', updatedProject)
    })

    // 7. 初始化工具管理器
    this.toolManager = new ToolManager('select')

    // 监听工具变更
    this.toolManager.onChange((tool) => {
      this.emit('tool-changed', tool)
    })

    // 8. 初始化历史记录管理器
    this.historyManager = new HistoryManager(this.options.maxHistoryLength)

    // 监听历史变更
    this.historyManager.onChange(() => {
      this.emit('history-changed')
    })

    // 保存初始状态到历史
    this.historyManager.push(project)

    // 9. 初始化 ThreeEngine
    this.threeEngine = new ThreeEngine(container, {
      backgroundColor: this.options.backgroundColor,
      antialias: true,
      cameraMode: 'orbit',
    })

    // 添加网格辅助线
    this.threeEngine.addGridHelper(100, 100)

    console.log('[BuilderEngine] Initialized successfully')
  }

  // ==========================================================================
  // 生命周期方法
  // ==========================================================================

  /**
   * 启动引擎
   * 
   * 启动渲染循环并初始化所有管理器
   */
  public start(): void {
    if (this.isStarted) {
      console.warn('[BuilderEngine] Already started')
      return
    }

    if (this.isDisposed) {
      throw new ConfigurationError(
        'Cannot start disposed engine'
      )
    }

    this.threeEngine.start()
    this.isStarted = true

    console.log('[BuilderEngine] Started')
  }

  /**
   * 停止引擎
   * 
   * 停止渲染循环但不释放资源
   */
  public stop(): void {
    if (!this.isStarted) {
      console.warn('[BuilderEngine] Not started')
      return
    }

    this.threeEngine.stop()
    this.isStarted = false

    console.log('[BuilderEngine] Stopped')
  }

  /**
   * 销毁引擎，释放所有资源
   * 
   * 重要：组件卸载时必须调用，否则会内存泄漏
   */
  public dispose(): void {
    if (this.isDisposed) {
      console.warn('[BuilderEngine] Already disposed')
      return
    }

    // 停止引擎
    if (this.isStarted) {
      this.stop()
    }

    // 销毁 ThreeEngine
    this.threeEngine.dispose()

    // 清空事件监听器
    this.eventListeners.clear()

    this.isDisposed = true

    console.log('[BuilderEngine] Disposed successfully')
  }

  // ==========================================================================
  // 项目管理方法
  // ==========================================================================

  /**
   * 加载项目数据
   * 
   * @param project - 商城项目数据
   * 
   * @example
   * ```typescript
   * const newProject = createEmptyProject('New Mall')
   * engine.loadProject(newProject)
   * ```
   */
  public loadProject(project: MallProject): void {
    const validation = validateProjectStructure(project)
    if (!validation.valid) {
      throw new ValidationError(
        `Invalid project: ${validation.errors.join(', ')}`,
        { errors: validation.errors, project }
      )
    }

    this.projectManager.loadProject(project)
    // 项目变更事件会由 ProjectManager 的 onChange 回调自动触发
  }

  /**
   * 获取当前项目数据
   * 
   * @returns 项目数据的深拷贝
   * 
   * @example
   * ```typescript
   * const project = engine.getProject()
   * console.log(project.name)
   * ```
   */
  public getProject(): MallProject {
    return this.projectManager.getProject()
  }

  /**
   * 导出项目数据为 JSON
   * 
   * 委托给 ProjectIO 模块的 exportProject 函数。
   * 
   * @returns JSON 字符串
   * 
   * @example
   * ```typescript
   * const json = engine.exportProject()
   * localStorage.setItem('project', json)
   * ```
   */
  public exportProject(): string {
    return this.performanceMonitor.measure('exportProject', () => {
      const project = this.projectManager.getProject()
      return exportProject(project)
    })
  }

  /**
   * 从 JSON 导入项目数据
   * 
   * 委托给 ProjectIO 模块的 importProject 函数。
   * 
   * @param json - JSON 字符串
   * @throws {ImportExportError} 当 JSON 格式无效或导入失败时
   * 
   * @example
   * ```typescript
   * const json = localStorage.getItem('project')
   * if (json) {
   *   try {
   *     engine.importProject(json)
   *   } catch (error) {
   *     console.error('Import failed:', error)
   *   }
   * }
   * ```
   */
  public importProject(json: string): void {
    this.performanceMonitor.measure('importProject', () => {
      const result = importProject(json)
      
      if (!result.success) {
        throw new ImportExportError(
          result.error || 'Import failed',
          { result }
        )
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.warn('[BuilderEngine] Import warnings:', result.warnings)
      }
      
      this.loadProject(result.project!)
      console.log('[BuilderEngine] Project imported successfully')
    })
  }

  // ==========================================================================
  // 工具管理方法
  // ==========================================================================

  /**
   * 设置当前工具
   * 
   * @param tool - 工具类型
   * 
   * @example
   * ```typescript
   * engine.setTool('draw-rect')
   * ```
   */
  public setTool(tool: BuilderTool): void {
    this.toolManager.setTool(tool)
    // 工具变更事件会由 ToolManager 的 onChange 回调自动触发
  }

  /**
   * 获取当前工具
   * 
   * @returns 当前工具类型
   * 
   * @example
   * ```typescript
   * const tool = engine.getCurrentTool()
   * console.log(tool) // 'select'
   * ```
   */
  public getCurrentTool(): BuilderTool {
    return this.toolManager.getCurrentTool()
  }

  // ==========================================================================
  // 区域操作方法（占位符）
  // ==========================================================================

  /**
   * 创建区域
   * 
   * @param definition - 区域定义
   * @returns 区域 ID
   */
  public createArea(definition: AreaDefinition): string {
    // TODO: 实现区域创建逻辑
    throw new Error('Not implemented')
  }

  /**
   * 删除区域
   * 
   * @param areaId - 区域 ID
   */
  public deleteArea(areaId: string): void {
    // TODO: 实现区域删除逻辑
    throw new Error('Not implemented')
  }

  /**
   * 更新区域属性
   * 
   * @param areaId - 区域 ID
   * @param updates - 要更新的属性
   */
  public updateArea(areaId: string, updates: Partial<AreaDefinition>): void {
    // TODO: 实现区域更新逻辑
    throw new Error('Not implemented')
  }

  /**
   * 移动区域
   * 
   * @param areaId - 区域 ID
   * @param offset - 偏移量
   */
  public moveArea(areaId: string, offset: Vector2D): void {
    // TODO: 实现区域移动逻辑
    throw new Error('Not implemented')
  }

  /**
   * 选中区域
   * 
   * @param areaId - 区域 ID，null 表示取消选中
   */
  public selectArea(areaId: string | null): void {
    // TODO: 实现区域选择逻辑
    throw new Error('Not implemented')
  }

  /**
   * 获取选中的区域
   * 
   * @returns 选中的区域，如果没有选中则返回 null
   */
  public getSelectedArea(): AreaDefinition | null {
    // TODO: 实现获取选中区域逻辑
    throw new Error('Not implemented')
  }

  // ==========================================================================
  // 历史记录方法
  // ==========================================================================

  /**
   * 撤销上一次操作
   * 
   * @returns 是否成功撤销
   * 
   * @example
   * ```typescript
   * if (engine.canUndo()) {
   *   engine.undo()
   * }
   * ```
   */
  public undo(): boolean {
    const project = this.historyManager.undo()
    if (project) {
      this.projectManager.loadProject(project)
      return true
    }
    return false
  }

  /**
   * 重做上一次撤销的操作
   * 
   * @returns 是否成功重做
   * 
   * @example
   * ```typescript
   * if (engine.canRedo()) {
   *   engine.redo()
   * }
   * ```
   */
  public redo(): boolean {
    const project = this.historyManager.redo()
    if (project) {
      this.projectManager.loadProject(project)
      return true
    }
    return false
  }

  /**
   * 是否可以撤销
   * 
   * @returns 是否可以撤销
   * 
   * @example
   * ```typescript
   * const canUndo = engine.canUndo()
   * ```
   */
  public canUndo(): boolean {
    return this.historyManager.canUndo()
  }

  /**
   * 是否可以重做
   * 
   * @returns 是否可以重做
   * 
   * @example
   * ```typescript
   * const canRedo = engine.canRedo()
   * ```
   */
  public canRedo(): boolean {
    return this.historyManager.canRedo()
  }

  // ==========================================================================
  // 楼层管理方法（占位符）
  // ==========================================================================

  /**
   * 添加楼层
   * 
   * @param floor - 楼层定义
   * @returns 楼层 ID
   */
  public addFloor(floor: FloorDefinition): string {
    // TODO: 实现添加楼层逻辑
    throw new Error('Not implemented')
  }

  /**
   * 删除楼层
   * 
   * @param floorId - 楼层 ID
   */
  public removeFloor(floorId: string): void {
    // TODO: 实现删除楼层逻辑
    throw new Error('Not implemented')
  }

  /**
   * 设置当前楼层
   * 
   * @param floorId - 楼层 ID
   */
  public setCurrentFloor(floorId: string): void {
    // TODO: 实现设置当前楼层逻辑
    throw new Error('Not implemented')
  }

  /**
   * 获取当前楼层
   * 
   * @returns 当前楼层，如果没有则返回 null
   */
  public getCurrentFloor(): FloorDefinition | null {
    // TODO: 实现获取当前楼层逻辑
    throw new Error('Not implemented')
  }

  /**
   * 获取所有楼层
   * 
   * @returns 楼层列表
   */
  public getFloors(): FloorDefinition[] {
    // TODO: 实现获取楼层列表逻辑
    throw new Error('Not implemented')
  }

  // ==========================================================================
  // 材质系统方法（占位符）
  // ==========================================================================

  /**
   * 设置区域类型
   * 
   * @param areaId - 区域 ID
   * @param type - 区域类型
   */
  public setAreaType(areaId: string, type: AreaType): void {
    // TODO: 实现设置区域类型逻辑
    throw new Error('Not implemented')
  }

  /**
   * 获取材质预设列表
   * 
   * @returns 材质预设列表
   */
  public getMaterialPresets(): any[] {
    // TODO: 实现获取材质预设逻辑
    throw new Error('Not implemented')
  }

  // ==========================================================================
  // 网格吸附方法（占位符）
  // ==========================================================================

  /**
   * 设置网格吸附
   * 
   * @param enabled - 是否启用
   */
  public setSnapToGrid(enabled: boolean): void {
    // TODO: 实现设置网格吸附逻辑
    throw new Error('Not implemented')
  }

  /**
   * 设置网格大小
   * 
   * @param size - 网格大小
   */
  public setGridSize(size: number): void {
    // TODO: 实现设置网格大小逻辑
    throw new Error('Not implemented')
  }

  // ==========================================================================
  // 相机控制方法（占位符）
  // ==========================================================================

  /**
   * 重置相机到默认位置
   */
  public resetCamera(): void {
    // TODO: 实现重置相机逻辑
    throw new Error('Not implemented')
  }

  /**
   * 聚焦到指定区域
   * 
   * @param areaId - 区域 ID
   */
  public focusOnArea(areaId: string): void {
    // TODO: 实现聚焦区域逻辑
    throw new Error('Not implemented')
  }

  // ==========================================================================
  // 事件系统方法
  // ==========================================================================

  /**
   * 注册事件监听器
   * 
   * @param event - 事件类型
   * @param callback - 回调函数
   * @returns 取消注册的函数
   * 
   * @example
   * ```typescript
   * const unsubscribe = engine.on('area-selected', (area) => {
   *   console.log('Selected:', area)
   * })
   * 
   * // 取消监听
   * unsubscribe()
   * ```
   */
  public on(event: BuilderEngineEvent, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    const listeners = this.eventListeners.get(event)!
    listeners.add(callback)

    // 返回取消注册的函数
    return () => {
      this.off(event, callback)
    }
  }

  /**
   * 取消事件监听器
   * 
   * @param event - 事件类型
   * @param callback - 回调函数
   * 
   * @example
   * ```typescript
   * const handler = (area) => console.log(area)
   * engine.on('area-selected', handler)
   * 
   * // 取消监听
   * engine.off('area-selected', handler)
   * ```
   */
  public off(event: BuilderEngineEvent, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
      
      // 如果没有监听器了，删除整个 Set
      if (listeners.size === 0) {
        this.eventListeners.delete(event)
      }
    }
  }

  // ==========================================================================
  // 访问器
  // ==========================================================================

  /**
   * 获取 ThreeEngine 实例
   * 
   * @returns ThreeEngine 实例
   */
  public getThreeEngine(): ThreeEngine {
    return this.threeEngine
  }

  /**
   * 获取 DOM 容器
   * 
   * @returns DOM 容器元素
   */
  public getContainer(): HTMLElement {
    return this.container
  }

  /**
   * 启用或禁用性能监控
   * 
   * @param enabled - 是否启用性能监控，默认为 true
   * 
   * @example
   * ```typescript
   * // 启用性能监控
   * engine.enablePerformanceMonitoring(true)
   * 
   * // 禁用性能监控
   * engine.enablePerformanceMonitoring(false)
   * ```
   */
  public enablePerformanceMonitoring(enabled: boolean = true): void {
    this.performanceMonitor.updateConfig({ enabled })
    console.log(`[BuilderEngine] Performance monitoring ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * 获取性能统计信息
   * 
   * 返回所有已记录操作的性能统计数据。
   * 
   * @returns Map，键为操作名称，值为统计信息
   * 
   * @example
   * ```typescript
   * const stats = engine.getPerformanceStats()
   * 
   * for (const [operation, stat] of stats) {
   *   console.log(`${operation}:`)
   *   console.log(`  Count: ${stat.count}`)
   *   console.log(`  Avg: ${stat.avgDuration.toFixed(2)}ms`)
   *   console.log(`  Max: ${stat.maxDuration.toFixed(2)}ms`)
   * }
   * ```
   */
  public getPerformanceStats(): Map<string, any> {
    return this.performanceMonitor.getStats()
  }

  /**
   * 清除性能记录
   * 
   * @example
   * ```typescript
   * engine.clearPerformanceRecords()
   * ```
   */
  public clearPerformanceRecords(): void {
    this.performanceMonitor.clear()
    console.log('[BuilderEngine] Performance records cleared')
  }

  // ==========================================================================
  // 私有工具方法
  // ==========================================================================

  /**
   * 保存当前状态到历史记录
   */
  private saveHistory(): void {
    const project = this.projectManager.getProject()
    this.historyManager.push(project)
  }

  /**
   * 触发事件
   * 
   * @param event - 事件类型
   * @param data - 事件数据
   */
  private emit(event: BuilderEngineEvent, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[BuilderEngine] Error in event listener for "${event}":`, error)
        }
      })
    }
  }
}
