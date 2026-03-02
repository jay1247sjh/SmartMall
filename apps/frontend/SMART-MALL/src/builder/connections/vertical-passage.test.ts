import type { AreaDefinition } from '../types'
import type { VerticalConnection } from './types'
import { AreaType } from '@smart-mall/shared-types'
import { describe, expect, it } from 'vitest'
import {
  buildTraversalPath3D,
  findBestVerticalConnectionAtPosition,
  resolvePassageAnchors,
} from './vertical-passage'

function createArea(id: string, type: AreaDefinition['type'], vertices: Array<{ x: number, y: number }>): AreaDefinition {
  return {
    id,
    name: id,
    type,
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

function createConnection(id: string, areaId: string, floors: string[]): VerticalConnection {
  return {
    id,
    areaId,
    type: 'stairs',
    connectedFloors: floors,
    createdAt: Date.now(),
    passageProfile: {
      ascendAngleDeg: 0,
      lanePadding: 0.12,
    },
  }
}

describe('vertical-passage geometry', () => {
  it('resolves anchors by ascend angle on polygon', () => {
    const anchors = resolvePassageAnchors(
      {
        vertices: [
          { x: -2, y: -1 },
          { x: 2, y: -1 },
          { x: 2, y: 1 },
          { x: -2, y: 1 },
        ],
        isClosed: true,
      },
      0,
    )

    expect(anchors).not.toBeNull()
    expect(anchors!.entry2D.x).toBeCloseTo(-2, 4)
    expect(anchors!.exit2D.x).toBeCloseTo(2, 4)
    expect(anchors!.entry2D.y).toBeCloseTo(0, 4)
    expect(anchors!.exit2D.y).toBeCloseTo(0, 4)
  })

  it('builds 3D traversal path with floor y and planar conversion', () => {
    const path = buildTraversalPath3D(0, 4, { x: 1, y: 2 }, { x: 5, y: 6 })
    expect(path.start3D).toEqual({ x: 1, y: 0, z: -2 })
    expect(path.end3D).toEqual({ x: 5, y: 4, z: -6 })
    expect(path.length).toBeGreaterThan(0)
    expect(path.slope).toBeGreaterThan(0)
  })

  it('matches vertical connection by expected id first', () => {
    const stairsA = createArea('stairs-a', AreaType.STAIRS, [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 2 },
      { x: 0, y: 2 },
    ])
    const stairsB = createArea('stairs-b', AreaType.STAIRS, [
      { x: 10, y: 0 },
      { x: 14, y: 0 },
      { x: 14, y: 2 },
      { x: 10, y: 2 },
    ])

    const result = findBestVerticalConnectionAtPosition({
      connections: [
        createConnection('c-a', stairsA.id, ['f1', 'f2']),
        createConnection('c-b', stairsB.id, ['f1', 'f2']),
      ],
      currentFloorId: 'f1',
      position2D: { x: 1, y: 1 },
      areasById: new Map([
        [stairsA.id, stairsA],
        [stairsB.id, stairsB],
      ]),
      expectedConnectionId: 'c-b',
    })

    expect(result).not.toBeNull()
    expect(result!.connection.id).toBe('c-b')
    expect(result!.area.id).toBe(stairsB.id)
  })
})
