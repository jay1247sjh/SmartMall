/**
 * 项目工厂函数
 * 
 * 职责：
 * - 创建和初始化项目相关对象
 * - 提供合理的默认值
 * - 封装对象创建逻辑
 * 
 * 规则：
 * - 只包含创建对象的函数
 * - 不包含业务逻辑
 * - 不包含类型定义
 */

import type { 
  MallProject, 
  ProjectSettings, 
  DisplaySettings,
  FloorDefinition 
} from '../types'
import { generateId } from '../utils/id-generator'

// ============================================================================
// 设置工厂
// ============================================================================

/**
 * 创建默认显示设置
 * 
 * @returns 默认显示设置对象
 */
export function createDefaultDisplaySettings(): DisplaySettings {
  return {
    showGrid: true,
    showRuler: true,
    showAreaLabels: true,
    backgroundColor: '#0a0a0a',
    gridColor: '#1a1a1a',
  }
}

/**
 * 创建默认项目设置
 * 
 * @returns 默认项目设置对象
 */
export function createDefaultSettings(): ProjectSettings {
  return {
    gridSize: 1,
    snapToGrid: true,
    defaultFloorHeight: 4,
    unit: 'meters',
    display: createDefaultDisplaySettings(),
  }
}

// ============================================================================
// 项目工厂
// ============================================================================

/**
 * 创建空项目
 * 
 * 创建一个带有默认轮廓（100m x 100m 正方形）和默认设置的新项目。
 * 
 * @param name - 项目名称
 * @returns 新创建的项目对象
 * 
 * @example
 * ```ts
 * const project = createEmptyProject('我的商城')
 * console.log(project.id)      // => "lxyz1234-abc5678"
 * console.log(project.floors)  // => []
 * ```
 */
export function createEmptyProject(name: string): MallProject {
  const now = new Date().toISOString()
  
  return {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    version: 1,
    outline: {
      vertices: [
        { x: -50, y: -50 },
        { x: 50, y: -50 },
        { x: 50, y: 50 },
        { x: -50, y: 50 },
      ],
      isClosed: true,
    },
    floors: [],
    settings: createDefaultSettings(),
  }
}

// ============================================================================
// 楼层工厂
// ============================================================================

/**
 * 创建默认楼层
 * 
 * @param level - 楼层编号（可为负数，如 B1 = -1）
 * @param name - 楼层名称（可选，默认为 "{level}F"）
 * @returns 新创建的楼层对象
 * 
 * @example
 * ```ts
 * const floor1 = createDefaultFloor(1)         // name = "1F"
 * const floor2 = createDefaultFloor(2, '二楼') // name = "二楼"
 * const basement = createDefaultFloor(-1)      // name = "-1F"
 * ```
 */
export function createDefaultFloor(level: number, name?: string): FloorDefinition {
  return {
    id: generateId(),
    name: name ?? `${level}F`,
    level,
    height: 4,
    inheritOutline: true,
    areas: [],
    visible: true,
    locked: false,
  }
}
