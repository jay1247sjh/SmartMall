/**
 * 历史记录管理 Composable
 * 
 * 职责：
 * - 撤销/重做功能
 * - 历史记录保存和恢复
 */
import { ref, computed, type Ref } from 'vue'
import type { MallProject } from '@/builder'

export function useHistoryManagement(
  project: Ref<MallProject | null>,
  currentFloorId: Ref<string | null>,
  onRestore?: () => void
) {
  // 状态
  const history = ref<string[]>([])
  const historyIndex = ref(-1)
  
  // 计算属性
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  /**
   * 保存历史记录
   */
  function saveHistory() {
    if (!project.value) return
    const state = JSON.stringify(project.value)
    
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    history.value.push(state)
    historyIndex.value = history.value.length - 1
    
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }
  }

  /**
   * 撤销
   */
  function undo() {
    if (!canUndo.value) return
    historyIndex.value--
    restoreFromHistory()
  }

  /**
   * 重做
   */
  function redo() {
    if (!canRedo.value) return
    historyIndex.value++
    restoreFromHistory()
  }

  /**
   * 从历史记录恢复
   */
  function restoreFromHistory() {
    const state = history.value[historyIndex.value]
    if (!state) return
    
    project.value = JSON.parse(state)
    
    if (currentFloorId.value && !project.value?.floors.find(f => f.id === currentFloorId.value)) {
      currentFloorId.value = project.value?.floors[0]?.id || null
    }

    if (onRestore) {
      onRestore()
    }
  }

  return {
    // 状态
    history,
    historyIndex,
    canUndo,
    canRedo,
    
    // 方法
    saveHistory,
    undo,
    redo,
    restoreFromHistory,
  }
}
