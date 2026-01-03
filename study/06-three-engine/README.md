# Three.js 引擎封装学习指南

> 苏格拉底式教学：通过提问引导你理解 3D 引擎的封装设计

## 第一部分：理解问题

### 问题 1：为什么要封装 Three.js？

Three.js 本身已经是一个库了，为什么还要再封装一层 `ThreeEngine` 类？

**直接在组件里用 Three.js 不行吗？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

直接使用的问题：

```vue
<script setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

onMounted(() => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(...)
  const renderer = new THREE.WebGLRenderer(...)
  const controls = new OrbitControls(...)
  
  // 设置光源...
  // 设置渲染循环...
  // 处理窗口大小变化...
  // 清理资源...
})
</script>
```

问题：
- 每个 3D 页面都要写一遍这些代码
- 初始化逻辑和业务逻辑混在一起
- 资源清理容易遗漏
- 难以复用和测试

**封装的好处**：
- 隐藏复杂的初始化细节
- 提供简洁的 API
- 统一管理资源生命周期
- 业务代码更清晰

</details>

---

### 问题 2：3D 场景的核心组件是什么？

看 `ThreeEngine` 的私有属性：

```typescript
private scene: THREE.Scene
private renderer: THREE.WebGLRenderer
private camera: THREE.PerspectiveCamera
private clock: THREE.Clock
```

**这四个对象分别是什么？它们之间是什么关系？**

---

<details>
<summary>💡 点击查看引导</summary>

用电影拍摄来类比：

| Three.js | 电影拍摄 | 作用 |
|----------|----------|------|
| Scene | 摄影棚 | 放置所有物体、灯光的容器 |
| Camera | 摄像机 | 决定从哪个角度看场景 |
| Renderer | 胶片/屏幕 | 把摄像机看到的画面输出 |
| Clock | 计时器 | 计算每帧的时间间隔 |

关系：
```
Scene（舞台）
  ├── 物体1
  ├── 物体2
  ├── 灯光
  └── ...

Camera（摄像机）→ 看向 Scene

Renderer（渲染器）→ 把 Camera 看到的 Scene 画出来
```

**核心公式**：`renderer.render(scene, camera)`

</details>

---

## 第二部分：相机与视角

### 问题 3：透视相机的参数是什么意思？

```typescript
const camera = new THREE.PerspectiveCamera(
  60,                           // FOV
  clientWidth / clientHeight,   // aspect
  0.1,                          // near
  1000                          // far
)
```

**这四个参数分别控制什么？**

---

<details>
<summary>💡 点击查看引导</summary>

想象你在看一个锥形的"视野"：

```
        near                far
          │                  │
    ┌─────┼──────────────────┼─────┐
    │     │                  │     │
    │  ┌──┴──┐          ┌────┴────┐│
    │  │     │          │         ││
眼睛→  │ FOV │          │         ││
    │  │     │          │         ││
    │  └──┬──┘          └────┬────┘│
    │     │                  │     │
    └─────┼──────────────────┼─────┘
          │                  │
```

- **FOV (Field of View)**：视野角度，60° 类似人眼
- **aspect**：宽高比，保持画面不变形
- **near**：近裁剪面，比这更近的物体不显示
- **far**：远裁剪面，比这更远的物体不显示

**为什么需要 near 和 far？**
- 性能优化：不渲染看不到的物体
- 避免 Z-fighting（深度冲突）

</details>

---

### 问题 4：两种相机模式有什么区别？

```typescript
export type CameraMode = 'orbit' | 'follow'
```

**什么时候用 orbit？什么时候用 follow？**

---

<details>
<summary>💡 点击查看引导</summary>

**Orbit（轨道模式）**：
- 相机围绕一个点旋转
- 用户可以拖拽旋转视角
- 适合：建模器、查看 3D 模型
- 类比：你绕着雕塑走一圈观察

**Follow（跟随模式）**：
- 相机跟随一个目标移动
- 目标移动，相机也移动
- 适合：第三人称游戏、漫游模式
- 类比：摄像师跟拍演员

