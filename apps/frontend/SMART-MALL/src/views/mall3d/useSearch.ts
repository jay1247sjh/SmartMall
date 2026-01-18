/**
 * 店铺搜索 Composable
 */
import { ref } from 'vue'
import type { SearchResultItem, StoreBriefInfo } from '@/shared/types/ui.types'

/** Mock 搜索数据 */
const MOCK_STORES: SearchResultItem[] = [
  { id: 1, name: '星巴克咖啡', floor: '1F', area: 'A-101' },
  { id: 2, name: '优衣库', floor: '2F', area: 'B-201' },
  { id: 3, name: '肯德基', floor: '1F', area: 'A-102' },
  { id: 4, name: 'Apple Store', floor: '3F', area: 'C-301' },
  { id: 5, name: '耐克旗舰店', floor: '2F', area: 'B-205' },
]

export interface UseSearchReturn {
  query: ReturnType<typeof ref<string>>
  results: ReturnType<typeof ref<SearchResultItem[]>>
  showResults: ReturnType<typeof ref<boolean>>
  selectedStore: ReturnType<typeof ref<StoreBriefInfo | null>>
  showStorePanel: ReturnType<typeof ref<boolean>>
  handleSearch: () => void
  selectResult: (store: SearchResultItem) => void
  closeStorePanel: () => void
}

export function useSearch(): UseSearchReturn {
  const query = ref('')
  const results = ref<SearchResultItem[]>([])
  const showResults = ref(false)
  const selectedStore = ref<StoreBriefInfo | null>(null)
  const showStorePanel = ref(false)

  /**
   * 处理搜索输入
   */
  function handleSearch() {
    const keyword = query.value.trim()
    if (!keyword) {
      showResults.value = false
      return
    }

    // 模拟搜索，实际项目中应调用 API
    results.value = MOCK_STORES.filter(s =>
      s.name.toLowerCase().includes(keyword.toLowerCase())
    )
    showResults.value = true
  }

  /**
   * 选择搜索结果
   */
  function selectResult(store: SearchResultItem) {
    selectedStore.value = {
      id: store.id,
      name: store.name,
      floor: store.floor,
      area: store.area,
    }
    showStorePanel.value = true
    showResults.value = false
    query.value = ''
    // TODO: 相机飞向店铺位置
  }

  /**
   * 关闭店铺详情面板
   */
  function closeStorePanel() {
    showStorePanel.value = false
    selectedStore.value = null
  }

  return {
    query,
    results,
    showResults,
    selectedStore,
    showStorePanel,
    handleSearch,
    selectResult,
    closeStorePanel,
  }
}
