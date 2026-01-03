<script setup lang="ts">
/**
 * 商城主页/仪表盘
 * 登录后的落地页，展示用户信息、快捷入口、系统概览
 * Gemini 风格 - 专业深色主题
 */
import { computed } from 'vue'
import { DashboardLayout, StatCard, QuickActionCard } from '@/components'
import { useUserStore } from '@/stores'

const userStore = useUserStore()

// ============================================================================
// Computed
// ============================================================================

/** 当前时间问候语 */
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

/** 快捷入口配置 */
const quickActions = computed(() => {
  const actions = [
    {
      title: '进入商城',
      description: '浏览 3D 商城空间',
      path: '/mall/3d',
    },
    {
      title: '个人中心',
      description: '查看和编辑个人信息',
      path: '/user/profile',
    },
  ]

  // 管理员专属
  if (userStore.isAdmin) {
    actions.push(
      {
        title: '商城管理',
        description: '管理商城结构和配置',
        path: '/admin/mall',
      },
      {
        title: '区域审批',
        description: '处理商家区域申请',
        path: '/admin/area-approval',
      }
    )
  }

  // 商家专属
  if (userStore.isMerchant) {
    actions.push(
      {
        title: '店铺配置',
        description: '管理店铺信息和商品',
        path: '/merchant/store-config',
      },
      {
        title: '建模工具',
        description: '编辑店铺 3D 布局',
        path: '/merchant/builder',
      }
    )
  }

  return actions
})

/** 系统统计数据（模拟） */
const stats = computed(() => {
  if (userStore.isAdmin) {
    return [
      { label: '商城总数', value: '3' },
      { label: '店铺总数', value: '128' },
      { label: '待审批', value: '5' },
      { label: '在线用户', value: '42' },
    ]
  }
  if (userStore.isMerchant) {
    return [
      { label: '我的店铺', value: '2' },
      { label: '商品数量', value: '56' },
      { label: '今日访客', value: '128' },
      { label: '待处理', value: '3' },
    ]
  }
  return [
    { label: '收藏店铺', value: '8' },
    { label: '浏览记录', value: '24' },
    { label: '我的订单', value: '3' },
    { label: '优惠券', value: '5' },
  ]
})
</script>

<template>
  <DashboardLayout page-title="首页">
    <!-- 欢迎区域 -->
    <section class="welcome-section">
      <div class="welcome-bg">
        <div class="bg-gradient"></div>
        <div class="bg-grid"></div>
        <div class="bg-glow bg-glow-1"></div>
        <div class="bg-glow bg-glow-2"></div>
      </div>
      <div class="welcome-content">
        <h2 class="welcome-title">{{ greeting }}，{{ userStore.currentUser?.username }}</h2>
        <p class="welcome-subtitle">欢迎回到 Smart Mall 智能商城管理平台</p>
      </div>
    </section>

    <!-- 统计卡片 -->
    <section class="stats-section">
      <StatCard
        v-for="stat in stats"
        :key="stat.label"
        :value="stat.value"
        :label="stat.label"
      />
    </section>

    <!-- 快捷入口 -->
    <section class="quick-actions-section">
      <h3 class="section-title">快捷入口</h3>
      <div class="quick-actions-grid">
        <QuickActionCard
          v-for="action in quickActions"
          :key="action.path"
          :title="action.title"
          :description="action.description"
          :path="action.path"
        />
      </div>
    </section>
  </DashboardLayout>
</template>

<style scoped>
/* Welcome Section */
.welcome-section {
  position: relative;
  padding: 40px;
  border-radius: 16px;
  margin-bottom: 32px;
  overflow: hidden;
}

.welcome-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.06) 0%, transparent 50%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.bg-glow-1 {
  width: 200px;
  height: 200px;
  top: -50px;
  right: 10%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  opacity: 0.3;
}

.bg-glow-2 {
  width: 150px;
  height: 150px;
  bottom: -30px;
  left: 20%;
  background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
  opacity: 0.2;
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 28px;
  font-weight: 500;
  margin: 0 0 12px 0;
  color: #e8eaed;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 15px;
  color: #9aa0a6;
  margin: 0;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

/* Quick Actions */
.section-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: #9aa0a6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .welcome-section {
    padding: 24px;
  }

  .welcome-title {
    font-size: 22px;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>
