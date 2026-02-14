# 漫游模式学习指南

> 苏格拉底式教学：通过提问引导你理解第三人称漫游与碰撞检测的实现

## 第一部分：角色模型加载

### 问题 1：为什么角色模型要异步加载？

看这段代码：

```typescript
export class CharacterController {
  constructor(modelName?: string) {
    // 创建一个临时的空组作为占位符
    this.character = new THREE.Group()
    this.character.name = 'character'
    
    // 异步加载真实模型
    this.modelName = modelName || getRandomCharacterModel()
    this.loadModel()
  }
  
  private async loadModel(): Promise<void> {
    const result = await loadCharacterModel(this.modelName)
    // ...
  }
}
```

**为什么不在构造函数里直接 `await loadModel()`？为什么要先创建一个空的占位符？**

---

<details>
<summary>💡 点击查看引导</summary>

JavaScript 的限制：
- 构造函数不能是 `async` 的
- 不能在构造函数里 `await`

占位符的作用：
1. 构造函数立即返回，不阻塞调用者
2. 调用者可以立即将 `character` 添加到场景
3. 模型加载完成后，自动替换占位符内容

**这叫"延迟加载"模式**：先给一个空壳，内容稍后填充。

**追问**：如果模型加载失败怎么办？

</details>

---

### 问题 2：GLTFLoader 是如何工作的？

```typescript
export async function loadCharacterModel(modelName: string): Promise<CharacterModelResult> {
  const loader = new GLTFLoader()
  const modelPath = `${MODEL_BASE_PATH}${modelName}.glb`
  
  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => { resolve({ model: gltf.scene, animations: gltf.animations }) },
      (progress) => { /* 进度回调 */ },
      (error) => { reject(error) }
    )
  })
}
```

**为什么要用 `new Promise` 包装？`loader.load` 不是已经是异步的吗？**

---

<details>
<summary>💡 点击查看引导</summary>

`GLTFLoader.load()` 使用的是**回调风格**的异步：
- 成功时调用第二个参数（回调函数）
- 失败时调用第四个参数（错误回调）

但现代 JavaScript 更喜欢 **Promise 风格**：
- 可以用 `await` 等待
- 可以用 `try-catch` 处理错误
- 代码更线性，更易读

`new Promise` 的作用：将回调风格转换为 Promise 风格。

**这叫"Promise 化"（Promisification）**：把老式回调 API 包装成 Promise。

</details>

---

## 第二部分：动画系统

### 问题 3：AnimationMixer 是什么？

```typescript
if (animations.length > 0) {
  this.mixer = new THREE.AnimationMixer(model)
  
  animations.forEach(clip => {
    const action = this.mixer!.clipAction(clip)
    this.animations.set(clip.name, action)
  })
  
  this.playAnimation('Idle')
}
```

**为什么需要 AnimationMixer？直接播放动画不行吗？**

---

<details>
<summary>💡 点击查看引导</summary>

Three.js 的动画系统有三个核心概念：

1. **AnimationClip**：动画数据（关键帧、时长等）
2. **AnimationAction**：动画的播放控制器（播放、暂停、循环等）
3. **AnimationMixer**：动画混合器，管理多个 Action

为什么需要 Mixer？
- 一个角色可能有多个动画（走路、跑步、站立）
- 需要在动画之间平滑过渡
- 需要同时播放多个动画（比如走路 + 挥手）

**类比**：Mixer 就像 DJ 的调音台，可以混合多个音轨。

</details>

---

### 问题 4：动画切换时为什么要 fadeIn/fadeOut？

```typescript
playAnimation(name: string): boolean {
  const action = this.animations.get(name)
  if (!action) return false
  
  if (this.currentAction && this.currentAction !== action) {
    this.currentAction.fadeOut(0.2)  // 淡出当前动画
  }
  
  action.reset().fadeIn(0.2).play()  // 淡入新动画
  this.currentAction = action
  return true
}
```

**如果直接 `stop()` 当前动画，然后 `play()` 新动画会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

直接切换的问题：
- 角色会"跳"到新动画的第一帧
- 看起来很生硬，不自然

