<script setup lang="ts">
/**
 * 管理员控制台视图
 *
 * 这是管理员登录后看到的首页，提供系统概览和快捷入口。
 *
 * 业务职责：
 * - 展示系统关键指标（商家数、店铺数、待审批数、在线用户）
 * - 提供快捷入口到各管理功能
 * - 显示待处理的审批申请列表
 * - 展示系统公告和通知
 *
 * 设计原则：
 * - 使用 Element Plus 组件构建一致的 UI
 * - 使用 HTML5 语义化标签（article、section、header、nav）
 * - 响应式布局，适配不同屏幕尺寸
 * - 骨架屏加载，提升用户体验
 *
 * 数据流：
 * - 页面加载时并行请求统计数据和审批列表
 * - 点击审批项跳转到审批详情页
 * - 点击快捷入口跳转到对应管理页面
 *
 * 用户角色：
 * - 仅管理员（ADMIN）可访问
 * - 路由守卫会验证用户角色
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
  ElTable,
  ElTableColumn,
  ElEmpty,
  ElTag,
  ElSkeleton,
} from 'element-plus'
import { ArrowRight, Shop, User, Document, Clock } from '@element-plus/icons-vue'
import { StatCard, QuickActionCard } from '@/components'
import { adminApi } from '@/api'
import type { AdminStats, ApprovalRequest } from '@/api/admin.api'

const router = useRouter()

const isLoading = ref(true)
const stats = ref<AdminStats | null>(null)
const recentApprovals = ref<ApprovalRequest[]>([])

const quickActions = [
  { title: '商城管理', description: '管理楼层和区域结构', path: '/admin/mall' },
  { title: '区域审批', description: '处理商家区域申请', path: '/admin/area-approval' },
  { title: '版本管理', description: '管理布局版本发布', path: '/admin/layout-version' },
  { title: '用户管理', description: '管理系统用户', path: '/admin/users' },
]

async function loadData() {
  isLoading.value = true
  try {
    const [statsData, approvalsData] = await Promise.all([
      adminApi.getStats(),
      adminApi.getApprovalList({ status: 'PENDING' }),
    ])
    stats.value = statsData
    recentApprovals.value = approvalsData.slice(0, 5)
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function handleApprovalClick(row: ApprovalRequest) {
  router.push(`/admin/area-approval?id=${row.id}`)
}

function viewAllApprovals() {
  router.push('/admin/area-approval')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <article class="admin-dashboard">
    <!-- 统计卡片 -->
    <section class="stats-section" aria-label="数据统计">
      <ElRow :gutter="16">
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="商家总数" :value="stats?.merchantCount ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-primary)"><Shop /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="店铺总数" :value="stats?.storeCount ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-success)"><Shop /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="待审批" :value="stats?.pendingApprovals ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-warning)"><Document /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic title="在线用户" :value="stats?.onlineUsers ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-info)"><User /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
      </ElRow>
    </section>

    <!-- 快捷入口 -->
    <section class="quick-section" aria-label="快捷入口">
      <h3 class="section-title">快捷入口</h3>
      <ElRow :gutter="16">
        <ElCol v-for="action in quickActions" :key="action.path" :xs="24" :sm="12" :md="6">
          <QuickActionCard
            :title="action.title"
            :description="action.description"
            :path="action.path"
          />
        </ElCol>
      </ElRow>
    </section>

    <!-- 待审批列表 -->
    <section class="approvals-section" aria-label="待审批申请">
      <header class="section-header">
        <h3 class="section-title">待审批申请</h3>
        <ElButton text type="primary" @click="viewAllApprovals">
          查看全部
          <ElIcon class="ml-1"><ArrowRight /></ElIcon>
        </ElButton>
      </header>

      <ElSkeleton v-if="isLoading" :rows="5" animated />

      <ElTable
        v-else
        :data="recentApprovals"
        stripe
        highlight-current-row
        class="approval-table"
        @row-click="handleApprovalClick"
      >
        <ElTableColumn prop="merchantName" label="商家" width="150" />
        <ElTableColumn prop="areaName" label="区域" width="120" />
        <ElTableColumn prop="reason" label="申请理由" show-overflow-tooltip />
        <ElTableColumn prop="createdAt" label="申请时间" width="150">
          <template #default="{ row }">
            <ElIcon class="mr-1"><Clock /></ElIcon>
            {{ formatDate(row.createdAt) }}
          </template>
        </ElTableColumn>

        <template #empty>
          <ElEmpty description="暂无待审批申请" />
        </template>
      </ElTable>
    </section>

    <!-- 系统公告 -->
    <section class="notice-section" aria-label="系统公告">
      <h3 class="section-title">系统公告</h3>
      <ElCard shadow="never" class="notice-card">
        <article class="notice-item">
          <hgroup class="notice-content">
            <h4 class="notice-title">系统维护通知</h4>
            <p class="notice-desc">系统将于 2024-12-30 02:00-04:00 进行维护升级</p>
          </hgroup>
          <ElTag type="info" size="small">12-28</ElTag>
        </article>
        <article class="notice-item">
          <hgroup class="notice-content">
            <h4 class="notice-title">新功能上线</h4>
            <p class="notice-desc">3D 商城浏览功能已上线，欢迎体验</p>
          </hgroup>
          <ElTag type="info" size="small">12-25</ElTag>
        </article>
      </ElCard>
    </section>
  </article>
</template>

<style scoped lang="scss">
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;

  .stats-section {
    .stat-card {
      border-radius: 12px;
      margin-bottom: 16px;
      background: rgba(17, 17, 19, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
  }

  .quick-section {
    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: #9aa0a6;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  .approvals-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .section-title {
        font-size: 14px;
        font-weight: 500;
        color: #9aa0a6;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .ml-1 {
        margin-left: 4px;
      }
    }

    .approval-table {
      border-radius: 12px;
      overflow: hidden;
      background: rgba(17, 17, 19, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.06);

      :deep(.el-table__row) {
        cursor: pointer;
      }

      .mr-1 {
        margin-right: 4px;
      }
    }
  }

  .notice-section {
    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: #9aa0a6;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .notice-card {
      border-radius: 12px;
      background: rgba(17, 17, 19, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.06);

      .notice-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);

        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        &:first-child {
          padding-top: 0;
        }

        .notice-content {
          flex: 1;
          min-width: 0;

          .notice-title {
            font-size: 14px;
            font-weight: 500;
            color: #e8eaed;
            margin: 0 0 6px 0;
          }

          .notice-desc {
            font-size: 13px;
            color: #9aa0a6;
            margin: 0;
          }
        }
      }
    }
  }
}
</style>
