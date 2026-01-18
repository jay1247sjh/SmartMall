/**
 * 属性面板 Composable
 * 
 * 职责：
 * - 区域属性的编辑（类型、名称等）
 */
import { ref, type Ref } from 'vue'
import type { AreaDefinition, AreaType } from '@/builder'
import { getAreaTypeColor } from '@/builder'

export function usePropertyPanel(
  selectedArea: Ref<AreaDefinition | null>,
  currentFloor: Ref<any>,
  onUpdate?: () => void
) {
  // 状态
  const showPropertyPanel = ref(true)

  // 区域类型配置
  const areaTypes: { value: AreaType; label: string; color: string }[] = [
    { value: 'retail', label: '零售', color: '#3b82f6' },
    { value: 'food', label: '餐饮', color: '#f97316' },
    { value: 'service', label: '服务', color: '#8b5cf6' },
    { value: 'anchor', label: '主力店', color: '#ef4444' },
    { value: 'common', label: '公共区域', color: '#6b7280' },
    { value: 'corridor', label: '走廊', color: '#9ca3af' },
    { value: 'elevator', label: '电梯', color: '#10b981' },
    { value: 'escalator', label: '扶梯', color: '#14b8a6' },
    { value: 'restroom', label: '洗手间', color: '#ec4899' },
    { value: 'stairs', label: '楼梯', color: '#06b6d4' },
    { value: 'other', label: '其他', color: '#a3a3a3' },
  ]

  /**
   * 更新选中区域类型
   */
  function updateSelectedAreaType(type: AreaType) {
    if (!selectedArea.value || !currentFloor.value) return
    
    const areaIndex = currentFloor.value.areas.findIndex((a: AreaDefinition) => a.id === selectedArea.value!.id)
    if (areaIndex === -1) return
    
    currentFloor.value.areas[areaIndex].type = type
    currentFloor.value.areas[areaIndex].color = getAreaTypeColor(type)
    
    if (onUpdate) {
      onUpdate()
    }
  }

  /**
   * 更新选中区域名称
   */
  function updateSelectedAreaName(name: string) {
    if (!selectedArea.value) return
    selectedArea.value.name = name
    
    if (onUpdate) {
      onUpdate()
    }
  }

  /**
   * 处理名称输入
   */
  function handleNameInput(e: Event) {
    const target = e.target as HTMLInputElement
    updateSelectedAreaName(target.value)
  }

  return {
    // 状态
    showPropertyPanel,
    areaTypes,
    
    // 方法
    updateSelectedAreaType,
    updateSelectedAreaName,
    handleNameInput,
  }
}
