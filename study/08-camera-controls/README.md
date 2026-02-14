# 相机控制学习指南

> 苏格拉底式教学：通过提问引导你理解 3D 相机控制的实现

## 第一部分：理解问题

### 问题 1：为什么需要相机控制器？

在 3D 场景中，相机决定了用户"看到什么"。

**如果相机固定不动，用户体验会怎样？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

固定相机的问题：
- 只能看到一个角度
- 无法查看物体的背面
- 无法放大细节
- 无法跟随移动的物体

相机控制器的作用：
- 让用户可以旋转视角
- 让用户可以缩放
- 让相机跟随目标移动
- 实现平滑的相机动画

**两种主要模式**：
- **轨道模式（Orbit）**：相机围绕一个点旋转，适合查看模型
- **跟随模式（Follow）**：相机跟随目标移动，适合漫游

</details>

---

### 问题 2：Yaw 和 Pitch 是什么？

```typescript
private yaw: number = 0    // 水平旋转角度
private pitch: number = 0.3  // 垂直旋转角度
```

**这两个角度分别控制什么？**

---

<details>
<summary>💡 点击查看引导</summary>

用飞机来类比：

```
        Pitch（俯仰）
           ↑
           │
    ←──────┼──────→ Yaw（偏航）
           │
           ↓
```

**Yaw（偏航）**：
- 水平旋转，左右转头
- 0 = 正北，π/2 = 正东，π = 正南

**Pitch（俯仰）**：
- 垂直旋转，上下点头
- 0 = 水平，正值 = 向上看，负值 = 向下看

**Roll（翻滚）**：
- 绕前后轴旋转，歪头
- 相机控制通常不用这个

**为什么要限制 Pitch？**
```typescript
pitchLimit: { min: -Math.PI / 3, max: Math.PI / 3 }
```
防止相机翻转（向上看超过 90° 会很奇怪）。

</details>

---

## 第二部分：第三人称跟随

### 问题 3：球面坐标是什么？

```typescript
private updateFollowCamera(): void {
  const horizontalDistance = distance * Math.cos(this.pitch)
  const verticalOffset = distance * Math.sin(this.pitch) + 2
  
  const idealPosition = new THREE.Vector3(
    targetPosition.x + Math.sin(this.yaw) * horizontalDistance,
    Math.max(targetPosition.y + verticalOffset, minHeight),
    targetPosition.z + Math.cos(this.yaw) * horizontalDistance
  )
}
```

**这段代码是如何计算相机位置的？**

---

<details>
<summary>💡 点击查看引导</summary>

想象一个以目标为圆心的球：

```
        相机
         *
        /|
       / |
      /  | verticalOffset
     /   |
    /    |
   *─────*───────→ horizontalDistance
 目标
```

**球面坐标转直角坐标**：

1. `horizontalDistance = distance * cos(pitch)`
   - 相机到目标的水平距离
   - pitch 越大（向上看），水平距离越小

2. `verticalOffset = distance * sin(pitch)`
   - 相机比目标高多少
   - pitch 越大，相机越高

3. 水平位置用 yaw 控制：
   - `x = sin(yaw) * horizontalDistance`
   - `z = cos(yaw) * horizontalDistance`

**结果**：相机在目标周围的球面上移动。

</details>

---

### 问题 4：`lerp` 是什么？为什么需要它？

```typescript
// smoothness >= 1 时直接设置位置（无延迟），否则 lerp 插值
if (smoothness >= 1) {
  this.camera.position.copy(idealPosition)
} else {
  this.camera.position.lerp(idealPosition, smoothness)
}
```

**如果直接 `this.camera.position.copy(idealPosition)` 会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

**直接复制的问题**：
- 相机瞬间移动到新位置
- 看起来很突兀
- 没有"跟随"的感觉

**`lerp`（线性插值）**：
```typescript
// lerp(target, alpha) 的含义：
// 当前位置向目标位置移动 alpha 的距离

position.lerp(target, 0.1)
// 每帧移动 10% 的距离
// 距离越远，移动越快
// 距离越近，移动越慢
// 永远不会完全到达（渐近）
```

效果：
- 相机平滑跟随
- 有"弹性"的感觉
- 更自然的运动

