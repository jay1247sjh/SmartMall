<script setup lang="ts">
import type { AdminStats, ApprovalRequest, NoticeItem } from '@/api/admin.api'
import type { AreaApplication, MerchantStats, Store } from '@/api/merchant.api'
import type {
  UpdateProfileRequest,
  UserCoupon,
  UserOrder,
  UserProfile,
  UserStoreBrief,
  UserTrendStats,
} from '@/api/user.api'
import { ArrowRight, Edit, Lock, Refresh, Shop, Star, Ticket, User, View } from '@element-plus/icons-vue'
import {
  ElAlert,
  ElAvatar,
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElDivider,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElOption,
  ElSelect,
  ElSkeleton,
  ElSpace,
  ElTag,
} from 'element-plus'
/**
 * 个人中心视图
 *
 * 用户查看和编辑个人信息的页面。
 *
 * 业务职责：
 * - 展示用户基本信息（用户名、邮箱、手机号、角色、状态）
 * - 编辑个人资料（邮箱、手机号）
 * - 修改登录密码
 *
 * 设计原则：
 * - 使用 Element Plus 组件构建一致的 UI
 * - 使用 HTML5 语义化标签（article、section、header、footer、hgroup）
 * - 卡片式布局，信息清晰
 * - 编辑模式切换：查看模式和编辑模式
 * - 密码修改使用模态框
 *
 * 数据流：
 * - 页面加载时从后端 API 获取用户信息
 * - 编辑后通过 API 保存到后端
 * - 密码修改需要验证当前密码
 *
 * 安全考虑：
 * - 密码修改需要输入当前密码验证身份
 * - 新密码需要二次确认
 * - 密码最少 6 位
 *
 * 用户角色：
 * - 所有已登录用户可访问
 * - 只能编辑自己的信息
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { adminApi, merchantApi, passwordApi, userApi } from '@/api'
import { useUserStore } from '@/stores'

type ProfileTab = 'overview' | 'operations' | 'transactions' | 'notices' | 'security'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isLoading = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const dashboardError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const profile = ref<UserProfile | null>(null)
const editForm = ref<UpdateProfileRequest>({ email: '', phone: '' })

const showPasswordModal = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref<string | null>(null)
const isChangingPassword = ref(false)
const isDashboardLoading = ref(false)
const adminStats = ref<AdminStats | null>(null)
const merchantStats = ref<MerchantStats | null>(null)
const userStats = ref<{
  availableCouponCount: number
  browseHistoryCount: number
  favoriteStoreCount: number
  orderCount: number
} | null>(null)
const notices = ref<NoticeItem[]>([])
const activeTab = ref<ProfileTab>('overview')
const userTrend = ref<UserTrendStats | null>(null)
const userOrders = ref<UserOrder[]>([])
const userCoupons = ref<UserCoupon[]>([])
const activeStores = ref<UserStoreBrief[]>([])
const favoriteStoreIds = ref<string[]>([])
const favoritePending = ref<Record<string, boolean>>({})
const couponPending = ref<Record<string, boolean>>({})
const adminApprovals = ref<ApprovalRequest[]>([])
const adminUserTotal = ref(0)
const merchantStores = ref<Store[]>([])
const merchantApplications = ref<AreaApplication[]>([])
const isClaimingCoupon = ref(false)
const orderStatusFilter = ref<'ALL' | UserOrder['status']>('ALL')
const couponStatusFilter = ref<'ALL' | UserCoupon['status']>('ALL')

const roleDisplayName = computed(() => {
  const roleMap: Record<string, string> = {
    ADMIN: t('roles.admin'),
    MERCHANT: t('roles.merchant'),
    USER: t('roles.user'),
  }
  return roleMap[profile.value?.userType || ''] || t('roles.user')
})

const statusDisplayName = computed(() => {
  const statusMap: Record<string, string> = {
    ACTIVE: t('profile.statusActive'),
    FROZEN: t('profile.statusFrozen'),
    DELETED: t('profile.statusDeleted'),
  }
  return statusMap[profile.value?.status || ''] || t('profile.statusUnknown')
})

const avatarLetter = computed(() =>
  profile.value?.username?.charAt(0).toUpperCase() || 'U',
)

const statusTagType = computed(() => {
  const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    ACTIVE: 'success',
    FROZEN: 'warning',
    DELETED: 'danger',
  }
  return statusMap[profile.value?.status || ''] || 'info'
})

const currentRole = computed(() => profile.value?.userType || userStore.currentUser?.userType || '')

const tabItems = computed(() => {
  const items: Array<{ key: ProfileTab, label: string }> = [
    { key: 'overview', label: t('profile.tabOverview') },
    { key: 'operations', label: t('profile.tabRoleCenter') },
  ]
  if (currentRole.value === 'USER') {
    items.push({ key: 'transactions', label: t('profile.tabTransactions') })
  }
  items.push({ key: 'notices', label: t('profile.tabNotices') })
  items.push({ key: 'security', label: t('profile.tabSecurity') })
  return items
})

const roleWorkbenchTitle = computed(() => {
  if (currentRole.value === 'ADMIN')
    return t('profile.adminWorkbench')
  if (currentRole.value === 'MERCHANT')
    return t('profile.merchantWorkbench')
  return t('profile.userWorkbench')
})

const metricCards = computed(() => {
  if (currentRole.value === 'ADMIN' && adminStats.value) {
    return [
      { icon: User, key: 'merchantCount', label: t('dashboard.statMerchantCount'), value: adminStats.value.merchantCount },
      { icon: Shop, key: 'storeCount', label: t('dashboard.statStoreCount'), value: adminStats.value.storeCount },
      { icon: Ticket, key: 'pendingApprovals', label: t('dashboard.statPending'), value: adminStats.value.pendingApprovals },
      { icon: View, key: 'todayActiveUsers', label: t('dashboard.statTodayActive'), value: adminStats.value.todayActiveUsers },
    ]
  }

  if (currentRole.value === 'MERCHANT' && merchantStats.value) {
    return [
      { icon: Shop, key: 'storeCount', label: t('dashboard.statMyStores'), value: merchantStats.value.storeCount },
      { icon: Star, key: 'productCount', label: t('dashboard.statProductCount'), value: merchantStats.value.productCount },
      { icon: Ticket, key: 'pendingApplications', label: t('dashboard.statPendingApps'), value: merchantStats.value.pendingApplications },
    ]
  }

  if (currentRole.value === 'USER' && userStats.value) {
    return [
      { icon: Star, key: 'favoriteStoreCount', label: t('dashboard.statFavorites'), value: userStats.value.favoriteStoreCount },
      { icon: View, key: 'browseHistoryCount', label: t('dashboard.statHistory'), value: userStats.value.browseHistoryCount },
      { icon: Shop, key: 'orderCount', label: t('dashboard.statOrders'), value: userStats.value.orderCount },
      { icon: Ticket, key: 'availableCouponCount', label: t('dashboard.statCoupons'), value: userStats.value.availableCouponCount },
    ]
  }

  return []
})

const metricMax = computed(() =>
  Math.max(1, ...metricCards.value.map(item => Number(item.value || 0))),
)

const filteredOrders = computed(() => {
  if (orderStatusFilter.value === 'ALL')
    return userOrders.value
  return userOrders.value.filter(item => item.status === orderStatusFilter.value)
})

const filteredCoupons = computed(() => {
  if (couponStatusFilter.value === 'ALL')
    return userCoupons.value
  return userCoupons.value.filter(item => item.status === couponStatusFilter.value)
})

function getMetricBarWidth(value: number) {
  return Math.max(8, (Number(value || 0) / metricMax.value) * 100)
}

function formatDateTime(value?: string) {
  if (!value)
    return t('profile.notSet')
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()))
    return value
  const yy = parsed.getFullYear()
  const mm = String(parsed.getMonth() + 1).padStart(2, '0')
  const dd = String(parsed.getDate()).padStart(2, '0')
  const hh = String(parsed.getHours()).padStart(2, '0')
  const ii = String(parsed.getMinutes()).padStart(2, '0')
  return `${yy}-${mm}-${dd} ${hh}:${ii}`
}

function formatOrderStatus(status: UserOrder['status']) {
  const map: Record<UserOrder['status'], string> = {
    CREATED: t('profile.orderStatusCreated'),
    PAID: t('profile.orderStatusPaid'),
    CANCELLED: t('profile.orderStatusCancelled'),
    COMPLETED: t('profile.orderStatusCompleted'),
  }
  return map[status]
}

function formatCouponStatus(status: UserCoupon['status']) {
  const map: Record<UserCoupon['status'], string> = {
    UNUSED: t('profile.couponStatusUnused'),
    USED: t('profile.couponStatusUsed'),
    EXPIRED: t('profile.couponStatusExpired'),
  }
  return map[status]
}

function couponTagType(status: UserCoupon['status']) {
  if (status === 'UNUSED')
    return 'success'
  if (status === 'USED')
    return 'info'
  return 'danger'
}

function syncTabFromRoute() {
  const tab = String(route.query.tab || '')
  const availableTabs = new Set(tabItems.value.map(item => item.key))
  if (tab && availableTabs.has(tab as ProfileTab)) {
    activeTab.value = tab as ProfileTab
    return
  }
  if (!availableTabs.has(activeTab.value)) {
    activeTab.value = 'overview'
  }
}

function switchTab(tab: ProfileTab) {
  if (activeTab.value === tab)
    return
  activeTab.value = tab
  const query = { ...route.query }
  if (tab === 'overview') {
    delete query.tab
  }
  else {
    query.tab = tab
  }
  router.replace({ path: route.path, query })
}

function go(path: string) {
  router.push(path)
}

const isPasswordFormValid = computed(() =>
  passwordForm.value.currentPassword.length >= 6
  && passwordForm.value.newPassword.length >= 6
  && passwordForm.value.newPassword === passwordForm.value.confirmPassword,
)

async function loadProfile() {
  isLoading.value = true
  error.value = null

  try {
    const data = await userApi.getProfile()
    profile.value = data

    editForm.value = {
      email: data.email,
      phone: data.phone,
    }

    syncUserStoreProfile(data)
  }
  catch (e: unknown) {
    error.value = (e as Error).message || t('profile.loadFailed')
  }
  finally {
    isLoading.value = false
  }
}

async function loadDashboard() {
  if (!currentRole.value)
    return

  isDashboardLoading.value = true
  dashboardError.value = null
  adminStats.value = null
  merchantStats.value = null
  userStats.value = null
  notices.value = []

  if (currentRole.value === 'ADMIN') {
    const [statsRes, noticesRes] = await Promise.allSettled([
      adminApi.getStats(),
      adminApi.getNotices(6),
    ])

    if (statsRes.status === 'fulfilled') {
      adminStats.value = statsRes.value
    }
    else {
      dashboardError.value = t('profile.statsLoadFailed')
    }

    if (noticesRes.status === 'fulfilled') {
      notices.value = noticesRes.value
    }
  }

  if (currentRole.value === 'MERCHANT') {
    const [statsRes, noticesRes] = await Promise.allSettled([
      merchantApi.getStats(),
      adminApi.getNotices(6),
    ])

    if (statsRes.status === 'fulfilled') {
      merchantStats.value = statsRes.value
    }
    else {
      dashboardError.value = t('profile.statsLoadFailed')
    }

    if (noticesRes.status === 'fulfilled') {
      notices.value = noticesRes.value
    }
  }

  if (currentRole.value === 'USER') {
    const [statsRes, noticesRes] = await Promise.allSettled([
      userApi.getDashboardStats(),
      adminApi.getNotices(6),
    ])

    if (statsRes.status === 'fulfilled') {
      userStats.value = statsRes.value
    }
    else {
      dashboardError.value = t('profile.statsLoadFailed')
    }

    if (noticesRes.status === 'fulfilled') {
      notices.value = noticesRes.value
    }
  }

  isDashboardLoading.value = false
}

function markDashboardError() {
  dashboardError.value = dashboardError.value || t('profile.statsLoadFailed')
}

async function loadRoleWorkbench() {
  if (!currentRole.value)
    return

  isDashboardLoading.value = true

  if (currentRole.value === 'ADMIN') {
    const [approvalsRes, usersRes] = await Promise.allSettled([
      adminApi.getApprovalList({ status: 'PENDING', page: 1, pageSize: 6 }),
      adminApi.getUserList({ page: 1, pageSize: 1 }),
    ])

    if (approvalsRes.status === 'fulfilled') {
      adminApprovals.value = approvalsRes.value.slice(0, 6)
    }
    else {
      markDashboardError()
    }

    if (usersRes.status === 'fulfilled') {
      adminUserTotal.value = usersRes.value.total
    }
    else {
      markDashboardError()
    }
  }

  if (currentRole.value === 'MERCHANT') {
    const [storesRes, appsRes] = await Promise.allSettled([
      merchantApi.getMyStores(),
      merchantApi.getMyApplications(),
    ])

    if (storesRes.status === 'fulfilled') {
      merchantStores.value = storesRes.value.slice(0, 8)
    }
    else {
      markDashboardError()
    }

    if (appsRes.status === 'fulfilled') {
      merchantApplications.value = appsRes.value.slice(0, 8)
    }
    else {
      markDashboardError()
    }
  }

  if (currentRole.value === 'USER') {
    const [trendRes, ordersRes, couponsRes, storesRes, favoritesRes] = await Promise.allSettled([
      userApi.getDashboardTrend(7),
      userApi.getOrders(20),
      userApi.getCoupons(20),
      userApi.getActiveStores(12),
      userApi.getFavoriteStoreIds(),
    ])

    if (trendRes.status === 'fulfilled') {
      userTrend.value = trendRes.value
    }
    else {
      markDashboardError()
    }

    if (ordersRes.status === 'fulfilled') {
      userOrders.value = ordersRes.value
    }
    else {
      markDashboardError()
    }

    if (couponsRes.status === 'fulfilled') {
      userCoupons.value = couponsRes.value
    }
    else {
      markDashboardError()
    }

    if (storesRes.status === 'fulfilled') {
      activeStores.value = storesRes.value
    }
    else {
      markDashboardError()
    }

    if (favoritesRes.status === 'fulfilled') {
      favoriteStoreIds.value = favoritesRes.value
    }
    else {
      markDashboardError()
    }
  }

  isDashboardLoading.value = false
}

function syncUserStoreProfile(data: UserProfile) {
  if (!userStore.currentUser)
    return

  const nextUser = {
    ...userStore.currentUser,
    userId: data.id,
    username: data.username,
    userType: data.userType,
    status: data.status,
    email: data.email,
    phone: data.phone,
    lastLoginTime: data.lastLoginTime,
  }

  userStore.currentUser = nextUser
  localStorage.setItem('sm_userInfo', JSON.stringify(nextUser))
}

function startEditing() {
  editForm.value = {
    email: profile.value?.email || '',
    phone: profile.value?.phone || '',
  }
  isEditing.value = true
  error.value = null
  successMessage.value = null
}

function cancelEditing() {
  isEditing.value = false
  error.value = null
}

async function saveProfile() {
  if (!profile.value)
    return

  isSaving.value = true
  error.value = null
  successMessage.value = null

  try {
    const updated = await userApi.updateProfile(editForm.value)
    profile.value = updated
    syncUserStoreProfile(updated)
    isEditing.value = false
    successMessage.value = t('profile.saveSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  }
  catch (e: unknown) {
    error.value = (e as Error).message || t('profile.saveFailed')
  }
  finally {
    isSaving.value = false
  }
}

function openPasswordModal() {
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordError.value = null
  showPasswordModal.value = true
}

async function changePassword() {
  if (!isPasswordFormValid.value)
    return

  isChangingPassword.value = true
  passwordError.value = null

  try {
    await passwordApi.changePassword({
      oldPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })
    showPasswordModal.value = false
    successMessage.value = t('profile.passwordChanged')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  }
  catch (e: unknown) {
    passwordError.value = (e as Error).message || t('profile.passwordChangeFailed')
  }
  finally {
    isChangingPassword.value = false
  }
}

async function toggleFavorite(storeId: string) {
  if (favoritePending.value[storeId])
    return
  favoritePending.value = { ...favoritePending.value, [storeId]: true }
  const isFavorite = favoriteStoreIds.value.includes(storeId)

  try {
    if (isFavorite) {
      await userApi.removeFavorite(storeId)
      favoriteStoreIds.value = favoriteStoreIds.value.filter(id => id !== storeId)
    }
    else {
      await userApi.addFavorite(storeId)
      favoriteStoreIds.value = [...favoriteStoreIds.value, storeId]
    }
    await loadDashboard()
  }
  catch (e: unknown) {
    dashboardError.value = (e as Error).message || t('profile.statsLoadFailed')
  }
  finally {
    favoritePending.value = { ...favoritePending.value, [storeId]: false }
  }
}

async function claimCoupon() {
  if (isClaimingCoupon.value)
    return
  isClaimingCoupon.value = true

  try {
    const created = await userApi.claimCoupon()
    userCoupons.value = [created, ...userCoupons.value]
    await loadDashboard()
  }
  catch (e: unknown) {
    dashboardError.value = (e as Error).message || t('profile.statsLoadFailed')
  }
  finally {
    isClaimingCoupon.value = false
  }
}

async function useCoupon(couponId: string) {
  if (couponPending.value[couponId])
    return
  couponPending.value = { ...couponPending.value, [couponId]: true }

  try {
    const updated = await userApi.useCoupon(couponId)
    userCoupons.value = userCoupons.value.map(item => item.couponId === couponId ? updated : item)
    await loadDashboard()
  }
  catch (e: unknown) {
    dashboardError.value = (e as Error).message || t('profile.statsLoadFailed')
  }
  finally {
    couponPending.value = { ...couponPending.value, [couponId]: false }
  }
}

watch(
  () => [route.query.tab, currentRole.value, tabItems.value.length],
  () => {
    syncTabFromRoute()
  },
  { immediate: true },
)

onMounted(() => {
  loadProfile().then(async () => {
    await Promise.all([loadDashboard(), loadRoleWorkbench()])
  })
})
</script>

<template>
  <article class="profile-page">
    <!-- 加载状态 -->
    <ElSkeleton v-if="isLoading" :rows="6" animated />

    <!-- 提示消息 -->
    <ElAlert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      closable
      class="message-alert"
      @close="error = null"
    />

    <ElAlert
      v-if="successMessage"
      :title="successMessage"
      type="success"
      show-icon
      closable
      class="message-alert"
      @close="successMessage = null"
    />

    <!-- 用户信息卡片 -->
    <ElCard v-if="profile && !isLoading" shadow="never" class="profile-card">
      <!-- 头部：头像和基本信息 -->
      <template #header>
        <header class="profile-header">
          <ElAvatar :size="80" class="profile-avatar">
            {{ avatarLetter }}
          </ElAvatar>
          <hgroup class="profile-info">
            <h2 class="profile-name">
              {{ profile.username }}
            </h2>
            <ElTag type="primary" size="small">
              {{ roleDisplayName }}
            </ElTag>
          </hgroup>
        </header>
      </template>

      <!-- 详细信息 -->
      <section class="profile-details">
        <ElForm v-if="isEditing" label-position="top">
          <ElFormItem :label="t('profile.email')">
            <ElInput v-model="editForm.email" :placeholder="t('profile.emailPlaceholder')" />
          </ElFormItem>
          <ElFormItem :label="t('profile.phone')">
            <ElInput v-model="editForm.phone" :placeholder="t('profile.phonePlaceholder')" />
          </ElFormItem>
        </ElForm>

        <ElDescriptions v-else :column="2" border>
          <ElDescriptionsItem :label="t('profile.email')">
            {{ profile.email || t('profile.notSet') }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('profile.phone')">
            {{ profile.phone || t('profile.notSet') }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('profile.role')">
            {{ roleDisplayName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('profile.status')">
            <ElTag :type="statusTagType" size="small">
              {{ statusDisplayName }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <ElDivider />

      <!-- 操作按钮 -->
      <footer class="profile-actions">
        <ElSpace v-if="isEditing">
          <ElButton :disabled="isSaving" @click="cancelEditing">
            {{ t('common.cancel') }}
          </ElButton>
          <ElButton type="primary" :loading="isSaving" @click="saveProfile">
            {{ isSaving ? t('profile.saving') : t('common.save') }}
          </ElButton>
        </ElSpace>
        <ElSpace v-else>
          <ElButton :icon="Lock" @click="openPasswordModal">
            {{ t('profile.changePassword') }}
          </ElButton>
          <ElButton type="primary" :icon="Edit" @click="startEditing">
            {{ t('profile.editProfile') }}
          </ElButton>
        </ElSpace>
      </footer>
    </ElCard>

    <ElAlert
      v-if="dashboardError"
      :title="dashboardError"
      type="warning"
      show-icon
      closable
      class="message-alert"
      @close="dashboardError = null"
    />

    <section v-if="!isLoading" class="workspace-section">
      <nav class="workspace-tabs">
        <button
          v-for="item in tabItems"
          :key="item.key"
          class="workspace-tab"
          :class="{ active: activeTab === item.key }"
          @click="switchTab(item.key)"
        >
          {{ item.label }}
        </button>
      </nav>

      <section v-if="activeTab === 'overview'" class="profile-analytics">
        <ElCard shadow="never" class="analytics-card">
          <template #header>
            <header class="analytics-head">
              <h3 class="analytics-title">
                {{ t('profile.metricOverview') }}
              </h3>
              <ElButton text :icon="Refresh" @click="loadDashboard">
                {{ t('profile.refreshData') }}
              </ElButton>
            </header>
          </template>

          <ElSkeleton v-if="isDashboardLoading" :rows="3" animated />

          <template v-else>
            <div class="metric-grid">
              <article v-for="metric in metricCards" :key="metric.key" class="metric-item">
                <ElIcon class="metric-icon">
                  <component :is="metric.icon" />
                </ElIcon>
                <div class="metric-main">
                  <span class="metric-label">{{ metric.label }}</span>
                  <strong class="metric-value">{{ metric.value }}</strong>
                </div>
              </article>
            </div>

            <div class="metric-bars">
              <div v-for="metric in metricCards" :key="`bar-${metric.key}`" class="metric-row">
                <div class="metric-row-head">
                  <span>{{ metric.label }}</span>
                  <strong>{{ metric.value }}</strong>
                </div>
                <div class="metric-track">
                  <div class="metric-fill" :style="{ width: `${getMetricBarWidth(metric.value)}%` }" />
                </div>
              </div>
            </div>
          </template>
        </ElCard>

        <ElCard shadow="never" class="analytics-card">
          <template #header>
            <h3 class="analytics-title">
              {{ t('profile.quickSnapshot') }}
            </h3>
          </template>

          <div class="snapshot-list">
            <template v-if="currentRole === 'ADMIN'">
              <article class="snapshot-item">
                <span>{{ t('profile.pendingApprovals') }}</span>
                <strong>{{ adminStats?.pendingApprovals ?? adminApprovals.length }}</strong>
              </article>
              <article class="snapshot-item">
                <span>{{ t('profile.totalUsers') }}</span>
                <strong>{{ adminUserTotal }}</strong>
              </article>
            </template>
            <template v-else-if="currentRole === 'MERCHANT'">
              <article class="snapshot-item">
                <span>{{ t('profile.myStores') }}</span>
                <strong>{{ merchantStores.length }}</strong>
              </article>
              <article class="snapshot-item">
                <span>{{ t('profile.myApplications') }}</span>
                <strong>{{ merchantApplications.length }}</strong>
              </article>
            </template>
            <template v-else>
              <article class="snapshot-item">
                <span>{{ t('profile.recentOrders') }}</span>
                <strong>{{ userOrders.length }}</strong>
              </article>
              <article class="snapshot-item">
                <span>{{ t('profile.recentCoupons') }}</span>
                <strong>{{ userCoupons.length }}</strong>
              </article>
              <article class="snapshot-item">
                <span>{{ t('profile.trendTitle') }}</span>
                <strong>{{ userTrend?.points?.length || 0 }}</strong>
              </article>
            </template>
          </div>

          <ElDivider />

          <div class="quick-actions">
            <h4>{{ t('profile.quickActions') }}</h4>
            <div class="quick-actions-row">
              <template v-if="currentRole === 'ADMIN'">
                <ElButton text :icon="ArrowRight" @click="go('/admin/dashboard')">
                  {{ t('profile.openAdminDashboard') }}
                </ElButton>
                <ElButton text :icon="ArrowRight" @click="go('/admin/area-approval')">
                  {{ t('profile.openAreaApproval') }}
                </ElButton>
                <ElButton text :icon="ArrowRight" @click="go('/admin/users')">
                  {{ t('profile.openUserManage') }}
                </ElButton>
              </template>
              <template v-else-if="currentRole === 'MERCHANT'">
                <ElButton text :icon="ArrowRight" @click="go('/merchant/dashboard')">
                  {{ t('profile.openMerchantDashboard') }}
                </ElButton>
                <ElButton text :icon="ArrowRight" @click="go('/merchant/store-config')">
                  {{ t('profile.openStoreConfig') }}
                </ElButton>
                <ElButton text :icon="ArrowRight" @click="go('/merchant/area-apply')">
                  {{ t('profile.openAreaApply') }}
                </ElButton>
              </template>
              <template v-else>
                <ElButton text :icon="ArrowRight" @click="go('/mall')">
                  {{ t('profile.openMall') }}
                </ElButton>
                <ElButton text :icon="ArrowRight" @click="go('/mall/stores')">
                  {{ t('nav.storeProducts') }}
                </ElButton>
                <ElButton text :icon="ArrowRight" @click="switchTab('transactions')">
                  {{ t('profile.tabTransactions') }}
                </ElButton>
              </template>
            </div>
          </div>
        </ElCard>
      </section>

      <section v-if="activeTab === 'operations'" class="profile-roleboard">
        <ElCard shadow="never" class="analytics-card">
          <template #header>
            <header class="analytics-head">
              <h3 class="analytics-title">
                {{ roleWorkbenchTitle }}
              </h3>
              <ElButton text :icon="Refresh" @click="loadRoleWorkbench">
                {{ t('profile.refreshData') }}
              </ElButton>
            </header>
          </template>

          <ElSkeleton v-if="isDashboardLoading" :rows="3" animated />

          <template v-else-if="currentRole === 'ADMIN'">
            <ElEmpty v-if="adminApprovals.length === 0" :description="t('dashboard.noNotices')" :image-size="68" />
            <div v-else class="simple-list">
              <article v-for="item in adminApprovals" :key="item.id" class="simple-item">
                <div>
                  <h4>{{ item.areaName }}</h4>
                  <p>{{ item.merchantName }} · {{ formatDateTime(item.createdAt) }}</p>
                </div>
                <ElTag type="warning" size="small">
                  {{ item.status }}
                </ElTag>
              </article>
            </div>
          </template>

          <template v-else-if="currentRole === 'MERCHANT'">
            <div class="split-list">
              <section>
                <h4 class="list-title">
                  {{ t('profile.myStores') }}
                </h4>
                <ElEmpty v-if="merchantStores.length === 0" :description="t('profile.noStores')" :image-size="60" />
                <div v-else class="simple-list">
                  <article v-for="store in merchantStores" :key="store.id" class="simple-item">
                    <div>
                      <h4>{{ store.name }}</h4>
                      <p>{{ store.category }} · {{ store.floorName }}-{{ store.areaName }}</p>
                    </div>
                    <ElTag size="small" :type="store.status === 'ACTIVE' ? 'success' : 'info'">
                      {{ store.status }}
                    </ElTag>
                  </article>
                </div>
              </section>
              <section>
                <h4 class="list-title">
                  {{ t('profile.myApplications') }}
                </h4>
                <ElEmpty v-if="merchantApplications.length === 0" :description="t('profile.noApplications')" :image-size="60" />
                <div v-else class="simple-list">
                  <article v-for="app in merchantApplications" :key="app.id" class="simple-item">
                    <div>
                      <h4>{{ app.areaName }}</h4>
                      <p>{{ app.floorName }} · {{ formatDateTime(app.createdAt) }}</p>
                    </div>
                    <ElTag size="small" :type="app.status === 'APPROVED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'warning'">
                      {{ app.status }}
                    </ElTag>
                  </article>
                </div>
              </section>
            </div>
          </template>

          <template v-else>
            <header class="analytics-head">
              <h4 class="list-title">
                {{ t('profile.activeStores') }}
              </h4>
              <ElButton size="small" type="primary" plain :loading="isClaimingCoupon" @click="claimCoupon">
                {{ t('profile.claimCoupon') }}
              </ElButton>
            </header>
            <ElEmpty v-if="activeStores.length === 0" :description="t('profile.noActiveStores')" :image-size="68" />
            <div v-else class="simple-list">
              <article v-for="store in activeStores" :key="store.storeId" class="simple-item">
                <div>
                  <h4>{{ store.name }}</h4>
                  <p>{{ store.category }}</p>
                </div>
                <ElButton
                  size="small"
                  :loading="favoritePending[store.storeId]"
                  @click="toggleFavorite(store.storeId)"
                >
                  {{ favoriteStoreIds.includes(store.storeId) ? t('profile.unfavorite') : t('profile.favorite') }}
                </ElButton>
              </article>
            </div>
          </template>
        </ElCard>
      </section>

      <section v-if="activeTab === 'transactions' && currentRole === 'USER'" class="profile-analytics">
        <ElCard shadow="never" class="analytics-card">
          <template #header>
            <header class="analytics-head">
              <h3 class="analytics-title">
                {{ t('profile.recentOrders') }}
              </h3>
              <ElSelect v-model="orderStatusFilter" size="small" class="filter-select">
                <ElOption value="ALL" :label="t('profile.orderStatusAll')" />
                <ElOption value="CREATED" :label="t('profile.orderStatusCreated')" />
                <ElOption value="PAID" :label="t('profile.orderStatusPaid')" />
                <ElOption value="CANCELLED" :label="t('profile.orderStatusCancelled')" />
                <ElOption value="COMPLETED" :label="t('profile.orderStatusCompleted')" />
              </ElSelect>
            </header>
          </template>
          <ElEmpty v-if="filteredOrders.length === 0" :description="t('profile.emptyOrders')" :image-size="68" />
          <div v-else class="simple-list">
            <article v-for="order in filteredOrders" :key="order.orderId" class="simple-item">
              <div>
                <h4>#{{ order.orderId }}</h4>
                <p>{{ formatDateTime(order.createdAt) }}</p>
              </div>
              <div class="simple-item-tail">
                <strong>¥{{ Number(order.totalAmount || 0).toFixed(2) }}</strong>
                <ElTag size="small">
                  {{ formatOrderStatus(order.status) }}
                </ElTag>
              </div>
            </article>
          </div>
        </ElCard>

        <ElCard shadow="never" class="analytics-card">
          <template #header>
            <header class="analytics-head">
              <h3 class="analytics-title">
                {{ t('profile.recentCoupons') }}
              </h3>
              <div class="coupon-actions">
                <ElSelect v-model="couponStatusFilter" size="small" class="filter-select">
                  <ElOption value="ALL" :label="t('profile.couponStatusAll')" />
                  <ElOption value="UNUSED" :label="t('profile.couponStatusUnused')" />
                  <ElOption value="USED" :label="t('profile.couponStatusUsed')" />
                  <ElOption value="EXPIRED" :label="t('profile.couponStatusExpired')" />
                </ElSelect>
                <ElButton size="small" type="primary" plain :loading="isClaimingCoupon" @click="claimCoupon">
                  {{ t('profile.claimCoupon') }}
                </ElButton>
              </div>
            </header>
          </template>
          <ElEmpty v-if="filteredCoupons.length === 0" :description="t('profile.emptyCoupons')" :image-size="68" />
          <div v-else class="simple-list">
            <article v-for="coupon in filteredCoupons" :key="coupon.couponId" class="simple-item">
              <div>
                <h4>{{ coupon.couponName }}</h4>
                <p>{{ formatDateTime(coupon.expiresAt) }}</p>
              </div>
              <div class="simple-item-tail">
                <ElTag size="small" :type="couponTagType(coupon.status)">
                  {{ formatCouponStatus(coupon.status) }}
                </ElTag>
                <ElButton
                  v-if="coupon.status === 'UNUSED'"
                  size="small"
                  :loading="couponPending[coupon.couponId]"
                  @click="useCoupon(coupon.couponId)"
                >
                  {{ t('profile.useCoupon') }}
                </ElButton>
              </div>
            </article>
          </div>
        </ElCard>
      </section>

      <section v-if="activeTab === 'notices'" class="profile-roleboard">
        <ElCard shadow="never" class="analytics-card">
          <template #header>
            <header class="analytics-head">
              <h3 class="analytics-title">
                {{ t('dashboard.systemNotices') }}
              </h3>
              <ElButton text :icon="Refresh" @click="loadDashboard">
                {{ t('profile.refreshData') }}
              </ElButton>
            </header>
          </template>

          <ElEmpty
            v-if="notices.length === 0"
            :description="t('dashboard.noNotices')"
            :image-size="68"
          />

          <div v-else class="notice-list">
            <article v-for="notice in notices" :key="notice.noticeId" class="notice-item">
              <header>
                <h4>{{ notice.title }}</h4>
                <time>{{ formatDateTime(notice.publishedAt) }}</time>
              </header>
              <p>{{ notice.content }}</p>
            </article>
          </div>
        </ElCard>
      </section>

      <section v-if="activeTab === 'security'" class="profile-roleboard">
        <ElCard shadow="never" class="analytics-card">
          <template #header>
            <h3 class="analytics-title">
              {{ t('profile.accountSecurity') }}
            </h3>
          </template>

          <div class="simple-list">
            <article class="simple-item">
              <div>
                <h4>{{ t('profile.loginStatus') }}</h4>
                <p>{{ t('profile.lastActive') }}: {{ formatDateTime(profile?.lastLoginTime) }}</p>
              </div>
              <ElTag :type="statusTagType" size="small">
                {{ statusDisplayName }}
              </ElTag>
            </article>
            <article class="simple-item">
              <div>
                <h4>{{ t('profile.emailBound') }}</h4>
                <p>{{ profile?.email || t('profile.notSet') }}</p>
              </div>
              <ElTag size="small" :type="profile?.email ? 'success' : 'warning'">
                {{ profile?.email ? t('common.success') : t('common.warning') }}
              </ElTag>
            </article>
            <article class="simple-item">
              <div>
                <h4>{{ t('profile.phoneBound') }}</h4>
                <p>{{ profile?.phone || t('profile.notSet') }}</p>
              </div>
              <ElTag size="small" :type="profile?.phone ? 'success' : 'warning'">
                {{ profile?.phone ? t('common.success') : t('common.warning') }}
              </ElTag>
            </article>
            <article class="simple-item">
              <div>
                <h4>{{ t('profile.passwordSecurity') }}</h4>
                <p>{{ t('profile.passwordSecurityHint') }}</p>
              </div>
              <ElButton size="small" :icon="Lock" @click="openPasswordModal">
                {{ t('profile.changePassword') }}
              </ElButton>
            </article>
          </div>
        </ElCard>
      </section>
    </section>

    <!-- 修改密码弹窗 -->
    <ElDialog
      v-model="showPasswordModal"
      :title="t('profile.changePassword')"
      width="400px"
      :close-on-click-modal="false"
    >
      <ElAlert
        v-if="passwordError"
        :title="passwordError"
        type="error"
        show-icon
        class="password-error"
      />

      <ElForm label-position="top">
        <ElFormItem :label="t('profile.currentPassword')">
          <ElInput
            v-model="passwordForm.currentPassword"
            type="password"
            :placeholder="t('profile.currentPasswordPlaceholder')"
            show-password
          />
        </ElFormItem>
        <ElFormItem :label="t('profile.newPassword')">
          <ElInput
            v-model="passwordForm.newPassword"
            type="password"
            :placeholder="t('profile.newPasswordPlaceholder')"
            show-password
          />
        </ElFormItem>
        <ElFormItem :label="t('profile.confirmNewPassword')">
          <ElInput
            v-model="passwordForm.confirmPassword"
            type="password"
            :placeholder="t('profile.confirmNewPasswordPlaceholder')"
            show-password
          />
          <small
            v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword"
            class="password-mismatch"
          >
            {{ t('profile.passwordMismatch') }}
          </small>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElSpace>
          <ElButton @click="showPasswordModal = false">
            {{ t('common.cancel') }}
          </ElButton>
          <ElButton
            type="primary"
            :disabled="!isPasswordFormValid"
            :loading="isChangingPassword"
            @click="changePassword"
          >
            {{ isChangingPassword ? t('profile.changing') : t('profile.confirmChange') }}
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.profile-page {
  max-width: 1360px;
  margin: 0 auto;
  padding: $space-6;

  .message-alert {
    margin-bottom: $space-4;
  }

  .profile-card {
    @include card-base;
    border-radius: $radius-lg;

    .profile-header {
      display: flex;
      align-items: center;
      gap: $space-5;

      .profile-avatar {
        background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
        border: 1px solid var(--border-muted);
        color: var(--accent-primary);
        font-size: 32px;
        font-weight: $font-weight-semibold;
      }

      .profile-info {
        display: flex;
        flex-direction: column;
        gap: $space-2;

        .profile-name {
          margin: 0;
          font-size: 24px;
          font-weight: $font-weight-medium;
          color: var(--text-primary);
        }
      }
    }

    .profile-details {
      padding: $space-4 0;
    }

    .profile-actions {
      display: flex;
      justify-content: flex-end;
    }
  }

  .workspace-section {
    margin-top: $space-5;
  }

  .workspace-tabs {
    display: flex;
    gap: $space-2;
    overflow-x: auto;
    padding-bottom: $space-2;
    margin-bottom: $space-4;
    scrollbar-width: thin;
    @include scrollbar-themed;
  }

  .workspace-tab {
    border: 1px solid var(--border-subtle);
    border-radius: 999px;
    background: rgba(var(--bg-secondary-rgb), 0.65);
    color: var(--text-secondary);
    font-size: $font-size-sm;
    padding: $space-2 $space-4;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(var(--accent-primary-rgb), 0.42);
      color: var(--text-primary);
    }

    &.active {
      color: var(--accent-primary);
      border-color: rgba(var(--accent-primary-rgb), 0.5);
      background: rgba(var(--accent-primary-rgb), 0.12);
    }
  }

  .profile-analytics,
  .profile-roleboard {
    margin-top: $space-5;
  }

  .profile-analytics {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: $space-4;
  }

  .profile-roleboard {
    display: grid;
    grid-template-columns: 1fr;
    gap: $space-4;
  }

  .analytics-card {
    @include card-base;
    border-radius: $radius-lg;
    background: rgba(var(--bg-secondary-rgb), 0.86);
  }

  .analytics-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
  }

  .analytics-title {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: var(--text-primary);
  }

  .analytics-subtitle {
    margin: $space-1 0 0;
    font-size: $font-size-sm;
    color: var(--text-muted);
  }

  .snapshot-list {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin-bottom: $space-3;
  }

  .snapshot-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    background: rgba(var(--bg-primary-rgb), 0.58);
    padding: $space-3;
    color: var(--text-secondary);

    strong {
      color: var(--text-primary);
      font-size: $font-size-lg;
    }
  }

  .quick-actions {
    h4 {
      margin: 0 0 $space-2;
      color: var(--text-primary);
      font-size: $font-size-base;
    }
  }

  .quick-actions-row {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $space-3;
    margin-bottom: $space-4;
  }

  .metric-item {
    display: flex;
    align-items: center;
    gap: $space-3;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    background: rgba(var(--bg-primary-rgb), 0.6);
    padding: $space-3;
  }

  .metric-icon {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: var(--accent-primary);
    background: rgba(var(--accent-primary-rgb), 0.14);
    border: 1px solid rgba(var(--accent-primary-rgb), 0.24);
  }

  .metric-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .metric-label {
    font-size: $font-size-sm;
    color: var(--text-secondary);
  }

  .metric-value {
    font-size: $font-size-lg;
    color: var(--text-primary);
    font-weight: $font-weight-semibold;
  }

  .metric-bars {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .metric-row {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .metric-row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-secondary);
    font-size: $font-size-sm;

    strong {
      color: var(--text-primary);
    }
  }

  .metric-track {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: rgba(var(--bg-primary-rgb), 0.7);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
  }

  .metric-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent-primary), rgba(var(--accent-primary-rgb), 0.35));
  }

  .split-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $space-4;
  }

  .list-title {
    margin: 0 0 $space-2;
    color: var(--text-primary);
    font-size: $font-size-base;
  }

  .simple-list {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .simple-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    background: rgba(var(--bg-primary-rgb), 0.58);
    padding: $space-3;

    h4 {
      margin: 0;
      color: var(--text-primary);
      font-size: $font-size-base;
    }

    p {
      margin: $space-1 0 0;
      color: var(--text-secondary);
      font-size: $font-size-sm;
    }
  }

  .simple-item-tail {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  .filter-select {
    width: 160px;
  }

  .coupon-actions {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  .notice-list {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }

  .notice-item {
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    background: rgba(var(--bg-primary-rgb), 0.6);
    padding: $space-3;

    header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: $space-2;
      margin-bottom: $space-2;
    }

    h4 {
      margin: 0;
      font-size: $font-size-base;
      color: var(--text-primary);
    }

    time {
      color: var(--text-muted);
      font-size: $font-size-sm;
      white-space: nowrap;
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: $font-size-sm;
      line-height: 1.5;
    }
  }

  @media (max-width: 1080px) {
    .profile-analytics {
      grid-template-columns: 1fr;
    }

    .split-list {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 700px) {
    padding: $space-4;

    .profile-card {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
    }

    .profile-analytics,
    .profile-roleboard {
      margin-top: $space-4;
    }

    .profile-analytics {
      .analytics-head {
        flex-direction: column;
        align-items: flex-start;
      }

      .metric-grid {
        grid-template-columns: 1fr;
      }
    }

    .profile-roleboard {
      .analytics-head {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  }
}

.password-error {
  margin-bottom: $space-4;
}

.password-mismatch {
  color: var(--error);
  font-size: $font-size-sm;
  margin-top: $space-1;
}
</style>
