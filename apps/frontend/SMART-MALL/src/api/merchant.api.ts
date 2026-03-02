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
  /** 待处理申请数 */
  pendingApplications: number
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
  status: 'AVAILABLE' | 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'
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
  return http.get('/dashboard/merchant/stats')
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
// AI 布局生成类型定义
// ============================================================================

/**
 * 3D 位置
 */
export interface Position3D {
  x: number
  y: number
  z: number
}

/**
 * 旋转（绕 Y 轴）
 */
export interface Rotation {
  y: number
}

/**
 * 3D 缩放
 */
export interface Scale3D {
  x: number
  y: number
  z: number
}

/**
 * 店铺内的单个对象
 * 描述一个家具、设备或装饰物的位置和外观
 */
export interface StoreObject {
  /** 对象名称（如 "吧台"） */
  name: string
  /** 材质预设 ID */
  materialId: string
  /** 位置 */
  position: Position3D
  /** 旋转 */
  rotation: Rotation
  /** 缩放 */
  scale: Scale3D
}

/**
 * 店铺布局数据
 * AI 生成的单个区域内 3D 对象集合
 */
export interface StoreLayoutData {
  /** 主题名称 */
  theme: string
  /** 区域 ID */
  areaId: string
  /** 对象列表 */
  objects: StoreObject[]
}

/**
 * AI 布局生成响应
 */
export interface StoreLayoutResponse {
  success: boolean
  message: string
  data?: StoreLayoutData
}

/**
 * 商家区域布局查询响应
 */
export interface AreaLayoutResponse {
  source: 'PROPOSAL' | 'AREA' | 'EMPTY'
  proposalId?: string
  proposalStatus?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'NONE'
  rejectReason?: string
  updatedAt?: string
  layoutData?: StoreLayoutData
}

/**
 * 建模提案列表项
 */
export interface LayoutProposalListItem {
  proposalId: string
  areaId: string
  areaName?: string
  floorName?: string
  merchantId: string
  merchantName?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  submitNote?: string
  rejectReason?: string
  objectCount?: number
  createdAt?: string
  updatedAt?: string
  reviewedAt?: string
}

// ============================================================================
// AI 布局生成 API 方法
// ============================================================================

/**
 * AI 生成店铺布局
 *
 * 商家选择主题后，调用后端转发到 Intelligence Service，
 * 由 LLM 生成区域内的 3D 店铺布局。
 *
 * @param areaId - 目标区域 ID
 * @param params - 生成参数（主题）
 * @returns AI 生成的布局数据
 */
export async function generateAILayout(
  areaId: string,
  params: { theme: string },
): Promise<StoreLayoutResponse> {
  return http.post<StoreLayoutResponse>(`/merchant/area/${areaId}/ai-layout`, params)
}

/**
 * 获取区域布局（草稿优先）
 */
export async function getAreaLayout(areaId: string): Promise<AreaLayoutResponse> {
  return http.get<AreaLayoutResponse>(`/merchant/area/${areaId}/layout`)
}

/**
 * 保存区域布局草稿
 */
export async function saveLayoutDraft(
  areaId: string,
  layoutData: StoreLayoutData,
): Promise<LayoutProposalListItem> {
  return http.put<LayoutProposalListItem>(`/merchant/area/${areaId}/layout/draft`, { layoutData })
}

/**
 * 提交区域布局提案
 */
export async function submitLayoutProposal(
  areaId: string,
  layoutData: StoreLayoutData,
  submitNote?: string,
): Promise<LayoutProposalListItem> {
  return http.post<LayoutProposalListItem>(`/merchant/area/${areaId}/layout/submit`, {
    layoutData,
    submitNote,
  })
}

/**
 * 应用布局（兼容旧调用，已迁移为“提交审核提案”）
 *
 * @deprecated 使用 submitLayoutProposal
 */
export async function applyLayout(
  areaId: string,
  layoutData: StoreLayoutData,
): Promise<void> {
  await submitLayoutProposal(areaId, layoutData)
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
  generateAILayout,
  getAreaLayout,
  saveLayoutDraft,
  submitLayoutProposal,
  applyLayout,
}

export default merchantApi