`fadeIn/fadeOut` 的效果：
- 0.2 秒内，旧动画权重从 1 降到 0
- 同时，新动画权重从 0 升到 1
- 两个动画混合，产生平滑过渡

**视觉效果**：角色从站立自然过渡到走路，而不是突然"切换"。

**追问**：`action.reset()` 做了什么？为什么需要它？

</details>

---

## 第三部分：移动控制

### 问题 5：移动状态为什么用布尔值而不是向量？

```typescript
public moveForward: boolean = false
public moveBackward: boolean = false
public moveLeft: boolean = false
public moveRight: boolean = false
```

**为什么不直接用一个 `direction: Vector3` 来表示移动方向？**

---

<details>
<summary>💡 点击查看引导</summary>

布尔值的好处：

1. **直接映射键盘输入**：
   - W 键按下 → `moveForward = true`
   - W 键松开 → `moveForward = false`

2. **支持同时按多个键**：
   - W + D 同时按下 → 右前方移动
   - 如果用向量，需要自己计算合成方向

3. **解耦输入和移动**：
   - 输入系统只管设置布尔值
   - 移动系统根据布尔值计算方向

```typescript
this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
this.direction.normalize()
```

**这叫"输入抽象"**：把具体的键盘事件转换为抽象的移动意图。

</details>

---

### 问题 6：为什么移动要考虑相机朝向？

```typescript
if (cameraYaw !== undefined) {
  forward = new THREE.Vector3(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw))
  right = new THREE.Vector3(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw))
} else {
  forward = new THREE.Vector3(0, 0, -1)
  forward.applyQuaternion(this.character.quaternion)
}
```

**如果不考虑相机朝向，按 W 键会发生什么？**

---

<details>
<summary>💡 点击查看引导</summary>

不考虑相机朝向的问题：
- 按 W 键，角色总是向世界坐标的 -Z 方向移动
- 但相机可能已经旋转了
- 用户期望"向前"是屏幕上方，而不是世界的某个固定方向

考虑相机朝向后：
- "向前"变成相机看的方向
- 用户按 W，角色向屏幕上方移动
- 这符合第三人称游戏的操作习惯

**这叫"相机相对控制"**：移动方向相对于相机，而不是世界坐标。

</details>

---

## 第四部分：碰撞检测

### 问题 7：边界检测是如何工作的？

```typescript
setBoundary(outline: Point2D[]): void {
  if (outline && outline.length >= 3) {
    this.boundary = {
      vertices: outline,
      isClosed: true,
    }
  }
}

private isInsideBoundary(x: number, z: number): boolean {
  const point2D: Point2D = { x: x, y: -z }
  
  if (this.boundary && !isPointInside(point2D, this.boundary)) {
    return false
  }
  
  return true
}
```

**为什么用 2D 多边形来检测 3D 空间的碰撞？**

---

<details>
<summary>💡 点击查看引导</summary>

简化假设：
- 商城是一个平面（地板）
- 角色只在地板上移动，不会飞
- 边界是垂直的墙壁

所以：
- 只需要检测 X-Z 平面上的位置
- Y 轴（高度）不影响碰撞
- 2D 检测比 3D 检测简单得多

`isPointInside` 使用的是**射线法**：
- 从点向任意方向发射一条射线
- 数射线与多边形边的交点数
- 奇数 = 在内部，偶数 = 在外部

**追问**：为什么 `y: -z`？为什么要取负？

</details>

---

### 问题 8：为什么要检测多个点而不是一个点？

```typescript
const checkPoints = [
  { x: newX, z: newZ },                           // 中心
  { x: newX + this.collisionRadius, z: newZ },    // 右
  { x: newX - this.collisionRadius, z: newZ },    // 左
  { x: newX, z: newZ + this.collisionRadius },    // 前
  { x: newX, z: newZ - this.collisionRadius },    // 后
]

let canMove = true
for (const pt of checkPoints) {
  if (!this.isInsideBoundary(pt.x, pt.z)) {
    canMove = false
    break
  }
}
```

**只检测角色中心点不行吗？**

---

<details>
<summary>💡 点击查看引导</summary>

只检测中心点的问题：
- 角色有"体积"（`collisionRadius = 0.5`）
- 中心点在边界内，但身体可能已经穿墙了

