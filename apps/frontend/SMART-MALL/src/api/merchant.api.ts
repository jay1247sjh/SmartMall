/**
 * ============================================================================
 * 商家 API 模块 (Merchant API)
 * ============================================================================
 *
 * 【业务职责】
 * 提供商家（MERCHANT 角色）专用的 API 接口，包括：
 * 1. 商家统计数据 - 店铺数、商品数、访客数等
 * 2. 店铺管理 - 查看和更新自己的店铺信息
 * 3. 区域申请 - 申请入驻新区域、查看申请状态
 *
 * 【商家角色说明】
 * 商家（Merchant）是 Smart Mall 的核心用户群体：
 * - 他们是入驻商城的店铺经营者
 * - 可以管理自己的店铺和商品
 * - 可以申请入驻新的区域
 * - 可以使用建模器装修自己的 3D 店铺
 *
 * 【区域入驻流程】
 * 1. 商家浏览可申请区域（getAvailableAreas）
 * 2. 选择心仪区域，提交申请（applyForArea）
 * 3. 管理员审批申请
 * 4. 审批通过后，区域状态变为 AUTHORIZED
 * 5. 商家可以开始装修店铺
 *
 * 【后端对应接口】
 * - GET /store/my - 我的店铺列表
 * - PUT /store/:id - 更新店铺信息
 * - GET /area/available - 可申请区域
 * - POST /area/apply - 提交区域申请
 * - GET /area/apply/my - 我的区域申请
 * ============================================================================
 */
import http from './http'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 商家统计数据
 * 用于商家仪表盘展示关键指标
 */
export interface MerchantStats {
  /** 店铺数量 */
  storeCount: number
  /** 商品总数 */
  productCount: number
  /** 今日访客数 */
  todayVisitors: number
  /** 待处理任务数（如待回复咨询、待处理订单等） */
  pendingTasks: number
}

/**
 * 店铺信息
 * 商家拥有的店铺详情
 */
export interface Store {
  id: number
  /** 店铺名称 */
  name: string
  /** 店铺描述 */
  description: string
  /** 经营类目（如餐饮、服装、数码等） */
  category: string
  /** 店铺 Logo URL */
  logo?: string
  /** 店铺封面图 URL */
  cover?: string
  /** 营业时间（如 "08:00-22:00"） */
  businessHours: string
  /** 店铺状态 */
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  /** 所在区域 ID */
  areaId: number
  /** 所在区域名称（如 "A-101"） */
  areaName: string
  /** 所在楼层名称（如 "1F"） */
  floorName: string
}

/**
 * 更新店铺请求参数
 * 所有字段都是可选的，只更新提供的字段
 */
export interface UpdateStoreRequest {
  name?: string
  description?: string
  category?: string
  logo?: string
  cover?: string
  businessHours?: string
}

/**
 * 区域申请记录
 * 商家提交的入驻申请
 */
export interface AreaApplication {
  id: number
  /** 申请的区域 ID */
  areaId: number
  /** 区域名称 */
  areaName: string
  /** 楼层名称 */
  floorName: string
  /** 申请理由 */
  reason: string
  /** 申请状态 */
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  /** 拒绝原因（仅当 status 为 REJECTED 时有值） */
  rejectReason?: string
  /** 申请时间 */
  createdAt: string
}

/**
 * 可申请区域信息
 * 商家可以申请入驻的区域
 */
export interface AvailableArea {
  id: number
  /** 区域名称（如 "A-101"） */
  name: string
  /** 所在楼层 ID */
  floorId: number
  /** 所在楼层名称 */
  floorName: string
  /** 区域面积（平方米） */
  size: number
  /** 区域状态 */
  status: 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'
  /** 区域在楼层平面图中的位置 */
  position: { x: number; y: number }
}

// ============================================================================
// 后端 DTO 类型定义
// ============================================================================

/**
 * 后端店铺 DTO 类型（与后端 StoreDTO 对应）
 */
interface BackendStoreDTO {
  storeId: string
  areaId: string
  areaName: string
  floorId: string
  floorName: string
  merchantId: string
  merchantName: string
  name: string
  description: string
  category: string
  businessHours: string
  logo?: string
  cover?: string
  status: string
  closeReason?: string
  createdAt: string
  approvedAt?: string
}

/**
 * 后端可申请区域 DTO 类型（与后端 AvailableAreaDTO 对应）
 */
interface BackendAvailableAreaDTO {
  areaId: string
  name: string
  type: string
  floorId: string
  floorName: string
  status: string
  shape?: unknown
  properties?: unknown
}

/**
 * 后端区域申请 DTO 类型（与后端 AreaApplyDTO 对应）
 */
interface BackendAreaApplyDTO {
  applyId: string
  areaId: string
  areaName: string
  floorName: string
  merchantId: string
  merchantName: string
  status: string
  applyReason: string
  rejectReason?: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
}

/**
 * 将后端店铺 DTO 转换为前端类型
 */
