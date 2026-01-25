/**
 * 历史记录 Composable
 * 处理撤销/重做功能
 */
import { ref, computed } from 'vue'
import type { MallProject } from '@/builder'

export function useHistory() {
  const history = ref<string[]>([])
  const historyIndex = ref(-1)

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  /**
   * 保存历史记录
   */
  function saveHistory(project: MallProject | null, onUnsaved?: () => void) {
    if (!project) return

    const state = JSON.stringify(project)

    // 如果在历史中间位置，删除后面的记录
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(state)
    historyIndex.value = history.value.length - 1

    // 限制历史记录数量
    if (history.value.length > 50) {
      history.value.shift()
      historyIndex.value--
    }

    // 标记有未保存的更改
    onUnsaved?.()
  }

  /**
   * 撤销
   */
  function undo(): MallProject | null {
    if (!canUndo.value) return null

    historyIndex.value--
    return restoreFromHistory()
  }

  /**
   * 重做
   */
  function redo(): MallProject | null {
    if (!canRedo.value) return null

    historyIndex.value++
    return restoreFromHistory()
  }

  /**
   * 从历史记录恢复
   */
  function restoreFromHistory(): MallProject | null {
    const state = history.value[historyIndex.value]
    if (!state) return null

    try {
      return JSON.parse(state) as MallProject
    } catch {
      return null
    }
  }

  /**
   * 清空历史记录
   */
  function clearHistory() {
    history.value = []
    historyIndex.value = -1
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
    clearHistory,
  }
}
