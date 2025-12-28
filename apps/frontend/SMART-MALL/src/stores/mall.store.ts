/**
 * 商城状态 Store
 * 
 * 职责：
 * - 管理商城结构数据（Mall、Floor、Area、Store）
 * - 管理当前选中状态（楼层、区域、店铺）
 * - 提供数据查询和过滤能力
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============================================================================
// 类型定义
// ============================================================================

/** 3D 向量 */
export interface Vector3D {
  x: number
  y: number
  z: number
}

/** 区域状态 */
export type AreaStatus = 'LOCKED' | 'PENDING' | 'AUTHORIZED' | 'OCCUPIED'

/** 区域类型 */
export type AreaType = 'RETAIL' | 'FOOD' | 'ENTERTAINMENT' | 'SERVICE'

/** 商城状态 */
export type MallStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED'

/** 店铺状态 */
export type StoreStatus = 'ACTIVE' | 'CLOSED' | 'SUSPENDED'

/** 商城信息 */
export interface MallInfo {
  mallId: string
  name: string
  description?: string
  status: MallStatus
  currentLayoutVersion?: string
  config?: Record<string, unknown>
}

/** 楼层信息 */
export interface FloorInfo {
  floorId: string
  mallId: string
  index: number
  name: string
  height?: number
  position?: Vector3D
  config?: Record<string, unknown>
}

/** 区域几何信息 */
export interface AreaGeometry {
  min: Vector3D
  max: Vector3D
  shapeType?: string
}

/** 区域信息 */
export interface AreaInfo {
  areaId: string
  mallId: string
  floorId: string
  name: string
  type: AreaType
  status: AreaStatus
  authorizedMerchantId?: string
  geometry: AreaGeometry
  config?: Record<string, unknown>
}

/** 店铺信息 */
export interface StoreInfo {
  storeId: string
  mallId: string
  areaId: string
  merchantId: string
  name: string
  category?: string
  logoUrl?: string
  position?: Vector3D
  rotation?: Vector3D
  size?: Vector3D
  status: StoreStatus
  config?: Record<string, unknown>
}

/** 商品信息 */
export interface ProductInfo {
  productId: string
  storeId: string
  name: string
  description?: string
  price: number
  stock: number
  imageUrl?: string
  position?: Vector3D
  attributes?: Record<string, unknown>
}

// ============================================================================
// Store 定义
// ============================================================================

