<script setup lang="ts">
/**
 * 商家工作台
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElRow,
  ElCol,
  ElCard,
  ElStatistic,
  ElButton,
  ElIcon,
  ElTag,
  ElEmpty,
  ElSkeleton,
  ElAvatar,
} from 'element-plus'
import { ArrowRight, Shop, Goods, View, Document } from '@element-plus/icons-vue'
import { StatCard, QuickActionCard } from '@/components'
import { merchantApi } from '@/api'
import { useUserStore } from '@/stores'
import type { MerchantStats, Store, AreaApplication } from '@/api/merchant.api'

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

const quickActions = [
  { title: '店铺配置', description: '管理店铺信息', path: '/merchant/store-config' },
  { title: '区域申请', description: '申请新区域', path: '/merchant/area-apply' },
  { title: '店铺装修', description: '3D场景编辑', path: '/merchant/builder' },
  { title: '数据分析', description: '查看经营数据', path: '/merchant/analytics' },
]

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

function getStatusType(status: string) {
  const map: Record<string, 'success' | 'info' | 'warning'> = {
    ACTIVE: 'success',
    INACTIVE: 'info',
    PENDING: 'warning',
  }
  return map[status] || 'info'
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: '营业中',
    INACTIVE: '已关闭',
    PENDING: '待审核',
  }
  return map[status] || status
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <article class="merchant-dashboard">
    <!-- 欢迎区域 -->
    <header class="welcome-section">
      <div class="welcome-bg"></div>
      <hgroup class="welcome-content">
        <h2>欢迎回来，{{ userStore.currentUser?.username }}</h2>
        <p>今日访客 {{ stats.todayVisitors }} 人，继续加油！</p>
      </hgroup>
      <nav class="welcome-actions">
        <ElButton type="primary" class="btn-gradient" @click="navigateTo('/merchant/builder')">
          进入店铺装修
          <ElIcon class="ml-1"><ArrowRight /></ElIcon>
        </ElButton>
      </nav>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-section" aria-label="数据统计">
      <ElRow :gutter="16">
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="我的店铺" :value="stats.storeCount">
              <template #prefix><ElIcon :size="20"><Shop /></ElIcon></template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="商品数量" :value="stats.productCount">
              <template #prefix><ElIcon :size="20"><Goods /></ElIcon></template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="今日访客" :value="stats.todayVisitors">
              <template #prefix><ElIcon :size="20"><View /></ElIcon></template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="待处理" :value="stats.pendingTasks">
              <template #prefix><ElIcon :size="20"><Document /></ElIcon></template>
            </ElStatistic>
          </ElCard>
        </ElCol>
      </ElRow>
    </section>

    <ElRow :gutter="20" class="content-grid">
      <!-- 我的店铺 -->
      <ElCol :xs="24" :md="12">
        <ElCard shadow="never" class="section-card">
          <template #header>
            <header class="section-header">
              <h3>我的店铺</h3>
              <ElButton text type="primary" @click="navigateTo('/merchant/store-config')">
                管理全部
              </ElButton>
            </header>
          </template>

          <ElSkeleton v-if="isLoading" :rows="3" animated />
          <ElEmpty v-else-if="stores.length === 0" description="暂无店铺" />
          <nav v-else class="store-list">
            <article
              v-for="store in stores"
              :key="store.id"
              class="store-item"
              @click="navigateTo('/merchant/store-config')"
            >
              <ElAvatar :size="42" class="store-avatar">
                {{ store.name.charAt(0) }}
              </ElAvatar>
              <hgroup class="store-info">
                <h4 class="store-name">{{ store.name }}</h4>
                <p class="store-location">{{ store.floorName }} · {{ store.areaName }}</p>
              </hgroup>
              <ElTag :type="getStatusType(store.status)" size="small">
                {{ getStatusText(store.status) }}
              </ElTag>
            </article>
          </nav>
        </ElCard>
      </ElCol>

      <!-- 申请状态 -->
      <ElCol :xs="24" :md="12">
        <ElCard shadow="never" class="section-card">
          <template #header>
            <header class="section-header">
              <h3>待处理申请</h3>
              <ElButton text type="primary" @click="navigateTo('/merchant/area-apply')">
                查看全部
              </ElButton>
            </header>
          </template>

          <ElSkeleton v-if="isLoading" :rows="3" animated />
          <ElEmpty v-else-if="applications.length === 0" description="暂无待处理申请" />
          <nav v-else class="application-list">
            <article v-for="app in applications" :key="app.id" class="application-item">
              <hgroup class="app-info">
                <h4 class="app-area">{{ app.floorName }} · {{ app.areaName }}</h4>
                <p class="app-reason">{{ app.reason }}</p>
              </hgroup>
              <ElTag type="warning" size="small">待审批</ElTag>
            </article>
          </nav>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 快捷操作 -->
    <section class="quick-actions" aria-label="快捷操作">
      <h3 class="section-title">快捷操作</h3>
      <ElRow :gutter="16">
        <ElCol v-for="action in quickActions" :key="action.title" :xs="24" :sm="12" :md="6">
          <QuickActionCard
            :title="action.title"
            :description="action.description"
            :path="action.path"
          />
        </ElCol>
      </ElRow>
    </section>
  </article>
</template>

<style scoped lang="scss">
.merchant-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;

  .welcome-section {
    position: relative;
    border-radius: 16px;
    padding: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(244, 114, 182, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%);

    .welcome-bg {
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

      h2 {
        font-size: 24px;
        font-weight: 500;
        margin: 0 0 8px 0;
      }

      p {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin: 0;
      }
    }

    .welcome-actions {
      position: relative;
      z-index: 1;

      .btn-gradient {
        background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
        border: none;
        border-radius: 10px;

        .ml-1 { margin-left: 4px; }
      }
    }
  }

  .stats-section {
    .stat-card {
      border-radius: 12px;
      margin-bottom: 16px;
    }
  }

  .content-grid {
    .section-card {
      border-radius: 12px;
      margin-bottom: 20px;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          font-size: 15px;
          font-weight: 500;
          margin: 0;
        }
      }

      .store-list, .application-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .store-item, .application-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        background: var(--el-fill-color-lighter);
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.15s;

        &:hover { background: var(--el-fill-color-light); }
      }

      .store-avatar {
        background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
        color: white;
        font-weight: 600;
      }

      .store-info, .app-info {
        flex: 1;

        h4 { font-size: 14px; font-weight: 500; margin: 0 0 4px 0; }
        p { font-size: 12px; color: var(--el-text-color-secondary); margin: 0; }
      }
    }
  }

  .quick-actions {
    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-secondary);
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}
</style>