**`smoothness` 的影响**：
- 0.1：平滑跟随，有延迟
- 0.5：快速跟随，轻微延迟
- 1.0（及以上）：立即跟随，无延迟（直接 `copy`，跳过 `lerp`）

**为什么 `smoothness >= 1` 时用 `copy` 而不是 `lerp`？**

`lerp(target, 1.0)` 理论上等于直接到达目标，但浮点精度可能导致微小偏差。用 `copy` 更直接、更精确，也避免了不必要的插值计算。

</details>

---

## 第三部分：鼠标控制

### 问题 5：Pointer Lock API 是什么？

```typescript
public requestPointerLock(): void {
  this.container.requestPointerLock()
}

private handlePointerLockChange = (): void => {
  this.isPointerLocked = document.pointerLockElement !== null
}
```

**为什么需要锁定鼠标指针？**

---

<details>
<summary>💡 点击查看引导</summary>

普通鼠标事件的问题：
- 鼠标移到屏幕边缘就停了
- 无法无限旋转视角
- 鼠标指针会干扰视觉

**Pointer Lock API**：
- 隐藏鼠标指针
- 鼠标可以无限移动
- 获取相对移动量（`movementX`, `movementY`）

```typescript
private handleMouseMove = (event: MouseEvent): void => {
  if (!this.isPointerLocked) return
  
  // movementX/Y 是相对移动量，不是绝对位置
  // yaw 允许自由累积，sin/cos 是周期函数不受影响
  this.yaw -= event.movementX * mouseSensitivity
  // 鼠标向上移动（movementY 为负），pitch 减小，相机降低，视角向上看
  this.pitch += event.movementY * mouseSensitivity
}
```

**使用场景**：
- 第一人称游戏
- 3D 漫游
- 需要无限旋转的场景

**注意**：需要用户交互（如点击）才能请求锁定。

</details>

---

### 问题 6：为什么鼠标移动方向要这样处理？

```typescript
this.yaw -= event.movementX * mouseSensitivity
this.pitch += event.movementY * mouseSensitivity
```

**Yaw 为什么是 `-=`？Pitch 为什么是 `+=`？**

---

<details>
<summary>💡 点击查看引导</summary>

这是"自然映射"的问题，水平和垂直方向的映射逻辑不同：

**鼠标向右移动（Yaw）**：
- `movementX > 0`
- 用户期望：视角向右转
- 相机向右转 = yaw 减小
- 所以：`yaw -= movementX`

**鼠标向上移动（Pitch）**：
- `movementY < 0`（浏览器坐标系 Y 轴向下为正）
- 用户期望：视角向上看
- 相机向上看 = pitch 减小（球面坐标中 pitch 减小 → 相机降低 → 视角抬升）
- `movementY` 为负，`pitch += 负值` = pitch 减小 ✅
- 所以：`pitch += movementY`

**鼠标向下移动（Pitch）**：
- `movementY > 0`
- 用户期望：视角向下看
- 相机向下看 = pitch 增大
- `movementY` 为正，`pitch += 正值` = pitch 增大 ✅

**关键理解**：
- Yaw 取反是因为"鼠标右移 → 场景左转 → yaw 减小"
- Pitch 不取反是因为浏览器 Y 轴方向与球面坐标 pitch 方向天然匹配

**有些游戏有"反转 Y 轴"选项**：
```typescript
// 反转 Y 轴（飞行模拟器风格）
this.pitch -= event.movementY * mouseSensitivity
```

**为什么不需要归一化 Yaw？**

每帧累加 `yaw -= movementX * sensitivity`，长时间旋转后 yaw 值会无限增长（比如转了 100 圈后 yaw = 628.3）。但 `Math.sin` / `Math.cos` 是周期函数，对任意值都能正确计算，所以实际渲染不受影响。

之前的实现使用 `atan2(sin(θ), cos(θ))` 将 yaw 归一化到 `[-π, π]`，但这在某些场景下（如自动校正、插值动画直接比较 yaw 数值时）反而会因为 `-π` 到 `π` 的跳变产生异常行为。移除归一化后，yaw 自由累积，避免了这类跳变问题。

```typescript
// 旧写法（已移除）：归一化到 [-π, π]，可能导致跳变
// this.yaw = Math.atan2(Math.sin(this.yaw), Math.cos(this.yaw))

// 新写法：yaw 自由累积，sin/cos 周期性保证渲染正确
this.yaw -= event.movementX * mouseSensitivity
```