```typescript
// 切换模式
engine.setCameraMode('follow')

// 设置跟随目标
engine.setFollowTarget(characterModel)
```

</details>

---

## 第三部分：渲染循环

### 问题 5：什么是渲染循环？

```typescript
private animate = (): void => {
  if (!this.isRunning) return
  
  this.animationFrameId = requestAnimationFrame(this.animate)
  
  const delta = this.clock.getDelta()
  
  // UPDATE 阶段
  this.orbitController?.update()
  this.onRenderCallbacks.forEach((cb) => cb(delta))
  
  // RENDER 阶段
  if (this.needsRender) {
    this.renderer.render(this.scene, this.camera)
    this.needsRender = false
  }
}
```

**为什么需要"循环"？一次渲染不够吗？**

---

<details>
<summary>💡 点击查看引导</summary>

3D 场景是"活的"：

- 物体在移动
- 相机在旋转
- 动画在播放
- 用户在交互

如果只渲染一次：
- 画面是静止的
- 用户拖拽相机，画面不更新
- 动画不会播放

**渲染循环**：每秒渲染 60 次（60 FPS），让画面"动起来"。

```
第1帧 → 更新位置 → 渲染 → 显示
第2帧 → 更新位置 → 渲染 → 显示
第3帧 → 更新位置 → 渲染 → 显示
...
```

**`requestAnimationFrame`**：浏览器 API，在下一次重绘前调用回调。

</details>

---

### 问题 6：UPDATE 和 RENDER 阶段有什么区别？

```typescript
// UPDATE 阶段：更新数据
this.orbitController?.update()
this.onRenderCallbacks.forEach((cb) => cb(delta))

// RENDER 阶段：绘制画面
this.renderer.render(this.scene, this.camera)
```

**为什么要分成两个阶段？**

---

<details>
<summary>💡 点击查看引导</summary>

类比拍电影：

**UPDATE 阶段**（演员走位）：
- 计算新位置
- 更新动画状态
- 处理物理碰撞
- 不产生画面

**RENDER 阶段**（摄影师拍摄）：
- 把当前状态"拍照"
- 输出到屏幕
- 消耗 GPU 资源

为什么分开？

1. **逻辑清晰**：数据更新和渲染分离
2. **性能优化**：可以跳过不必要的渲染
3. **调试方便**：可以单独测试更新逻辑

**按需渲染**：
```typescript
if (this.needsRender) {
  this.renderer.render(this.scene, this.camera)
  this.needsRender = false
}
```
只有需要时才渲染，节省 GPU。

</details>

---

### 问题 7：`delta` 是什么？为什么需要它？

```typescript
const delta = this.clock.getDelta()
this.onRenderCallbacks.forEach((cb) => cb(delta))
```

**如果不用 delta，直接移动物体会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

`delta` 是"帧间隔时间"（秒）。

不用 delta 的问题：

```typescript
// 每帧移动 1 单位
object.position.x += 1

// 60 FPS 的电脑：每秒移动 60 单位
// 30 FPS 的电脑：每秒移动 30 单位
// 不同电脑速度不一样！
```

用 delta 的好处：

```typescript
// 每秒移动 60 单位
object.position.x += 60 * delta

// 60 FPS：delta ≈ 0.0167，每帧移动 1 单位
// 30 FPS：delta ≈ 0.0333，每帧移动 2 单位
// 最终每秒都移动 60 单位！
```

**delta 让动画速度与帧率无关**。

</details>

---

## 第四部分：资源管理

### 问题 8：为什么要监听窗口大小变化？

```typescript
private handleResize = (): void => {
  const { clientWidth: width, clientHeight: height } = this.container
  
  this.camera.aspect = width / height
  this.camera.updateProjectionMatrix()
  
  this.renderer.setSize(width, height)
  
  this.requestRender()
}
```

**如果不处理 resize 会怎样？**

---

<details>
<summary>💡 点击查看引导</summary>

问题：

