/**
 * 商城项目数据模型
 * 
 * 定义商城建模器的核心数据结构
 * 支持多楼层、自定义形状、区域管理
 */

import type { Point2D, Polygon, Rectangle, Transform2D } from '../geometry/types'

// ============================================================================
// 项目级别类型
// ============================================================================

/**
 * 商城项目
 */
export interface MallProject {
  /** 项目唯一标识 */
  id: string
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 版本号 */
  version: number
  /** 商城轮廓（整体形状） */
  outline: Polygon
  /** 楼层列表 */
  floors: FloorDefinition[]
  /** 项目设置 */
  settings: ProjectSettings
  /** 元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 项目设置
 */
export interface ProjectSettings {
  /** 网格大小（米） */
  gridSize: number
  /** 是否启用网格对齐 */
  snapToGrid: boolean
  /** 默认楼层高度（米） */
  defaultFloorHeight: number
  /** 单位（米/英尺） */
  unit: 'meters' | 'feet'
  /** 显示设置 */
  display: DisplaySettings
}

/**
 * 显示设置
 */
export interface DisplaySettings {
  /** 是否显示网格 */
  showGrid: boolean
  /** 是否显示标尺 */
  showRuler: boolean
  /** 是否显示区域标签 */
  showAreaLabels: boolean
  /** 背景颜色 */
  backgroundColor: string
  /** 网格颜色 */
  gridColor: string
}

// ============================================================================
// 楼层类型
// ============================================================================

/**
 * 楼层定义
 */
export interface FloorDefinition {
  /** 楼层唯一标识 */
  id: string
  /** 楼层名称 */
  name: string
  /** 楼层编号（可以是负数，如 B1） */
  level: number
  /** 楼层高度（米） */
  height: number
  /** 楼层形状（如果为空则继承商城轮廓） */
  shape?: Polygon
  /** 是否继承商城轮廓 */
  inheritOutline: boolean
  /** 区域列表 */
  areas: AreaDefinition[]
  /** 背景图片 */
  backgroundImage?: BackgroundImage
  /** 楼层颜色（用于3D预览） */
  color?: string
  /** 是否可见 */
  visible: boolean
  /** 是否锁定 */
  locked: boolean
}

/**
 * 背景图片
 */
export interface BackgroundImage {
  /** 图片URL或Base64 */
  src: string
  /** 变换矩阵 */
  transform: Transform2D
  /** 透明度 (0-1) */
  opacity: number
  /** 是否锁定 */
  locked: boolean
}

// ============================================================================
// 区域类型
// ============================================================================

/**
 * 区域定义
 */
export interface AreaDefinition {
  /** 区域唯一标识 */
  id: string
  /** 区域名称 */
  name: string
  /** 区域类型 */
  type: AreaType
  /** 区域形状 */
  shape: Polygon
  /** 区域颜色 */
  color: string
  /** 区域属性 */
  properties: AreaProperties
  /** 是否可见 */
  visible: boolean
  /** 是否锁定 */
  locked: boolean
  /** 关联的商户ID（如果已分配） */
  merchantId?: string
  /** 租金信息 */
  rental?: RentalInfo
}

/**
 * 区域类型
 */
export type AreaType = 
  | 'retail'      // 零售店铺
  | 'food'        // 餐饮
  | 'service'     // 服务
  | 'anchor'      // 主力店
  | 'common'      // 公共区域
  | 'corridor'    // 走廊
  | 'elevator'    // 电梯
  | 'escalator'   // 扶梯
  | 'stairs'      // 楼梯
  | 'restroom'    // 洗手间
  | 'storage'     // 仓储
  | 'office'      // 办公
  | 'parking'     // 停车
  | 'other'       // 其他

/**
 * 区域属性
 */
export interface AreaProperties {
  /** 面积（平方米，自动计算） */
  area: number
  /** 周长（米，自动计算） */
  perimeter: number
  /** 最小租金（元/月/平方米） */
  minRent?: number
  /** 最大租金（元/月/平方米） */
  maxRent?: number
  /** 适合的业态 */
  suitableFor?: string[]
  /** 备注 */
  notes?: string
  /** 自定义属性 */
  custom?: Record<string, unknown>
}

/**
 * 租金信息
 */
export interface RentalInfo {
  /** 月租金 */
  monthlyRent: number
  /** 租期开始 */
  startDate?: string
  /** 租期结束 */
  endDate?: string
  /** 租赁状态 */
  status: 'available' | 'reserved' | 'rented' | 'unavailable'
}

// ============================================================================
// 模板类型
// ============================================================================

/**
 * 商城模板
 */
export interface MallTemplate {
  /** 模板ID */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 模板类型 */
  type: TemplateType
  /** 缩略图URL */
  thumbnail?: string
  /** 模板数据 */
  data: TemplateData
}

/**
 * 模板类型
 */
export type TemplateType = 
  | 'rectangle'   // 矩形
  | 'l-shape'     // L形
  | 'u-shape'     // U形
  | 'circle'      // 圆形
  | 't-shape'     // T形
  | 'custom'      // 自定义

/**
 * 模板数据
 */
export interface TemplateData {
  /** 商城轮廓生成函数的参数 */
  outlineParams: OutlineParams
  /** 默认楼层数 */
  defaultFloors: number
  /** 默认区域布局 */
  defaultAreas?: AreaTemplate[]
}

/**
 * 轮廓参数
 */
export interface OutlineParams {
  /** 模板类型 */
  type: TemplateType
  /** 宽度 */
  width: number
  /** 高度/深度 */
  height: number
  /** 额外参数（根据类型不同） */
  extra?: Record<string, number>
}

/**
 * 区域模板
 */
export interface AreaTemplate {
  /** 相对位置（0-1） */
  relativePosition: Rectangle
  /** 区域类型 */
  type: AreaType
  /** 区域名称模板 */
  nameTemplate: string
}

// ============================================================================
// 历史记录类型
// ============================================================================

/**
 * 历史记录项
 */
export interface HistoryEntry {
  /** 操作ID */
  id: string
  /** 操作类型 */
  type: HistoryActionType
  /** 操作描述 */
  description: string
  /** 时间戳 */
  timestamp: number
  /** 操作前状态快照 */
  before: unknown
  /** 操作后状态快照 */
  after: unknown
}

/**
 * 历史操作类型
 */
export type HistoryActionType =
  | 'create-floor'
  | 'delete-floor'
  | 'update-floor'
  | 'create-area'
  | 'delete-area'
  | 'update-area'
  | 'move-area'
  | 'resize-area'
  | 'update-outline'
  | 'update-settings'
  | 'batch'

// ============================================================================
// 导出/导入类型
// ============================================================================

/**
 * 项目导出格式
 */
export interface ProjectExport {
  /** 格式版本 */
  formatVersion: string
  /** 导出时间 */
  exportedAt: string
  /** 项目数据 */
  project: MallProject
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 创建默认项目设置
 */
export function createDefaultSettings(): ProjectSettings {
  return {
    gridSize: 1,
    snapToGrid: true,
    defaultFloorHeight: 4,
    unit: 'meters',
    display: {
      showGrid: true,
      showRuler: true,
      showAreaLabels: true,
      backgroundColor: '#0a0a0a',
      gridColor: '#1a1a1a',
    },
  }
}

/**
 * 创建空项目
 */
export function createEmptyProject(name: string): MallProject {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    version: 1,
    outline: {
      vertices: [
        { x: -50, y: -50 },
        { x: 50, y: -50 },
        { x: 50, y: 50 },
        { x: -50, y: 50 },
      ],
      isClosed: true,
    },
    floors: [],
    settings: createDefaultSettings(),
  }
}

/**
 * 创建默认楼层
 */
export function createDefaultFloor(level: number, name?: string): FloorDefinition {
  return {
    id: generateId(),
    name: name ?? `${level}F`,
    level,
    height: 4,
    inheritOutline: true,
    areas: [],
    visible: true,
    locked: false,
  }
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 获取区域类型的显示名称
 */
export function getAreaTypeName(type: AreaType): string {
  const names: Record<AreaType, string> = {
    retail: '零售店铺',
    food: '餐饮',
    service: '服务',
    anchor: '主力店',
    common: '公共区域',
    corridor: '走廊',
    elevator: '电梯',
    escalator: '扶梯',
    stairs: '楼梯',
    restroom: '洗手间',
    storage: '仓储',
    office: '办公',
    parking: '停车',
    other: '其他',
  }
  return names[type] ?? type
}

/**
 * 获取区域类型的默认颜色
 */
export function getAreaTypeColor(type: AreaType): string {
  const colors: Record<AreaType, string> = {
    retail: '#3b82f6',     // 蓝色
    food: '#f97316',       // 橙色
    service: '#8b5cf6',    // 紫色
    anchor: '#ef4444',     // 红色
    common: '#6b7280',     // 灰色
    corridor: '#9ca3af',   // 浅灰
    elevator: '#10b981',   // 绿色
    escalator: '#14b8a6',  // 青色
    stairs: '#06b6d4',     // 天蓝
    restroom: '#ec4899',   // 粉色
    storage: '#78716c',    // 棕灰
    office: '#6366f1',     // 靛蓝
    parking: '#84cc16',    // 黄绿
    other: '#a3a3a3',      // 中灰
  }
  return colors[type] ?? '#6b7280'
}
