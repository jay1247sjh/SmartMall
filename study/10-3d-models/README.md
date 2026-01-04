# 3D 模型创建学习指南

> 苏格拉底式教学：通过提问引导你理解如何用代码创建 3D 模型

## 第一部分：理解问题

### 问题 1：3D 模型是由什么组成的？

看电梯模型的代码：

```typescript
const backWall = new THREE.Mesh(
  getBoxGeometry(size, height, wallThickness),  // 几何体
  wallMaterial                                   // 材质
)
```

**`Mesh`、`Geometry`、`Material` 分别是什么？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

Three.js 的核心概念：

| 概念 | 类比 | 作用 |
|------|------|------|
| Geometry | 骨架 | 定义形状（顶点、面） |
| Material | 皮肤 | 定义外观（颜色、纹理、光泽） |
| Mesh | 完整的物体 | 几何体 + 材质 = 可渲染的对象 |

```
Mesh = Geometry + Material

BoxGeometry     MeshStandardMaterial
(立方体形状)  +  (金属材质)
     ↓              ↓
     └──────┬───────┘
            ↓
         Mesh
      (金属立方体)
```

**为什么要分开？**
- 同一个几何体可以用不同材质
- 同一个材质可以用在不同几何体
- 复用，节省内存

</details>

---

### 问题 2：如何创建一个盒子？

```typescript
const geometry = new THREE.BoxGeometry(width, height, depth)
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
const box = new THREE.Mesh(geometry, material)
```

**`BoxGeometry(2, 3, 1)` 创建的盒子是什么样的？**

---

<details>
<summary>💡 点击查看引导</summary>

`BoxGeometry(width, height, depth)`：

```
        height (3)
           ↑
           │
    ┌──────┼──────┐
    │      │      │
    │      │      │ depth (1)
    │      │      │
    └──────┼──────┘
           │
    ←──────┼──────→ width (2)
```

- `width`：X 轴方向的尺寸
- `height`：Y 轴方向的尺寸
- `depth`：Z 轴方向的尺寸

**默认位置**：盒子中心在原点 (0, 0, 0)

**常见问题**：盒子一半在地下
```typescript
box.position.y = height / 2  // 把盒子抬起来，底部贴地
```

</details>

---

## 第二部分：组合模型

### 问题 3：电梯模型是如何组合的？

```typescript
export function createElevatorModel(group: THREE.Group, size: number, ...): void {
  // 后墙
  const backWall = new THREE.Mesh(...)
  backWall.position.set(0, height / 2, -size / 2 + wallThickness / 2)
  group.add(backWall)
  
  // 左墙
  const leftWall = new THREE.Mesh(...)
  leftWall.position.set(-size / 2 + wallThickness / 2, height / 2, 0)
  group.add(leftWall)
  
  // 右墙、前墙、门、地板...
}
```

**为什么每个部件都要单独设置位置？**

---

<details>
<summary>💡 点击查看引导</summary>

电梯的结构（俯视图）：

```
        后墙
    ┌─────────┐
    │         │
左墙│  地板   │右墙
    │         │
    └─┬─────┬─┘
      │门 门│
      前墙（带门洞）
```

每个部件是独立的盒子：
- 后墙：`position.z = -size/2`（在后面）
- 左墙：`position.x = -size/2`（在左边）
- 右墙：`position.x = +size/2`（在右边）

**为什么不用一个复杂的几何体？**
- 简单几何体组合更灵活
- 可以单独控制每个部件
- 可以做动画（如门打开）

</details>

---

### 问题 4：门洞是怎么做的？

```typescript
// 前墙（带门洞）- 左侧
const frontLeftWall = new THREE.Mesh(
  getBoxGeometry((size - doorWidth) / 2, height, wallThickness),
  wallMaterial
)
frontLeftWall.position.set(-(size + doorWidth) / 4, height / 2, size / 2)

// 前墙（带门洞）- 右侧
const frontRightWall = new THREE.Mesh(...)

// 前墙（带门洞）- 上方
const frontTopWall = new THREE.Mesh(...)
```

**为什么前墙要分成三块？**

---

<details>
<summary>💡 点击查看引导</summary>

门洞不是"挖"出来的，而是用三块墙"围"出来的：

```
┌─────────────────────┐
│      上方墙         │
├─────┬───────┬───────┤
│     │       │       │
│左侧 │ 门洞  │ 右侧  │
│ 墙  │       │  墙   │
│     │       │       │
└─────┴───────┴───────┘
```

