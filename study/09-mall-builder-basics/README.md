# 商城建模器基础学习指南

> 苏格拉底式教学：通过提问引导你理解 3D 商城建模器的设计

## 第一部分：理解问题

### 问题 1：建模器需要做什么？

在这个项目中，用户可以在 3D 场景中设计商城布局。

**建模器需要支持哪些操作？**

请先思考 30 秒...

---

<details>
<summary>💡 点击查看引导</summary>

核心功能：

1. **创建对象**
   - 楼层、区域、店铺
   - 电梯、扶梯、楼梯
   - 家具、设施

2. **编辑对象**
   - 移动、旋转、缩放
   - 修改属性（颜色、名称等）

3. **选择对象**
   - 点击选中
   - 显示选中状态
   - 显示属性面板

4. **保存/加载**
   - 导出为 JSON
   - 从 JSON 恢复

5. **视角控制**
   - 旋转、缩放、平移
   - 切换楼层视图

</details>

---

### 问题 2：为什么要分层设计？

看项目的目录结构：

```
builder/
├── objects/       # 3D 模型（电梯、扶梯、家具）
├── geometry/      # 几何计算（多边形、碰撞检测）
├── materials/     # 材质管理
├── resources/     # 资源缓存
├── templates/     # 商城模板
├── tools/         # 编辑工具
└── types/         # 类型定义
```

**为什么不把所有代码放在一个文件里？**

---

<details>
<summary>💡 点击查看引导</summary>

分层的好处：

1. **单一职责**
   - 每个模块只做一件事
   - 修改一个功能不影响其他

2. **可复用**
   - 材质管理可以被多个模型使用
   - 几何计算可以被多个工具使用

3. **可测试**
   - 每个模块可以独立测试
   - 不需要启动整个应用

4. **可维护**
   - 新人容易理解
   - 容易定位问题

**类比**：
- 一个文件 = 一个人做所有事
- 分层 = 团队分工协作

</details>

---

## 第二部分：3D 对象组织

### 问题 3：`THREE.Group` 是什么？

看电梯模型的代码：

```typescript
export function createElevatorModel(
  group: THREE.Group,
  size: number,
  color: number,
  isSelected: boolean
): void {
  // 创建各个部件
  const backWall = new THREE.Mesh(geometry, material)
  group.add(backWall)
  
  const leftWall = new THREE.Mesh(geometry, material)
  group.add(leftWall)
  
  // ...更多部件
}
```

**为什么要用 `Group` 而不是直接添加到 `Scene`？**

---

<details>
<summary>💡 点击查看引导</summary>

`Group` 是一个容器，可以包含多个 3D 对象。

好处：

1. **整体操作**
   ```typescript
   // 移动整个电梯（所有部件一起移动）
   elevatorGroup.position.set(10, 0, 5)
   
   // 旋转整个电梯
   elevatorGroup.rotation.y = Math.PI / 2
   ```

2. **层级结构**
   ```
   Scene
   └── Floor1Group
       ├── ElevatorGroup
       │   ├── BackWall
       │   ├── LeftWall
       │   └── Door
       └── ShopGroup
           ├── Wall
           └── Counter
   ```

3. **方便删除**
   ```typescript
   // 删除整个电梯
   scene.remove(elevatorGroup)
   ```

4. **局部坐标**
   - 部件的位置相对于 Group
   - 移动 Group 时，部件跟着移动

</details>

---

### 问题 4：为什么模型函数接收 `group` 参数？

```typescript
export function createElevatorModel(
  group: THREE.Group,  // 外部传入
  size: number,
  color: number,
  isSelected: boolean
): void {
  // 往 group 里添加部件
}
```

**为什么不在函数内部创建 Group 并返回？**

---

<details>
<summary>💡 点击查看引导</summary>

两种设计的对比：

**方式 1：内部创建并返回**
```typescript
function createElevator(): THREE.Group {
  const group = new THREE.Group()
  // 添加部件
  return group
}

// 使用
const elevator = createElevator()
scene.add(elevator)
```

**方式 2：外部传入**
```typescript
function createElevator(group: THREE.Group): void {
  // 往 group 里添加部件
}

// 使用
const elevator = new THREE.Group()
createElevator(elevator)
scene.add(elevator)
```

