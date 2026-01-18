/**
 * 商城模板系统
 * 
 * 提供预设的商城轮廓模板
 * 支持矩形、L形、U形、T形、圆形等常见形状
 */

import type { Point2D, Polygon } from '../geometry/types'
import type { 
  MallTemplate, 
  TemplateType, 
  OutlineParams,
  MallProject,
  FloorDefinition,
} from '../types'
import { 
  createEmptyProject, 
  createDefaultFloor,
} from '../factories'
import { generateId } from '../utils'

// ============================================================================
// 模板定义
// ============================================================================

/**
 * 预设模板列表
 */
export const MALL_TEMPLATES: MallTemplate[] = [
  {
    id: 'rectangle',
    name: '矩形商城',
    description: '标准矩形布局，适合大多数商业场景',
    type: 'rectangle',
    data: {
      outlineParams: { type: 'rectangle', width: 100, height: 80 },
      defaultFloors: 3,
    },
  },
  {
    id: 'l-shape',
    name: 'L形商城',
    description: 'L形布局，适合转角地块或需要更多临街面的场景',
    type: 'l-shape',
    data: {
      outlineParams: { 
        type: 'l-shape', 
        width: 120, 
        height: 100,
        extra: { armWidth: 40, armHeight: 60 },
      },
      defaultFloors: 3,
    },
  },
  {
    id: 'u-shape',
    name: 'U形商城',
    description: 'U形布局，中央可设置广场或中庭',
    type: 'u-shape',
    data: {
      outlineParams: { 
        type: 'u-shape', 
        width: 120, 
        height: 100,
        extra: { courtWidth: 40, courtHeight: 60 },
      },
      defaultFloors: 3,
    },
  },
  {
    id: 't-shape',
    name: 'T形商城',
    description: 'T形布局，适合主入口突出的设计',
    type: 't-shape',
    data: {
      outlineParams: { 
        type: 't-shape', 
        width: 120, 
        height: 100,
        extra: { stemWidth: 40, stemHeight: 50 },
      },
      defaultFloors: 3,
    },
  },
  {
    id: 'circle',
    name: '圆形商城',
    description: '圆形布局，适合特色商业或地标建筑',
    type: 'circle',
    data: {
      outlineParams: { 
        type: 'circle', 
        width: 100, 
        height: 100,
        extra: { sides: 32 },
      },
      defaultFloors: 3,
    },
  },
]

// ============================================================================
// 轮廓生成函数
// ============================================================================

/**
 * 根据参数生成商城轮廓
 */
export function generateOutline(params: OutlineParams): Polygon {
  switch (params.type) {
    case 'rectangle':
      return generateRectangle(params.width, params.height)
    case 'l-shape':
      return generateLShape(params.width, params.height, params.extra)
    case 'u-shape':
      return generateUShape(params.width, params.height, params.extra)
    case 't-shape':
      return generateTShape(params.width, params.height, params.extra)
    case 'circle':
      return generateCircle(params.width / 2, params.extra?.sides ?? 32)
    default:
      return generateRectangle(params.width, params.height)
  }
}

/**
 * 生成矩形轮廓（居中）
 */
export function generateRectangle(width: number, height: number): Polygon {
  const halfW = width / 2
  const halfH = height / 2
  return {
    vertices: [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH },
    ],
    isClosed: true,
  }
}

/**
 * 生成L形轮廓（居中）
 * 
 *    ┌────────┐
 *    │        │
 *    │   ┌────┘
 *    │   │
 *    └───┘
 */
export function generateLShape(
  width: number, 
  height: number, 
  extra?: Record<string, number>
): Polygon {
  const armWidth = extra?.armWidth ?? width * 0.4
  const armHeight = extra?.armHeight ?? height * 0.6
  const halfW = width / 2
  const halfH = height / 2
  
  return {
    vertices: [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: -halfH + (height - armHeight) },
      { x: -halfW + armWidth, y: -halfH + (height - armHeight) },
      { x: -halfW + armWidth, y: halfH },
      { x: -halfW, y: halfH },
    ],
    isClosed: true,
  }
}

/**
 * 生成U形轮廓（居中）
 * 
 *    ┌───┐   ┌───┐
 *    │   │   │   │
 *    │   └───┘   │
 *    │           │
 *    └───────────┘
 */