1. **画面变形**
   - 窗口变宽，但相机宽高比没变
   - 物体被拉伸或压缩

2. **画面模糊或裁剪**
   - 渲染器尺寸没更新
   - 画面可能只占一部分，或者超出边界

**必须更新的内容**：
- `camera.aspect`：相机宽高比
- `camera.updateProjectionMatrix()`：重新计算投影矩阵
- `renderer.setSize()`：更新渲染器尺寸

**`updateProjectionMatrix()` 是什么？**
- 相机参数改变后，必须调用
- 重新计算"怎么把 3D 投影到 2D"

</details>

---

### 问题 9：`dispose()` 方法在做什么？

```typescript
public dispose(): void {
  this.stop()
  window.removeEventListener('resize', this.handleResize)
  
  this.orbitController?.dispose()
  this.renderer.dispose()
  this.renderer.domElement.remove()
  
  this.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose()
      if (Array.isArray(object.material)) {
        object.material.forEach((m) => m.dispose())
      } else {
        object.material?.dispose()
      }
    }
  })
  
  this.scene.clear()
}
```

**为什么要手动清理这些资源？**

---

<details>
<summary>💡 点击查看引导</summary>

JavaScript 有垃圾回收，但 WebGL 资源不会自动回收！

需要手动清理的资源：
- **Geometry**：顶点数据，存在 GPU 内存
- **Material**：材质数据，可能包含纹理
- **Texture**：纹理图片，占用大量 GPU 内存
- **Renderer**：WebGL 上下文

不清理的后果：
- GPU 内存泄漏
- 页面越来越卡
- 最终浏览器崩溃

**`scene.traverse()`**：遍历场景中的所有对象，递归处理。

</details>

---

## 第五部分：光照系统

### 问题 10：为什么需要两种光源？

```typescript
private setupLights(): void {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  this.scene.add(ambientLight)

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  this.scene.add(directionalLight)
}
```

**只用一种光源不行吗？**

---

<details>
<summary>💡 点击查看引导</summary>

不同光源的特点：

**环境光（AmbientLight）**：
- 均匀照亮所有物体
- 没有方向，没有阴影
- 模拟"环境中的散射光"
- 防止阴影处全黑

**方向光（DirectionalLight）**：
- 有方向，像太阳光
- 可以产生阴影
- 让物体有明暗对比
- 增加立体感

只用环境光：
- 物体看起来"平"，没有立体感
- 没有阴影

只用方向光：
- 阴影处全黑
- 看不清细节

**组合使用**：环境光打底 + 方向光增加立体感。

</details>

---

## 动手练习

### 练习 1：添加点光源
- 在场景中添加一个点光源
- 让它跟随鼠标移动
- 观察阴影变化

<details>
<summary>📝 参考答案</summary>

```typescript
// 在 ThreeEngine 类中添加

private pointLight: THREE.PointLight | null = null
private mousePosition: THREE.Vector2 = new THREE.Vector2()
private raycaster: THREE.Raycaster = new THREE.Raycaster()

public addMouseFollowLight(): void {
  // 创建点光源
  this.pointLight = new THREE.PointLight(0xffffff, 1, 50)
  this.pointLight.castShadow = true
  this.pointLight.shadow.mapSize.width = 512
  this.pointLight.shadow.mapSize.height = 512
  this.scene.add(this.pointLight)
  
  // 添加光源辅助器（可选，用于调试）
  const helper = new THREE.PointLightHelper(this.pointLight, 0.5)
  this.scene.add(helper)
  
  // 监听鼠标移动
  this.container.addEventListener('mousemove', this.handleMouseMoveForLight)
}

private handleMouseMoveForLight = (event: MouseEvent): void => {
  if (!this.pointLight) return
  
  const rect = this.container.getBoundingClientRect()
  
  // 将鼠标位置转换为标准化设备坐标 (-1 到 +1)
  this.mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  this.mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  // 使用射线投射找到鼠标在场景中的位置
  this.raycaster.setFromCamera(this.mousePosition, this.camera)
  
  // 创建一个水平面用于计算交点
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const intersection = new THREE.Vector3()
  
  this.raycaster.ray.intersectPlane(plane, intersection)
  
  if (intersection) {
    // 将光源放在鼠标位置上方
    this.pointLight.position.set(
      intersection.x,
      5, // 固定高度
      intersection.z
    )
  }
  
  this.requestRender()
}

public removeMouseFollowLight(): void {
  if (this.pointLight) {
    this.scene.remove(this.pointLight)
    this.pointLight.dispose()
    this.pointLight = null
  }
  this.container.removeEventListener('mousemove', this.handleMouseMoveForLight)
}
```

