import { describe, expect, it } from 'vitest'
import {
  advanceTraversalProgress,
  computeTraversalDistance,
  interpolateTraversalPosition,
} from './vertical-traversal'

describe('vertical-traversal utils', () => {
  it('computes distance in 3d', () => {
    const distance = computeTraversalDistance(
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 4, z: 12 },
    )
    expect(distance).toBeCloseTo(13, 6)
  })

  it('advances progress with speed and delta', () => {
    const next = advanceTraversalProgress({
      progress: 0.2,
      speed: 2,
      deltaSeconds: 0.5,
      totalDistance: 4,
    })
    expect(next).toBeCloseTo(0.45, 6)
  })

  it('clamps progress to 1 and interpolates end point', () => {
    const progress = advanceTraversalProgress({
      progress: 0.95,
      speed: 3,
      deltaSeconds: 1,
      totalDistance: 2,
    })
    expect(progress).toBe(1)

    const point = interpolateTraversalPosition({
      start: { x: 1, y: 2, z: 3 },
      end: { x: 5, y: 6, z: 7 },
      progress,
    })
    expect(point).toEqual({ x: 5, y: 6, z: 7 })
  })
})
