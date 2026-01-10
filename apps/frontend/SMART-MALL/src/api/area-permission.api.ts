/**
 * ============================================================================
 * 区域权限 API 模块 (Area Permission API)
 * ============================================================================
 *
 * 【业务职责】
 * 提供区域权限管理相关的 API 接口，包括：
 * 1. 商家端 - 查看可申请区域、提交申请、查看申请历史、查看权限
 * 2. 管理员端 - 审批申请、管理权限、撤销权限
 *
 * 【区域权限流程】
 * 1. 商家浏览可申请区域（getAvailableAreas）
 * 2. 商家提交区域申请（submitApplication）
 * 3. 管理员审批申请（approveApplication / rejectApplication）
 * 4. 审批通过后，商家获得区域权限
 * 5. 管理员可撤销权限（revokePermission）
 *
 * 【后端对应接口】
 * - GET  /api/area/available - 获取可申请区域
 * - POST /api/area/apply - 提交区域申请
 * - GET  /api/area/apply/my - 查询我的申请
 * - GET  /api/area/permission/my - 查询我的权限
 * - GET  /api/admin/area/apply/pending - 获取待审批列表
 * - POST /api/admin/area/apply/{applyId}/approve - 审批通过
 * - POST /api/admin/area/apply/{applyId}/reject - 审批驳回
 * - POST /api/admin/area/permission/{permissionId}/revoke - 撤销权限
 * ============================================================================
 */
import http from './http'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 可申请区域 DTO
 * 对应后端 AvailableAreaDTO
 */
export interface AvailableAreaDTO {
  /** 区域ID */
  areaId: string
  /** 区域名称 */
  name: string
  /** 区域类型 */
  type: string
  /** 楼层ID */
  floorId: string
  /** 楼层名称 */
  floorName: string
  /** 区域状态 (AVAILABLE, OCCUPIED, LOCKED) */
  status: string
  /** 区域边界 */
  shape: object | null
  /** 区域属性 */
  properties: object | null
}

/**
 * 区域申请 DTO
 * 对应后端 AreaApplyDTO
 */
export interface AreaApplyDTO {
  /** 申请ID */
  applyId: string
  /** 区域ID */
  areaId: string
  /** 区域名称 */
  areaName: string
  /** 楼层名称 */
  floorName: string
  /** 商家ID */
  merchantId: string
  /** 商家名称 */
  merchantName: string
  /** 申请状态 (PENDING, APPROVED, REJECTED) */
  status: string
  /** 申请理由 */
  applyReason: string
  /** 驳回理由 */
  rejectReason: string | null
  /** 创建时间 */
  createdAt: string
  /** 审批通过时间 */
  approvedAt: string | null
  /** 驳回时间 */
  rejectedAt: string | null
}

/**
 * 区域权限 DTO
 * 对应后端 AreaPermissionDTO
 */
export interface AreaPermissionDTO {
  /** 权限ID */
  permissionId: string
  /** 区域ID */
  areaId: string
  /** 区域名称 */
  areaName: string
  /** 楼层ID */
  floorId: string
  /** 楼层名称 */
  floorName: string
  /** 区域边界 */
  areaBoundaries: object | null
  /** 权限状态 (ACTIVE, REVOKED) */
  status: string
  /** 授权时间 */
  grantedAt: string
}

/**
 * 区域申请请求
 * 对应后端 AreaApplyRequest
 */
export interface AreaApplyRequest {
  /** 区域ID */
  areaId: string
  /** 申请理由 */
  applyReason?: string
}

/**
 * 驳回请求
 * 对应后端 RejectRequest
 */
export interface RejectRequest {
  /** 驳回理由 */
  reason: string
}

/**
 * 撤销请求
 * 对应后端 RevokeRequest
 */
export interface RevokeRequest {
  /** 撤销理由 */
  reason: string
}

// ============================================================================
// 商家端 API
// ============================================================================

/**
 * 获取可申请的区域列表
 *
 * @param floorId - 可选，按楼层筛选
 * @returns 可申请区域列表
 */
export async function getAvailableAreas(floorId?: string): Promise<AvailableAreaDTO[]> {
  const params = floorId ? { floorId } : undefined
  return http.get<AvailableAreaDTO[]>('/area/available', { params })
}

/**
 * 提交区域申请
 *
 * @param request - 申请请求
 * @returns 创建的申请记录
 */
export async function submitApplication(request: AreaApplyRequest): Promise<AreaApplyDTO> {
  return http.post<AreaApplyDTO>('/area/apply', request)
}

/**
 * 获取我的申请列表
 *
 * @returns 申请列表
 */
export async function getMyApplications(): Promise<AreaApplyDTO[]> {
  return http.get<AreaApplyDTO[]>('/area/apply/my')
}

/**
 * 获取我的权限列表
 *
 * @returns 权限列表
 */
export async function getMyPermissions(): Promise<AreaPermissionDTO[]> {
  return http.get<AreaPermissionDTO[]>('/area/permission/my')
}

// ============================================================================
// 管理员端 API
// ============================================================================

/**
 * 获取待审批申请列表
 *
 * @returns 待审批申请列表
 */
export async function getPendingApplications(): Promise<AreaApplyDTO[]> {
  return http.get<AreaApplyDTO[]>('/admin/area/apply/pending')
}

/**
 * 审批通过
 *
 * @param applyId - 申请ID
 */
export async function approveApplication(applyId: string): Promise<void> {
  return http.post<void>(`/admin/area/apply/${applyId}/approve`)
}

/**
 * 审批驳回
 *
 * @param applyId - 申请ID
 * @param reason - 驳回理由
 */
export async function rejectApplication(applyId: string, reason: string): Promise<void> {
  return http.post<void>(`/admin/area/apply/${applyId}/reject`, { reason })
}

/**
 * 撤销权限
 *
 * @param permissionId - 权限ID
 * @param reason - 撤销理由
 */
export async function revokePermission(permissionId: string, reason: string): Promise<void> {
  return http.post<void>(`/admin/area/permission/${permissionId}/revoke`, { reason })
}

// ============================================================================
// 导出
// ============================================================================

export const areaPermissionApi = {
  // 商家端
  getAvailableAreas,
  submitApplication,
  getMyApplications,
  getMyPermissions,
  // 管理员端
  getPendingApplications,
  approveApplication,
  rejectApplication,
  revokePermission,
}

export default areaPermissionApi
