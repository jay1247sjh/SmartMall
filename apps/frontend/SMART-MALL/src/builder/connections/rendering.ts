/**
 * 垂直连接渲染模块
 * 
 * 渲染楼层间的连接指示线
 */

import * as THREE from 'three'
import type { VerticalConnection, ConnectionRenderOptions } from './types'
import { getConnectionTypeColor } from './vertical'

/**
 * 默认渲染选项
 */
const DEFAULT_RENDER_OPTIONS: Required<ConnectionRenderOptions> = {
  color: 0x60a5fa,
  lineWidth: 2,
  showLabels: false,
  opacity: 0.8,
}

/**
 * 创建垂直连接指示线
 * 
 * @param connection - 垂直连接
 * @param floorPositions - 楼层 Y 坐标映射 (floorId -> yPosition)
 * @param areaCenter - 区域中心点 (x, z)
 * @param options - 渲染选项
 */
export function createConnectionIndicator(
  connection: VerticalConnection,
  floorPositions: Map<string, number>,
  areaCenter: { x: number; z: number },
  options: ConnectionRenderOptions = {}
): THREE.Group {
  const opts = { ...DEFAULT_RENDER_OPTIONS, ...options }
  const group = new THREE.Group()
  group.name = `connection-${connection.id}`
  group.userData = { isConnection: true, connectionId: connection.id }

  // 获取连接的楼层 Y 坐标
  const yPositions = connection.connectedFloors
    .map(floorId => floorPositions.get(floorId))
    .filter((y): y is number => y !== undefined)
    .sort((a, b) => a - b)

  if (yPositions.length < 1) return group

  // 使用连接类型的颜色
  const color = getConnectionTypeColor(connection.type)

  // 创建垂直线
  const minY = yPositions[0]!
  const maxY = yPositions[yPositions.length - 1]!
  
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(areaCenter.x, minY, areaCenter.z),
    new THREE.Vector3(areaCenter.x, maxY + 0.5, areaCenter.z),
  ])
  
  const lineMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: opts.opacity,
  })
  
  const line = new THREE.Line(lineGeometry, lineMaterial)
  group.add(line)

  // 在每个楼层位置添加标记点
  yPositions.forEach(y => {
    const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const markerMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: opts.opacity,
    })
    const marker = new THREE.Mesh(markerGeometry, markerMaterial)
    marker.position.set(areaCenter.x, y + 0.3, areaCenter.z)
    group.add(marker)
  })

  // 添加顶部箭头指示
  const arrowGeometry = new THREE.ConeGeometry(0.4, 0.8, 8)
  const arrowMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: opts.opacity,
  })
  const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial)
  arrow.position.set(areaCenter.x, maxY + 1, areaCenter.z)
  group.add(arrow)

  return group
}

/**
 * 创建楼层连接预览线
 * 
 * @param fromY - 起始楼层 Y 坐标
 * @param toY - 目标楼层 Y 坐标
 * @param center - 中心点 (x, z)
 * @param color - 线条颜色
 */
export function createConnectionPreview(
  fromY: number,
  toY: number,
  center: { x: number; z: number },
  color: number = 0x60a5fa
): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(center.x, fromY, center.z),
    new THREE.Vector3(center.x, toY, center.z),
  ])
  
  const material = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.5,
    gapSize: 0.3,
    transparent: true,
    opacity: 0.6,
  })
  
  const line = new THREE.Line(geometry, material)
  line.computeLineDistances()
  line.name = 'connection-preview'
  
  return line
}

/**
 * 更新连接指示器位置
 */
export function updateConnectionIndicatorPosition(
  indicator: THREE.Group,
  areaCenter: { x: number; z: number }
): void {
  indicator.traverse(child => {
    if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
      // 更新位置需要重新创建几何体
      // 这里简化处理，直接移动整个组
    }
  })
  indicator.position.set(areaCenter.x, 0, areaCenter.z)
}

/**
 * 清除场景中的所有连接指示器
 */
export function clearConnectionIndicators(scene: THREE.Scene): void {
  const toRemove: THREE.Object3D[] = []
  scene.traverse(obj => {
    if (obj.userData.isConnection || obj.name === 'connection-preview') {
      toRemove.push(obj)
    }
  })
  toRemove.forEach(obj => {
    scene.remove(obj)
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose()
      if (obj.material instanceof THREE.Material) {
        obj.material.dispose()
      }
    }
    if (obj instanceof THREE.Line) {
      obj.geometry.dispose()
      if (obj.material instanceof THREE.Material) {
        obj.material.dispose()
      }
    }
  })
}

/**
 * 获取区域中心点
 */
export function getAreaCenter(vertices: { x: number; y: number }[]): { x: number; z: number } {
  if (vertices.length === 0) {
    return { x: 0, z: 0 }
  }
  
  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 }
  )
  
  return {
    x: sum.x / vertices.length,
    z: -sum.y / vertices.length, // 注意 Y 坐标取反
  }
}