**使用示例**：

```typescript
const engine = new ThreeEngine(container)
engine.addMouseFollowLight()

// 清理
engine.removeMouseFollowLight()
```

**关键点**：
- `PointLight` 从一个点向所有方向发光
- 使用 `Raycaster` 将屏幕坐标转换为 3D 坐标
- 光源跟随鼠标但保持固定高度
- 记得在 dispose 时清理

</details>

---

### 练习 2：实现截图功能
- 添加一个方法，把当前画面保存为图片
- 提示：`renderer.domElement.toDataURL()`

<details>
<summary>📝 参考答案</summary>

```typescript
// 在 ThreeEngine 类中添加

interface ScreenshotOptions {
  width?: number
  height?: number
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number // 0-1，仅对 jpeg/webp 有效
  filename?: string
  download?: boolean
}

public takeScreenshot(options: ScreenshotOptions = {}): string {
  const {
    width,
    height,
    format = 'png',
    quality = 0.92,
    filename = `screenshot-${Date.now()}`,
    download = false,
  } = options
  
  // 如果需要特定尺寸，临时调整渲染器大小
  const originalSize = {
    width: this.renderer.domElement.width,
    height: this.renderer.domElement.height,
  }
  
  if (width && height) {
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }
  
  // 强制渲染一帧
  this.renderer.render(this.scene, this.camera)
  
  // 获取图片数据
  const mimeType = `image/${format}`
  const dataURL = this.renderer.domElement.toDataURL(mimeType, quality)
  
  // 恢复原始尺寸
  if (width && height) {
    this.renderer.setSize(originalSize.width, originalSize.height)
    this.camera.aspect = originalSize.width / originalSize.height
    this.camera.updateProjectionMatrix()
    this.requestRender()
  }
  
  // 下载图片
  if (download) {
    this.downloadImage(dataURL, `${filename}.${format}`)
  }
  
  return dataURL
}

private downloadImage(dataURL: string, filename: string): void {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 高分辨率截图（用于打印或高清导出）
public takeHiResScreenshot(scale: number = 2): string {
  const currentWidth = this.container.clientWidth
  const currentHeight = this.container.clientHeight
  
  return this.takeScreenshot({
    width: currentWidth * scale,
    height: currentHeight * scale,
    format: 'png',
    download: true,
    filename: `screenshot-hires-${Date.now()}`,
  })
}
```

**使用示例**：

```typescript
// 基本截图
const dataURL = engine.takeScreenshot()

// 下载截图
engine.takeScreenshot({ download: true, filename: 'my-scene' })

// 高分辨率截图
engine.takeHiResScreenshot(2) // 2倍分辨率

// 指定格式和质量
engine.takeScreenshot({
  format: 'jpeg',
  quality: 0.8,
  download: true,
})
```

**关键点**：
- `preserveDrawingBuffer` 需要在创建渲染器时设为 true
- 临时调整尺寸可以获得不同分辨率的截图
- 记得恢复原始尺寸
- 使用 `<a>` 标签的 download 属性触发下载

</details>

---

### 练习 3：添加性能监控
- 集成 `stats.js` 显示 FPS
- 在渲染循环中更新

<details>
<summary>📝 参考答案</summary>