检测 5 个点的效果：
- 模拟角色的"碰撞圆"
- 任何一个点出界，就不能移动
- 角色不会穿墙

**这叫"采样碰撞检测"**：用有限的采样点近似连续的碰撞体。

**追问**：为什么是 5 个点？4 个点（上下左右）不够吗？

</details>

---

### 问题 9：滑动碰撞是如何实现的？

```typescript
if (canMove) {
  this.character.position.x = newX
  this.character.position.z = newZ
} else {
  // 尝试滑动
  const canMoveX = this.isInsideBoundary(newX, currentPos.z)
  const canMoveZ = this.isInsideBoundary(currentPos.x, newZ)
  
  if (canMoveX) {
    this.character.position.x = newX
  }
  if (canMoveZ) {
    this.character.position.z = newZ
  }
}
```

**如果不实现滑动，角色碰到墙会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

不实现滑动的问题：
- 角色斜着撞墙，完全停住
- 用户体验很差，感觉"卡住了"

滑动的效果：
- 斜着撞墙时，分解为 X 和 Z 两个方向
- 如果 X 方向可以移动，就只移动 X
- 角色会沿着墙壁"滑动"

**视觉效果**：角色贴着墙走，而不是被墙"粘住"。

**这叫"碰撞响应"**：检测到碰撞后，如何调整移动。

</details>

---

## 第五部分：角色朝向

### 问题 10：角色是如何面向移动方向的？

```typescript
// 使用输入意图（direction）而非 velocity 计算目标朝向，
// 避免阻尼衰减和帧率波动导致 velocity 方向抖动引起角色突然转身
if (isMoving) {
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
```

**为什么用 `direction`（输入意图）而不是 `velocity`（实际速度）来计算朝向？**

---

<details>
<summary>💡 点击查看引导</summary>

旧实现用 `velocity` 计算朝向，存在一个问题：
- `velocity` 受阻尼衰减影响，松开按键后会逐帧衰减到 0
- 衰减过程中 `velocity` 的方向可能因浮点精度和帧率波动而抖动
- 这会导致角色在停下来的瞬间突然转身

改用 `direction`（键盘输入的原始方向意图）：
- `direction` 只有按键按下时才有值，松开立刻归零
- 不受阻尼和帧率影响，方向稳定
- `isMoving` 为 false 时不会进入朝向计算，避免了抖动

**为什么不直接 `this.character.rotation.y = targetAngle`？为什么要乘以 0.1？**

直接设置的问题：
- 角色会"瞬间"转向
- 看起来很机械，不自然

乘以 0.1 的效果：
- 每帧只转动差值的 10%
- 多帧累积，平滑转向
- 角色会"渐渐"面向移动方向

`normalizedDiff` 的作用：
- 角度差可能是 350° 或 -350°
- 但实际上只需要转 10°
- `atan2(sin, cos)` 把角度归一化到 [-π, π]

**这叫"插值转向"**：用线性插值实现平滑旋转。

**为什么还要对 `rotation.y` 本身做归一化？**

`rotation.y += normalizedDiff * 0.1` 是累加操作，长时间旋转后 `rotation.y` 可能超出 `[-π, π]` 范围（比如累积到 10π）。虽然 `normalizedDiff` 本身是归一化的，但 `currentAngle` 越界后，下一帧的 `angleDiff = targetAngle - currentAngle` 会产生异常大的值，导致角色突然跳转或抖动。每帧归一化 `rotation.y` 可以防止这种累积越界。

</details>

---

## 动手练习

现在你理解了漫游模式的实现，试着完成这些练习：

### 练习 1：添加跳跃功能
- 按空格键跳跃
- 实现简单的重力和落地检测
- 跳跃时播放跳跃动画

<details>
<summary>📝 参考答案</summary>

