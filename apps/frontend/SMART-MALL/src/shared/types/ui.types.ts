/**
 * UI 通用类型定义
 * 用于视图层和组件的通用类型
 */

/**
 * 加载状态
 * 用于显示加载进度的通用状态对象
 */
export interface LoadingState {
  /** 是否正在加载 */
  isLoading: boolean
  /** 加载进度（0-100） */
  progress: number
  /** 加载提示文字 */
  text: string
}

/**
 * 楼层选项
 * 用于楼层选择器的简化视图
 */
export interface FloorOption {
  /** 楼层 ID */
  id: number
  /** 楼层简称（如 "1F"、"B1"） */
  name: string
  /** 楼层完整标签（如 "一楼 - 餐饮美食"） */
  label: string
}

/**
 * 搜索结果项
 * 店铺搜索结果的简化视图
 */
export interface SearchResultItem {
  /** 搜索结果 ID */
  id: number | string
  /** 店铺名称 */
  name: string
  /** 所在楼层 */
  floor: string
  /** 所在区域 */
  area: string
}

/**
 * 店铺简要信息
 * 用于店铺详情面板的简化视图
 */
export interface StoreBriefInfo {
  /** 店铺 ID */
  id: number | string
  /** 店铺名称 */
  name: string
  /** 所在楼层 */
  floor?: string
  /** 所在区域 */
  area?: string
  /** 店铺分类 */
  category?: string
  /** 营业时间 */
  openingHours?: string
}
