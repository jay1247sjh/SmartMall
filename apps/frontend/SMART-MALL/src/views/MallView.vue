<script setup lang="ts">
/**
 * ============================================================================
 * 商城主页/仪表盘 (MallView)
 * ============================================================================
 *
 * 【业务职责】
 * 用户登录后的首页，展示个性化的仪表盘内容。
 * 根据用户角色（管理员/商家/普通用户）显示不同的统计数据和快捷入口。
 *
 * 【页面结构】
 * 1. 欢迎区域 - 根据时间显示问候语，展示用户名
 * 2. 统计卡片 - 展示与用户角色相关的关键指标
 * 3. 快捷入口 - 提供常用功能的快速访问
 *
 * 【角色差异化展示】
 * 管理员（ADMIN）：调用真实 API 获取统计数据
 * 商家（MERCHANT）：调用真实 API 获取统计数据
 * 普通用户（USER）：调用真实 API 获取统计数据
 * ============================================================================
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DashboardLayout } from '@/components'
import { useUserStore } from '@/stores'
import { adminApi, merchantApi, userApi } from '@/api'
import {
  ElRow,
  ElCol,
  ElCard,
  ElStatistic,
  ElIcon,
  ElSkeleton,
  ElEmpty,
  ElButton,
} from 'element-plus'
import {
  Shop,
  User,
  Setting,
  Document,
  Edit,
  Tools,
  Star,
  View,
  ShoppingCart,
  Ticket,
  ArrowRight,
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 根据当前时间生成问候语
 */
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return t('dashboard.greetingNight')
  if (hour < 12) return t('dashboard.greetingMorning')
  if (hour < 14) return t('dashboard.greetingNoon')
  if (hour < 18) return t('dashboard.greetingAfternoon')
  return t('dashboard.greetingEvening')
})

/**
 * 快捷入口类型定义
 */
interface QuickAction {
  title: string
  description: string
  path: string
  icon: typeof Shop
}

/**
 * 根据用户角色生成快捷入口列表
 */
const quickActions = computed<QuickAction[]>(() => {
  const actions: QuickAction[] = [
    { title: t('dashboard.enterMall'), description: t('dashboard.enterMallDesc'), path: '/mall/3d', icon: Shop },
    { title: t('dashboard.profileCenter'), description: t('dashboard.profileCenterDesc'), path: '/user/profile', icon: User },
  ]

  if (userStore.isAdmin) {
    actions.push(
      { title: t('dashboard.mallManage'), description: t('dashboard.mallManageDesc'), path: '/admin/mall', icon: Setting },
      { title: t('dashboard.areaApproval'), description: t('dashboard.areaApprovalDesc'), path: '/admin/area-approval', icon: Document }
    )
  }

  if (userStore.isMerchant) {
    actions.push(
      { title: t('dashboard.storeConfig'), description: t('dashboard.storeConfigDesc'), path: '/merchant/store-config', icon: Edit },
      { title: t('dashboard.builderTool'), description: t('dashboard.builderToolDesc'), path: '/merchant/builder', icon: Tools }
    )
  }

  return actions
})

/**
 * 统计项类型定义
 */
interface StatItem {
  label: string
  value: number
  icon: typeof Shop
}

// ============================================================================
// 响应式数据 + API 调用
// ============================================================================

const statsLoading = ref(false)
const statsError = ref(false)
const stats = ref<StatItem[]>([])

async function loadStats() {
  statsLoading.value = true
  statsError.value = false
  try {
    if (userStore.isAdmin) {
      const data = await adminApi.getStats()
      stats.value = [
        { label: t('dashboard.statMallCount'), value: data.merchantCount, icon: Shop },
        { label: t('dashboard.statStoreCount'), value: data.storeCount, icon: Shop },
        { label: t('dashboard.statPending'), value: data.pendingApprovals, icon: Document },
        { label: t('dashboard.statTodayActive'), value: data.todayActiveUsers, icon: User },
      ]
    } else if (userStore.isMerchant) {
      const data = await merchantApi.getStats()
      stats.value = [
        { label: t('dashboard.statMyStores'), value: data.storeCount, icon: Shop },
        { label: t('dashboard.statProductCount'), value: data.productCount, icon: Shop },
        { label: t('dashboard.statPendingApps'), value: data.pendingApplications, icon: Document },
      ]
    } else if (userStore.isUser) {
      const data = await userApi.getDashboardStats()
      stats.value = [
        { label: t('dashboard.statFavorites'), value: data.favoriteStoreCount, icon: Star },
        { label: t('dashboard.statHistory'), value: data.browseHistoryCount, icon: View },
        { label: t('dashboard.statOrders'), value: data.orderCount, icon: ShoppingCart },
        { label: t('dashboard.statCoupons'), value: data.availableCouponCount, icon: Ticket },
      ]
    } else {
      stats.value = []
    }
  } catch (e) {
    statsError.value = true
    console.error('Failed to load stats:', e)
  } finally {
    statsLoading.value = false
  }
}

