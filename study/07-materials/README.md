# 材质管理学习指南

> 苏格拉底式教学：通过提问引导你理解 3D 材质缓存与复用的设计

## 第一部分：理解问题

### 问题 1：为什么需要材质管理器？

看这段代码：

```typescript
// 不使用材质管理器
function createWall() {
  const material = new THREE.MeshStandardMaterial({ color: 0x404040 })
  return new THREE.Mesh(geometry, material)
}

// 创建 100 面墙
for (let i = 0; i < 100; i++) {
  scene.add(createWall())
}
```

**这段代码有什么问题？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

问题：创建了 100 个完全相同的材质对象！

每个材质对象：
- 占用内存
- 需要 GPU 编译着色器
- 增加渲染批次（draw calls）

**材质管理器的作用**：
- 缓存已创建的材质
- 相同参数返回同一个材质实例
- 减少内存占用和 GPU 负担

```typescript
// 使用材质管理器
const material = getMaterialManager().getStandardMaterial({ color: 0x404040 })
// 100 面墙共享同一个材质实例
```

</details>

---

### 问题 2：单例模式是什么？

看 `resource-manager.ts`：

```typescript
let materialManager: MaterialManager | null = null

export function getMaterialManager(): MaterialManager {
  if (!materialManager) {
    materialManager = new MaterialManager()
  }
  return materialManager
}
```

**为什么要这样写？直接 `export const materialManager = new MaterialManager()` 不行吗？**

---

<details>
<summary>💡 点击查看引导</summary>

两种方式的区别：

**直接导出实例**：
```typescript
export const materialManager = new MaterialManager()
// 模块加载时就创建，即使没人用
```

**懒加载单例**：
```typescript
export function getMaterialManager() {
  if (!materialManager) {
    materialManager = new MaterialManager()
  }
  return materialManager
}
// 第一次调用时才创建
```

懒加载的好处：
- 延迟初始化，节省启动时间
- 如果从不使用，就不会创建
- 可以在创建前做一些准备工作

**单例模式**：确保全局只有一个实例，所有地方共享。

</details>

---

## 第二部分：材质缓存

### 问题 3：材质是如何被缓存的？

```typescript
export function getWallMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x404040,
    metalness: 0.3,
    roughness: 0.7,
  })
}
```

**如果调用 `getWallMaterial()` 100 次，会创建多少个材质对象？**

---

<details>
<summary>💡 点击查看引导</summary>

答案：**只创建 1 个**。

`MaterialManager` 内部实现（简化版）：

```typescript
class MaterialManager {
  private cache = new Map<string, THREE.Material>()
  
  getStandardMaterial(options: MaterialOptions) {
    // 1. 把参数转成字符串作为 key
    const key = JSON.stringify(options)
    
    // 2. 检查缓存
    if (this.cache.has(key)) {
      return this.cache.get(key)  // 返回缓存的材质
    }
    
    // 3. 创建新材质并缓存
    const material = new THREE.MeshStandardMaterial(options)
    this.cache.set(key, material)
    return material
  }
}
```

**关键**：相同参数 → 相同 key → 返回缓存。

</details>

---

### 问题 4：为什么要用函数包装材质获取？

```typescript
// 方式 1：直接导出材质
export const wallMaterial = getMaterialManager().getStandardMaterial({...})

// 方式 2：导出函数
export function getWallMaterial() {
  return getMaterialManager().getStandardMaterial({...})
}
```

**这两种方式有什么区别？**

---

<details>
<summary>💡 点击查看引导</summary>

**方式 1 的问题**：
- 模块加载时就执行
- 如果 `MaterialManager` 还没初始化，会报错
- 无法控制创建时机

**方式 2 的好处**：
- 调用时才执行
- 可以确保依赖已就绪
- 更灵活，可以添加额外逻辑