</details>

---

## 第四部分：相机动画

### 问题 7：相机动画是如何实现的？

```typescript
public animateTo(
  position: THREE.Vector3,
  lookAt: THREE.Vector3,
  options: CameraAnimationOptions
): Promise<void> {
  return new Promise((resolve) => {
    this.animation = {
      active: true,
      startTime: performance.now(),
      duration: options.duration,
      startPosition: this.camera.position.clone(),
      endPosition: position.clone(),
      startLookAt: currentLookAt,
      endLookAt: lookAt.clone(),
      easing: options.easing ?? Easing.easeInOut,
      onComplete: resolve
    }
  })
}
```

**为什么返回 Promise？**

---

<details>
<summary>💡 点击查看引导</summary>

返回 Promise 的好处：

```typescript
// 可以等待动画完成
await cameraController.animateTo(position, lookAt, { duration: 1000 })
console.log('动画完成！')

// 可以链式调用
await cameraController.animateTo(pos1, look1, { duration: 500 })
await cameraController.animateTo(pos2, look2, { duration: 500 })
await cameraController.animateTo(pos3, look3, { duration: 500 })

// 可以并行执行其他操作
cameraController.animateTo(position, lookAt, { duration: 1000 })
  .then(() => showUI())
```

**`onComplete: resolve`**：
- 动画完成时调用 `resolve`
- Promise 变为 fulfilled 状态
- `await` 继续执行

</details>

---

### 问题 8：缓动函数是什么？

```typescript
export const Easing = {
  linear: (t: number) => t,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3)
}
```

**`easeInOut` 和 `linear` 有什么区别？**

---

<details>
<summary>💡 点击查看引导</summary>

**线性（linear）**：
```
输入: 0.0 → 输出: 0.0
输入: 0.5 → 输出: 0.5
输入: 1.0 → 输出: 1.0
```
匀速运动，看起来机械。

**缓入缓出（easeInOut）**：
```
输入: 0.0 → 输出: 0.0   （开始慢）
输入: 0.25 → 输出: 0.125
输入: 0.5 → 输出: 0.5   （中间快）
输入: 0.75 → 输出: 0.875
输入: 1.0 → 输出: 1.0   （结束慢）
```
先加速后减速，更自然。

**图形表示**：
```
输出
  │      ___
  │    _/
  │  _/
  │_/
  └──────────→ 输入
     linear

输出
  │       __
  │     _/
  │   _/
  │__/
  └──────────→ 输入
    easeInOut
```

</details>

---

### 问题 9：动画更新是如何工作的？

```typescript
private updateAnimation(): void {
  const elapsed = performance.now() - this.animation.startTime
  const progress = Math.min(elapsed / this.animation.duration, 1)
  const easedProgress = this.animation.easing(progress)
  
  this.camera.position.lerpVectors(
    this.animation.startPosition,
    this.animation.endPosition,
    easedProgress
  )
  
  if (progress >= 1) {
    this.animation.onComplete?.()
    this.animation = null
  }
}
```

**`lerpVectors` 和 `lerp` 有什么区别？**

---

<details>
<summary>💡 点击查看引导</summary>

**`lerp(target, alpha)`**：
- 从当前位置向目标插值
- 修改自身
- `this = this + (target - this) * alpha`

**`lerpVectors(v1, v2, alpha)`**：
- 从 v1 向 v2 插值
- 结果存入自身
- `this = v1 + (v2 - v1) * alpha`

为什么动画用 `lerpVectors`？
- 需要从固定的起点插值
- `lerp` 会累积误差
- `lerpVectors` 每帧都从起点计算，更精确

```typescript
// lerp 的问题
position.lerp(end, 0.1)  // 第1帧：从当前位置
position.lerp(end, 0.1)  // 第2帧：从上一帧位置
// 永远不会精确到达终点

// lerpVectors 的好处
position.lerpVectors(start, end, 0.5)  // 精确在中点
position.lerpVectors(start, end, 1.0)  // 精确在终点
```

</details>

---

## 第五部分：资源清理

### 问题 10：为什么要移除事件监听器？

