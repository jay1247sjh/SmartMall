import { AreaType } from '@smart-mall/shared-types'
import { describe, expect, it } from 'vitest'
import type { AreaDefinition } from '../types'
import type { VerticalConnection } from './types'
import {
  createInsetOpeningPolygon,
  resolveVerticalGroundHeight,
} from './vertical-ground'

function createArea(id: string, vertices: Array<{ x: number, y: number }>): AreaDefinition {
  return {
    id,
    name: id,
    type: AreaType.STAIRS,
    shape: {
      vertices,
      isClosed: true,
    },
    color: '#22c55e',
    properties: {
      area: 10,
      perimeter: 10,
    },
    visible: true,
    locked: false,
  }
}

function createConnection(areaId: string): VerticalConnection {
  return {
    id: 'vc-stairs',
    areaId,
    type: 'stairs',
    connectedFloors: ['f1', 'f2'],
    passageProfile: {
      ascendAngleDeg: 90,
      lanePadding: 0.12,
    },
    createdAt: Date.now(),
  }
}

describe('vertical-ground', () => {
  it('resolves y by progress along vertical passage', () => {
    const area = createArea('stairs-a', [
      { x: -1.5, y: -4 },
      { x: 1.5, y: -4 },
      { x: 1.5, y: 4 },
      { x: -1.5, y: 4 },
    ])
    const result = resolveVerticalGroundHeight({
      currentFloorId: 'f1',
      position2D: { x: 0, y: 3 },
      movementIntent: 'up',
      connections: [createConnection(area.id)],
      areasById: new Map([[area.id, area]]),
      floorLevelById: new Map([
        ['f1', 1],
        ['f2', 2],
      ]),
      floorYById: new Map([
        ['f1', 0],
        ['f2', 4],
      ]),
    })

    expect(result).not.toBeNull()
    expect(result!.targetFloorId).toBe('f2')
    expect(result!.y).toBeGreaterThan(2)
    expect(result!.y).toBeLessThan(4.1)
  })

  it('returns null when position is outside connection area', () => {
    const area = createArea('stairs-a', [
      { x: -1.5, y: -4 },
      { x: 1.5, y: -4 },
      { x: 1.5, y: 4 },
      { x: -1.5, y: 4 },
    ])
    const result = resolveVerticalGroundHeight({
      currentFloorId: 'f1',
      position2D: { x: 8, y: 8 },
      movementIntent: 'up',
      connections: [createConnection(area.id)],
      areasById: new Map([[area.id, area]]),
      floorLevelById: new Map([
        ['f1', 1],
        ['f2', 2],
      ]),
      floorYById: new Map([
        ['f1', 0],
        ['f2', 4],
      ]),
    })

    expect(result).toBeNull()
  })

  it('builds inset opening polygon inside source polygon', () => {
    const polygon = {
      vertices: [
        { x: -3, y: -2 },
        { x: 3, y: -2 },
        { x: 3, y: 2 },
        { x: -3, y: 2 },
      ],
      isClosed: true,
    }
    const inset = createInsetOpeningPolygon(polygon, 0.15)

    expect(inset).not.toBeNull()
    expect(inset!.vertices.length).toBe(4)
    expect(Math.abs(inset!.vertices[0]!.x)).toBeLessThan(3)
  })
})

