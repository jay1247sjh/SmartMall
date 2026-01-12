<script setup lang="ts">
/**
 * ============================================================================
 * 3D 商城入口页面 (Mall3DView)
 * ============================================================================
 *
 * 【业务职责】
 * Smart Mall 的核心页面，展示 3D 可视化的商城空间。
 * 用户可以在这里浏览商城、切换楼层、搜索店铺、查看店铺详情。
 * 集成 AI 导购助手，支持智能对话和视觉理解。
 *
 * 【页面功能】
 * 1. 3D 场景渲染 - 使用 Three.js 引擎渲染商城模型
 * 2. 楼层切换 - 在不同楼层间导航
 * 3. 店铺搜索 - 按名称搜索店铺
 * 4. 店铺详情 - 点击店铺查看详细信息
 * 5. 迷你地图 - 显示当前楼层的俯视图
 * 6. AI 导购 - 智能对话、图片识别、导航推荐
 * 7. 操作提示 - 指导用户如何操作 3D 场景
 *
 * 【3D 交互说明】
 * - 鼠标拖拽：旋转视角
 * - 滚轮：缩放场景
 * - 右键拖拽：平移视角
 * - 点击店铺：显示店铺详情面板
 *
 * 【AI 导购功能】
 * - 文字对话：询问店铺位置、商品推荐等
 * - 图片识别：上传图片，推荐相似商品
 * - 场景联动：AI 回复可触发导航、高亮等操作
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
 * - 顶层：UI 覆盖层（顶部栏、楼层选择器、迷你地图、店铺面板、AI 聊天等）
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
 * - AiChatPanel：AI 导购聊天组件
 * ============================================================================
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ThreeEngine } from '@/engine'
import { useUserStore } from '@/stores'
import { AiChatPanel } from '@/components'

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
const floors = ref([
  { id: 1, name: '1F', label: '一楼 - 餐饮美食' },
  { id: 2, name: '2F', label: '二楼 - 服装服饰' },
  { id: 3, name: '3F', label: '三楼 - 娱乐休闲' },
])

// ----------------------------------------------------------------------------
// 搜索状态
// ----------------------------------------------------------------------------

/** 搜索关键词 */
const searchQuery = ref('')
/** 是否显示搜索结果下拉 */
const showSearchResults = ref(false)
/** 搜索结果列表 */
const searchResults = ref<any[]>([])

// ----------------------------------------------------------------------------
// AI 聊天状态
// ----------------------------------------------------------------------------

/** 是否显示 AI 聊天面板 */
const showAiChat = ref(false)

/** AI 生成的商城数据 */
const generatedMallData = ref<any>(null)

/** 是否显示导入成功提示 */
const showImportSuccess = ref(false)

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

  // 检查是否有 AI 生成的商城数据
  const savedMallData = localStorage.getItem('ai_generated_mall')
  if (savedMallData) {
    try {
      generatedMallData.value = JSON.parse(savedMallData)
      await loadGeneratedMall(generatedMallData.value)
      showImportSuccess.value = true
      // 3秒后隐藏提示
      setTimeout(() => {
        showImportSuccess.value = false
      }, 3000)
    } catch (e) {
      console.error('Failed to parse generated mall data:', e)
      await simulateLoadMall()
    }
  } else {
    // 加载默认商城模型
    await simulateLoadMall()
  }

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
 * 加载 AI 生成的商城数据
 * 根据生成的 JSON 数据创建 3D 场景
 */
async function loadGeneratedMall(mallData: any) {
  if (!engine.value || !mallData) return

  const THREE = await import('three')
  const scene = engine.value.getScene()

  // 获取商城尺寸
  const outline = mallData.outline
  let width = 100, height = 80
  if (outline?.vertices?.length >= 2) {
    const xs = outline.vertices.map((v: any) => v.x)
    const ys = outline.vertices.map((v: any) => v.y)
    width = Math.max(...xs) - Math.min(...xs)
    height = Math.max(...ys) - Math.min(...ys)
  }

  // 创建地板
  const floorGeometry = new THREE.PlaneGeometry(width + 20, height + 20)
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.8,
  })
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(width / 2, 0, height / 2)
  floor.receiveShadow = true
  scene.add(floor)

  // 更新楼层数据
  if (mallData.floors?.length > 0) {
    floors.value = mallData.floors.map((f: any, index: number) => ({
      id: f.level || index + 1,
      name: f.name || `${index + 1}F`,
      label: `${f.name || `${index + 1}F`} - ${getFloorDescription(f)}`,
    }))
  }

  // 渲染当前楼层的区域
  const currentFloorData = mallData.floors?.find((f: any) => f.level === currentFloor.value) || mallData.floors?.[0]
  if (currentFloorData?.areas) {
    for (const area of currentFloorData.areas) {
      await renderArea(area, THREE)
    }
  }

  // 请求重新渲染
  engine.value.requestRender()
}