```typescript
export function getWallMaterial() {
  // 可以在这里添加日志、检查等
  console.log('获取墙壁材质')
  return getMaterialManager().getStandardMaterial({...})
}
```

**最佳实践**：用函数包装，延迟执行。

</details>

---

## 第三部分：材质参数

### 问题 5：`MeshStandardMaterial` 的参数是什么意思？

```typescript
getMaterialManager().getStandardMaterial({
  color: 0x404040,      // 颜色
  metalness: 0.3,       // 金属度
  roughness: 0.7,       // 粗糙度
})
```

**`metalness` 和 `roughness` 分别控制什么？**

---

<details>
<summary>💡 点击查看引导</summary>

**PBR（基于物理的渲染）参数**：

| 参数 | 范围 | 含义 |
|------|------|------|
| metalness | 0-1 | 金属度：0=非金属，1=金属 |
| roughness | 0-1 | 粗糙度：0=光滑镜面，1=粗糙漫反射 |

组合效果：

| metalness | roughness | 效果 |
|-----------|-----------|------|
| 0 | 0 | 光滑塑料（如手机壳） |
| 0 | 1 | 粗糙塑料（如橡皮） |
| 1 | 0 | 抛光金属（如镜子） |
| 1 | 1 | 粗糙金属（如铸铁） |

**墙壁材质**：
- `metalness: 0.3` - 略带金属感
- `roughness: 0.7` - 比较粗糙

</details>

---

### 问题 6：透明材质怎么设置？

```typescript
export function getGlassMaterial(): THREE.MeshStandardMaterial {
  return getMaterialManager().getStandardMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0.1,
    transparent: true,   // 开启透明
    opacity: 0.3,        // 透明度
  })
}
```

**为什么需要同时设置 `transparent` 和 `opacity`？**

---

<details>
<summary>💡 点击查看引导</summary>

**`transparent`**：告诉渲染器"这个材质需要透明处理"
- 开启后，渲染器会使用 alpha 混合
- 透明物体需要特殊的渲染顺序

**`opacity`**：实际的透明度值
- 0 = 完全透明（看不见）
- 1 = 完全不透明
- 0.3 = 30% 不透明（70% 透明）

为什么要分开？
- 性能优化：不透明物体渲染更快
- 只有需要透明时才开启 `transparent`
- `opacity: 1` + `transparent: false` 比 `opacity: 1` + `transparent: true` 快

</details>

---

## 第四部分：几何体缓存

### 问题 7：几何体也需要缓存吗？

```typescript
export function getBoxGeometry(width: number, height: number, depth: number) {
  return getGeometryFactory().getBoxGeometry({ width, height, depth })
}
```

**几何体和材质的缓存有什么不同？**

---

<details>
<summary>💡 点击查看引导</summary>

相同点：
- 都是为了复用，减少内存
- 都用参数作为缓存 key

不同点：

| | 材质 | 几何体 |
|---|------|--------|
| 数据 | 颜色、纹理、着色器 | 顶点、面、UV |
| 大小 | 相对较小 | 可能很大（复杂模型） |
| 复用率 | 很高（很多物体同色） | 中等（尺寸常不同） |

**几何体缓存的挑战**：
- 尺寸参数多，组合多
- 缓存命中率可能较低
- 需要权衡内存和性能

```typescript
// 这两个几何体不能共享
getBoxGeometry(1, 2, 3)  // 1x2x3 的盒子
getBoxGeometry(2, 2, 2)  // 2x2x2 的盒子
```

</details>

---

### 问题 8：为什么圆柱体要单独缓存？

```typescript
const cylinderCache = new Map<string, THREE.CylinderGeometry>()

export function getCylinderGeometry(radius: number, height: number, segments: number = 8) {
  const key = `cylinder_${radius}_${height}_${segments}`
  let geometry = cylinderCache.get(key)
  if (!geometry) {
    geometry = new THREE.CylinderGeometry(radius, radius, height, segments)
    cylinderCache.set(key, geometry)
  }
  return geometry
}
```

