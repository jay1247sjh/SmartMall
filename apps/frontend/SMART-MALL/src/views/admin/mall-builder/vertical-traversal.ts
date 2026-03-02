export interface TraversalPoint3D {
  x: number
  y: number
  z: number
}

export function computeTraversalDistance(start: TraversalPoint3D, end: TraversalPoint3D): number {
  return Math.sqrt(
    (end.x - start.x) ** 2
    + (end.y - start.y) ** 2
    + (end.z - start.z) ** 2,
  )
}

export function advanceTraversalProgress(params: {
  progress: number
  speed: number
  deltaSeconds: number
  totalDistance: number
}): number {
  const {
    progress,
    speed,
    deltaSeconds,
    totalDistance,
  } = params

  if (!Number.isFinite(totalDistance) || totalDistance <= 0) {
    return progress
  }
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return progress
  }
  if (!Number.isFinite(speed) || speed <= 0) {
    return progress
  }

  return Math.min(1, progress + (speed * deltaSeconds) / totalDistance)
}

export function interpolateTraversalPosition(params: {
  start: TraversalPoint3D
  end: TraversalPoint3D
  progress: number
}): TraversalPoint3D {
  const {
    start,
    end,
    progress,
  } = params
  const ratio = Math.max(0, Math.min(1, progress))
  return {
    x: start.x + (end.x - start.x) * ratio,
    y: start.y + (end.y - start.y) * ratio,
    z: start.z + (end.z - start.z) * ratio,
  }
}
