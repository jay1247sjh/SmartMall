/**
 * 服务台 3D 模型
 * 创建真实的服务台模型，包含柜台、显示器、标识牌
 */
import * as THREE from 'three'
import {
  getDeskMaterial,
  getCounterMaterial,
  getMonitorMaterial,
  getScreenMaterial,
  getGrayFloorMaterial,
  getBoxGeometry,
  createSignMaterial,
  createGlowMaterial,
} from '../resources'

/**
 * 创建服务台3D模型
 */
export function createServiceDeskModel(
  group: THREE.Group,
  width: number,
  depth: number,
  color: number,
  isSelected: boolean,
  heightScale: number = 1.0
): void {
  const deskHeight = 1.1 * heightScale
  const counterHeight = 0.1 * heightScale
  
  const deskMaterial = getDeskMaterial()
  const counterMaterial = getCounterMaterial()
  
  const deskWidth = Math.min(width * 0.8, 3)
  const deskDepth = Math.min(depth * 0.4, 1.2)
  
  const deskBody = new THREE.Mesh(
    getBoxGeometry(deskWidth, deskHeight, deskDepth),
    deskMaterial
  )
  deskBody.position.set(0, deskHeight / 2, depth * 0.2)
  deskBody.castShadow = true
  group.add(deskBody)
  
  const counter = new THREE.Mesh(
    getBoxGeometry(deskWidth + 0.1, counterHeight, deskDepth + 0.1),
    counterMaterial
  )
  counter.position.set(0, deskHeight + counterHeight / 2, depth * 0.2)
  counter.castShadow = true
  group.add(counter)
  
  const signMaterial = createSignMaterial(color)
  const sign = new THREE.Mesh(
    getBoxGeometry(1.5 * Math.min(heightScale, 1), 0.4 * heightScale, 0.05),
    signMaterial
  )
  sign.position.set(0, deskHeight + 0.8 * heightScale, depth * 0.2 + deskDepth / 2 + 0.03)
  group.add(sign)
  
  if (heightScale > 0.5) {
    const monitorMaterial = getMonitorMaterial()
    const screenMaterial = getScreenMaterial()
    
    const monitor1 = new THREE.Mesh(
      getBoxGeometry(0.5, 0.35, 0.03),
      monitorMaterial
    )
    monitor1.position.set(-0.5, deskHeight + 0.4 * heightScale, depth * 0.2 - deskDepth / 4)
    group.add(monitor1)
    
    const screen1 = new THREE.Mesh(
      getBoxGeometry(0.45, 0.3, 0.01),
      screenMaterial
    )
    screen1.position.set(-0.5, deskHeight + 0.4 * heightScale, depth * 0.2 - deskDepth / 4 + 0.02)
    group.add(screen1)
    
    const monitor2 = monitor1.clone()
    monitor2.position.x = 0.5
    group.add(monitor2)
    
    const screen2 = screen1.clone()
    screen2.position.x = 0.5
    group.add(screen2)
  }
  
  const floorMaterial = getGrayFloorMaterial()
  const floor = new THREE.Mesh(
    getBoxGeometry(width, 0.05, depth),
    floorMaterial
  )
  floor.position.set(0, 0.025, 0)
  group.add(floor)
  
  if (isSelected) {
    const glowMaterial = createGlowMaterial(color)
    const glow = new THREE.Mesh(
      getBoxGeometry(width + 0.2, 0.1, depth + 0.2),
      glowMaterial
    )
    glow.position.set(0, 0.05, 0)
    group.add(glow)
  }
}
