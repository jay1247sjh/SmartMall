import type { AreaDefinition } from '../types'
import type { Point2D, Polygon } from '../geometry/types'
import type { VerticalConnection } from './types'
import { getCentroid, isPointInside, isPointOnEdge } from '../geometry/polygon'
import { findBestVerticalConnectionAtPosition, resolvePassageAnchors } from './vertical-passage'
import { normalizeVerticalPassageProfile } from './vertical'

const DEFAULT_SWITCH_PROGRESS_THRESHOLD = 0.96
const DEFAULT_LANDING_PROGRESS = 0.06
const STAIRS_GROUND_CLEARANCE = 0.06
const ESCALATOR_GROUND_CLEARANCE = 0.04
const EPSILON = 1e-6

export type VerticalMovementIntent = 'up' | 'down' | 'none'

export interface VerticalGroundResolution {
  y: number
  progress: number
  fromFloorId: string
  targetFloorId: string
  targetFloorY: number
  targetLanding2D: Point2D
  connectionId: string
  areaId: string
  shouldSwitchFloor: boolean
}

export interface ResolveVerticalGroundHeightParams {
  currentFloorId: string
  position2D: Point2D
  movementIntent?: VerticalMovementIntent
  movementVector2D?: Point2D | null
  switchProgressThreshold?: number
  connections: VerticalConnection[]
  areasById: Map<string, AreaDefinition>
  floorLevelById: Map<string, number>
  floorYById: Map<string, number>
  expectedConnectionId?: string | null
  expectedAreaId?: string | null
}

function normalizeAngleDeg(value: number): number {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function normalizeVector2D(vector: Point2D): Point2D | null {
  const len = Math.hypot(vector.x, vector.y)
  if (len <= EPSILON) return null
  return {
    x: vector.x / len,
    y: vector.y / len,
  }
}

function projectProgressOnSegment(start: Point2D, end: Point2D, point: Point2D): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lenSq = dx * dx + dy * dy
  if (lenSq <= EPSILON)
    return 0

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq
  return clamp01(t)
}

function estimateAreaAscendAngleDeg(area: AreaDefinition): number {
  const vertices = area.shape.vertices
  if (!vertices || vertices.length < 2)
    return 0

  let longest = -1
  let bestFrom = vertices[0]!
  let bestTo = vertices[1]!
  for (let i = 0; i < vertices.length; i++) {
    const from = vertices[i]!
    const to = vertices[(i + 1) % vertices.length]!
    const length = Math.hypot(to.x - from.x, to.y - from.y)
    if (length > longest) {
      longest = length
      bestFrom = from
      bestTo = to
    }
  }

  return normalizeAngleDeg((Math.atan2(bestTo.y - bestFrom.y, bestTo.x - bestFrom.x) * 180) / Math.PI)
}

function resolveTargetFloorId(params: {
  connection: VerticalConnection
  currentFloorId: string
  floorLevelById: Map<string, number>
  movementIntent: VerticalMovementIntent
}): string | null {
  const {
    connection,
    currentFloorId,
    floorLevelById,
    movementIntent,
  } = params

  const sorted = connection.connectedFloors
    .map((floorId) => ({ floorId, level: floorLevelById.get(floorId) ?? 0 }))
    .sort((a, b) => a.level - b.level)

  const currentIndex = sorted.findIndex(item => item.floorId === currentFloorId)
  if (currentIndex < 0)
    return null

  if (movementIntent === 'up') {
    return sorted[currentIndex + 1]?.floorId ?? sorted[currentIndex - 1]?.floorId ?? null
  }
  if (movementIntent === 'down') {
    return sorted[currentIndex - 1]?.floorId ?? sorted[currentIndex + 1]?.floorId ?? null
  }

  return sorted[currentIndex + 1]?.floorId ?? sorted[currentIndex - 1]?.floorId ?? null
}

function applyLanePadding(
  anchor: Point2D,
  center: Point2D,
  lanePadding: number,
): Point2D {
  return {
    x: anchor.x + (center.x - anchor.x) * lanePadding,
    y: anchor.y + (center.y - anchor.y) * lanePadding,
  }
}

/**
 * 根据角色 2D 位置解析楼梯/扶梯坡面高度。
 */
