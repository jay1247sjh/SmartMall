/**
 * 系统状态 - 枚举定义
 * 定义系统级别的模式和状态
 */

/**
 * 系统模式枚举
 * 定义系统运行模式
 */
export enum SystemMode {
  RUNTIME = 'RUNTIME',  // 运行态 - 用户浏览导航
  CONFIG = 'CONFIG'     // 配置态 - 管理员/商家编辑
}

/**
 * 时间状态枚举
 * 定义系统所处的时间阶段
 */
export enum TemporalState {
  READY = 'READY',
  LOADING = 'LOADING',
  TRANSITION = 'TRANSITION',
  ERROR = 'ERROR'
}
