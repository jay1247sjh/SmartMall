/**
 * 材质系统类型定义
 * 
 * 定义预设材质、放置规则等相关类型
 */

import type { AreaType } from '../types/mall-project'

/**
 * 材质分类
 */
export type MaterialCategory = 
  | 'circulation'  // 交通流线（走廊、扶梯、电梯、楼梯）
  | 'service'      // 服务设施（洗手间、服务台）
  | 'common'       // 公共区域

/**
 * 放置规则
 */
export interface PlacementRule {
  /** 允许放置的区域类型，空数组表示不允许放置任何内容 */
  allowedItems: AreaType[]
  /** 是否需要楼层连接（扶梯、电梯、楼梯） */
  requiresFloorConnection: boolean
  /** 规则描述 */
  description: string
}

/**
 * 材质预设
 */
export interface MaterialPreset {
  /** 唯一标识 */
  id: string
  /** 显示名称 */
  name: string
  /** 描述 */
  description: string
  /** 图标（SVG 路径） */
  icon: string
  /** 对应的区域类型 */
  areaType: AreaType
  /** 默认颜色 */
  color: string
  /** 材质分类 */
  category: MaterialCategory
  /** 放置规则 */
  placementRules: PlacementRule
  /** 是否为垂直连接（扶梯、电梯、楼梯） */
  isVerticalConnection: boolean
}

/**
 * 放置验证结果
 */
export interface PlacementValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误或警告消息 */
  message?: string
}

/**
 * 材质面板状态
 */
export interface MaterialPanelState {
  /** 当前选中的材质 ID */
  selectedMaterialId: string | null
  /** 当前展开的分类 */
  expandedCategories: MaterialCategory[]
  /** 是否显示面板 */
  visible: boolean
}
