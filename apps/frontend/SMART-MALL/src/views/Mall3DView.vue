<script setup lang="ts">
/**
 * ============================================================================
 * 3D 商城入口页面 (Mall3DView)
 * ============================================================================
 *
 * 【业务职责】
 * Smart Mall 的核心页面，展示 3D 可视化的商城空间。
 * 用户可以在这里浏览商城、切换楼层、搜索店铺、查看店铺详情。
 *
 * 【页面功能】
 * 1. 3D 场景渲染 - 使用 Three.js 引擎渲染商城模型
 * 2. 楼层切换 - 在不同楼层间导航
 * 3. 店铺搜索 - 按名称搜索店铺
 * 4. 店铺详情 - 点击店铺查看详细信息
 * 5. 迷你地图 - 显示当前楼层的俯视图
 * 6. 操作提示 - 指导用户如何操作 3D 场景
 *
 * 【3D 交互说明】
 * - 鼠标拖拽：旋转视角
 * - 滚轮：缩放场景
 * - 右键拖拽：平移视角
 * - 点击店铺：显示店铺详情面板
 *
 * 【加载流程】
 * 1. 初始化 Three.js 引擎
 * 2. 创建 3D 场景
 * 3. 加载商城模型和资源
 * 4. 初始化交互控制
 * 5. 启动渲染循环
 * 6. 隐藏加载界面
 *
 * 【UI 层级】
 * - 底层：Three.js 渲染的 3D 场景
 * - 顶层：UI 覆盖层（顶部栏、楼层选择器、迷你地图、店铺面板等）
 * UI 覆盖层使用 pointer-events: none 让鼠标事件穿透到 3D 场景，
 * 只有具体的 UI 元素设置 pointer-events: auto 接收点击。
 *
 * 【当前状态】
 * 目前使用简单的方块模拟店铺，实际项目中会加载真实的 3D 模型。
 * 楼层数据和店铺数据也是 Mock 的，后续需要从 API 获取。
 *
 * 【与其他模块的关系】
 * - ThreeEngine：3D 渲染引擎，封装 Three.js
 * - mall.store：商城数据状态管理
 * - system.store：系统模式（RUNTIME/CONFIG）管理
 * ============================================================================
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ThreeEngine } from '@/engine'
import { useUserStore } from '@/stores'

// ============================================================================
// 状态定义
// ============================================================================

const router = useRouter()
const userStore = useUserStore()

/** Three.js 渲染容器的 DOM 引用 */
const containerRef = ref<HTMLElement | null>(null)
/** Three.js 引擎实例 */
const engine = ref<ThreeEngine | null>(null)

// ----------------------------------------------------------------------------
// 加载状态
// ----------------------------------------------------------------------------

/** 是否正在加载 */
const isLoading = ref(true)
/** 加载进度（0-100） */
const loadProgress = ref(0)
/** 加载提示文字 */
const loadingText = ref('初始化引擎...')

// ----------------------------------------------------------------------------
// UI 状态
// ----------------------------------------------------------------------------

/** 是否显示楼层选择器下拉菜单 */
const showFloorSelector = ref(false)
/** 当前选中的楼层 ID */
const currentFloor = ref(1)
/** 是否显示店铺详情面板 */
const showStorePanel = ref(false)
/** 当前选中的店铺信息 */
const selectedStore = ref<any>(null)
/** 是否显示迷你地图 */
const showMinimap = ref(true)

// ----------------------------------------------------------------------------
// 楼层数据（Mock）
// ----------------------------------------------------------------------------

/**
 * 楼层列表
 * 实际项目中应从 mall.store 获取
 */
const floors = [
  { id: 1, name: '1F', label: '一楼 - 餐饮美食' },
  { id: 2, name: '2F', label: '二楼 - 服装服饰' },
  { id: 3, name: '3F', label: '三楼 - 娱乐休闲' },
]

// ----------------------------------------------------------------------------
// 搜索状态
// ----------------------------------------------------------------------------

/** 搜索关键词 */
const searchQuery = ref('')
/** 是否显示搜索结果下拉 */
const showSearchResults = ref(false)
/** 搜索结果列表 */
const searchResults = ref<any[]>([])

// ============================================================================
// 方法定义
// ============================================================================

