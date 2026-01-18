/**
 * 放置规则验证模块
 * 
 * 验证区域内是否可以放置特定类型的设施
 */

import type { AreaType } from '../types'
import type { PlacementRule, PlacementValidationResult } from '../materials/types'
import { getMaterialPresetByAreaType } from '../materials/presets'

/**
 * 默认放置规则（用于没有预设的区域类型）
 */
const DEFAULT_PLACEMENT_RULES: Record<AreaType, PlacementRule> = {
  // 交通流线
  corridor: {
    allowedItems: [],
    requiresFloorConnection: false,
    description: '走廊区域不允许放置任何设施',
  },
  escalator: {
    allowedItems: ['escalator'],
    requiresFloorConnection: true,
    description: '扶梯区域只能放置扶梯设施',
  },
  elevator: {
    allowedItems: ['elevator'],
    requiresFloorConnection: true,
    description: '电梯区域只能放置电梯设施',
  },
  stairs: {
    allowedItems: ['stairs'],
    requiresFloorConnection: true,
    description: '楼梯区域只能放置楼梯设施',
  },
  
  // 服务设施
  restroom: {
    allowedItems: ['restroom'],
    requiresFloorConnection: false,
    description: '洗手间区域只能放置卫生设施',
  },
  service: {
    allowedItems: ['service'],
    requiresFloorConnection: false,
    description: '服务区域用于客户服务',
  },
  
  // 商业区域
  retail: {
    allowedItems: ['retail', 'service'],
    requiresFloorConnection: false,
    description: '零售区域可放置零售和服务设施',
  },
  food: {
    allowedItems: ['food', 'service'],
    requiresFloorConnection: false,
    description: '餐饮区域可放置餐饮和服务设施',
  },
  anchor: {
    allowedItems: ['anchor', 'retail', 'service'],
    requiresFloorConnection: false,
    description: '主力店区域可放置多种设施',
  },
  
  // 公共区域
  common: {
    allowedItems: ['common', 'retail', 'food', 'service'],
    requiresFloorConnection: false,
    description: '公共区域可放置多种设施',
  },
  storage: {
    allowedItems: ['storage'],
    requiresFloorConnection: false,
    description: '储物间用于存放物品',
  },
  office: {
    allowedItems: ['office', 'service'],
    requiresFloorConnection: false,
    description: '办公区域用于办公',
  },
  parking: {
    allowedItems: ['parking'],
    requiresFloorConnection: false,
    description: '停车区域用于停车',
  },
  other: {
    allowedItems: ['other', 'common', 'retail', 'food', 'service'],
    requiresFloorConnection: false,
    description: '其他区域可放置多种设施',
  },
}

/**
 * 获取区域类型的放置规则
 * 
 * @param areaType - 区域类型
 * @returns 放置规则
 */
export function getPlacementRules(areaType: AreaType): PlacementRule {
  // 首先尝试从材质预设获取
  const preset = getMaterialPresetByAreaType(areaType)
  if (preset) {
    return preset.placementRules
  }
  
  // 否则使用默认规则
  return DEFAULT_PLACEMENT_RULES[areaType] ?? {
    allowedItems: [],
    requiresFloorConnection: false,
    description: '未知区域类型',
  }
}

/**
 * 验证是否可以在目标区域放置指定类型的设施
 * 
 * @param targetAreaType - 目标区域类型
 * @param itemType - 要放置的设施类型
 * @returns 验证结果
 */
export function validatePlacement(
  targetAreaType: AreaType,
  itemType: AreaType
): PlacementValidationResult {
  const rules = getPlacementRules(targetAreaType)
  
  // 如果允许列表为空，不允许放置任何东西
  if (rules.allowedItems.length === 0) {
    return {
      valid: false,
      message: `此区域（${getAreaTypeName(targetAreaType)}）不允许放置任何设施`,
    }
  }
  
  // 检查是否在允许列表中
  if (!rules.allowedItems.includes(itemType)) {
    return {
      valid: false,
      message: `此区域（${getAreaTypeName(targetAreaType)}）不允许放置${getAreaTypeName(itemType)}`,
    }
  }
  
  return { valid: true }
}

/**
 * 检查区域是否需要楼层连接
 * 
 * @param areaType - 区域类型
 * @returns 是否需要楼层连接
 */
export function requiresFloorConnection(areaType: AreaType): boolean {
  const rules = getPlacementRules(areaType)
  return rules.requiresFloorConnection
}

/**
 * 检查区域是否为垂直连接类型
 * 
 * @param areaType - 区域类型
 * @returns 是否为垂直连接类型
 */
export function isVerticalConnectionType(areaType: AreaType): boolean {
  return ['escalator', 'elevator', 'stairs'].includes(areaType)
}

/**
 * 获取区域类型的显示名称
 */
function getAreaTypeName(areaType: AreaType): string {
  const names: Record<AreaType, string> = {
    retail: '零售',
    food: '餐饮',
    service: '服务',
    anchor: '主力店',
    common: '公共区域',
    corridor: '走廊',
    elevator: '电梯',
    escalator: '扶梯',
    stairs: '楼梯',
    restroom: '洗手间',
    storage: '储物间',
    office: '办公',
    parking: '停车',
    other: '其他',
  }
  return names[areaType] ?? areaType
}