// ============================================================================
// 事件处理
// ============================================================================

function navigateTo(path: string) {
  router.push(path)
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <DashboardLayout :page-title="t('dashboard.home')">
    <!-- 欢迎区域 -->
    <header class="welcome-section">
      <hgroup>
        <h2 class="welcome-title">{{ greeting }}，{{ userStore.currentUser?.username }}</h2>
        <p class="welcome-subtitle">{{ t('dashboard.welcomeSubtitle') }}</p>
      </hgroup>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-section" aria-label="数据统计">
      <ElSkeleton v-if="statsLoading" :rows="2" animated />
      <ElCard v-else-if="statsError" shadow="never" class="error-card">
        <ElEmpty :description="t('dashboard.loadStatsFailed')">
          <ElButton type="primary" @click="loadStats">{{ t('common.retry') }}</ElButton>
        </ElEmpty>
      </ElCard>
      <ElRow v-else :gutter="16">
        <ElCol v-for="stat in stats" :key="stat.label" :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="stat.label" :value="stat.value">
              <template #prefix>
                <ElIcon :size="20" class="stat-icon">
                  <component :is="stat.icon" />
                </ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
      </ElRow>
    </section>

    <!-- 快捷入口 -->
    <section class="quick-actions-section" aria-label="快捷入口">
      <h3 class="section-title">{{ t('dashboard.quickActions') }}</h3>
      <ElRow :gutter="16">
        <ElCol v-for="action in quickActions" :key="action.path" :xs="24" :sm="12" :md="12" :lg="6">
          <ElCard shadow="hover" class="action-card" @click="navigateTo(action.path)">
            <article class="action-content">
              <ElIcon :size="32" class="action-icon">
                <component :is="action.icon" />
              </ElIcon>
              <hgroup class="action-text">
                <h4 class="action-title">{{ action.title }}</h4>
                <p class="action-desc">{{ action.description }}</p>
              </hgroup>
              <ElIcon class="action-arrow">
                <ArrowRight />
              </ElIcon>
            </article>
          </ElCard>
        </ElCol>
      </ElRow>
    </section>
  </DashboardLayout>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.welcome-section {
  padding: $space-8;
  margin-bottom: $space-6;
  border-radius: $radius-lg;
  background: linear-gradient(135deg,
    rgba(var(--accent-primary-rgb), 0.1) 0%,
    rgba(var(--bg-secondary-rgb), 0.8) 100%
  );
  border: 1px solid var(--border-subtle);

  .welcome-title {
    font-size: 28px;
    font-weight: $font-weight-medium;
    margin: 0 0 $space-2 0;
    color: var(--text-primary);
  }

  .welcome-subtitle {
    font-size: $font-size-lg;
    color: var(--text-secondary);
    margin: 0;
  }

  @media (max-width: 768px) {
    padding: $space-6;

    .welcome-title {
      font-size: 22px;
    }
  }
}

.stats-section {
  margin-bottom: $space-8;

  .stat-card {
    border-radius: $radius-lg;
    margin-bottom: $space-4;
    background: rgba(var(--bg-secondary-rgb), 0.8);
    border: 1px solid var(--border-subtle);

    .stat-icon {
      color: var(--accent-primary);
      margin-right: $space-2;
    }
  }

  .error-card {
    border-radius: $radius-lg;
    background: rgba(var(--bg-secondary-rgb), 0.8);
    border: 1px solid var(--border-subtle);
  }
}

.quick-actions-section {
  .section-title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    margin: 0 0 $space-4 0;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .action-card {
    cursor: pointer;
    border-radius: $radius-lg;
    margin-bottom: $space-4;
    background: rgba(var(--bg-secondary-rgb), 0.8);
    border: 1px solid var(--border-subtle);
    transition: transform 0.2s, border-color 0.2s;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(var(--accent-primary-rgb), 0.3);
    }

    .action-content {
      display: flex;
      align-items: center;
      gap: $space-4;

      .action-icon {
        color: var(--accent-primary);
        flex-shrink: 0;
      }

      .action-text {
        flex: 1;
        min-width: 0;

        .action-title {
          font-size: 16px;
          font-weight: $font-weight-medium;
          margin: 0 0 $space-1 0;
          color: var(--text-primary);
        }

        .action-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }
      }

      .action-arrow {
        color: var(--text-disabled);
        flex-shrink: 0;
      }
    }
  }
}
</style>