/**
 * 初始化 Three.js 引擎
 * 创建 3D 场景并加载商城模型
 */
async function initEngine() {
  if (!containerRef.value) return

  loadingText.value = '创建 3D 场景...'
  loadProgress.value = 20

  // 创建引擎实例，配置渲染参数
  engine.value = new ThreeEngine(containerRef.value, {
    backgroundColor: 0x0a0a0a,  // 深色背景
    antialias: true,            // 开启抗锯齿
    cameraMode: 'orbit',        // 轨道相机模式
  })

  loadProgress.value = 40
  loadingText.value = '加载场景资源...'

  // 添加网格辅助线（开发调试用）
  engine.value.addGridHelper(100, 100)

  loadProgress.value = 60
  loadingText.value = '构建商城模型...'

  // 加载商城模型（目前是模拟数据）
  await simulateLoadMall()

  loadProgress.value = 80
  loadingText.value = '初始化交互...'

  // 启动渲染循环
  engine.value.start()

  loadProgress.value = 100
  loadingText.value = '加载完成'

  // 延迟隐藏加载界面，让用户看到 100% 完成
  setTimeout(() => {
    isLoading.value = false
  }, 500)
}

/**
 * 模拟加载商城模型
 * 实际项目中会加载真实的 GLTF/GLB 模型
 */
async function simulateLoadMall() {
  // 模拟网络加载延迟
  await new Promise(resolve => setTimeout(resolve, 800))

  if (!engine.value) return

  const scene = engine.value.getScene()
  
  // 创建地板
  const floorGeometry = new (await import('three')).PlaneGeometry(80, 80)
  const floorMaterial = new (await import('three')).MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.8,
  })
  const floor = new (await import('three')).Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2  // 旋转为水平
  floor.receiveShadow = true
  scene.add(floor)

  // 创建示例店铺方块
  // 实际项目中这些会是从后端加载的店铺模型
  const THREE = await import('three')
  const storePositions = [
    { x: -15, z: -15, color: 0x60a5fa },  // 蓝色
    { x: 0, z: -15, color: 0x34d399 },    // 绿色
    { x: 15, z: -15, color: 0xa78bfa },   // 紫色
    { x: -15, z: 0, color: 0xfbbf24 },    // 黄色
    { x: 15, z: 0, color: 0xf28b82 },     // 红色
    { x: -15, z: 15, color: 0x60a5fa },
    { x: 0, z: 15, color: 0x34d399 },
    { x: 15, z: 15, color: 0xa78bfa },
  ]

  // 为每个位置创建一个方块代表店铺
  storePositions.forEach(pos => {
    engine.value!.addBox(
      new THREE.Vector3(pos.x, 0, pos.z),
      { width: 8, height: 4, depth: 8 },
      pos.color
    )
  })

  // 请求重新渲染
  engine.value.requestRender()
}

/**
 * 返回上一页（商城首页）
 */
function goBack() {
  router.push('/mall')
}

/**
 * 切换楼层
 * @param floorId - 目标楼层 ID
 */
function selectFloor(floorId: number) {
  currentFloor.value = floorId
  showFloorSelector.value = false
  // TODO: 切换楼层场景，加载对应楼层的模型
}

/**
 * 处理搜索输入
 * 根据关键词过滤店铺列表
 */
function handleSearch() {
  if (!searchQuery.value.trim()) {
    showSearchResults.value = false
    return
  }
  
  // 模拟搜索结果（实际项目中应调用 API 或从 store 过滤）
  searchResults.value = [
    { id: 1, name: '星巴克咖啡', floor: '1F', area: 'A-101' },
    { id: 2, name: '优衣库', floor: '2F', area: 'B-201' },
  ].filter(s => s.name.includes(searchQuery.value))
  
  showSearchResults.value = true
}

/**
 * 选择搜索结果中的店铺
 * @param store - 选中的店铺信息
 */
function selectSearchResult(store: any) {
  selectedStore.value = store
  showStorePanel.value = true
  showSearchResults.value = false
  searchQuery.value = ''
  // TODO: 相机飞向店铺位置（动画过渡）
}

/**
 * 关闭店铺详情面板
 */
function closeStorePanel() {
  showStorePanel.value = false
  selectedStore.value = null
}

/**
 * 切换迷你地图显示状态
 */