```typescript
export class CharacterController {
  // 新增属性
  private velocityY: number = 0           // 垂直速度
  private isGrounded: boolean = true      // 是否在地面
  private jumpForce: number = 8           // 跳跃力度
  private gravity: number = 20            // 重力加速度
  private groundLevel: number = 0         // 地面高度

  // 跳跃方法
  jump(): void {
    if (this.isGrounded) {
      this.velocityY = this.jumpForce
      this.isGrounded = false
      this.playAnimation('Jump')  // 播放跳跃动画
    }
  }

  // 修改 update 方法，添加垂直运动
  update(delta: number, cameraYaw?: number): void {
    // ... 原有的水平移动逻辑 ...

    // 垂直运动（重力 + 跳跃）
    if (!this.isGrounded) {
      // 应用重力
      this.velocityY -= this.gravity * delta
      
      // 更新垂直位置
      this.character.position.y += this.velocityY * delta

      // 落地检测
      if (this.character.position.y <= this.groundLevel) {
        this.character.position.y = this.groundLevel
        this.velocityY = 0
        this.isGrounded = true
        
        // 落地后恢复动画
        if (this.isMoving()) {
          this.playAnimation('Walk')
        } else {
          this.playAnimation('Idle')
        }
      }
    }

    // 更新动画混合器
    if (this.mixer) {
      this.mixer.update(delta)
    }
  }

  private isMoving(): boolean {
    return this.moveForward || this.moveBackward || this.moveLeft || this.moveRight
  }
}

// 键盘事件处理
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'Space':
      event.preventDefault()  // 防止页面滚动
      characterController.jump()
      break
    // ... 其他按键处理
  }
})
```

**关键点**：
- `velocityY`：垂直速度，跳跃时设为正值，重力使其逐渐减小
- `isGrounded`：防止空中二段跳
- 重力公式：`velocityY -= gravity * delta`（速度随时间减小）
- 位置更新：`position.y += velocityY * delta`
- 落地检测：`position.y <= groundLevel` 时停止下落
- 动画切换：跳跃时播放 Jump，落地后根据移动状态切换

</details>

---

### 练习 2：添加冲刺功能
- 按 Shift 键加速移动
- 冲刺时播放跑步动画
- 添加体力条，冲刺消耗体力

<details>
<summary>📝 参考答案</summary>

```typescript
export class CharacterController {
  // 新增属性
  public isSprinting: boolean = false
  private walkSpeed: number = 3
  private sprintSpeed: number = 6
  private stamina: number = 100           // 当前体力
  private maxStamina: number = 100        // 最大体力
  private staminaDrain: number = 20       // 每秒消耗体力
  private staminaRegen: number = 15       // 每秒恢复体力
  private minStaminaToSprint: number = 10 // 最低冲刺体力

  // 体力 UI
  private staminaBar: HTMLDivElement | null = null

  constructor() {
    // ... 原有构造函数代码 ...
    this.createStaminaUI()
  }

  private createStaminaUI(): void {
    this.staminaBar = document.createElement('div')
    this.staminaBar.innerHTML = `
      <div class="stamina-container">
        <div class="stamina-fill"></div>
      </div>
    `
    
    const style = document.createElement('style')
    style.textContent = `
      .stamina-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 10px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 5px;
        overflow: hidden;
      }
      .stamina-fill {
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #f39c12, #f1c40f);
        transition: width 0.1s;
      }
      .stamina-fill.low {
        background: linear-gradient(90deg, #e74c3c, #c0392b);
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(this.staminaBar)
  }

  private updateStaminaUI(): void {
    if (!this.staminaBar) return
    
    const fill = this.staminaBar.querySelector('.stamina-fill') as HTMLDivElement
    const percent = (this.stamina / this.maxStamina) * 100
    fill.style.width = `${percent}%`
    
    // 体力低时变红
    if (percent < 30) {
      fill.classList.add('low')
    } else {
      fill.classList.remove('low')
    }
  }

  // 开始/停止冲刺
  setSprinting(sprinting: boolean): void {
    if (sprinting && this.stamina >= this.minStaminaToSprint) {
      this.isSprinting = true
    } else {
      this.isSprinting = false
    }
  }

  update(delta: number, cameraYaw?: number): void {
    const isMoving = this.moveForward || this.moveBackward || 
                     this.moveLeft || this.moveRight

    // 体力管理
    if (this.isSprinting && isMoving) {
      // 冲刺消耗体力
      this.stamina -= this.staminaDrain * delta
      
      if (this.stamina <= 0) {
        this.stamina = 0
        this.isSprinting = false  // 体力耗尽，停止冲刺
      }
    } else {
      // 恢复体力
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * delta)
    }
    
    this.updateStaminaUI()

    // 根据冲刺状态选择速度
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed

    // 动画切换
    if (isMoving) {
      if (this.isSprinting) {
        this.playAnimation('Run')
      } else {
        this.playAnimation('Walk')
      }
    } else {
      this.playAnimation('Idle')
    }

    // ... 原有的移动计算逻辑，使用 currentSpeed ...
    
    if (this.direction.length() > 0) {
      this.direction.normalize()
      
      const moveVector = new THREE.Vector3()
      moveVector.addScaledVector(forward, -this.direction.z)
      moveVector.addScaledVector(right, this.direction.x)
      moveVector.normalize()
      moveVector.multiplyScalar(currentSpeed * delta)
      
      // ... 碰撞检测和位置更新 ...
    }
  }

  // 清理 UI
  dispose(): void {
    if (this.staminaBar) {
      this.staminaBar.remove()
    }
  }
}

