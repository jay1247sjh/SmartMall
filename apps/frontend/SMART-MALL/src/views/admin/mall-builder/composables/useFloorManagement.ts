/**
 * 楼层管理 Composable
 * 处理楼层的增删改查
 */
import { ref, computed, reactive } from 'vue'
import type { MallProject, FloorDefinition } from '@/builder'
import { createDefaultFloor } from '@/builder'

export function useFloorManagement(project: () => MallProject | null) {
  const currentFloorId = ref<string | null>(null)
  const showAddFloorModal = ref(false)
  const newFloorForm = reactive({ name: '', level: 1, height: 4 })

  const currentFloor = computed(() =>
    project()?.floors.find(f => f.id === currentFloorId.value) || null
  )

  /**
   * 初始化楼层（选择第一个楼层）
   */
  function initFloor(proj: MallProject) {
    if (proj.floors.length > 0 && proj.floors[0]) {
      currentFloorId.value = proj.floors[0].id
    }
  }

  /**
   * 选择楼层
   */
  function selectFloor(floorId: string) {
    if (currentFloorId.value === floorId) return
    currentFloorId.value = floorId
  }

  /**
   * 打开添加楼层弹窗
   */
  function openAddFloorModal() {
    const proj = project()
    if (!proj) return

    const maxLevel = Math.max(...proj.floors.map(f => f.level), 0)
    newFloorForm.name = `${maxLevel + 1}F`
    newFloorForm.level = maxLevel + 1
    newFloorForm.height = 4
    showAddFloorModal.value = true
  }

  /**
   * 确认添加楼层
   */
  function confirmAddFloor(): FloorDefinition | null {
    const proj = project()
    if (!proj || !newFloorForm.name.trim()) return null

    const newFloor = createDefaultFloor(newFloorForm.level, newFloorForm.name)
    newFloor.height = newFloorForm.height

    proj.floors.push(newFloor)
    proj.floors.sort((a, b) => a.level - b.level)

    selectFloor(newFloor.id)
    showAddFloorModal.value = false

    return newFloor
  }

  /**
   * 删除楼层
   */
  function deleteFloor(floorId: string): boolean {
    const proj = project()
    if (!proj || proj.floors.length <= 1) return false

    const index = proj.floors.findIndex(f => f.id === floorId)
    if (index === -1) return false

    proj.floors.splice(index, 1)

    if (currentFloorId.value === floorId) {
      currentFloorId.value = proj.floors[0]?.id || null
    }

    return true
  }

  /**
   * 切换楼层可见性
   */
  function toggleFloorVisibility(floorId: string) {
    const proj = project()
    if (!proj) return

    const floor = proj.floors.find(f => f.id === floorId)
    if (floor) {
      floor.visible = !floor.visible
    }
  }

  /**
   * 获取楼层 Y 坐标
   */
  function getFloorYPosition(floorId: string): number {
    const proj = project()
    if (!proj) return 0

    const floorIndex = proj.floors.findIndex(f => f.id === floorId)
    if (floorIndex === -1) return 0

    let yPos = 0
    for (let i = 0; i < floorIndex; i++) {
      yPos += proj.floors[i]?.height || 4
    }
    return yPos
  }

  return {
    // 状态
    currentFloorId,
    currentFloor,
    showAddFloorModal,
    newFloorForm,

    // 方法
    initFloor,
    selectFloor,
    openAddFloorModal,
    confirmAddFloor,
    deleteFloor,
    toggleFloorVisibility,
    getFloorYPosition,
  }
}