export function resolveVerticalGroundHeight(
  params: ResolveVerticalGroundHeightParams,
): VerticalGroundResolution | null {
  const {
    currentFloorId,
    position2D,
    movementIntent = 'none',
    movementVector2D,
    switchProgressThreshold = DEFAULT_SWITCH_PROGRESS_THRESHOLD,
    connections,
    areasById,
    floorLevelById,
    floorYById,
    expectedConnectionId,
    expectedAreaId,
  } = params

  const slopeConnections = connections.filter(item => (
    (item.type === 'stairs' || item.type === 'escalator')
    && item.connectedFloors.includes(currentFloorId)
  ))
  if (slopeConnections.length === 0)
    return null

  const matched = findBestVerticalConnectionAtPosition({
    connections: slopeConnections,
    currentFloorId,
    position2D,
    areasById,
    expectedConnectionId,
    expectedAreaId,
  })
  if (!matched)
    return null

  const isInside = isPointInside(position2D, matched.area.shape) || isPointOnEdge(position2D, matched.area.shape)
  if (!isInside)
    return null

  const profile = normalizeVerticalPassageProfile(
    matched.connection.passageProfile,
    estimateAreaAscendAngleDeg(matched.area),
  )
  const anchors = resolvePassageAnchors(matched.area.shape, profile.ascendAngleDeg)
  if (!anchors)
    return null

  const paddedEntry = applyLanePadding(anchors.entry2D, anchors.center2D, profile.lanePadding)
  const paddedExit = applyLanePadding(anchors.exit2D, anchors.center2D, profile.lanePadding)
  const axis = normalizeVector2D({
    x: paddedExit.x - paddedEntry.x,
    y: paddedExit.y - paddedEntry.y,
  })
  let effectiveMovementIntent: VerticalMovementIntent = movementIntent
  const motion = movementVector2D ? normalizeVector2D(movementVector2D) : null
  if (axis && motion) {
    const dot = motion.x * axis.x + motion.y * axis.y
    if (Math.abs(dot) > 0.05) {
      effectiveMovementIntent = dot >= 0 ? 'up' : 'down'
    }
  }

  const targetFloorId = resolveTargetFloorId({
    connection: matched.connection,
    currentFloorId,
    floorLevelById,
    movementIntent: effectiveMovementIntent,
  })
  if (!targetFloorId)
    return null

  const fromFloorY = floorYById.get(currentFloorId)
  const toFloorY = floorYById.get(targetFloorId)
  if (fromFloorY === undefined || toFloorY === undefined)
    return null
  if (!Number.isFinite(fromFloorY) || !Number.isFinite(toFloorY))
    return null
  const fromY = fromFloorY
  const toY = toFloorY

  const fromLevel = floorLevelById.get(currentFloorId) ?? 0
  const toLevel = floorLevelById.get(targetFloorId) ?? 0
  const ascending = toLevel >= fromLevel
  const start = ascending ? paddedEntry : paddedExit
  const end = ascending ? paddedExit : paddedEntry

  const progress = projectProgressOnSegment(start, end, position2D)
  const easedProgress = clamp01((progress - DEFAULT_LANDING_PROGRESS) / (1 - DEFAULT_LANDING_PROGRESS * 2))
  const baseY = fromY + (toY - fromY) * easedProgress
  const groundClearance = matched.connection.type === 'stairs'
    ? STAIRS_GROUND_CLEARANCE
    : ESCALATOR_GROUND_CLEARANCE
  const y = baseY + groundClearance

  return {
    y,
    progress,
    fromFloorId: currentFloorId,
    targetFloorId,
    targetFloorY: toY,
    targetLanding2D: end,
    connectionId: matched.connection.id,
    areaId: matched.area.id,
    shouldSwitchFloor: progress >= clamp01(switchProgressThreshold),
  }
}

/**
 * 通过中心缩放获得开洞多边形（用于楼板/天花板开口）。
 */
export function createInsetOpeningPolygon(
  polygon: Polygon,
  lanePadding: number = 0.12,
): Polygon | null {
  if (!polygon.vertices || polygon.vertices.length < 3)
    return null

  const center = getCentroid(polygon)
  const scale = Math.max(0.45, Math.min(0.92, 1 - (0.08 + lanePadding * 0.45)))
  const vertices = polygon.vertices.map((vertex) => {
    const next = {
      x: center.x + (vertex.x - center.x) * scale,
      y: center.y + (vertex.y - center.y) * scale,
    }
    return next
  })

  const valid = vertices.every(vertex => isPointInside(vertex, polygon) || isPointOnEdge(vertex, polygon))
  if (!valid)
    return null

  return {
    vertices,
    isClosed: polygon.isClosed,
  }
}