// 键盘事件处理
document.addEventListener('keydown', (event) => {
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    characterController.setSprinting(true)
  }
})

document.addEventListener('keyup', (event) => {
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    characterController.setSprinting(false)
  }
})
```

**关键点**：
- 双速度系统：`walkSpeed` 和 `sprintSpeed`
- 体力消耗：冲刺时每秒减少 `staminaDrain`
- 体力恢复：不冲刺时每秒恢复 `staminaRegen`
- 最低体力限制：体力低于阈值时无法开始冲刺
- UI 反馈：体力条显示当前体力，低体力时变红
- 动画切换：冲刺时播放 Run，普通移动播放 Walk

</details>

---

### 练习 3：实现楼层切换
- 检测角色是否在电梯/扶梯区域
- 按 E 键触发楼层切换
- 平滑过渡到新楼层高度

<details>
<summary>📝 参考答案</summary>

```typescript
interface FloorTransition {
  id: string
  type: 'elevator' | 'escalator'
  position: THREE.Vector3      // 交互区域中心
  radius: number               // 交互范围
  targetFloor: number          // 目标楼层
  targetHeight: number         // 目标高度
}

export class CharacterController {
  // 新增属性
  private currentFloor: number = 1
  private floorTransitions: FloorTransition[] = []
  private isTransitioning: boolean = false
  private transitionDuration: number = 2  // 过渡时间（秒）
  private nearbyTransition: FloorTransition | null = null

  // 交互提示 UI
  private interactionHint: HTMLDivElement | null = null

  constructor() {
    // ... 原有构造函数代码 ...
    this.createInteractionHintUI()
  }

