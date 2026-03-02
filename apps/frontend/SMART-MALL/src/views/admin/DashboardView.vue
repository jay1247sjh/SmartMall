<script setup lang="ts">
/**
 * 管理员控制台视图
 *
 * 这是管理员登录后看到的首页，提供系统概览和快捷入口。
 *
 * 业务职责：
 * - 展示系统关键指标（商家数、店铺数、待审批数、今日活跃用户）
 * - 提供快捷入口到各管理功能
 * - 显示待处理的审批申请列表
 * - 展示系统公告和通知
 *
 * 数据流：
 * - 页面加载时使用 Promise.allSettled 并行请求统计、审批、公告
 * - 各区域独立错误处理和重试
 * - 点击审批项跳转到审批详情页
 * - 点击快捷入口跳转到对应管理页面
 *
 * 用户角色：
 * - 仅管理员（ADMIN）可访问
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
  ElSkeleton,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowRight, Shop, User, Document, Clock } from '@element-plus/icons-vue'
import { QuickActionCard } from '@/components'
import { adminApi, storeApi } from '@/api'
import type { AdminStats, ApprovalRequest, NoticeItem, PublishNoticeRequest } from '@/api/admin.api'
import { useFormatters } from '@/composables'

const router = useRouter()
const { t } = useI18n()
const { formatDateTime } = useFormatters()

// Per-section loading states
const statsLoading = ref(true)
const approvalsLoading = ref(true)
const noticesLoading = ref(true)

// Per-section error states
const statsError = ref(false)
const approvalsError = ref(false)
const noticesError = ref(false)

// Data
const stats = ref<AdminStats | null>(null)
const pendingStoreCount = ref(0)
const recentApprovals = ref<ApprovalRequest[]>([])
const notices = ref<NoticeItem[]>([])
const publishDialogVisible = ref(false)
const publishSubmitting = ref(false)
const publishFormRef = ref<FormInstance>()
const publishForm = reactive<PublishNoticeRequest>({
  title: '',
  content: '',
})

const publishRules = reactive<FormRules<PublishNoticeRequest>>({
  title: [
    { required: true, message: t('dashboard.noticeTitleRequired'), trigger: 'blur' },
    { max: 200, message: t('dashboard.noticeTitleMax'), trigger: 'blur' },
  ],
  content: [
    { required: true, message: t('dashboard.noticeContentRequired'), trigger: 'blur' },
    { max: 5000, message: t('dashboard.noticeContentMax'), trigger: 'blur' },
  ],
})

const quickActions = computed(() => [
  { title: t('dashboard.mallManage'), description: t('dashboard.mallManageDescAdmin'), path: '/admin/mall' },
  { title: t('dashboard.storeManage'), description: t('dashboard.storeManageDesc'), path: '/admin/store-manage?status=PENDING' },
  { title: t('dashboard.areaApproval'), description: t('dashboard.areaApprovalDesc'), path: '/admin/area-approval' },
  { title: t('dashboard.versionManage'), description: t('dashboard.versionManageDesc'), path: '/admin/layout-version' },
  { title: t('dashboard.userManage'), description: t('dashboard.userManageDesc'), path: '/admin/users' },
])

async function loadData() {
  statsLoading.value = true
  statsError.value = false
  approvalsLoading.value = true
  approvalsError.value = false
  noticesLoading.value = true
  noticesError.value = false

  const [statsResult, pendingStoresResult, approvalsResult, noticesResult] = await Promise.allSettled([
    adminApi.getStats(),
    storeApi.getAllStores({ status: 'PENDING' }, 1, 1),
    adminApi.getApprovalList({ status: 'PENDING' }),
    adminApi.getNotices(),
  ])

  if (statsResult.status === 'fulfilled') {
    stats.value = statsResult.value
  } else {
    statsError.value = true
    console.error('加载统计数据失败:', statsResult.reason)
  }
  statsLoading.value = false

  if (pendingStoresResult.status === 'fulfilled') {
    pendingStoreCount.value = pendingStoresResult.value.total
  } else {
    pendingStoreCount.value = 0
    console.error('加载店铺待审核数量失败:', pendingStoresResult.reason)
  }

  if (approvalsResult.status === 'fulfilled') {
    recentApprovals.value = approvalsResult.value.slice(0, 5)
  } else {
    approvalsError.value = true
    console.error('加载审批列表失败:', approvalsResult.reason)
  }
  approvalsLoading.value = false

  if (noticesResult.status === 'fulfilled') {
    notices.value = noticesResult.value
  } else {
    noticesError.value = true
    console.error('加载公告失败:', noticesResult.reason)
  }
  noticesLoading.value = false
}

async function retryStats() {
  statsLoading.value = true
  statsError.value = false
  try {
    const [nextStats, pendingStores] = await Promise.all([
      adminApi.getStats(),
      storeApi.getAllStores({ status: 'PENDING' }, 1, 1),
    ])
    stats.value = nextStats
    pendingStoreCount.value = pendingStores.total
  } catch (e) {
    statsError.value = true
    pendingStoreCount.value = 0
    console.error('加载统计数据失败:', e)
  } finally {
    statsLoading.value = false
  }
}

async function retryApprovals() {
  approvalsLoading.value = true
  approvalsError.value = false
  try {
    const data = await adminApi.getApprovalList({ status: 'PENDING' })
    recentApprovals.value = data.slice(0, 5)
  } catch (e) {
    approvalsError.value = true
    console.error('加载审批列表失败:', e)
  } finally {
    approvalsLoading.value = false
  }
}

async function retryNotices() {
  noticesLoading.value = true
  noticesError.value = false
  try {
    notices.value = await adminApi.getNotices()
  } catch (e) {
    noticesError.value = true
    console.error('加载公告失败:', e)
  } finally {
    noticesLoading.value = false
  }
}

function openPublishDialog() {
  publishDialogVisible.value = true
}

function resetPublishForm() {
  publishForm.title = ''
  publishForm.content = ''
  publishFormRef.value?.clearValidate()
}

async function submitPublishNotice() {
  if (!publishFormRef.value) {
    return
  }

  try {
    await publishFormRef.value.validate()
    publishSubmitting.value = true

    await adminApi.publishNotice({
      title: publishForm.title.trim(),
      content: publishForm.content.trim(),
    })

    ElMessage.success(t('dashboard.publishNoticeSuccess'))
    publishDialogVisible.value = false
    resetPublishForm()
    await retryNotices()
  } catch (e) {
    if (e instanceof Error && e.message) {
      ElMessage.error(`${t('dashboard.publishNoticeFailed')}: ${e.message}`)
    }
  } finally {
    publishSubmitting.value = false
  }
}

function formatNoticeDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}-${date.getDate()}`
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
    <section class="stats-section" :aria-label="t('dashboard.dataStats')">
      <ElSkeleton v-if="statsLoading" :rows="2" animated />
      <ElCard v-else-if="statsError" shadow="never">
        <ElEmpty :description="t('dashboard.loadStatsFailed')">
          <ElButton type="primary" @click="retryStats">{{ t('common.retry') }}</ElButton>
        </ElEmpty>
      </ElCard>
      <ElRow v-else :gutter="16">
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('dashboard.statMerchantCount')" :value="stats?.merchantCount ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-primary)"><Shop /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('dashboard.statStoreCount')" :value="stats?.storeCount ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-success)"><Shop /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('dashboard.statPendingArea')" :value="stats?.pendingApprovals ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-warning)"><Document /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('dashboard.statPendingStore')" :value="pendingStoreCount">
              <template #prefix>
                <ElIcon :size="20" color="var(--accent-primary)"><Shop /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
        <ElCol :xs="12" :sm="12" :md="6">
          <ElCard shadow="hover" class="stat-card">
            <ElStatistic :title="t('dashboard.statTodayActive')" :value="stats?.todayActiveUsers ?? 0">
              <template #prefix>
                <ElIcon :size="20" color="var(--el-color-info)"><User /></ElIcon>
              </template>
            </ElStatistic>
          </ElCard>
        </ElCol>
      </ElRow>
    </section>

    <!-- 快捷入口 -->
    <section class="quick-section" :aria-label="t('dashboard.quickActions')">
      <h3 class="section-title">{{ t('dashboard.quickActions') }}</h3>
      <ElRow :gutter="16">
        <ElCol v-for="action in quickActions" :key="action.path" class="quick-col" :xs="24" :sm="12" :md="6">
          <QuickActionCard
            :title="action.title"
            :description="action.description"
            :path="action.path"
          />
        </ElCol>
      </ElRow>
    </section>

    <!-- 待审批列表 -->
    <section class="approvals-section" :aria-label="t('dashboard.pendingApprovals')">
      <header class="section-header">
        <h3 class="section-title">{{ t('dashboard.pendingApprovals') }}</h3>
        <ElButton text type="primary" @click="viewAllApprovals">
          {{ t('dashboard.viewAll') }}
          <ElIcon class="ml-1"><ArrowRight /></ElIcon>
        </ElButton>
      </header>

      <ElSkeleton v-if="approvalsLoading" :rows="5" animated />

      <ElCard v-else-if="approvalsError" shadow="never">
        <ElEmpty :description="t('dashboard.loadApprovalsFailed')">
          <ElButton type="primary" @click="retryApprovals">{{ t('common.retry') }}</ElButton>
        </ElEmpty>
      </ElCard>

      <ElTable
        v-else
        :data="recentApprovals"
        stripe
        highlight-current-row
        class="approval-table"
        @row-click="handleApprovalClick"
      >
        <ElTableColumn prop="merchantName" :label="t('dashboard.colMerchant')" width="150" />
        <ElTableColumn prop="areaName" :label="t('dashboard.colArea')" width="120" />
        <ElTableColumn prop="reason" :label="t('dashboard.colReason')" show-overflow-tooltip />
        <ElTableColumn prop="createdAt" :label="t('dashboard.colApplyTime')" width="150">
          <template #default="{ row }">
            <ElIcon class="mr-1"><Clock /></ElIcon>
            {{ formatDateTime(row.createdAt) }}
          </template>
        </ElTableColumn>

        <template #empty>
          <ElEmpty :description="t('dashboard.noPendingApprovals')" />
        </template>
      </ElTable>
    </section>

    <!-- 系统公告 -->
    <section class="notice-section" :aria-label="t('dashboard.systemNotices')">
      <header class="section-header">
        <h3 class="section-title">{{ t('dashboard.systemNotices') }}</h3>
        <ElButton type="primary" size="small" @click="openPublishDialog">
          {{ t('dashboard.publishNotice') }}
        </ElButton>
      </header>
      <ElSkeleton v-if="noticesLoading" :rows="3" animated />
      <ElCard v-else-if="noticesError" shadow="never" class="notice-card">
        <ElEmpty :description="t('dashboard.loadNoticesFailed')">
          <ElButton type="primary" @click="retryNotices">{{ t('common.retry') }}</ElButton>
        </ElEmpty>
      </ElCard>
      <ElCard v-else-if="notices.length === 0" shadow="never" class="notice-card">
        <ElEmpty :description="t('dashboard.noNotices')" />
      </ElCard>
      <ElCard v-else shadow="never" class="notice-card">
        <article v-for="notice in notices" :key="notice.noticeId" class="notice-item">
          <hgroup class="notice-content">
            <h4 class="notice-title">{{ notice.title }}</h4>
            <p class="notice-desc">{{ notice.content }}</p>
          </hgroup>
          <ElTag type="info" size="small">{{ formatNoticeDate(notice.publishedAt) }}</ElTag>
        </article>
      </ElCard>
    </section>

    <ElDialog
      v-model="publishDialogVisible"
      :title="t('dashboard.publishNotice')"
      width="560px"
      @closed="resetPublishForm"
    >
      <ElForm ref="publishFormRef" :model="publishForm" :rules="publishRules" label-position="top">
        <ElFormItem :label="t('dashboard.noticeTitle')" prop="title">
          <ElInput
            v-model="publishForm.title"
            :placeholder="t('dashboard.noticeTitlePlaceholder')"
            maxlength="200"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem :label="t('dashboard.noticeContent')" prop="content">
          <ElInput
            v-model="publishForm.content"
            type="textarea"
            :rows="6"
            :placeholder="t('dashboard.noticeContentPlaceholder')"
            maxlength="5000"
            show-word-limit
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="publishDialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="publishSubmitting" @click="submitPublishNotice">
          {{ t('common.confirm') }}
        </ElButton>
      </template>
    </ElDialog>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: $space-8;

  .section-title {
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: var(--text-secondary);
    margin: 0 0 $space-4 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stats-section .stat-card {
    @include card-base;
    border-radius: $radius-lg;
    margin-bottom: $space-4;
    background: rgba(var(--bg-secondary-rgb), 0.8);
  }

  .quick-section {
    .quick-col {
      margin-bottom: $space-4;
    }
  }

  .approvals-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $space-4;

      .section-title {
        margin: 0;
      }

      .ml-1 {
        margin-left: $space-1;
      }
    }

    .approval-table {
      @include card-base;
      border-radius: $radius-lg;
      overflow: hidden;
      background: rgba(var(--bg-secondary-rgb), 0.8);

      :deep(.el-table__row) {
        cursor: pointer;
      }

      .mr-1 {
        margin-right: $space-1;
      }
    }
  }

  .notice-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: $space-4;

      .section-title {
        margin: 0;
      }
    }

    .notice-card {
      @include card-base;
      border-radius: $radius-lg;
      background: rgba(var(--bg-secondary-rgb), 0.8);

      .notice-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: $space-4;
        padding: $space-4 0;
        border-bottom: 1px solid var(--border-subtle);

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
            font-size: $font-size-base;
            font-weight: $font-weight-medium;
            color: var(--text-primary);
            margin: 0 0 $space-1 + 2 0;
          }

          .notice-desc {
            font-size: $font-size-sm + 1;
            color: var(--text-secondary);
            margin: 0;
          }
        }
      }
    }
  }
}
</style>
