/**
 * ============================================================================
 * 商品管理 API 模块 (Product API)
 * ============================================================================
 *
 * 【业务职责】
 * 提供商品管理相关的 API 接口，包括：
 * 1. 商家端 - 创建商品、编辑商品、上下架、库存管理
 * 2. 公开端 - 获取店铺商品列表、商品详情
 *
 * 【商品状态说明】
 * - ON_SALE: 在售
 * - OFF_SALE: 下架
 * - SOLD_OUT: 售罄（库存为0时自动设置）
 *
 * 【后端对应接口】
 * 商家端：
 * - POST /api/product - 创建商品
 * - GET  /api/product/{productId} - 获取商品详情
 * - PUT  /api/product/{productId} - 更新商品
 * - DELETE /api/product/{productId} - 删除商品
 * - GET  /api/product/store/{storeId} - 获取店铺商品列表
 * - POST /api/product/{productId}/status - 更新商品状态
 * - POST /api/product/{productId}/stock - 更新库存
 *
 * 公开端：
 * - GET /api/public/store/{storeId}/products - 获取店铺公开商品
 * - GET /api/public/product/{productId} - 获取商品公开详情
 * ============================================================================
 */
import http from './http'

// ============================================================================
// 类型定义
// ============================================================================

/** 商品状态 */
export type ProductStatus = 'ON_SALE' | 'OFF_SALE' | 'SOLD_OUT'

/**
 * 商品 DTO
 */
export interface ProductDTO {
  productId: string
  storeId: string
  storeName: string
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  stock: number
  category: string | null
  image: string | null
  images: string[] | null
  status: ProductStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/**
 * 创建商品请求
 */
export interface CreateProductRequest {
  storeId: string
  name: string
  description?: string
  price: number
  originalPrice?: number
  stock: number
  category?: string
  image?: string
  images?: string[]
  sortOrder?: number
}


/**
 * 更新商品请求
 */
export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  originalPrice?: number
  stock?: number
  category?: string
  image?: string
  images?: string[]
  sortOrder?: number
}

/**
 * 商品查询请求
 */
export interface ProductQueryRequest {
  status?: ProductStatus
  category?: string
  page?: number
  size?: number
}

/**
 * 更新状态请求
 */
export interface UpdateStatusRequest {
  status: ProductStatus
}

/**
 * 更新库存请求
 */
export interface UpdateStockRequest {
  stock: number
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// ============================================================================
// 商家端 API
// ============================================================================

/** 创建商品 */
export async function createProduct(request: CreateProductRequest): Promise<ProductDTO> {
  return http.post<ProductDTO>('/product', request)
}

/** 获取商品详情 */
export async function getProduct(productId: string): Promise<ProductDTO> {
  return http.get<ProductDTO>(`/product/${productId}`)
}

/** 更新商品 */
export async function updateProduct(productId: string, request: UpdateProductRequest): Promise<ProductDTO> {
  return http.put<ProductDTO>(`/product/${productId}`, request)
}

/** 删除商品 */
export async function deleteProduct(productId: string): Promise<void> {
  return http.delete<void>(`/product/${productId}`)
}

/** 获取店铺商品列表 */
export async function getStoreProducts(
  storeId: string,
  query: ProductQueryRequest = {}
): Promise<PageResponse<ProductDTO>> {
  const { page = 1, size = 10, ...rest } = query
  return http.get<PageResponse<ProductDTO>>(`/product/store/${storeId}`, {
    params: { page, size, ...rest }
  })
}

/** 更新商品状态 */
export async function updateProductStatus(productId: string, status: ProductStatus): Promise<ProductDTO> {
  return http.post<ProductDTO>(`/product/${productId}/status`, { status })
}

/** 更新库存 */
export async function updateProductStock(productId: string, stock: number): Promise<ProductDTO> {
  return http.post<ProductDTO>(`/product/${productId}/stock`, { stock })
}

// ============================================================================
// 公开端 API
// ============================================================================

/** 获取店铺公开商品列表 */
export async function getPublicStoreProducts(
  storeId: string,
  page: number = 1,
  size: number = 20
): Promise<PageResponse<ProductDTO>> {
  return http.get<PageResponse<ProductDTO>>(`/public/store/${storeId}/products`, {
    params: { page, size }
  })
}

/** 获取商品公开详情 */
export async function getPublicProduct(productId: string): Promise<ProductDTO> {
  return http.get<ProductDTO>(`/public/product/${productId}`)
}

// ============================================================================
// 导出
// ============================================================================

export const productApi = {
  // 商家端
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getStoreProducts,
  updateProductStatus,
  updateProductStock,
  // 公开端
  getPublicStoreProducts,
  getPublicProduct,
}

export default productApi
