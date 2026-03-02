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
  spanHeight: number,
  color: number,
  isSelected: boolean,
  heightScale: number = 1.0,
): void {
  const height = Math.max(0.6, spanHeight * heightScale)
  const clampedDepth = Math.max(1.2, depth)
  const landingDepth = Math.max(0.35, Math.min(clampedDepth * 0.18, 0.9))
  const climbDepth = Math.max(0.6, clampedDepth - landingDepth * 2)
  const stepCount = Math.max(3, Math.floor(height / 0.2))
  const stepHeight = height / stepCount
  const stepDepth = climbDepth / stepCount
  const treadThickness = 0.05
  
  const stepMaterial = getWoodMaterial()
  const handrailMaterial = getHandrailMaterial()
  const postMaterial = getPostMaterial()
  
  for (let i = 0; i < stepCount; i++) {
    const tread = new THREE.Mesh(
      getBoxGeometry(width, treadThickness, stepDepth + 0.02),
      stepMaterial
    )
    tread.position.set(
      0,
      i * stepHeight - treadThickness / 2,
      -clampedDepth / 2 + landingDepth + i * stepDepth + stepDepth / 2
    )
    tread.castShadow = true
    tread.receiveShadow = true
    group.add(tread)
    
    const riser = new THREE.Mesh(
      getBoxGeometry(width, stepHeight, 0.03),
      stepMaterial
    )
    riser.position.set(
      0,
      i * stepHeight - stepHeight / 2,
      -clampedDepth / 2 + landingDepth + i * stepDepth + 0.01
    )
    group.add(riser)
  }

  const bottomLanding = new THREE.Mesh(
    getBoxGeometry(width, treadThickness, landingDepth),
    stepMaterial,
  )
  bottomLanding.position.set(0, -treadThickness / 2, -clampedDepth / 2 + landingDepth / 2)
  bottomLanding.castShadow = true
  bottomLanding.receiveShadow = true
  group.add(bottomLanding)

  const topLanding = new THREE.Mesh(
    getBoxGeometry(width, treadThickness, landingDepth),
    stepMaterial,
  )
  topLanding.position.set(0, height - treadThickness / 2, clampedDepth / 2 - landingDepth / 2)
  topLanding.castShadow = true
  topLanding.receiveShadow = true
  group.add(topLanding)
  
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
    new THREE.Vector3(0, 0.9 * heightScale, -clampedDepth / 2 + landingDepth),
    new THREE.Vector3(0, height + 0.9 * heightScale, clampedDepth / 2 - landingDepth),
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
      getBoxGeometry(width, 0.1, clampedDepth),
      glowMaterial
    )
    glow.position.set(0, 0.05, 0)
    group.add(glow)
  }
}
