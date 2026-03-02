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
import { ConfigurationError, ValidationError, ImportExportError } from './core/errors'
import { OptionsValidator, validateProjectStructure } from './core/validators'
import { PerformanceMonitor } from './core/performance'
import { exportProject, importProject } from './io/project-io'
import { getAllMaterialPresets, type MaterialPreset } from './materials'
import { devLog } from '@/utils/dev-log'

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

    devLog('[BuilderEngine] Initialized successfully')
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

    devLog('[BuilderEngine] Started')
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

    devLog('[BuilderEngine] Stopped')
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

    devLog('[BuilderEngine] Disposed successfully')
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
      devLog('[BuilderEngine] Project imported successfully')
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
  // 区域操作方法
  // ==========================================================================

  /** 当前选中的区域 ID */
  private selectedAreaId: string | null = null

  /** 当前楼层 ID */
  private currentFloorId: string | null = null

  /**
   * 创建区域
   * 
   * @param definition - 区域定义
   * @param floorId - 目标楼层 ID（可选，默认使用当前楼层）
   * @returns 区域 ID
   * 
   * @example
   * ```typescript
   * const areaId = engine.createArea({
   *   id: 'area-1',
   *   name: '店铺A',
   *   type: 'retail',
   *   shape: { vertices: [...], isClosed: true },
   *   color: '#ff0000',
   *   properties: { area: 100, perimeter: 40 },
   *   visible: true,
   *   locked: false
   * })
   * ```
   */
  public createArea(definition: AreaDefinition, floorId?: string): string {
    const { project, floor } = this.getTargetFloor(floorId)

    // 添加区域到楼层
    floor.areas.push({ ...definition })

    // 更新项目
    this.projectManager.loadProject(project)
    this.saveHistory()

    // 触发事件
    this.emit('area-created', definition)

    return definition.id
  }

  /**
   * 删除区域
   * 
   * @param areaId - 区域 ID
   * @param floorId - 目标楼层 ID（可选，默认使用当前楼层）
   * 
   * @example
   * ```typescript
   * engine.deleteArea('area-1')
   * ```
   */
  public deleteArea(areaId: string, floorId?: string): void {
    const { project, floor, index } = this.getTargetArea(areaId, floorId)

    const deletedArea = floor.areas[index]
    floor.areas.splice(index, 1)

    // 如果删除的是选中的区域，清除选中状态
    if (this.selectedAreaId === areaId) {
      this.selectedAreaId = null
    }

    // 更新项目
    this.projectManager.loadProject(project)
    this.saveHistory()

    // 触发事件
    this.emit('area-deleted', deletedArea)
  }

  /**
   * 更新区域属性
   * 
   * @param areaId - 区域 ID
   * @param updates - 要更新的属性
   * @param floorId - 目标楼层 ID（可选，默认使用当前楼层）
   * 
   * @example
   * ```typescript
   * engine.updateArea('area-1', { name: '新名称', color: '#00ff00' })
   * ```
   */
  public updateArea(areaId: string, updates: Partial<AreaDefinition>, floorId?: string): void {
    const { project, floor, index } = this.getTargetArea(areaId, floorId)
    const currentArea = floor.areas[index]
    if (!currentArea) {
      throw new ValidationError('Area not found', { areaId })
    }

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ) as Partial<AreaDefinition>

    // 更新区域属性
    floor.areas[index] = {
      ...currentArea,
      ...sanitizedUpdates,
      id: areaId, // 确保 ID 不被覆盖
    }

    // 更新项目
    this.projectManager.loadProject(project)
    this.saveHistory()

    // 触发事件
    this.emit('area-updated', floor.areas[index])
  }

  /**
   * 移动区域
   * 
   * @param areaId - 区域 ID
   * @param offset - 偏移量 { x, y }
   * @param floorId - 目标楼层 ID（可选，默认使用当前楼层）
   * 
   * @example
   * ```typescript
   * engine.moveArea('area-1', { x: 10, y: 5 })
   * ```
   */
  public moveArea(areaId: string, offset: Vector2D, floorId?: string): void {
    const { project, area } = this.getTargetArea(areaId, floorId)

    // 移动所有顶点
    area.shape.vertices = area.shape.vertices.map(v => ({
      x: v.x + offset.x,
      y: v.y + offset.y,
    }))

    // 更新项目
    this.projectManager.loadProject(project)
    this.saveHistory()

    // 触发事件
    this.emit('area-updated', area)
  }

  /**
   * 选中区域
   * 
   * @param areaId - 区域 ID，null 表示取消选中
   * 
   * @example
   * ```typescript
   * // 选中区域
   * engine.selectArea('area-1')
   * 
   * // 取消选中
   * engine.selectArea(null)
   * ```
   */
  public selectArea(areaId: string | null): void {
    const previousId = this.selectedAreaId
    this.selectedAreaId = areaId

    if (areaId !== previousId) {
      const area = areaId ? this.findAreaById(areaId) : null
      this.emit('area-selected', area)
    }
  }

  /**
   * 获取选中的区域
   * 
   * @returns 选中的区域，如果没有选中则返回 null
   * 
   * @example
   * ```typescript
   * const area = engine.getSelectedArea()
   * if (area) {
   *   console.log('Selected:', area.name)
   * }
   * ```
   */
  public getSelectedArea(): AreaDefinition | null {
    if (!this.selectedAreaId) return null
    return this.findAreaById(this.selectedAreaId)
  }

  /**
   * 获取选中的区域 ID
   * 
   * @returns 选中的区域 ID，如果没有选中则返回 null
   */
  public getSelectedAreaId(): string | null {
    return this.selectedAreaId
  }

  /**
   * 根据 ID 查找区域（在所有楼层中搜索）
   * 
   * @param areaId - 区域 ID
   * @returns 区域定义，如果未找到则返回 null
   */
  private findAreaById(areaId: string): AreaDefinition | null {
    const project = this.projectManager.getProject()
    for (const floor of project.floors) {
      const area = floor.areas.find(a => a.id === areaId)
      if (area) return area
    }
    return null
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
  // 楼层管理方法
  // ==========================================================================

  /**
   * 添加楼层
   * 
   * @param floor - 楼层定义
   * @returns 楼层 ID
   * 
   * @example
   * ```typescript
   * const floorId = engine.addFloor({
   *   id: 'floor-2',
   *   name: '2F',
   *   level: 2,
   *   height: 4,
   *   inheritOutline: true,
   *   areas: [],
   *   visible: true,
   *   locked: false
   * })
   * ```
   */
  public addFloor(floor: FloorDefinition): string {
    const project = this.projectManager.getProject()

    // 检查楼层 ID 是否已存在
    if (project.floors.some(f => f.id === floor.id)) {
      throw new ValidationError('Floor ID already exists', { floorId: floor.id })
    }

    // 添加楼层并按 level 排序
    project.floors.push({ ...floor })
    project.floors.sort((a, b) => a.level - b.level)

    // 更新项目
    this.projectManager.loadProject(project)
    this.saveHistory()

    // 触发事件
    this.emit('floor-changed', floor)

    return floor.id
  }

  /**
   * 删除楼层
   * 
   * @param floorId - 楼层 ID
   * 
   * @example
   * ```typescript
   * engine.removeFloor('floor-2')
   * ```
   */
  public removeFloor(floorId: string): void {
    const project = this.projectManager.getProject()

    // 至少保留一个楼层
    if (project.floors.length <= 1) {
      throw new ValidationError('Cannot delete the last floor', { floorId })
    }

    const index = project.floors.findIndex(f => f.id === floorId)
    if (index === -1) {
      throw new ValidationError('Floor not found', { floorId })
    }

    const deletedFloor = project.floors[index]
    project.floors.splice(index, 1)

    // 如果删除的是当前楼层，切换到第一个楼层
    if (this.currentFloorId === floorId) {
      this.currentFloorId = project.floors[0]?.id || null
    }

    // 更新项目
    this.projectManager.loadProject(project)
    this.saveHistory()

    // 触发事件
    this.emit('floor-changed', deletedFloor)
  }

  /**
   * 设置当前楼层
   * 
   * @param floorId - 楼层 ID
   * 
   * @example
   * ```typescript
   * engine.setCurrentFloor('floor-2')
   * ```
   */
  public setCurrentFloor(floorId: string): void {
    const project = this.projectManager.getProject()
    const floor = project.floors.find(f => f.id === floorId)

    if (!floor) {
      throw new ValidationError('Floor not found', { floorId })
    }

    if (this.currentFloorId !== floorId) {
      this.currentFloorId = floorId
      this.emit('floor-changed', floor)
    }
  }

  /**
   * 获取当前楼层
   * 
   * @returns 当前楼层，如果没有则返回 null
   * 
   * @example
   * ```typescript
   * const floor = engine.getCurrentFloor()
   * if (floor) {
   *   console.log('Current floor:', floor.name)
   * }
   * ```
   */
  public getCurrentFloor(): FloorDefinition | null {
    if (!this.currentFloorId) return null
    const project = this.projectManager.getProject()
    return project.floors.find(f => f.id === this.currentFloorId) || null
  }

  /**
   * 获取当前楼层 ID
   * 
   * @returns 当前楼层 ID，如果没有则返回 null
   */
  public getCurrentFloorId(): string | null {
    return this.currentFloorId
  }

  /**
   * 获取所有楼层
   * 
   * @returns 楼层列表（按 level 排序）
   * 
   * @example
   * ```typescript
   * const floors = engine.getFloors()
   * floors.forEach(f => console.log(f.name))
   * ```
   */
  public getFloors(): FloorDefinition[] {
    const project = this.projectManager.getProject()
    return [...project.floors].sort((a, b) => a.level - b.level)
  }

  /**
   * 更新楼层属性
   * 
   * @param floorId - 楼层 ID
   * @param updates - 要更新的属性
   * 
   * @example
   * ```typescript
   * engine.updateFloor('floor-1', { name: '1F 大厅', height: 5 })
   * ```
   */
  public updateFloor(floorId: string, updates: Partial<FloorDefinition>): void {
    const project = this.projectManager.getProject()
    const index = project.floors.findIndex(f => f.id === floorId)

    if (index === -1) {
      throw new ValidationError('Floor not found', { floorId })
    }

    const currentFloor = project.floors[index]
    if (!currentFloor) {
      throw new ValidationError('Floor not found', { floorId })
    }

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ) as Partial<FloorDefinition>

    // 更新楼层属性
    project.floors[index] = {
      ...currentFloor,
      ...sanitizedUpdates,
      id: floorId, // 确保 ID 不被覆盖
    }

    // 如果更新了 level，重新排序
    if (updates.level !== undefined) {
      project.floors.sort((a, b) => a.level - b.level)
    }

    // 更新项目
    this.projectManager.loadProject(project)
    this.saveHistory()

    // 触发事件
    this.emit('floor-changed', project.floors.find(f => f.id === floorId))
  }

  /**
   * 切换楼层可见性
   * 
   * @param floorId - 楼层 ID
   * 
   * @example
   * ```typescript
   * engine.toggleFloorVisibility('floor-2')
   * ```
   */
  public toggleFloorVisibility(floorId: string): void {
    const project = this.projectManager.getProject()
    const floor = project.floors.find(f => f.id === floorId)

    if (!floor) {
      throw new ValidationError('Floor not found', { floorId })
    }

    floor.visible = !floor.visible

    // 更新项目
    this.projectManager.loadProject(project)

    // 触发事件
    this.emit('floor-changed', floor)
  }

  // ==========================================================================
  // 材质系统方法
  // ==========================================================================

  /**
   * 设置区域类型
   * 
   * @param areaId - 区域 ID
   * @param type - 区域类型
   * @param floorId - 目标楼层 ID（可选，默认使用当前楼层）
   * 
   * @example
   * ```typescript
   * engine.setAreaType('area-1', 'retail')
   * ```
   */
  public setAreaType(areaId: string, type: AreaType, floorId?: string): void {
    this.updateArea(areaId, { type }, floorId)
  }

  /**
   * 获取材质预设列表
   * 
   * 返回所有可用的材质预设，包括区域类型和基础设施类型。
   * 
   * @returns 材质预设列表
   * 
   * @example
   * ```typescript
   * const presets = engine.getMaterialPresets()
   * presets.forEach(p => console.log(p.name, p.color))
   * ```
   */
  public getMaterialPresets(): MaterialPreset[] {
    return getAllMaterialPresets()
  }

  // ==========================================================================
  // 网格吸附方法
  // ==========================================================================

  /**
   * 设置网格吸附
   * 
   * @param enabled - 是否启用
   * 
   * @example
   * ```typescript
   * engine.setSnapToGrid(true)
   * ```
   */
  public setSnapToGrid(enabled: boolean): void {
    this.options.snapToGrid = enabled
  }

  /**
   * 获取网格吸附状态
   * 
   * @returns 是否启用网格吸附
   */
  public isSnapToGridEnabled(): boolean {
    return this.options.snapToGrid ?? true
  }

  /**
   * 设置网格大小
   * 
   * @param size - 网格大小（米）
   * 
   * @example
   * ```typescript
   * engine.setGridSize(0.5) // 0.5米网格
   * ```
   */
  public setGridSize(size: number): void {
    if (size <= 0) {
      throw new ValidationError('Grid size must be positive', { size })
    }
    this.options.gridSize = size
  }

  /**
   * 获取网格大小
   * 
   * @returns 网格大小（米）
   */
  public getGridSize(): number {
    return this.options.gridSize ?? 1
  }

  /**
   * 将坐标对齐到网格
   * 
   * @param point - 原始坐标
   * @returns 对齐后的坐标
   * 
   * @example
   * ```typescript
   * const snapped = engine.snapToGrid({ x: 10.3, y: 5.7 })
   * // 如果网格大小为 1，返回 { x: 10, y: 6 }
   * ```
   */
  public snapToGrid(point: Vector2D): Vector2D {
    if (!this.options.snapToGrid) return point

    const gridSize = this.options.gridSize ?? 1
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    }
  }

  // ==========================================================================
  // 相机控制方法
  // ==========================================================================

  /**
   * 重置相机到默认位置
   * 
   * 将相机移动到俯视整个商城的位置。
   * 
   * @example
   * ```typescript
   * engine.resetCamera()
   * ```
   */
  public resetCamera(): void {
    // 获取商城轮廓的边界框来计算合适的相机位置
    const project = this.projectManager.getProject()
    const outline = project.outline

    if (outline && outline.vertices.length >= 3) {
      // 计算轮廓中心
      let centerX = 0
      let centerY = 0
      for (const v of outline.vertices) {
        centerX += v.x
        centerY += v.y
      }
      centerX /= outline.vertices.length
      centerY /= outline.vertices.length

      // 计算轮廓范围
      let maxDist = 0
      for (const v of outline.vertices) {
        const dist = Math.sqrt(
          Math.pow(v.x - centerX, 2) + Math.pow(v.y - centerY, 2)
        )
        maxDist = Math.max(maxDist, dist)
      }

      // 设置相机位置（俯视角度）
      const cameraHeight = Math.max(maxDist * 1.5, 50)
      this.threeEngine.setCameraPosition(centerX, cameraHeight, centerY + cameraHeight * 0.5)
      this.threeEngine.setCameraTarget(centerX, 0, centerY)
    } else {
      // 默认位置
      this.threeEngine.setCameraPosition(0, 100, 60)
      this.threeEngine.setCameraTarget(0, 0, 0)
    }

    this.threeEngine.requestRender()
  }

  /**
   * 聚焦到指定区域
   * 
   * 将相机移动到能够清晰看到指定区域的位置。
   * 
   * @param areaId - 区域 ID
   * 
   * @example
   * ```typescript
   * engine.focusOnArea('area-1')
   * ```
   */
  public focusOnArea(areaId: string): void {
    const area = this.findAreaById(areaId)
    if (!area) {
      throw new ValidationError('Area not found', { areaId })
    }

    // 计算区域中心
    const vertices = area.shape.vertices
    if (vertices.length === 0) return

    let centerX = 0
    let centerY = 0
    for (const v of vertices) {
      centerX += v.x
      centerY += v.y
    }
    centerX /= vertices.length
    centerY /= vertices.length

    // 计算区域范围
    let maxDist = 0
    for (const v of vertices) {
      const dist = Math.sqrt(
        Math.pow(v.x - centerX, 2) + Math.pow(v.y - centerY, 2)
      )
      maxDist = Math.max(maxDist, dist)
    }

    // 设置相机位置（斜向俯视）
    const cameraHeight = Math.max(maxDist * 2, 20)
    const cameraOffset = cameraHeight * 0.6

    this.threeEngine.setCameraPosition(
      centerX + cameraOffset,
      cameraHeight,
      -centerY + cameraOffset // 注意：Three.js 中 z 轴方向
    )
    this.threeEngine.setCameraTarget(centerX, 0, -centerY)

    this.threeEngine.requestRender()
  }

  /**
   * 设置相机位置
   * 
   * @param x - X 坐标
   * @param y - Y 坐标（高度）
   * @param z - Z 坐标
   * 
   * @example
   * ```typescript
   * engine.setCameraPosition(0, 50, 50)
   * ```
   */
  public setCameraPosition(x: number, y: number, z: number): void {
    this.threeEngine.setCameraPosition(x, y, z)
    this.threeEngine.requestRender()
  }

  /**
   * 设置相机目标点
   * 
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param z - Z 坐标
   * 
   * @example
   * ```typescript
   * engine.setCameraTarget(0, 0, 0)
   * ```
   */
  public setCameraTarget(x: number, y: number, z: number): void {
    this.threeEngine.setCameraTarget(x, y, z)
    this.threeEngine.requestRender()
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
    devLog(`[BuilderEngine] Performance monitoring ${enabled ? 'enabled' : 'disabled'}`)
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
    devLog('[BuilderEngine] Performance records cleared')
  }

  // ==========================================================================
  // 私有工具方法
  // ==========================================================================

  /**
   * 获取目标楼层（验证并返回）
   * 
   * @param floorId - 楼层 ID（可选，默认使用当前楼层）
   * @returns 包含项目和楼层的对象
   * @throws {ValidationError} 当没有选中楼层或楼层不存在时
   */
  private getTargetFloor(floorId?: string): { project: MallProject; floor: FloorDefinition } {
    const targetFloorId = floorId || this.currentFloorId
    if (!targetFloorId) {
      throw new ValidationError('No floor selected', { floorId: targetFloorId })
    }

    const project = this.projectManager.getProject()
    const floor = project.floors.find(f => f.id === targetFloorId)
    if (!floor) {
      throw new ValidationError('Floor not found', { floorId: targetFloorId })
    }

    return { project, floor }
  }

  /**
   * 获取目标区域（验证并返回）
   * 
   * @param areaId - 区域 ID
   * @param floorId - 楼层 ID（可选，默认使用当前楼层）
   * @returns 包含项目、楼层、区域和索引的对象
   * @throws {ValidationError} 当区域不存在时
   */
  private getTargetArea(areaId: string, floorId?: string): { 
    project: MallProject
    floor: FloorDefinition
    area: AreaDefinition
    index: number 
  } {
    const { project, floor } = this.getTargetFloor(floorId)
    const index = floor.areas.findIndex(a => a.id === areaId)
    if (index === -1) {
      throw new ValidationError('Area not found', { areaId })
    }
    const area = floor.areas[index]
    if (!area) {
      throw new ValidationError('Area not found', { areaId })
    }
    return { project, floor, area, index }
  }

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
