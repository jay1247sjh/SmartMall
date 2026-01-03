<script setup lang="ts">
/**
 * 管理员控制台
 * 展示系统统计、待审批列表、快捷入口
 * Gemini 风格 - 专业深色主题
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { StatCard, QuickActionCard, DataTable } from '@/components'
import { adminApi } from '@/api'
import type { AdminStats, ApprovalRequest } from '@/api/admin.api'

const router = useRouter()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stats = ref<AdminStats | null>(null)
const recentApprovals = ref<ApprovalRequest[]>([])

// ============================================================================
// Data
// ============================================================================

const quickActions = [
  {
    title: '商城管理',
    description: '管理楼层和区域结构',
    path: '/admin/mall',
  },
  {
    title: '区域审批',
    description: '处理商家区域申请',
    path: '/admin/area-approval',
  },
  {
    title: '版本管理',
    description: '管理布局版本发布',
    path: '/admin/layout-version',
  },
  {
    title: '用户管理',
    description: '管理系统用户',
    path: '/admin/users',
  },
]

const approvalColumns = [
  { key: 'merchantName', title: '商家', width: '25%' },
  { key: 'areaName', title: '区域', width: '20%' },
  { key: 'reason', title: '申请理由', width: '35%' },
  { key: 'createdAt', title: '申请时间', width: '20%' },
]

// ============================================================================
// Methods
// ============================================================================

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

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="admin-dashboard">
      <!-- 统计卡片 -->
      <section class="stats-section">
        <StatCard
          :value="stats?.merchantCount ?? '-'"
          label="商家总数"
        />
        <StatCard
          :value="stats?.storeCount ?? '-'"
          label="店铺总数"
        />
        <StatCard
          :value="stats?.pendingApprovals ?? '-'"
          label="待审批"
        />
        <StatCard
          :value="stats?.onlineUsers ?? '-'"
          label="在线用户"
        />
      </section>

      <!-- 快捷入口 -->
      <section class="quick-section">
        <h3 class="section-title">快捷入口</h3>
        <div class="quick-grid">
          <QuickActionCard
            v-for="action in quickActions"
            :key="action.path"
            :title="action.title"
            :description="action.description"
            :path="action.path"
          />
        </div>
      </section>

      <!-- 待审批列表 -->
      <section class="approvals-section">
        <div class="section-header">
          <h3 class="section-title">待审批申请</h3>
          <button class="view-all-btn" @click="viewAllApprovals">
            查看全部
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <DataTable
          :columns="approvalColumns"
          :data="recentApprovals"
          :loading="isLoading"
          empty-text="暂无待审批申请"
          @row-click="handleApprovalClick"
        >
          <template #createdAt="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #reason="{ value }">
            <span class="reason-text">{{ value }}</span>
          </template>
        </DataTable>
      </section>

      <!-- 系统公告 -->
      <section class="notice-section">
        <h3 class="section-title">系统公告</h3>
        <div class="notice-card">
          <div class="notice-item">
            <div class="notice-content">
              <p class="notice-title">系统维护通知</p>
              <p class="notice-desc">系统将于 2024-12-30 02:00-04:00 进行维护升级</p>
            </div>
            <span class="notice-time">12-28</span>
          </div>
          <div class="notice-item">
            <div class="notice-content">
              <p class="notice-title">新功能上线</p>
              <p class="notice-desc">3D 商城浏览功能已上线，欢迎体验</p>
            </div>
            <span class="notice-time">12-25</span>
          </div>
        </div>
      </section>
    </div>
</template>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

/* Quick Section */
.quick-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #9aa0a6;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* Approvals Section */
.approvals-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #8ab4f8;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

.view-all-btn:hover {
  background: rgba(138, 180, 248, 0.1);
}

.view-all-btn svg {
  width: 16px;
  height: 16px;
}

.reason-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Notice Section */
.notice-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-content {
  flex: 1;
  min-width: 0;
}

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

.notice-time {
  font-size: 12px;
  color: #5f6368;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .quick-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-section {
    grid-template-columns: 1fr;
  }
}
</style>
