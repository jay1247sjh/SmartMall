/**
 * 小人角色模型
 * 用于漫游模式的第三人称视角
 * 使用 Kenney Mini Characters 资源包
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Point2D, Polygon } from '../geometry/types'
import { isPointInside } from '../geometry/polygon'

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
        
        console.log(`[loadCharacterModel] 模型加载成功: ${modelName}, 动画数量: ${gltf.animations.length}`)
        if (gltf.animations.length > 0) {
          console.log('[loadCharacterModel] 可用动画:', gltf.animations.map(a => a.name))
        }
        
        resolve({
          model,
          animations: gltf.animations,
        })
      },
      (progress) => {
        if (progress.total > 0) {
          console.log(`[loadCharacterModel] 加载进度: ${(progress.loaded / progress.total * 100).toFixed(1)}%`)
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
  public moveSpeed: number = 5
  public rotationSpeed: number = 0.1
  public damping: number = 10
  
  // 速度预设
  public static readonly SPEED_PRESETS = {
    slow: 3,
    normal: 5,
    fast: 10,
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
    console.log(`[CharacterController] 移动速度设置为: ${this.moveSpeed}`)
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
  
  // 边界碰撞检测
  private boundary: Polygon | null = null
  private collisionRadius: number = 0.5
  
  // 区域碰撞检测（商城内的实体）
  private obstacles: Polygon[] = []
  
  // 模型加载状态
  private modelLoaded: boolean = false
  private modelName: string = 'character-male-a'
  
  // 动画相关
  private mixer: THREE.AnimationMixer | null = null
  private animations: Map<string, THREE.AnimationAction> = new Map()
  private currentAction: THREE.AnimationAction | null = null
  private clock: THREE.Clock = new THREE.Clock()
  
  constructor(modelName?: string) {
    // 创建一个临时的空组作为占位符
    this.character = new THREE.Group()
    this.character.name = 'character'
    this.character.userData = { isCharacter: true, height: 1.7 }
    
    // 异步加载真实模型
    this.modelName = modelName || getRandomCharacterModel()
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
          console.log(`[CharacterController] 注册动画: ${clip.name}`)
        })
        
        // 尝试播放 idle 动画（如果有的话）
        this.playAnimation('Idle') || this.playAnimation('idle') || this.playFirstAnimation()
      }
      
      this.modelLoaded = true
      console.log(`[CharacterController] 角色模型已加载: ${this.modelName}`)
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
    this.modelLoaded = true
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
      console.log('[CharacterController] 边界已设置，顶点数:', outline.length)
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
    console.log('[CharacterController] 障碍物已设置，数量:', this.obstacles.length)
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
    
    // 检查是否在任何障碍物内（如果在障碍物内，则不能移动到该位置）
    for (const obstacle of this.obstacles) {
      if (isPointInside(point2D, obstacle)) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * 设置角色位置
   */
  setPosition(x: number, y: number, z: number): void {
    this.character.position.set(x, y, z)
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
      const checkPoints = [
        { x: newX, z: newZ },
        { x: newX + this.collisionRadius, z: newZ },
        { x: newX - this.collisionRadius, z: newZ },
        { x: newX, z: newZ + this.collisionRadius },
        { x: newX, z: newZ - this.collisionRadius },
      ]
      
      let canMove = true
      for (const pt of checkPoints) {
        if (!this.isInsideBoundary(pt.x, pt.z)) {
          canMove = false
          break
        }
      }
      
      if (canMove) {
        this.character.position.x = newX
        this.character.position.z = newZ
      } else {
        // 尝试滑动
        const canMoveX = this.isInsideBoundary(newX, currentPos.z) &&
          this.isInsideBoundary(newX + this.collisionRadius, currentPos.z) &&
          this.isInsideBoundary(newX - this.collisionRadius, currentPos.z)
        
        const canMoveZ = this.isInsideBoundary(currentPos.x, newZ) &&
          this.isInsideBoundary(currentPos.x, newZ + this.collisionRadius) &&
          this.isInsideBoundary(currentPos.x, newZ - this.collisionRadius)
        
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
    if (this.velocity.length() > 0.01 && isMoving) {
      const moveDir = forward.clone().multiplyScalar(-this.velocity.z)
        .add(right.clone().multiplyScalar(this.velocity.x))
      if (moveDir.length() > 0.01) {
        const targetAngle = Math.atan2(moveDir.x, moveDir.z)
        const currentAngle = this.character.rotation.y
        const angleDiff = targetAngle - currentAngle
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff))
        this.character.rotation.y += normalizedDiff * 0.1
      }
    }
    
    // 保持在当前楼层高度
    this.character.position.y = this.currentFloorY
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
