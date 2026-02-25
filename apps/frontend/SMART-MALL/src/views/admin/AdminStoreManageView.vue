<script setup lang="ts">
import type { StoreDTO, StoreQueryRequest } from '@/api/store.api'
/**
 * 管理员店铺管理视图
 * 管理员查看和管理所有店铺的页面
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeApi } from '@/api'
import { ActionButton, CustomSelect, FilterBar, InlinePagination, MessageAlert, StatusBadge } from '@/components'
import { useFormatters, useMessage } from '@/composables'

// ============================================================================
// Composables
// ============================================================================

const { message, success, error } = useMessage()
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

function normalizeStatusQuery(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  const normalized = value.toUpperCase()
  return VALID_STATUS_VALUES.has(normalized) ? normalized : ''
}

const filters = ref<StoreQueryRequest>({
  status: normalizeStatusQuery(route.query.status),
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

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'PENDING', label: '待审批' },
  { value: 'ACTIVE', label: '营业中' },
  { value: 'INACTIVE', label: '暂停营业' },
  { value: 'CLOSED', label: '已关闭' },
]

const categoryOptions = [
  { value: '', label: '全部分类' },
  { value: '餐饮', label: '餐饮' },
  { value: '零售', label: '零售' },
  { value: '服装', label: '服装' },
  { value: '娱乐', label: '娱乐' },
  { value: '服务', label: '服务' },
  { value: '其他', label: '其他' },
]

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

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
    error('加载数据失败')
  }
  finally {
    isLoading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
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
    success('店铺审批通过')
  }
  catch (e: unknown) {
    error(getErrorMessage(e, '审批失败'))
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
    closeReasonError.value = '请输入关闭原因'
    return
  }

  isProcessing.value = true
  try {
    await storeApi.closeStore(closeTarget.value.storeId, reason)
    closeTarget.value.status = 'CLOSED'
    closeTarget.value.closeReason = reason
    success(`店铺「${closeTarget.value.name}」已关闭`)
    cancelCloseStore()
  }
  catch (e: unknown) {
    error(getErrorMessage(e, '关闭失败'))
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

watch(
  () => route.query.status,
  (value) => {
    const nextStatus = normalizeStatusQuery(value)
    if (filters.value.status !== nextStatus) {
      filters.value.status = nextStatus
    }
  },
)
</script>

<template>
  <main class="admin-store-page">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" />

    <!-- 筛选栏 -->
    <FilterBar :total="total" total-label="家店铺">
      <CustomSelect v-model="filters.status" :options="statusOptions" placeholder="全部状态" />
      <CustomSelect v-model="filters.category" :options="categoryOptions" placeholder="全部分类" />
      <input
        v-model="filters.keyword"
        type="text"
        class="input search-input"
        placeholder="搜索店铺名称..."
        @keyup.enter="handleSearch"
      >
      <button class="btn btn-primary" @click="handleSearch">
        搜索
      </button>
    </FilterBar>

    <section v-if="closeTarget" class="close-panel">
      <p class="close-panel-title">
        关闭店铺「{{ closeTarget.name }}」
      </p>
      <p class="close-panel-desc">
        此操作会将店铺状态变更为已关闭，请填写关闭原因后确认。
      </p>
      <div class="close-panel-actions">
        <input
          v-model="closeReason"
          type="text"
          class="input close-reason-input"
          placeholder="请输入关闭原因"
          :disabled="isProcessing"
          @keyup.enter="confirmCloseStore"
        >
        <button class="btn btn-danger" :disabled="isProcessing" @click="confirmCloseStore">
          {{ isProcessing ? '处理中...' : '确认关闭' }}
        </button>
        <button class="btn btn-secondary" :disabled="isProcessing" @click="cancelCloseStore">
          取消
        </button>
      </div>
      <p v-if="closeReasonError" class="close-panel-error">
        {{ closeReasonError }}
      </p>
    </section>

    <!-- 店铺列表 -->
    <section class="store-table-container">
      <div v-if="isLoading" class="loading">
        加载中...
      </div>

      <table v-else-if="stores.length > 0" class="store-table">
        <thead>
          <tr>
            <th>店铺名称</th>
            <th>商家</th>
            <th>位置</th>
            <th>分类</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
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
            <td>{{ store.category }}</td>
            <td><StatusBadge :status="store.status" domain="store" /></td>
            <td><time :datetime="store.createdAt">{{ formatDate(store.createdAt) }}</time></td>
            <td>
              <nav class="action-btns">
                <ActionButton v-if="store.status === 'PENDING'" variant="approve" :disabled="isProcessing" @click="approveStore(store)">
                  通过
                </ActionButton>
                <ActionButton v-if="store.status !== 'CLOSED'" variant="reject" :disabled="isProcessing" @click="openCloseDialog(store)">
                  关闭
                </ActionButton>
                <span v-if="store.status === 'CLOSED'" class="text-muted">已关闭</span>
              </nav>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty">
        暂无店铺数据
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

// 表单控件
.select,
.input {
  @include form-control;
}

.search-input {
  width: 260px;
}

.btn {
  @include btn-base;

  padding: $space-2 + 2 $space-5;

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