```typescript
public dispose(): void {
  document.removeEventListener('pointerlockchange', this.handlePointerLockChange)
  document.removeEventListener('mousemove', this.handleMouseMove)
  window.removeEventListener('resize', this.handleResize)
  
  this.exitPointerLock()
  this.animation = null
  this.followTarget = null
}
```

**如果不移除会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

问题：

1. **内存泄漏**
   - 事件监听器持有对 `this` 的引用
   - 控制器对象无法被垃圾回收
   - 内存占用越来越大

2. **幽灵事件**
   - 组件已销毁，但事件还在触发
   - 可能导致错误或意外行为
   - 控制台报错

3. **性能问题**
   - 每次鼠标移动都触发已废弃的处理器
   - 浪费 CPU

**最佳实践**：
- 添加监听器时，记住要移除
- 在 `dispose` 或 `onUnmounted` 中清理
- 使用箭头函数保持 `this` 引用

</details>

---

## 动手练习

### 练习 1：添加缩放功能
- 监听鼠标滚轮事件
- 调整相机距离
- 限制最小和最大距离

<details>
<summary>📝 参考答案</summary>

```typescript
// 在 CameraController 类中添加

private distance: number = 10
private minDistance: number = 2
private maxDistance: number = 50
private zoomSpeed: number = 1

public setZoomLimits(min: number, max: number): void {
  this.minDistance = min
  this.maxDistance = max
  // 确保当前距离在范围内
  this.distance = Math.max(min, Math.min(max, this.distance))
}

public setZoomSpeed(speed: number): void {
  this.zoomSpeed = speed
}

private handleWheel = (event: WheelEvent): void => {
  event.preventDefault()
  
  // deltaY > 0 表示向下滚动（缩小/远离）
  // deltaY < 0 表示向上滚动（放大/靠近）
  const delta = event.deltaY > 0 ? 1 : -1
  
  // 计算新距离
  const zoomFactor = 1 + delta * this.zoomSpeed * 0.1
  const newDistance = this.distance * zoomFactor
  
  // 限制范围
  this.distance = Math.max(
    this.minDistance,
    Math.min(this.maxDistance, newDistance)
  )
  
  // 如果是跟随模式，立即更新相机位置
  if (this.mode === 'follow') {
    this.updateFollowCamera()
  }
}

// 在构造函数中添加监听
constructor(camera: THREE.PerspectiveCamera, container: HTMLElement) {
  // ... 其他初始化
  
  this.container.addEventListener('wheel', this.handleWheel, { passive: false })
}

// 在 dispose 中移除监听
public dispose(): void {
  this.container.removeEventListener('wheel', this.handleWheel)
  // ... 其他清理
}

// 平滑缩放动画
public zoomTo(targetDistance: number, duration: number = 500): Promise<void> {
  return new Promise((resolve) => {
    const startDistance = this.distance
    const startTime = performance.now()
    
    const animate = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = Easing.easeOut(progress)
      
      this.distance = startDistance + (targetDistance - startDistance) * eased
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }
    
    animate()
  })
}
```

**使用示例**：

```typescript
const controller = new CameraController(camera, container)

// 设置缩放范围
controller.setZoomLimits(5, 30)

// 设置缩放速度
controller.setZoomSpeed(1.5)

// 平滑缩放到指定距离
await controller.zoomTo(15, 1000)
```

**关键点**：
- `passive: false` 允许 `preventDefault()` 阻止页面滚动
- 使用乘法因子而非加法，让缩放感觉更自然
- 限制最小最大距离防止相机穿透物体或太远
- 提供平滑缩放动画方法

</details>

---

### 练习 2：实现相机震动
- 创建一个 `shake()` 方法
- 让相机在一定范围内随机抖动
- 用于爆炸、碰撞等效果

<details>
<summary>📝 参考答案</summary>

