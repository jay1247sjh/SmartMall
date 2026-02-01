<script setup lang="ts">
/**
 * 3D 商城入口页面
 * 
 * 展示 3D 可视化商城空间，支持楼层切换、店铺搜索、AI 导购等功能。
 * 
 * 【3D 交互】鼠标拖拽旋转 | 滚轮缩放 | 右键平移 | 点击店铺查看详情
 * 【AI 功能】文字对话 | 图片识别 | 场景联动
 * 
 * 重构说明：
 * - 将 UI 元素拆分为独立子组件，保持 3D 渲染逻辑在主组件
 * - 子组件通过 Props 和 Emits 与主组件通信
 * - 样式已移至各子组件，主组件仅保留布局和加载相关样式
 * 
 * @validates Requirements 1.8, 1.9
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { useUserStore } from '@/stores'
import { AiChatPanel } from '@/components'
import { useMall3DScene, useSearch } from './mall3d'
import type { AiNavigatePayload, AiHighlightPayload, AiShowDetailPayload } from '@/protocol/ai.protocol'

// 导入 Mall3D 子组件
import {
  MallTopBar,
  FloorSelector,
  StorePanel,
  MiniMap,
  ControlsHint,
  ImportSuccessToast,
  MallInfoPanel,
} from '@/components/mall3d'
import type { SearchResult, Floor as FloorType, StoreDetail } from '@/components/mall3d'

// ============================================================================
// 状态
// ============================================================================

const router = useRouter()
const userStore = useUserStore()
const containerRef = ref<HTMLElement | null>(null)

// 3D 场景
const {
  engine,
  loading,
  floors,
  currentFloor,
  mallData,
  showImportSuccess,
  initScene,
  switchFloor,
  clearMall,
  dispose,
  highlightObject,
  clearHighlights,
} = useMall3DScene({ containerRef })

// 搜索（传入 engine 引用以支持相机飞行）
const {
  query: searchQuery,
  results: searchResults,
  showResults: showSearchResults,
  selectedStore,
  showStorePanel,
  isFlying,
  handleSearch,
  selectResult: selectSearchResult,
  closeStorePanel,
  flyToStore,
  flyToPosition,
} = useSearch({ engine })

// UI 状态
const showFloorSelector = ref(false)
const showMinimap = ref(true)
const showAiChat = ref(false)

// ============================================================================
// 计算属性
// ============================================================================

/** 当前用户名 */
const username = computed(() => userStore.currentUser?.username ?? '')

/** 当前楼层名称（用于迷你地图显示） */
const currentFloorName = computed(() => {
  const floor = floors.value.find(f => f.id === currentFloor.value)
  return floor?.name ?? ''
})

/** 转换楼层数据为子组件所需格式 */
const floorList = computed<FloorType[]>(() => {
  return floors.value.map(f => ({
    id: f.id,
    name: f.name,
    label: f.label ?? '',
  }))
})

/** 转换选中店铺数据为子组件所需格式 */
const storeDetail = computed<StoreDetail | null>(() => {
  if (!selectedStore.value) return null
  return {
    id: selectedStore.value.id,
    name: selectedStore.value.name,
    floor: selectedStore.value.floor,
    area: selectedStore.value.area,
    category: selectedStore.value.category ?? '餐饮',
    openTime: selectedStore.value.openTime ?? '08:00',
    closeTime: selectedStore.value.closeTime ?? '22:00',
  }
})

/** 转换搜索结果为子组件所需格式 */
const searchResultList = computed<SearchResult[]>(() => {
  if (!searchResults.value) return []
  return searchResults.value.map(r => ({
    id: r.id,
    name: r.name,
    floor: r.floor ?? '',
    area: r.area ?? '',
  }))
})

// ============================================================================
// 方法
// ============================================================================

/** 返回上一页 */
const goBack = () => router.push('/mall')

/** 选择楼层 */
function selectFloor(floorId: number) {
  switchFloor(floorId)
  showFloorSelector.value = false
}

/** 切换迷你地图显示 */
const toggleMinimap = () => (showMinimap.value = !showMinimap.value)

/** 关闭迷你地图 */
const closeMinimap = () => (showMinimap.value = false)

/** 切换 AI 聊天面板 */
const toggleAiChat = () => (showAiChat.value = !showAiChat.value)

/** 关闭导入成功提示 */
const closeImportToast = () => (showImportSuccess.value = false)

/** 处理搜索结果选择 */
function handleSelectResult(result: SearchResult) {
  selectSearchResult(result)
}

/** 处理进入店铺 */
function handleEnterStore() {
  if (selectedStore.value) {
    console.log('进入店铺:', selectedStore.value.id)
    // TODO: 实现进入店铺逻辑
  }
}

// AI 事件处理
function handleAiNavigate(payload: AiNavigatePayload) {
  console.log('AI Navigate:', payload)
  if (payload.position) {
    flyToPosition(new THREE.Vector3(
      payload.position.x,
      payload.position.y ?? 0,
      payload.position.z
    ))
  }
}

