/**
 * 区域类型枚举
 * 
 * 用于商城建模器中的区域分类
 * 
 * @shared 前端、后端、AI服务共用
 */
export enum AreaType {
  /** 零售店铺 */
  RETAIL = 'retail',
  /** 餐饮 */
  FOOD = 'food',
  /** 服务 */
  SERVICE = 'service',
  /** 主力店 */
  ANCHOR = 'anchor',
  /** 公共区域 */
  COMMON = 'common',
  /** 走廊 */
  CORRIDOR = 'corridor',
  /** 电梯 */
  ELEVATOR = 'elevator',
  /** 扶梯 */
  ESCALATOR = 'escalator',
  /** 楼梯 */
  STAIRS = 'stairs',
  /** 洗手间 */
  RESTROOM = 'restroom',
  /** 仓储 */
  STORAGE = 'storage',
  /** 办公 */
  OFFICE = 'office',
  /** 停车 */
  PARKING = 'parking',
  /** 其他 */
  OTHER = 'other'
}

/**
 * 区域状态枚举
 * 
 * 定义区域的建模权限状态
 */
export enum AreaStatus {
  /** 可申请 */
  AVAILABLE = 'AVAILABLE',
  /** 锁定，不可申请 */
  LOCKED = 'LOCKED',
  /** 有商家申请中，等待审批 */
  PENDING = 'PENDING',
  /** 已授权，可被特定商家编辑 */
  AUTHORIZED = 'AUTHORIZED',
  /** 已被占用 */
  OCCUPIED = 'OCCUPIED'
}

/**
 * 区域类型显示名称映射
 */
export const AREA_TYPE_NAMES: Record<AreaType, string> = {
  [AreaType.RETAIL]: '零售店铺',
  [AreaType.FOOD]: '餐饮',
  [AreaType.SERVICE]: '服务',
  [AreaType.ANCHOR]: '主力店',
  [AreaType.COMMON]: '公共区域',
  [AreaType.CORRIDOR]: '走廊',
  [AreaType.ELEVATOR]: '电梯',
  [AreaType.ESCALATOR]: '扶梯',
  [AreaType.STAIRS]: '楼梯',
  [AreaType.RESTROOM]: '洗手间',
  [AreaType.STORAGE]: '仓储',
  [AreaType.OFFICE]: '办公',
  [AreaType.PARKING]: '停车',
  [AreaType.OTHER]: '其他'
}

/**
 * 区域类型默认颜色映射
 */
export const AREA_TYPE_COLORS: Record<AreaType, string> = {
  [AreaType.RETAIL]: '#3b82f6',     // 蓝色
  [AreaType.FOOD]: '#f97316',       // 橙色
  [AreaType.SERVICE]: '#8b5cf6',    // 紫色
  [AreaType.ANCHOR]: '#ef4444',     // 红色
  [AreaType.COMMON]: '#6b7280',     // 灰色
  [AreaType.CORRIDOR]: '#9ca3af',   // 浅灰
  [AreaType.ELEVATOR]: '#10b981',   // 绿色
  [AreaType.ESCALATOR]: '#14b8a6',  // 青色
  [AreaType.STAIRS]: '#06b6d4',     // 天蓝
  [AreaType.RESTROOM]: '#ec4899',   // 粉色
  [AreaType.STORAGE]: '#78716c',    // 棕灰
  [AreaType.OFFICE]: '#6366f1',     // 靛蓝
  [AreaType.PARKING]: '#84cc16',    // 黄绿
  [AreaType.OTHER]: '#a3a3a3'       // 中灰
}

/**
 * 判断区域类型是否为店铺类型（需要墙和入口）
 */
export function isShopAreaType(type: AreaType): boolean {
  return [AreaType.RETAIL, AreaType.FOOD, AreaType.SERVICE, AreaType.ANCHOR].includes(type)
}