**为什么不用 `GeometryFactory`？**

---

<details>
<summary>💡 点击查看引导</summary>

原因：`GeometryFactory` 只支持常用几何体（Box、Plane）。

设计选择：
- 核心几何体放在 `GeometryFactory`
- 特殊几何体在使用处单独缓存

这样做的好处：
- `GeometryFactory` 保持简单
- 特殊需求不污染通用代码
- 各模块可以有自己的缓存策略

**追问**：如果圆柱体用得很多，应该把它加到 `GeometryFactory` 吗？

</details>

---

## 第五部分：资源清理

### 问题 9：为什么要手动清理资源？

```typescript
export function disposeBuilderResources(): void {
  if (materialManager) {
    materialManager.dispose()
    materialManager = null
  }
  
  if (geometryFactory) {
    geometryFactory.dispose()
    geometryFactory = null
  }
  
  cylinderCache.forEach(geometry => geometry.dispose())
  cylinderCache.clear()
}
```

**JavaScript 有垃圾回收，为什么还要手动 `dispose()`？**

---

<details>
<summary>💡 点击查看引导</summary>

WebGL 资源不受 JavaScript 垃圾回收管理！

Three.js 对象包含两部分：
1. **JavaScript 对象**：会被垃圾回收
2. **GPU 资源**：不会自动释放

```typescript
const material = new THREE.MeshStandardMaterial()
// JavaScript 对象 + GPU 着色器程序

material = null  // JavaScript 对象被回收
// 但 GPU 着色器程序还在！
```

**必须调用 `dispose()`**：
- 释放 GPU 内存
- 释放纹理
- 释放着色器程序

不清理的后果：
- GPU 内存泄漏
- 页面越来越卡
- 最终崩溃

</details>

---

### 问题 10：什么时候调用清理函数？

**`disposeBuilderResources()` 应该在什么时候调用？**

---

<details>
<summary>💡 点击查看引导</summary>

调用时机：

1. **组件卸载时**
```typescript
onUnmounted(() => {
  disposeBuilderResources()
})
```

2. **切换场景时**
```typescript
function switchScene() {
  disposeBuilderResources()
  loadNewScene()
}
```

3. **用户登出时**
```typescript
function logout() {
  disposeBuilderResources()
  router.push('/login')
}
```

**原则**：当 3D 场景不再需要时，清理资源。

**注意**：清理后，下次使用会重新创建（单例会重置为 null）。

</details>

---

## 动手练习

### 练习 1：添加纹理材质
- 创建一个带纹理的材质
- 实现纹理缓存
- 提示：`THREE.TextureLoader`

<details>
<summary>📝 参考答案</summary>

