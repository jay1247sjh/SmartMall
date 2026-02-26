/**
 * ============================================================================
 * 商城管理 API 模块 (mall-manage.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 提供商城管理相关的 API 接口，包括已发布商城数据查询和版本管理。
 * 
 * 【业务背景】
 * 商城管理页面以只读方式展示建模器已发布的商城结构数据，
 * 并提供版本管理功能（激活、恢复、删除版本）。
 * 
 * 【与其他模块的关系】
 * - views/admin/MallManageView.vue：商城管理页面
 * - views/admin/LayoutVersionView.vue：版本管理页面
 * - views/admin/mall-builder/composables/useProjectManagement.ts：项目管理
 * - mall-builder.api.ts：ProjectResponse 类型定义
 * 
 * ============================================================================
 */
import { http } from './http'
import type { ProjectResponse } from './mall-builder.api'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 布局版本列表项（匹配后端 LayoutVersionListItem DTO）
 */
export interface LayoutVersionItem {
  versionId: string
  versionNumber: string
  status: 'ACTIVE' | 'PUBLISHED' | 'ARCHIVED'
  description: string
  changeCount: number
  sourceProjectId: string
  schemaVersion: number
  creatorId: string
  createdAt: string
  updatedAt: string
}

export type NavigationTargetType = 'store' | 'area' | 'facility'

export interface NavigationPlanRequest {
  targetType: NavigationTargetType
  targetKeyword: string
  sourceFloorId?: string
  sourcePosition?: {
    x: number
    y: number
    z: number
  }
}

export interface NavigationRoutePoint {
  floorId: string
  x: number
  y: number
  z: number
}

export interface NavigationRouteSegment {
  floorId: string
  floorName?: string
  points: NavigationRoutePoint[]
}

export interface NavigationRouteTransition {
  fromFloorId: string
  fromFloorName?: string
  toFloorId: string
  toFloorName?: string
  type: string
  position: NavigationRoutePoint
}

export interface NavigationRouteData {
  segments: NavigationRouteSegment[]
  transitions: NavigationRouteTransition[]
  steps: string[]
  distance: number
  eta: number
}

export interface NavigationTargetData {
  targetType: NavigationTargetType
  targetId: string
  targetName: string
  floorId: string
  floorName?: string
  position: NavigationRoutePoint
  areaId?: string
}

export interface NavigationPlanResponse {
  success: boolean
  code: 'OK' | 'PUBLISHED_NOT_FOUND' | 'TARGET_NOT_FOUND' | 'ROUTE_NOT_FOUND' | 'INVALID_REQUEST'
  message: string
  route?: NavigationRouteData
  target?: NavigationTargetData
  warnings?: string[]
}

// ============================================================================
// 商城数据 API
// ============================================================================

/**
 * 获取已发布的商城数据
 * 
 * 调用 GET /public/mall/published 获取当前已发布的商城项目数据。
 * 若无已发布项目，后端返回 data: null。
 * 
 * @returns ProjectResponse | null
 */
export async function getPublishedMallData(): Promise<ProjectResponse | null> {
  return http.get<ProjectResponse | null>('/public/mall/published')
}

export async function planPublishedMallNavigation(
  request: NavigationPlanRequest
): Promise<NavigationPlanResponse> {
  return http.post<NavigationPlanResponse>('/public/mall/navigation/plan', request)
}

// ============================================================================
// 版本 API
// ============================================================================

/**
 * 获取版本列表
 */
export async function getVersions(): Promise<LayoutVersionItem[]> {
  return http.get<LayoutVersionItem[]>('/mall/versions')
}

/**
 * 获取版本快照
 */
export async function getVersionSnapshot(versionId: string): Promise<ProjectResponse> {
  return http.get<ProjectResponse>(`/mall/versions/${versionId}/snapshot`)
}

/**
 * 更新版本描述
 */
export async function updateVersionDescription(versionId: string, description: string): Promise<LayoutVersionItem> {
  return http.put<LayoutVersionItem>(`/mall/versions/${versionId}`, { description })
}

/**
 * 激活版本
 */
export async function activateVersion(versionId: string): Promise<LayoutVersionItem> {
  return http.post<LayoutVersionItem>(`/mall/versions/${versionId}/activate`)
}

/**
 * 恢复版本为新草稿
 */
export async function restoreVersion(versionId: string): Promise<ProjectResponse> {
  return http.post<ProjectResponse>(`/mall/versions/${versionId}/restore`)
}

/**
 * 删除版本（软删除）
 */
export async function deleteVersion(versionId: string): Promise<void> {
  return http.delete<void>(`/mall/versions/${versionId}`)
}

// ============================================================================
// 导出
// ============================================================================

export const mallManageApi = {
  getPublishedMallData,
  planPublishedMallNavigation,
  getVersions,
  getVersionSnapshot,
  updateVersionDescription,
  activateVersion,
  restoreVersion,
  deleteVersion,
}

export default mallManageApi