```typescript
// 在 CameraController 类中添加

interface ShakeOptions {
  intensity: number    // 震动强度
  duration: number     // 持续时间（毫秒）
  frequency: number    // 震动频率
  decay: boolean       // 是否衰减
}

private shakeState: {
  active: boolean
  startTime: number
  options: ShakeOptions
  originalPosition: THREE.Vector3
} | null = null

/**
 * 触发相机震动效果
 */
public shake(options: Partial<ShakeOptions> = {}): Promise<void> {
  const defaultOptions: ShakeOptions = {
    intensity: 0.5,
    duration: 500,
    frequency: 25,
    decay: true,
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  return new Promise((resolve) => {
    this.shakeState = {
      active: true,
      startTime: performance.now(),
      options: finalOptions,
      originalPosition: this.camera.position.clone(),
    }
    
    const animate = () => {
      if (!this.shakeState?.active) {
        resolve()
        return
      }
      
      const elapsed = performance.now() - this.shakeState.startTime
      const progress = elapsed / this.shakeState.options.duration
      
      if (progress >= 1) {
        // 震动结束，恢复原位
        this.camera.position.copy(this.shakeState.originalPosition)
        this.shakeState = null
        resolve()
        return
      }
      
      // 计算当前强度（可选衰减）
      let currentIntensity = this.shakeState.options.intensity
      if (this.shakeState.options.decay) {
        currentIntensity *= (1 - progress)
      }
      
      // 使用正弦波 + 随机偏移产生震动
      const time = elapsed * this.shakeState.options.frequency * 0.001
      const offsetX = Math.sin(time * 1.1) * currentIntensity * (Math.random() * 0.5 + 0.5)
      const offsetY = Math.sin(time * 1.3) * currentIntensity * (Math.random() * 0.5 + 0.5)
      const offsetZ = Math.sin(time * 0.9) * currentIntensity * (Math.random() * 0.5 + 0.5)
      
      // 应用偏移
      this.camera.position.copy(this.shakeState.originalPosition)
      this.camera.position.x += offsetX
      this.camera.position.y += offsetY
      this.camera.position.z += offsetZ
      
      requestAnimationFrame(animate)
    }
    
    animate()
  })
}

/**
 * 停止震动
 */
public stopShake(): void {
  if (this.shakeState) {
    this.camera.position.copy(this.shakeState.originalPosition)
    this.shakeState.active = false
    this.shakeState = null
  }
}

/**
 * 预设震动效果
 */
public shakePresets = {
  // 轻微震动（如脚步）
  light: () => this.shake({ intensity: 0.1, duration: 200, decay: true }),
  
  // 中等震动（如碰撞）
  medium: () => this.shake({ intensity: 0.3, duration: 400, decay: true }),
  
  // 强烈震动（如爆炸）
  heavy: () => this.shake({ intensity: 0.8, duration: 800, decay: true }),
  
  // 持续震动（如地震）
  continuous: () => this.shake({ intensity: 0.2, duration: 2000, decay: false }),
}
```

**使用示例**：

```typescript
const controller = new CameraController(camera, container)

// 基本震动
await controller.shake()

// 自定义震动
await controller.shake({
  intensity: 1.0,
  duration: 1000,
  frequency: 30,
  decay: true,
})

// 使用预设
controller.shakePresets.heavy()

// 停止震动
controller.stopShake()
```

**关键点**：
- 保存原始位置，震动结束后恢复
- 使用正弦波 + 随机偏移产生自然的震动
- 支持强度衰减，让震动逐渐平息
- 提供预设方便快速使用

</details>

---

### 练习 3：添加相机边界
- 限制相机不能移出场景范围
- 到达边界时平滑停止

<details>
<summary>📝 参考答案</summary>

