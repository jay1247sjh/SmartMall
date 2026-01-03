/**
 * 绘制工具组合式函数
 * 
 * 管理绘制状态和交互逻辑
 * 支持矩形和多边形两种绘制模式
 */

import { ref, computed, readonly, type Ref } from 'vue'
import type { Point2D, Polygon } from '../geometry/types'
import { snapToGrid, isContainedIn, doPolygonsOverlap, calculateArea } from '../geometry/polygon'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 绘制模式
 */
export type DrawingMode = 'none' | 'rectangle' | 'polygon' | 'select' | 'edit'

/**
 * 绘制状态
 */
export type DrawingState = 'idle' | 'drawing' | 'complete'

/**
 * 绘制工具配置
 */
export interface DrawingToolConfig {
  /** 网格大小 */
  gridSize: number
  /** 是否启用网格对齐 */
  snapToGrid: boolean
  /** 边界多边形（用于验证） */
  boundary?: Polygon
  /** 已存在的区域（用于重叠检测） */
  existingAreas?: Polygon[]
  /** 最小面积 */
  minArea?: number
}

/**
 * 绘制结果
 */
export interface DrawingResult {
  /** 绘制的多边形 */
  polygon: Polygon
  /** 是否有效 */
  valid: boolean
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
}

/**
 * 绘制事件
 */
export interface DrawingEvents {
  onStart?: () => void
  onUpdate?: (points: Point2D[]) => void
  onComplete?: (result: DrawingResult) => void
  onCancel?: () => void
  onError?: (error: string) => void
}

// ============================================================================
// 组合式函数
// ============================================================================

/**
 * 绘制工具组合式函数
 */
