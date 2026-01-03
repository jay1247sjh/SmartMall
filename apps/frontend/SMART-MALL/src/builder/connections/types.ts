/**
 * 垂直连接系统类型定义
 * 
 * 定义扶梯、电梯、楼梯等垂直连接的类型
 */

/**
 * 垂直连接类型
 */
export type VerticalConnectionType = 'elevator' | 'escalator' | 'stairs'

/**
 * 垂直连接
 */
export interface VerticalConnection {
  /** 唯一标识 */
  id: string
  /** 关联的区域 ID */
  areaId: string
  /** 连接类型 */
  type: VerticalConnectionType
  /** 连接的楼层 ID 列表 */
  connectedFloors: string[]
  /** 创建时间 */
  createdAt: number
}

/**
 * 楼层连接（两个楼层之间的连接）
 */
export interface FloorConnection {
  /** 起始楼层 ID */
  fromFloorId: string
  /** 目标楼层 ID */
  toFloorId: string
  /** 关联的区域 ID */
  areaId: string
  /** 连接类型 */
  type: VerticalConnectionType
}

/**
 * 垂直连接创建参数
 */
export interface CreateConnectionParams {
  /** 区域 ID */
  areaId: string
  /** 连接类型 */
  type: VerticalConnectionType
  /** 连接的楼层 ID 列表 */
  floorIds: string[]
}

/**
 * 垂直连接验证结果
 */
export interface ConnectionValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误消息 */
  message?: string
}

/**
 * 垂直连接渲染选项
 */
export interface ConnectionRenderOptions {
  /** 线条颜色 */
  color?: number
  /** 线条宽度 */
  lineWidth?: number
  /** 是否显示标签 */
  showLabels?: boolean
  /** 透明度 */
  opacity?: number
}