方式 2 的好处：
- 调用者控制 Group 的创建
- 可以在创建前设置 Group 的属性
- 可以复用已有的 Group
- 更灵活

**依赖注入**：把依赖（Group）从外部传入，而不是内部创建。

</details>

---

## 第三部分：选中状态

### 问题 5：如何表示"选中"状态？

```typescript
export function createElevatorModel(
  group: THREE.Group,
  size: number,
  color: number,
  isSelected: boolean  // 是否选中
): void {
  // 指示灯材质根据选中状态变化
  const indicatorMaterial = createIndicatorMaterial(color, isSelected)
}
```

**选中状态如何影响渲染？**

---

<details>
<summary>💡 点击查看引导</summary>

选中状态的视觉反馈：

1. **颜色变化**
   ```typescript
   function createIndicatorMaterial(color: number, isSelected: boolean) {
     const actualColor = isSelected ? 0x00ff00 : color  // 选中时变绿
     return getMaterialManager().getStandardMaterial({
       color: actualColor,
       emissive: actualColor,
       emissiveIntensity: 0.5,
     })
   }
   ```

2. **发光效果**
   - `emissive`：自发光颜色
   - `emissiveIntensity`：发光强度
   - 选中时更亮

3. **轮廓线**（另一种方式）
   - 给选中对象添加描边
   - 使用后处理效果

**问题**：如果选中状态变化，需要重新创建模型吗？

</details>

---

### 问题 6：选中状态变化时如何更新？

**当用户点击另一个对象时，之前选中的对象需要取消选中。如何实现？**

---

<details>
<summary>💡 点击查看引导</summary>

两种方式：

**方式 1：重新创建模型**
```typescript
function updateSelection(newSelected: THREE.Group) {
  // 重新创建旧对象（isSelected = false）
  recreateModel(oldSelected, false)
  
  // 重新创建新对象（isSelected = true）
  recreateModel(newSelected, true)
}
```
- 简单但性能差
- 每次选中都要重建

**方式 2：只更新材质**
```typescript
function updateSelection(newSelected: THREE.Group) {
  // 更新旧对象的材质
  updateMaterial(oldSelected, false)
  
  // 更新新对象的材质
  updateMaterial(newSelected, true)
}

function updateMaterial(group: THREE.Group, isSelected: boolean) {
  const indicator = group.getObjectByName('indicator')
  if (indicator instanceof THREE.Mesh) {
    indicator.material = createIndicatorMaterial(color, isSelected)
  }
}
```
- 性能好
- 需要能找到要更新的部件

**最佳实践**：给重要部件命名，方便后续查找和更新。

</details>

---

## 第四部分：几何计算

### 问题 7：碰撞检测是如何工作的？

在漫游模式中，角色不能穿墙。

```typescript
private isInsideBoundary(x: number, z: number): boolean {
  const point2D: Point2D = { x: x, y: -z }
  
  // 检查是否在商城边界内
  if (this.boundary && !isPointInside(point2D, this.boundary)) {
    return false
  }
  
  // 检查是否在任何障碍物内
  for (const obstacle of this.obstacles) {
    if (isPointInside(point2D, obstacle)) {
      return false
    }
  }
  
  return true
}
```

**`isPointInside` 是如何判断点是否在多边形内的？**

---

<details>
<summary>💡 点击查看引导</summary>

**射线法（Ray Casting）**：

从点向任意方向发射一条射线，数射线与多边形边的交点数：
- 奇数个交点 → 点在多边形内
- 偶数个交点 → 点在多边形外

```
        *  (点在外部)
       /
      /
     /____
    |     |
    |  *  |  (点在内部)
    |_____|
```

为什么有效？
- 从外部进入多边形，穿过 1 条边
- 从内部出去，再穿过 1 条边
- 内部的点：进入 1 次，出去 1 次 = 奇数
- 外部的点：进入 0 次 = 偶数

**注意**：这是 2D 碰撞检测，Y 轴（高度）被忽略。

</details>

---

### 问题 8：为什么要检查多个点？

