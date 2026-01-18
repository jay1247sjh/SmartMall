/**
 * 商城领域 - 常量定义
 * 商城相关的配置常量和映射表
 */

/**
 * 区域高度映射
 * 根据区域类型返回 3D 渲染高度
 */
export const AREA_HEIGHT_MAP: Record<string, number> = {
  /** 店铺：标准高度 */
  store: 4,
  /** 走廊：扁平 */
  corridor: 0.1,
  /** 设施：中等高度 */
  facility: 3,
  /** 入口：低矮 */
  entrance: 2,
}

/**
 * 店铺分类名称映射
 * 分类英文标识到中文名称的映射
 */
export const CATEGORY_NAMES: Record<string, string> = {
  fashion: '服装',
  sports: '运动',
  food: '餐饮',
  cafe: '咖啡',
  electronics: '数码',
  entertainment: '娱乐',
  beauty: '美妆',
  jewelry: '珠宝',
  home: '家居',
  kids: '母婴',
  books: '书店',
  supermarket: '超市',
}

/**
 * 默认楼层配置
 */
export const DEFAULT_FLOORS = [
  { id: 1, name: '1F', label: '一楼 - 餐饮美食' },
  { id: 2, name: '2F', label: '二楼 - 服装服饰' },
  { id: 3, name: '3F', label: '三楼 - 娱乐休闲' },
]

/**
 * 3D 场景默认颜色
 */
export const SCENE_COLORS = {
  /** 店铺默认颜色 */
  STORE_DEFAULT: 0x3b82f6,
  /** 地板颜色 */
  FLOOR: 0x1a1a1a,
  /** 走廊颜色 */
  CORRIDOR: 0x4b5563,
  /** 高亮颜色 */
  HIGHLIGHT: 0xfbbf24,
}
