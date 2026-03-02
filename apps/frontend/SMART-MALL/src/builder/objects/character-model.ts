/**
 * 小人角色模型
 * 用于漫游模式的第三人称视角
 * 使用 Kenney Mini Characters 资源包
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Point2D, Polygon } from '../geometry/types'
import { isPointInside } from '../geometry/polygon'
import { devLog } from '@/utils/dev-log'

// 可用的角色模型列表
const CHARACTER_MODELS = [
  'character-male-a',
  'character-male-b',
  'character-male-c',
  'character-male-d',
  'character-male-e',
  'character-male-f',
  'character-female-a',
  'character-female-b',
  'character-female-c',
  'character-female-d',
  'character-female-e',
  'character-female-f',
]

// 模型基础路径
const MODEL_BASE_PATH = '/models/kenney_mini-characters/Models/GLB format/'

/**
 * 角色模型加载结果
 */
interface CharacterModelResult {
  model: THREE.Group
  animations: THREE.AnimationClip[]
}

export type GroundResolver = (x: number, z: number) => number | null | undefined
export interface WallCollisionSegment {
  start: Point2D
  end: Point2D
  collisionRadius?: number
}

/**
 * 加载角色模型
 * @param modelName 模型名称（不含扩展名）
 * @returns Promise<CharacterModelResult>
 */
export async function loadCharacterModel(modelName: string = 'character-male-a'): Promise<CharacterModelResult> {
  const loader = new GLTFLoader()
  const modelPath = `${MODEL_BASE_PATH}${modelName}.glb`
  
  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene
        model.name = 'character'
        
        // 调整模型大小
        model.scale.set(1.5, 1.5, 1.5)
        
        // 启用阴影
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        // 设置用户数据
        model.userData = {
          isCharacter: true,
          height: 1.7,
          modelName: modelName,
        }
        
        devLog(`[loadCharacterModel] 模型加载成功: ${modelName}, 动画数量: ${gltf.animations.length}`)
        if (gltf.animations.length > 0) {
          devLog('[loadCharacterModel] 可用动画:', gltf.animations.map(a => a.name))
        }
        
        resolve({
          model,
          animations: gltf.animations,
        })
      },
      (progress) => {
        if (progress.total > 0) {
          devLog(`[loadCharacterModel] 加载进度: ${(progress.loaded / progress.total * 100).toFixed(1)}%`)
        }
      },
      (error) => {
        console.error(`[loadCharacterModel] 模型加载失败: ${modelPath}`, error)
        reject(error)
      }
    )
  })
}

/**
 * 获取随机角色模型名称
 */
export function getRandomCharacterModel(): string {
  const index = Math.floor(Math.random() * CHARACTER_MODELS.length)
  return CHARACTER_MODELS[index] || 'character-male-a'
}

/**
 * 获取所有可用的角色模型列表
 */
export function getAvailableCharacterModels(): string[] {
  return [...CHARACTER_MODELS]
}

/**
 * 创建角色控制器
 * 管理角色的移动、旋转和动画
 */
export class CharacterController {
  public character: THREE.Group
  public velocity: THREE.Vector3 = new THREE.Vector3()
  public direction: THREE.Vector3 = new THREE.Vector3()
  
  // 移动状态
  public moveForward: boolean = false
  public moveBackward: boolean = false
  public moveLeft: boolean = false
  public moveRight: boolean = false
  
  // 配置
  public moveSpeed: number = 2.5
  public rotationSpeed: number = 0.1
  public damping: number = 10
  
  // 速度预设
  public static readonly SPEED_PRESETS = {
    slow: 1,
    normal: 2.5,
    fast: 4,
  } as const
  
  /**
   * 设置移动速度
   * @param speed 速度值或预设名称
   */
  setMoveSpeed(speed: number | 'slow' | 'normal' | 'fast'): void {
    if (typeof speed === 'string') {
      this.moveSpeed = CharacterController.SPEED_PRESETS[speed]
    } else {
      this.moveSpeed = speed
    }
    devLog(`[CharacterController] 移动速度设置为: ${this.moveSpeed}`)
  }
  
  /**
   * 获取当前速度预设名称
   */
  getSpeedPresetName(): 'slow' | 'normal' | 'fast' | 'custom' {
    const presets = CharacterController.SPEED_PRESETS
    if (this.moveSpeed === presets.slow) return 'slow'
    if (this.moveSpeed === presets.normal) return 'normal'
    if (this.moveSpeed === presets.fast) return 'fast'
    return 'custom'
  }
  
