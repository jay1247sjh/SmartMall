<script setup lang="ts">
/**
 * 商家工作台视图
 *
 * 这是商家登录后看到的首页，提供店铺概览和快捷入口。
 *
 * 业务职责：
 * - 展示商家关键指标（店铺数、商品数、待处理申请数）
 * - 显示商家的店铺列表和状态
 * - 显示待处理的区域申请
 * - 提供快捷入口到各管理功能
 *
 * 数据流：
 * - 页面加载时使用 Promise.allSettled 并行请求统计、店铺、申请
 * - 各区域独立错误处理和重试
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可访问
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
import { ArrowRight, Shop, Goods, Document } from '@element-plus/icons-vue'
import { QuickActionCard } from '@/components'
import { merchantApi } from '@/api'
import { useUserStore } from '@/stores'
import type { MerchantStats, Store, AreaApplication } from '@/api/merchant.api'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

// Per-section loading states
const statsLoading = ref(true)
const storesLoading = ref(true)
const applicationsLoading = ref(true)

// Per-section error states
const statsError = ref(false)
const storesError = ref(false)
const applicationsError = ref(false)

// Data
const stats = ref<MerchantStats>({
  storeCount: 0,
  productCount: 0,
  pendingApplications: 0,
})
const stores = ref<Store[]>([])
const applications = ref<AreaApplication[]>([])

const quickActions = computed(() => [
  { title: t('dashboard.enterMall'), description: t('dashboard.enterMallDesc'), path: '/merchant/mall-preview' },
  { title: t('merchant.storeConfig'), description: t('merchant.storeConfigDesc'), path: '/merchant/store-config' },
  { title: t('nav.areaApply'), description: t('merchant.areaApplyDesc'), path: '/merchant/area-apply' },
  { title: t('merchant.storeDecoration'), description: t('merchant.storeDecorationDesc'), path: '/merchant/builder' },
  { title: t('merchant.dataAnalysis'), description: t('merchant.dataAnalysisDesc'), path: '/merchant/analytics' },
])

async function loadData() {
  statsLoading.value = true
  statsError.value = false
  storesLoading.value = true
  storesError.value = false
  applicationsLoading.value = true
  applicationsError.value = false

  const [statsResult, storesResult, appsResult] = await Promise.allSettled([
    merchantApi.getStats(),
    merchantApi.getMyStores(),
    merchantApi.getMyApplications(),
  ])

  if (statsResult.status === 'fulfilled') {
    stats.value = statsResult.value
  } else {
    statsError.value = true
    console.error('加载统计数据失败:', statsResult.reason)
  }
  statsLoading.value = false

  if (storesResult.status === 'fulfilled') {
    stores.value = storesResult.value
  } else {
    storesError.value = true
    console.error('加载店铺列表失败:', storesResult.reason)
  }
  storesLoading.value = false

  if (appsResult.status === 'fulfilled') {
    applications.value = appsResult.value.filter((a: AreaApplication) => a.status === 'PENDING').slice(0, 3)
  } else {
    applicationsError.value = true
    console.error('加载申请列表失败:', appsResult.reason)
  }
  applicationsLoading.value = false
}

async function retryStats() {
  statsLoading.value = true
  statsError.value = false
  try {
    stats.value = await merchantApi.getStats()
  } catch (e) {
    statsError.value = true
    console.error('加载统计数据失败:', e)
  } finally {
    statsLoading.value = false
  }
}

async function retryStores() {
  storesLoading.value = true
  storesError.value = false
  try {
    stores.value = await merchantApi.getMyStores()
  } catch (e) {
    storesError.value = true
    console.error('加载店铺列表失败:', e)
  } finally {
    storesLoading.value = false
  }
}

async function retryApplications() {
  applicationsLoading.value = true
  applicationsError.value = false
  try {
    const data = await merchantApi.getMyApplications()
    applications.value = data.filter((a: AreaApplication) => a.status === 'PENDING').slice(0, 3)
  } catch (e) {
    applicationsError.value = true
    console.error('加载申请列表失败:', e)
  } finally {
    applicationsLoading.value = false
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
    ACTIVE: t('merchant.statusActive'),
    INACTIVE: t('merchant.statusInactive'),
    PENDING: t('merchant.statusPending'),
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
        <h2>{{ t('merchant.welcomeBack', { name: userStore.currentUser?.username }) }}</h2>
        <p>{{ t('merchant.manageStats', { storeCount: stats.storeCount, productCount: stats.productCount }) }}</p>
      </hgroup>
      <nav class="welcome-actions">
        <ElButton type="primary" class="btn-gradient" @click="navigateTo('/merchant/builder')">
          {{ t('merchant.enterDecoration') }}
          <ElIcon class="ml-1"><ArrowRight /></ElIcon>
        </ElButton>
      </nav>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-section" :aria-label="t('dashboard.dataStats')">
      <ElSkeleton v-if="statsLoading" :rows="2" animated />
      <ElCard v-else-if="statsError" shadow="never">
        <ElEmpty :description="t('dashboard.loadStatsFailed')">
          <ElButton type="primary" @click="retryStats">{{ t('common.retry') }}</ElButton>
        </ElEmpty>
      </ElCard>
      <ElRow v-else :gutter="16">
        <ElCol :xs="12" :sm="12" :md="8">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('dashboard.statMyStores')" :value="stats.storeCount">
              <template #prefix><ElIcon :size="20"><Shop /></ElIcon></template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="8">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('dashboard.statProductCount')" :value="stats.productCount">
              <template #prefix><ElIcon :size="20"><Goods /></ElIcon></template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="8">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('merchant.pending')" :value="stats.pendingApplications">
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
              <h3>{{ t('merchant.myStores') }}</h3>
              <ElButton text type="primary" @click="navigateTo('/merchant/store-config')">
                {{ t('merchant.manageAll') }}
              </ElButton>
            </header>
          </template>

          <ElSkeleton v-if="storesLoading" :rows="3" animated />
          <ElEmpty v-else-if="storesError" :description="t('merchant.loadStoresFailed')">
            <ElButton type="primary" @click="retryStores">{{ t('common.retry') }}</ElButton>
          </ElEmpty>
          <ElEmpty v-else-if="stores.length === 0" :description="t('merchant.noStores')" />
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
              <h3>{{ t('merchant.pendingApps') }}</h3>
              <ElButton text type="primary" @click="navigateTo('/merchant/area-apply')">
                {{ t('merchant.viewAll') }}
              </ElButton>
            </header>
          </template>

          <ElSkeleton v-if="applicationsLoading" :rows="3" animated />
          <ElEmpty v-else-if="applicationsError" :description="t('merchant.loadAppsFailed')">
            <ElButton type="primary" @click="retryApplications">{{ t('common.retry') }}</ElButton>
          </ElEmpty>
          <ElEmpty v-else-if="applications.length === 0" :description="t('merchant.noPendingApps')" />
          <nav v-else class="application-list">
            <article v-for="app in applications" :key="app.id" class="application-item">
              <hgroup class="app-info">
                <h4 class="app-area">{{ app.floorName }} · {{ app.areaName }}</h4>
                <p class="app-reason">{{ app.reason }}</p>
              </hgroup>
              <ElTag type="warning" size="small">{{ t('merchant.pendingReview') }}</ElTag>
            </article>
          </nav>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 快捷操作 -->
    <section class="quick-actions" :aria-label="t('merchant.quickActions')">
      <h3 class="section-title">{{ t('merchant.quickActions') }}</h3>
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
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 扩展变量（基于全局变量的透明度变体）
$bg-item: rgba(var(--white-rgb), 0.03);
$border-item: rgba(var(--white-rgb), 0.04);

.merchant-dashboard {
  display: flex;
  flex-direction: column;
  gap: $space-6;

  .welcome-section {
    position: relative;
    border-radius: $radius-xl;
    padding: $space-8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(244, 114, 182, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%);
    border: 1px solid var(--border-subtle);

    .welcome-bg {
      position: absolute;
      width: 200px;
      height: 200px;
      top: -50px;
      right: 10%;
      background: $gradient-merchant;
      opacity: 0.15;
      border-radius: 50%;
      filter: blur(60px);
    }

    .welcome-content {
      position: relative;
      z-index: 1;

      h2 {
        font-size: $font-size-2xl + 4;
        font-weight: $font-weight-medium;
        margin: 0 0 $space-2 0;
        color: var(--text-primary);
      }

      p {
        font-size: $font-size-base;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .welcome-actions {
      position: relative;
      z-index: 1;

      .btn-gradient {
        background: $gradient-merchant;
        border: none;
        border-radius: $radius-md + 2;

        .ml-1 {
          margin-left: $space-1;
        }
      }
    }
  }

  .stats-section .stat-card {
    @include card-base;
    border-radius: $radius-lg;
    margin-bottom: $space-4;
  }

  .content-grid .section-card {
    @include card-base;
    border-radius: $radius-lg;
    margin-bottom: $space-5;

    .section-header {
      @include card-header;
      padding: 0;
      border-bottom: none;
    }

    .store-list,
    .application-list {
      display: flex;
      flex-direction: column;
      gap: $space-3;
    }

    .store-item,
    .application-item {
      display: flex;
      align-items: center;
      gap: $space-3 + 2;
      padding: $space-4;
      background: $bg-item;
      border: 1px solid $border-item;
      border-radius: $radius-md + 2;
      cursor: pointer;
      transition: background $duration-normal, border-color $duration-normal;

      &:hover {
        background: rgba(var(--text-primary-rgb), 0.04);
        border-color: rgba(244, 114, 182, 0.2);
      }
    }

    .store-avatar {
      background: $gradient-merchant;
      color: white;
      font-weight: $font-weight-semibold;
    }

    .store-info,
    .app-info {
      flex: 1;

      h4 {
        font-size: $font-size-base;
        font-weight: $font-weight-medium;
        margin: 0 0 $space-1 0;
        color: var(--text-primary);
      }

      p {
        font-size: $font-size-sm;
        color: var(--text-secondary);
        margin: 0;
      }
    }
  }

  .quick-actions .section-title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: var(--text-secondary);
    margin: 0 0 $space-4 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
</style>
