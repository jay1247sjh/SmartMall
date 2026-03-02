import { describe, expect, it } from 'vitest'
import { polygonToShapeWithHoles } from './polygon-to-three'
import { createInsetOpeningPolygon } from '../connections/vertical-ground'

const OUTER = {
  vertices: [
    { x: -10, y: -8 },
    { x: 10, y: -8 },
    { x: 10, y: 8 },
    { x: -10, y: 8 },
  ],
  isClosed: true,
}

const HOLE = {
  vertices: [
    { x: -2, y: -2 },
    { x: 2, y: -2 },
    { x: 2, y: 2 },
    { x: -2, y: 2 },
  ],
  isClosed: true,
}

describe('roaming openings', () => {
  it('builds shape with holes', () => {
    const shape = polygonToShapeWithHoles(OUTER, [HOLE])
    expect(shape.holes.length).toBe(1)
  })

  it('creates inset opening polygon by lane padding', () => {
    const opening = createInsetOpeningPolygon(OUTER, 0.2)
    expect(opening).not.toBeNull()
    expect(opening!.vertices.length).toBe(OUTER.vertices.length)
  })

  it('keeps inset opening vertices inside outer polygon', () => {
    const opening = createInsetOpeningPolygon(OUTER, 0.2)
    expect(opening).not.toBeNull()
    const maxOuterX = Math.max(...OUTER.vertices.map(v => Math.abs(v.x)))
    const maxOuterY = Math.max(...OUTER.vertices.map(v => Math.abs(v.y)))
    const maxOpeningX = Math.max(...opening!.vertices.map(v => Math.abs(v.x)))
    const maxOpeningY = Math.max(...opening!.vertices.map(v => Math.abs(v.y)))
    expect(maxOpeningX).toBeLessThan(maxOuterX)
    expect(maxOpeningY).toBeLessThan(maxOuterY)
  })
})
