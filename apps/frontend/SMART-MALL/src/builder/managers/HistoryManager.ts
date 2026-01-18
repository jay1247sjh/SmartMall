/**
 * HistoryManager - 历史记录管理器
 * 
 * 负责：
 * - 管理历史记录栈
 * - 实现撤销/重做功能
 * - 限制历史记录长度
 * - 通知历史状态变更
 */

import type { MallProject } from '../types'
import { BaseManager } from '../core/BaseManager'

/**
 * 历史变更回调函数类型
 */
export type HistoryChangeCallback = () => void

/**
 * HistoryManager 类
 */
export class HistoryManager extends BaseManager<void> {
  /** 管理器名称 */
  protected readonly managerName = 'HistoryManager'
  /** 历史记录栈 */
  private historyStack: string[] = []

  /** 当前历史索引 */
  private currentIndex: number = -1

  /** 最大历史记录长度 */
  private maxLength: number

  /**
   * 创建 HistoryManager 实例
   * 
   * @param maxLength - 最大历史记录长度，默认 50
   */
  constructor(maxLength: number = 50) {
    super()
    this.maxLength = maxLength
  }

  /**
   * 推入新的历史记录
   * 
   * @param project - 项目数据
   */
  public push(project: MallProject): void {
    const snapshot = JSON.stringify(project)

    // 如果当前不在最新位置，删除后面的历史
    if (this.currentIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.currentIndex + 1)
    }

    // 添加新快照
    this.historyStack.push(snapshot)
    this.currentIndex++

    // 限制历史长度
    if (this.historyStack.length > this.maxLength) {
      this.historyStack.shift()
      this.currentIndex--
    }

    this.notify()
  }

  /**
   * 撤销
   * 
   * @returns 撤销后的项目数据，如果无法撤销则返回 null
   */
  public undo(): MallProject | null {
    if (!this.canUndo()) {
      return null
    }

    this.currentIndex--
    const snapshot = this.historyStack[this.currentIndex]
    
    if (!snapshot) {
      return null
    }

    this.notify()
    return JSON.parse(snapshot)
  }

  /**
   * 重做
   * 
   * @returns 重做后的项目数据，如果无法重做则返回 null
   */
  public redo(): MallProject | null {
    if (!this.canRedo()) {
      return null
    }

    this.currentIndex++
    const snapshot = this.historyStack[this.currentIndex]
    
    if (!snapshot) {
      return null
    }

    this.notify()
    return JSON.parse(snapshot)
  }

  /**
   * 是否可以撤销
   * 
   * @returns 是否可以撤销
   */
  public canUndo(): boolean {
    return this.currentIndex > 0
  }

  /**
   * 是否可以重做
   * 
   * @returns 是否可以重做
   */
  public canRedo(): boolean {
    return this.currentIndex < this.historyStack.length - 1
  }

  /**
   * 清空历史记录
   */
  public clear(): void {
    this.historyStack = []
    this.currentIndex = -1
    this.notify()
  }

  /**
   * 获取历史记录数量
   * 
   * @returns 历史记录数量
   */
  public getHistoryCount(): number {
    return this.historyStack.length
  }

  /**
   * 获取当前索引
   * 
   * @returns 当前索引
   */
  public getCurrentIndex(): number {
    return this.currentIndex
  }
}