  // 当前楼层高度
  public currentFloorY: number = 0
  private groundResolver: GroundResolver | null = null
  
  // 边界碰撞检测
  private boundary: Polygon | null = null
  private collisionRadius: number = 0.35
  
  // 区域碰撞检测（商城内的实体）
  private obstacles: Polygon[] = []
  
  // 墙壁线段障碍物（用于精确的墙壁碰撞检测）
  private wallSegments: WallCollisionSegment[] = []
  
  private modelName: string = 'character-male-a'
  
  // 动画相关
  private mixer: THREE.AnimationMixer | null = null
  private animations: Map<string, THREE.AnimationAction> = new Map()
  private currentAction: THREE.AnimationAction | null = null
  
  constructor(modelName?: string) {
    // 创建一个临时的空组作为占位符
    this.character = new THREE.Group()
    this.character.name = 'character'
    this.character.userData = { isCharacter: true, height: 1.7 }
    
    // 校验模型名称是否在可用列表中，无效则回退默认值
    if (modelName && CHARACTER_MODELS.includes(modelName)) {
      this.modelName = modelName
    } else {
      if (modelName) {
        console.warn(`[CharacterController] 无效的模型名称: ${modelName}，回退使用默认模型 character-male-a`)
      }
      this.modelName = 'character-male-a'
    }
    this.loadModel()
  }
  