```typescript
// 在 resource-manager.ts 中添加

class TextureManager {
  private cache = new Map<string, THREE.Texture>()
  private loader = new THREE.TextureLoader()
  private loadingPromises = new Map<string, Promise<THREE.Texture>>()
  
  /**
   * 同步获取纹理（如果已缓存）
   */
  getTexture(url: string): THREE.Texture | null {
    return this.cache.get(url) || null
  }
  
  /**
   * 异步加载纹理（带缓存）
   */
  async loadTexture(url: string): Promise<THREE.Texture> {
    // 检查缓存
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }
    
    // 检查是否正在加载
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!
    }
    
    // 开始加载
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // 设置默认参数
          texture.wrapS = THREE.RepeatWrapping
          texture.wrapT = THREE.RepeatWrapping
          
          this.cache.set(url, texture)
          this.loadingPromises.delete(url)
          resolve(texture)
        },
        undefined,
        (error) => {
          this.loadingPromises.delete(url)
          reject(error)
        }
      )
    })
    
    this.loadingPromises.set(url, promise)
    return promise
  }
  
  /**
   * 预加载多个纹理
   */
  async preloadTextures(urls: string[]): Promise<THREE.Texture[]> {
    return Promise.all(urls.map(url => this.loadTexture(url)))
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.cache.forEach(texture => texture.dispose())
    this.cache.clear()
    this.loadingPromises.clear()
  }
}

// 单例
let textureManager: TextureManager | null = null

export function getTextureManager(): TextureManager {
  if (!textureManager) {
    textureManager = new TextureManager()
  }
  return textureManager
}

// 便捷函数：创建带纹理的材质
export async function getTexturedMaterial(
  textureUrl: string,
  options: {
    repeat?: [number, number]
    normalMap?: string
    roughnessMap?: string
  } = {}
): Promise<THREE.MeshStandardMaterial> {
  const tm = getTextureManager()
  
  const [colorMap, normalMap, roughnessMap] = await Promise.all([
    tm.loadTexture(textureUrl),
    options.normalMap ? tm.loadTexture(options.normalMap) : null,
    options.roughnessMap ? tm.loadTexture(options.roughnessMap) : null,
  ])
  
  // 设置重复
  if (options.repeat) {
    colorMap.repeat.set(...options.repeat)
    normalMap?.repeat.set(...options.repeat)
    roughnessMap?.repeat.set(...options.repeat)
  }
  
  return getMaterialManager().getStandardMaterial({
    map: colorMap,
    normalMap: normalMap || undefined,
    roughnessMap: roughnessMap || undefined,
  })
}
```

**使用示例**：

```typescript
// 加载单个纹理
const texture = await getTextureManager().loadTexture('/textures/wood.jpg')

// 创建带纹理的材质
const woodMaterial = await getTexturedMaterial('/textures/wood.jpg', {
  repeat: [2, 2],
  normalMap: '/textures/wood_normal.jpg',
})

// 预加载多个纹理
await getTextureManager().preloadTextures([
  '/textures/floor.jpg',
  '/textures/wall.jpg',
  '/textures/ceiling.jpg',
])
```

**关键点**：
- 纹理加载是异步的，需要用 Promise
- 防止同一纹理重复加载（`loadingPromises`）
- 设置 `RepeatWrapping` 允许纹理平铺
- 支持法线贴图和粗糙度贴图增加真实感

</details>

---

### 练习 2：实现材质预热
- 在场景加载前预先创建常用材质
- 避免首次使用时的卡顿

<details>
<summary>📝 参考答案</summary>

