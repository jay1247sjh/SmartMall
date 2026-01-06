/**
 * ============================================================================
 * 商城数据 API 模块 (Mall API)
 * ============================================================================
 *
 * 【业务职责】
 * 提供商城核心数据的查询接口，是 3D 商城展示的数据基础。
 * 主要服务于运行态（RUNTIME）的数据展示需求。
 *
 * 【数据层级】
 * Mall（商城）→ Floor（楼层）→ Area（区域）→ Store（店铺）→ Product（商品）
 *
 * 【主要功能】
 * 1. 商城列表/详情 - 获取商城基本信息
 * 2. 商城结构 - 一次性获取完整的楼层/区域/店铺数据
 * 3. 店铺详情 - 获取店铺信息和商品列表
 * 4. 可申请区域 - 商家查看可以申请入驻的区域
 *
 * 【使用场景】
 * - 用户进入商城页面 → 调用 getMallStructure 加载完整数据
 * - 用户点击店铺 → 调用 getStoreDetail 获取详情
 * - 商家查看入驻机会 → 调用 getAvailableAreas
 *
 * 【性能优化】
 * - getMallStructure 一次性返回所有结构数据，减少请求次数
 * - 数据加载后存入 mall.store，避免重复请求
 * - 店铺详情按需加载，不在初始化时获取
 *
 * 【与 Store 的关系】
 * - 此模块负责数据获取（API 调用）
 * - mall.store 负责数据存储和状态管理
 * - 组件从 mall.store 读取数据，不直接调用 API
 *
 * 【后端对应接口】
 * - GET /mall/list - 商城列表
 * - GET /mall/:mallId - 商城详情
 * - GET /mall/:mallId/structure - 商城完整结构
 * - GET /mall/:mallId/floors - 楼层列表
 * - GET /floor/:floorId/areas - 区域列表
 * - GET /store/:storeId - 店铺详情
 * - GET /store/:storeId/products - 店铺商品
 * - GET /mall/:mallId/areas/available - 可申请区域
 * ============================================================================
 */

import { http } from './http'
import type { MallInfo, FloorInfo, AreaInfo, StoreInfo, ProductInfo } from '@/stores'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 商城列表项
 * 用于商城选择页面的简要信息
 */
export interface MallListItem {
  mallId: string
  name: string
  description?: string
  status: string
}

/**
 * 商城完整结构
 * 包含商城及其所有楼层、区域、店铺数据
 * 用于初始化 3D 场景
 */
export interface MallStructure {
  mall: MallInfo
  floors: FloorInfo[]
  areas: AreaInfo[]
  stores: StoreInfo[]
}

/**
 * 店铺详情（含商品）
 * 扩展 StoreInfo，增加商品列表
 */
export interface StoreDetail extends StoreInfo {
  products: ProductInfo[]
}

/**
 * 可申请区域信息
 * 商家查看可入驻区域时使用
 */
export interface AvailableArea {
  areaId: string
  areaName: string
  floorId: string
  floorName: string
  status: string
  /** 当前用户是否可以申请（可能已有待审批的申请） */
  canApply: boolean
}

// ============================================================================
// API 方法
// ============================================================================

export const mallApi = {
  /**
   * 获取商城列表
   *
   * 用于商城选择页面，展示所有可访问的商城。
   * 多租户架构下，用户可能有权访问多个商城。
   *
   * @returns 商城列表
   */
  getMallList(): Promise<MallListItem[]> {
    return http.get<MallListItem[]>('/mall/list')
  },

  /**
   * 获取商城详情
   *
   * 获取单个商城的详细信息。
   *
   * @param mallId - 商城ID
   * @returns 商城详情
   */
  getMallDetail(mallId: string): Promise<MallInfo> {
    return http.get<MallInfo>(`/mall/${mallId}`)
  },

  /**
   * 获取商城完整结构
   *
   * 一次性获取商城的所有结构数据，包括楼层、区域、店铺。
   * 这是进入商城页面时的主要数据加载接口。
   *
   * 【设计考虑】
   * 将多个数据合并为一个接口，减少网络请求次数，
   * 加快页面加载速度，提升用户体验。
   *
   * @param mallId - 商城ID
   * @returns 商城完整结构数据
   */
  getMallStructure(mallId: string): Promise<MallStructure> {
    return http.get<MallStructure>(`/mall/${mallId}/structure`)
  },

  /**
   * 获取楼层列表
   *
   * 单独获取楼层数据，用于楼层选择器等场景。
   *
   * @param mallId - 商城ID
   * @returns 楼层列表（按 index 排序）
   */
  getFloors(mallId: string): Promise<FloorInfo[]> {
    return http.get<FloorInfo[]>(`/mall/${mallId}/floors`)
  },

  /**
   * 获取区域列表
   *
   * 获取指定楼层的所有区域。
   *
   * @param floorId - 楼层ID
   * @returns 区域列表
   */
  getAreas(floorId: string): Promise<AreaInfo[]> {
    return http.get<AreaInfo[]>(`/floor/${floorId}/areas`)
  },

  /**
   * 获取店铺详情
   *
   * 获取店铺的完整信息，包括商品列表。
   * 用户点击店铺时调用。
   *
   * @param storeId - 店铺ID
   * @returns 店铺详情（含商品）
   */
  getStoreDetail(storeId: string): Promise<StoreDetail> {
    return http.get<StoreDetail>(`/store/${storeId}`)
  },

  /**
   * 获取店铺商品列表
   *
   * 单独获取商品列表，用于商品管理等场景。
   *
   * @param storeId - 店铺ID
   * @returns 商品列表
   */
  getStoreProducts(storeId: string): Promise<ProductInfo[]> {
    return http.get<ProductInfo[]>(`/store/${storeId}/products`)
  },

  /**
   * 获取可申请区域列表
   *
   * 商家查看可以申请入驻的区域。
   * 返回状态为 LOCKED 的区域，以及当前用户是否可以申请。
   *
   * @param mallId - 商城ID
   * @returns 可申请区域列表
   */
  getAvailableAreas(mallId: string): Promise<AvailableArea[]> {
    return http.get<AvailableArea[]>(`/mall/${mallId}/areas/available`)
  },
}

export default mallApi
