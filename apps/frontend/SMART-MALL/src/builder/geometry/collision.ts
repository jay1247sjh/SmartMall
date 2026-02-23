/**
 * 碰撞数据提取工具
 *
 * 从 MallProject 数据中提取漫游模式所需的碰撞检测数据。
 * 复用 @/builder/geometry/polygon 中的几何计算函数。
 */

import { getEdges, getCentroid, distance } from './polygon'
import type { Point2D, LineSegment, Polygon } from './types'
import type { FloorDefinition, DoorDefinition } from '../types/mall-project.types'
import { AreaType, isShopAreaType } from '@smart-mall/shared-types'

/**
 * 从楼层区域边界提取墙壁碰撞线段
 *
 * 遍历楼层中所有非走廊区域，将每个区域的边作为墙壁碰撞线段。
 * 走廊区域（CORRIDOR）是可通行区域，不生成墙壁。
 * 店铺类型区域的入口边（最长边）留出门洞，与渲染层 createAreaWalls 一致。
 *
 * @param floor - 楼层定义
 * @returns 墙壁碰撞线段数组
 */
export function extractWallSegments(floor: FloorDefinition): LineSegment[] {
  const segments: LineSegment[] = []

  for (const area of floor.areas) {
    if (area.type === AreaType.CORRIDOR) continue

    const edges = getEdges(area.shape)
    const isShop = isShopAreaType(area.type as AreaType)
      || area.type === ('store' as string)

    if (!isShop) {
      // 非店铺区域：所有边都是碰撞墙
      segments.push(...edges)
      continue
    }

    // 店铺区域：找到最长边（入口边），留出门洞
    let maxLen = 0
    let entranceIdx = 0
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!
      const len = distance(e.start, e.end)
      if (len > maxLen) {
        maxLen = len
        entranceIdx = i
      }
    }

    for (let i = 0; i < edges.length; i++) {
      if (i !== entranceIdx) {
        segments.push(edges[i]!)
        continue
      }

      // 入口边：只生成两侧短墙段，中间留出门洞
      const edge = edges[i]!
      const edgeLen = distance(edge.start, edge.end)
      const doorWidth = Math.min(edgeLen * 0.6, 4)
      const sideLen = (edgeLen - doorWidth) / 2

      if (sideLen > 0.1) {
        const dx = (edge.end.x - edge.start.x) / edgeLen
        const dy = (edge.end.y - edge.start.y) / edgeLen

        // 左侧墙段
        const leftEnd: Point2D = {
          x: edge.start.x + dx * sideLen,
          y: edge.start.y + dy * sideLen,
        }
        segments.push({ start: edge.start, end: leftEnd })

        // 右侧墙段
        const rightStart: Point2D = {
          x: edge.end.x - dx * sideLen,
          y: edge.end.y - dy * sideLen,
        }
        segments.push({ start: rightStart, end: edge.end })
      }
    }
  }

  return segments
}

/**
 * 从楼层轮廓提取墙壁碰撞线段（门洞处留空）
 *
 * 遍历轮廓的每条边，如果该边上有门定义，则将门洞区域挖空，
 * 只保留门两侧的墙壁线段。无门的边整条作为碰撞墙壁。
 *
 * @param outline - 商城轮廓多边形
 * @param doors - 门定义数组（可选）
 * @returns 轮廓墙壁碰撞线段数组（门洞处已挖空）
 */
export function extractOutlineWallSegments(
  outline: Polygon,
  doors?: DoorDefinition[],
): LineSegment[] {
  const edges = getEdges(outline)
  if (!doors || doors.length === 0) return edges

  const segments: LineSegment[] = []

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]!
    const edgeDoors = doors.filter((d) => d.wallIndex === i)

    if (edgeDoors.length === 0) {
      segments.push(edge)
      continue
    }

    const edgeLen = distance(edge.start, edge.end)
    if (edgeLen < 0.01) continue

    const dx = (edge.end.x - edge.start.x) / edgeLen
    const dy = (edge.end.y - edge.start.y) / edgeLen

    // 将门按 position 排序，计算每个门在边上的间隙
    const sorted = [...edgeDoors].sort((a, b) => a.position - b.position)
    const gaps: Array<{ start: number; end: number }> = sorted.map((door) => {
      const center = door.position * edgeLen
      const half = door.width / 2
      return {
        start: Math.max(0, center - half),
        end: Math.min(edgeLen, center + half),
      }
    })

    // 合并重叠间隙
    const merged: Array<{ start: number; end: number }> = []
    for (const g of gaps) {
      const last = merged[merged.length - 1]
      if (last && g.start <= last.end) {
        last.end = Math.max(last.end, g.end)
      } else {
        merged.push({ ...g })
      }
    }

    // 生成间隙之间的墙壁线段
    let cursor = 0
    for (const gap of merged) {
      if (gap.start - cursor > 0.05) {
        segments.push({
          start: { x: edge.start.x + dx * cursor, y: edge.start.y + dy * cursor },
          end: { x: edge.start.x + dx * gap.start, y: edge.start.y + dy * gap.start },
        })
      }
      cursor = gap.end
    }
    if (edgeLen - cursor > 0.05) {
      segments.push({
        start: { x: edge.start.x + dx * cursor, y: edge.start.y + dy * cursor },
        end: edge.end,
      })
    }
  }

  return segments
}


/**
 * 获取商城外轮廓边界顶点
 *
 * 直接返回轮廓多边形的顶点数组，用于 CharacterController.setBoundary()。
 *
 * @param outline - 商城轮廓多边形
 * @returns 边界顶点数组
 */
export function getOutlineBoundary(outline: Polygon): Point2D[] {
  return outline.vertices
}

/**
 * 获取角色初始位置（商城轮廓质心）
 *
 * 计算商城轮廓多边形的质心作为角色的初始 XZ 位置。
 * 质心是所有顶点坐标的算术平均值。
 *
 * @param outline - 商城轮廓多边形
 * @returns 质心坐标（x 对应 3D 空间 X，y 对应 3D 空间 Z）
 */
export function getInitialPosition(outline: Polygon): Point2D {
  return getCentroid(outline)
}
