/**
 * 垂直连接管理模块
 * 
 * 管理扶梯、电梯、楼梯等垂直连接
 */

import type {
  VerticalConnection,
  VerticalConnectionType,
  FloorConnection,
  CreateConnectionParams,
  ConnectionValidationResult,
} from './types'
import { generateId } from '../types/mall-project'

/**
 * 创建垂直连接
 */
export function createVerticalConnection(params: CreateConnectionParams): VerticalConnection {
  return {
    id: generateId(),
    areaId: params.areaId,
    type: params.type,
    connectedFloors: params.floorIds,
    createdAt: Date.now(),
  }
}

/**
 * 验证垂直连接
 * 
 * @param connection - 要验证的连接
 * @param existingFloorIds - 项目中存在的楼层 ID 列表
 */
export function validateConnection(
  connection: VerticalConnection,
  existingFloorIds: string[]
): ConnectionValidationResult {
  // 检查是否有连接的楼层
  if (connection.connectedFloors.length === 0) {
    return {
      valid: false,
      message: '垂直连接必须至少连接一个楼层',
    }
  }

  // 扶梯和楼梯需要至少连接两个楼层
  if (
    (connection.type === 'escalator' || connection.type === 'stairs') &&
    connection.connectedFloors.length < 2
  ) {
    return {
      valid: false,
      message: `${getConnectionTypeName(connection.type)}需要连接至少两个楼层`,
    }
  }

  // 检查所有楼层是否存在
  const invalidFloors = connection.connectedFloors.filter(
    floorId => !existingFloorIds.includes(floorId)
  )
  if (invalidFloors.length > 0) {
    return {
      valid: false,
      message: '连接的楼层不存在',
    }
  }

  return { valid: true }
}

/**
 * 获取区域的垂直连接
 */
export function getConnectionByAreaId(
  connections: VerticalConnection[],
  areaId: string
): VerticalConnection | undefined {
  return connections.find(c => c.areaId === areaId)
}

/**
 * 获取楼层的所有垂直连接
 */
export function getConnectionsByFloorId(
  connections: VerticalConnection[],
  floorId: string
): VerticalConnection[] {
  return connections.filter(c => c.connectedFloors.includes(floorId))
}

/**
 * 获取两个楼层之间的连接
 */
export function getFloorConnections(
  connections: VerticalConnection[],
  fromFloorId: string,
  toFloorId: string
): FloorConnection[] {
  return connections
    .filter(c => 
      c.connectedFloors.includes(fromFloorId) && 
      c.connectedFloors.includes(toFloorId)
    )
    .map(c => ({
      fromFloorId,
      toFloorId,
      areaId: c.areaId,
      type: c.type,
    }))
}

/**
 * 添加楼层到连接
 */
export function addFloorToConnection(
  connection: VerticalConnection,
  floorId: string
): VerticalConnection {
  if (connection.connectedFloors.includes(floorId)) {
    return connection
  }
  return {
    ...connection,
    connectedFloors: [...connection.connectedFloors, floorId],
  }
}

/**
 * 从连接中移除楼层
 */
export function removeFloorFromConnection(
  connection: VerticalConnection,
  floorId: string
): VerticalConnection {
  return {
    ...connection,
    connectedFloors: connection.connectedFloors.filter(id => id !== floorId),
  }
}

/**
 * 删除垂直连接
 */
export function deleteConnection(
  connections: VerticalConnection[],
  connectionId: string
): VerticalConnection[] {
  return connections.filter(c => c.id !== connectionId)
}

/**
 * 删除区域的垂直连接
 */
export function deleteConnectionByAreaId(
  connections: VerticalConnection[],
  areaId: string
): VerticalConnection[] {
  return connections.filter(c => c.areaId !== areaId)
}

/**
 * 获取连接类型的显示名称
 */
export function getConnectionTypeName(type: VerticalConnectionType): string {
  const names: Record<VerticalConnectionType, string> = {
    elevator: '电梯',
    escalator: '扶梯',
    stairs: '楼梯',
  }
  return names[type]
}

/**
 * 获取连接类型的颜色
 */
export function getConnectionTypeColor(type: VerticalConnectionType): number {
  const colors: Record<VerticalConnectionType, number> = {
    elevator: 0x10b981,  // 绿色
    escalator: 0x14b8a6, // 青色
    stairs: 0x06b6d4,    // 蓝色
  }
  return colors[type]
}

/**
 * 检查区域类型是否为垂直连接类型
 */
export function isVerticalConnectionAreaType(areaType: string): boolean {
  return ['elevator', 'escalator', 'stairs'].includes(areaType)
}
