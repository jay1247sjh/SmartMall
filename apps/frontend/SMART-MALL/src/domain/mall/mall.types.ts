/**
 * 商城领域 - 实体类型定义
 * 描述商城的核心业务实体
 */

import type { Transform, BoundingBox, Vector3D } from '../scene/scene.types'
import type { AreaType, AreaStatus } from './mall.enums'

/**
 * 商城
 * 表示整个商城的顶层实体
 */
export interface Mall {
  /** 商城唯一标识 */
  id: string
  /** 商城名称 */
  name: string
  /** 商城描述 */
  description?: string
  /** 商城包含的楼层列表 */
  floors: Floor[]
  /** 扩展元数据 */
  metadata?: Record<string, unknown>
}

/**
 * 楼层
 * 表示商城中的一个楼层
 */
export interface Floor {
  /** 楼层唯一标识 */
  id: string
  /** 所属商城ID */
  mallId: string
  /** 楼层名称（如"一楼"、"B1"） */
  name: string
  /** 楼层编号（1表示1F，-1表示B1） */
  level: number
  /** 楼层包含的区域列表 */
  areas: Area[]
  /** 楼层在3D空间中的变换（可选） */
  transform?: Transform
}

/**
 * 区域
 * 表示楼层中的一个功能区域
 */
export interface Area {
  /** 区域唯一标识 */
  id: string
  /** 所属楼层ID */
  floorId: string
  /** 区域名称 */
  name: string
  /** 区域类型（零售、餐饮、娱乐、服务） */
  type: AreaType
  /** 区域状态（锁定、待审批、已授权、已占用） */
  status: AreaStatus
  /** 区域在3D空间中的边界 */
  boundary: BoundingBox
  /** 区域包含的店铺列表 */
  stores: Store[]
  /** 授权的商家ID（当status为AUTHORIZED时） */
  authorizedMerchantId?: string
  /** 授权过期时间（时间戳） */
  authorizationExpiry?: number
}

/**
 * 店铺
 * 表示商家在商城中的店铺
 */
export interface Store {
  /** 店铺唯一标识 */
  id: string
  /** 所属区域ID */
  areaId: string
  /** 店铺名称 */
  name: string
  /** 所属商家ID */
  merchantId: string
  /** 店铺描述 */
  description?: string
  /** 店铺在3D空间中的变换 */
  transform: Transform
  /** 店铺包含的商品列表 */
  products: Product[]
  /** 是否高亮显示（UI状态） */
  isHighlighted?: boolean
  /** 店铺logo URL */
  logoUrl?: string
  /** 营业状态 */
  isOpen?: boolean
}

/**
 * 商品
 * 表示店铺中的商品
 */
export interface Product {
  /** 商品唯一标识 */
  id: string
  /** 所属店铺ID */
  storeId: string
  /** 商品名称 */
  name: string
  /** 商品描述 */
  description?: string
  /** 商品价格 */
  price?: number
  /** 商品图片URL */
  imageUrl?: string
  /** 商品在店铺中的位置（可选） */
  position?: Vector3D
  /** 商品分类 */
  category?: string
  /** 库存状态 */
  inStock?: boolean
}

// ============================================================================
// AI 生成数据结构
// ============================================================================

/**
 * AI 生成的商城数据
 * 用于从 AI 服务接收的商城布局数据
 */
export interface GeneratedMallData {
  /** 商城名称 */
  name: string
  /** 商城描述 */
  description?: string
  /** 商城轮廓 */
  outline?: {
    vertices: Array<{ x: number; y: number }>
  }
  /** 楼层列表 */
  floors?: GeneratedFloorData[]
}

/**
 * AI 生成的楼层数据
 */
export interface GeneratedFloorData {
  /** 楼层编号 */
  level?: number
  /** 楼层名称 */
  name?: string
  /** 区域列表 */
  areas?: GeneratedAreaData[]
}

/**
 * AI 生成的区域数据
 */
export interface GeneratedAreaData {
  /** 区域名称 */
  name: string
  /** 区域类型 */
  type: 'store' | 'corridor' | 'facility' | 'entrance'
  /** 区域颜色（十六进制） */
  color?: string
  /** 区域形状 */
  shape?: {
    vertices: Array<{ x: number; y: number }>
  }
  /** 区域属性 */
  properties?: {
    category?: string
  }
}