```typescript
const checkPoints = [
  { x: newX, z: newZ },                    // 中心
  { x: newX + this.collisionRadius, z: newZ },  // 右
  { x: newX - this.collisionRadius, z: newZ },  // 左
  { x: newX, z: newZ + this.collisionRadius },  // 前
  { x: newX, z: newZ - this.collisionRadius },  // 后
]

let canMove = true
for (const pt of checkPoints) {
  if (!this.isInsideBoundary(pt.x, pt.z)) {
    canMove = false
    break
  }
}
```

**为什么不只检查角色中心点？**

---

<details>
<summary>💡 点击查看引导</summary>

只检查中心点的问题：

```
     墙
      |
   [角色]  ← 中心点在边界内
      |      但身体已经穿墙了
      |
```

检查多个点：

```
     墙
      |
   [*角色*]  ← 检查 5 个点
      |        任何一个点出界就不能移动
      |
```

**`collisionRadius`**：角色的"碰撞半径"，模拟角色的体积。

**更精确的方式**：
- 使用圆形碰撞检测
- 使用物理引擎（如 Cannon.js）
- 但对于简单场景，5 点检测足够了

</details>

---

## 第五部分：模板系统

### 问题 9：商城模板是什么？

**用户可以从预设模板开始创建商城，而不是从零开始。模板应该包含什么？**

---

<details>
<summary>💡 点击查看引导</summary>

模板内容：

1. **基础结构**
   - 商城轮廓（多边形）
   - 楼层数量和高度
   - 入口位置

2. **预设区域**
   - 电梯井位置
   - 扶梯位置
   - 公共区域

3. **默认配置**
   - 材质颜色
   - 灯光设置

模板格式（JSON）：
```json
{
  "name": "标准商城",
  "outline": [[0,0], [100,0], [100,80], [0,80]],
  "floors": [
    { "level": 1, "height": 5 },
    { "level": 2, "height": 5 }
  ],
  "elevators": [
    { "position": [10, 10], "size": 3 }
  ]
}
```

**好处**：
- 快速开始
- 保证合理的布局
- 可以创建多种风格的模板

</details>

---

### 问题 10：如何从模板创建商城？

**模板是 JSON 数据，如何变成 3D 场景？**

---

<details>
<summary>💡 点击查看引导</summary>

转换流程：

```
JSON 模板
    ↓
解析数据
    ↓
创建 3D 对象
    ↓
添加到场景
```

代码示例：
```typescript
function loadTemplate(template: MallTemplate): void {
  // 1. 创建楼层
  template.floors.forEach(floor => {
    const floorGroup = createFloor(floor.level, floor.height)
    scene.add(floorGroup)
  })
  
  // 2. 创建电梯
  template.elevators.forEach(elevator => {
    const elevatorGroup = new THREE.Group()
    createElevatorModel(elevatorGroup, elevator.size, 0x888888, false)
    elevatorGroup.position.set(elevator.position[0], 0, elevator.position[1])
    scene.add(elevatorGroup)
  })
  
  // 3. 创建边界墙
  createBoundaryWalls(template.outline)
}
```

**关键**：模板定义"是什么"，代码负责"怎么做"。

</details>

---

## 动手练习

### 练习 1：添加新的设施类型
- 创建一个"休息区"模型
- 包含长椅和垃圾桶
- 支持选中状态

<details>
<summary>📝 参考答案</summary>