**为什么不用 CSG（布尔运算）？**
- CSG 计算复杂，性能差
- 简单场景用组合更高效
- Three.js 原生不支持 CSG

**计算位置**：
- 左侧墙宽度：`(size - doorWidth) / 2`
- 左侧墙 X 位置：`-(size + doorWidth) / 4`
  - 即：`-size/2 + 左侧墙宽度/2`

</details>

---

## 第三部分：加载外部模型

### 问题 5：如何加载 GLTF 模型？

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export async function loadCharacterModel(modelName: string): Promise<CharacterModelResult> {
  const loader = new GLTFLoader()
  const modelPath = `/models/kenney_mini-characters/Models/GLB format/${modelName}.glb`
  
  return new Promise((resolve, reject) => {
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene
        resolve({ model, animations: gltf.animations })
      },
      (progress) => {
        console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(1)}%`)
      },
      (error) => {
        reject(error)
      }
    )
  })
}
```

**为什么要用 Promise 包装？**

---

<details>
<summary>💡 点击查看引导</summary>

`GLTFLoader.load()` 是回调风格的 API：

```typescript
loader.load(
  path,
  onSuccess,   // 成功回调
  onProgress,  // 进度回调
  onError      // 错误回调
)
```

用 Promise 包装的好处：

```typescript
// 回调风格（嵌套地狱）
loader.load(path1, (gltf1) => {
  loader.load(path2, (gltf2) => {
    loader.load(path3, (gltf3) => {
      // 三层嵌套...
    })
  })
})

// Promise 风格（清晰）
const model1 = await loadCharacterModel('character-a')
const model2 = await loadCharacterModel('character-b')
const model3 = await loadCharacterModel('character-c')
```

**async/await 让异步代码看起来像同步代码**。

</details>

---

### 问题 6：GLTF 文件包含什么？

```typescript
loader.load(modelPath, (gltf) => {
  const model = gltf.scene       // 3D 模型
  const animations = gltf.animations  // 动画
})
```

**GLTF 和 OBJ、FBX 有什么区别？**

---

<details>
<summary>💡 点击查看引导</summary>

常见 3D 格式对比：

| 格式 | 特点 | 适用场景 |
|------|------|----------|
| OBJ | 只有几何体，无动画 | 静态模型 |
| FBX | 支持动画，文件大 | 游戏开发 |
| GLTF/GLB | Web 优化，支持动画 | Web 3D |

**GLTF 的优势**：
- 专为 Web 设计
- 支持 PBR 材质
- 支持骨骼动画
- 文件小，加载快
- GLB 是二进制版本，更小

**GLTF 包含**：
- `scene`：3D 场景（模型、灯光、相机）
- `animations`：动画剪辑
- `cameras`：相机
- `materials`：材质
- `textures`：纹理

</details>

---

## 第四部分：动画系统

### 问题 7：如何播放动画？

```typescript
// 创建动画混合器
this.mixer = new THREE.AnimationMixer(model)

// 获取动画动作
const action = this.mixer.clipAction(clip)

// 播放动画
action.play()

// 每帧更新
update(delta: number) {
  this.mixer.update(delta)
}
```

**`AnimationMixer` 是什么？为什么需要每帧更新？**

---

<details>
<summary>💡 点击查看引导</summary>

**AnimationMixer**：动画播放器

类比 DVD 播放器：
- `AnimationClip`：DVD 光盘（动画数据）
- `AnimationAction`：播放控制（播放、暂停、循环）
- `AnimationMixer`：播放器本身

**为什么需要每帧更新？**

动画是"随时间变化"的：
```
时间 0s: 手臂角度 0°
时间 0.5s: 手臂角度 45°
时间 1s: 手臂角度 90°
```

`mixer.update(delta)` 的作用：
- 根据时间推进动画
- 计算当前帧的骨骼位置
- 更新模型的变换

**不更新 = 动画停在第一帧**。

</details>

---

### 问题 8：如何切换动画？

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

**为什么要用 `fadeOut` 和 `fadeIn`？**

---

<details>
<summary>💡 点击查看引导</summary>

直接切换的问题：

```
站立动画 → 走路动画
  ↓
角色突然"跳"到走路姿势
看起来很突兀
```

淡入淡出的效果：

```
站立动画 ─────────────────→ 权重从 1 降到 0
走路动画 ─────────────────→ 权重从 0 升到 1
         ├──────────────┤
              0.2 秒
              混合过渡
```

**`fadeOut(0.2)`**：在 0.2 秒内，动画权重从 1 降到 0
**`fadeIn(0.2)`**：在 0.2 秒内，动画权重从 0 升到 1

**混合期间**：两个动画同时播放，按权重混合。

</details>

---

## 第五部分：模型优化

### 问题 9：为什么要启用阴影？

```typescript
model.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.castShadow = true     // 投射阴影
    child.receiveShadow = true  // 接收阴影
  }
})
```

**`castShadow` 和 `receiveShadow` 有什么区别？**

---

<details>
<summary>💡 点击查看引导</summary>

阴影的两个角色：

```
    光源
     │
     ↓
  ┌─────┐
  │物体A│ castShadow = true（投射阴影）
  └─────┘
     │
     ↓ 阴影
  ═══════════
    地面     receiveShadow = true（接收阴影）
```

**castShadow**：这个物体会"挡住"光线，产生阴影
**receiveShadow**：这个物体表面会"显示"其他物体的阴影

**性能考虑**：
- 阴影计算很耗性能
- 只给需要的物体开启
- 小物体可以不投射阴影

</details>

---

### 问题 10：备用模型是什么？

```typescript
private createFallbackModel(): void {
  const geometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8)
  const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = 0.8
  this.character.add(mesh)
}
```

**为什么需要备用模型？**

---

<details>
<summary>💡 点击查看引导</summary>

外部模型加载可能失败：
- 文件不存在
- 网络错误
- 格式错误

没有备用模型：
- 角色不显示
- 用户困惑
- 功能无法使用

有备用模型：
- 至少显示一个简单形状
- 用户知道"这里有个角色"
- 功能可以继续使用

**优雅降级**：
```typescript
try {
  await loadCharacterModel(modelName)
} catch (error) {
  console.error('加载失败，使用备用模型')
  this.createFallbackModel()
}
```

**CapsuleGeometry**：胶囊形状，常用于角色碰撞体。

</details>

---

## 动手练习

### 练习 1：创建一个桌子模型
- 桌面 + 4 条腿
- 使用 BoxGeometry 组合
- 支持不同尺寸

<details>
<summary>📝 参考答案</summary>

```typescript
import * as THREE from 'three'

interface TableOptions {
  width?: number      // 桌面宽度
  depth?: number      // 桌面深度
  height?: number     // 桌子总高度
  topThickness?: number  // 桌面厚度
  legSize?: number    // 桌腿截面尺寸
  color?: number      // 颜色
}

export function createTableModel(
  group: THREE.Group,
  options: TableOptions = {}
): void {
  const {
    width = 1.2,
    depth = 0.8,
    height = 0.75,
    topThickness = 0.05,
    legSize = 0.05,
    color = 0x8B4513  // 棕色
  } = options

  const material = new THREE.MeshStandardMaterial({ 
    color,
    roughness: 0.7,
    metalness: 0.1
  })

  // 桌面
  const topGeometry = new THREE.BoxGeometry(width, topThickness, depth)
  const top = new THREE.Mesh(topGeometry, material)
  top.position.y = height - topThickness / 2
  top.castShadow = true
  top.receiveShadow = true
  group.add(top)

  // 桌腿高度 = 总高度 - 桌面厚度
  const legHeight = height - topThickness
  const legGeometry = new THREE.BoxGeometry(legSize, legHeight, legSize)

  // 四条桌腿的位置（相对于桌面中心）
  const legPositions = [
    { x: -width / 2 + legSize / 2, z: -depth / 2 + legSize / 2 },  // 左后
    { x:  width / 2 - legSize / 2, z: -depth / 2 + legSize / 2 },  // 右后
    { x: -width / 2 + legSize / 2, z:  depth / 2 - legSize / 2 },  // 左前
    { x:  width / 2 - legSize / 2, z:  depth / 2 - legSize / 2 },  // 右前
  ]

  legPositions.forEach((pos, index) => {
    const leg = new THREE.Mesh(legGeometry, material)
    leg.position.set(pos.x, legHeight / 2, pos.z)
    leg.castShadow = true
    leg.receiveShadow = true
    leg.name = `leg-${index}`
    group.add(leg)
  })
}

// 使用示例
const tableGroup = new THREE.Group()
createTableModel(tableGroup, {
  width: 1.5,
  depth: 0.9,
  height: 0.8,
  color: 0x654321
})
scene.add(tableGroup)
```

**关键点**：
- 桌面位置：`y = height - topThickness / 2`（顶部对齐总高度）
- 桌腿位置：四个角落，向内偏移 `legSize / 2`
- 桌腿高度：`height - topThickness`（不包含桌面）
- 使用 `options` 参数支持自定义尺寸
- 启用阴影增强真实感

</details>

---

### 练习 2：添加模型加载进度条
- 显示加载百分比
- 加载完成后隐藏

<details>
<summary>📝 参考答案</summary>

```typescript
// loading-manager.ts
import * as THREE from 'three'

export class LoadingManager {
  private container: HTMLDivElement
  private progressBar: HTMLDivElement
  private progressText: HTMLSpanElement
  private manager: THREE.LoadingManager

  constructor() {
    // 创建 UI 元素
    this.container = document.createElement('div')
    this.container.className = 'loading-overlay'
    this.container.innerHTML = `
      <div class="loading-content">
        <div class="loading-bar-bg">
          <div class="loading-bar-fill"></div>
        </div>
        <span class="loading-text">加载中... 0%</span>
      </div>
    `
    
    // 添加样式
    const style = document.createElement('style')
    style.textContent = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        transition: opacity 0.3s;
      }
      .loading-overlay.hidden {
        opacity: 0;
        pointer-events: none;
      }
      .loading-content {
        text-align: center;
      }
      .loading-bar-bg {
        width: 300px;
        height: 20px;
        background: #333;
        border-radius: 10px;
        overflow: hidden;
      }
      .loading-bar-fill {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        transition: width 0.2s;
      }
      .loading-text {
        color: white;
        margin-top: 10px;
        display: block;
        font-size: 14px;
      }
    `
    document.head.appendChild(style)
    
    this.progressBar = this.container.querySelector('.loading-bar-fill')!
    this.progressText = this.container.querySelector('.loading-text')!

    // 创建 Three.js LoadingManager
    this.manager = new THREE.LoadingManager(
      // onLoad - 全部加载完成
      () => {
        this.hide()
      },
      // onProgress - 加载进度
      (url, loaded, total) => {
        const percent = Math.round((loaded / total) * 100)
        this.updateProgress(percent, url)
      },
      // onError - 加载错误
      (url) => {
        console.error(`加载失败: ${url}`)
        this.progressText.textContent = `加载失败: ${url}`
        this.progressText.style.color = '#ff5252'
      }
    )
  }

  show(): void {
    document.body.appendChild(this.container)
    this.container.classList.remove('hidden')
  }

  hide(): void {
    this.container.classList.add('hidden')
    setTimeout(() => {
      this.container.remove()
    }, 300)
  }

  updateProgress(percent: number, currentFile?: string): void {
    this.progressBar.style.width = `${percent}%`
    const fileName = currentFile ? currentFile.split('/').pop() : ''
    this.progressText.textContent = `加载中... ${percent}% ${fileName ? `(${fileName})` : ''}`
  }

  getManager(): THREE.LoadingManager {
    return this.manager
  }
}