  private createInteractionHintUI(): void {
    this.interactionHint = document.createElement('div')
    this.interactionHint.className = 'interaction-hint'
    this.interactionHint.textContent = '按 E 键乘坐电梯'
    this.interactionHint.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 14px;
      display: none;
    `
    document.body.appendChild(this.interactionHint)
  }

  // 注册楼层切换点
  registerFloorTransition(transition: FloorTransition): void {
    this.floorTransitions.push(transition)
  }

  // 检测是否在交互区域内
  private checkNearbyTransitions(): void {
    if (this.isTransitioning) return

    const charPos = this.character.position
    
    for (const transition of this.floorTransitions) {
      const distance = new THREE.Vector2(
        charPos.x - transition.position.x,
        charPos.z - transition.position.z
      ).length()

      if (distance <= transition.radius) {
        this.nearbyTransition = transition
        this.showInteractionHint(transition)
        return
      }
    }

    this.nearbyTransition = null
    this.hideInteractionHint()
  }

  private showInteractionHint(transition: FloorTransition): void {
    if (!this.interactionHint) return
    
    const action = transition.type === 'elevator' ? '乘坐电梯' : '乘坐扶梯'
    this.interactionHint.textContent = `按 E 键${action}到 ${transition.targetFloor} 楼`
    this.interactionHint.style.display = 'block'
  }

  private hideInteractionHint(): void {
    if (this.interactionHint) {
      this.interactionHint.style.display = 'none'
    }
  }

  // 触发楼层切换
  interact(): void {
    if (!this.nearbyTransition || this.isTransitioning) return

    this.startFloorTransition(this.nearbyTransition)
  }

  private async startFloorTransition(transition: FloorTransition): Promise<void> {
    this.isTransitioning = true
    this.hideInteractionHint()

    const startHeight = this.character.position.y
    const targetHeight = transition.targetHeight
    const startTime = performance.now()

    // 播放电梯/扶梯动画（如果有）
    this.playAnimation('Idle')

    // 平滑过渡动画
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000
      const progress = Math.min(elapsed / this.transitionDuration, 1)
      
      // 使用 easeInOutCubic 缓动函数
      const eased = this.easeInOutCubic(progress)
      
      // 更新高度
      this.character.position.y = startHeight + (targetHeight - startHeight) * eased

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // 过渡完成
        this.character.position.y = targetHeight
        this.currentFloor = transition.targetFloor
        this.isTransitioning = false
        
        console.log(`已到达 ${this.currentFloor} 楼`)
      }
    }

    animate()
  }

  // 缓动函数：先加速后减速
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  update(delta: number, cameraYaw?: number): void {
    // 过渡中禁止移动
    if (this.isTransitioning) {
      if (this.mixer) this.mixer.update(delta)
      return
    }

    // 检测附近的楼层切换点
    this.checkNearbyTransitions()

    // ... 原有的移动逻辑 ...
  }

  getCurrentFloor(): number {
    return this.currentFloor
  }

  dispose(): void {
    if (this.interactionHint) {
      this.interactionHint.remove()
    }
  }
}

// 键盘事件处理
document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyE') {
    characterController.interact()
  }
})

// 使用示例：注册电梯
characterController.registerFloorTransition({
  id: 'elevator-1',
  type: 'elevator',
  position: new THREE.Vector3(10, 0, 5),  // 电梯位置
  radius: 2,                               // 2米交互范围
  targetFloor: 2,
  targetHeight: 5                          // 2楼高度
})

characterController.registerFloorTransition({
  id: 'elevator-1-down',
  type: 'elevator',
  position: new THREE.Vector3(10, 5, 5),  // 2楼电梯位置
  radius: 2,
  targetFloor: 1,
  targetHeight: 0                          // 1楼高度
})
```

**关键点**：
- `FloorTransition` 定义交互区域和目标楼层
- 距离检测：计算角色与交互点的 2D 距离
- 交互提示：进入范围时显示按键提示
- 平滑过渡：使用 `requestAnimationFrame` + 缓动函数
- 过渡锁定：`isTransitioning` 防止过渡中移动或重复触发
- 缓动函数：`easeInOutCubic` 让过渡更自然（先加速后减速）

**扩展思路**：
- 添加电梯门开关动画
- 扶梯可以实现持续移动（不需要按键）
- 多楼层选择 UI（电梯面板）

</details>

---

## 关键文件

| 文件 | 说明 | 跳转 |
|------|------|------|
| character-model.ts | 角色模型与控制器 | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/character-model.ts) |
| polygon.ts | 多边形碰撞检测 | [查看](../../apps/frontend/SMART-MALL/src/builder/geometry/polygon.ts) |
| types.ts | 几何类型定义 | [查看](../../apps/frontend/SMART-MALL/src/builder/geometry/types.ts) |

### 相机控制

| 文件 | 说明 | 跳转 |
|------|------|------|
| CameraController.ts | 跟随相机控制器 | [查看](../../apps/frontend/SMART-MALL/src/engine/camera/CameraController.ts) |

### 渲染

| 文件 | 说明 | 跳转 |
|------|------|------|
| roaming-renderer.ts | 漫游模式渲染器 | [查看](../../apps/frontend/SMART-MALL/src/builder/rendering/roaming-renderer.ts) |
| polygon-to-three.ts | 多边形转 Three.js 对象 | [查看](../../apps/frontend/SMART-MALL/src/builder/rendering/polygon-to-three.ts) |

---

*"认识你自己的边界，才能自由地移动。" —— 改编自苏格拉底*
