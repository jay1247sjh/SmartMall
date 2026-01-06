/**
 * ============================================================================
 * 商城建模器 API 模块 (mall-builder.api.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 提供商城建模器（Mall Builder）相关的 API 接口，包括项目的 CRUD 操作。
 * 这是 2D 建模器与后端数据持久化的桥梁。
 * 
 * 【业务背景】
 * 商城建模器是智慧商城系统的核心功能，允许管理员：
 * - 创建商城项目，定义商城轮廓
 * - 添加楼层，设置楼层高度和形状
 * - 划分区域，设置区域类型和属性
 * - 保存和加载项目，支持版本管理
 * 
 * 【数据转换】
 * 前端使用的数据结构（MallProject）与后端 API 的数据结构（DTO）不同，
 * 本模块提供了双向转换函数：
 * - toCreateRequest/toUpdateRequest: 前端 → 后端
 * - toMallProject: 后端 → 前端
 * 
 * 【与其他模块的关系】
 * - builder/types/mall-project.ts：前端数据类型定义
 * - builder/geometry/types.ts：几何图形类型定义
 * - stores/builder.store.ts：建模器状态管理
 * - views/BuilderView.vue：建模器视图
 * 
 * 【后端接口】
 * 对接 MallBuilderController，基础路径：/mall-builder
 * 
 * ============================================================================
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
// DTO 类型定义（与后端 API 对应）
// ============================================================================

/**
 * 顶点 DTO
 * 
 * 2D 平面上的一个点，用于定义轮廓和形状。
 */
export interface VertexDTO {
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
}

/**
 * 轮廓 DTO
 * 
 * 由多个顶点组成的多边形轮廓。
 */
export interface OutlineDTO {
  /** 顶点列表 */
  vertices: VertexDTO[]
  /** 是否闭合（默认 true） */
  isClosed?: boolean
}

/**
 * 设置 DTO
 * 
 * 项目的全局设置。
 */
export interface SettingsDTO {
  /** 网格大小（米） */
  gridSize?: number
  /** 是否吸附到网格 */
  snapToGrid?: boolean
  /** 默认楼层高度（米） */
  defaultFloorHeight?: number
  /** 单位（meters/feet） */
  unit?: string
  /** 显示设置 */
  display?: Record<string, unknown>
}

/**
 * 区域 DTO
 * 
 * 楼层内的一个区域，可以分配给商家。
 */
export interface AreaDTO {
  /** 区域 ID（更新时必填） */
  areaId?: string
  /** 区域名称 */
  name: string
  /** 区域类型（store/corridor/facility/entrance） */
  type: string
  /** 区域形状 */
  shape: OutlineDTO
  /** 区域颜色 */
  color?: string
  /** 区域属性（面积、周长等） */
  properties?: Record<string, unknown>
  /** 商家 ID（已分配时） */
  merchantId?: string
  /** 租赁信息 */
  rental?: Record<string, unknown>
  /** 是否可见 */
  visible?: boolean
  /** 是否锁定 */
  locked?: boolean
}

/**
 * 楼层 DTO
 * 
 * 商城的一个楼层。
 */
export interface FloorDTO {
  /** 楼层 ID（更新时必填） */
  floorId?: string
  /** 楼层名称 */
  name: string
  /** 楼层层级 */
  level: number
  /** 楼层高度（米） */
  height?: number
  /** 楼层形状（可选，不设置则继承商城轮廓） */
  shape?: OutlineDTO
  /** 是否继承商城轮廓 */
  inheritOutline?: boolean
  /** 楼层颜色 */
  color?: string
  /** 是否可见 */
  visible?: boolean
  /** 是否锁定 */
  locked?: boolean
  /** 排序顺序 */
  sortOrder?: number
  /** 区域列表 */
  areas?: AreaDTO[]
}

/**
 * 创建项目请求
 */
export interface CreateProjectRequest {
  /** 项目名称 */
  name: string
  /** 项目描述 */
  description?: string
  /** 商城轮廓 */
  outline: OutlineDTO
  /** 项目设置 */
  settings?: SettingsDTO
  /** 楼层列表 */
  floors?: FloorDTO[]
}

/**
 * 更新项目请求
 * 
 * 继承创建请求，增加版本号用于乐观锁。
 */
export interface UpdateProjectRequest extends CreateProjectRequest {
  /** 版本号（用于乐观锁，防止并发冲突） */
  version?: number
}

/**
 * 区域响应
 */
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

/**
 * 楼层响应
 */
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

/**
 * 项目详情响应
 */
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

/**
 * 项目列表项
 * 
 * 用于项目列表展示，不包含详细数据。
 */
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
// 数据转换函数
// ============================================================================

/**
 * 将前端 MallProject 转换为创建请求格式
 * 
 * @param project 前端项目数据
 * @returns 后端 API 请求格式
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
 * 
 * @param project 前端项目数据
 * @returns 后端 API 请求格式（包含版本号）
 */
