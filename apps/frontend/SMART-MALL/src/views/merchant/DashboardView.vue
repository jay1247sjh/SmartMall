<script setup lang="ts">
/**
 * 商家工作台
 * 显示商家统计、店铺列表、申请状态
 * Gemini 风格 - 专业深色主题
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StatCard, QuickActionCard } from '@/components'
import { merchantApi } from '@/api'
import { useUserStore } from '@/stores'
import type { MerchantStats, Store, AreaApplication } from '@/api/merchant.api'

// ============================================================================
// State
// ============================================================================

const router = useRouter()
const userStore = useUserStore()

const isLoading = ref(true)
const stats = ref<MerchantStats>({
  storeCount: 0,
  productCount: 0,
  todayVisitors: 0,
  pendingTasks: 0,
})
const stores = ref<Store[]>([])
const applications = ref<AreaApplication[]>([])

// ============================================================================
// Computed
// ============================================================================

const quickActions = [
  { title: '店铺配置', desc: '管理店铺信息', route: '/merchant/store-config' },
  { title: '区域申请', desc: '申请新区域', route: '/merchant/area-apply' },
  { title: '店铺装修', desc: '3D场景编辑', route: '/merchant/builder' },
  { title: '数据分析', desc: '查看经营数据', route: '/merchant/analytics' },
]

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    const [statsData, storesData, appsData] = await Promise.all([
      merchantApi.getStats(),
      merchantApi.getMyStores(),
      merchantApi.getMyApplications(),
    ])
    stats.value = statsData
    stores.value = storesData
    applications.value = appsData.filter(a => a.status === 'PENDING').slice(0, 3)
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    isLoading.value = false
  }
}

function navigateTo(route: string) {
  router.push(route)
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'status-active',
    INACTIVE: 'status-inactive',
    PENDING: 'status-pending',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: '营业中',
    INACTIVE: '已关闭',
    PENDING: '待审核',
  }
  return map[status] || status
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="merchant-dashboard">
      <!-- 欢迎区域 -->
      <div class="welcome-section">
        <div class="welcome-bg">
          <div class="bg-gradient"></div>
          <div class="bg-glow"></div>
        </div>
        <div class="welcome-content">
          <h2>欢迎回来，{{ userStore.currentUser?.username }}</h2>
          <p>今日访客 {{ stats.todayVisitors }} 人，继续加油！</p>
        </div>
        <div class="welcome-actions">
          <button class="btn-primary" @click="navigateTo('/merchant/builder')">
            进入店铺装修
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <StatCard
          label="我的店铺"
          :value="stats.storeCount"
        />
        <StatCard
          label="商品数量"
          :value="stats.productCount"
        />
        <StatCard
          label="今日访客"
          :value="stats.todayVisitors"
        />
        <StatCard
          label="待处理"
          :value="stats.pendingTasks"
        />
      </div>

      <div class="content-grid">
        <!-- 我的店铺 -->
        <div class="section-card">
          <div class="section-header">
            <h3>我的店铺</h3>
            <button class="btn-link" @click="navigateTo('/merchant/store-config')">
              管理全部
            </button>
          </div>
          
          <div v-if="isLoading" class="loading">加载中...</div>
          
          <div v-else-if="stores.length === 0" class="empty">
            暂无店铺
          </div>
          
          <div v-else class="store-list">
            <div
              v-for="store in stores"
              :key="store.id"
              class="store-item"
              @click="navigateTo('/merchant/store-config')"
            >
              <div class="store-avatar">
                {{ store.name.charAt(0) }}
              </div>
              <div class="store-info">
                <span class="store-name">{{ store.name }}</span>
                <span class="store-location">{{ store.floorName }} · {{ store.areaName }}</span>
              </div>
              <span :class="['status-badge', getStatusClass(store.status)]">
                {{ getStatusText(store.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 申请状态 -->
        <div class="section-card">
          <div class="section-header">
            <h3>待处理申请</h3>
            <button class="btn-link" @click="navigateTo('/merchant/area-apply')">
              查看全部
            </button>
          </div>
          
          <div v-if="isLoading" class="loading">加载中...</div>
          
          <div v-else-if="applications.length === 0" class="empty">
            暂无待处理申请
          </div>
          
          <div v-else class="application-list">
            <div
              v-for="app in applications"
              :key="app.id"
              class="application-item"
            >
              <div class="app-info">
                <span class="app-area">{{ app.floorName }} · {{ app.areaName }}</span>
                <span class="app-reason">{{ app.reason }}</span>
              </div>
              <span class="status-badge status-pending">待审批</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <h3 class="section-title">快捷操作</h3>
        <div class="actions-grid">
          <QuickActionCard
            v-for="action in quickActions"
            :key="action.title"
            :title="action.title"
            :description="action.desc"
            :path="action.route"
          />
    </div>
  </div>
</template>


<style scoped>
.merchant-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Welcome Section */
.welcome-section {
  position: relative;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
}

.welcome-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.welcome-bg .bg-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 50% at 20% 40%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(249, 115, 22, 0.06) 0%, transparent 50%);
}

.welcome-bg .bg-glow {
  position: absolute;
  width: 200px;
  height: 200px;
  top: -50px;
  right: 10%;
  background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
  opacity: 0.15;
  border-radius: 50%;
  filter: blur(60px);
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-content h2 {
  font-size: 24px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.welcome-content p {
  font-size: 14px;
  color: #9aa0a6;
  margin: 0;
}

.welcome-actions {
  position: relative;
  z-index: 1;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(244, 114, 182, 0.3);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* Section Card */
.section-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 15px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0;
}

.btn-link {
  background: none;
  border: none;
  color: #8ab4f8;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.btn-link:hover {
  color: #aecbfa;
}

.loading,
.empty {
  padding: 32px;
  text-align: center;
  color: #5f6368;
  font-size: 14px;
}

/* Store List */
.store-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.store-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.store-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.store-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.store-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.store-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
}

.store-location {
  font-size: 12px;
  color: #9aa0a6;
}

/* Application List */
.application-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.application-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
}

.app-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-area {
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
}

.app-reason {
  font-size: 12px;
  color: #9aa0a6;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
}

.status-inactive {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}

.status-pending {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

/* Quick Actions */
.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #9aa0a6;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 1200px) {
  .stats-grid,
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