function handleAiHighlight(payload: AiHighlightPayload) {
  console.log('AI Highlight:', payload)
  if (payload.type === 'store') {
    highlightObject(payload.id, true)
    // 3秒后自动取消高亮
    setTimeout(() => highlightObject(payload.id, false), 3000)
  }
}

function handleAiShowDetail(payload: AiShowDetailPayload) {
  console.log('AI Show Detail:', payload)
  if (payload.type === 'store') {
    selectedStore.value = { id: payload.id, name: '店铺详情' }
    showStorePanel.value = true
  }
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(initScene)
onUnmounted(dispose)
</script>

<template>
  <div class="mall-3d-page">
    <!-- 3D 渲染容器 -->
    <div ref="containerRef" class="three-container" />

    <!-- 加载界面 -->
    <div v-if="loading.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner" />
        <div class="loading-text">{{ loading.text }}</div>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: `${loading.progress}%` }" />
        </div>
        <div class="loading-percent">{{ loading.progress }}%</div>
      </div>
    </div>

    <!-- UI 覆盖层 -->
    <div v-else class="ui-overlay">
      <!-- AI 导入成功提示 -->
      <Transition name="fade">
        <ImportSuccessToast
          v-if="showImportSuccess && mallData"
          :visible="showImportSuccess"
          :mall-name="mallData.name"
          @close="closeImportToast"
        />
      </Transition>

      <!-- 商城信息面板（AI 生成） -->
      <MallInfoPanel
        :mall-data="mallData"
        @clear="clearMall"
      />

      <!-- 顶部栏 -->
      <MallTopBar
        :username="username"
        :search-query="searchQuery"
        :search-results="searchResultList"
        :show-search-results="showSearchResults"
        @back="goBack"
        @update:search-query="(v) => (searchQuery = v)"
        @search="handleSearch"
        @select-result="handleSelectResult"
      />

      <!-- 楼层选择器 -->
      <FloorSelector
        :floors="floorList"
        :current-floor-id="currentFloor"
        v-model:visible="showFloorSelector"
        @select="selectFloor"
      />

      <!-- 迷你地图 -->
      <MiniMap
        :visible="showMinimap"
        :current-floor-name="currentFloorName"
        @close="closeMinimap"
        @toggle="toggleMinimap"
      />

      <!-- 店铺详情面板 -->
      <StorePanel
        :visible="showStorePanel"
        :store="storeDetail"
        @close="closeStorePanel"
        @enter="handleEnterStore"
      />

      <!-- 操作提示 -->
      <ControlsHint />

      <!-- AI 聊天按钮 -->
      <button v-if="!showAiChat" class="btn-ai-chat" @click="toggleAiChat">
        <span class="ai-icon">🤖</span>
        <span class="ai-label">小智</span>
      </button>

      <!-- AI 聊天面板 -->
      <AiChatPanel
        :visible="showAiChat"
        @close="showAiChat = false"
        @navigate="handleAiNavigate"
        @highlight="handleAiHighlight"
        @show-detail="handleAiShowDetail"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 基础布局
// ============================================================================
.mall-3d-page {
  position: relative;
  width: 100%;
  height: 100vh;
  background: $color-bg-primary;
  overflow: hidden;

  .three-container {
    width: 100%;
    height: 100%;
  }
}

// ============================================================================
// 加载界面
// ============================================================================
.loading-overlay {
  position: absolute;
  inset: 0;
  background: $color-bg-primary;
  @include flex-center;
  z-index: 100;

  .loading-content {
    @include flex-column;
    align-items: center;
    gap: $space-5;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba($color-primary, 0.2);
    border-top-color: $color-primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: $font-size-base;
    color: $color-text-secondary;
  }

  .loading-bar {
    width: 200px;
    height: 4px;
    background: $color-border-muted;
    border-radius: 2px;
    overflow: hidden;

    .loading-progress {
      height: 100%;
      background: $color-primary;
      @include transition-slow;
    }
  }

  .loading-percent {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================================================
// UI 覆盖层
// ============================================================================
.ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

// ============================================================================
// AI 聊天按钮
// ============================================================================
.btn-ai-chat {
  position: absolute;
  right: $space-5;
  bottom: 80px;
  @include flex-center-y;
  gap: $space-2;
  padding: $space-3 $space-5;
  background: linear-gradient(135deg, $color-primary 0%, $color-accent-blue-dark 100%);
  border: none;
  border-radius: 24px;
  color: white;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba($color-primary, 0.4);
  @include transition-fast;
  @include hover-lift;

  &:hover {
    box-shadow: 0 6px 20px rgba($color-primary, 0.5);
  }

  .ai-icon {
    font-size: $font-size-xl;
  }

  .ai-label {
    font-weight: $font-weight-semibold;
  }
}

// ============================================================================
// 动画（用于 ImportSuccessToast 的 Transition）
// ============================================================================
.fade-enter-active,
.fade-leave-active {
  transition: opacity $duration-slow $ease-default, transform $duration-slow $ease-default;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