export function toUpdateRequest(project: MallProject): UpdateProjectRequest {
  return {
    ...toCreateRequest(project),
    version: project.version,
  }
}

/**
 * 将后端响应转换为前端 MallProject 格式
 * 
 * @param response 后端 API 响应
 * @returns 前端项目数据
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

// ============================================================================
// 内部转换辅助函数
// ============================================================================

/**
 * 将 Polygon 转换为 OutlineDTO
 */
function toOutlineDTO(polygon: Polygon): OutlineDTO {
  return {
    vertices: polygon.vertices.map((v: { x: number; y: number }) => ({ x: v.x, y: v.y })),
    isClosed: polygon.isClosed,
  }
}

/**
 * 将 ProjectSettings 转换为 SettingsDTO
 */
function toSettingsDTO(settings: ProjectSettings): SettingsDTO {
  return {
    gridSize: settings.gridSize,
    snapToGrid: settings.snapToGrid,
    defaultFloorHeight: settings.defaultFloorHeight,
    unit: settings.unit,
    display: settings.display as unknown as Record<string, unknown>,
  }
}

/**
 * 将 FloorDefinition 转换为 FloorDTO
 */
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

/**
 * 将 AreaDefinition 转换为 AreaDTO
 */
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

/**
 * 将 OutlineDTO 转换为 Polygon
 */
function toPolygon(dto: OutlineDTO): Polygon {
  return {
    vertices: dto.vertices.map(v => ({ x: v.x, y: v.y })),
    isClosed: dto.isClosed ?? true,
  }
}

/**
 * 将 SettingsDTO 转换为 ProjectSettings
 */
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

/**
 * 将 FloorResponse 转换为 FloorDefinition
 */
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

/**
 * 将 AreaResponse 转换为 AreaDefinition
 */
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

/**
 * 商城建模器 API 对象
 * 
 * 提供项目的 CRUD 操作和便捷方法。
 * 
 * @example
 * ```typescript
 * import { mallBuilderApi } from '@/api'
 * 
 * // 获取项目列表
 * const projects = await mallBuilderApi.getProjectList()
 * 
 * // 加载项目
 * const project = await mallBuilderApi.loadProject('project-001')
 * 
 * // 保存项目（自动判断新建或更新）
 * const saved = await mallBuilderApi.saveProject(project, existingId)
 * ```
 */
export const mallBuilderApi = {
  /**
   * 创建项目
   * 
   * @param data 项目数据
   * @returns 创建的项目（包含服务器生成的 ID 和时间戳）
   */
  createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
    return http.post<ProjectResponse>('/mall-builder/projects', data)
  },

  /**
   * 获取项目列表
   * 
   * 返回当前用户可访问的所有项目的摘要信息。
   * 
   * @returns 项目列表
   */
  getProjectList(): Promise<ProjectListItem[]> {
    return http.get<ProjectListItem[]>('/mall-builder/projects')
  },

  /**
   * 获取项目详情
   * 
   * 返回项目的完整数据，包括所有楼层和区域。
   * 
   * @param projectId 项目 ID
   * @returns 项目详情
   */
  getProject(projectId: string): Promise<ProjectResponse> {
    return http.get<ProjectResponse>(`/mall-builder/projects/${projectId}`)
  },

  /**
   * 更新项目
   * 
   * 使用乐观锁机制，需要传入当前版本号。
   * 如果版本号不匹配，会返回冲突错误。
   * 
   * @param projectId 项目 ID
   * @param data 更新数据（包含版本号）
   * @returns 更新后的项目
   */
  updateProject(projectId: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
    return http.put<ProjectResponse>(`/mall-builder/projects/${projectId}`, data)
  },

  /**
   * 删除项目
   * 
   * ⚠️ 删除操作不可恢复，会同时删除所有楼层和区域数据。
   * 
   * @param projectId 项目 ID
   */
  deleteProject(projectId: string): Promise<void> {
    return http.delete<void>(`/mall-builder/projects/${projectId}`)
  },

  // ==================== 便捷方法 ====================

  /**
   * 保存项目（自动判断新建或更新）
   * 
   * 这是一个便捷方法，根据是否提供 existingProjectId 自动选择：
   * - 有 existingProjectId：调用 updateProject
   * - 无 existingProjectId：调用 createProject
   * 
   * @param project 前端项目数据
   * @param existingProjectId 已存在的项目 ID（可选）
   * @returns 保存后的项目（前端格式）
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
   * 
   * 获取项目详情并转换为前端格式。
   * 
   * @param projectId 项目 ID
   * @returns 项目数据（前端格式）
   */
  async loadProject(projectId: string): Promise<MallProject> {
    const response = await this.getProject(projectId)
    return toMallProject(response)
  },
}

export default mallBuilderApi