export function generateUShape(
  width: number, 
  height: number, 
  extra?: Record<string, number>
): Polygon {
  const courtWidth = extra?.courtWidth ?? width * 0.4
  const courtHeight = extra?.courtHeight ?? height * 0.5
  const sideWidth = (width - courtWidth) / 2
  const halfW = width / 2
  const halfH = height / 2
  
  return {
    vertices: [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: halfW - sideWidth, y: halfH },
      { x: halfW - sideWidth, y: halfH - courtHeight },
      { x: -halfW + sideWidth, y: halfH - courtHeight },
      { x: -halfW + sideWidth, y: halfH },
      { x: -halfW, y: halfH },
    ],
    isClosed: true,
  }
}

/**
 * 生成T形轮廓（居中）
 * 
 *    ┌───────────┐
 *    │           │
 *    └───┐   ┌───┘
 *        │   │
 *        └───┘
 */
export function generateTShape(
  width: number, 
  height: number, 
  extra?: Record<string, number>
): Polygon {
  const stemWidth = extra?.stemWidth ?? width * 0.4
  const stemHeight = extra?.stemHeight ?? height * 0.5
  const topHeight = height - stemHeight
  const halfW = width / 2
  const halfH = height / 2
  const halfStem = stemWidth / 2
  
  return {
    vertices: [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: -halfH + topHeight },
      { x: halfStem, y: -halfH + topHeight },
      { x: halfStem, y: halfH },
      { x: -halfStem, y: halfH },
      { x: -halfStem, y: -halfH + topHeight },
      { x: -halfW, y: -halfH + topHeight },
    ],
    isClosed: true,
  }
}

/**
 * 生成圆形（正多边形近似）轮廓（居中）
 */
export function generateCircle(radius: number, sides: number = 32): Polygon {
  const vertices: Point2D[] = []
  const angleStep = (2 * Math.PI) / sides
  
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2
    vertices.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    })
  }
  
  return { vertices, isClosed: true }
}

// ============================================================================
// 项目创建函数
// ============================================================================

/**
 * 从模板创建项目
 */
export function createProjectFromTemplate(
  template: MallTemplate,
  projectName: string,
  customParams?: Partial<OutlineParams>
): MallProject {
  const params = {
    ...template.data.outlineParams,
    ...customParams,
  }
  
  const outline = generateOutline(params)
  const project = createEmptyProject(projectName)
  
  project.outline = outline
  
  // 创建默认楼层
  for (let i = 1; i <= template.data.defaultFloors; i++) {
    project.floors.push(createDefaultFloor(i))
  }
  
  return project
}

/**
 * 从自定义轮廓创建项目
 */
export function createProjectFromOutline(
  outline: Polygon,
  projectName: string,
  floorCount: number = 1
): MallProject {
  const project = createEmptyProject(projectName)
  project.outline = outline
  
  for (let i = 1; i <= floorCount; i++) {
    project.floors.push(createDefaultFloor(i))
  }
  
  return project
}

// ============================================================================
// 模板查询函数
// ============================================================================

/**
 * 获取所有模板
 */
export function getAllTemplates(): MallTemplate[] {
  return [...MALL_TEMPLATES]
}

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): MallTemplate | undefined {
  return MALL_TEMPLATES.find(t => t.id === id)
}

/**
 * 根据类型获取模板
 */
export function getTemplatesByType(type: TemplateType): MallTemplate[] {
  return MALL_TEMPLATES.filter(t => t.type === type)
}

// ============================================================================
// 轮廓验证
// ============================================================================

/**
 * 验证轮廓是否有效
 */
export function validateOutline(outline: Polygon): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (outline.vertices.length < 3) {
    errors.push('轮廓至少需要3个顶点')
  }
  
  // 检查是否有重复顶点
  for (let i = 0; i < outline.vertices.length; i++) {
    for (let j = i + 1; j < outline.vertices.length; j++) {
      const vi = outline.vertices[i]
      const vj = outline.vertices[j]
      if (Math.abs(vi.x - vj.x) < 0.001 && Math.abs(vi.y - vj.y) < 0.001) {
        errors.push(`顶点 ${i} 和 ${j} 重复`)
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

// ============================================================================
// 导出索引
// ============================================================================

export {
  generateOutline as createOutline,
}
