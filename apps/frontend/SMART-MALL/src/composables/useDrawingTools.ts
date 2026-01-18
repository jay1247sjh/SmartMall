/**
 * 绘图工具 Composable
 * 
 * 职责：
 * - 矩形、多边形、轮廓的绘制
 * - 绘图预览
 * - 重叠检测
 */
import { ref, shallowRef, type Ref } from 'vue'
import * as THREE from 'three'
import type { MallProject, AreaDefinition, AreaType } from '@/builder'
import {
  generateId,
  getAreaTypeColor,
  snapToGrid,
  isContainedIn,
  doPolygonsOverlap,
  isSelfIntersecting,
  calculateArea,
  calculatePerimeter,
} from '@/builder'

type Tool = 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline' | 'edit-vertex'

export function useDrawingTools(
  scene: Ref<THREE.Scene | null>,
  project: Ref<MallProject | null>,
  currentFloor: Ref<any>,
  controls: Ref<any>,
  onAreaCreated?: (area: AreaDefinition) => void
) {
  // 状态
  const currentTool = ref<Tool>('select')
  const isDrawing = ref(false)
  const drawPoints = ref<{ x: number; y: number }[]>([])
  const previewMesh = shallowRef<THREE.Mesh | null>(null)
  const gridSize = ref(1)
  const snapEnabled = ref(true)
  const overlappingAreas = ref<string[]>([])
  const boundaryWarning = ref<string | null>(null)

  /**
   * 设置当前工具
   */
  function setTool(tool: Tool) {
    if (isDrawing.value) cancelDraw()
    currentTool.value = tool
    
    if (controls.value) {
      controls.value.enabled = (tool === 'pan')
    }
  }

  /**
   * 更新预览
   */
  function updatePreview(point: { x: number; y: number }) {
    if (!scene.value) return
    removePreview()

    if (currentTool.value === 'draw-rect' && drawPoints.value.length === 1) {
      const start = drawPoints.value[0]
      if (!start) return
      const width = Math.abs(point.x - start.x)
      const height = Math.abs(point.y - start.y)
      if (width < 0.5 || height < 0.5) return

      const geometry = new THREE.BoxGeometry(width, 0.5, height)
      const material = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.4,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set((start.x + point.x) / 2, 0.25, -(start.y + point.y) / 2)
      mesh.name = 'preview'
      scene.value.add(mesh)
      previewMesh.value = mesh
    } else if ((currentTool.value === 'draw-poly' || currentTool.value === 'draw-outline') && drawPoints.value.length >= 1) {
      const points = [...drawPoints.value, point]
      const linePoints = points.map(p => new THREE.Vector3(p.x, 0, -p.y))
      const firstPoint = drawPoints.value[0]
      if (firstPoint) {
        linePoints.push(new THREE.Vector3(firstPoint.x, 0, -firstPoint.y))
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints)
      const material = new THREE.LineBasicMaterial({ color: 0x60a5fa })
      const line = new THREE.Line(geometry, material)
      line.name = 'preview'
      scene.value.add(line)
    }
  }

  /**
   * 移除预览
   */
  function removePreview() {
    if (!scene.value) return
    const preview = scene.value.getObjectByName('preview')
    if (preview) {
      scene.value.remove(preview)
      if (preview instanceof THREE.Mesh) {
        preview.geometry.dispose()
        if (preview.material instanceof THREE.Material) preview.material.dispose()
      }
    }
    previewMesh.value = null
  }

  /**
   * 完成矩形绘制
   */
  function finishRectDraw(
    start: { x: number; y: number }, 
    end: { x: number; y: number },
    areaType: AreaType = 'other',
    areaName?: string,
    areaColor?: string
  ) {
    if (!currentFloor.value || !project.value) return

    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    if (width < 1 || height < 1) {
      cancelDraw()
      return
    }

    const minX = Math.min(start.x, end.x)
    const minY = Math.min(start.y, end.y)

    const newArea: AreaDefinition = {
      id: generateId(),
      name: areaName || `区域-${currentFloor.value.areas.length + 1}`,
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
      color: areaColor || getAreaTypeColor(areaType),
      properties: {
        area: width * height,
        perimeter: 2 * (width + height),
      },
      visible: true,
      locked: false,
    }

    if (!isContainedIn(newArea.shape, project.value.outline)) {
      boundaryWarning.value = '区域超出商城边界'
      setTimeout(() => { boundaryWarning.value = null }, 3000)
    }

    checkOverlaps(newArea)

    currentFloor.value.areas.push(newArea)
    cancelDraw()
    
    if (onAreaCreated) {
      onAreaCreated(newArea)
    }
  }

  /**
   * 完成多边形绘制
   */
  function finishPolyDraw(
    areaType: AreaType = 'other',
    areaName?: string,
    areaColor?: string
  ) {
    if (!currentFloor.value || !project.value || drawPoints.value.length < 3) {
      cancelDraw()
      return
    }

    const polygon = {
      vertices: drawPoints.value.map(p => ({ x: p.x, y: p.y })),
      isClosed: true,
    }

    if (isSelfIntersecting(polygon)) {
      boundaryWarning.value = '多边形不能自相交，请重新绘制'
      setTimeout(() => { boundaryWarning.value = null }, 3000)
      cancelDraw()
      return
    }

    if (currentTool.value === 'draw-outline') {
      project.value.outline = polygon
      cancelDraw()
      return
    }

    const newArea: AreaDefinition = {
      id: generateId(),
      name: areaName || `区域-${currentFloor.value.areas.length + 1}`,
      type: areaType,
      shape: polygon,
      color: areaColor || getAreaTypeColor(areaType),
      properties: {
        area: calculateArea(polygon),
        perimeter: calculatePerimeter(polygon),
      },
      visible: true,
      locked: false,
    }

    if (!isContainedIn(newArea.shape, project.value.outline)) {
      boundaryWarning.value = '区域超出商城边界'
      setTimeout(() => { boundaryWarning.value = null }, 3000)
    }

    checkOverlaps(newArea)

    currentFloor.value.areas.push(newArea)
    cancelDraw()
    
    if (onAreaCreated) {
      onAreaCreated(newArea)
    }
  }

  /**
   * 取消绘制
   */
  function cancelDraw() {
    isDrawing.value = false
    drawPoints.value = []
    removePreview()
  }

  /**
   * 检查重叠
   */
  function checkOverlaps(newArea: AreaDefinition) {
    if (!currentFloor.value) return
    overlappingAreas.value = []
    
    for (const area of currentFloor.value.areas) {
      if (area.id === newArea.id) continue
      if (doPolygonsOverlap(newArea.shape, area.shape)) {
        overlappingAreas.value.push(area.id, newArea.id)
      }
    }
  }

  /**
   * 重置轮廓
   */
  function resetOutline() {
    if (!project.value) return
    
    project.value.outline = {
      vertices: [
        { x: -25, y: -25 },
        { x: 25, y: -25 },
        { x: 25, y: 25 },
        { x: -25, y: 25 },
      ],
      isClosed: true,
    }
    
    project.value.floors.forEach(floor => {
      floor.shape = undefined
    })
    
    boundaryWarning.value = '轮廓已重置，可使用轮廓工具重新绘制'
    setTimeout(() => { boundaryWarning.value = null }, 3000)
  }

  return {
    // 状态
    currentTool,
    isDrawing,
    drawPoints,
    previewMesh,
    gridSize,
    snapEnabled,
    overlappingAreas,
    boundaryWarning,
    
    // 方法
    setTool,
    updatePreview,
    removePreview,
    finishRectDraw,
    finishPolyDraw,
    cancelDraw,
    checkOverlaps,
    resetOutline,
  }
}
