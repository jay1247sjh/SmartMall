/**
 * 材质系统 Composable
 * 
 * 职责：
 * - 材质预设的选择
 * - 基础设施的放置
 */
import { ref, computed, type Ref } from 'vue'
import * as THREE from 'three'
import type { MallProject, MaterialPreset, MaterialCategory, AreaDefinition } from '@/builder'
import {
  getAllMaterialPresets,
  getAllCategories,
  generateId,
  calculateFloorYPosition,
  createBenchModel,
  createLampPostModel,
  createTrashBinModel,
  createPlanterModel,
  createSignPostModel,
  createFountainModel,
  createKioskModel,
  createATMModel,
  createVendingMachineModel,
  createInfoBoardModel,
  createClockModel,
  createFireExtinguisherModel,
} from '@/builder'

export function useMaterialSystem(
  scene: Ref<THREE.Scene | null>,
  project: Ref<MallProject | null>,
  currentFloorId: Ref<string | null>,
  currentFloor: Ref<any>,
  viewMode: Ref<'edit' | 'orbit'>,
  onMaterialSelected?: (preset: MaterialPreset) => void
) {
  // 状态
  const selectedMaterialId = ref<string | null>(null)
  const expandedCategories = ref<MaterialCategory[]>(['circulation', 'service', 'common', 'infrastructure'])
  const showMaterialPanel = ref(true)
  const leftPanelCollapsed = ref(false)

  // 计算属性
  const materialPresets = computed(() => getAllMaterialPresets())
  const categories = computed(() => getAllCategories())

  /**
   * 选择材质
   */
  function selectMaterial(preset: MaterialPreset) {
    selectedMaterialId.value = preset.id
    
    if (onMaterialSelected) {
      onMaterialSelected(preset)
    }
  }

  /**
   * 清除材质选择
   */
  function clearMaterialSelection() {
    selectedMaterialId.value = null
  }

  /**
   * 获取选中的材质
   */
  function getSelectedMaterial(): MaterialPreset | null {
    if (!selectedMaterialId.value) return null
    return materialPresets.value.find(p => p.id === selectedMaterialId.value) || null
  }

  /**
   * 切换分类展开状态
   */
  function toggleCategory(category: MaterialCategory) {
    const index = expandedCategories.value.indexOf(category)
    if (index === -1) {
      expandedCategories.value.push(category)
    } else {
      expandedCategories.value.splice(index, 1)
    }
  }

  /**
   * 切换左侧面板
   */
  function toggleLeftPanel() {
    leftPanelCollapsed.value = !leftPanelCollapsed.value
  }

  /**
   * 放置基础设施
   */
  function placeInfrastructure(preset: MaterialPreset, point: { x: number; y: number }) {
    if (!currentFloor.value || !project.value || !scene.value) return
    
    const infrastructureType = preset.infrastructureType
    if (!infrastructureType) return
    
    const floorIndex = project.value.floors.findIndex(f => f.id === currentFloorId.value)
    const floorHeights = project.value.floors.map(f => f.height)
    const yPos = calculateFloorYPosition(floorIndex, floorHeights) + 0.1
    
    const model = createInfrastructureModel(infrastructureType)
    if (!model) return
    
    model.position.set(point.x, yPos, -point.y)
    
    const id = generateId()
    model.name = `infrastructure-${id}`
    model.userData = {
      isInfrastructure: true,
      infrastructureId: id,
      infrastructureType: infrastructureType,
      floorId: currentFloorId.value,
    }
    
    scene.value.add(model)
    
    const infrastructureArea: AreaDefinition = {
      id: id,
      name: `${preset.name}-${currentFloor.value.areas.length + 1}`,
      type: 'other',
      shape: {
        vertices: [
          { x: point.x - 0.5, y: point.y - 0.5 },
          { x: point.x + 0.5, y: point.y - 0.5 },
          { x: point.x + 0.5, y: point.y + 0.5 },
          { x: point.x - 0.5, y: point.y + 0.5 },
        ],
        isClosed: true,
      },
      color: preset.color,
      properties: {
        infrastructureType: infrastructureType,
        isInfrastructure: true,
      },
      visible: true,
      locked: false,
    }
    
    currentFloor.value.areas.push(infrastructureArea)
    
    console.log(`[placeInfrastructure] 放置 ${preset.name} 在 (${point.x}, ${point.y})`)
  }

  /**
   * 根据类型创建基础设施模型
   */
  function createInfrastructureModel(type: string): THREE.Group | null {
    const heightScale = viewMode.value === 'orbit' ? 1.0 : 0.5
    
    switch (type) {
      case 'bench':
        return createBenchModel(2, heightScale)
      case 'lamp':
        return createLampPostModel(3 * heightScale, 'mall')
      case 'trashBin':
        return createTrashBinModel('recycling', heightScale)
      case 'planter':
        return createPlanterModel('large', 'tree')
      case 'sign':
        return createSignPostModel('指示牌', 'standing', heightScale)
      case 'fountain':
        return createFountainModel(heightScale)
      case 'kiosk':
        return createKioskModel(heightScale)
      case 'atm':
        return createATMModel(heightScale)
      case 'vendingMachine':
        return createVendingMachineModel(heightScale)
      case 'infoBoard':
        return createInfoBoardModel(heightScale)
      case 'clock':
        return createClockModel(heightScale)
      case 'fireExtinguisher':
        return createFireExtinguisherModel(heightScale)
      default:
        console.warn(`[createInfrastructureModel] 未知的基础设施类型: ${type}`)
        return null
    }
  }

  return {
    // 状态
    selectedMaterialId,
    expandedCategories,
    showMaterialPanel,
    leftPanelCollapsed,
    materialPresets,
    categories,
    
    // 方法
    selectMaterial,
    clearMaterialSelection,
    getSelectedMaterial,
    toggleCategory,
    toggleLeftPanel,
    placeInfrastructure,
    createInfrastructureModel,
  }
}
