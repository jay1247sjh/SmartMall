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
 *
 * 管理员（ADMIN）看到：
 * - 统计：商城总数、店铺总数、待审批、在线用户
 * - 入口：进入商城、个人中心、商城管理、区域审批
 *
 * 商家（MERCHANT）看到：
 * - 统计：我的店铺、商品数量、今日访客、待处理
 * - 入口：进入商城、个人中心、店铺配置、建模工具
 *
 * 普通用户（USER）看到：
 * - 统计：收藏店铺、浏览记录、我的订单、优惠券
 * - 入口：进入商城、个人中心
 *
 * 【设计原则】
 * 1. Element Plus 优先 - ElRow、ElCol、ElCard、ElStatistic 等
 * 2. HTML5 语义化 - header、section、article、hgroup 等
 * 3. 响应式布局 - 使用 ElCol 的断点属性适配不同屏幕
 *
 * 【问候语逻辑】
 * 根据当前小时数显示不同问候：
 * - 0-5点：夜深了
 * - 6-11点：早上好
 * - 12-13点：中午好
 * - 14-17点：下午好
 * - 18-23点：晚上好
 * ============================================================================
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

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 根据当前时间生成问候语
 * 让用户感受到个性化的欢迎
 */
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
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
 * 不同角色看到不同的功能入口
 */
const quickActions = computed<QuickAction[]>(() => {
  // 所有用户都能看到的基础入口
  const actions: QuickAction[] = [
    { title: '进入商城', description: '浏览 3D 商城空间', path: '/mall/3d', icon: Shop },
    { title: '个人中心', description: '查看和编辑个人信息', path: '/user/profile', icon: User },
  ]

  // 管理员专属入口
  if (userStore.isAdmin) {
    actions.push(
      { title: '商城管理', description: '管理商城结构和配置', path: '/admin/mall', icon: Setting },
      { title: '区域审批', description: '处理商家区域申请', path: '/admin/area-approval', icon: Document }
    )
  }

  // 商家专属入口
  if (userStore.isMerchant) {
    actions.push(
      { title: '店铺配置', description: '管理店铺信息和商品', path: '/merchant/store-config', icon: Edit },
      { title: '建模工具', description: '编辑店铺 3D 布局', path: '/merchant/builder', icon: Tools }
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

/**
 * 根据用户角色生成统计数据
 * 展示与用户相关的关键指标
 *
 * 【注意】当前使用静态数据，实际项目中应从 API 获取
 */
const stats = computed<StatItem[]>(() => {
  // 管理员看到系统运营数据
  if (userStore.isAdmin) {
    return [
      { label: '商城总数', value: 3, icon: Shop },
      { label: '店铺总数', value: 128, icon: Shop },
      { label: '待审批', value: 5, icon: Document },
      { label: '在线用户', value: 42, icon: User },
    ]
  }
  
  // 商家看到自己的经营数据
  if (userStore.isMerchant) {
    return [
      { label: '我的店铺', value: 2, icon: Shop },
      { label: '商品数量', value: 56, icon: Shop },
      { label: '今日访客', value: 128, icon: View },
      { label: '待处理', value: 3, icon: Document },
    ]
  }
  
  // 普通用户看到个人相关数据
  return [
    { label: '收藏店铺', value: 8, icon: Star },
    { label: '浏览记录', value: 24, icon: View },
    { label: '我的订单', value: 3, icon: ShoppingCart },
    { label: '优惠券', value: 5, icon: Ticket },
  ]
})

// ============================================================================
// 事件处理
// ============================================================================

/**
 * 导航到指定路径
 * @param path - 目标路由路径
 */
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
