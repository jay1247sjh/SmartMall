/**
 * 材质预设数据
 * 
 * 定义所有预设的公共区域材质
 */

import type { MaterialPreset, MaterialCategory, CommercialShopType } from './types'

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
    materialParams: {
      roughness: 0.65,
      metalness: 0.05,
      emissive: '#9ca3af',
      emissiveIntensity: 0.06,
    },
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
    materialParams: {
      roughness: 0.35,
      metalness: 0.4,
      emissive: '#14b8a6',
      emissiveIntensity: 0.1,
    },
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
    materialParams: {
      roughness: 0.3,
      metalness: 0.45,
      emissive: '#10b981',
      emissiveIntensity: 0.1,
    },
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
    materialParams: {
      roughness: 0.45,
      metalness: 0.25,
      emissive: '#06b6d4',
      emissiveIntensity: 0.08,
    },
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
    materialParams: {
      roughness: 0.5,
      metalness: 0.1,
      emissive: '#ec4899',
      emissiveIntensity: 0.08,
    },
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
    materialParams: {
      roughness: 0.45,
      metalness: 0.15,
      emissive: '#8b5cf6',
      emissiveIntensity: 0.1,
    },
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
    materialParams: {
      roughness: 0.6,
      metalness: 0.05,
      emissive: '#6b7280',
      emissiveIntensity: 0.05,
    },
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
    materialParams: {
      roughness: 0.7,
      metalness: 0.0,
      emissive: '#78716c',
      emissiveIntensity: 0.04,
    },
  },

  // ============================================================================
  // 基础设施 (infrastructure) - 点状放置的设施
  // ============================================================================
  {
    id: 'bench',
    name: '长椅',
    description: '供顾客休息的座椅',
    icon: 'M4 12h16M2 16h20M6 12V8M18 12V8',
    areaType: 'other',
    color: '#8b4513',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置长椅',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'bench',
  },
  {
    id: 'lamp',
    name: '路灯',
    description: '照明装饰灯',
    icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    areaType: 'other',
    color: '#fbbf24',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置路灯',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'lamp',
  },
  {
    id: 'trashBin',
    name: '垃圾桶',
    description: '分类垃圾桶',
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    areaType: 'other',
    color: '#22c55e',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置垃圾桶',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'trashBin',
  },
  {
    id: 'planter',
    name: '花盆/绿植',
    description: '装饰性绿植',
    icon: 'M12 22V12M12 12c-3 0-6-2-6-6 0 4-3 6-6 6M12 12c3 0 6-2 6-6 0 4 3 6 6 6M7 22h10',
    areaType: 'other',
    color: '#16a34a',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置绿植',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'planter',
  },
  {
    id: 'sign',
    name: '指示牌',
    description: '导向指示牌',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    areaType: 'other',
    color: '#3b82f6',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置指示牌',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'sign',
  },
  {
    id: 'fountain',
    name: '喷泉',
    description: '装饰喷泉',
    icon: 'M12 3v3M6 8l2 2M18 8l-2 2M4 14h16M8 14v4a4 4 0 008 0v-4',
    areaType: 'other',
    color: '#06b6d4',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置喷泉',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'fountain',
  },
  {
    id: 'kiosk',
    name: '售货亭',
    description: '小型售货亭/信息亭',
    icon: 'M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6',
    areaType: 'other',
    color: '#f97316',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置售货亭',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'kiosk',
  },
  {
    id: 'atm',
    name: 'ATM机',
    description: '自动取款机',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    areaType: 'other',
    color: '#0ea5e9',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置ATM机',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'atm',
  },
  {
    id: 'vendingMachine',
    name: '自动售货机',
    description: '饮料/零食售货机',
    icon: 'M4 4h16v16H4zM8 8h2v2H8zM14 8h2v2h-2zM8 12h2v2H8zM14 12h2v2h-2zM11 16h2v2h-2z',
    areaType: 'other',
    color: '#ef4444',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置自动售货机',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'vendingMachine',
  },
  {
    id: 'infoBoard',
    name: '信息屏',
    description: '电子信息显示屏',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    areaType: 'other',
    color: '#6366f1',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置信息屏',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'infoBoard',
  },
  {
    id: 'clock',
    name: '时钟',
    description: '装饰时钟',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    areaType: 'other',
    color: '#a855f7',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置时钟',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'clock',
  },
  {
    id: 'fireExtinguisher',
    name: '消防栓',
    description: '消防设备',
    icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
    areaType: 'other',
    color: '#dc2626',
    category: 'infrastructure',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置消防栓',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    infrastructureType: 'fireExtinguisher',
  },
  // ============================================================================
  // 商业店铺 - 咖啡店 (commercial / cafe)
  // ============================================================================
  {
    id: 'cafe-counter',
    name: '吧台',
    description: '咖啡店吧台/柜台',
    icon: 'M4 16h16M4 12h16M8 12V8h8v4',
    areaType: 'other',
    color: '#8b6914',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置吧台',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'counter',
    shopType: 'cafe',
  },
  {
    id: 'cafe-coffeeMachine',
    name: '咖啡机',
    description: '专业咖啡制作设备',
    icon: 'M6 4h12v4H6zM8 8v8M16 8v8M6 16h12v2H6z',
    areaType: 'other',
    color: '#5c4033',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置咖啡机',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'coffeeMachine',
    shopType: 'cafe',
  },
  {
    id: 'cafe-sofa',
    name: '沙发座',
    description: '舒适的休闲沙发',
    icon: 'M4 14h16v4H4zM6 10h12v4H6zM4 14V10M20 14V10',
    areaType: 'other',
    color: '#c4a882',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置沙发座',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'sofa',
    shopType: 'cafe',
  },
  {
    id: 'cafe-roundTable',
    name: '圆桌',
    description: '咖啡店圆桌',
    icon: 'M12 6a6 6 0 100 12 6 6 0 000-12zM12 18v4M8 22h8',
    areaType: 'other',
    color: '#a0826d',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置圆桌',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'roundTable',
    shopType: 'cafe',
  },
  {
    id: 'cafe-displayCase',
    name: '展示柜',
    description: '甜品/饮品展示柜',
    icon: 'M4 4h16v14H4zM4 10h16M8 4v14M16 4v14',
    areaType: 'other',
    color: '#d4a574',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置展示柜',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'displayCase',
    shopType: 'cafe',
  },

  // ============================================================================
  // 商业店铺 - 服装店 (commercial / fashion)
  // ============================================================================
  {
    id: 'fashion-clothingRack',
    name: '衣架',
    description: '服装展示衣架',
    icon: 'M4 4h16M12 4v16M8 8h8M6 12h12',
    areaType: 'other',
    color: '#2d3748',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置衣架',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'clothingRack',
    shopType: 'fashion',
  },
  {
    id: 'fashion-fittingRoom',
    name: '试衣间',
    description: '顾客试衣空间',
    icon: 'M4 4h16v16H4zM4 4v16M20 4v16M10 4v16',
    areaType: 'other',
    color: '#e8d5b7',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置试衣间',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'fittingRoom',
    shopType: 'fashion',
  },
  {
    id: 'fashion-displayStand',
    name: '展示台',
    description: '服装展示平台',
    icon: 'M6 18h12M8 14h8v4H8zM10 10h4v4h-4z',
    areaType: 'other',
    color: '#718096',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置展示台',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'displayStand',
    shopType: 'fashion',
  },
  {
    id: 'fashion-cashRegister',
    name: '收银台',
    description: '服装店收银台',
    icon: 'M4 6h16v10H4zM8 16v2M16 16v2M7 10h2M11 10h2M15 10h2',
    areaType: 'other',
    color: '#4a5568',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置收银台',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'cashRegister',
    shopType: 'fashion',
  },
  {
    id: 'fashion-mirror',
    name: '镜子',
    description: '全身穿衣镜',
    icon: 'M8 2h8v18H8zM8 20h8M12 20v2',
    areaType: 'other',
    color: '#b0c4de',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置镜子',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'mirror',
    shopType: 'fashion',
  },

  // ============================================================================
  // 商业店铺 - 餐饮店 (commercial / restaurant)
  // ============================================================================
  {
    id: 'restaurant-diningTable',
    name: '餐桌',
    description: '中式餐饮桌',
    icon: 'M4 10h16v2H4zM6 12v6M18 12v6M8 10V6M16 10V6',
    areaType: 'other',
    color: '#8b4513',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置餐桌',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'diningTable',
    shopType: 'restaurant',
  },
  {
    id: 'restaurant-chair',
    name: '椅子',
    description: '餐饮椅',
    icon: 'M8 4h8v4H8zM6 8h12v2H6zM8 10v8M16 10v8M6 18h12',
    areaType: 'other',
    color: '#a0522d',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置椅子',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'chair',
    shopType: 'restaurant',
  },
  {
    id: 'restaurant-kitchenArea',
    name: '厨房区',
    description: '后厨操作区域',
    icon: 'M4 4h16v16H4zM4 10h16M10 4v16',
    areaType: 'other',
    color: '#cd853f',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置厨房区',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'kitchenArea',
    shopType: 'restaurant',
  },
  {
    id: 'restaurant-cashRegister',
    name: '收银台',
    description: '餐饮店收银台',
    icon: 'M4 6h16v10H4zM8 16v2M16 16v2M7 10h2M11 10h2M15 10h2',
    areaType: 'other',
    color: '#b8860b',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置收银台',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'cashRegister',
    shopType: 'restaurant',
  },
  {
    id: 'restaurant-menuBoard',
    name: '菜单牌',
    description: '菜品展示牌',
    icon: 'M6 2h12v18H6zM8 6h8M8 10h8M8 14h6',
    areaType: 'other',
    color: '#daa520',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置菜单牌',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'menuBoard',
    shopType: 'restaurant',
  },

  // ============================================================================
  // 商业店铺 - 数码店 (commercial / tech)
  // ============================================================================
  {
    id: 'tech-displayCase',
    name: '展示柜',
    description: '数码产品展示柜',
    icon: 'M4 4h16v14H4zM4 10h16M8 4v14M16 4v14',
    areaType: 'other',
    color: '#1a202c',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置展示柜',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'displayCase',
    shopType: 'tech',
  },
  {
    id: 'tech-experienceDesk',
    name: '体验台',
    description: '产品体验操作台',
    icon: 'M4 8h16v8H4zM6 16v4M18 16v4M8 8V6h8v2',
    areaType: 'other',
    color: '#2b6cb0',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置体验台',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'experienceDesk',
    shopType: 'tech',
  },
  {
    id: 'tech-cashRegister',
    name: '收银台',
    description: '数码店收银台',
    icon: 'M4 6h16v10H4zM8 16v2M16 16v2M7 10h2M11 10h2M15 10h2',
    areaType: 'other',
    color: '#2d3748',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置收银台',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'cashRegister',
    shopType: 'tech',
  },
  {
    id: 'tech-accessoryRack',
    name: '配件架',
    description: '数码配件展示架',
    icon: 'M4 4h16v16H4zM4 8h16M4 12h16M4 16h16',
    areaType: 'other',
    color: '#4a5568',
    category: 'commercial',
    placementRules: {
      allowedItems: [],
      requiresFloorConnection: false,
      description: '点击放置配件架',
    },
    isVerticalConnection: false,
    isInfrastructure: true,
    commercialType: 'accessoryRack',
    shopType: 'tech',
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
  return ['circulation', 'service', 'common', 'infrastructure', 'commercial']
}

/**
 * 获取分类显示名称
 */
export function getCategoryDisplayName(category: MaterialCategory): string {
  const names: Record<MaterialCategory, string> = {
    circulation: '交通流线',
    service: '服务设施',
    common: '公共区域',
    infrastructure: '基础设施',
    commercial: '商业店铺',
  }
  return names[category]
}

/**
 * 获取垂直连接类型的材质预设
 */
export function getVerticalConnectionPresets(): MaterialPreset[] {
  return MATERIAL_PRESETS.filter(preset => preset.isVerticalConnection)
}


/**
 * 获取基础设施类型的材质预设
 */
export function getInfrastructurePresets(): MaterialPreset[] {
  return MATERIAL_PRESETS.filter(preset => preset.isInfrastructure)
}

/**
 * 根据基础设施类型获取预设
 */
export function getInfrastructurePresetByType(type: string): MaterialPreset | undefined {
  return MATERIAL_PRESETS.find(preset => preset.infrastructureType === type)
}

/**
 * 根据商业店铺类型获取预设列表
 */
export function getCommercialPresetsByType(shopType: CommercialShopType): MaterialPreset[] {
  return MATERIAL_PRESETS.filter(preset => preset.category === 'commercial' && preset.shopType === shopType)
}
