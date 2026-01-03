/**
 * 材质预设数据
 * 
 * 定义所有预设的公共区域材质
 */

import type { MaterialPreset, MaterialCategory } from './types'

/**
 * 材质预设列表
 */
export const MATERIAL_PRESETS: MaterialPreset[] = [
  // ============================================================================
  // 交通流线 (circulation)
  // ============================================================================
  {
    id: 'corridor',
    name: '走廊',
    description: '人行通道，不可放置任何设施',
    icon: 'M3 12h18M3 6h18M3 18h18',
    areaType: 'corridor',
    color: '#9ca3af',
    category: 'circulation',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '走廊区域不允许放置任何设施',
    },
    isVerticalConnection: false,
  },
  {
    id: 'escalator',
    name: '扶梯',
    description: '自动扶梯，连接相邻楼层',
    icon: 'M4 20L20 4M4 20v-6M4 20h6M20 4v6M20 4h-6',
    areaType: 'escalator',
    color: '#14b8a6',
    category: 'circulation',
    placementRules: {
      allowedItems: ['escalator'],
      requiresFloorConnection: true,
      description: '扶梯区域只能放置扶梯设施',
    },
    isVerticalConnection: true,
  },
  {
    id: 'elevator',
    name: '电梯',
    description: '垂直电梯，可连接多层楼',
    icon: 'M4 4h16v16H4zM8 12h8M12 8v8',
    areaType: 'elevator',
    color: '#10b981',
    category: 'circulation',
    placementRules: {
      allowedItems: ['elevator'],
      requiresFloorConnection: true,
      description: '电梯区域只能放置电梯设施',
    },
    isVerticalConnection: true,
  },
  {
    id: 'stairs',
    name: '楼梯',
    description: '步行楼梯，连接相邻楼层',
    icon: 'M4 20h4v-4h4v-4h4v-4h4V4',
    areaType: 'stairs',
    color: '#06b6d4',
    category: 'circulation',
    placementRules: {
      allowedItems: ['stairs'],
      requiresFloorConnection: true,
      description: '楼梯区域只能放置楼梯设施',
    },
    isVerticalConnection: true,
  },

  // ============================================================================
  // 服务设施 (service)
  // ============================================================================
  {
    id: 'restroom',
    name: '洗手间',
    description: '公共卫生间',
    icon: 'M12 4a4 4 0 100 8 4 4 0 000-8zM6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2',
    areaType: 'restroom',
    color: '#ec4899',
    category: 'service',
    placementRules: {
      allowedItems: ['restroom'],
      requiresFloorConnection: false,
      description: '洗手间区域只能放置卫生设施',
    },
    isVerticalConnection: false,
  },
  {
    id: 'service-center',
    name: '服务台',
    description: '客户服务中心',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    areaType: 'service',
    color: '#8b5cf6',
    category: 'service',
    placementRules: {
      allowedItems: ['service'],
      requiresFloorConnection: false,
      description: '服务台区域用于客户服务',
    },
    isVerticalConnection: false,
  },

  // ============================================================================
  // 公共区域 (common)
  // ============================================================================
  {
    id: 'common-area',
    name: '公共区域',
    description: '休息区、展示区等公共空间',
    icon: 'M4 4h16v16H4z',
    areaType: 'common',
    color: '#6b7280',
    category: 'common',
    placementRules: {
      allowedItems: ['common', 'retail', 'food', 'service'],
      requiresFloorConnection: false,
      description: '公共区域可放置多种设施',
    },
    isVerticalConnection: false,
  },
  {
    id: 'storage',
    name: '储物间',
    description: '仓储空间',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    areaType: 'storage',
    color: '#78716c',
    category: 'common',
    placementRules: {
      allowedItems: ['storage'],
      requiresFloorConnection: false,
      description: '储物间用于存放物品',
    },
    isVerticalConnection: false,
  },
]

/**
 * 获取所有材质预设
 */
export function getAllMaterialPresets(): MaterialPreset[] {
  return MATERIAL_PRESETS
}

/**
 * 根据 ID 获取材质预设
 */
export function getMaterialPresetById(id: string): MaterialPreset | undefined {
  return MATERIAL_PRESETS.find(preset => preset.id === id)
}

/**
 * 根据区域类型获取材质预设
 */
export function getMaterialPresetByAreaType(areaType: string): MaterialPreset | undefined {
  return MATERIAL_PRESETS.find(preset => preset.areaType === areaType)
}

/**
 * 根据分类获取材质预设
 */
export function getMaterialPresetsByCategory(category: MaterialCategory): MaterialPreset[] {
  return MATERIAL_PRESETS.filter(preset => preset.category === category)
}

/**
 * 获取所有分类
 */
export function getAllCategories(): MaterialCategory[] {
  return ['circulation', 'service', 'common']
}

/**
 * 获取分类显示名称
 */
export function getCategoryDisplayName(category: MaterialCategory): string {
  const names: Record<MaterialCategory, string> = {
    circulation: '交通流线',
    service: '服务设施',
    common: '公共区域',
  }
  return names[category]
}

/**
 * 获取垂直连接类型的材质预设
 */
export function getVerticalConnectionPresets(): MaterialPreset[] {
  return MATERIAL_PRESETS.filter(preset => preset.isVerticalConnection)
}