```typescript
// 首先安装 stats.js
// npm install stats.js
// npm install @types/stats.js -D

import Stats from 'stats.js'

// 在 ThreeEngine 类中添加

private stats: Stats | null = null

public enableStats(mode: 0 | 1 | 2 = 0): void {
  // mode: 0 = FPS, 1 = MS (渲染时间), 2 = MB (内存)
  this.stats = new Stats()
  this.stats.showPanel(mode)
  
  // 设置样式
  this.stats.dom.style.position = 'absolute'
  this.stats.dom.style.top = '0'
  this.stats.dom.style.left = '0'
  
  this.container.style.position = 'relative'
  this.container.appendChild(this.stats.dom)
}

public disableStats(): void {
  if (this.stats) {
    this.container.removeChild(this.stats.dom)
    this.stats = null
  }
}

public setStatsMode(mode: 0 | 1 | 2): void {
  if (this.stats) {
    this.stats.showPanel(mode)
  }
}

// 修改渲染循环
private animate = (): void => {
  if (!this.isRunning) return
  
  this.stats?.begin() // 开始计时
  
  this.animationFrameId = requestAnimationFrame(this.animate)
  
  const delta = this.clock.getDelta()
  
  // UPDATE 阶段
  this.orbitController?.update()
  this.onRenderCallbacks.forEach((cb) => cb(delta))
  
  // RENDER 阶段
  if (this.needsRender) {
    this.renderer.render(this.scene, this.camera)
    this.needsRender = false
  }
  
  this.stats?.end() // 结束计时
}

// 在 dispose 中清理
public dispose(): void {
  this.disableStats()
  // ... 其他清理代码
}
```

**更完整的性能监控面板**：

```typescript
interface PerformanceInfo {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
}

public getPerformanceInfo(): PerformanceInfo {
  const info = this.renderer.info
  
  return {
    fps: this.stats ? parseFloat(this.stats.dom.innerText) : 0,
    frameTime: info.render.frame,
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  }
}

// 创建自定义性能面板
public createPerformancePanel(): HTMLElement {
  const panel = document.createElement('div')
  panel.className = 'performance-panel'
  panel.innerHTML = `
    <div class="perf-item">FPS: <span id="perf-fps">0</span></div>
    <div class="perf-item">Draw Calls: <span id="perf-calls">0</span></div>
    <div class="perf-item">Triangles: <span id="perf-tris">0</span></div>
    <div class="perf-item">Geometries: <span id="perf-geom">0</span></div>
    <div class="perf-item">Textures: <span id="perf-tex">0</span></div>
  `
  
  // 添加样式
  panel.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.7);
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    border-radius: 4px;
  `
  
  this.container.appendChild(panel)
  
  // 定期更新
  const updatePanel = () => {
    const info = this.getPerformanceInfo()
    panel.querySelector('#perf-fps')!.textContent = info.fps.toFixed(1)
    panel.querySelector('#perf-calls')!.textContent = String(info.drawCalls)
    panel.querySelector('#perf-tris')!.textContent = String(info.triangles)
    panel.querySelector('#perf-geom')!.textContent = String(info.geometries)
    panel.querySelector('#perf-tex')!.textContent = String(info.textures)
  }
  
  setInterval(updatePanel, 500)
  
  return panel
}
```

**使用示例**：

```typescript
const engine = new ThreeEngine(container)

// 简单 FPS 显示
engine.enableStats(0)

// 切换到渲染时间
engine.setStatsMode(1)

// 或使用自定义面板
engine.createPerformancePanel()
```

**关键点**：
- `stats.js` 是轻量级的性能监控库
- `begin()` 和 `end()` 包裹要测量的代码
- `renderer.info` 提供详细的渲染统计
- 性能面板对调试和优化很有帮助

</details>

---

## 关键文件

- `apps/frontend/SMART-MALL/src/engine/ThreeEngine.ts` - 引擎主类
- `apps/frontend/SMART-MALL/src/engine/camera/` - 相机控制器
- `apps/frontend/SMART-MALL/src/engine/interaction/` - 交互管理

---

*"我不能教会任何人任何东西，我只能让他们思考。" —— 苏格拉底*
