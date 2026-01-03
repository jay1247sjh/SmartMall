/**
 * 电梯 3D 模型
 * 创建真实的电梯井和电梯门模型
 */
import * as THREE from 'three'
import {
  getWallMaterial,
  getDoorMaterial,
  getFloorMaterial,
  getBoxGeometry,
  createIndicatorMaterial,
} from '../resources'

export interface ElevatorModelOptions {
  size: number
  color: number
  isSelected: boolean
  heightScale?: number
}

/**
 * 创建电梯3D模型
 * @param group 要添加模型的组
 * @param size 电梯尺寸
 * @param color 颜色
 * @param isSelected 是否选中
 * @param heightScale 高度缩放比例（编辑模式下使用较小的值）
 */
export function createElevatorModel(
  group: THREE.Group,
  size: number,
  color: number,
  isSelected: boolean,
  heightScale: number = 1.0
): void {
  const height = 3.5 * heightScale
  const wallThickness = 0.1
  const doorWidth = size * 0.6
  const doorHeight = Math.min(2.2 * heightScale, height - 0.3)
  
  // 使用缓存的材质
  const wallMaterial = getWallMaterial()
  const doorMaterial = getDoorMaterial()
  const floorMaterial = getFloorMaterial()
  
  // 后墙
  const backWall = new THREE.Mesh(
    getBoxGeometry(size, height, wallThickness),
    wallMaterial
  )
  backWall.position.set(0, height / 2, -size / 2 + wallThickness / 2)
  group.add(backWall)
  
  // 左墙
  const leftWall = new THREE.Mesh(
    getBoxGeometry(wallThickness, height, size),
    wallMaterial
  )
  leftWall.position.set(-size / 2 + wallThickness / 2, height / 2, 0)
  group.add(leftWall)
  
  // 右墙
  const rightWall = new THREE.Mesh(
    getBoxGeometry(wallThickness, height, size),
    wallMaterial
  )
  rightWall.position.set(size / 2 - wallThickness / 2, height / 2, 0)
  group.add(rightWall)
  
  // 前墙（带门洞）- 左侧
  const frontLeftWall = new THREE.Mesh(
    getBoxGeometry((size - doorWidth) / 2, height, wallThickness),
    wallMaterial
  )
  frontLeftWall.position.set(-(size + doorWidth) / 4, height / 2, size / 2 - wallThickness / 2)
  group.add(frontLeftWall)
  
  // 前墙（带门洞）- 右侧
  const frontRightWall = new THREE.Mesh(
    getBoxGeometry((size - doorWidth) / 2, height, wallThickness),
    wallMaterial
  )
  frontRightWall.position.set((size + doorWidth) / 4, height / 2, size / 2 - wallThickness / 2)
  group.add(frontRightWall)
  
  // 前墙（带门洞）- 上方
  const frontTopWall = new THREE.Mesh(
    getBoxGeometry(doorWidth, height - doorHeight, wallThickness),
    wallMaterial
  )
  frontTopWall.position.set(0, doorHeight + (height - doorHeight) / 2, size / 2 - wallThickness / 2)
  group.add(frontTopWall)
  
  // 左门
  const leftDoor = new THREE.Mesh(
    getBoxGeometry(doorWidth / 2 - 0.02, doorHeight, 0.05),
    doorMaterial
  )
  leftDoor.position.set(-doorWidth / 4, doorHeight / 2, size / 2 + 0.03)
  group.add(leftDoor)
  
  // 右门
  const rightDoor = new THREE.Mesh(
    getBoxGeometry(doorWidth / 2 - 0.02, doorHeight, 0.05),
    doorMaterial
  )
  rightDoor.position.set(doorWidth / 4, doorHeight / 2, size / 2 + 0.03)
  group.add(rightDoor)
  
  // 电梯顶部指示灯
  const indicatorMaterial = createIndicatorMaterial(color, isSelected)
  const indicator = new THREE.Mesh(
    getBoxGeometry(0.3, 0.1, 0.05),
    indicatorMaterial
  )
  indicator.position.set(0, doorHeight + 0.2, size / 2 + 0.05)
  group.add(indicator)
  
  // 地板
  const floor = new THREE.Mesh(
    getBoxGeometry(size - wallThickness * 2, 0.1, size - wallThickness * 2),
    floorMaterial
  )
  floor.position.set(0, 0.05, 0)
  group.add(floor)
}
