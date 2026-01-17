/**
 * 店铺状态枚举
 * 
 * @shared 前端、后端、AI服务共用
 */
export enum StoreStatus {
  /** 待审批 */
  PENDING = 'PENDING',
  /** 营业中 */
  ACTIVE = 'ACTIVE',
  /** 暂停营业 */
  INACTIVE = 'INACTIVE',
  /** 已关闭 */
  CLOSED = 'CLOSED'
}

/**
 * 店铺状态显示名称映射
 */
export const STORE_STATUS_NAMES: Record<StoreStatus, string> = {
  [StoreStatus.PENDING]: '待审批',
  [StoreStatus.ACTIVE]: '营业中',
  [StoreStatus.INACTIVE]: '暂停营业',
  [StoreStatus.CLOSED]: '已关闭'
}

/**
 * 店铺状态颜色映射
 */
export const STORE_STATUS_COLORS: Record<StoreStatus, string> = {
  [StoreStatus.PENDING]: '#f59e0b',  // 黄色
  [StoreStatus.ACTIVE]: '#10b981',   // 绿色
  [StoreStatus.INACTIVE]: '#6b7280', // 灰色
  [StoreStatus.CLOSED]: '#ef4444'    // 红色
}
