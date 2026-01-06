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
 * 【当前状态】
 * 此模块目前使用 Mock 数据，TODO 标记处需要对接真实后端。
 * Mock 数据模拟了真实的业务场景，便于前端开发和测试。
 *
 * 【后端对应接口】（待实现）
 * - GET /api/merchant/stats - 商家统计数据
 * - GET /api/merchant/stores - 我的店铺列表
 * - PUT /api/merchant/stores/:id - 更新店铺信息
 * - GET /api/merchant/applications - 我的区域申请
 * - GET /api/merchant/available-areas - 可申请区域
 * - POST /api/merchant/applications - 提交区域申请
 * ============================================================================
 */
// import http from './http' // TODO: 启用真实后端时取消注释

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
// API 方法
// ============================================================================

/**
 * 获取商家统计数据
 *
 * 用于商家仪表盘，展示店铺经营的关键指标。
 * 数据实时计算，反映当前状态。
 *
 * @returns 商家统计数据
 */
export async function getStats(): Promise<MerchantStats> {
  // TODO: 对接真实后端
  // return http.get('/api/merchant/stats')
  
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
  // TODO: 对接真实后端
  // return http.get('/api/merchant/stores')
  
  // Mock 数据：模拟星巴克在商城开了两家店
  return Promise.resolve([
    {
      id: 1,
      name: '星巴克咖啡 (旗舰店)',
      description: '提供优质咖啡和轻食',
      category: '餐饮',
      logo: undefined,
      cover: undefined,
      businessHours: '08:00-22:00',
      status: 'ACTIVE',
      areaId: 1001,
      areaName: 'A-101',
      floorName: '1F',
    },
    {
      id: 2,
      name: '星巴克咖啡 (二店)',
      description: '提供优质咖啡和轻食',
      category: '餐饮',
      logo: undefined,
      cover: undefined,
      businessHours: '09:00-21:00',
      status: 'ACTIVE',
      areaId: 2001,
      areaName: 'B-201',
      floorName: '2F',
    },
  ])
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
  // TODO: 对接真实后端
  // return http.put(`/api/merchant/stores/${id}`, data)
  
  return Promise.resolve({
    id,
    name: data.name || '星巴克咖啡',
    description: data.description || '提供优质咖啡和轻食',
    category: data.category || '餐饮',
    logo: data.logo,
    cover: data.cover,
    businessHours: data.businessHours || '08:00-22:00',
    status: 'ACTIVE',
    areaId: 1001,
    areaName: 'A-101',
    floorName: '1F',
  })
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
  // TODO: 对接真实后端
  // return http.get('/api/merchant/applications')
  
  // Mock 数据：一个待审批，一个被拒绝
  return Promise.resolve([
    {
      id: 1,
      areaId: 3001,
      areaName: 'C-301',
      floorName: '3F',
      reason: '希望在三楼开设新店铺',
      status: 'PENDING',
      createdAt: '2024-12-28T10:30:00Z',
    },
    {
      id: 2,
      areaId: 1002,
      areaName: 'A-102',
      floorName: '1F',
      reason: '扩展店铺面积',
      status: 'REJECTED',
      rejectReason: '该区域已被其他商家预定',
      createdAt: '2024-12-25T14:20:00Z',
    },
  ])
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
  // TODO: 对接真实后端
  // return http.get('/api/merchant/available-areas')
  
  // Mock 数据：模拟三层楼的区域分布
  return Promise.resolve([
    { id: 1001, name: 'A-101', floorId: 1, floorName: '1F', size: 100, status: 'OCCUPIED', position: { x: 0, y: 0 } },
    { id: 1002, name: 'A-102', floorId: 1, floorName: '1F', size: 80, status: 'LOCKED', position: { x: 100, y: 0 } },
    { id: 1003, name: 'A-103', floorId: 1, floorName: '1F', size: 120, status: 'PENDING', position: { x: 200, y: 0 } },
    { id: 2001, name: 'B-201', floorId: 2, floorName: '2F', size: 150, status: 'AUTHORIZED', position: { x: 0, y: 0 } },
    { id: 2002, name: 'B-202', floorId: 2, floorName: '2F', size: 90, status: 'LOCKED', position: { x: 150, y: 0 } },
    { id: 3001, name: 'C-301', floorId: 3, floorName: '3F', size: 200, status: 'LOCKED', position: { x: 0, y: 0 } },
  ])
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
  // TODO: 对接真实后端
  // return http.post('/api/merchant/applications', { areaId, reason })
  
  return Promise.resolve({
    id: Date.now(), // 使用时间戳作为临时 ID
    areaId,
    areaName: 'C-301',
    floorName: '3F',
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  })
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
