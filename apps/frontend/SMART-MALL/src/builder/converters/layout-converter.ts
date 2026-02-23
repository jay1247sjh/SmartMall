/**
 * 布局数据转换器
 *
 * 将 Intelligence Service 返回的 MallLayoutData 转换为建模器使用的 MallProject 格式。
 */

import type { Point2D, Polygon } from '../geometry/types'
import { calculateArea, calculatePerimeter } from '../geometry/polygon'
import type {
  MallProject,
  FloorDefinition,
  AreaDefinition,
  AreaProperties,
  ProjectSettings,
  DisplaySettings,
} from '../types/mall-project.types'
import { AreaType } from '@smart-mall/shared-types'

// ============================================================================
// MallLayoutData 类型定义（与 Python Pydantic 模型对应）
// ============================================================================

export interface Vertex {
  x: number
  y: number
}

export interface Outline {
  vertices: Vertex[]
  isClosed: boolean
}

export interface AreaData {
  name: string
  type: string
  shape: Outline
  color: string
  properties?: Record<string, unknown>
}

export interface FloorData {
  name: string
  level: number
  height: number
  inheritOutline: boolean
  areas: AreaData[]
}

export interface MallLayoutData {
  name: string
  description: string
  outline: Outline
  floors: FloorData[]
  settings: Record<string, unknown>
}

// ============================================================================
// 类型映射
// ============================================================================

const AREA_TYPE_MAP: Record<string, AreaType> = {
  retail: AreaType.RETAIL,
  food: AreaType.FOOD,
  service: AreaType.SERVICE,
  anchor: AreaType.ANCHOR,
  common: AreaType.COMMON,
  corridor: AreaType.CORRIDOR,
  elevator: AreaType.ELEVATOR,
  escalator: AreaType.ESCALATOR,
  stairs: AreaType.STAIRS,
  restroom: AreaType.RESTROOM,
  storage: AreaType.STORAGE,
  office: AreaType.OFFICE,
  parking: AreaType.PARKING,
  other: AreaType.OTHER,
  // 兼容旧的 type 值
  store: AreaType.RETAIL,
  facility: AreaType.COMMON,
  entrance: AreaType.COMMON,
}

// ============================================================================
// 转换函数
// ============================================================================

function mapAreaType(typeStr: string): AreaType {
  return AREA_TYPE_MAP[typeStr.toLowerCase()] ?? AreaType.OTHER
}

function convertOutline(outline: Outline): Polygon {
  return {
    vertices: outline.vertices.map(v => ({ x: v.x, y: v.y })),
    isClosed: outline.isClosed ?? true,
  }
}

function convertArea(area: AreaData): AreaDefinition {
  const shape = convertOutline(area.shape)
  const areaValue = calculateArea(shape)
  const perimeter = calculatePerimeter(shape)

  const properties: AreaProperties = {
    area: Math.round(areaValue * 100) / 100,
    perimeter: Math.round(perimeter * 100) / 100,
  }

  return {
    id: crypto.randomUUID(),
    name: area.name,
    type: mapAreaType(area.type),
    shape,
    color: area.color,
    properties,
    visible: true,
    locked: false,
  }
}

function convertFloor(floor: FloorData): FloorDefinition {
  return {
    id: crypto.randomUUID(),
    name: floor.name,
    level: floor.level,
    height: floor.height ?? 4.0,
    inheritOutline: floor.inheritOutline ?? true,
    areas: floor.areas.map(convertArea),
    visible: true,
    locked: false,
  }
}

function convertSettings(raw: Record<string, unknown>): ProjectSettings {
  const display = (raw.display as Record<string, unknown>) ?? {}

  const defaultDisplay: DisplaySettings = {
    showGrid: true,
    showRuler: true,
    showAreaLabels: true,
    backgroundColor: '#0a0a0a',
    gridColor: '#1a1a1a',
  }

  return {
    gridSize: (raw.gridSize as number) ?? 1,
    snapToGrid: (raw.snapToGrid as boolean) ?? true,
    defaultFloorHeight: (raw.defaultFloorHeight as number) ?? 4,
    unit: (raw.unit as 'meters' | 'feet') ?? 'meters',
    display: {
      ...defaultDisplay,
      showGrid: (display.showGrid as boolean) ?? defaultDisplay.showGrid,
      showRuler: (display.showRuler as boolean) ?? defaultDisplay.showRuler,
      showAreaLabels: (display.showAreaLabels as boolean) ?? defaultDisplay.showAreaLabels,
    },
  }
}

/**
 * 将 MallLayoutData 转换为 MallProject
 */
export function convertMallLayoutToProject(layout: MallLayoutData): MallProject {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    name: layout.name,
    description: layout.description,
    createdAt: now,
    updatedAt: now,
    version: 1,
    outline: convertOutline(layout.outline),
    floors: layout.floors.map(convertFloor),
    settings: convertSettings(layout.settings ?? {}),
  }
}