// 使用示例
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loadingManager = new LoadingManager()
loadingManager.show()

const loader = new GLTFLoader(loadingManager.getManager())

// 加载多个模型
const models = ['model1.glb', 'model2.glb', 'model3.glb']
models.forEach(modelPath => {
  loader.load(`/models/${modelPath}`, (gltf) => {
    scene.add(gltf.scene)
  })
})
```

**关键点**：
- 使用 `THREE.LoadingManager` 统一管理加载进度
- `onProgress` 回调提供 `loaded` 和 `total` 计算百分比
- CSS `transition` 实现平滑动画
- 加载完成后延迟移除 DOM（等待淡出动画）
- 显示当前加载的文件名提升用户体验

</details>

---

### 练习 3：实现模型 LOD
- 远处显示简单模型
- 近处显示详细模型
- 提示：`THREE.LOD`

<details>
<summary>📝 参考答案</summary>

```typescript
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * 创建 LOD（Level of Detail）模型
 * 根据相机距离自动切换不同精度的模型
 */
export class LODModel {
  public lod: THREE.LOD
  private loader: GLTFLoader

  constructor() {
    this.lod = new THREE.LOD()
    this.loader = new GLTFLoader()
  }

  /**
   * 添加一个细节层级
   * @param model 模型或几何体
   * @param distance 切换距离（相机距离超过此值时显示此模型）
   */
  addLevel(model: THREE.Object3D, distance: number): void {
    this.lod.addLevel(model, distance)
  }

