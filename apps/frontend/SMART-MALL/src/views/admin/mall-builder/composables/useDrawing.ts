/**
 * 绘制工具 Composable
 * 处理区域绘制逻辑（矩形、多边形、轮廓）
 */
import { ref, shallowRef } from 'vue'
import * as THREE from 'three'
import type { MallBuilderEngine } from '@/orchestrator/mall-builder/MallBuilderEngine'
import type { MallProject, FloorDefinition, AreaDefinition, MaterialPreset } from '@/builder'
import { AreaType, AREA_TYPE_COLORS } from '@smart-mall/shared-types'
import {
  generateId,
  calculateArea,
  calculatePerimeter,
  isContainedIn,
  doPolygonsOverlap,
  snapToGrid,
  isSelfIntersecting,
  isVerticalConnectionAreaType,
} from '@/builder'

export type Tool = 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline' | 'edit-vertex'

export interface DrawingState {
  isDrawing: boolean
  drawPoints: { x: number; y: number }[]
  previewMesh: THREE.Mesh | null
}

export function useDrawing(
  engine: () => MallBuilderEngine | null,
  gridSize: () => number,
  snapEnabled: () => boolean
) {
  const currentTool = ref<Tool>('select')
  const isDrawing = ref(false)
  const drawPoints = ref<{ x: number; y: number }[]>([])
  const previewMesh = shallowRef<THREE.Mesh | null>(null)

  // 警告信息
  const boundaryWarning = ref<string | null>(null)
  const overlappingAreas = ref<string[]>([])

  /**
   * 设置当前工具
   */
  function setTool(tool: Tool) {
    if (isDrawing.value) cancelDraw()
    currentTool.value = tool

    const eng = engine()
    if (eng) {
      eng.setOrbitControlsEnabled(tool === 'pan')
    }
  }

  /**
   * 屏幕坐标转世界坐标
   */
  function screenToWorld(clientX: number, clientY: number): { x: number; y: number } | null {
    const eng = engine()
    if (!eng) return null

    const mouseEvent = new MouseEvent('mousemove', { clientX, clientY })
    return eng.getGroundPosition(mouseEvent)
  }

  /**
   * 处理鼠标按下
   */
  function handleMouseDown(e: MouseEvent) {
    const tool = currentTool.value
    if (tool !== 'draw-rect' && tool !== 'draw-poly' && tool !== 'draw-outline') return
    if (e.button !== 0) return

    const point = screenToWorld(e.clientX, e.clientY)
    if (!point) return

    const snapped = snapEnabled() ? snapToGrid(point, gridSize()) : point

    if (!isDrawing.value) {
      isDrawing.value = true
      drawPoints.value = [snapped]
    } else if (tool === 'draw-poly' || tool === 'draw-outline') {
      drawPoints.value.push(snapped)
    }
  }

  /**
   * 处理鼠标移动
   */
  function handleMouseMove(e: MouseEvent) {
    if (!isDrawing.value) return

    const point = screenToWorld(e.clientX, e.clientY)
    if (!point) return

    const snapped = snapEnabled() ? snapToGrid(point, gridSize()) : point
    updatePreview(snapped)
  }

  /**
   * 处理鼠标松开（矩形绘制完成）
   */
  function handleMouseUp(
    e: MouseEvent,
    project: MallProject | null,
    currentFloor: FloorDefinition | null,
    selectedMaterial: MaterialPreset | null,
    onAreaCreated: (area: AreaDefinition) => void
  ) {
    if (currentTool.value !== 'draw-rect') return
    if (!isDrawing.value || drawPoints.value.length !== 1) return

    const point = screenToWorld(e.clientX, e.clientY)
    if (!point) return

    const snapped = snapEnabled() ? snapToGrid(point, gridSize()) : point
    const startPoint = drawPoints.value[0]
    if (!startPoint) return

    finishRectDraw(startPoint, snapped, project, currentFloor, selectedMaterial, onAreaCreated)
  }

  /**
   * 处理双击（多边形绘制完成）
   */
  function handleDoubleClick(
    project: MallProject | null,
    currentFloor: FloorDefinition | null,
    selectedMaterial: MaterialPreset | null,
    onAreaCreated: (area: AreaDefinition) => void,
    onOutlineUpdated: () => void
  ) {
    const tool = currentTool.value
    if (tool !== 'draw-poly' && tool !== 'draw-outline') return
    if (!isDrawing.value || drawPoints.value.length < 3) return

    finishPolyDraw(project, currentFloor, selectedMaterial, onAreaCreated, onOutlineUpdated)
  }

  /**
   * 更新预览
   */
  function updatePreview(point: { x: number; y: number }) {
    const eng = engine()
    if (!eng) return

    const tool = currentTool.value

    if (tool === 'draw-rect' && drawPoints.value.length === 1) {
      const start = drawPoints.value[0]
      if (!start) return

      const width = Math.abs(point.x - start.x)
      const height = Math.abs(point.y - start.y)

      if (width < 0.5 || height < 0.5) {
        eng.clearDrawPreview()
        return
      }

      const rectPoints = [
        { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y) },
        { x: Math.max(start.x, point.x), y: Math.min(start.y, point.y) },
        { x: Math.max(start.x, point.x), y: Math.max(start.y, point.y) },
        { x: Math.min(start.x, point.x), y: Math.max(start.y, point.y) },
      ]
      eng.setDrawPreview(rectPoints, 0x60a5fa, 0.1, true)
    } else if ((tool === 'draw-poly' || tool === 'draw-outline') && drawPoints.value.length >= 1) {
      eng.updateDrawPreviewWithCursor(drawPoints.value, point, 0x60a5fa, 0.1)
    }
  }

  /**
   * 完成矩形绘制
   */
  function finishRectDraw(
    start: { x: number; y: number },
    end: { x: number; y: number },
    project: MallProject | null,
    currentFloor: FloorDefinition | null,
    selectedMaterial: MaterialPreset | null,
    onAreaCreated: (area: AreaDefinition) => void
  ) {
    if (!currentFloor || !project) {
      cancelDraw()
      return
    }

    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    if (width < 1 || height < 1) {
      cancelDraw()
      return
    }

    const minX = Math.min(start.x, end.x)
    const minY = Math.min(start.y, end.y)

    const areaType = selectedMaterial?.areaType || AreaType.OTHER
    const areaColor = selectedMaterial?.color || AREA_TYPE_COLORS[AreaType.OTHER]

    const newArea: AreaDefinition = {
      id: generateId(),
      name: selectedMaterial?.name || `区域-${currentFloor.areas.length + 1}`,
      type: areaType,
      shape: {
        vertices: [
          { x: minX, y: minY },
          { x: minX + width, y: minY },
          { x: minX + width, y: minY + height },
          { x: minX, y: minY + height },
        ],
        isClosed: true,
      },
      color: areaColor,
      properties: {
        area: width * height,
        perimeter: 2 * (width + height),
      },
      visible: true,
      locked: false,
    }

    // 验证边界
    if (!isContainedIn(newArea.shape, project.outline)) {
      showWarning('区域超出商城边界')
    }

    // 检测重叠
    checkOverlaps(newArea, currentFloor)

    currentFloor.areas.push(newArea)
    cancelDraw()
    onAreaCreated(newArea)
  }

  /**
   * 完成多边形绘制
   */
  function finishPolyDraw(
    project: MallProject | null,
    currentFloor: FloorDefinition | null,
    selectedMaterial: MaterialPreset | null,
    onAreaCreated: (area: AreaDefinition) => void,
    onOutlineUpdated: () => void
  ) {
    if (!project || drawPoints.value.length < 3) {
      cancelDraw()
      return
    }

    const polygon = {
      vertices: drawPoints.value.map(p => ({ x: p.x, y: p.y })),
      isClosed: true,
    }

    // 验证多边形是否自相交
    if (isSelfIntersecting(polygon)) {
      showWarning('多边形不能自相交，请重新绘制')
      cancelDraw()
      return
    }

    if (currentTool.value === 'draw-outline') {
      // 更新商城轮廓
      project.outline = polygon
      cancelDraw()
      onOutlineUpdated()
      setTool('select')
      return
    }

    if (!currentFloor) {
      cancelDraw()
      return
    }

    const areaType = selectedMaterial?.areaType || AreaType.OTHER
    const areaColor = selectedMaterial?.color || AREA_TYPE_COLORS[AreaType.OTHER]

    const newArea: AreaDefinition = {
      id: generateId(),
      name: selectedMaterial?.name || `区域-${currentFloor.areas.length + 1}`,
      type: areaType,
      shape: polygon,
      color: areaColor,
      properties: {
        area: calculateArea(polygon),
        perimeter: calculatePerimeter(polygon),
      },
      visible: true,
      locked: false,
    }

    // 验证边界
    if (!isContainedIn(newArea.shape, project.outline)) {
      showWarning('区域超出商城边界')
    }

    checkOverlaps(newArea, currentFloor)

    currentFloor.areas.push(newArea)
    cancelDraw()
    onAreaCreated(newArea)
  }

  /**
   * 取消绘制
   */
  function cancelDraw() {
    isDrawing.value = false
    drawPoints.value = []
    previewMesh.value = null

    const eng = engine()
    if (eng) {
      eng.clearDrawPreview()
    }
  }

  /**
   * 检测重叠
   */
  function checkOverlaps(newArea: AreaDefinition, currentFloor: FloorDefinition) {
    overlappingAreas.value = []

    for (const area of currentFloor.areas) {
      if (area.id === newArea.id) continue
      if (doPolygonsOverlap(newArea.shape, area.shape)) {
        overlappingAreas.value.push(area.id, newArea.id)
      }
    }
  }

  /**
   * 显示警告
   */
  function showWarning(message: string) {
    boundaryWarning.value = message
    setTimeout(() => { boundaryWarning.value = null }, 3000)
  }

  /**
   * 检查区域是否需要楼层连接
   */
  function needsFloorConnection(area: AreaDefinition): boolean {
    return isVerticalConnectionAreaType(area.type)
  }

  return {
    // 状态
    currentTool,
    isDrawing,
    drawPoints,
    previewMesh,
    boundaryWarning,
    overlappingAreas,

    // 方法
    setTool,
    screenToWorld,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    cancelDraw,
    checkOverlaps,
    showWarning,
    needsFloorConnection,
  }
}
