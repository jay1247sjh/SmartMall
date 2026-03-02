import type { Point2D, Point3D, Polygon } from '../geometry/types'
import type { AreaDefinition } from '../types'
import type { VerticalConnection } from './types'
import { getBoundingBox, getCentroid, isPointInside, isPointOnEdge } from '../geometry/polygon'
import { isVerticalConnectionAreaType } from './vertical'

const EPSILON = 1e-6

interface PassageAnchors {
  entry2D: Point2D
  exit2D: Point2D
  center2D: Point2D
}

interface TraversalPath3D {
  start3D: Point3D
  end3D: Point3D
  length: number
  slope: number
}

interface FindBestVerticalConnectionAtPositionParams {
  connections: VerticalConnection[]
  currentFloorId: string
  position2D: Point2D
  areasById: Map<string, AreaDefinition>
  expectedConnectionId?: string | null
  expectedAreaId?: string | null
}

interface VerticalConnectionAreaMatch {
  connection: VerticalConnection
  area: AreaDefinition
}

function normalizeDirection(angleDeg: number): Point2D {
  const rad = (angleDeg * Math.PI) / 180
  const x = Math.cos(rad)
  const y = Math.sin(rad)
  const len = Math.hypot(x, y)
  if (len <= EPSILON) {
    return { x: 1, y: 0 }
  }
  return { x: x / len, y: y / len }
}

function isInsideOrOnEdge(point: Point2D, polygon: Polygon): boolean {
  return isPointInside(point, polygon) || isPointOnEdge(point, polygon)
}

function resolveInternalReferencePoint(polygon: Polygon): Point2D {
  const centroid = getCentroid(polygon)
  if (isInsideOrOnEdge(centroid, polygon)) {
    return centroid
  }

  const box = getBoundingBox(polygon)
  const center = {
    x: (box.minX + box.maxX) / 2,
    y: (box.minY + box.maxY) / 2,
  }
  if (isInsideOrOnEdge(center, polygon)) {
    return center
  }

  if (polygon.vertices.length === 0) {
    return centroid
  }

  const avg = polygon.vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 },
  )
  const average = { x: avg.x / polygon.vertices.length, y: avg.y / polygon.vertices.length }
  if (isInsideOrOnEdge(average, polygon)) {
    return average
  }

  for (const v of polygon.vertices) {
    const candidate = {
      x: v.x + (centroid.x - v.x) * 0.2,
      y: v.y + (centroid.y - v.y) * 0.2,
    }
    if (isInsideOrOnEdge(candidate, polygon)) {
      return candidate
    }
  }

  return centroid
}

function intersectRayAndSegment(
  origin: Point2D,
  direction: Point2D,
  a: Point2D,
  b: Point2D,
): Point2D | null {
  const sx = b.x - a.x
  const sy = b.y - a.y

  const cross = direction.x * sy - direction.y * sx
  if (Math.abs(cross) <= EPSILON) {
    return null
  }

  const ax = a.x - origin.x
  const ay = a.y - origin.y
  const t = (ax * sy - ay * sx) / cross
  const u = (ax * direction.y - ay * direction.x) / cross

  if (t < 0 || u < -EPSILON || u > 1 + EPSILON) {
    return null
  }

  return {
    x: origin.x + direction.x * t,
    y: origin.y + direction.y * t,
  }
}

function castRayToBoundary(origin: Point2D, direction: Point2D, polygon: Polygon): Point2D | null {
  if (!polygon.vertices.length)
    return null

  let best: Point2D | null = null
  let bestDist = Number.POSITIVE_INFINITY
  const n = polygon.vertices.length
  for (let i = 0; i < n; i++) {
    const a = polygon.vertices[i]!
    const b = polygon.vertices[(i + 1) % n]!
    const hit = intersectRayAndSegment(origin, direction, a, b)
    if (!hit)
      continue
    const dist = Math.hypot(hit.x - origin.x, hit.y - origin.y)
    if (dist < bestDist) {
      best = hit
      bestDist = dist
    }
  }
  return best
}

function resolveAnchorsByDirection(
  polygon: Polygon,
  center2D: Point2D,
  direction: Point2D,
): PassageAnchors | null {
  const exit2D = castRayToBoundary(center2D, direction, polygon)
  const entry2D = castRayToBoundary(center2D, { x: -direction.x, y: -direction.y }, polygon)
  if (!entry2D || !exit2D)
    return null
  if (Math.hypot(exit2D.x - entry2D.x, exit2D.y - entry2D.y) <= EPSILON)
    return null
  return { entry2D, exit2D, center2D }
}