```typescript
// 在 CameraController 类中添加

interface CameraBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

private bounds: CameraBounds | null = null
private boundaryDamping: number = 0.8 // 边界阻尼

/**
 * 设置相机移动边界
 */
public setBounds(bounds: CameraBounds): void {
  this.bounds = bounds
}

/**
 * 从场景包围盒自动设置边界
 */
public setBoundsFromScene(scene: THREE.Scene, padding: number = 5): void {
  const box = new THREE.Box3().setFromObject(scene)
  
  this.bounds = {
    minX: box.min.x - padding,
    maxX: box.max.x + padding,
    minY: Math.max(box.min.y, 1), // 至少离地 1 单位
    maxY: box.max.y + padding * 2,
    minZ: box.min.z - padding,
    maxZ: box.max.z + padding,
  }
}

/**
 * 清除边界限制
 */
public clearBounds(): void {
  this.bounds = null
}

/**
 * 将位置限制在边界内
 */
private clampToBounds(position: THREE.Vector3): THREE.Vector3 {
  if (!this.bounds) return position
  
  return new THREE.Vector3(
    Math.max(this.bounds.minX, Math.min(this.bounds.maxX, position.x)),
    Math.max(this.bounds.minY, Math.min(this.bounds.maxY, position.y)),
    Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, position.z))
  )
}

/**
 * 计算边界反弹力（软边界）
 */
private calculateBoundaryForce(position: THREE.Vector3): THREE.Vector3 {
  if (!this.bounds) return new THREE.Vector3()
  
  const force = new THREE.Vector3()
  const strength = 0.1
  
  // X 轴
  if (position.x < this.bounds.minX) {
    force.x = (this.bounds.minX - position.x) * strength
  } else if (position.x > this.bounds.maxX) {
    force.x = (this.bounds.maxX - position.x) * strength
  }
  
  // Y 轴
  if (position.y < this.bounds.minY) {
    force.y = (this.bounds.minY - position.y) * strength
  } else if (position.y > this.bounds.maxY) {
    force.y = (this.bounds.maxY - position.y) * strength
  }
  
  // Z 轴
  if (position.z < this.bounds.minZ) {
    force.z = (this.bounds.minZ - position.z) * strength
  } else if (position.z > this.bounds.maxZ) {
    force.z = (this.bounds.maxZ - position.z) * strength
  }
  
  return force
}

// 修改 updateFollowCamera 方法
private updateFollowCamera(): void {
  if (!this.followTarget) return
  
  // ... 计算理想位置的代码 ...
  
  // 应用边界限制（硬边界）
  const clampedPosition = this.clampToBounds(idealPosition)
  
  // 或者使用软边界（更平滑）
  const boundaryForce = this.calculateBoundaryForce(this.camera.position)
  idealPosition.add(boundaryForce)
  
  // 平滑移动
  this.camera.position.lerp(clampedPosition, this.smoothness)
}

/**
 * 检查位置是否在边界内
 */
public isInBounds(position: THREE.Vector3): boolean {
  if (!this.bounds) return true
  
  return (
    position.x >= this.bounds.minX &&
    position.x <= this.bounds.maxX &&
    position.y >= this.bounds.minY &&
    position.y <= this.bounds.maxY &&
    position.z >= this.bounds.minZ &&
    position.z <= this.bounds.maxZ
  )
}

/**
 * 获取到最近边界的距离
 */
public getDistanceToBoundary(position: THREE.Vector3): number {
  if (!this.bounds) return Infinity
  
  const distances = [
    position.x - this.bounds.minX,
    this.bounds.maxX - position.x,
    position.y - this.bounds.minY,
    this.bounds.maxY - position.y,
    position.z - this.bounds.minZ,
    this.bounds.maxZ - position.z,
  ]
  
  return Math.min(...distances)
}
```

**使用示例**：

```typescript
const controller = new CameraController(camera, container)

// 手动设置边界
controller.setBounds({
  minX: -50, maxX: 50,
  minY: 1, maxY: 30,
  minZ: -50, maxZ: 50,
})

// 从场景自动计算边界
controller.setBoundsFromScene(scene, 10)

// 检查是否在边界内
if (!controller.isInBounds(camera.position)) {
  console.log('相机超出边界！')
}

// 获取到边界的距离
const distance = controller.getDistanceToBoundary(camera.position)
if (distance < 5) {
  console.log('接近边界')
}

// 清除边界
controller.clearBounds()
```

**关键点**：
- 硬边界：直接限制位置，相机不能超出
- 软边界：使用反弹力，相机可以稍微超出但会被推回
- 从场景自动计算边界更方便
- 提供边界检测方法用于 UI 提示

</details>

---

## 关键文件

| 文件 | 说明 | 跳转 |
|------|------|------|
| CameraController.ts | 跟随相机控制器（第三人称） | [查看](../../apps/frontend/SMART-MALL/src/engine/camera/CameraController.ts) |
| OrbitController.ts | 轨道相机控制器（围绕目标旋转） | [查看](../../apps/frontend/SMART-MALL/src/engine/camera/OrbitController.ts) |
| index.ts | 相机模块导出 | [查看](../../apps/frontend/SMART-MALL/src/engine/camera/index.ts) |

---

*"认识你自己。" —— 德尔斐神谕（苏格拉底常引用）*
