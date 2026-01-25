/**
 * 领域模型类型定义
 * 
 * 定义 Smart Mall 系统的核心业务实体类型
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

// ============================================================================
// 店铺相关类型
// ============================================================================

/**
 * 店铺分类
 */
export type StoreCategory = '餐饮' | '零售' | '服装' | '娱乐' | '服务' | '其他'

/**
 * 店铺状态
 */
export type StoreStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CLOSED'

/**
 * 店铺实体
 */
export interface Store {
  /** 店铺唯一标识 */
  id: string
  /** 店铺名称 */
  name: string
  /** 店铺描述 */
  description?: string
  /** 店铺分类 */
  category: StoreCategory
  /** 店铺状态 */
  status: StoreStatus
  /** 商户ID */
  merchantId: string
  /** 商户名称 */
  merchantName?: string
  /** 所在楼层ID */
  floorId: string
  /** 所在楼层名称 */
  floorName?: string
  /** 所在区域ID */
  areaId: string
  /** 所在区域名称 */
  areaName?: string
  /** 店铺Logo */
  logo?: string
  /** 店铺图片列表 */
  images?: string[]
  /** 营业开始时间 */
  openTime?: string
  /** 营业结束时间 */
  closeTime?: string
  /** 联系电话 */
  contactPhone?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ============================================================================
// 商品相关类型
// ============================================================================

/**
 * 商品状态
 */
export type ProductStatus = 'ON_SALE' | 'OFF_SALE' | 'SOLD_OUT'

/**
 * 商品实体
 */
export interface Product {
  /** 商品唯一标识 */
  id: string
  /** 商品名称 */
  name: string
  /** 商品描述 */
  description?: string
  /** 商品价格 */
  price: number
  /** 商品原价 */
  originalPrice?: number
  /** 库存数量 */
  stock: number
  /** 商品状态 */
  status: ProductStatus
  /** 所属店铺ID */
  storeId: string
  /** 所属店铺名称 */
  storeName?: string
  /** 商品分类ID */
  categoryId?: string
  /** 商品分类名称 */
  categoryName?: string
  /** 商品图片列表 */
  images?: string[]
  /** 商品标签 */
  tags?: string[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ============================================================================
// 楼层相关类型
// ============================================================================

/**
 * 楼层实体
 */
export interface Floor {
  /** 楼层唯一标识 */
  id: string
  /** 楼层名称 */
  name: string
  /** 楼层层数 */
  level: number
  /** 楼层高度 */
  height: number
  /** 楼层包含的区域列表 */
  areas: Area[]
}

// ============================================================================
// 区域相关类型
// ============================================================================

/**
 * 区域类型
 */
export type AreaType = 'store' | 'corridor' | 'elevator' | 'escalator' | 'stairs' | 'restroom' | 'service'

/**
 * 2D 坐标点
 */
export interface Point2D {
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
}

/**
 * 区域属性
 */
export interface AreaProperties {
  /** 区域面积 */
  area: number
  /** 区域周长 */
  perimeter: number
  /** 区域颜色 */
  color?: string
}

/**
 * 区域实体
 */
export interface Area {
  /** 区域唯一标识 */
  id: string
  /** 区域名称 */
  name: string
  /** 区域类型 */
  type: AreaType
  /** 所属楼层ID */
  floorId: string
  /** 区域顶点坐标列表 */
  vertices: Point2D[]
  /** 区域属性 */
  properties: AreaProperties
}

// ============================================================================
// 用户相关类型
// ============================================================================

/**
 * 用户类型
 */
export type UserType = 'ADMIN' | 'MERCHANT' | 'USER'

/**
 * 用户状态
 */
export type UserStatus = 'ACTIVE' | 'FROZEN' | 'DELETED'

/**
 * 用户实体
 */
export interface User {
  /** 用户唯一标识 */
  id: string
  /** 用户名 */
  username: string
  /** 邮箱 */
  email: string
  /** 用户类型 */
  userType: UserType
  /** 用户状态 */
  status: UserStatus
  /** 头像 */
  avatar?: string
  /** 手机号 */
  phone?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}