export const useMallStore = defineStore('mall', () => {
  // ==========================================================================
  // 状态
  // ==========================================================================

  /** 当前商城 */
  const currentMall = ref<MallInfo | null>(null)

  /** 楼层列表 */
  const floors = ref<FloorInfo[]>([])

  /** 区域列表 */
  const areas = ref<AreaInfo[]>([])

  /** 店铺列表 */
  const stores = ref<StoreInfo[]>([])

  /** 商品列表（当前店铺的） */
  const products = ref<ProductInfo[]>([])

  /** 当前选中的楼层ID */
  const currentFloorId = ref<string | null>(null)

  /** 当前选中的区域ID */
  const selectedAreaId = ref<string | null>(null)

  /** 当前选中的店铺ID */
  const selectedStoreId = ref<string | null>(null)

  /** 数据加载状态 */
  const isLoading = ref(false)

  /** 错误信息 */
  const error = ref<string | null>(null)

  // ==========================================================================
  // 计算属性
  // ==========================================================================

  /** 当前楼层 */
  const currentFloor = computed(() =>
    floors.value.find((f) => f.floorId === currentFloorId.value) ?? null
  )

  /** 当前楼层的区域列表 */
  const currentFloorAreas = computed(() =>
    areas.value.filter((a) => a.floorId === currentFloorId.value)
  )

  /** 当前楼层的店铺列表 */
  const currentFloorStores = computed(() => {
    const floorAreaIds = currentFloorAreas.value.map((a) => a.areaId)
    return stores.value.filter((s) => floorAreaIds.includes(s.areaId))
  })

  /** 当前选中的区域 */
  const selectedArea = computed(() =>
    areas.value.find((a) => a.areaId === selectedAreaId.value) ?? null
  )

  /** 当前选中的店铺 */
  const selectedStore = computed(() =>
    stores.value.find((s) => s.storeId === selectedStoreId.value) ?? null
  )

  /** 可申请的区域（状态为 LOCKED） */
  const availableAreas = computed(() => areas.value.filter((a) => a.status === 'LOCKED'))

  /** 审批中的区域（状态为 PENDING） */
  const pendingAreas = computed(() => areas.value.filter((a) => a.status === 'PENDING'))

  /** 已授权的区域（状态为 AUTHORIZED） */
  const authorizedAreas = computed(() => areas.value.filter((a) => a.status === 'AUTHORIZED'))

  /** 按楼层分组的区域 */
  const areasByFloor = computed(() => {
    const map = new Map<string, AreaInfo[]>()
    areas.value.forEach((area) => {
      const list = map.get(area.floorId) ?? []
      list.push(area)
      map.set(area.floorId, list)
    })
    return map
  })

  /** 按区域分组的店铺 */
  const storesByArea = computed(() => {
    const map = new Map<string, StoreInfo[]>()
    stores.value.forEach((store) => {
      const list = map.get(store.areaId) ?? []
      list.push(store)
      map.set(store.areaId, list)
    })
    return map
  })

  /** 楼层数量 */
  const floorCount = computed(() => floors.value.length)

  /** 店铺数量 */
  const storeCount = computed(() => stores.value.length)

  // ==========================================================================
  // Actions - 数据设置
  // ==========================================================================

  /** 设置商城数据 */
  function setMall(mall: MallInfo) {
    currentMall.value = mall
  }

  /** 设置楼层列表 */
  function setFloors(data: FloorInfo[]) {
    // 按 index 排序
    const sorted = [...data].sort((a, b) => a.index - b.index)
    floors.value = sorted
    // 默认选中第一个楼层
    if (sorted.length > 0 && !currentFloorId.value) {
      const firstFloor = sorted[0]
      if (firstFloor) {
        currentFloorId.value = firstFloor.floorId
      }
    }
  }

  /** 设置区域列表 */
  function setAreas(data: AreaInfo[]) {
    areas.value = data
  }

  /** 设置店铺列表 */
  function setStores(data: StoreInfo[]) {
    stores.value = data
  }

  /** 设置商品列表 */
  function setProducts(data: ProductInfo[]) {
    products.value = data
  }

  /** 设置完整的商城结构数据 */
  function setMallStructure(data: {
    mall: MallInfo
    floors: FloorInfo[]
    areas: AreaInfo[]
    stores: StoreInfo[]
  }) {
    setMall(data.mall)
    setFloors(data.floors)
    setAreas(data.areas)
    setStores(data.stores)
  }

  // ==========================================================================
  // Actions - 选择操作
  // ==========================================================================

  /** 切换楼层 */
  function switchFloor(floorId: string) {
    if (currentFloorId.value === floorId) return

    currentFloorId.value = floorId
    // 切换楼层时清除选中状态
    selectedAreaId.value = null
    selectedStoreId.value = null
  }

  /** 选中区域 */
  function selectArea(areaId: string | null) {
    selectedAreaId.value = areaId
    // 选中区域时清除店铺选中
    if (areaId) {
      selectedStoreId.value = null
    }
  }

  /** 选中店铺 */
  function selectStore(storeId: string | null) {
    selectedStoreId.value = storeId
    // 选中店铺时同时选中其所在区域
    if (storeId) {
      const store = stores.value.find((s) => s.storeId === storeId)
      if (store) {
        selectedAreaId.value = store.areaId
      }
    }
  }

  /** 清除所有选中状态 */
  function clearSelection() {
    selectedAreaId.value = null
    selectedStoreId.value = null
  }

  // ==========================================================================
  // Actions - 数据更新
  // ==========================================================================

  /** 更新区域状态 */
  function updateAreaStatus(areaId: string, status: AreaStatus, merchantId?: string) {
    const area = areas.value.find((a) => a.areaId === areaId)
    if (area) {
      area.status = status
      if (merchantId !== undefined) {
        area.authorizedMerchantId = merchantId || undefined
      }
    }
  }

  /** 更新店铺信息 */
  function updateStore(storeId: string, updates: Partial<StoreInfo>) {
    const store = stores.value.find((s) => s.storeId === storeId)
    if (store) {
      Object.assign(store, updates)
    }
  }

  /** 添加店铺 */
  function addStore(store: StoreInfo) {
    stores.value.push(store)
  }

  /** 删除店铺 */
  function removeStore(storeId: string) {
    const index = stores.value.findIndex((s) => s.storeId === storeId)
    if (index > -1) {
      stores.value.splice(index, 1)
    }
    // 如果删除的是当前选中的店铺，清除选中
    if (selectedStoreId.value === storeId) {
      selectedStoreId.value = null
    }
  }

  // ==========================================================================
  // Actions - 查询
  // ==========================================================================

  /** 根据ID获取楼层 */
  function getFloorById(floorId: string): FloorInfo | undefined {
    return floors.value.find((f) => f.floorId === floorId)
  }

  /** 根据ID获取区域 */
  function getAreaById(areaId: string): AreaInfo | undefined {
    return areas.value.find((a) => a.areaId === areaId)
  }

  /** 根据ID获取店铺 */
  function getStoreById(storeId: string): StoreInfo | undefined {
    return stores.value.find((s) => s.storeId === storeId)
  }

  /** 获取区域内的店铺列表 */
  function getStoresByArea(areaId: string): StoreInfo[] {
    return stores.value.filter((s) => s.areaId === areaId)
  }

  /** 获取商家的店铺列表 */
  function getStoresByMerchant(merchantId: string): StoreInfo[] {
    return stores.value.filter((s) => s.merchantId === merchantId)
  }

  /** 获取商家授权的区域列表 */
  function getAreasByMerchant(merchantId: string): AreaInfo[] {
    return areas.value.filter((a) => a.authorizedMerchantId === merchantId)
  }

  /** 搜索店铺（按名称） */
  function searchStores(keyword: string): StoreInfo[] {
    const lowerKeyword = keyword.toLowerCase()
    return stores.value.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerKeyword) ||
        s.category?.toLowerCase().includes(lowerKeyword)
    )
  }

  // ==========================================================================
  // Actions - 状态管理
  // ==========================================================================

  /** 设置加载状态 */
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  /** 设置错误信息 */
  function setError(msg: string | null) {
    error.value = msg
  }

  /** 清空所有数据 */
  function clearAll() {
    currentMall.value = null
    floors.value = []
    areas.value = []
    stores.value = []
    products.value = []
    currentFloorId.value = null
    selectedAreaId.value = null
    selectedStoreId.value = null
    isLoading.value = false
    error.value = null
  }

  // ==========================================================================
  // 返回
  // ==========================================================================

  return {
    // 状态
    currentMall,
    floors,
    areas,
    stores,
    products,
    currentFloorId,
    selectedAreaId,
    selectedStoreId,
    isLoading,
    error,

    // 计算属性
    currentFloor,
    currentFloorAreas,
    currentFloorStores,
    selectedArea,
    selectedStore,
    availableAreas,
    pendingAreas,
    authorizedAreas,
    areasByFloor,
    storesByArea,
    floorCount,
    storeCount,

    // Actions - 数据设置
    setMall,
    setFloors,
    setAreas,
    setStores,
    setProducts,
    setMallStructure,

    // Actions - 选择操作
    switchFloor,
    selectArea,
    selectStore,
    clearSelection,

    // Actions - 数据更新
    updateAreaStatus,
    updateStore,
    addStore,
    removeStore,

    // Actions - 查询
    getFloorById,
    getAreaById,
    getStoreById,
    getStoresByArea,
    getStoresByMerchant,
    getAreasByMerchant,
    searchStores,

    // Actions - 状态管理
    setLoading,
    setError,
    clearAll,
  }
})
