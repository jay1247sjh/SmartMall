/**
 * 楼层管理 Composable
 * 
 * 职责：
 * - 楼层的添加、删除、切换
 * - 楼层可见性控制
 */
import { ref, computed, reactive, type Ref } from 'vue'
import type { MallProject } from '@/builder'
import { createDefaultFloor } from '@/builder'

export function useFloorManagement(
  project: Ref<MallProject | null>,
  onFloorChange?: (floorId: string) => void,
  onUpdate?: () => void
) {
  // 状态
  const currentFloorId = ref<string | null>(null)
  const showAddFloorModal = ref(false)
  const showFloorPanel = ref(true)
  const newFloorForm = reactive({ 
    name: '', 
    level: 1, 
    height: 4 
  })

  // 计算属性
  const currentFloor = computed(() => 
    project.value?.floors.find(f => f.id === currentFloorId.value) || null
  )

  /**
   * 选择楼层
   */
  function selectFloor(floorId: string) {
    if (currentFloorId.value === floorId) return
    currentFloorId.value = floorId
    
    if (onFloorChange) {
      onFloorChange(floorId)
    }
  }

  /**
   * 添加楼层（打开弹窗）
   */
  function addFloor() {
    if (!project.value) return
    const maxLevel = Math.max(...project.value.floors.map(f => f.level), 0)
    newFloorForm.name = `${maxLevel + 1}F`
    newFloorForm.level = maxLevel + 1
    newFloorForm.height = 4
    showAddFloorModal.value = true
  }

  /**
   * 确认添加楼层
   */
  function confirmAddFloor() {
    if (!project.value || !newFloorForm.name.trim()) return

    const newFloor = createDefaultFloor(newFloorForm.level, newFloorForm.name)
    newFloor.height = newFloorForm.height

    project.value.floors.push(newFloor)
    project.value.floors.sort((a, b) => a.level - b.level)
    
    selectFloor(newFloor.id)
    showAddFloorModal.value = false
    
    if (onUpdate) {
      onUpdate()
    }
  }

  /**
   * 删除楼层
   */
  function deleteFloor(floorId: string) {
    if (!project.value || project.value.floors.length <= 1) return
    
    const index = project.value.floors.findIndex(f => f.id === floorId)
    if (index === -1) return

    project.value.floors.splice(index, 1)
    
    if (currentFloorId.value === floorId) {
      currentFloorId.value = project.value.floors[0]?.id || null
    }

    if (onUpdate) {
      onUpdate()
    }
  }

  /**
   * 切换楼层可见性
   */
  function toggleFloorVisibility(floorId: string) {
    if (!project.value) return
    const floor = project.value.floors.find(f => f.id === floorId)
    if (floor) {
      floor.visible = !floor.visible
      if (onUpdate) {
        onUpdate()
      }
    }
  }

  return {
    // 状态
    currentFloorId,
    currentFloor,
    showAddFloorModal,
    showFloorPanel,
    newFloorForm,
    
    // 方法
    selectFloor,
    addFloor,
    confirmAddFloor,
    deleteFloor,
    toggleFloorVisibility,
  }
}