```typescript
// material-preloader.ts

interface MaterialPreset {
  name: string
  options: THREE.MeshStandardMaterialParameters
}

// 定义常用材质预设
const MATERIAL_PRESETS: MaterialPreset[] = [
  { name: 'wall', options: { color: 0x404040, metalness: 0.3, roughness: 0.7 } },
  { name: 'floor', options: { color: 0x808080, metalness: 0.1, roughness: 0.9 } },
  { name: 'glass', options: { color: 0x88ccff, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.3 } },
  { name: 'metal', options: { color: 0xcccccc, metalness: 0.9, roughness: 0.2 } },
  { name: 'wood', options: { color: 0x8b4513, metalness: 0.0, roughness: 0.8 } },
  { name: 'plastic', options: { color: 0xffffff, metalness: 0.0, roughness: 0.5 } },
]

// 纹理预设
const TEXTURE_PRESETS = [
  '/textures/floor_tile.jpg',
  '/textures/wall_paint.jpg',
  '/textures/wood_grain.jpg',
]

/**
 * 预热材质系统
 * 在场景加载前调用，避免首次使用时的卡顿
 */
export async function warmupMaterials(options: {
  onProgress?: (loaded: number, total: number) => void
} = {}): Promise<void> {
  const { onProgress } = options
  const mm = getMaterialManager()
  const tm = getTextureManager()
  
  const totalItems = MATERIAL_PRESETS.length + TEXTURE_PRESETS.length
  let loadedItems = 0
  
  const updateProgress = () => {
    loadedItems++
    onProgress?.(loadedItems, totalItems)
  }
  
  // 1. 预创建基础材质
  console.log('[MaterialPreloader] 预热基础材质...')
  for (const preset of MATERIAL_PRESETS) {
    mm.getStandardMaterial(preset.options)
    updateProgress()
  }
  
  // 2. 预加载纹理
  console.log('[MaterialPreloader] 预加载纹理...')
  await Promise.all(
    TEXTURE_PRESETS.map(async (url) => {
      try {
        await tm.loadTexture(url)
      } catch (e) {
        console.warn(`[MaterialPreloader] 纹理加载失败: ${url}`)
      }
      updateProgress()
    })
  )
  
  // 3. 强制编译着色器（可选，需要渲染器）
  // 这一步会让 GPU 预编译着色器，避免首次渲染时的卡顿
  
  console.log('[MaterialPreloader] 材质预热完成')
}

/**
 * 强制编译所有材质的着色器
 * 需要在有渲染器和场景的情况下调用
 */
export function compileAllMaterials(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): void {
  // 创建临时几何体
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const tempMeshes: THREE.Mesh[] = []
  
  // 为每个预设创建临时网格
  MATERIAL_PRESETS.forEach((preset) => {
    const material = getMaterialManager().getStandardMaterial(preset.options)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.visible = false // 不显示
    scene.add(mesh)
    tempMeshes.push(mesh)
  })
  
  // 渲染一帧，触发着色器编译
  renderer.compile(scene, camera)
  
  // 清理临时网格
  tempMeshes.forEach(mesh => scene.remove(mesh))
  geometry.dispose()
  
  console.log('[MaterialPreloader] 着色器编译完成')
}
```

**使用示例**：

```typescript
// 在应用启动时
async function initApp() {
  // 显示加载界面
  showLoadingScreen()
  
  // 预热材质
  await warmupMaterials({
    onProgress: (loaded, total) => {
      updateLoadingProgress(loaded / total * 100)
    }
  })
  
  // 创建引擎
  const engine = new ThreeEngine(container)
  
  // 编译着色器
  compileAllMaterials(engine.renderer, engine.scene, engine.camera)
  
  // 隐藏加载界面
  hideLoadingScreen()
}
```

**关键点**：
- 预创建材质避免首次使用时的延迟
- 预加载纹理避免网络等待
- `renderer.compile()` 预编译着色器
- 提供进度回调用于显示加载进度

</details>

---

### 练习 3：添加缓存统计
- 显示当前缓存了多少材质和几何体
- 计算节省了多少内存

<details>
<summary>📝 参考答案</summary>

