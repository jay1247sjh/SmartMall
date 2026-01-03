/**
 * 商家 API 模块
 * 商家相关接口（统计、店铺、区域申请等）
 */
// import http from './http' // TODO: 启用真实后端时取消注释

// ============================================================================
// Types
// ============================================================================

export interface MerchantStats {
  storeCount: number
  productCount: number
  todayVisitors: number
  pendingTasks: number
}

export interface Store {
  id: number
  name: string
  description: string
  category: string
  logo?: string
  cover?: string
  businessHours: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  areaId: number
  areaName: string
  floorName: string
}

export interface UpdateStoreRequest {
  name?: string
  description?: string
  category?: string
  logo?: string
  cover?: string
  businessHours?: string
}

export interface AreaApplication {
  id: number
  areaId: number
  areaName: string
  floorName: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectReason?: string
  createdAt: string
}

export interface AvailableArea {
  id: number
  name: string
  floorId: number
  floorName: string
  size: number
  status: 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'
  position: { x: number; y: number }
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * 获取商家统计数据
 */
export async function getStats(): Promise<MerchantStats> {
  // TODO: 对接真实后端
  // return http.get('/api/merchant/stats')
  
  return Promise.resolve({
    storeCount: 2,
    productCount: 56,
    todayVisitors: 128,
    pendingTasks: 3,
  })
}

/**
 * 获取我的店铺列表
 */
export async function getMyStores(): Promise<Store[]> {
  // TODO: 对接真实后端
  // return http.get('/api/merchant/stores')
  
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
 */
export async function getMyApplications(): Promise<AreaApplication[]> {
  // TODO: 对接真实后端
  // return http.get('/api/merchant/applications')
  
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
 */
export async function getAvailableAreas(): Promise<AvailableArea[]> {
  // TODO: 对接真实后端
  // return http.get('/api/merchant/available-areas')
  
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
 */
export async function applyForArea(areaId: number, reason: string): Promise<AreaApplication> {
  // TODO: 对接真实后端
  // return http.post('/api/merchant/applications', { areaId, reason })
  
  return Promise.resolve({
    id: Date.now(),
    areaId,
    areaName: 'C-301',
    floorName: '3F',
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  })
}

// ============================================================================
// Export
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
