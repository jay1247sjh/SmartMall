/**
 * 商城建模器 API
 * 
 * 职责：
 * - 项目的创建、查询、更新、删除
 * - 与后端 MallBuilderController 对接
 */

import { http } from './http'
import type { 
  MallProject, 
  FloorDefinition, 
  AreaDefinition,
  ProjectSettings,
} from '@/builder/types/mall-project'
import type { Polygon } from '@/builder/geometry/types'

// ============================================================================
// 类型定义
// ============================================================================

/** 顶点 */
export interface VertexDTO {
  x: number
  y: number
}

/** 轮廓 DTO */
export interface OutlineDTO {
  vertices: VertexDTO[]
  isClosed?: boolean
}

/** 设置 DTO */
export interface SettingsDTO {
  gridSize?: number
  snapToGrid?: boolean
  defaultFloorHeight?: number
  unit?: string
  display?: Record<string, unknown>
}

/** 区域 DTO */
export interface AreaDTO {
  areaId?: string
  name: string
  type: string
  shape: OutlineDTO
  color?: string
  properties?: Record<string, unknown>
  merchantId?: string
  rental?: Record<string, unknown>
  visible?: boolean
  locked?: boolean
}

/** 楼层 DTO */
export interface FloorDTO {
  floorId?: string
  name: string
  level: number
  height?: number
  shape?: OutlineDTO
  inheritOutline?: boolean
  color?: string
  visible?: boolean
  locked?: boolean
  sortOrder?: number
  areas?: AreaDTO[]
}

/** 创建项目请求 */
export interface CreateProjectRequest {
  name: string
  description?: string
  outline: OutlineDTO
  settings?: SettingsDTO
  floors?: FloorDTO[]
}

/** 更新项目请求 */
export interface UpdateProjectRequest extends CreateProjectRequest {
  version?: number
}

/** 区域响应 */
export interface AreaResponse {
  areaId: string
  name: string
  type: string
  shape: OutlineDTO
  color?: string
  properties?: Record<string, unknown>
  merchantId?: string
  rental?: Record<string, unknown>
  visible: boolean
  locked: boolean
}

/** 楼层响应 */
export interface FloorResponse {
  floorId: string
  name: string
  level: number
  height: number
  shape?: OutlineDTO
  inheritOutline: boolean
  color?: string
  visible: boolean
  locked: boolean
  sortOrder: number
  areas?: AreaResponse[]
}

/** 项目详情响应 */
export interface ProjectResponse {
  projectId: string
  name: string
  description?: string
  outline: OutlineDTO
  settings?: SettingsDTO
  floors?: FloorResponse[]
  version: number
  createdAt: string
  updatedAt: string
}

