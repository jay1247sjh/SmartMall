<script setup lang="ts">
import type { StoreDTO } from '@/api/store.api'
/**
 * 管理员店铺管理视图
 * 管理员查看和管理所有店铺的页面
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeApi } from '@/api'
import { ActionButton, CustomSelect, FilterBar, InlinePagination, MessageAlert, StatusBadge } from '@/components'
import { useFormatters, useMessage } from '@/composables'

// ============================================================================
// Composables
// ============================================================================

const { message, success, error } = useMessage()
const { t } = useI18n()
const { formatDate } = useFormatters()
const route = useRoute()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stores = ref<StoreDTO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const VALID_STATUS_VALUES = new Set(['', 'PENDING', 'ACTIVE', 'INACTIVE', 'CLOSED'])
const STATUS_META = {
  '': {
    descriptionKey: 'admin.storeManagePage.hero.descAll',
    statsLabelKey: 'admin.storeManagePage.hero.statsAll',
  },
  'PENDING': {
    descriptionKey: 'admin.storeManagePage.hero.descPending',
    statsLabelKey: 'admin.storeManagePage.hero.statsPending',
  },
  'ACTIVE': {
    descriptionKey: 'admin.storeManagePage.hero.descActive',
    statsLabelKey: 'admin.storeManagePage.hero.statsActive',
  },
  'INACTIVE': {
    descriptionKey: 'admin.storeManagePage.hero.descInactive',
    statsLabelKey: 'admin.storeManagePage.hero.statsInactive',
  },
  'CLOSED': {
    descriptionKey: 'admin.storeManagePage.hero.descClosed',
    statsLabelKey: 'admin.storeManagePage.hero.statsClosed',
  },
} as const

function normalizeStatusQuery(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  const normalized = value.toUpperCase()
  return VALID_STATUS_VALUES.has(normalized) ? normalized : ''
}

const routeStatus = computed(() => normalizeStatusQuery(route.query.status))

const filters = ref<{
  status: string
  category: string
  keyword: string
}>({
  status: routeStatus.value,
  category: '',
  keyword: '',
})

const isProcessing = ref(false)
const closeTarget = ref<StoreDTO | null>(null)
const closeReason = ref('')
const closeReasonError = ref('')

// ============================================================================
// Computed
// ============================================================================

const statusOptions = computed(() => [
  { value: '', label: t('admin.storeManagePage.filters.allStatus') },
  { value: 'PENDING', label: t('admin.storeManagePage.filters.statusPending') },
  { value: 'ACTIVE', label: t('admin.storeManagePage.filters.statusActive') },
  { value: 'INACTIVE', label: t('admin.storeManagePage.filters.statusInactive') },
  { value: 'CLOSED', label: t('admin.storeManagePage.filters.statusClosed') },
])

const categoryOptions = computed(() => [
  { value: '', label: t('admin.storeManagePage.filters.allCategory') },
  { value: '餐饮', label: t('admin.storeManagePage.category.catering') },
  { value: '零售', label: t('admin.storeManagePage.category.retail') },
  { value: '服装', label: t('admin.storeManagePage.category.clothing') },
  { value: '娱乐', label: t('admin.storeManagePage.category.entertainment') },
  { value: '服务', label: t('admin.storeManagePage.category.service') },
  { value: '其他', label: t('admin.storeManagePage.category.other') },
])

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const currentStatusMeta = computed(() => STATUS_META[filters.value.status as keyof typeof STATUS_META] || STATUS_META[''])

function getCategoryLabel(category: string): string {
  return categoryOptions.value.find(option => option.value === category)?.label || category
}

const heroDescription = computed(() => {
  const description = t(currentStatusMeta.value.descriptionKey)
  const segments: string[] = []
  if (filters.value.category) {
    segments.push(t('admin.storeManagePage.hero.categorySegment', { category: getCategoryLabel(filters.value.category) }))
  }
  const keyword = filters.value.keyword?.trim()
  if (keyword) {
    segments.push(t('admin.storeManagePage.hero.keywordSegment', { keyword }))
  }
  if (!segments.length) {
    return description
  }
  return t('admin.storeManagePage.hero.descWithFilters', {
    description,
    filters: segments.join(t('admin.storeManagePage.hero.segmentSeparator')),
  })
})

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    const response = await storeApi.getAllStores(filters.value, currentPage.value, pageSize.value)
    stores.value = response.records
    total.value = response.total
  }
  catch {
    error(t('admin.storeManagePage.message.loadDataFailed'))
  }
  finally {
    isLoading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleReset() {
  const nextStatus = routeStatus.value
  const statusChanged = filters.value.status !== nextStatus
  const categoryChanged = !!filters.value.category
  const keywordChanged = !!filters.value.keyword?.trim()

  filters.value.status = nextStatus
  filters.value.category = ''
  filters.value.keyword = ''

  if (!statusChanged && !categoryChanged && keywordChanged) {
    handleSearch()
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadData()
}

async function approveStore(store: StoreDTO) {
  if (store.status !== 'PENDING')
    return

  isProcessing.value = true
  try {
    await storeApi.approveStore(store.storeId)
    store.status = 'ACTIVE'
    success(t('admin.storeManagePage.message.approveSuccess'))
  }
  catch (e: unknown) {
    error(getErrorMessage(e, t('admin.storeManagePage.message.approveFailed')))
  }
  finally {
    isProcessing.value = false
  }
}

function openCloseDialog(store: StoreDTO) {
  closeTarget.value = store
  closeReason.value = ''
  closeReasonError.value = ''
}

function cancelCloseStore() {
  closeTarget.value = null
  closeReason.value = ''
  closeReasonError.value = ''
}

async function confirmCloseStore() {
  if (!closeTarget.value)
    return
  const reason = closeReason.value.trim()
  if (!reason) {
    closeReasonError.value = t('admin.storeManagePage.closePanel.reasonRequired')
    return
  }

  isProcessing.value = true
  try {
    await storeApi.closeStore(closeTarget.value.storeId, reason)
    closeTarget.value.status = 'CLOSED'
    closeTarget.value.closeReason = reason
    success(t('admin.storeManagePage.message.closeSuccess', { name: closeTarget.value.name }))
    cancelCloseStore()
  }
  catch (e: unknown) {
    error(getErrorMessage(e, t('admin.storeManagePage.message.closeFailed')))
  }
  finally {
    isProcessing.value = false
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(loadData)

watch([() => filters.value.status, () => filters.value.category], handleSearch)

watch(
  () => closeReason.value,
  (value) => {
    if (value.trim()) {
      closeReasonError.value = ''
    }
  },
)

watch(routeStatus, (nextStatus) => {
  if (filters.value.status !== nextStatus) {
    filters.value.status = nextStatus
  }
})
</script>

<template>
  <main class="admin-store-page">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" />

    <section class="page-hero">
      <div class="hero-content">
        <h2>{{ t('admin.storeManagePage.title') }}</h2>
        <p>{{ heroDescription }}</p>
      </div>
      <div class="hero-stats">
        <span class="stats-value">{{ total }}</span>
        <span class="stats-label">{{ t(currentStatusMeta.statsLabelKey) }}</span>
      </div>
    </section>

    <!-- 筛选栏 -->
    <FilterBar class="toolbar">
      <CustomSelect
        v-model="filters.status"
        :options="statusOptions"
        :placeholder="t('admin.storeManagePage.filters.allStatus')"
      />
      <CustomSelect
        v-model="filters.category"
        :options="categoryOptions"
        :placeholder="t('admin.storeManagePage.filters.allCategory')"
      />
      <template #actions>
        <input
          v-model="filters.keyword"
          type="text"
          class="input search-input"
          :placeholder="t('admin.storeManagePage.filters.keywordPlaceholder')"
          @keyup.enter="handleSearch"
        >
        <button class="btn btn-secondary" @click="handleReset">
          {{ t('admin.storeManagePage.filters.reset') }}
        </button>
        <button class="btn btn-primary" @click="handleSearch">
          {{ t('admin.storeManagePage.filters.search') }}
        </button>
        <div class="toolbar-stats">
          {{ t('admin.storeManagePage.filters.total', { total }) }}
        </div>
      </template>
    </FilterBar>

    <section v-if="closeTarget" class="close-panel">
      <p class="close-panel-title">
        {{ t('admin.storeManagePage.closePanel.title', { name: closeTarget.name }) }}
      </p>
      <p class="close-panel-desc">
        {{ t('admin.storeManagePage.closePanel.desc') }}
      </p>
      <div class="close-panel-actions">
        <input
          v-model="closeReason"
          type="text"
          class="input close-reason-input"
          :placeholder="t('admin.storeManagePage.closePanel.reasonPlaceholder')"
          :disabled="isProcessing"
          @keyup.enter="confirmCloseStore"
        >
        <button class="btn btn-danger" :disabled="isProcessing" @click="confirmCloseStore">
          {{ isProcessing ? t('admin.storeManagePage.closePanel.processing') : t('admin.storeManagePage.closePanel.confirm') }}
        </button>
        <button class="btn btn-secondary" :disabled="isProcessing" @click="cancelCloseStore">
          {{ t('admin.storeManagePage.closePanel.cancel') }}
        </button>
      </div>
      <p v-if="closeReasonError" class="close-panel-error">
        {{ closeReasonError }}
      </p>
    </section>

    <!-- 店铺列表 -->
    <section class="store-table-container">
      <div v-if="isLoading" class="loading">
        {{ t('admin.storeManagePage.table.loading') }}
      </div>

      <table v-else-if="stores.length > 0" class="store-table">
        <thead>
          <tr>
            <th>{{ t('admin.storeManagePage.table.storeName') }}</th>
            <th>{{ t('admin.storeManagePage.table.merchant') }}</th>
            <th>{{ t('admin.storeManagePage.table.location') }}</th>
            <th>{{ t('admin.storeManagePage.table.category') }}</th>
            <th>{{ t('admin.storeManagePage.table.status') }}</th>
            <th>{{ t('admin.storeManagePage.table.createdAt') }}</th>
            <th>{{ t('admin.storeManagePage.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="store in stores" :key="store.storeId">
            <td>
              <div class="store-name-cell">
                <div class="store-avatar">
                  {{ store.name.charAt(0) }}
                </div>
                <span>{{ store.name }}</span>
              </div>
            </td>
            <td>{{ store.merchantName }}</td>
            <td>{{ store.floorName }} · {{ store.areaName }}</td>
            <td>{{ getCategoryLabel(store.category) }}</td>
            <td><StatusBadge :status="store.status" domain="store" /></td>
            <td><time :datetime="store.createdAt">{{ formatDate(store.createdAt) }}</time></td>
            <td>
              <nav class="action-btns">
                <ActionButton v-if="store.status === 'PENDING'" variant="approve" :disabled="isProcessing" @click="approveStore(store)">
                  {{ t('admin.storeManagePage.table.approve') }}
                </ActionButton>
                <ActionButton v-if="store.status !== 'CLOSED'" variant="reject" :disabled="isProcessing" @click="openCloseDialog(store)">
                  {{ t('admin.storeManagePage.table.close') }}
                </ActionButton>
                <span v-if="store.status === 'CLOSED'" class="text-muted">{{ t('admin.storeManagePage.table.closed') }}</span>
              </nav>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty">
        {{ t('admin.storeManagePage.table.empty') }}
      </div>
    </section>

    <!-- 分页 -->
    <InlinePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :disabled="isLoading"
      @change="handlePageChange"
    />
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.admin-store-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  height: 100%;
}

.page-hero {
  @include card-base;
  @include flex-between;
  gap: $space-4;
  padding: $space-5;
  border: none;
  background:
    linear-gradient(
      120deg,
      rgba(var(--accent-primary-rgb), 0.14) 0%,
      rgba(var(--accent-primary-rgb), 0.03) 45%,
      transparent 100%
    ),
    var(--bg-secondary);

  .hero-content {
    @include flex-column;
    gap: $space-1;

    h2 {
      margin: 0;
      font-size: $font-size-2xl;
      font-weight: $font-weight-semibold;
      color: var(--text-primary);
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: $font-size-base;
    }
  }

  .hero-stats {
    @include flex-column;
    align-items: flex-end;
    min-width: 112px;

    .stats-value {
      font-size: 30px;
      line-height: 1.1;
      font-weight: $font-weight-semibold;
      color: var(--accent-primary);
    }

    .stats-label {
      font-size: $font-size-sm + 1;
      color: var(--text-secondary);
    }
  }
}

.toolbar {
  justify-content: flex-start;

  :deep(.filter-group) {
    gap: $space-3 + 2;
    flex-wrap: nowrap;
    align-items: center;
  }

  :deep(.filter-right) {
    gap: $space-2 + 2;
    padding-left: 0;
    margin-left: $space-2;
  }

  :deep(.custom-select) {
    width: 210px;
    min-width: 210px;
    flex: 0 0 210px;
  }
}

// 表单控件
.select,
.input {
  @include form-control;
}

.search-input {
  width: 230px;
  min-width: 230px;
  max-width: 230px;
  flex: 0 0 230px;
}

.btn {
  @include btn-base;

  height: 34px;
  padding: $space-1 + 2 $space-4;

  min-width: 92px;

  white-space: nowrap;

  &-primary {
    @include btn-primary;
  }

  &-secondary {
    @include btn-secondary;
  }

  &-danger {
    @include btn-danger;
  }
}

.toolbar :deep(.filter-right > .btn) {
  height: 30px;
  min-width: 76px;
  padding: 0 $space-4;
  font-size: $font-size-sm;
}

.toolbar-stats {
  margin-left: $space-1;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  white-space: nowrap;
}

.close-panel {
  @include card-base;

  padding: $space-4 $space-5;

  border-color: rgba(var(--error-rgb), 0.25);

  background: rgba(var(--error-rgb), 0.06);

  .close-panel-title {
    margin: 0;

    font-size: $font-size-lg;

    font-weight: $font-weight-semibold;

    color: var(--text-primary);
  }

  .close-panel-desc {
    margin: $space-2 0 0;

    color: var(--text-secondary);

    font-size: $font-size-base;
  }

  .close-panel-actions {
    margin-top: $space-4;

    display: flex;

    gap: $space-3;

    align-items: center;

    flex-wrap: wrap;
  }

  .close-reason-input {
    min-width: 280px;

    flex: 1;
  }

  .close-panel-error {
    margin: $space-2 0 0;

    color: var(--error);

    font-size: $font-size-sm + 1;
  }
}

// 店铺表格
.store-table-container {
  @include table-container;
}

.loading,
.empty {
  @include table-empty-state;
}

.store-table {
  @include table-base;
}

.store-name-cell {
  @include flex-center-y;
  gap: $space-2 + 2;

  .store-avatar {
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    background: $gradient-admin;
    @include flex-center;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: white;
    flex-shrink: 0;
  }
}

.action-btns {
  @include action-btns;
}

.text-muted {
  @include text-muted;
  font-size: $font-size-sm;
}

// 分页
</style>
