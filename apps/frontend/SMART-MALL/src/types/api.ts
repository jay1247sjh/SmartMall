/**
 * API 类型定义
 * 
 * 定义 Smart Mall 系统的 API 请求和响应类型
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

// ============================================================================
// 通用响应类型
// ============================================================================

/**
 * 通用 API 响应
 */
export interface ApiResponse<T = any> {
  /** 响应状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
}

/**
 * 分页响应类型
 * 
 * 与后端 MyBatis-Plus 分页结果对齐
 * 
 * @template T - 数据记录类型
 */
export interface PageResponse<T> {
  /** 数据记录列表 */
  records: T[]
  /** 总记录数 */
  total: number
  /** 每页大小 */
  size: number
  /** 当前页码 (1-based) */
  current: number
  /** 总页数 */
  pages: number
}

/**
 * 分页响应 (别名，向后兼容)
 * @deprecated 请使用 PageResponse<T>
 */
export interface PaginatedResponse<T> {
  /** 数据记录列表 */
  records: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 总页数 */
  totalPages: number
}

// ============================================================================
// 通用请求类型
// ============================================================================

/**
 * 分页请求参数
 * 
 * 与后端 MyBatis-Plus 分页参数对齐
 */
export interface PaginationParams {
  /** 页码 (1-based) */
  page?: number
  /** 每页大小 */
  size?: number
}

// ============================================================================
// 店铺 API 类型
// ============================================================================

/**
 * 店铺查询请求
 */
export interface StoreQueryRequest extends PaginationParams {
  /** 搜索关键词 */
  keyword?: string
  /** 店铺状态 */
  status?: string
  /** 店铺分类 */
  category?: string
  /** 楼层ID */
  floorId?: string
}

/**
 * 店铺创建请求
 */
export interface StoreCreateRequest {
  /** 店铺名称 */
  name: string
  /** 店铺描述 */
  description?: string
  /** 店铺分类 */
  category: string
  /** 楼层ID */
  floorId: string
  /** 区域ID */
  areaId: string
  /** 店铺Logo */
  logo?: string
  /** 营业开始时间 */
  openTime?: string
  /** 营业结束时间 */
  closeTime?: string
  /** 联系电话 */
  contactPhone?: string
}

/**
 * 店铺更新请求
 */
export interface StoreUpdateRequest extends Partial<StoreCreateRequest> {
  /** 店铺ID */
  id: string
}

// ============================================================================
// 商品 API 类型
// ============================================================================

/**
 * 商品查询请求
 */
export interface ProductQueryRequest extends PaginationParams {
  /** 搜索关键词 */
  keyword?: string
  /** 商品状态 */
  status?: string
  /** 店铺ID */
  storeId?: string
  /** 分类ID */
  categoryId?: string
  /** 最低价格 */
  minPrice?: number
  /** 最高价格 */
  maxPrice?: number
}

/**
 * 商品创建请求
 */
export interface ProductCreateRequest {
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
  /** 店铺ID */
  storeId: string
  /** 分类ID */
  categoryId?: string
  /** 商品图片列表 */
  images?: string[]
  /** 商品标签 */
  tags?: string[]
}

/**
 * 商品更新请求
 */
export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  /** 商品ID */
  id: string
}

// ============================================================================
// 错误响应类型
// ============================================================================

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  /** 错误状态码 */
  code: number
  /** 错误消息 */
  message: string
  /** 字段级错误详情 */
  errors?: Record<string, string[]>
  /** 错误发生时间戳 */
  timestamp?: string
  /** 请求路径 */
  path?: string
}
