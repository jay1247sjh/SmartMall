/**
 * 垂直连接 Composable
 * 处理电梯、扶梯、楼梯的楼层连接
 */
import { ref, computed } from 'vue'
import * as THREE from 'three'
import type { MallProject, AreaDefinition, VerticalConnection } from '@/builder'
import {
  createVerticalConnection,
  getConnectionTypeName,
  createConnectionIndicator,
  clearConnectionIndicators,
  getAreaCenter,
  calculateFloorYPosition,
} from '@/builder'

export function useVerticalConnections(project: () => MallProject | null) {
  const verticalConnections = ref<VerticalConnection[]>([])
  const showFloorConnectionModal = ref(false)
  const pendingConnectionArea = ref<AreaDefinition | null>(null)
  const selectedFloorIds = ref<string[]>([])

  /**
   * 判断是否可以确认楼层连接
   */
  const canConfirmConnection = computed(() => {
    if (selectedFloorIds.value.length === 0) return false

    // 楼梯必须选择恰好两个相邻楼层
    if (pendingConnectionArea.value?.type === 'stairs') {
      if (selectedFloorIds.value.length !== 2) return false

      const proj = project()
      if (!proj) return false

      // 检查是否相邻
      const levels = selectedFloorIds.value.map(id => {
        const floor = proj.floors.find(f => f.id === id)
        return floor?.level || 0
      })

      if (levels.length === 2) {
        const diff = Math.abs(levels[0]! - levels[1]!)
        if (diff !== 1) return false
      }
    }

    return true
  })

  /**
   * 获取待连接区域的连接类型名称
   */
  const pendingConnectionTypeName = computed(() => {
    const type = pendingConnectionArea.value?.type
    if (type === 'elevator' || type === 'escalator' || type === 'stairs') {
      return getConnectionTypeName(type)
    }
    return '设施'
  })

  /**
   * 打开楼层连接弹窗
   */
  function openConnectionModal(area: AreaDefinition, currentFloorId: string | null) {
    pendingConnectionArea.value = area
    selectedFloorIds.value = currentFloorId ? [currentFloorId] : []
    showFloorConnectionModal.value = true
  }

  /**
   * 确认楼层连接
   */
  function confirmFloorConnection(): VerticalConnection | null {
    if (!pendingConnectionArea.value || selectedFloorIds.value.length === 0) {
      cancelFloorConnection()
      return null
    }

    const connection = createVerticalConnection({
      areaId: pendingConnectionArea.value.id,
      type: pendingConnectionArea.value.type as 'elevator' | 'escalator' | 'stairs',
      floorIds: selectedFloorIds.value,
    })

    verticalConnections.value.push(connection)
    cancelFloorConnection()

    return connection
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
  function toggleFloorSelection(floorId: string, showWarning: (msg: string) => void) {
    const proj = project()
    if (!proj) return

    // 检查是否为楼梯类型
    if (pendingConnectionArea.value?.type === 'stairs') {
      if (selectedFloorIds.value.length > 0 && !selectedFloorIds.value.includes(floorId)) {
        const selectedFloorLevels = selectedFloorIds.value.map(id => {
          const floor = proj.floors.find(f => f.id === id)
          return floor?.level || 0
        })
        const newFloor = proj.floors.find(f => f.id === floorId)
        const newLevel = newFloor?.level || 0

        // 检查是否与已选楼层相邻
        const isAdjacent = selectedFloorLevels.some(level => Math.abs(level - newLevel) === 1)
        if (!isAdjacent) {
          showWarning('楼梯只能连接相邻楼层')
          return
        }

        // 楼梯最多只能连接两层
        if (selectedFloorIds.value.length >= 2) {
          showWarning('楼梯最多只能连接两个相邻楼层')
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
   * 检查楼层是否可以被选择
   */
  function isFloorSelectable(floorId: string): boolean {
    const proj = project()
    if (!proj) return false

    // 电梯和扶梯可以选择任意楼层
    if (pendingConnectionArea.value?.type !== 'stairs') {
      return true
    }

    // 如果还没有选择任何楼层，所有楼层都可选
    if (selectedFloorIds.value.length === 0) {
      return true
    }

    // 如果已经选择了这个楼层，可以取消选择
    if (selectedFloorIds.value.includes(floorId)) {
      return true
    }

    // 楼梯最多只能连接两层
    if (selectedFloorIds.value.length >= 2) {
      return false
    }

    // 检查是否与已选楼层相邻
    const selectedFloorLevels = selectedFloorIds.value.map(id => {
      const floor = proj.floors.find(f => f.id === id)
      return floor?.level || 0
    })
    const targetFloor = proj.floors.find(f => f.id === floorId)
    const targetLevel = targetFloor?.level || 0

    return selectedFloorLevels.some(level => Math.abs(level - targetLevel) === 1)
  }

  /**
   * 渲染连接指示器
   */
  function renderConnectionIndicators(scene: THREE.Scene) {
    const proj = project()
    if (!proj) return

    // 清除旧的连接指示器
    clearConnectionIndicators(scene)

    // 计算楼层 Y 坐标映射
    const floorPositions = new Map<string, number>()
    const floorHeights = proj.floors.map(f => f.height)
    proj.floors.forEach((floor, index) => {
      const yPos = calculateFloorYPosition(index, floorHeights)
      floorPositions.set(floor.id, yPos)
    })

    // 渲染每个连接
    verticalConnections.value.forEach(connection => {
      // 找到关联的区域
      let area: AreaDefinition | undefined
      for (const floor of proj.floors) {
        area = floor.areas.find(a => a.id === connection.areaId)
        if (area) break
      }

      if (area) {
        const center = getAreaCenter(area.shape.vertices)
        const indicator = createConnectionIndicator(connection, floorPositions, center)
        scene.add(indicator)
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

    // 方法
    openConnectionModal,
    confirmFloorConnection,
    cancelFloorConnection,
    toggleFloorSelection,
    isFloorSelectable,
    renderConnectionIndicators,
  }
}