  /**
   * 从文件加载多个 LOD 层级
   */
  async loadLODModels(configs: Array<{ path: string; distance: number }>): Promise<void> {
    const loadPromises = configs.map(async (config) => {
      const gltf = await this.loadModel(config.path)
      this.lod.addLevel(gltf.scene, config.distance)
    })

    await Promise.all(loadPromises)
    
    // 按距离排序（Three.js 要求）
    this.lod.levels.sort((a, b) => a.distance - b.distance)
  }

  private loadModel(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject)
    })
  }
}

// ============ 使用示例 1：程序化生成 LOD ============

function createLODSphere(): THREE.LOD {
  const lod = new THREE.LOD()
  const material = new THREE.MeshStandardMaterial({ color: 0x3498db })

  // 高精度（近距离）- 64 段
  const highDetail = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    material
  )
  lod.addLevel(highDetail, 0)  // 距离 0-10

  // 中精度 - 32 段
  const mediumDetail = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    material
  )
  lod.addLevel(mediumDetail, 10)  // 距离 10-30

  // 低精度（远距离）- 8 段
  const lowDetail = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    material
  )
  lod.addLevel(lowDetail, 30)  // 距离 30+

  return lod
}

// ============ 使用示例 2：加载外部 LOD 模型 ============

async function loadTreeWithLOD(): Promise<THREE.LOD> {
  const lodModel = new LODModel()

  // 加载不同精度的树模型
  await lodModel.loadLODModels([
    { path: '/models/tree_high.glb', distance: 0 },    // 近距离：高精度
    { path: '/models/tree_medium.glb', distance: 20 }, // 中距离：中精度
    { path: '/models/tree_low.glb', distance: 50 },    // 远距离：低精度
  ])

  return lodModel.lod
}