```typescript
// builder/objects/rest-area-model.ts

import * as THREE from 'three'
import { getMaterialManager, getBoxGeometry } from '../resources/resource-manager'

interface RestAreaOptions {
  width: number
  depth: number
  benchCount: number
  color: number
  isSelected: boolean
}

export function createRestAreaModel(
  group: THREE.Group,
  options: RestAreaOptions
): void {
  const { width, depth, benchCount, color, isSelected } = options
  
  // 清空现有内容
  while (group.children.length > 0) {
    group.remove(group.children[0])
  }
  
  // 地面标记
  const floorMaterial = getMaterialManager().getStandardMaterial({
    color: isSelected ? 0x4a9eff : 0xcccccc,
    metalness: 0.1,
    roughness: 0.9,
  })
  const floor = new THREE.Mesh(
    getBoxGeometry(width, 0.02, depth),
    floorMaterial
  )
  floor.position.y = 0.01
  floor.name = 'floor'
  group.add(floor)
  
  // 创建长椅
  const benchSpacing = width / (benchCount + 1)
  for (let i = 0; i < benchCount; i++) {
    const bench = createBench(color, isSelected)
    bench.position.set(
      -width / 2 + benchSpacing * (i + 1),
      0,
      0
    )
    bench.name = `bench_${i}`
    group.add(bench)
  }
  
  // 创建垃圾桶（两端各一个）
  const trashBin1 = createTrashBin(isSelected)
  trashBin1.position.set(-width / 2 + 0.5, 0, depth / 2 - 0.5)
  trashBin1.name = 'trashBin_1'
  group.add(trashBin1)
  
  const trashBin2 = createTrashBin(isSelected)
  trashBin2.position.set(width / 2 - 0.5, 0, depth / 2 - 0.5)
  trashBin2.name = 'trashBin_2'
  group.add(trashBin2)
  
  // 设置用户数据
  group.userData = {
    type: 'restArea',
    width,
    depth,
    benchCount,
    color,
    isSelected,
  }
}

function createBench(color: number, isSelected: boolean): THREE.Group {
  const bench = new THREE.Group()
  
  const woodMaterial = getMaterialManager().getStandardMaterial({
    color: isSelected ? 0x8b6914 : 0x8b4513,
    metalness: 0.0,
    roughness: 0.8,
  })
  
  const metalMaterial = getMaterialManager().getStandardMaterial({
    color: 0x444444,
    metalness: 0.8,
    roughness: 0.3,
  })
  
  // 座板
  const seat = new THREE.Mesh(
    getBoxGeometry(1.5, 0.05, 0.4),
    woodMaterial
  )
  seat.position.y = 0.45
  seat.castShadow = true
  bench.add(seat)
  
  // 靠背
  const backrest = new THREE.Mesh(
    getBoxGeometry(1.5, 0.4, 0.05),
    woodMaterial
  )
  backrest.position.set(0, 0.7, -0.175)
  backrest.castShadow = true
  bench.add(backrest)
  
  // 腿（4条）
  const legPositions = [
    [-0.6, 0.225, 0.15],
    [0.6, 0.225, 0.15],
    [-0.6, 0.225, -0.15],
    [0.6, 0.225, -0.15],
  ]
  
  legPositions.forEach(([x, y, z], i) => {
    const leg = new THREE.Mesh(
      getBoxGeometry(0.05, 0.45, 0.05),
      metalMaterial
    )
    leg.position.set(x, y, z)
    leg.castShadow = true
    bench.add(leg)
  })
  
  return bench
}

function createTrashBin(isSelected: boolean): THREE.Group {
  const bin = new THREE.Group()
  
  const binMaterial = getMaterialManager().getStandardMaterial({
    color: isSelected ? 0x2e7d32 : 0x1b5e20,
    metalness: 0.3,
    roughness: 0.6,
  })
  
  // 桶身（使用圆柱体）
  const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.18, 0.6, 16)
  const body = new THREE.Mesh(bodyGeometry, binMaterial)
  body.position.y = 0.3
  body.castShadow = true
  bin.add(body)
  
  // 桶盖
  const lidGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16)
  const lid = new THREE.Mesh(lidGeometry, binMaterial)
  lid.position.y = 0.625
  lid.castShadow = true
  bin.add(lid)
  
  return bin
}

// 更新选中状态
export function updateRestAreaSelection(
  group: THREE.Group,
  isSelected: boolean
): void {
  const userData = group.userData
  if (userData.type === 'restArea') {
    createRestAreaModel(group, {
      ...userData,
      isSelected,
    })
  }
}
```

**使用示例**：

```typescript
const restArea = new THREE.Group()
createRestAreaModel(restArea, {
  width: 6,
  depth: 3,
  benchCount: 2,
  color: 0x8b4513,
  isSelected: false,
})
scene.add(restArea)

// 选中时更新
updateRestAreaSelection(restArea, true)
```

