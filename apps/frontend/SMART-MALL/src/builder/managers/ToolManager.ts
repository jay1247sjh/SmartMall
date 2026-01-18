/**
 * ToolManager - 工具管理器
 * 
 * 负责：
 * - 管理当前工具状态
 * - 处理工具切换
 * - 处理鼠标事件
 * - 协调不同工具的行为
 */

import type { BuilderTool } from '../BuilderEngine'
import { BaseManager } from '../core/BaseManager'

/**
 * 鼠标事件数据
 */
export interface MouseEventData {
  x: number
  y: number
  button: number
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

/**
 * ToolManager 类
 */
export class ToolManager extends BaseManager<BuilderTool> {
  protected readonly managerName = 'ToolManager'

  /** 当前工具 */
  private currentTool: BuilderTool = 'select'

  /** 是否正在绘制 */
  private isDrawing: boolean = false

  /** 绘制点列表 */
  private drawPoints: Array<{ x: number; y: number }> = []

  /**
   * 创建 ToolManager 实例
   * 
   * @param initialTool - 初始工具，默认为 'select'
   */
  constructor(initialTool: BuilderTool = 'select') {
    super()
    this.currentTool = initialTool
  }

  /**
   * 设置当前工具
   * 
   * @param tool - 工具类型
   */
  public setTool(tool: BuilderTool): void {
    if (this.currentTool === tool) {
      return
    }

    // 切换工具前清理状态
    this.cleanup()

    this.currentTool = tool
    this.notify(tool)

    console.log(`[ToolManager] Tool changed to: ${tool}`)
  }

  /**
   * 获取当前工具
   * 
   * @returns 当前工具类型
   */
  public getCurrentTool(): BuilderTool {
    return this.currentTool
  }

  /**
   * 是否正在绘制
   * 
   * @returns 是否正在绘制
   */
  public getIsDrawing(): boolean {
    return this.isDrawing
  }

  /**
   * 开始绘制
   */
  public startDrawing(): void {
    this.isDrawing = true
    this.drawPoints = []
  }

  /**
   * 结束绘制
   */
  public endDrawing(): void {
    this.isDrawing = false
    this.drawPoints = []
  }

  /**
   * 添加绘制点
   * 
   * @param point - 点坐标
   */
  public addDrawPoint(point: { x: number; y: number }): void {
    this.drawPoints.push(point)
  }

  /**
   * 获取绘制点列表
   * 
   * @returns 绘制点列表
   */
  public getDrawPoints(): Array<{ x: number; y: number }> {
    return [...this.drawPoints]
  }

  /**
   * 清除绘制点
   */
  public clearDrawPoints(): void {
    this.drawPoints = []
  }

  /**
   * 清理工具状态
   */
  private cleanup(): void {
    this.isDrawing = false
    this.drawPoints = []
  }
}
