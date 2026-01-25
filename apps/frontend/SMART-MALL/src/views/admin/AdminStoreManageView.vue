<script setup lang="ts">
/**
 * 管理员店铺管理视图
 * 管理员查看和管理所有店铺的页面
 */
import { ref, computed, onMounted, watch } from 'vue'
import { FilterBar, MessageAlert, StatusBadge, ActionButton, ConfirmModal } from '@/components'
import { useMessage, useFormatters, useStatusConfig } from '@/composables'
import { storeApi } from '@/api'
import type { StoreDTO, StoreQueryRequest } from '@/api/store.api'

// ============================================================================
// Composables
// ============================================================================

const { message, success, error } = useMessage()
const { formatDate } = useFormatters()
const { getStatusText, getStatusClass } = useStatusConfig('store')

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stores = ref<StoreDTO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const filters = ref<StoreQueryRequest>({
  status: '',
  category: '',
  keyword: '',
})

const isProcessing = ref(false)
const showCloseDialog = ref(false)
const closeTarget = ref<StoreDTO | null>(null)

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

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    const response = await storeApi.getAllStores(filters.value, currentPage.value, pageSize.value)
    stores.value = response.records
    total.value = response.total
  } catch (e) {
    error('加载数据失败')
  } finally {
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
  if (store.status !== 'PENDING') return
  
  isProcessing.value = true
  try {
    await storeApi.approveStore(store.storeId)
    store.status = 'ACTIVE'
    success('店铺审批通过')
  } catch (e: any) {
    error(e.message || '审批失败')
  } finally {
    isProcessing.value = false
  }
}

function openCloseDialog(store: StoreDTO) {
  closeTarget.value = store
  showCloseDialog.value = true
}

async function confirmCloseStore(reason: string) {
  if (!closeTarget.value) return
  
  isProcessing.value = true
  try {
    await storeApi.closeStore(closeTarget.value.storeId, reason)
    closeTarget.value.status = 'CLOSED'
    closeTarget.value.closeReason = reason
    showCloseDialog.value = false
    success('店铺已关闭')
  } catch (e: any) {
    error(e.message || '关闭失败')
  } finally {
    isProcessing.value = false
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(loadData)

watch([() => filters.value.status, () => filters.value.category], handleSearch)
</script>

<template>
  <main class="admin-store-page">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" />

    <!-- 筛选栏 -->
    <FilterBar :total="total" total-label="家店铺">
      <select v-model="filters.status" class="select">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select v-model="filters.category" class="select">
        <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <input 
        v-model="filters.keyword" 
        type="text" 
        class="input search-input" 
        placeholder="搜索店铺名称..."
        @keyup.enter="handleSearch"
      />
      <button class="btn btn-primary" @click="handleSearch">搜索</button>
    </FilterBar>

    <!-- 店铺列表 -->
    <section class="store-table-container">
      <div v-if="isLoading" class="loading">加载中...</div>
      
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
                <div class="store-avatar">{{ store.name.charAt(0) }}</div>
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

      <div v-else class="empty">暂无店铺数据</div>
    </section>

    <!-- 分页 -->
    <nav v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage === 1" @click="handlePageChange(currentPage - 1)">上一页</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="handlePageChange(currentPage + 1)">下一页</button>
    </nav>

    <!-- 关闭店铺对话框 -->
    <ConfirmModal
      v-model:visible="showCloseDialog"
      title="关闭店铺"
      confirm-text="确认关闭"
      confirm-variant="danger"
      require-reason
      reason-label="关闭原因"
      reason-placeholder="请输入关闭原因"
      :processing="isProcessing"
      @confirm="confirmCloseStore"
    >
      <p class="warning-text">确定要关闭店铺「{{ closeTarget?.name }}」吗？此操作不可撤销。</p>
    </ConfirmModal>
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
  width: 200px;
}

.btn {
  @include btn-base;
  padding: $space-2 + 2 $space-5;

  &-primary {
    @include btn-primary;
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
.pagination {
  @include pagination;
  padding: $space-4;

  .page-btn {
    @include pagination-btn;
    background: $color-bg-tertiary;
    border: 1px solid $color-border-muted;
  }

  .page-info {
    @include pagination-info;
  }
}

.warning-text {
  color: $color-error;
  font-size: $font-size-base;
  margin: 0;
}
</style>
