/**
 * 店铺搜索 Composable
 * 
 * 提供店铺搜索和相机飞向功能
 */
import { ref, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'
import type { ThreeEngine } from '@/engine'
import type { SearchResultItem, StoreBriefInfo } from '@/shared/types/ui.types'

// ============================================================================
// 类型定义
// ============================================================================

/** 店铺位置信息 */
interface StorePosition {
  x: number
  y: number
  z: number
}

/** 带位置的搜索结果 */
type SearchResultWithPosition = SearchResultItem & { position?: StorePosition }

/** 相机飞行配置 */
export interface FlyToConfig {
  /** 飞行时长（毫秒） */
  duration?: number
  /** 相机距离目标的偏移 */
  offset?: StorePosition
  /** 缓动函数 */
  easing?: (t: number) => number
}

// ============================================================================
// 常量定义
// ============================================================================

/** easeInOutQuad 缓动函数 */
const easeInOutQuad = (t: number): number => 
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

/** 默认飞行配置 */
const DEFAULT_FLY_CONFIG: Required<FlyToConfig> = {
  duration: 1000,
  offset: { x: 15, y: 20, z: 15 },
  easing: easeInOutQuad,
}

/** Mock 搜索数据（包含位置信息） */
const MOCK_STORES: SearchResultWithPosition[] = [
  { id: 1, name: '星巴克咖啡', floor: '1F', area: 'A-101', position: { x: -15, y: 0, z: -15 } },
  { id: 2, name: '优衣库', floor: '2F', area: 'B-201', position: { x: 0, y: 4, z: -15 } },
  { id: 3, name: '肯德基', floor: '1F', area: 'A-102', position: { x: 15, y: 0, z: -15 } },
  { id: 4, name: 'Apple Store', floor: '3F', area: 'C-301', position: { x: -15, y: 8, z: 0 } },
  { id: 5, name: '耐克旗舰店', floor: '2F', area: 'B-205', position: { x: 15, y: 4, z: 0 } },
]

// ============================================================================
// Composable 接口
// ============================================================================

export interface UseSearchOptions {
  /** ThreeEngine 实例引用 */
  engine?: Ref<ThreeEngine | null>
}

export interface UseSearchReturn {
  query: Ref<string>
  results: Ref<SearchResultItem[]>
  showResults: Ref<boolean>
  selectedStore: Ref<StoreBriefInfo | null>
  showStorePanel: Ref<boolean>
  isFlying: Ref<boolean>
  handleSearch: () => void
  selectResult: (store: SearchResultItem) => void
  closeStorePanel: () => void
  flyToStore: (storeId: number | string, config?: FlyToConfig) => Promise<void>
  flyToPosition: (position: THREE.Vector3, config?: FlyToConfig) => Promise<void>
  cancelFlyAnimation: () => void
}

// ============================================================================
// Composable 实现
// ============================================================================

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { engine } = options

  // 响应式状态
  const query = ref('')
  const results = ref<SearchResultItem[]>([])
  const showResults = ref(false)
  const selectedStore = ref<StoreBriefInfo | null>(null)
  const showStorePanel = ref(false)
  const isFlying = ref(false)

  // 飞行动画状态
  let flyAnimationId: number | null = null

  /**
   * 处理搜索输入
   */
  function handleSearch(): void {
    const keyword = query.value.trim()
    if (!keyword) {
      showResults.value = false
      return
    }

    // 模拟搜索，实际项目中应调用 API
    const lowerKeyword = keyword.toLowerCase()
    results.value = MOCK_STORES.filter(s =>
      s.name.toLowerCase().includes(lowerKeyword)
    )
    showResults.value = true
  }

  /**
   * 选择搜索结果
   */
  function selectResult(store: SearchResultItem): void {
    selectedStore.value = {
      id: store.id,
      name: store.name,
      floor: store.floor,
      area: store.area,
    }
    showStorePanel.value = true
    showResults.value = false
    query.value = ''

    // 相机飞向店铺位置
    flyToStore(store.id)
  }

  /**
   * 关闭店铺详情面板
   */
  function closeStorePanel(): void {
    showStorePanel.value = false
    selectedStore.value = null
  }

  /**
   * 相机飞向指定店铺
   * 
   * @param storeId - 店铺 ID
   * @param config - 飞行配置
   */
  async function flyToStore(storeId: number | string, config?: FlyToConfig): Promise<void> {
    // 查找店铺位置
    const store = MOCK_STORES.find(s => s.id === storeId)
    if (!store?.position) {
      console.warn(`[useSearch] Store ${storeId} not found or has no position`)
      return
    }

    const { x, y, z } = store.position
    const targetPosition = new THREE.Vector3(x, y, z)

    await flyToPosition(targetPosition, config)
  }

  /**
   * 相机飞向指定位置
   * 
   * @param targetPosition - 目标位置
   * @param config - 飞行配置
   */
  async function flyToPosition(targetPosition: THREE.Vector3, config?: FlyToConfig): Promise<void> {
    const currentEngine = engine?.value
    if (!currentEngine) {
      console.warn('[useSearch] Engine not available for camera animation')
      return
    }

    // 取消之前的飞行动画
    cancelFlyAnimation()

    const { duration, offset, easing } = { ...DEFAULT_FLY_CONFIG, ...config }

    const camera = currentEngine.getCamera()
    
    // 起始位置和目标位置
    const startPosition = camera.position.clone()
    const endPosition = new THREE.Vector3(
      targetPosition.x + offset.x,
      targetPosition.y + offset.y,
      targetPosition.z + offset.z
    )

    // 起始目标点：从引擎获取当前相机目标点
    const startTarget = currentEngine.getCameraTarget()
    const endTarget = targetPosition.clone()

    isFlying.value = true
    const startTime = performance.now()

    return new Promise<void>((resolve) => {
      function animate(): void {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = easing(progress)

        // 插值计算当前位置
        const currentPosition = new THREE.Vector3().lerpVectors(
          startPosition,
          endPosition,
          easedProgress
        )

        // 插值计算当前目标点
        const currentTarget = new THREE.Vector3().lerpVectors(
          startTarget,
          endTarget,
          easedProgress
        )

        // 更新相机位置和目标
        currentEngine.setCameraPosition(
          currentPosition.x,
          currentPosition.y,
          currentPosition.z
        )
        currentEngine.setCameraTarget(
          currentTarget.x,
          currentTarget.y,
          currentTarget.z
        )
        currentEngine.requestRender()

        if (progress < 1) {
          flyAnimationId = requestAnimationFrame(animate)
        } else {
          flyAnimationId = null
          isFlying.value = false
          resolve()
        }
      }

      flyAnimationId = requestAnimationFrame(animate)
    })
  }

  /**
   * 取消飞行动画
   */
  function cancelFlyAnimation(): void {
    if (flyAnimationId !== null) {
      cancelAnimationFrame(flyAnimationId)
      flyAnimationId = null
      isFlying.value = false
    }
  }

  // 组件卸载时清理动画
  onUnmounted(() => {
    cancelFlyAnimation()
  })

  return {
    query,
    results,
    showResults,
    selectedStore,
    showStorePanel,
    isFlying,
    handleSearch,
    selectResult,
    closeStorePanel,
    flyToStore,
    flyToPosition,
    cancelFlyAnimation,
  }
}
