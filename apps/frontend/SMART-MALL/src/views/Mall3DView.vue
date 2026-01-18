<script setup lang="ts">
/**
 * 3D 商城入口页面
 * 
 * 展示 3D 可视化商城空间，支持楼层切换、店铺搜索、AI 导购等功能。
 * 
 * 【3D 交互】鼠标拖拽旋转 | 滚轮缩放 | 右键平移 | 点击店铺查看详情
 * 【AI 功能】文字对话 | 图片识别 | 场景联动
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores'
import { AiChatPanel } from '@/components'
import { useMall3DScene, useSearch } from './mall3d'
import type { AiNavigatePayload, AiHighlightPayload, AiShowDetailPayload } from '@/protocol/ai.protocol'

// ============================================================================
// 状态
// ============================================================================

const router = useRouter()
const userStore = useUserStore()
const containerRef = ref<HTMLElement | null>(null)

// 3D 场景
const {
  loading,
  floors,
  currentFloor,
  mallData,
  showImportSuccess,
  initScene,
  switchFloor,
  clearMall,
  dispose,
} = useMall3DScene({ containerRef })

// 搜索
const {
  query: searchQuery,
  results: searchResults,
  showResults: showSearchResults,
  selectedStore,
  showStorePanel,
  handleSearch,
  selectResult: selectSearchResult,
  closeStorePanel,
} = useSearch()

// UI 状态
const showFloorSelector = ref(false)
const showMinimap = ref(true)
const showAiChat = ref(false)

// ============================================================================
// 方法
// ============================================================================

const goBack = () => router.push('/mall')

function selectFloor(floorId: number) {
  switchFloor(floorId)
  showFloorSelector.value = false
}

const toggleMinimap = () => (showMinimap.value = !showMinimap.value)
const toggleAiChat = () => (showAiChat.value = !showAiChat.value)

// AI 事件处理
function handleAiNavigate(payload: AiNavigatePayload) {
  console.log('AI Navigate:', payload)
  // TODO: engine.flyTo(payload.position)
}

function handleAiHighlight(payload: AiHighlightPayload) {
  console.log('AI Highlight:', payload)
  // TODO: engine.highlight(payload.id)
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
        <div v-if="showImportSuccess && mallData" class="import-success-toast">
          <span class="toast-icon">✨</span>
          <span>已加载 AI 生成的商城：{{ mallData.name }}</span>
          <button class="toast-close" @click="showImportSuccess = false">×</button>
        </div>
      </Transition>

      <!-- 商城信息面板（AI 生成） -->
      <div v-if="mallData" class="mall-info-panel">
        <div class="mall-info-header">
          <span class="mall-name">{{ mallData.name }}</span>
          <span class="mall-badge">AI 生成</span>
        </div>
        <div class="mall-info-desc">{{ mallData.description }}</div>
        <button class="btn-clear-mall" @click="clearMall">清除并重置</button>
      </div>

      <!-- 顶部栏 -->
      <div class="top-bar">
        <button class="btn-back" @click="goBack">
          <span>←</span> 返回
        </button>

        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索店铺..."
            @input="handleSearch"
            @focus="handleSearch"
          />
          <span class="search-icon">🔍</span>
          <div v-if="showSearchResults && searchResults && searchResults.length > 0" class="search-results">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="search-item"
              @click="selectSearchResult(result)"
            >
              <span class="store-name">{{ result.name }}</span>
              <span class="store-location">{{ result.floor }} · {{ result.area }}</span>
            </div>
          </div>
        </div>

        <div class="user-info">{{ userStore.currentUser?.username }}</div>
      </div>

      <!-- 楼层选择器 -->
      <div class="floor-selector">
        <button class="floor-btn current" @click="showFloorSelector = !showFloorSelector">
          {{ floors.find(f => f.id === currentFloor)?.name }}
          <span class="arrow">{{ showFloorSelector ? '▲' : '▼' }}</span>
        </button>
        <div v-if="showFloorSelector" class="floor-list">
          <button
            v-for="floor in floors"
            :key="floor.id"
            :class="['floor-item', { active: floor.id === currentFloor }]"
            @click="selectFloor(floor.id)"
          >
            <span class="floor-name">{{ floor.name }}</span>
            <span class="floor-label">{{ floor.label }}</span>
          </button>
        </div>
      </div>

      <!-- 迷你地图 -->
      <div v-if="showMinimap" class="minimap">
        <div class="minimap-header">
          <span>迷你地图</span>
          <button class="btn-close" @click="toggleMinimap">×</button>
        </div>
        <div class="minimap-content">
          <div class="minimap-placeholder">
            {{ floors.find(f => f.id === currentFloor)?.name }}
          </div>
        </div>
      </div>
      <button v-else class="btn-minimap" @click="toggleMinimap">🗺️</button>

      <!-- 店铺详情面板 -->
      <div v-if="showStorePanel && selectedStore" class="store-panel">
        <div class="panel-header">
          <h3>{{ selectedStore.name }}</h3>
          <button class="btn-close" @click="closeStorePanel">×</button>
        </div>
        <div class="panel-content">
          <div class="info-row">
            <label>位置</label>
            <span>{{ selectedStore.floor }} · {{ selectedStore.area }}</span>
          </div>
          <div class="info-row">
            <label>分类</label>
            <span>餐饮</span>
          </div>
          <div class="info-row">
            <label>营业时间</label>
            <span>08:00 - 22:00</span>
          </div>
        </div>
        <div class="panel-actions">
          <button class="btn-primary">进入店铺</button>
        </div>
      </div>

      <!-- 操作提示 -->
      <div class="controls-hint">
        <span>🖱️ 拖拽旋转</span>
        <span>🔍 滚轮缩放</span>
        <span>⌨️ 右键平移</span>
      </div>

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
// ============================================================================
// CSS 变量
// ============================================================================
$bg-dark: #0a0a0a;
$bg-panel: rgba(17, 17, 19, 0.9);
$bg-panel-solid: rgba(17, 17, 19, 0.95);
$border-color: rgba(255, 255, 255, 0.1);
$border-subtle: rgba(255, 255, 255, 0.06);
$text-primary: #e8eaed;
$text-secondary: #9aa0a6;
$text-muted: #5f6368;
$accent-blue: #60a5fa;
$accent-blue-dark: #3b82f6;
$radius-sm: 8px;
$radius-md: 10px;
$radius-lg: 12px;

// ============================================================================
// 基础布局
// ============================================================================
.mall-3d-page {
  position: relative;
  width: 100%;
  height: 100vh;
  background: $bg-dark;
  overflow: hidden;
}

.three-container {
  width: 100%;
  height: 100%;
}

// ============================================================================
// 加载界面
// ============================================================================
.loading-overlay {
  position: absolute;
  inset: 0;
  background: $bg-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba($accent-blue, 0.2);
  border-top-color: $accent-blue;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text { font-size: 14px; color: $text-secondary; }
.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}
.loading-progress {
  height: 100%;
  background: $accent-blue;
  transition: width 0.3s ease;
}
.loading-percent { font-size: 12px; color: $text-muted; }

// ============================================================================
// UI 覆盖层
// ============================================================================
.ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  > * { pointer-events: auto; }
}

// ============================================================================
// 顶部栏
// ============================================================================
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, rgba($bg-dark, 0.9), transparent);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 20px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  color: $text-primary;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(255, 255, 255, 0.15); }
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;

  input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid $border-color;
    border-radius: $radius-sm;
    color: $text-primary;
    font-size: 14px;
    &:focus { outline: none; border-color: $accent-blue; }
    &::placeholder { color: $text-muted; }
  }
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: #111113;
  border: 1px solid $border-color;
  border-radius: $radius-sm;
  overflow: hidden;
}

.search-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(255, 255, 255, 0.05); }
}

.store-name { font-size: 14px; color: $text-primary; }
.store-location { font-size: 12px; color: $text-secondary; }
.user-info { margin-left: auto; font-size: 14px; color: $text-secondary; }

// ============================================================================
// 楼层选择器
// ============================================================================
.floor-selector {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.floor-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: $bg-panel;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  color: $text-primary;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: rgba(17, 17, 19, 1); }
}

.arrow { font-size: 10px; color: $text-secondary; }

.floor-list {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 8px;
  background: $bg-panel-solid;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  overflow: hidden;
  min-width: 180px;
}

.floor-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(255, 255, 255, 0.05); }
  &.active { background: rgba($accent-blue, 0.15); }
}

.floor-name { font-size: 15px; font-weight: 600; color: $text-primary; }
.floor-label { font-size: 12px; color: $text-secondary; }

// ============================================================================
// 迷你地图
// ============================================================================
.minimap {
  position: absolute;
  right: 20px;
  bottom: 80px;
  width: 180px;
  background: $bg-panel;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  overflow: hidden;
}

.minimap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid $border-subtle;
  font-size: 12px;
  color: $text-secondary;
}

.btn-close {
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: $text-secondary;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { color: $text-primary; }
}

.minimap-content { padding: 12px; }

.minimap-placeholder {
  width: 100%;
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: $text-muted;
}

.btn-minimap {
  position: absolute;
  right: 20px;
  bottom: 80px;
  width: 44px;
  height: 44px;
  background: $bg-panel;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(17, 17, 19, 1); }
}

// ============================================================================
// 店铺面板
// ============================================================================
.store-panel {
  position: absolute;
  right: 20px;
  top: 80px;
  width: 280px;
  background: $bg-panel-solid;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid $border-subtle;
  h3 { font-size: 16px; font-weight: 600; color: $text-primary; margin: 0; }
}

.panel-content {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  label { font-size: 13px; color: $text-secondary; }
  span { font-size: 14px; color: $text-primary; }
}

.panel-actions {
  padding: 16px 20px;
  border-top: 1px solid $border-subtle;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: $accent-blue;
  border: none;
  border-radius: $radius-sm;
  color: $bg-dark;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #93c5fd; }
}

// ============================================================================
// 操作提示
// ============================================================================
.controls-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
  padding: 10px 20px;
  background: rgba(17, 17, 19, 0.8);
  border-radius: 20px;
  font-size: 12px;
  color: $text-secondary;
}

// ============================================================================
// AI 聊天按钮
// ============================================================================
.btn-ai-chat {
  position: absolute;
  right: 20px;
  bottom: 80px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, $accent-blue 0%, $accent-blue-dark 100%);
  border: none;
  border-radius: 24px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba($accent-blue, 0.4);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba($accent-blue, 0.5);
  }
  .ai-icon { font-size: 18px; }
  .ai-label { font-weight: 600; }
}

// ============================================================================
// Toast 提示
// ============================================================================
.import-success-toast {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.9) 100%);
  border-radius: $radius-lg;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
  z-index: 100;
}

.toast-icon { font-size: 18px; }

.toast-close {
  margin-left: 8px;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  &:hover { background: rgba(255, 255, 255, 0.3); }
}

// ============================================================================
// 商城信息面板
// ============================================================================
.mall-info-panel {
  position: absolute;
  left: 20px;
  top: 80px;
  width: 240px;
  padding: 16px;
  background: $bg-panel-solid;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  backdrop-filter: blur(10px);
}

.mall-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mall-name { font-size: 16px; font-weight: 600; color: $text-primary; }

.mall-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, $accent-blue 0%, #818cf8 100%);
  border-radius: 10px;
  font-size: 10px;
  color: white;
  font-weight: 500;
}

.mall-info-desc {
  font-size: 12px;
  color: $text-secondary;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.btn-clear-mall {
  width: 100%;
  padding: 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: $radius-sm;
  color: #ef4444;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
  }
}

// ============================================================================
// 动画
// ============================================================================
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