/**
 * 获取楼层描述
 */
function getFloorDescription(floor: any): string {
  if (!floor.areas?.length) return '待规划'
  const storeCount = floor.areas.filter((a: any) => a.type === 'store').length
  const types = [...new Set(floor.areas.map((a: any) => a.properties?.category).filter(Boolean))]
  if (types.length > 0) {
    const categoryNames: Record<string, string> = {
      fashion: '服装',
      sports: '运动',
      food: '餐饮',
      cafe: '咖啡',
      electronics: '数码',
      entertainment: '娱乐',
    }
    return types.map(t => categoryNames[t as string] || t).join('·')
  }
  return `${storeCount} 家店铺`
}

/**
 * 渲染单个区域
 */
async function renderArea(area: any, THREE: any) {
  if (!engine.value || !area.shape?.vertices?.length) return

  const vertices = area.shape.vertices
  
  // 计算区域中心和尺寸
  const xs = vertices.map((v: any) => v.x)
  const ys = vertices.map((v: any) => v.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const centerX = (minX + maxX) / 2
  const centerZ = (minY + maxY) / 2
  const areaWidth = maxX - minX
  const areaDepth = maxY - minY

  // 根据类型设置高度
  const heightMap: Record<string, number> = {
    store: 4,
    corridor: 0.1,
    facility: 3,
    entrance: 2,
  }
  const areaHeight = heightMap[area.type] || 4

  // 解析颜色
  let color = 0x3b82f6
  if (area.color) {
    color = parseInt(area.color.replace('#', ''), 16)
  }

  // 创建 3D 方块
  if (area.type === 'corridor') {
    // 走廊用扁平的方块
    const geometry = new THREE.BoxGeometry(areaWidth, 0.1, areaDepth)
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.9,
      transparent: true,
      opacity: 0.5,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(centerX, 0.05, centerZ)
    mesh.userData = { name: area.name, type: area.type, isArea: true }
    engine.value.getScene().add(mesh)
  } else {
    // 店铺用立体方块
    const geometry = new THREE.BoxGeometry(areaWidth - 1, areaHeight, areaDepth - 1)
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.6,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(centerX, areaHeight / 2, centerZ)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { name: area.name, type: area.type, isArea: true }
    engine.value.getScene().add(mesh)
    
    // 添加店铺名称标签（使用 Sprite）
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 256
    canvas.height = 64
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(area.name, canvas.width / 2, canvas.height / 2)
    
    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.set(centerX, areaHeight + 1, centerZ)
    sprite.scale.set(8, 2, 1)
    sprite.userData = { isArea: true }
    engine.value.getScene().add(sprite)
  }
}

/**
 * 清除生成的商城数据
 */
function clearGeneratedMall() {
  localStorage.removeItem('ai_generated_mall')
  generatedMallData.value = null
  // 重新加载默认场景
  if (engine.value) {
    const scene = engine.value.getScene()
    // 清除所有对象（保留灯光和相机）
    const toRemove: any[] = []
    scene.traverse((obj: any) => {
      if (obj.type === 'Mesh' || obj.type === 'Sprite') {
        toRemove.push(obj)
      }
    })
    toRemove.forEach(obj => scene.remove(obj))
    simulateLoadMall()
  }
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
async function selectFloor(floorId: number) {
  currentFloor.value = floorId
  showFloorSelector.value = false
  
  // 如果有生成的商城数据，重新渲染对应楼层
  if (generatedMallData.value && engine.value) {
    const THREE = await import('three')
    const scene = engine.value.getScene()
    
    // 清除当前楼层的对象（保留地板和灯光）
    const toRemove: any[] = []
    scene.traverse((obj: any) => {
      if ((obj.type === 'Mesh' || obj.type === 'Sprite') && obj.userData?.isArea) {
        toRemove.push(obj)
      }
    })
    toRemove.forEach(obj => scene.remove(obj))
    
    // 渲染新楼层的区域
    const currentFloorData = generatedMallData.value.floors?.find((f: any) => f.level === floorId)
    if (currentFloorData?.areas) {
      for (const area of currentFloorData.areas) {
        await renderArea(area, THREE)
      }
    }
    
    engine.value.requestRender()
  }
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

/**
 * 切换 AI 聊天面板显示状态
 */
function toggleAiChat() {
  showAiChat.value = !showAiChat.value
}

/**
 * 处理 AI 导航事件
 * 当 AI 返回导航指令时，移动相机到目标位置
 */
function handleAiNavigate(payload: { storeId: string; position: { x: number; y: number; z: number } }) {
  console.log('AI Navigate:', payload)
  // TODO: 实现相机飞行动画到目标位置
  // engine.value?.flyTo(payload.position)
}

/**
 * 处理 AI 高亮事件
 * 当 AI 返回高亮指令时，高亮显示目标对象
 */
function handleAiHighlight(payload: { type: 'store' | 'product'; id: string }) {
  console.log('AI Highlight:', payload)
  // TODO: 实现高亮效果
  // engine.value?.highlight(payload.id)
}

/**
 * 处理 AI 显示详情事件
 */
function handleAiShowDetail(payload: { type: 'store' | 'product'; id: string }) {
  console.log('AI Show Detail:', payload)
  // TODO: 显示详情面板
  if (payload.type === 'store') {
    selectedStore.value = { id: payload.id, name: '店铺详情' }
    showStorePanel.value = true
  }
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
      <!-- AI 生成商城导入成功提示 -->
      <Transition name="fade">
        <div v-if="showImportSuccess && generatedMallData" class="import-success-toast">
          <span class="toast-icon">✨</span>
          <span class="toast-text">已加载 AI 生成的商城：{{ generatedMallData.name }}</span>
          <button class="toast-close" @click="showImportSuccess = false">×</button>
        </div>
      </Transition>

      <!-- 商城信息面板（AI 生成时显示） -->
      <div v-if="generatedMallData" class="mall-info-panel">
        <div class="mall-info-header">
          <span class="mall-name">{{ generatedMallData.name }}</span>
          <span class="mall-badge">AI 生成</span>
        </div>
        <div class="mall-info-desc">{{ generatedMallData.description }}</div>
        <button class="btn-clear-mall" @click="clearGeneratedMall">清除并重置</button>
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

// ============================================================================
// Loading Overlay
// ============================================================================
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

// ============================================================================
// UI Overlay
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
// Top Bar
// ============================================================================
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

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;

  input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    color: #e8eaed;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #60a5fa;
    }

    &::placeholder {
      color: #5f6368;
    }
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

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
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

// ============================================================================
// Floor Selector
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
  background: rgba(17, 17, 19, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #e8eaed;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(17, 17, 19, 1);
  }
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

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    background: rgba(96, 165, 250, 0.15);
  }
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

// ============================================================================
// Minimap
// ============================================================================
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

  &:hover {
    color: #e8eaed;
  }
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

  &:hover {
    background: rgba(17, 17, 19, 1);
  }
}

// ============================================================================
// Store Panel
// ============================================================================
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

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #e8eaed;
    margin: 0;
  }
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

  label {
    font-size: 13px;
    color: #9aa0a6;
  }

  span {
    font-size: 14px;
    color: #e8eaed;
  }
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

  &:hover {
    background: #93c5fd;
  }
}

// ============================================================================
// Controls Hint
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
  color: #9aa0a6;
}

// ============================================================================
// AI Chat Button
// ============================================================================
.btn-ai-chat {
  position: absolute;
  right: 20px;
  bottom: 80px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  border: none;
  border-radius: 24px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(96, 165, 250, 0.4);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(96, 165, 250, 0.5);
  }

  .ai-icon {
    font-size: 18px;
  }

  .ai-label {
    font-weight: 600;
  }
}

// ============================================================================
// AI 生成商城导入成功提示
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
  border-radius: 12px;
  color: white;
  font-size: 14px;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
  z-index: 100;
}

.toast-icon {
  font-size: 18px;
}

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

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
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
  background: rgba(17, 17, 19, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.mall-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mall-name {
  font-size: 16px;
  font-weight: 600;
  color: #e8eaed;
}

.mall-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border-radius: 10px;
  font-size: 10px;
  color: white;
  font-weight: 500;
}

.mall-info-desc {
  font-size: 12px;
  color: #9aa0a6;
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
  border-radius: 8px;
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
// 淡入淡出动画
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
