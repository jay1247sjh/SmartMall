/**
 * 商城管理 API 模块
 * 楼层、区域、版本管理相关接口
 */
import http from './http'

// ============================================================================
// Types
// ============================================================================

export interface Floor {
  id: number
  name: string
  level: number
  description?: string
  areas: Area[]
}

export interface Area {
  id: number
  name: string
  type: string
  status: 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'
  merchantId?: number
  merchantName?: string
  bounds: { x: number; y: number; width: number; height: number }
}

export interface CreateFloorRequest {
  name: string
  level: number
  description?: string
}

export interface CreateAreaRequest {
  name: string
  type: string
  bounds: { x: number; y: number; width: number; height: number }
}

export interface LayoutVersion {
  id: number
  version: string
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  createdBy: string
  createdAt: string
  description: string
  changeCount: number
}

// ============================================================================
// Floor API
// ============================================================================

/**
 * 获取楼层列表
 */
export async function getFloors(): Promise<Floor[]> {
  // TODO: 对接真实后端
  // return http.get('/api/mall/floors')
  
  return Promise.resolve([
    {
      id: 1,
      name: '1F',
      level: 1,
      description: '一楼 - 餐饮美食',
      areas: [
        { id: 1001, name: 'A-101', type: '餐饮', status: 'OCCUPIED', merchantId: 101, merchantName: '星巴克', bounds: { x: 0, y: 0, width: 100, height: 80 } },
        { id: 1002, name: 'A-102', type: '餐饮', status: 'LOCKED', bounds: { x: 100, y: 0, width: 80, height: 80 } },
        { id: 1003, name: 'A-103', type: '零售', status: 'PENDING', bounds: { x: 180, y: 0, width: 120, height: 80 } },
      ],
    },
    {
      id: 2,
      name: '2F',
      level: 2,
      description: '二楼 - 服装服饰',
      areas: [
        { id: 2001, name: 'B-201', type: '服装', status: 'AUTHORIZED', merchantId: 102, merchantName: '优衣库', bounds: { x: 0, y: 0, width: 150, height: 100 } },
        { id: 2002, name: 'B-202', type: '服装', status: 'LOCKED', bounds: { x: 150, y: 0, width: 90, height: 100 } },
      ],
    },
    {
      id: 3,
      name: '3F',
      level: 3,
      description: '三楼 - 娱乐休闲',
      areas: [
        { id: 3001, name: 'C-301', type: '娱乐', status: 'LOCKED', bounds: { x: 0, y: 0, width: 200, height: 150 } },
      ],
    },
  ])
}

/**
 * 创建楼层
 */
export async function createFloor(data: CreateFloorRequest): Promise<Floor> {
  // TODO: 对接真实后端
  // return http.post('/api/mall/floors', data)
  
  return Promise.resolve({
    id: Date.now(),
    name: data.name,
    level: data.level,
    description: data.description,
    areas: [],
  })
}

/**
 * 更新楼层
 */
export async function updateFloor(id: number, data: Partial<CreateFloorRequest>): Promise<Floor> {
  // TODO: 对接真实后端
  // return http.put(`/api/mall/floors/${id}`, data)
  
  return Promise.resolve({
    id,
    name: data.name || '1F',
    level: data.level || 1,
    description: data.description,
    areas: [],
  })
}

/**
 * 删除楼层
 */
export async function deleteFloor(id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.delete(`/api/mall/floors/${id}`)
  
  return Promise.resolve()
}

// ============================================================================
// Area API
// ============================================================================

/**
 * 创建区域
 */
export async function createArea(floorId: number, data: CreateAreaRequest): Promise<Area> {
  // TODO: 对接真实后端
  // return http.post(`/api/mall/floors/${floorId}/areas`, data)
  
  return Promise.resolve({
    id: Date.now(),
    name: data.name,
    type: data.type,
    status: 'LOCKED',
    bounds: data.bounds,
  })
}

/**
 * 更新区域
 */
export async function updateArea(id: number, data: Partial<CreateAreaRequest>): Promise<Area> {
  // TODO: 对接真实后端
  // return http.put(`/api/mall/areas/${id}`, data)
  
  return Promise.resolve({
    id,
    name: data.name || 'A-101',
    type: data.type || '餐饮',
    status: 'LOCKED',
    bounds: data.bounds || { x: 0, y: 0, width: 100, height: 80 },
  })
}

/**
 * 删除区域
 */
export async function deleteArea(id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.delete(`/api/mall/areas/${id}`)
  
  return Promise.resolve()
}

// ============================================================================
// Version API
// ============================================================================

/**
 * 获取版本列表
 */
export async function getVersions(): Promise<LayoutVersion[]> {
  // TODO: 对接真实后端
  // return http.get('/api/mall/versions')
  
  return Promise.resolve([
    {
      id: 1,
      version: 'v1.0.0',
      status: 'ARCHIVED',
      createdBy: 'admin',
      createdAt: '2024-12-01T10:00:00Z',
      description: '初始版本',
      changeCount: 0,
    },
    {
      id: 2,
      version: 'v1.1.0',
      status: 'ACTIVE',
      createdBy: 'admin',
      createdAt: '2024-12-15T14:30:00Z',
      description: '新增二楼区域',
      changeCount: 5,
    },
    {
      id: 3,
      version: 'v1.2.0',
      status: 'DRAFT',
      createdBy: 'admin',
      createdAt: '2024-12-28T09:00:00Z',
      description: '新增三楼区域',
      changeCount: 3,
    },
  ])
}

/**
 * 发布版本
 */
export async function publishVersion(id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/mall/versions/${id}/publish`)
  
  return Promise.resolve()
}

/**
 * 回滚版本
 */
export async function rollbackVersion(id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/mall/versions/${id}/rollback`)
  
  return Promise.resolve()
}

// ============================================================================
// Export
// ============================================================================

export const mallManageApi = {
  // Floor
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  // Area
  createArea,
  updateArea,
  deleteArea,
  // Version
  getVersions,
  publishVersion,
  rollbackVersion,
}

export default mallManageApi
