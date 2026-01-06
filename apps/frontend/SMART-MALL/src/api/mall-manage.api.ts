/**
 * ============================================================================
 * 商城管理 API 模块 (mall-manage.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 提供商城管理相关的 API 接口，包括楼层管理、区域管理、版本管理。
 * 这是管理员进行商城结构配置的核心 API 模块。
 * 
 * 【业务背景】
 * 商城管理是智慧商城系统的核心功能之一：
 * - 楼层管理：创建、编辑、删除商城楼层
 * - 区域管理：在楼层内划分区域，分配给商家
 * - 版本管理：商城布局的版本控制，支持发布和回滚
 * 
 * 【区域状态说明】
 * - LOCKED: 锁定状态，不可分配（系统保留区域）
 * - PENDING: 待审核，商家已申请但未批准
 * - AUTHORIZED: 已授权，商家可以进行建模
 * - OCCUPIED: 已占用，商家正在使用中
 * 
 * 【版本管理说明】
 * - DRAFT: 草稿版本，可以继续编辑
 * - ACTIVE: 当前生效版本，用户看到的是这个版本
 * - ARCHIVED: 归档版本，历史记录
 * 
 * 【当前状态】
 * ⚠️ 后端接口尚未实现，当前使用 Mock 数据。
 * 待后端实现后，取消注释真实 API 调用即可。
 * 
 * 【与其他模块的关系】
 * - views/admin/：管理员后台使用此 API
 * - stores/mall.store.ts：商城状态管理
 * - mall.api.ts：普通用户查看商城信息
 * 
 * ============================================================================
 */
// import http from './http' // TODO: 启用真实后端时取消注释

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 楼层信息
 * 
 * 商城的一个楼层，包含多个区域。
 */
export interface Floor {
  /** 楼层 ID */
  id: number
  /** 楼层名称（如 "1F", "B1"） */
  name: string
  /** 楼层层级（1 表示一楼，-1 表示地下一层） */
  level: number
  /** 楼层描述（如 "一楼 - 餐饮美食"） */
  description?: string
  /** 楼层内的区域列表 */
  areas: Area[]
}

/**
 * 区域信息
 * 
 * 楼层内的一个区域，可以分配给商家。
 */
export interface Area {
  /** 区域 ID */
  id: number
  /** 区域编号（如 "A-101"） */
  name: string
  /** 区域类型（如 "餐饮", "服装", "娱乐"） */
  type: string
  /** 区域状态 */
  status: 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'
  /** 商家 ID（已分配时） */
  merchantId?: number
  /** 商家名称（已分配时） */
  merchantName?: string
  /** 区域边界（用于 2D 平面图显示） */
  bounds: { x: number; y: number; width: number; height: number }
}

/**
 * 创建楼层请求
 */
export interface CreateFloorRequest {
  /** 楼层名称 */
  name: string
  /** 楼层层级 */
  level: number
  /** 楼层描述 */
  description?: string
}

/**
 * 创建区域请求
 */
export interface CreateAreaRequest {
  /** 区域编号 */
  name: string
  /** 区域类型 */
  type: string
  /** 区域边界 */
  bounds: { x: number; y: number; width: number; height: number }
}

/**
 * 布局版本信息
 * 
 * 商城布局的一个版本，用于版本控制。
 */
export interface LayoutVersion {
  /** 版本 ID */
  id: number
  /** 版本号（如 "v1.0.0"） */
  version: string
  /** 版本状态 */
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  /** 创建者用户名 */
  createdBy: string
  /** 创建时间（ISO 8601 格式） */
  createdAt: string
  /** 版本描述 */
  description: string
  /** 变更数量 */
  changeCount: number
}

// ============================================================================
// 楼层 API
// ============================================================================

/**
 * 获取楼层列表
 * 
 * 获取商城所有楼层及其区域信息。
 * 
 * @returns 楼层列表（包含区域）
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
 * 
 * @param data 楼层信息
 * @returns 创建的楼层
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
 * 
 * @param id 楼层 ID
 * @param data 要更新的字段
 * @returns 更新后的楼层
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
 * 
 * ⚠️ 删除楼层会同时删除楼层内的所有区域。
 * 
 * @param _id 楼层 ID
 */
export async function deleteFloor(_id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.delete(`/api/mall/floors/${_id}`)
  
  return Promise.resolve()
}

// ============================================================================
// 区域 API
// ============================================================================

/**
 * 创建区域
 * 
 * 在指定楼层内创建新区域。
 * 
 * @param _floorId 楼层 ID
 * @param data 区域信息
 * @returns 创建的区域
 */
export async function createArea(_floorId: number, data: CreateAreaRequest): Promise<Area> {
  // TODO: 对接真实后端
  // return http.post(`/api/mall/floors/${_floorId}/areas`, data)
  
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
 * 
 * @param id 区域 ID
 * @param data 要更新的字段
 * @returns 更新后的区域
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
 * 
 * ⚠️ 已分配给商家的区域不能删除。
 * 
 * @param _id 区域 ID
 */
export async function deleteArea(_id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.delete(`/api/mall/areas/${_id}`)
  
  return Promise.resolve()
}

// ============================================================================
// 版本 API
// ============================================================================

/**
 * 获取版本列表
 * 
 * 获取商城布局的所有版本。
 * 
 * @returns 版本列表
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
 * 
 * 将草稿版本发布为正式版本。
 * 发布后，当前 ACTIVE 版本会变为 ARCHIVED。
 * 
 * @param _id 版本 ID
 */
export async function publishVersion(_id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/mall/versions/${_id}/publish`)
  
  return Promise.resolve()
}

/**
 * 回滚版本
 * 
 * 将商城布局回滚到指定的历史版本。
 * 
 * @param _id 版本 ID
 */
export async function rollbackVersion(_id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/mall/versions/${_id}/rollback`)
  
  return Promise.resolve()
}

// ============================================================================
// 导出
// ============================================================================

/**
 * 商城管理 API 对象
 * 
 * 提供命名空间式的 API 调用方式。
 * 
 * @example
 * ```typescript
 * import { mallManageApi } from '@/api'
 * 
 * // 获取楼层列表
 * const floors = await mallManageApi.getFloors()
 * 
 * // 创建新楼层
 * const newFloor = await mallManageApi.createFloor({
 *   name: '4F',
 *   level: 4,
 *   description: '四楼 - 儿童乐园'
 * })
 * 
 * // 发布版本
 * await mallManageApi.publishVersion(3)
 * ```
 */
export const mallManageApi = {
  // 楼层管理
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  // 区域管理
  createArea,
  updateArea,
  deleteArea,
  // 版本管理
  getVersions,
  publishVersion,
  rollbackVersion,
}

export default mallManageApi