function resolveFallbackDirectionByLongestAxis(polygon: Polygon): Point2D {
  const vertices = polygon.vertices
  if (vertices.length < 2) {
    return { x: 1, y: 0 }
  }

  let maxDist = -1
  let bestA = vertices[0]!
  let bestB = vertices[1]!
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const a = vertices[i]!
      const b = vertices[j]!
      const d = Math.hypot(b.x - a.x, b.y - a.y)
      if (d > maxDist) {
        maxDist = d
        bestA = a
        bestB = b
      }
    }
  }

  const dx = bestB.x - bestA.x
  const dy = bestB.y - bestA.y
  const len = Math.hypot(dx, dy)
  if (len <= EPSILON) {
    const box = getBoundingBox(polygon)
    return (box.maxX - box.minX) >= (box.maxY - box.minY)
      ? { x: 1, y: 0 }
      : { x: 0, y: 1 }
  }

  return { x: dx / len, y: dy / len }
}

export function resolvePassageAnchors(
  areaPolygon: Polygon,
  ascendAngleDeg: number,
): PassageAnchors | null {
  if (!areaPolygon.vertices || areaPolygon.vertices.length < 3) {
    return null
  }

  const center2D = resolveInternalReferencePoint(areaPolygon)
  const preferredDirection = normalizeDirection(ascendAngleDeg)
  const preferred = resolveAnchorsByDirection(areaPolygon, center2D, preferredDirection)
  if (preferred) {
    return preferred
  }

  const fallbackDirection = resolveFallbackDirectionByLongestAxis(areaPolygon)
  const fallback = resolveAnchorsByDirection(areaPolygon, center2D, fallbackDirection)
  if (fallback) {
    return fallback
  }

  return null
}

export function buildTraversalPath3D(
  fromFloorY: number,
  toFloorY: number,
  entry2D: Point2D,
  exit2D: Point2D,
): TraversalPath3D {
  const start3D: Point3D = {
    x: entry2D.x,
    y: fromFloorY,
    z: -entry2D.y,
  }
  const end3D: Point3D = {
    x: exit2D.x,
    y: toFloorY,
    z: -exit2D.y,
  }

  const dx = end3D.x - start3D.x
  const dy = end3D.y - start3D.y
  const dz = end3D.z - start3D.z
  const horizontal = Math.hypot(dx, dz)
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz)

  return {
    start3D,
    end3D,
    length,
    slope: horizontal <= EPSILON ? Number.POSITIVE_INFINITY : Math.abs(dy) / horizontal,
  }
}

export function findBestVerticalConnectionAtPosition(
  params: FindBestVerticalConnectionAtPositionParams,
): VerticalConnectionAreaMatch | null {
  const {
    connections,
    currentFloorId,
    position2D,
    areasById,
    expectedConnectionId,
    expectedAreaId,
  } = params

  const candidates: VerticalConnectionAreaMatch[] = []
  for (const connection of connections) {
    if (!connection.connectedFloors.includes(currentFloorId))
      continue
    const area = areasById.get(connection.areaId)
    if (!area || !isVerticalConnectionAreaType(area.type))
      continue
    candidates.push({ connection, area })
  }

  if (candidates.length === 0) {
    return null
  }

  const byConnectionId = expectedConnectionId
    ? candidates.find(item => item.connection.id === expectedConnectionId)
    : null
  if (byConnectionId)
    return byConnectionId

  const byAreaId = expectedAreaId
    ? candidates.find(item => item.connection.areaId === expectedAreaId)
    : null
  if (byAreaId)
    return byAreaId

  const insideCandidates = candidates.filter(item => isInsideOrOnEdge(position2D, item.area.shape))
  const pool = insideCandidates.length > 0 ? insideCandidates : candidates

  let best = pool[0]!
  let bestDistance = Number.POSITIVE_INFINITY
  for (const item of pool) {
    const center = getCentroid(item.area.shape)
    const d = Math.hypot(center.x - position2D.x, center.y - position2D.y)
    if (d < bestDistance) {
      best = item
      bestDistance = d
    }
  }
  return best
}

export type {
  FindBestVerticalConnectionAtPositionParams,
  PassageAnchors,
  TraversalPath3D,
  VerticalConnectionAreaMatch,
}
