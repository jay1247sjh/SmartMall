/**
 * 商城相关 API
 * 
 * 职责：
 * - 商城结构查询
 * - 楼层/区域/店铺数据
 * - 商品信息
 */

import { http } from './http'
import type { MallInfo, FloorInfo, AreaInfo, StoreInfo, ProductInfo } from '@/stores'

// ============================================================================
// 类型定义
// ============================================================================

/** 商城列表项 */
export interface MallListItem {
  mallId: string
  name: string
  description?: string
  status: string
}

/** 商城完整结构（含楼层/区域/店铺） */
export interface MallStructure {
  mall: MallInfo
  floors: FloorInfo[]
  areas: AreaInfo[]
  stores: StoreInfo[]
}

/** 店铺详情（含商品） */
export interface StoreDetail extends StoreInfo {
  products: ProductInfo[]
}

/** 区域可申请信息 */
export interface AvailableArea {
  areaId: string
  areaName: string
  floorId: string
  floorName: string
  status: string
  canApply: boolean
}

// ============================================================================
// API 方法
// ============================================================================

export const mallApi = {
  /**
   * 获取商城列表
   */
  getMallList(): Promise<MallListItem[]> {
    return http.get<MallListItem[]>('/mall/list')
  },

  /**
   * 获取商城详情
   */
  getMallDetail(mallId: string): Promise<MallInfo> {
    return http.get<MallInfo>(`/mall/${mallId}`)
  },

  /**
   * 获取商城完整结构（含楼层/区域/店铺）
   */
  getMallStructure(mallId: string): Promise<MallStructure> {
    return http.get<MallStructure>(`/mall/${mallId}/structure`)
  },

  /**
   * 获取楼层列表
   */
  getFloors(mallId: string): Promise<FloorInfo[]> {
    return http.get<FloorInfo[]>(`/mall/${mallId}/floors`)
  },

  /**
   * 获取区域列表
   */
  getAreas(floorId: string): Promise<AreaInfo[]> {
    return http.get<AreaInfo[]>(`/floor/${floorId}/areas`)
  },

  /**
   * 获取店铺详情
   */
  getStoreDetail(storeId: string): Promise<StoreDetail> {
    return http.get<StoreDetail>(`/store/${storeId}`)
  },

  /**
   * 获取店铺商品列表
   */
  getStoreProducts(storeId: string): Promise<ProductInfo[]> {
    return http.get<ProductInfo[]>(`/store/${storeId}/products`)
  },

  /**
   * 获取可申请区域列表
   */
  getAvailableAreas(mallId: string): Promise<AvailableArea[]> {
    return http.get<AvailableArea[]>(`/mall/${mallId}/areas/available`)
  },
}

export default mallApi