// ============ 使用示例 3：用简单几何体作为远距离替代 ============

async function createBuildingLOD(): Promise<THREE.LOD> {
  const lod = new THREE.LOD()
  const loader = new GLTFLoader()

  // 近距离：加载详细模型
  const gltf = await new Promise<any>((resolve, reject) => {
    loader.load('/models/building_detailed.glb', resolve, undefined, reject)
  })
  lod.addLevel(gltf.scene, 0)

  // 远距离：用简单盒子替代
  const simpleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 })
  const simpleBox = new THREE.Mesh(
    new THREE.BoxGeometry(10, 30, 10),
    simpleMaterial
  )
  simpleBox.position.y = 15  // 盒子中心抬高
  lod.addLevel(simpleBox, 100)

  return lod
}

// ============ 在渲染循环中更新 LOD ============

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

// 添加 LOD 对象到场景
const sphereLOD = createLODSphere()
sphereLOD.position.set(0, 0, -20)
scene.add(sphereLOD)

function animate() {
  requestAnimationFrame(animate)
  
  // LOD 会自动根据相机距离切换层级
  // 只需要确保 LOD 对象在场景中，Three.js 会自动处理
  
  renderer.render(scene, camera)
}
animate()
```

**关键点**：
- `THREE.LOD` 根据相机距离自动切换模型
- `addLevel(object, distance)`：距离越小的层级越先添加
- 层级必须按距离从小到大排序
- 远距离可以用简单几何体替代，大幅提升性能
- LOD 对象添加到场景后，Three.js 自动处理切换逻辑

**性能提示**：
- 高精度模型：面数多，细节丰富
- 低精度模型：面数少，甚至可以用 Billboard（面片）
- 合理设置切换距离，避免"跳变"感

</details>

---

## 关键文件

| 文件 | 说明 | 跳转 |
|------|------|------|
| elevator-model.ts | 电梯模型（厢体、门、按钮） | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/elevator-model.ts) |
| escalator-model.ts | 扶梯模型（台阶、扶手） | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/escalator-model.ts) |
| character-model.ts | 角色模型（GLTF 加载、动画） | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/character-model.ts) |
| furniture-models.ts | 家具模型（桌椅、货架） | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/furniture-models.ts) |
| stairs-model.ts | 楼梯模型 | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/stairs-model.ts) |
| restroom-model.ts | 卫生间模型 | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/restroom-model.ts) |
| service-desk-model.ts | 服务台模型 | [查看](../../apps/frontend/SMART-MALL/src/builder/objects/service-desk-model.ts) |

### 资源管理

| 文件 | 说明 | 跳转 |
|------|------|------|
| resource-manager.ts | 资源管理器 | [查看](../../apps/frontend/SMART-MALL/src/builder/resources/resource-manager.ts) |
| GeometryFactory.ts | 几何体工厂 | [查看](../../apps/frontend/SMART-MALL/src/engine/objects/GeometryFactory.ts) |

---

*"智慧的开始是对词语定义的探讨。" —— 苏格拉底*
