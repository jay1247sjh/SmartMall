/**
 * 门放置工具 Composable
 *
 * 处理在区域墙壁上放置门的交互逻辑。
 * 用户选择 place-door 工具后，点击选中区域的边即可在该位置放置一扇门。
 */
import { ref } from 'vue'
import * as THREE from 'three'
import type { MallBuilderEngine } from '@/engine/mall-builder/MallBuilderEngine'
import type { AreaDefinition, DoorDefinition } from '@/builder'
import { generateId, distance, getEdges } from '@/builder'

/** 默认门宽（米） */
const DEFAULT_DOOR_WIDTH = 3

/** 默认门高（米） */
const DEFAULT_DOOR_HEIGHT = 3.2

export function useDoorPlacement(
  engine: () => MallBuilderEngine | null,
) {
  const hoveredEdgeIndex = ref<number | null>(null)
  const hoveredPosition = ref<number>(0)
  const hoveredDoorId = ref<string | null>(null)

  /**
   * 找到离点击位置最近的区域边，返回边索引和在边上的归一化位置 (0~1)
   */
  function findNearestEdge(
    worldPoint: { x: number; y: number },
    area: AreaDefinition,
    maxDistance: number = 2
  ): { wallIndex: number; position: number } | null {
    const edges = getEdges(area.shape)
    let bestDist = maxDistance
    let bestIndex = -1
    let bestT = 0

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i]!
      const result = pointToSegmentProjection(worldPoint, edge.start, edge.end)
      if (result.distance < bestDist) {
        bestDist = result.distance
        bestIndex = i
        bestT = result.t
      }
    }

    if (bestIndex < 0) return null
    // 限制 t 在 [0.05, 0.95] 范围内，避免门贴在墙角
    const clampedT = Math.max(0.05, Math.min(0.95, bestT))
    return { wallIndex: bestIndex, position: clampedT }
  }

  /**
   * 点到线段的投影，返回投影参数 t (0~1) 和距离
   */
  function pointToSegmentProjection(
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): { t: number; distance: number } {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    if (lenSq < 0.0001) return { t: 0, distance: distance(p, a) }

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))

    const projX = a.x + t * dx
    const projY = a.y + t * dy
    const dist = Math.sqrt((p.x - projX) ** 2 + (p.y - projY) ** 2)
    return { t, distance: dist }
  }

  /**
   * 处理门放置点击
   */
  function handleDoorClick(
    e: MouseEvent,
    selectedArea: AreaDefinition | null,
    onDoorPlaced: () => void,
  ) {
    if (!selectedArea) return

    const eng = engine()
    if (!eng) return

    const worldPoint = eng.getGroundPosition(e)
    if (!worldPoint) return

    const hit = findNearestEdge(worldPoint, selectedArea)
    if (!hit) return

    // 检查该位置是否与已有门重叠
    const existingDoors = selectedArea.doors ?? []
    const edge = getEdges(selectedArea.shape)[hit.wallIndex]
    if (!edge) return
    const edgeLen = distance(edge.start, edge.end)
    const newCenter = hit.position * edgeLen
    const halfWidth = DEFAULT_DOOR_WIDTH / 2

    for (const door of existingDoors) {
      if (door.wallIndex !== hit.wallIndex) continue
      const existCenter = door.position * edgeLen
      const existHalf = door.width / 2
      if (Math.abs(newCenter - existCenter) < halfWidth + existHalf) {
        // 重叠，不放置
        return
      }
    }

    // 检查门宽是否超出边长
    if (DEFAULT_DOOR_WIDTH > edgeLen * 0.9) return

    const newDoor: DoorDefinition = {
      id: generateId(),
      wallIndex: hit.wallIndex,
      position: hit.position,
      width: DEFAULT_DOOR_WIDTH,
      height: DEFAULT_DOOR_HEIGHT,
      name: `门-${existingDoors.length + 1}`,
    }

    if (!selectedArea.doors) {
      selectedArea.doors = []
    }
    selectedArea.doors.push(newDoor)
    onDoorPlaced()
  }

  /**
   * 删除指定门
   */
  function removeDoor(
    area: AreaDefinition | null,
    doorId: string,
    onDoorRemoved: () => void,
  ) {
    if (!area?.doors) return
    const idx = area.doors.findIndex(d => d.id === doorId)
    if (idx >= 0) {
      area.doors.splice(idx, 1)
      onDoorRemoved()
    }
  }

  /**
   * 处理鼠标移动（用于高亮预览 + 通过 raycast 检测悬停的门 3D 模型）
   */
  function handleDoorMouseMove(
    e: MouseEvent,
    selectedArea: AreaDefinition | null,
  ) {
    const eng = engine()
    if (!eng || !selectedArea) {
      hoveredEdgeIndex.value = null
      hoveredDoorId.value = null
      return
    }

    const worldPoint = eng.getGroundPosition(e)
    if (!worldPoint) {
      hoveredEdgeIndex.value = null
      hoveredDoorId.value = null
      return
    }

    const hit = findNearestEdge(worldPoint, selectedArea)
    if (hit) {
      hoveredEdgeIndex.value = hit.wallIndex
      hoveredPosition.value = hit.position
    } else {
      hoveredEdgeIndex.value = null
    }

    // 通过 raycast 检测鼠标是否悬停在门的 3D 模型上
    hoveredDoorId.value = null
    const pickedObject = eng.pickObject(e, (obj) => {
      let cur: THREE.Object3D | null = obj
      while (cur) {
        if (cur.userData.isDoorGroup) return true
        cur = cur.parent
      }
      return false
    })

    if (pickedObject) {
      let cur: THREE.Object3D | null = pickedObject
      while (cur) {
        if (cur.userData.isDoorGroup) {
          hoveredDoorId.value = cur.userData.doorId as string
          break
        }
        cur = cur.parent
      }
    }
  }

  return {
    hoveredEdgeIndex,
    hoveredPosition,
    hoveredDoorId,
    handleDoorClick,
    handleDoorMouseMove,
    removeDoor,
    findNearestEdge,
    DEFAULT_DOOR_WIDTH,
  }
}