  /**
   * 异步加载角色模型
   */
  private async loadModel(): Promise<void> {
    try {
      const result = await loadCharacterModel(this.modelName)
      const { model, animations } = result
      
      // 保存当前位置和旋转
      const position = this.character.position.clone()
      const rotation = this.character.rotation.clone()
      
      // 清空占位符组
      while (this.character.children.length > 0) {
        const child = this.character.children[0]!
        this.character.remove(child)
      }
      
      // 直接将整个模型添加为子对象
      model.position.set(0, 0, 0)
      model.rotation.set(0, 0, 0)
      this.character.add(model)
      
      // 恢复位置和旋转
      this.character.position.copy(position)
      this.character.rotation.copy(rotation)
      
      // 设置动画混合器
      if (animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model)
        
        // 存储所有动画
        animations.forEach(clip => {
          const action = this.mixer!.clipAction(clip)
          this.animations.set(clip.name, action)
          devLog(`[CharacterController] 注册动画: ${clip.name}`)
        })
        
        // 尝试播放 idle 动画（如果有的话）
        this.playAnimation('Idle') || this.playAnimation('idle') || this.playFirstAnimation()
      }
      
      devLog(`[CharacterController] 角色模型已加载: ${this.modelName}`)
    } catch (error) {
      console.error('[CharacterController] 加载模型失败，使用备用简单模型', error)
      this.createFallbackModel()
    }
  }
  
  /**
   * 播放指定名称的动画
   */
  playAnimation(name: string): boolean {
    const action = this.animations.get(name)
    if (!action) return false
    
    if (this.currentAction && this.currentAction !== action) {
      // 淡出当前动画
      this.currentAction.fadeOut(0.2)
    }
    
    // 淡入新动画
    action.reset().fadeIn(0.2).play()
    this.currentAction = action
    return true
  }
  
  /**
   * 播放第一个可用的动画
   */
  private playFirstAnimation(): void {
    const firstAction = this.animations.values().next().value
    if (firstAction) {
      firstAction.play()
      this.currentAction = firstAction
    }
  }
  
  /**
   * 创建备用的简单模型（加载失败时使用）
   */
  private createFallbackModel(): void {
    const geometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8)
    const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = 0.8
    mesh.castShadow = true
    this.character.add(mesh)
  }
  
  /**
   * 设置边界多边形（用于碰撞检测）
   */
  setBoundary(outline: Point2D[]): void {
    if (outline && outline.length >= 3) {
      this.boundary = {
        vertices: outline,
        isClosed: true,
      }
      devLog('[CharacterController] 边界已设置，顶点数:', outline.length)
    }
  }
  
  /**
   * 设置障碍物（商城内的区域实体）
   * @param areas 区域形状数组
   */
  setObstacles(areas: { vertices: Point2D[] }[]): void {
    this.obstacles = areas
      .filter(area => area.vertices && area.vertices.length >= 3)
      .map(area => ({
        vertices: area.vertices,
        isClosed: true,
      }))
    devLog('[CharacterController] 障碍物已设置，数量:', this.obstacles.length)
  }
  
  /**
   * 设置墙壁线段障碍物（用于精确的墙壁碰撞检测）
   * @param segments 墙壁线段数组
   */
  setWallSegments(segments: WallCollisionSegment[]): void {
    this.wallSegments = segments
    devLog('[CharacterController] 墙壁线段已设置，数量:', this.wallSegments.length)
  }

  private getSegmentCollisionRadius(segment: WallCollisionSegment): number {
    const radius = segment.collisionRadius
    if (radius === undefined || radius === null) return this.collisionRadius
    if (!Number.isFinite(radius)) return this.collisionRadius
    return Math.max(0.08, radius)
  }
  
  /**
   * 清除边界
   */
  clearBoundary(): void {
    this.boundary = null
  }
  
  /**
   * 清除障碍物
   */
  clearObstacles(): void {
    this.obstacles = []
    this.wallSegments = []
  }
  
  /**
   * 计算点到线段的最短距离
   */
  private pointToSegmentDistance(point: Point2D, segStart: Point2D, segEnd: Point2D): number {
    const dx = segEnd.x - segStart.x
    const dy = segEnd.y - segStart.y
    const lengthSquared = dx * dx + dy * dy
    
    if (lengthSquared === 0) {
      // 线段退化为点
      const pdx = point.x - segStart.x
      const pdy = point.y - segStart.y
      return Math.sqrt(pdx * pdx + pdy * pdy)
    }
    
    // 计算投影参数 t
    let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared
    t = Math.max(0, Math.min(1, t))
    
    // 计算投影点（点到线的最短距离）
    const projX = segStart.x + t * dx
    const projY = segStart.y + t * dy
    
    // 计算距离
    const distX = point.x - projX
    const distY = point.y - projY
    return Math.sqrt(distX * distX + distY * distY)
  }
  
  /**
   * 基于墙面法线的滑动
   * 找到最近的碰撞墙壁，将移动向量投影到墙壁切线方向
   */
  private slideAlongWall(
    curX: number, curZ: number,
    moveX: number, moveZ: number
  ): { x: number; z: number } | null {
    // 将 3D 坐标转换为 2D（x, -z）
    const target2D: Point2D = { x: curX + moveX, y: -(curZ + moveZ) }
    
    // 找到最近的墙壁线段
    let minDist = Infinity
    let nearestSeg: WallCollisionSegment | null = null
    
    for (const seg of this.wallSegments) {
      const segmentRadius = this.getSegmentCollisionRadius(seg)
      const dist = this.pointToSegmentDistance(target2D, seg.start, seg.end) - segmentRadius
      if (dist < minDist) {
        minDist = dist
        nearestSeg = seg
      }
    }
    
    // 也检查边界多边形的边
    if (this.boundary) {
      const verts = this.boundary.vertices
      for (let i = 0; i < verts.length; i++) {
        const start = verts[i]!
        const end = verts[(i + 1) % verts.length]!
        const dist = this.pointToSegmentDistance(target2D, start, end)
        if (dist < minDist) {
          minDist = dist
          nearestSeg = { start, end }
        }
      }
    }
    
    if (!nearestSeg || minDist > this.collisionRadius * 2.2) return null
    
    // 计算墙壁切线方向
    const wallDx = nearestSeg.end.x - nearestSeg.start.x
    const wallDy = nearestSeg.end.y - nearestSeg.start.y
    const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy)
    if (wallLen < 0.001) return null
    
    const tangentX = wallDx / wallLen
    const tangentY = wallDy / wallLen
    
    // 移动向量在 2D 空间中
    const move2Dx = moveX
    const move2Dy = -moveZ  // 3D z → 2D -y
    
    // 投影到切线方向
    const dot = move2Dx * tangentX + move2Dy * tangentY
    const slideX = dot * tangentX
    const slideY = dot * tangentY
    
    // 转换回 3D 坐标
    return {
      x: curX + slideX,
      z: curZ - slideY,  // 2D y → 3D -z
    }
  }
  
  /**
   * 检查位置是否与墙壁线段碰撞
   */
  private isCollidingWithWalls(x: number, z: number): boolean {
    const point2D: Point2D = { x: x, y: -z }
    
    // 检查是否与任何墙壁线段碰撞
    for (const segment of this.wallSegments) {
      const radius = this.getSegmentCollisionRadius(segment)
      const distance = this.pointToSegmentDistance(point2D, segment.start, segment.end)
      if (distance < radius) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * 检查位置是否在边界内且不在任何障碍物内
   */
  private isInsideBoundary(x: number, z: number): boolean {
    const point2D: Point2D = { x: x, y: -z }
    
    // 检查是否在商城边界内
    if (this.boundary && !isPointInside(point2D, this.boundary)) {
      return false
    }
    
    // 检查是否与墙壁线段碰撞（优先使用墙壁线段检测）
    if (this.wallSegments.length > 0) {
      if (this.isCollidingWithWalls(x, z)) {
        return false
      }
    } else {
      // 如果没有墙壁线段，则使用旧的多边形障碍物检测
      // 检查是否在任何障碍物内（如果在障碍物内，则不能移动到该位置）
      for (const obstacle of this.obstacles) {
        if (isPointInside(point2D, obstacle)) {
          return false
        }
      }
    }
    
    return true
  }
  
  /**
   * 设置角色位置
   */
  setPosition(x: number, y: number, z: number): void {
    this.character.position.set(x, y, z)
    this.currentFloorY = y
  }

  setGroundResolver(resolver: GroundResolver): void {
    this.groundResolver = resolver
  }

  clearGroundResolver(): void {
    this.groundResolver = null
  }
  
  /**
   * 设置角色朝向（Y轴旋转）
   */
  setRotation(yRotation: number): void {
    this.character.rotation.y = yRotation
  }
  
  /**
   * 更新角色状态（每帧调用）
   */
  update(delta: number, cameraYaw?: number): void {
    // 更新动画混合器
    if (this.mixer) {
      this.mixer.update(delta)
    }
    
    // 应用阻尼
    this.velocity.x -= this.velocity.x * this.damping * delta
    this.velocity.z -= this.velocity.z * this.damping * delta
    
    // 计算移动方向
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
    this.direction.normalize()
    
    // 检查是否在移动
    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight
    
    // 切换动画（走路/站立）
    if (isMoving) {
      // 尝试播放走路动画
      if (this.currentAction?.getClip().name !== 'Walk' && this.currentAction?.getClip().name !== 'walk') {
        this.playAnimation('Walk') || this.playAnimation('walk') || this.playAnimation('Run') || this.playAnimation('run')
      }
    } else {
      // 尝试播放站立动画
      if (this.currentAction?.getClip().name !== 'Idle' && this.currentAction?.getClip().name !== 'idle') {
        this.playAnimation('Idle') || this.playAnimation('idle')
      }
    }
    
    // 应用加速度
    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * this.moveSpeed * delta
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x += this.direction.x * this.moveSpeed * delta
    }
    
    // 计算移动方向向量
    let forward: THREE.Vector3
    let right: THREE.Vector3
    
    if (cameraYaw !== undefined) {
      forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
      right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw))
    } else {
      forward = new THREE.Vector3(0, 0, -1)
      forward.applyQuaternion(this.character.quaternion)
      forward.y = 0
      forward.normalize()
      
      right = new THREE.Vector3(1, 0, 0)
      right.applyQuaternion(this.character.quaternion)
      right.y = 0
      right.normalize()
    }
    
    // 计算新位置
    const currentPos = this.character.position.clone()
    const movement = forward.clone().multiplyScalar(-this.velocity.z)
      .add(right.clone().multiplyScalar(this.velocity.x))
    
    const newX = currentPos.x + movement.x
    const newZ = currentPos.z + movement.z
    
    // 碰撞检测
    if (this.boundary) {
      const r = this.collisionRadius
      
      // 5 个检查点：中心 + 四个方向
      const allClear = (x: number, z: number): boolean => {
        const pts = [
          { x, z },
          { x: x + r, z },
          { x: x - r, z },
          { x, z: z + r },
          { x, z: z - r },
        ]
        return pts.every(pt => this.isInsideBoundary(pt.x, pt.z))
      }
      
      if (allClear(newX, newZ)) {
        // 完整移动可行
        this.character.position.x = newX
        this.character.position.z = newZ
      } else if (this.wallSegments.length > 0) {
        // 基于墙面法线的滑动
        const slideResult = this.slideAlongWall(currentPos.x, currentPos.z, movement.x, movement.z)
        if (slideResult && allClear(slideResult.x, slideResult.z)) {
          this.character.position.x = slideResult.x
          this.character.position.z = slideResult.z
        } else {
          // 法线滑动失败，回退到轴分解滑动（完整 5 点检测）
          const canMoveX = allClear(newX, currentPos.z)
          const canMoveZ = allClear(currentPos.x, newZ)
          
          if (canMoveX) {
            this.character.position.x = newX
          } else {
            this.velocity.x = 0
          }
          
          if (canMoveZ) {
            this.character.position.z = newZ
          } else {
            this.velocity.z = 0
          }
        }
      } else {
        // 无墙壁线段数据，使用轴分解滑动（完整 5 点检测）
        const canMoveX = allClear(newX, currentPos.z)
        const canMoveZ = allClear(currentPos.x, newZ)
        
        if (canMoveX) {
          this.character.position.x = newX
        } else {
          this.velocity.x = 0
        }
        
        if (canMoveZ) {
          this.character.position.z = newZ
        } else {
          this.velocity.z = 0
        }
      }
    } else {
      this.character.position.x = newX
      this.character.position.z = newZ
    }
    
    // 角色面向移动方向
    // 基于输入意图（direction）计算朝向，避免 velocity 阻尼抖动导致突然转身
    if (isMoving) {
      // 仅按 S 倒退时保持角色朝向不变，避免触发相机 yaw 约束导致视角旋转
      const shouldRotate = this.moveForward || this.moveLeft || this.moveRight
      if (shouldRotate) {
        const intentDir = forward.clone().multiplyScalar(this.direction.z)
          .add(right.clone().multiplyScalar(this.direction.x))
        if (intentDir.length() > 0.01) {
          const targetAngle = Math.atan2(intentDir.x, intentDir.z)
          const currentAngle = this.character.rotation.y
          const angleDiff = targetAngle - currentAngle
          // 规范化到 [-π, π]
          const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff))
          // 平滑转向（每帧 10%）
          this.character.rotation.y += normalizedDiff * 0.1
          // 归一化 rotation.y 到 [-π, π]，防止累积越界导致角度跳变抖动
          this.character.rotation.y = Math.atan2(
            Math.sin(this.character.rotation.y),
            Math.cos(this.character.rotation.y)
          )
        }
      }
    }
    
    // 保持在地面/坡面高度
    const resolvedY = this.groundResolver
      ? this.groundResolver(this.character.position.x, this.character.position.z)
      : null
    if (resolvedY !== null && resolvedY !== undefined && Number.isFinite(resolvedY)) {
      this.character.position.y = resolvedY
      this.currentFloorY = resolvedY
    } else {
      this.character.position.y = this.currentFloorY
    }
  }
  
  /**
   * 旋转角色
   */
  rotate(deltaY: number): void {
    this.character.rotation.y -= deltaY
  }
  
  /**
   * 设置当前楼层高度
   */
  setFloorHeight(y: number): void {
    this.currentFloorY = y
    this.character.position.y = y
  }
  
  /**
   * 获取角色位置
   */
  getPosition(): THREE.Vector3 {
    return this.character.position.clone()
  }
  
  /**
   * 获取角色朝向
   */
  getRotationY(): number {
    return this.character.rotation.y
  }
  
  /**
   * 重置移动状态
   */
  resetMovement(): void {
    this.moveForward = false
    this.moveBackward = false
    this.moveLeft = false
    this.moveRight = false
    this.velocity.set(0, 0, 0)
  }
  
  /**
   * 切换角色模型
   */
  async switchModel(modelName: string): Promise<void> {
    this.modelName = modelName
    this.mixer = null
    this.animations.clear()
    this.currentAction = null
    await this.loadModel()
  }
  
  /**
   * 获取所有可用的动画名称
   */
  getAnimationNames(): string[] {
    return Array.from(this.animations.keys())
  }
  
  /**
   * 销毁角色
   */
  dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction()
      this.mixer = null
    }
    this.animations.clear()
    
    this.character.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        } else if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        }
      }
    })
  }
}
