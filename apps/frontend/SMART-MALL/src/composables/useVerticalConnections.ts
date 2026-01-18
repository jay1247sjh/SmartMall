/**
 * 垂直连接管理 Composable
 * 
 * 职责：
 * - 电梯、扶梯、楼梯的楼层连接管理
 */
import { ref, computed, type Ref } from 'vue'
import * as THREE from 'three'
import type { MallProject, AreaDefinition, VerticalConnection } from '@/builder'
import {
  createVerticalConnection,
  isVerticalConnectionAreaType,
  getConnectionTypeName,
  createConnectionIndicator,
  clearConnectionIndicators,
  getAreaCenter,
  calculateFloorYPosition,
} from '@/builder'

export function useVerticalConnections(
  scene: Ref<THREE.Scene | null>,
  project: Ref<MallProject | null>,
  onUpdate?: () => void
) {
  // 状态
  const verticalConnections = ref<VerticalConnection[]>([])
  const showFloorConnectionModal = ref(false)
  const pendingConnectionArea = ref<AreaDefinition | null>(null)
  const selectedFloorIds = ref<string[]>([])
  const boundaryWarning = ref<string | null>(null)

  // 计算属性
  const canConfirmConnection = computed(() => {
    if (selectedFloorIds.value.length === 0) return false
    
    if (pendingConnectionArea.value?.type === 'stairs') {
      if (selectedFloorIds.value.length !== 2) return false
      
      const levels = selectedFloorIds.value.map(id => {
        const floor = project.value?.floors.find(f => f.id === id)
        return floor?.level || 0
      })
      if (levels.length === 2) {
        const diff = Math.abs(levels[0] - levels[1])
        if (diff !== 1) return false
      }
    }
    
    return true
  })

  const pendingConnectionTypeName = computed(() => {
    const type = pendingConnectionArea.value?.type
    if (type === 'elevator' || type === 'escalator' || type === 'stairs') {
      return getConnectionTypeName(type)
    }
    return '设施'
  })

  /**
   * 检查并提示楼层连接
   */
  function checkAndPromptFloorConnection(area: AreaDefinition) {
    if (isVerticalConnectionAreaType(area.type)) {
      pendingConnectionArea.value = area
      selectedFloorIds.value = []
      showFloorConnectionModal.value = true
    }
  }

  /**
   * 确认楼层连接
   */
  function confirmFloorConnection() {
    if (!pendingConnectionArea.value || selectedFloorIds.value.length === 0) {
      cancelFloorConnection()
      return
    }

    const connection = createVerticalConnection({
      areaId: pendingConnectionArea.value.id,
      type: pendingConnectionArea.value.type as 'elevator' | 'escalator' | 'stairs',
      floorIds: selectedFloorIds.value,
    })

    verticalConnections.value.push(connection)
    
    renderConnectionIndicators()
    
    cancelFloorConnection()
    
    if (onUpdate) {
      onUpdate()
    }
  }

  /**
   * 取消楼层连接
   */
  function cancelFloorConnection() {
    showFloorConnectionModal.value = false
    pendingConnectionArea.value = null
    selectedFloorIds.value = []
  }

  /**
   * 切换楼层选择
   */
  function toggleFloorSelection(floorId: string) {
    if (pendingConnectionArea.value?.type === 'stairs') {
      if (selectedFloorIds.value.length > 0 && !selectedFloorIds.value.includes(floorId)) {
        const selectedFloorLevels = selectedFloorIds.value.map(id => {
          const floor = project.value?.floors.find(f => f.id === id)
          return floor?.level || 0
        })
        const newFloor = project.value?.floors.find(f => f.id === floorId)
        const newLevel = newFloor?.level || 0
        
        const isAdjacent = selectedFloorLevels.some(level => Math.abs(level - newLevel) === 1)
        if (!isAdjacent) {
          boundaryWarning.value = '楼梯只能连接相邻楼层'
          setTimeout(() => { boundaryWarning.value = null }, 3000)
          return
        }
        
        if (selectedFloorIds.value.length >= 2) {
          boundaryWarning.value = '楼梯最多只能连接两个相邻楼层'
          setTimeout(() => { boundaryWarning.value = null }, 3000)
          return
        }
      }
    }
    
    const index = selectedFloorIds.value.indexOf(floorId)
    if (index === -1) {
      selectedFloorIds.value.push(floorId)
    } else {
      selectedFloorIds.value.splice(index, 1)
    }
  }

  /**
   * 检查楼层是否可选
   */
  function isFloorSelectable(floorId: string): boolean {
    if (pendingConnectionArea.value?.type !== 'stairs') {
      return true
    }
    
    if (selectedFloorIds.value.length === 0) {
      return true
    }
    
    if (selectedFloorIds.value.includes(floorId)) {
      return true
    }
    
    if (selectedFloorIds.value.length >= 2) {
      return false
    }
    
    const selectedFloorLevels = selectedFloorIds.value.map(id => {
      const floor = project.value?.floors.find(f => f.id === id)
      return floor?.level || 0
    })
    const targetFloor = project.value?.floors.find(f => f.id === floorId)
    const targetLevel = targetFloor?.level || 0
    
    return selectedFloorLevels.some(level => Math.abs(level - targetLevel) === 1)
  }

  /**
   * 渲染连接指示器
   */
  function renderConnectionIndicators() {
    if (!scene.value || !project.value) return

    clearConnectionIndicators(scene.value)

    const floorPositions = new Map<string, number>()
    const floorHeights = project.value.floors.map(f => f.height)
    project.value.floors.forEach((floor, index) => {
      const yPos = calculateFloorYPosition(index, floorHeights)
      floorPositions.set(floor.id, yPos)
    })

    verticalConnections.value.forEach(connection => {
      let area: AreaDefinition | undefined
      for (const floor of project.value!.floors) {
        area = floor.areas.find(a => a.id === connection.areaId)
        if (area) break
      }

      if (area) {
        const center = getAreaCenter(area.shape.vertices)
        const indicator = createConnectionIndicator(
          connection,
          floorPositions,
          center
        )
        scene.value!.add(indicator)
      }
    })
  }

  return {
    // 状态
    verticalConnections,
    showFloorConnectionModal,
    pendingConnectionArea,
    selectedFloorIds,
    canConfirmConnection,
    pendingConnectionTypeName,
    boundaryWarning,
    
    // 方法
    checkAndPromptFloorConnection,
    confirmFloorConnection,
    cancelFloorConnection,
    toggleFloorSelection,
    isFloorSelectable,
    renderConnectionIndicators,
  }
}
