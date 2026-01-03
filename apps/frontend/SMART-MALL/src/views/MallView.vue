<script setup lang="ts">
/**
 * 商城主页/仪表盘
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { DashboardLayout } from '@/components'
import { useUserStore } from '@/stores'
import {
  ElRow,
  ElCol,
  ElCard,
  ElStatistic,
  ElButton,
  ElIcon,
  ElSpace,
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

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

interface QuickAction {
  title: string
  description: string
  path: string
  icon: typeof Shop
}

const quickActions = computed<QuickAction[]>(() => {
  const actions: QuickAction[] = [
    { title: '进入商城', description: '浏览 3D 商城空间', path: '/mall/3d', icon: Shop },
    { title: '个人中心', description: '查看和编辑个人信息', path: '/user/profile', icon: User },
  ]

  if (userStore.isAdmin) {
    actions.push(
      { title: '商城管理', description: '管理商城结构和配置', path: '/admin/mall', icon: Setting },
      { title: '区域审批', description: '处理商家区域申请', path: '/admin/area-approval', icon: Document }
    )
  }

  if (userStore.isMerchant) {
    actions.push(
      { title: '店铺配置', description: '管理店铺信息和商品', path: '/merchant/store-config', icon: Edit },
      { title: '建模工具', description: '编辑店铺 3D 布局', path: '/merchant/builder', icon: Tools }
    )
  }

  return actions
})

interface StatItem {
  label: string
  value: number
  icon: typeof Shop
}

const stats = computed<StatItem[]>(() => {
  if (userStore.isAdmin) {
    return [
      { label: '商城总数', value: 3, icon: Shop },
      { label: '店铺总数', value: 128, icon: Shop },
      { label: '待审批', value: 5, icon: Document },
      { label: '在线用户', value: 42, icon: User },
    ]
  }
  if (userStore.isMerchant) {
    return [
      { label: '我的店铺', value: 2, icon: Shop },
      { label: '商品数量', value: 56, icon: Shop },
      { label: '今日访客', value: 128, icon: View },
      { label: '待处理', value: 3, icon: Document },
    ]
  }
  return [
    { label: '收藏店铺', value: 8, icon: Star },
    { label: '浏览记录', value: 24, icon: View },
    { label: '我的订单', value: 3, icon: ShoppingCart },
    { label: '优惠券', value: 5, icon: Ticket },
  ]
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <DashboardLayout page-title="首页">
    <!-- 欢迎区域 -->
    <header class="welcome-section">
      <hgroup>
        <h2 class="welcome-title">{{ greeting }}，{{ userStore.currentUser?.username }}</h2>
        <p class="welcome-subtitle">欢迎回到 Smart Mall 智能商城管理平台</p>
      </hgroup>
    </header>

    <!-- 统计卡片 -->
    <section class="stats-section" aria-label="数据统计">
      <ElRow :gutter="16">
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
      <h3 class="section-title">快捷入口</h3>
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
.welcome-section {
  padding: 32px;
  margin-bottom: 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, 
    var(--el-color-primary-light-9) 0%, 
    var(--el-bg-color) 100%
  );
  border: 1px solid var(--el-border-color-lighter);

  .welcome-title {
    font-size: 28px;
    font-weight: 500;
    margin: 0 0 8px 0;
    color: var(--el-text-color-primary);
  }

  .welcome-subtitle {
    font-size: 15px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }

  @media (max-width: 768px) {
    padding: 24px;

    .welcome-title {
      font-size: 22px;
    }
  }
}

.stats-section {
  margin-bottom: 32px;

  .stat-card {
    border-radius: 12px;
    margin-bottom: 16px;

    .stat-icon {
      color: var(--el-color-primary);
      margin-right: 8px;
    }
  }
}

.quick-actions-section {
  .section-title {
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 16px 0;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .action-card {
    cursor: pointer;
    border-radius: 12px;
    margin-bottom: 16px;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    .action-content {
      display: flex;
      align-items: center;
      gap: 16px;

      .action-icon {
        color: var(--el-color-primary);
        flex-shrink: 0;
      }

      .action-text {
        flex: 1;
        min-width: 0;

        .action-title {
          font-size: 16px;
          font-weight: 500;
          margin: 0 0 4px 0;
          color: var(--el-text-color-primary);
        }

        .action-desc {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          margin: 0;
        }
      }

      .action-arrow {
        color: var(--el-text-color-placeholder);
        flex-shrink: 0;
      }
    }
  }
}
</style>