**关键点**：
- 使用 Group 组织多个部件
- 每个部件命名方便后续查找
- 选中状态影响材质颜色
- 提供更新函数避免重建整个模型

</details>

---

### 练习 2：实现撤销/重做
- 记录每次操作
- 支持 Ctrl+Z 撤销
- 支持 Ctrl+Y 重做

<details>
<summary>📝 参考答案</summary>

```typescript
// builder/history/command-history.ts

interface Command {
  execute(): void
  undo(): void
  description: string
}

class CommandHistory {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxHistory: number = 50
  
  /**
   * 执行命令并记录
   */
  execute(command: Command): void {
    command.execute()
    this.undoStack.push(command)
    
    // 执行新命令后清空重做栈
    this.redoStack = []
    
    // 限制历史记录数量
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift()
    }
    
    console.log(`[History] 执行: ${command.description}`)
  }
  
  /**
   * 撤销
   */
  undo(): boolean {
    const command = this.undoStack.pop()
    if (!command) {
      console.log('[History] 没有可撤销的操作')
      return false
    }
    
    command.undo()
    this.redoStack.push(command)
    console.log(`[History] 撤销: ${command.description}`)
    return true
  }
  
  /**
   * 重做
   */
  redo(): boolean {
    const command = this.redoStack.pop()
    if (!command) {
      console.log('[History] 没有可重做的操作')
      return false
    }
    
    command.execute()
    this.undoStack.push(command)
    console.log(`[History] 重做: ${command.description}`)
    return true
  }
  
  /**
   * 检查是否可以撤销/重做
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }
  
  canRedo(): boolean {
    return this.redoStack.length > 0
  }
  
  /**
   * 清空历史
   */
  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }
}

// 单例
export const commandHistory = new CommandHistory()

// ============================================================================
// 具体命令实现
// ============================================================================

/**
 * 添加对象命令
 */
export class AddObjectCommand implements Command {
  constructor(
    private scene: THREE.Scene,
    private object: THREE.Object3D,
    public description: string = '添加对象'
  ) {}
  
  execute(): void {
    this.scene.add(this.object)
  }
  
  undo(): void {
    this.scene.remove(this.object)
  }
}

/**
 * 删除对象命令
 */
export class RemoveObjectCommand implements Command {
  private parent: THREE.Object3D | null = null
  
  constructor(
    private object: THREE.Object3D,
    public description: string = '删除对象'
  ) {
    this.parent = object.parent
  }
  
  execute(): void {
    this.parent?.remove(this.object)
  }
  
  undo(): void {
    this.parent?.add(this.object)
  }
}

/**
 * 移动对象命令
 */
export class MoveObjectCommand implements Command {
  private oldPosition: THREE.Vector3
  
  constructor(
    private object: THREE.Object3D,
    private newPosition: THREE.Vector3,
    public description: string = '移动对象'
  ) {
    this.oldPosition = object.position.clone()
  }
  
  execute(): void {
    this.object.position.copy(this.newPosition)
  }
  
  undo(): void {
    this.object.position.copy(this.oldPosition)
  }
}

/**
 * 旋转对象命令
 */
export class RotateObjectCommand implements Command {
  private oldRotation: THREE.Euler
  
  constructor(
    private object: THREE.Object3D,
    private newRotation: THREE.Euler,
    public description: string = '旋转对象'
  ) {
    this.oldRotation = object.rotation.clone()
  }
  
  execute(): void {
    this.object.rotation.copy(this.newRotation)
  }
  
  undo(): void {
    this.object.rotation.copy(this.oldRotation)
  }
}

// ============================================================================
// 键盘快捷键
// ============================================================================

export function setupHistoryShortcuts(): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ctrl+Z 撤销
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      commandHistory.undo()
    }
    
    // Ctrl+Y 或 Ctrl+Shift+Z 重做
    if (
      (event.ctrlKey && event.key === 'y') ||
      (event.ctrlKey && event.shiftKey && event.key === 'z')
    ) {
      event.preventDefault()
      commandHistory.redo()
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  
  // 返回清理函数
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}
```

**使用示例**：

