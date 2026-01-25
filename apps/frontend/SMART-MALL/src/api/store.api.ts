/**
 * ============================================================================
 * 店铺管理 API 模块 (Store API)
 * ============================================================================
 *
 * 【业务职责】
 * 提供店铺管理相关的 API 接口，包括：
 * 1. 商家端 - 创建店铺、编辑店铺、激活/暂停营业
 * 2. 管理员端 - 审批店铺、关闭店铺、查看所有店铺
 *
 * 【店铺状态流转】
 * PENDING（待审批）→ ACTIVE（营业中）↔ INACTIVE（暂停营业）
 *                 ↓                    ↓
 *              CLOSED（已关闭，终态）
 *
 * 【后端对应接口】
 * 商家端：
 * - POST /api/store - 创建店铺
 * - GET  /api/store/my - 获取我的店铺
 * - GET  /api/store/{storeId} - 获取店铺详情
 * - PUT  /api/store/{storeId} - 更新店铺
 * - POST /api/store/{storeId}/activate - 激活店铺
 * - POST /api/store/{storeId}/deactivate - 暂停营业
 *
 * 管理员端：
 * - GET  /api/admin/store - 获取所有店铺（分页）
 * - POST /api/admin/store/{storeId}/approve - 审批店铺
 * - POST /api/admin/store/{storeId}/close - 关闭店铺
 * ============================================================================
 */
import http from './http'
import type { PageResponse } from '@/types/api'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 店铺 DTO
 */
export interface StoreDTO {
  /** 店铺ID */
  storeId: string
  /** 区域ID */
  areaId: string
  /** 区域名称 */
  areaName: string
  /** 楼层ID */
  floorId: string
  /** 楼层名称 */
  floorName: string
  /** 商家ID */
  merchantId: string
  /** 商家名称 */
  merchantName: string
  /** 店铺名称 */
  name: string
  /** 店铺描述 */
  description: string | null
  /** 店铺分类 */
  category: string
  /** 营业时间 */
  businessHours: string | null
  /** Logo URL */
  logo: string | null
  /** 封面图 URL */
  cover: string | null
  /** 店铺状态 (PENDING, ACTIVE, INACTIVE, CLOSED) */
  status: string
  /** 关闭原因 */
  closeReason: string | null
  /** 创建时间 */
  createdAt: string
  /** 审批时间 */
  approvedAt: string | null
}

/**
 * 创建店铺请求
 */
export interface CreateStoreRequest {
  /** 区域ID */
  areaId: string
  /** 店铺名称 */
  name: string
  /** 店铺描述 */
  description?: string
  /** 店铺分类 */
  category: string
  /** 营业时间 */
  businessHours?: string
}

/**
 * 更新店铺请求
 */
export interface UpdateStoreRequest {
  /** 店铺名称 */
  name?: string
  /** 店铺描述 */
  description?: string
  /** 店铺分类 */
  category?: string
  /** 营业时间 */
  businessHours?: string
  /** Logo URL */
  logo?: string
  /** 封面图 URL */
  cover?: string
}

/**
 * 店铺查询请求
 */
export interface StoreQueryRequest {
  /** 店铺状态筛选 */
  status?: string
  /** 店铺分类筛选 */
  category?: string
  /** 楼层ID筛选 */
  floorId?: string
  /** 商家ID筛选 */
  merchantId?: string
  /** 关键词搜索 */
  keyword?: string
}

/**
 * 关闭店铺请求
 */
export interface CloseStoreRequest {
  /** 关闭原因 */
  reason: string
}

// ============================================================================
// 商家端 API
// ============================================================================

/**
 * 创建店铺
 */
export async function createStore(request: CreateStoreRequest): Promise<StoreDTO> {
  return http.post<StoreDTO>('/store', request)
}

/**
 * 获取我的店铺列表
 */
export async function getMyStores(): Promise<StoreDTO[]> {
  return http.get<StoreDTO[]>('/store/my')
}

/**
 * 获取店铺详情
 */
export async function getStoreById(storeId: string): Promise<StoreDTO> {
  return http.get<StoreDTO>(`/store/${storeId}`)
}

/**
 * 更新店铺信息
 */
export async function updateStore(storeId: string, request: UpdateStoreRequest): Promise<StoreDTO> {
  return http.put<StoreDTO>(`/store/${storeId}`, request)
}

/**
 * 激活店铺（INACTIVE -> ACTIVE）
 */
export async function activateStore(storeId: string): Promise<void> {
  return http.post<void>(`/store/${storeId}/activate`)
}

/**
 * 暂停营业（ACTIVE -> INACTIVE）
 */
export async function deactivateStore(storeId: string): Promise<void> {
  return http.post<void>(`/store/${storeId}/deactivate`)
}

// ============================================================================
// 管理员端 API
// ============================================================================

/**
 * 获取所有店铺（分页）
 */
export async function getAllStores(
  query: StoreQueryRequest = {},
  page: number = 1,
  size: number = 10
): Promise<PageResponse<StoreDTO>> {
  return http.get<PageResponse<StoreDTO>>('/admin/store', {
    params: { ...query, page, size }
  })
}

/**
 * 审批店铺（PENDING -> ACTIVE）
 */
export async function approveStore(storeId: string): Promise<void> {
  return http.post<void>(`/admin/store/${storeId}/approve`)
}

/**
 * 关闭店铺
 */
export async function closeStore(storeId: string, reason: string): Promise<void> {
  return http.post<void>(`/admin/store/${storeId}/close`, { reason })
}

// ============================================================================
// 导出
// ============================================================================

export const storeApi = {
  // 商家端
  createStore,
  getMyStores,
  getStoreById,
  updateStore,
  activateStore,
  deactivateStore,
  // 管理员端
  getAllStores,
  approveStore,
  closeStore,
}

export default storeApi