export function useDrawingTool(
  config: Ref<DrawingToolConfig>,
  events?: DrawingEvents
) {
  // 状态
  const mode = ref<DrawingMode>('none')
  const state = ref<DrawingState>('idle')
  const points = ref<Point2D[]>([])
  const previewPoint = ref<Point2D | null>(null)
  const startPoint = ref<Point2D | null>(null)
  
  // 计算属性
  const isDrawing = computed(() => state.value === 'drawing')
  const canComplete = computed(() => {
    if (mode.value === 'rectangle') {
      return points.value.length === 1 && previewPoint.value !== null
    }
    if (mode.value === 'polygon') {
      return points.value.length >= 3
    }
    return false
  })
  
  const currentPolygon = computed<Polygon | null>(() => {
    if (mode.value === 'rectangle' && points.value.length === 1 && previewPoint.value) {
      const p1 = points.value[0]
      const p2 = previewPoint.value
      return {
        vertices: [
          { x: p1.x, y: p1.y },
          { x: p2.x, y: p1.y },
          { x: p2.x, y: p2.y },
          { x: p1.x, y: p2.y },
        ],
        isClosed: true,
      }
    }
    
    if (mode.value === 'polygon' && points.value.length >= 2) {
      const vertices = [...points.value]
      if (previewPoint.value) {
        vertices.push(previewPoint.value)
      }
      return { vertices, isClosed: false }
    }
    
    return null
  })
  
  // 辅助函数
  function snapPoint(point: Point2D): Point2D {
    if (config.value.snapToGrid && config.value.gridSize > 0) {
      return snapToGrid(point, config.value.gridSize)
    }
    return { ...point }
  }
  
  function validatePolygon(polygon: Polygon): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []
    
    // 检查顶点数
    if (polygon.vertices.length < 3) {
      errors.push('多边形至少需要3个顶点')
    }
    
    // 检查面积
    const area = calculateArea(polygon)
    if (config.value.minArea && area < config.value.minArea) {
      errors.push(`面积过小（${area.toFixed(2)} < ${config.value.minArea}）`)
    }
    
    // 检查边界
    if (config.value.boundary) {
      if (!isContainedIn(polygon, config.value.boundary)) {
        errors.push('区域超出边界')
      }
    }
    
    // 检查重叠
    if (config.value.existingAreas) {
      for (let i = 0; i < config.value.existingAreas.length; i++) {
        const existing = config.value.existingAreas[i]
        if (doPolygonsOverlap(polygon, existing)) {
          warnings.push(`与现有区域 ${i + 1} 重叠`)
        }
      }
    }
    
    return { valid: errors.length === 0, errors, warnings }
  }
  
  // 公共方法
  function setMode(newMode: DrawingMode) {
    if (state.value === 'drawing') {
      cancel()
    }
    mode.value = newMode
    state.value = 'idle'
  }
  
  function start(point: Point2D) {
    if (mode.value === 'none' || mode.value === 'select') return
    
    const snapped = snapPoint(point)
    points.value = [snapped]
    startPoint.value = snapped
    state.value = 'drawing'
    events?.onStart?.()
  }
  
  function addPoint(point: Point2D) {
    if (state.value !== 'drawing') return
    
    const snapped = snapPoint(point)
    
    if (mode.value === 'rectangle') {
      // 矩形模式：第二个点完成绘制
      complete()
    } else if (mode.value === 'polygon') {
      // 多边形模式：添加顶点
      // 检查是否接近起点（闭合）
      if (points.value.length >= 3 && startPoint.value) {
        const dist = Math.hypot(snapped.x - startPoint.value.x, snapped.y - startPoint.value.y)
        if (dist < config.value.gridSize * 2) {
          complete()
          return
        }
      }
      
      points.value.push(snapped)
      events?.onUpdate?.(points.value)
    }
  }
  
  function updatePreview(point: Point2D) {
    if (state.value !== 'drawing') return
    previewPoint.value = snapPoint(point)
    events?.onUpdate?.(points.value)
  }
  
  function complete(): DrawingResult | null {
    if (!canComplete.value) return null
    
    let polygon: Polygon
    
    if (mode.value === 'rectangle' && currentPolygon.value) {
      polygon = currentPolygon.value
    } else if (mode.value === 'polygon') {
      polygon = {
        vertices: [...points.value],
        isClosed: true,
      }
    } else {
      return null
    }
    
    const validation = validatePolygon(polygon)
    const result: DrawingResult = {
      polygon,
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    }
    
    state.value = 'complete'
    events?.onComplete?.(result)
    
    // 重置状态
    reset()
    
    return result
  }
  
  function cancel() {
    if (state.value === 'drawing') {
      events?.onCancel?.()
    }
    reset()
  }
  
  function reset() {
    points.value = []
    previewPoint.value = null
    startPoint.value = null
    state.value = 'idle'
  }
  
  function undo() {
    if (mode.value === 'polygon' && points.value.length > 1) {
      points.value.pop()
      events?.onUpdate?.(points.value)
    }
  }
  
  // 键盘快捷键处理
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      cancel()
    } else if (event.key === 'Enter' && canComplete.value) {
      complete()
    } else if ((event.key === 'z' || event.key === 'Z') && event.ctrlKey) {
      undo()
    }
  }
  
  return {
    // 状态（只读）
    mode: readonly(mode),
    state: readonly(state),
    points: readonly(points),
    previewPoint: readonly(previewPoint),
    
    // 计算属性
    isDrawing,
    canComplete,
    currentPolygon,
    
    // 方法
    setMode,
    start,
    addPoint,
    updatePreview,
    complete,
    cancel,
    reset,
    undo,
    handleKeyDown,
  }
}

// ============================================================================
// 辅助组合式函数
// ============================================================================

/**
 * 矩形绘制快捷方式
 */
export function useRectangleDrawing(
  config: Ref<DrawingToolConfig>,
  events?: DrawingEvents
) {
  const tool = useDrawingTool(config, events)
  
  // 自动设置为矩形模式
  tool.setMode('rectangle')
  
  return tool
}

/**
 * 多边形绘制快捷方式
 */
export function usePolygonDrawing(
  config: Ref<DrawingToolConfig>,
  events?: DrawingEvents
) {
  const tool = useDrawingTool(config, events)
  
  // 自动设置为多边形模式
  tool.setMode('polygon')
  
  return tool
}