```typescript
import { 
  commandHistory, 
  AddObjectCommand, 
  MoveObjectCommand,
  setupHistoryShortcuts 
} from './history/command-history'

// 设置快捷键
const cleanup = setupHistoryShortcuts()

// 添加对象（可撤销）
const elevator = new THREE.Group()
createElevatorModel(elevator, 3, 0x888888, false)
commandHistory.execute(new AddObjectCommand(scene, elevator, '添加电梯'))

// 移动对象（可撤销）
const newPosition = new THREE.Vector3(10, 0, 5)
commandHistory.execute(new MoveObjectCommand(elevator, newPosition, '移动电梯'))

// 撤销
commandHistory.undo() // 撤销移动
commandHistory.undo() // 撤销添加

// 重做
commandHistory.redo() // 重做添加

// 清理
cleanup()
```

**关键点**：
- 命令模式：每个操作封装为命令对象
- 命令包含 `execute` 和 `undo` 方法
- 使用两个栈管理撤销和重做
- 执行新命令时清空重做栈

</details>

---

### 练习 3：添加测量工具
- 点击两点测量距离
- 显示距离数值

<details>
<summary>📝 参考答案</summary>

```typescript
// builder/tools/measure-tool.ts

import * as THREE from 'three'

interface MeasureResult {
  start: THREE.Vector3
  end: THREE.Vector3
  distance: number
  line: THREE.Line
  label: THREE.Sprite
}

export class MeasureTool {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private container: HTMLElement
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()
  
  private isActive: boolean = false
  private startPoint: THREE.Vector3 | null = null
  private tempLine: THREE.Line | null = null
  private measurements: MeasureResult[] = []
  
  constructor(scene: THREE.Scene, camera: THREE.Camera, container: HTMLElement) {
    this.scene = scene
    this.camera = camera
    this.container = container
  }
  
  /**
   * 激活测量工具
   */
  activate(): void {
    this.isActive = true
    this.container.style.cursor = 'crosshair'
    this.container.addEventListener('click', this.handleClick)
    this.container.addEventListener('mousemove', this.handleMouseMove)
  }
  
  /**
   * 停用测量工具
   */
  deactivate(): void {
    this.isActive = false
    this.container.style.cursor = 'default'
    this.container.removeEventListener('click', this.handleClick)
    this.container.removeEventListener('mousemove', this.handleMouseMove)
    this.clearTempLine()
    this.startPoint = null
  }
  
  /**
   * 处理点击
   */
  private handleClick = (event: MouseEvent): void => {
    const point = this.getIntersectionPoint(event)
    if (!point) return
    
    if (!this.startPoint) {
      // 第一次点击：设置起点
      this.startPoint = point.clone()
      this.createStartMarker(point)
    } else {
      // 第二次点击：完成测量
      this.completeMeasurement(point)
      this.startPoint = null
    }
  }
  
  /**
   * 处理鼠标移动（显示临时线）
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.startPoint) return
    
    const point = this.getIntersectionPoint(event)
    if (!point) return
    
    this.updateTempLine(this.startPoint, point)
  }
  
  /**
   * 获取射线与场景的交点
   */
  private getIntersectionPoint(event: MouseEvent): THREE.Vector3 | null {
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // 与场景中的物体相交
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
    
    if (intersects.length > 0) {
      return intersects[0].point
    }
    
    // 如果没有交点，与地面相交
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const point = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(plane, point)
    return point
  }
  
  /**
   * 创建起点标记
   */
  private createStartMarker(point: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.1, 16, 16)
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
    const marker = new THREE.Mesh(geometry, material)
    marker.position.copy(point)
    marker.name = 'measureStartMarker'
    this.scene.add(marker)
  }
  
  /**
   * 更新临时线
   */
  private updateTempLine(start: THREE.Vector3, end: THREE.Vector3): void {
    this.clearTempLine()
    
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    const material = new THREE.LineDashedMaterial({
      color: 0xffff00,
      dashSize: 0.2,
      gapSize: 0.1,
    })
    
    this.tempLine = new THREE.Line(geometry, material)
    this.tempLine.computeLineDistances()
    this.tempLine.name = 'measureTempLine'
    this.scene.add(this.tempLine)
  }
  
  /**
   * 清除临时线
   */
  private clearTempLine(): void {
    if (this.tempLine) {
      this.scene.remove(this.tempLine)
      this.tempLine.geometry.dispose()
      this.tempLine = null
    }
    
    // 清除起点标记
    const marker = this.scene.getObjectByName('measureStartMarker')
    if (marker) {
      this.scene.remove(marker)
    }
  }
  
  /**
   * 完成测量
   */
  private completeMeasurement(endPoint: THREE.Vector3): void {
    if (!this.startPoint) return
    
    const distance = this.startPoint.distanceTo(endPoint)
    
    // 创建测量线
    const geometry = new THREE.BufferGeometry().setFromPoints([
      this.startPoint,
      endPoint,
    ])
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 })
    const line = new THREE.Line(geometry, material)
    line.name = `measureLine_${this.measurements.length}`
    this.scene.add(line)
    
    // 创建距离标签
    const label = this.createDistanceLabel(
      this.startPoint.clone().add(endPoint).multiplyScalar(0.5),
      distance
    )
    this.scene.add(label)
    
    // 保存测量结果
    this.measurements.push({
      start: this.startPoint.clone(),
      end: endPoint.clone(),
      distance,
      line,
      label,
    })
    
    // 清除临时元素
    this.clearTempLine()
    
    console.log(`测量距离: ${distance.toFixed(2)} 米`)
  }
  
  /**
   * 创建距离标签
   */
  private createDistanceLabel(position: THREE.Vector3, distance: number): THREE.Sprite {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 128
    canvas.height = 64
    
    context.fillStyle = 'rgba(0, 0, 0, 0.7)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    context.fillStyle = '#ffffff'
    context.font = 'bold 24px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(`${distance.toFixed(2)}m`, canvas.width / 2, canvas.height / 2)
    
    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    
    sprite.position.copy(position)
    sprite.position.y += 0.5 // 稍微抬高
    sprite.scale.set(2, 1, 1)
    sprite.name = `measureLabel_${this.measurements.length}`
    
    return sprite
  }
  
  /**
   * 清除所有测量
   */
  clearAllMeasurements(): void {
    this.measurements.forEach(m => {
      this.scene.remove(m.line)
      this.scene.remove(m.label)
      m.line.geometry.dispose()
      ;(m.label.material as THREE.SpriteMaterial).map?.dispose()
      ;(m.label.material as THREE.SpriteMaterial).dispose()
    })
    this.measurements = []
  }
  
  /**
   * 获取所有测量结果
   */
  getMeasurements(): { start: THREE.Vector3; end: THREE.Vector3; distance: number }[] {
    return this.measurements.map(m => ({
      start: m.start.clone(),
      end: m.end.clone(),
      distance: m.distance,
    }))
  }
  
  /**
   * 销毁
   */
  dispose(): void {
    this.deactivate()
    this.clearAllMeasurements()
  }
}
```

**使用示例**：

```typescript
const measureTool = new MeasureTool(scene, camera, container)

// 激活测量工具
measureTool.activate()

// 用户点击两点后自动显示距离

// 获取所有测量结果
const results = measureTool.getMeasurements()
results.forEach(r => {
  console.log(`从 ${r.start.toArray()} 到 ${r.end.toArray()}: ${r.distance.toFixed(2)}m`)
})

// 清除所有测量
measureTool.clearAllMeasurements()

// 停用
measureTool.deactivate()

// 销毁
measureTool.dispose()
```

**关键点**：
- 使用 Raycaster 获取点击位置
- 临时线使用虚线样式区分
- 使用 Sprite + Canvas 创建始终面向相机的标签
- 保存测量结果方便后续使用

</details>

---

## 关键文件

- `apps/frontend/SMART-MALL/src/builder/objects/` - 3D 模型
- `apps/frontend/SMART-MALL/src/builder/geometry/` - 几何计算
- `apps/frontend/SMART-MALL/src/builder/templates/` - 商城模板
- `apps/frontend/SMART-MALL/src/builder/resources/` - 资源管理

---

*"美德即知识。" —— 苏格拉底*
