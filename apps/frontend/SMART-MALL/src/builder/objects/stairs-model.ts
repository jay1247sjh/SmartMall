/**
 * 楼梯 3D 模型
 * 创建真实的楼梯模型，包含台阶、扶手
 */
import * as THREE from 'three'
import {
  getWoodMaterial,
  getHandrailMaterial,
  getPostMaterial,
  getBoxGeometry,
  getCylinderGeometry,
  createStairsGlowMaterial,
} from '../resources'

/**
 * 创建楼梯3D模型
 */
export function createStairsModel(
  group: THREE.Group,
  width: number,
  depth: number,
  color: number,
  isSelected: boolean,
  heightScale: number = 1.0
): void {
  const height = 3.5 * heightScale
  const stepCount = Math.max(3, Math.floor(14 * heightScale))
  const stepHeight = height / stepCount
  const stepDepth = depth / stepCount
  
  const stepMaterial = getWoodMaterial()
  const handrailMaterial = getHandrailMaterial()
  const postMaterial = getPostMaterial()
  
  for (let i = 0; i < stepCount; i++) {
    const tread = new THREE.Mesh(
      getBoxGeometry(width, 0.05, stepDepth + 0.02),
      stepMaterial
    )
    tread.position.set(0, i * stepHeight + stepHeight, -depth / 2 + i * stepDepth + stepDepth / 2)
    tread.castShadow = true
    tread.receiveShadow = true
    group.add(tread)
    
    const riser = new THREE.Mesh(
      getBoxGeometry(width, stepHeight, 0.03),
      stepMaterial
    )
    riser.position.set(0, i * stepHeight + stepHeight / 2, -depth / 2 + i * stepDepth)
    group.add(riser)
  }
  
  const postInterval = Math.max(1, Math.floor(stepCount / 4))
  const postHeight = 0.9 * heightScale
  const postGeometry = getCylinderGeometry(0.03, postHeight, 8)
  
  for (let i = 0; i <= stepCount; i += postInterval) {
    const yPos = i * stepHeight + postHeight / 2
    const zPos = -depth / 2 + i * stepDepth
    
    const leftPost = new THREE.Mesh(postGeometry, postMaterial)
    leftPost.position.set(-width / 2 + 0.05, yPos, zPos)
    group.add(leftPost)
    
    const rightPost = new THREE.Mesh(postGeometry, postMaterial)
    rightPost.position.set(width / 2 - 0.05, yPos, zPos)
    group.add(rightPost)
  }

  
  const handrailPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.9 * heightScale, depth / 2),
    new THREE.Vector3(0, height + 0.9 * heightScale, -depth / 2),
  ])
  
  const handrailGeometry = new THREE.TubeGeometry(handrailPath, 20, 0.035, 8, false)
  
  const leftHandrail = new THREE.Mesh(handrailGeometry, handrailMaterial)
  leftHandrail.position.x = -width / 2 + 0.05
  group.add(leftHandrail)
  
  const rightHandrail = new THREE.Mesh(handrailGeometry, handrailMaterial)
  rightHandrail.position.x = width / 2 - 0.05
  group.add(rightHandrail)
  
  if (isSelected) {
    const glowMaterial = createStairsGlowMaterial(color)
    const glow = new THREE.Mesh(
      getBoxGeometry(width, 0.1, depth),
      glowMaterial
    )
    glow.position.set(0, 0.05, 0)
    group.add(glow)
  }
}
