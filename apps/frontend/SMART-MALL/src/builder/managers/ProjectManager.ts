/**
 * ProjectManager - 项目数据管理器
 * 
 * 负责：
 * - 管理项目数据状态
 * - 提供数据访问接口
 * - 确保数据不可变性（通过深拷贝）
 * - 通知数据变更
 */

import type { MallProject } from '../types'
import { BaseManager } from '../core/BaseManager'
import { deepClone } from '../utils/clone'

/**
 * ProjectManager 类
 */
export class ProjectManager extends BaseManager<MallProject> {
  protected readonly managerName = 'ProjectManager'

  /** 当前项目数据 */
  private project: MallProject

  /**
   * 创建 ProjectManager 实例
   * 
   * @param project - 初始项目数据
   */
  constructor(project: MallProject) {
    super()
    this.project = deepClone(project)
  }

  /**
   * 加载项目数据
   * 
   * @param project - 项目数据
   */
  public loadProject(project: MallProject): void {
    this.project = deepClone(project)
    this.notify(this.getProject())
  }

  /**
   * 获取项目数据
   * 
   * @returns 项目数据的深拷贝
   */
  public getProject(): MallProject {
    return deepClone(this.project)
  }

  /**
   * 更新项目数据
   * 
   * @param updates - 要更新的属性
   */
  public updateProject(updates: Partial<MallProject>): void {
    this.project = {
      ...this.project,
      ...updates,
    }
    this.notify(this.getProject())
  }
}