function toggleMinimap() {
  showMinimap.value = !showMinimap.value
}

// ============================================================================
// 生命周期
// ============================================================================

/**
 * 组件挂载时初始化 3D 引擎
 */
onMounted(() => {
  initEngine()
})

/**
 * 组件卸载时销毁 3D 引擎，释放资源
 */
onUnmounted(() => {
  engine.value?.dispose()
})
</script>

<template>
  <div class="mall-3d-page">
    <!-- 3D 渲染容器 -->
    <div ref="containerRef" class="three-container"></div>

    <!-- 加载界面 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ loadingText }}</div>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: `${loadProgress}%` }"></div>
        </div>
        <div class="loading-percent">{{ loadProgress }}%</div>
      </div>
    </div>

    <!-- UI 覆盖层 -->
    <div v-if="!isLoading" class="ui-overlay">
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
          
          <!-- 搜索结果 -->
          <div v-if="showSearchResults && searchResults.length > 0" class="search-results">
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

        <div class="user-info">
          <span>{{ userStore.currentUser?.username }}</span>
        </div>
      </div>

      <!-- 楼层选择器 -->
      <div class="floor-selector">
        <button
          class="floor-btn current"
          @click="showFloorSelector = !showFloorSelector"
        >
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
            <span>{{ floors.find(f => f.id === currentFloor)?.name }}</span>
          </div>
        </div>
      </div>

      <!-- 迷你地图开关 -->
      <button v-if="!showMinimap" class="btn-minimap" @click="toggleMinimap">
        🗺️
      </button>

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
    </div>
  </div>
</template>


<style scoped>
.mall-3d-page {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #0a0a0a;
  overflow: hidden;
}

.three-container {
  width: 100%;
  height: 100%;
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: #0a0a0a;
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
  border: 3px solid rgba(96, 165, 250, 0.2);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #9aa0a6;
}

.loading-bar {
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  background: #60a5fa;
  transition: width 0.3s ease;
}

.loading-percent {
  font-size: 12px;
  color: #5f6368;
}

/* UI Overlay */
.ui-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ui-overlay > * {
  pointer-events: auto;
}

/* Top Bar */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, rgba(10, 10, 10, 0.9), transparent);
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e8eaed;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.15);
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e8eaed;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #60a5fa;
}

.search-box input::placeholder {
  color: #5f6368;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.search-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.search-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.store-name {
  font-size: 14px;
  color: #e8eaed;
}

.store-location {
  font-size: 12px;
  color: #9aa0a6;
}

.user-info {
  margin-left: auto;
  font-size: 14px;
  color: #9aa0a6;
}

/* Floor Selector */
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
  background: rgba(17, 17, 19, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #e8eaed;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.floor-btn:hover {
  background: rgba(17, 17, 19, 1);
}

.arrow {
  font-size: 10px;
  color: #9aa0a6;
}

.floor-list {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 8px;
  background: rgba(17, 17, 19, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
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
}

.floor-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.floor-item.active {
  background: rgba(96, 165, 250, 0.15);
}

.floor-name {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaed;
}

.floor-label {
  font-size: 12px;
  color: #9aa0a6;
}

/* Minimap */
.minimap {
  position: absolute;
  right: 20px;
  bottom: 80px;
  width: 180px;
  background: rgba(17, 17, 19, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.minimap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: #9aa0a6;
}

.btn-close {
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: #9aa0a6;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #e8eaed;
}

.minimap-content {
  padding: 12px;
}

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
  color: #5f6368;
}

.btn-minimap {
  position: absolute;
  right: 20px;
  bottom: 80px;
  width: 44px;
  height: 44px;
  background: rgba(17, 17, 19, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-minimap:hover {
  background: rgba(17, 17, 19, 1);
}

/* Store Panel */
.store-panel {
  position: absolute;
  right: 20px;
  top: 80px;
  width: 280px;
  background: rgba(17, 17, 19, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0;
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
}

.info-row label {
  font-size: 13px;
  color: #9aa0a6;
}

.info-row span {
  font-size: 14px;
  color: #e8eaed;
}

.panel-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #60a5fa;
  border: none;
  border-radius: 8px;
  color: #0a0a0a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #93c5fd;
}

/* Controls Hint */
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
  color: #9aa0a6;
}
</style>