```typescript
// 在 MaterialManager 类中添加

interface CacheStats {
  materialCount: number
  geometryCount: number
  textureCount: number
  estimatedMemorySaved: string
  hitRate: number
}

class MaterialManager {
  private cache = new Map<string, THREE.Material>()
  private hitCount = 0
  private missCount = 0
  
  getStandardMaterial(options: MaterialOptions): THREE.MeshStandardMaterial {
    const key = JSON.stringify(options)
    
    if (this.cache.has(key)) {
      this.hitCount++ // 缓存命中
      return this.cache.get(key) as THREE.MeshStandardMaterial
    }
    
    this.missCount++ // 缓存未命中
    const material = new THREE.MeshStandardMaterial(options)
    this.cache.set(key, material)
    return material
  }
  
  getStats(): { count: number; hitRate: number } {
    const total = this.hitCount + this.missCount
    return {
      count: this.cache.size,
      hitRate: total > 0 ? this.hitCount / total : 0,
    }
  }
  
  resetStats(): void {
    this.hitCount = 0
    this.missCount = 0
  }
}

// 全局缓存统计函数
export function getCacheStats(): CacheStats {
  const mm = getMaterialManager()
  const gf = getGeometryFactory()
  const tm = getTextureManager()
  
  const materialStats = mm.getStats()
  const geometryStats = gf.getStats()
  const textureStats = tm.getStats()
  
  // 估算节省的内存
  // 假设每个材质约 1KB，每个几何体约 10KB，每个纹理约 1MB
  const materialMemory = materialStats.count * 1 // KB
  const geometryMemory = geometryStats.count * 10 // KB
  const textureMemory = textureStats.count * 1024 // KB
  
  // 如果没有缓存，每次使用都会创建新对象
  // 假设平均每个对象被使用 10 次
  const avgUsage = 10
  const savedMemory = (
    materialMemory * (avgUsage - 1) +
    geometryMemory * (avgUsage - 1) +
    textureMemory * (avgUsage - 1)
  )
  
  return {
    materialCount: materialStats.count,
    geometryCount: geometryStats.count,
    textureCount: textureStats.count,
    estimatedMemorySaved: formatBytes(savedMemory * 1024),
    hitRate: (materialStats.hitRate + geometryStats.hitRate) / 2,
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// 创建统计面板组件
export function createCacheStatsPanel(container: HTMLElement): {
  update: () => void
  destroy: () => void
} {
  const panel = document.createElement('div')
  panel.className = 'cache-stats-panel'
  panel.innerHTML = `
    <h4>缓存统计</h4>
    <div class="stat-row">
      <span>材质:</span>
      <span id="stat-materials">0</span>
    </div>
    <div class="stat-row">
      <span>几何体:</span>
      <span id="stat-geometries">0</span>
    </div>
    <div class="stat-row">
      <span>纹理:</span>
      <span id="stat-textures">0</span>
    </div>
    <div class="stat-row">
      <span>命中率:</span>
      <span id="stat-hitrate">0%</span>
    </div>
    <div class="stat-row highlight">
      <span>节省内存:</span>
      <span id="stat-saved">0 KB</span>
    </div>
  `
  
  panel.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    font-family: monospace;
    min-width: 150px;
  `
  
  container.appendChild(panel)
  
  const update = () => {
    const stats = getCacheStats()
    panel.querySelector('#stat-materials')!.textContent = String(stats.materialCount)
    panel.querySelector('#stat-geometries')!.textContent = String(stats.geometryCount)
    panel.querySelector('#stat-textures')!.textContent = String(stats.textureCount)
    panel.querySelector('#stat-hitrate')!.textContent = `${(stats.hitRate * 100).toFixed(1)}%`
    panel.querySelector('#stat-saved')!.textContent = stats.estimatedMemorySaved
  }
  
  // 初始更新
  update()
  
  // 定期更新
  const timer = setInterval(update, 1000)
  
  return {
    update,
    destroy: () => {
      clearInterval(timer)
      container.removeChild(panel)
    }
  }
}
```

**使用示例**：

```typescript
// 创建统计面板
const statsPanel = createCacheStatsPanel(document.body)

// 手动更新
statsPanel.update()

// 获取统计数据
const stats = getCacheStats()
console.log(`缓存了 ${stats.materialCount} 个材质`)
console.log(`命中率: ${(stats.hitRate * 100).toFixed(1)}%`)
console.log(`节省内存: ${stats.estimatedMemorySaved}`)

// 清理
statsPanel.destroy()
```

**关键点**：
- 记录缓存命中和未命中次数计算命中率
- 估算内存节省（基于假设的对象大小和使用次数）
- 提供可视化面板方便调试
- 定期更新统计数据

</details>

---

## 关键文件

- `apps/frontend/SMART-MALL/src/builder/resources/resource-manager.ts` - 资源管理器
- `apps/frontend/SMART-MALL/src/engine/materials/MaterialManager.ts` - 材质管理器
- `apps/frontend/SMART-MALL/src/engine/objects/GeometryFactory.ts` - 几何体工厂

---

*"知识的开始是发现自己的无知。" —— 苏格拉底*
