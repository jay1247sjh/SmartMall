/**
 * 鼠标交互 Composable
 * 
 * 职责：
 * - 鼠标事件处理
 * - 射线检测
 * - 区域选择
 */
import { type Ref } from 'vue'
import * as THREE from 'three'

export function useInteraction(
  containerRef: Ref<HTMLElement | null>,
  camera: Ref<THREE.PerspectiveCamera | null>,
  scene: Ref<THREE.Scene | null>,
  viewMode: Ref<'edit' | 'orbit'>,
  onMouseDown?: (e: MouseEvent, point: { x: number; y: number } | null) => void,
  onMouseMove?: (e: MouseEvent, point: { x: number; y: number } | null) => void,
  onMouseUp?: (e: MouseEvent, point: { x: number; y: number } | null) => void,
  onClick?: (e: MouseEvent, intersect: THREE.Intersection | null) => void,
  onDoubleClick?: (e: MouseEvent) => void
) {
  /**
   * 屏幕坐标转世界坐标
   */
  function screenToWorld(clientX: number, clientY: number): { x: number; y: number } | null {
    if (!containerRef.value || !camera.value) return null

    const rect = containerRef.value.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera.value)

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const point = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, point)

    return { x: point.x, y: -point.z }
  }

  /**
   * 射线检测区域
   */
  function raycastAreas(clientX: number, clientY: number): THREE.Intersection | null {
    if (!containerRef.value || !camera.value || !scene.value) return null

    const rect = containerRef.value.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera.value)

    const areas: THREE.Object3D[] = []
    scene.value.traverse(obj => {
      if (obj.userData.isArea) {
        areas.push(obj)
      }
    })
    
    const intersects = raycaster.intersectObjects(areas, true)
    
    for (const intersect of intersects) {
      let obj: THREE.Object3D | null = intersect.object
      while (obj) {
        if (obj.userData.areaId) {
          return { ...intersect, object: obj } as THREE.Intersection
        }
        obj = obj.parent
      }
    }

    return null
  }

  /**
   * 处理鼠标按下
   */
  function handleMouseDown(e: MouseEvent) {
    if (viewMode.value === 'orbit') return
    
    const point = screenToWorld(e.clientX, e.clientY)
    if (onMouseDown) {
      onMouseDown(e, point)
    }
  }

  /**
   * 处理鼠标移动
   */
  function handleMouseMove(e: MouseEvent) {
    if (viewMode.value === 'orbit') return
    
    const point = screenToWorld(e.clientX, e.clientY)
    if (onMouseMove) {
      onMouseMove(e, point)
    }
  }

  /**
   * 处理鼠标抬起
   */
  function handleMouseUp(e: MouseEvent) {
    if (viewMode.value === 'orbit') return
    
    const point = screenToWorld(e.clientX, e.clientY)
    if (onMouseUp) {
      onMouseUp(e, point)
    }
  }

  /**
   * 处理点击
   */
  function handleClick(e: MouseEvent) {
    if (viewMode.value === 'orbit') return
    
    const intersect = raycastAreas(e.clientX, e.clientY)
    if (onClick) {
      onClick(e, intersect)
    }
  }

  /**
   * 处理双击
   */
  function handleDoubleClick(e: MouseEvent) {
    if (onDoubleClick) {
      onDoubleClick(e)
    }
  }

  /**
   * 设置交互监听
   */
  function setupInteraction() {
    if (!containerRef.value) return
    containerRef.value.addEventListener('mousedown', handleMouseDown)
    containerRef.value.addEventListener('mousemove', handleMouseMove)
    containerRef.value.addEventListener('mouseup', handleMouseUp)
    containerRef.value.addEventListener('click', handleClick)
    containerRef.value.addEventListener('dblclick', handleDoubleClick)
  }

  /**
   * 移除交互监听
   */
  function removeInteraction() {
    if (!containerRef.value) return
    containerRef.value.removeEventListener('mousedown', handleMouseDown)
    containerRef.value.removeEventListener('mousemove', handleMouseMove)
    containerRef.value.removeEventListener('mouseup', handleMouseUp)
    containerRef.value.removeEventListener('click', handleClick)
    containerRef.value.removeEventListener('dblclick', handleDoubleClick)
  }

  return {
    // 方法
    screenToWorld,
    raycastAreas,
    setupInteraction,
    removeInteraction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleDoubleClick,
  }
}
