# Design Document: Mall Builder Custom Structure

## Overview

本设计文档描述如何增强商城建模器，使管理员能够自定义商城的整体结构，包括外轮廓、楼层形状和区域划分。核心设计理念是将几何操作与业务逻辑分离，提供灵活且直观的建模体验。

## Architecture

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MallBuilderView.vue                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ ToolPanel   │  │ Canvas3D    │  │ PropertyPanel       │  │
│  │ - Outline   │  │ - Render    │  │ - Mall Properties   │  │
│  │ - Floor     │  │ - Interact  │  │ - Floor Properties  │  │
│  │ - Area      │  │ - Preview   │  │ - Area Properties   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Geometry Module                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Polygon     │  │ Containment │  │ OverlapDetection    │  │
│  │ Operations  │  │ Validator   │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ MallProject │  │ FloorData   │  │ AreaData            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 模块职责

1. **MallBuilderView** - 主视图组件，协调各面板和3D渲染
2. **Geometry Module** - 纯几何计算，不依赖UI框架
3. **Data Layer** - 数据模型和持久化

## Components and Interfaces

### 1. 几何核心模块 (geometry/)

```typescript
// geometry/types.ts
interface Point2D {
  x: number
  y: number
}

interface Polygon {
  vertices: Point2D[]
  isClosed: boolean
}

interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

// geometry/polygon.ts
class PolygonOperations {
  // 计算多边形面积（Shoelace公式）
  static calculateArea(polygon: Polygon): number
  
  // 计算多边形周长
  static calculatePerimeter(polygon: Polygon): number
  
  // 检查点是否在多边形内（射线法）
  static isPointInside(point: Point2D, polygon: Polygon): boolean
  
  // 检查多边形A是否完全包含在多边形B内
  static isContainedIn(inner: Polygon, outer: Polygon): boolean
  
  // 检查两个多边形是否重叠
  static doPolygonsOverlap(a: Polygon, b: Polygon): boolean
  
  // 获取边界框
  static getBoundingBox(polygon: Polygon): BoundingBox
  
  // 添加顶点
  static addVertex(polygon: Polygon, index: number, point: Point2D): Polygon
  
  // 移除顶点
  static removeVertex(polygon: Polygon, index: number): Polygon | null
  
  // 对齐到网格
  static snapToGrid(point: Point2D, gridSize: number): Point2D
}
```

### 2. 数据模型

```typescript
// types/mall-project.ts
interface MallProject {
  id: string
  name: string
  outline: Polygon           // 商城外轮廓
  floors: FloorDefinition[]
  gridSize: number
  createdAt: string
  updatedAt: string
}

interface FloorDefinition {
  id: number
  name: string
  level: number
  height: number             // 层高（米）
  shape: Polygon | null      // null表示继承商城轮廓
  areas: AreaDefinition[]
}

interface AreaDefinition {
  id: number
  name: string
  type: AreaType
  status: AreaStatus
  shape: Polygon
  merchantId?: number
}

type AreaType = '餐饮' | '零售' | '服装' | '娱乐' | '服务' | '其他'
type AreaStatus = 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'
```

### 3. 模板系统

```typescript
// templates/mall-templates.ts
interface MallTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  outline: Polygon
  suggestedFloors: number
  defaultFloorHeight: number
}

const MALL_TEMPLATES: MallTemplate[] = [
  {
    id: 'rectangular',
    name: '矩形商城',
    description: '标准矩形布局，适合大多数商城',
    outline: { vertices: [...], isClosed: true },
    suggestedFloors: 3,
    defaultFloorHeight: 4.5
  },
  {
    id: 'l-shaped',
    name: 'L形商城',
    description: 'L形布局，适合转角地块',
    outline: { vertices: [...], isClosed: true },
    suggestedFloors: 2,
    defaultFloorHeight: 4.5
  },
  // ... more templates
]
```

### 4. 绘制工具状态机

```typescript
// composables/useDrawingTool.ts
type DrawingMode = 'none' | 'outline' | 'floor' | 'area'
type ShapeType = 'rectangle' | 'polygon' | 'freeform'

interface DrawingState {
  mode: DrawingMode
  shapeType: ShapeType
  currentPoints: Point2D[]
  isDrawing: boolean
  previewShape: Polygon | null
}

function useDrawingTool() {
  const state = reactive<DrawingState>({...})
  
  function startDrawing(mode: DrawingMode, shapeType: ShapeType): void
  function addPoint(point: Point2D): void
  function finishDrawing(): Polygon | null
  function cancelDrawing(): void
  function undo(): void
  
  return { state, startDrawing, addPoint, finishDrawing, cancelDrawing, undo }
}
```

## Data Models

### 项目数据结构