function mapBackendStoreToFrontend(dto: BackendStoreDTO): Store {
  return {
    id: parseInt(dto.storeId) || 0,
    name: dto.name,
    description: dto.description,
    category: dto.category,
    logo: dto.logo,
    cover: dto.cover,
    businessHours: dto.businessHours,
    status: dto.status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
    areaId: parseInt(dto.areaId) || 0,
    areaName: dto.areaName,
    floorName: dto.floorName,
  }
}

/**
 * 将后端可申请区域 DTO 转换为前端类型
 */
function mapBackendAreaToFrontend(dto: BackendAvailableAreaDTO): AvailableArea {
  return {
    id: parseInt(dto.areaId) || 0,
    name: dto.name,
    floorId: parseInt(dto.floorId) || 0,
    floorName: dto.floorName,
    size: 100, // 后端未提供 size，使用默认值
    status: dto.status as 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED',
    position: { x: 0, y: 0 }, // 后端未提供 position，使用默认值
  }
}

/**
 * 将后端区域申请 DTO 转换为前端类型
 */
function mapBackendApplyToFrontend(dto: BackendAreaApplyDTO): AreaApplication {
  return {
    id: parseInt(dto.applyId) || 0,
    areaId: parseInt(dto.areaId) || 0,
    areaName: dto.areaName,
    floorName: dto.floorName,
    reason: dto.applyReason,
    status: dto.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectReason: dto.rejectReason,
    createdAt: dto.createdAt,
  }
}

// ============================================================================
// API 方法
// ============================================================================

/**
 * 获取商家统计数据
 *
 * 用于商家仪表盘，展示店铺经营的关键指标。
 * 数据实时计算，反映当前状态。
 *
 * @returns 商家统计数据
 * 
 * TODO: 后端尚未实现 /merchant/stats 接口，暂时使用 Mock 数据
 */
export async function getStats(): Promise<MerchantStats> {
  // TODO: 后端实现后启用
  // return http.get('/merchant/stats')
  
  // Mock 数据：模拟一个有 2 家店铺的商家
  return Promise.resolve({
    storeCount: 2,
    productCount: 56,
    todayVisitors: 128,
    pendingTasks: 3,
  })
}

/**
 * 获取我的店铺列表
 *
 * 返回当前商家拥有的所有店铺。
 * 一个商家可以在商城中拥有多家店铺。
 *
 * @returns 店铺列表
 */
export async function getMyStores(): Promise<Store[]> {
  const data = await http.get<BackendStoreDTO[]>('/store/my')
  return data.map(mapBackendStoreToFrontend)
}

/**
 * 更新店铺信息
 *
 * 商家可以更新自己店铺的基本信息。
 * 只能更新自己拥有的店铺。
 *
 * @param id - 店铺 ID
 * @param data - 要更新的字段
 * @returns 更新后的店铺信息
 */
export async function updateStore(id: number, data: UpdateStoreRequest): Promise<Store> {
  const result = await http.put<BackendStoreDTO>(`/store/${id}`, data)
  return mapBackendStoreToFrontend(result)
}

/**
 * 获取我的区域申请列表
 *
 * 返回当前商家提交的所有区域入驻申请。
 * 包括待审批、已通过、已拒绝的申请。
 *
 * @returns 申请列表
 */
export async function getMyApplications(): Promise<AreaApplication[]> {
  const data = await http.get<BackendAreaApplyDTO[]>('/area/apply/my')
  return data.map(mapBackendApplyToFrontend)
}

/**
 * 获取可申请的区域列表
 *
 * 返回商城中所有区域及其状态。
 * 商家可以申请状态为 LOCKED 的区域。
 *
 * 【区域状态说明】
 * - LOCKED：可申请，尚未被任何商家占用
 * - PENDING：有商家正在申请中
 * - AUTHORIZED：已授权给某商家，但尚未完成装修
 * - OCCUPIED：已被商家入驻并开业
 *
 * @returns 区域列表
 */
export async function getAvailableAreas(): Promise<AvailableArea[]> {
  const data = await http.get<BackendAvailableAreaDTO[]>('/area/available')
  return data.map(mapBackendAreaToFrontend)
}

/**
 * 申请区域
 *
 * 商家提交区域入驻申请。
 * 申请提交后状态为 PENDING，等待管理员审批。
 *
 * @param areaId - 要申请的区域 ID
 * @param reason - 申请理由
 * @returns 创建的申请记录
 */
export async function applyForArea(areaId: number, reason: string): Promise<AreaApplication> {
  const result = await http.post<BackendAreaApplyDTO>('/area/apply', {
    areaId: String(areaId),
    applyReason: reason,
  })
  return mapBackendApplyToFrontend(result)
}

// ============================================================================
// 导出
// ============================================================================

export const merchantApi = {
  getStats,
  getMyStores,
  updateStore,
  getMyApplications,
  getAvailableAreas,
  applyForArea,
}

export default merchantApi