/** 项目列表项 */
export interface ProjectListItem {
  projectId: string
  name: string
  description?: string
  floorCount: number
  areaCount: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// 转换函数
// ============================================================================

/**
 * 将前端 MallProject 转换为 API 请求格式
 */
export function toCreateRequest(project: MallProject): CreateProjectRequest {
  return {
    name: project.name,
    description: project.description,
    outline: toOutlineDTO(project.outline),
    settings: toSettingsDTO(project.settings),
    floors: project.floors.map(toFloorDTO),
  }
}

/**
 * 将前端 MallProject 转换为更新请求格式
 */
export function toUpdateRequest(project: MallProject): UpdateProjectRequest {
  return {
    ...toCreateRequest(project),
    version: project.version,
  }
}

/**
 * 将 API 响应转换为前端 MallProject 格式
 */
export function toMallProject(response: ProjectResponse): MallProject {
  return {
    id: response.projectId,
    name: response.name,
    description: response.description,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    version: response.version,
    outline: toPolygon(response.outline),
    settings: toProjectSettings(response.settings),
    floors: response.floors?.map(toFloorDefinition) ?? [],
  }
}

function toOutlineDTO(polygon: Polygon): OutlineDTO {
  return {
    vertices: polygon.vertices.map((v: { x: number; y: number }) => ({ x: v.x, y: v.y })),
    isClosed: polygon.isClosed,
  }
}

function toSettingsDTO(settings: ProjectSettings): SettingsDTO {
  return {
    gridSize: settings.gridSize,
    snapToGrid: settings.snapToGrid,
    defaultFloorHeight: settings.defaultFloorHeight,
    unit: settings.unit,
    display: settings.display as unknown as Record<string, unknown>,
  }
}

function toFloorDTO(floor: FloorDefinition): FloorDTO {
  return {
    floorId: floor.id,
    name: floor.name,
    level: floor.level,
    height: floor.height,
    shape: floor.shape ? toOutlineDTO(floor.shape) : undefined,
    inheritOutline: floor.inheritOutline,
    color: floor.color,
    visible: floor.visible,
    locked: floor.locked,
    areas: floor.areas.map(toAreaDTO),
  }
}

function toAreaDTO(area: AreaDefinition): AreaDTO {
  return {
    areaId: area.id,
    name: area.name,
    type: area.type,
    shape: toOutlineDTO(area.shape),
    color: area.color,
    properties: area.properties as unknown as Record<string, unknown>,
    merchantId: area.merchantId,
    rental: area.rental as unknown as Record<string, unknown> | undefined,
    visible: area.visible,
    locked: area.locked,
  }
}

function toPolygon(dto: OutlineDTO): Polygon {
  return {
    vertices: dto.vertices.map(v => ({ x: v.x, y: v.y })),
    isClosed: dto.isClosed ?? true,
  }
}

function toProjectSettings(dto?: SettingsDTO): ProjectSettings {
  const display = dto?.display as Record<string, unknown> | undefined
  return {
    gridSize: dto?.gridSize ?? 1,
    snapToGrid: dto?.snapToGrid ?? true,
    defaultFloorHeight: dto?.defaultFloorHeight ?? 4,
    unit: (dto?.unit as 'meters' | 'feet') ?? 'meters',
    display: {
      showGrid: (display?.showGrid as boolean) ?? true,
      showRuler: (display?.showRuler as boolean) ?? true,
      showAreaLabels: (display?.showAreaLabels as boolean) ?? true,
      backgroundColor: (display?.backgroundColor as string) ?? '#0a0a0a',
      gridColor: (display?.gridColor as string) ?? '#1a1a1a',
    },
  }
}

function toFloorDefinition(dto: FloorResponse): FloorDefinition {
  return {
    id: dto.floorId,
    name: dto.name,
    level: dto.level,
    height: dto.height,
    shape: dto.shape ? toPolygon(dto.shape) : undefined,
    inheritOutline: dto.inheritOutline,
    color: dto.color,
    visible: dto.visible,
    locked: dto.locked,
    areas: dto.areas?.map(toAreaDefinition) ?? [],
  }
}

function toAreaDefinition(dto: AreaResponse): AreaDefinition {
  const props = dto.properties as Record<string, unknown> | undefined
  return {
    id: dto.areaId,
    name: dto.name,
    type: dto.type as AreaDefinition['type'],
    shape: toPolygon(dto.shape),
    color: dto.color ?? '#3b82f6',
    properties: {
      area: (props?.area as number) ?? 0,
      perimeter: (props?.perimeter as number) ?? 0,
      minRent: props?.minRent as number | undefined,
      maxRent: props?.maxRent as number | undefined,
      suitableFor: props?.suitableFor as string[] | undefined,
      notes: props?.notes as string | undefined,
    },
    visible: dto.visible,
    locked: dto.locked,
    merchantId: dto.merchantId,
    rental: dto.rental ? {
      monthlyRent: (dto.rental.monthlyRent as number) ?? 0,
      startDate: dto.rental.startDate as string | undefined,
      endDate: dto.rental.endDate as string | undefined,
      status: (dto.rental.status as 'available' | 'reserved' | 'rented' | 'unavailable') ?? 'available',
    } : undefined,
  }
}

// ============================================================================
// API 方法
// ============================================================================

export const mallBuilderApi = {
  /**
   * 创建项目
   */
  createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    return http.post<ProjectResponse>('/mall-builder/projects', data)
  },

  /**
   * 获取项目列表
   */
  getProjectList(): Promise<ProjectListItem[]> {
    return http.get<ProjectListItem[]>('/mall-builder/projects')
  },

  /**
   * 获取项目详情
   */
  getProject(projectId: string): Promise<ProjectResponse> {
    return http.get<ProjectResponse>(`/mall-builder/projects/${projectId}`)
  },

  /**
   * 更新项目
   */
  updateProject(projectId: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
    return http.put<ProjectResponse>(`/mall-builder/projects/${projectId}`, data)
  },

  /**
   * 删除项目
   */
  deleteProject(projectId: string): Promise<void> {
    return http.delete<void>(`/mall-builder/projects/${projectId}`)
  },

  // ==================== 便捷方法 ====================

  /**
   * 保存项目（自动判断新建或更新）
   */
  async saveProject(project: MallProject, existingProjectId?: string): Promise<MallProject> {
    if (existingProjectId) {
      const response = await this.updateProject(existingProjectId, toUpdateRequest(project))
      return toMallProject(response)
    } else {
      const response = await this.createProject(toCreateRequest(project))
      return toMallProject(response)
    }
  },

  /**
   * 加载项目
   */
  async loadProject(projectId: string): Promise<MallProject> {
    const response = await this.getProject(projectId)
    return toMallProject(response)
  },
}

export default mallBuilderApi