```typescript
// 完整的项目数据结构
interface MallProjectData {
  // 元数据
  version: string
  projectId: string
  projectName: string
  createdAt: string
  updatedAt: string
  
  // 商城配置
  mall: {
    outline: Polygon
    gridSize: number
    unit: 'meters' | 'feet'
  }
  
  // 楼层数据
  floors: Array<{
    id: number
    name: string
    level: number
    height: number
    shape: Polygon | null
    areas: Array<{
      id: number
      name: string
      type: AreaType
      status: AreaStatus
      shape: Polygon
      properties: Record<string, unknown>
    }>
  }>
  
  // 背景图层
  backgroundImage?: {
    url: string
    scale: number
    offsetX: number
    offsetY: number
    opacity: number
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Polygon Area Calculation Correctness

*For any* valid polygon (closed, non-self-intersecting), the calculated area using the Shoelace formula SHALL equal the mathematical area of that polygon.

**Validates: Requirements 1.3**

### Property 2: Containment Validation

*For any* floor shape or area shape, if it is accepted by the system, it SHALL be geometrically contained within its parent boundary (floor within mall outline, area within floor shape).

**Validates: Requirements 1.4, 2.2, 2.4**

### Property 3: Boundary Modification Warning

*For any* modification to the mall outline that would cause existing floors or areas to extend outside the new boundary, the system SHALL detect and report this condition.

**Validates: Requirements 1.5, 3.5**

### Property 4: Polygon Vertex Operations

*For any* polygon with n vertices (n ≥ 3):
- Adding a vertex SHALL result in a polygon with n+1 vertices
- Removing a vertex (when n > 3) SHALL result in a polygon with n-1 vertices
- Removing a vertex when n = 3 SHALL be rejected (minimum triangle)

**Validates: Requirements 3.2**

### Property 5: Overlap Detection

*For any* two areas on the same floor, if they share interior points (overlap), the system SHALL detect and report the overlap.

**Validates: Requirements 3.3**

### Property 6: Grid Snapping

*For any* point with snap-to-grid enabled, the snapped coordinates SHALL be exact multiples of the grid size.

**Validates: Requirements 3.4**

### Property 7: Template Generation Validity

*For any* selected template, the generated mall outline SHALL be a valid closed polygon, and all suggested floor divisions SHALL be contained within that outline.

**Validates: Requirements 4.2**

### Property 8: Floor Height Positioning

*For any* multi-floor configuration, each floor's 3D position (Y coordinate) SHALL equal the sum of all lower floors' heights.

**Validates: Requirements 6.1**

### Property 9: Image Transformation Consistency

*For any* background image with scale S, offset (X, Y), and opacity O:
- The rendered image dimensions SHALL be original dimensions × S
- The rendered position SHALL be at (X, Y)
- The rendered opacity SHALL be O (0 ≤ O ≤ 1)

**Validates: Requirements 5.2, 5.4**

## Error Handling

### 几何操作错误

| 错误类型 | 处理方式 |
|---------|---------|
| 多边形顶点不足 | 显示提示"至少需要3个顶点" |
| 多边形自相交 | 高亮相交点，阻止保存 |
| 区域超出边界 | 显示警告，提供裁剪选项 |
| 区域重叠 | 高亮重叠区域，阻止保存 |

### 文件操作错误

| 错误类型 | 处理方式 |
|---------|---------|
| 图片格式不支持 | 显示"仅支持PNG、JPG、SVG格式" |
| 图片加载失败 | 显示错误提示，允许重试 |
| 项目保存失败 | 显示错误，自动保存到本地存储 |

## Testing Strategy

### 单元测试

- **几何计算测试**: 测试面积、周长、包含关系等计算的正确性
- **数据模型测试**: 测试数据序列化/反序列化
- **模板生成测试**: 测试各模板生成的有效性

### 属性测试 (Property-Based Testing)

使用 `fast-check` 库进行属性测试：

```typescript
import fc from 'fast-check'

// Property 1: Area calculation
fc.assert(
  fc.property(
    fc.array(fc.tuple(fc.float(), fc.float()), { minLength: 3, maxLength: 20 }),
    (points) => {
      const polygon = { vertices: points.map(([x, y]) => ({ x, y })), isClosed: true }
      const area = PolygonOperations.calculateArea(polygon)
      return area >= 0 // Area should be non-negative
    }
  )
)

// Property 6: Grid snapping
fc.assert(
  fc.property(
    fc.float(),
    fc.float(),
    fc.integer({ min: 1, max: 100 }),
    (x, y, gridSize) => {
      const snapped = PolygonOperations.snapToGrid({ x, y }, gridSize)
      return snapped.x % gridSize === 0 && snapped.y % gridSize === 0
    }
  )
)
```

### 集成测试

- 测试完整的绘制流程（开始→添加点→完成）
- 测试模板应用后的编辑流程
- 测试导入图片后的描绘流程

### E2E测试

- 测试从新建项目到保存的完整流程
- 测试多楼层编辑和切换
- 测试3D预览的交互

