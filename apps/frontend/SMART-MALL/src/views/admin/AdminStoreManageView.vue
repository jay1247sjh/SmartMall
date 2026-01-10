<script setup lang="ts">
/**
 * 管理员店铺管理视图
 *
 * 管理员查看和管理所有店铺的页面。
 *
 * 业务职责：
 * - 展示所有店铺列表（分页）
 * - 按状态、分类筛选店铺
 * - 审批待审核店铺
 * - 关闭违规店铺
 */
import { ref, computed, onMounted, watch } from 'vue'
import { storeApi } from '@/api'
import type { StoreDTO, StoreQueryRequest } from '@/api/store.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stores = ref<StoreDTO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选条件
const filters = ref<StoreQueryRequest>({
  status: '',
  category: '',
  keyword: '',
})

// 操作状态
const isProcessing = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// 关闭店铺对话框
const showCloseDialog = ref(false)
const closeTarget = ref<StoreDTO | null>(null)
const closeReason = ref('')

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
    console.error('加载数据失败:', e)
    showMessage('error', '加载数据失败')
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
    showMessage('success', '店铺审批通过')
  } catch (e: any) {
    showMessage('error', e.message || '审批失败')
  } finally {
    isProcessing.value = false
  }
}

function openCloseDialog(store: StoreDTO) {
  closeTarget.value = store
  closeReason.value = ''
  showCloseDialog.value = true
}

async function confirmCloseStore() {
  if (!closeTarget.value || !closeReason.value.trim()) {
    showMessage('error', '请输入关闭原因')
    return
  }
  
  isProcessing.value = true
  try {
    await storeApi.closeStore(closeTarget.value.storeId, closeReason.value)
    closeTarget.value.status = 'CLOSED'
    closeTarget.value.closeReason = closeReason.value
    showCloseDialog.value = false
    showMessage('success', '店铺已关闭')
  } catch (e: any) {
    showMessage('error', e.message || '关闭失败')
  } finally {
    isProcessing.value = false
  }
}

function showMessage(type: 'success' | 'error', text: string) {
  message.value = { type, text }
  setTimeout(() => { message.value = null }, 3000)
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'status-active',
    INACTIVE: 'status-inactive',
    PENDING: 'status-pending',
    CLOSED: 'status-closed',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: '营业中',
    INACTIVE: '暂停营业',
    PENDING: '待审批',
    CLOSED: '已关闭',
  }
  return map[status] || status
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadData()
})

watch([() => filters.value.status, () => filters.value.category], () => {
  handleSearch()
})
</script>

<template>
  <div class="admin-store-page">
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', message.type]">
      <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
      {{ message.text }}
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <select v-model="filters.status" class="select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <select v-model="filters.category" class="select">
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <input 
          v-model="filters.keyword" 
          type="text" 
          class="input search-input" 
          placeholder="搜索店铺名称..."
          @keyup.enter="handleSearch"
        />
        <button class="btn btn-primary" @click="handleSearch">搜索</button>
      </div>
      <div class="filter-info">
        共 {{ total }} 家店铺
      </div>
    </div>

    <!-- 店铺列表 -->
    <div class="store-table-container">
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
                <div class="store-avatar-sm">{{ store.name.charAt(0) }}</div>
                <span>{{ store.name }}</span>
              </div>
            </td>
            <td>{{ store.merchantName }}</td>
            <td>{{ store.floorName }} · {{ store.areaName }}</td>
            <td>{{ store.category }}</td>
            <td>
              <span :class="['status-tag', getStatusClass(store.status)]">
                {{ getStatusText(store.status) }}
              </span>
            </td>
            <td>{{ formatDate(store.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button 
                  v-if="store.status === 'PENDING'"
                  class="btn-action btn-approve"
                  :disabled="isProcessing"
                  @click="approveStore(store)"
                >
                  通过
                </button>
                <button 
                  v-if="store.status !== 'CLOSED'"
                  class="btn-action btn-close"
                  :disabled="isProcessing"
                  @click="openCloseDialog(store)"
                >
                  关闭
                </button>
                <span v-if="store.status === 'CLOSED'" class="text-muted">
                  已关闭
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty">暂无店铺数据</div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="handlePageChange(currentPage - 1)"
      >上一页</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="handlePageChange(currentPage + 1)"
      >下一页</button>
    </div>

    <!-- 关闭店铺对话框 -->
    <div v-if="showCloseDialog" class="dialog-overlay" @click.self="showCloseDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>关闭店铺</h3>
          <button class="dialog-close" @click="showCloseDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <p class="warning-text">
            确定要关闭店铺「{{ closeTarget?.name }}」吗？此操作不可撤销。
          </p>
          <div class="form-item">
            <label>关闭原因 *</label>
            <textarea 
              v-model="closeReason" 
              class="textarea" 
              rows="3" 
              placeholder="请输入关闭原因"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showCloseDialog = false">取消</button>
          <button class="btn btn-danger" :disabled="isProcessing" @click="confirmCloseStore">
            {{ isProcessing ? '处理中...' : '确认关闭' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-store-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

/* Message */
.message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.message.success {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.2);
}

.message.error {
  background: rgba(242, 139, 130, 0.1);
  color: #f28b82;
  border: 1px solid rgba(242, 139, 130, 0.2);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-info {
  font-size: 14px;
  color: #9aa0a6;
}

.select,
.input {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: #e8eaed;
}

.select:focus,
.input:focus {
  outline: none;
  border-color: #60a5fa;
}

.search-input {
  width: 200px;
}

/* Store Table */
.store-table-container {
  flex: 1;
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #5f6368;
  font-size: 14px;
}

.store-table {
  width: 100%;
  border-collapse: collapse;
}

.store-table th,
.store-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.store-table th {
  font-size: 13px;
  font-weight: 500;
  color: #9aa0a6;
  background: rgba(255, 255, 255, 0.02);
}

.store-table td {
  font-size: 14px;
  color: #e8eaed;
}

.store-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.store-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

/* Status Tag */
.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.status-active {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-tag.status-inactive {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.status-tag.status-pending {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.status-tag.status-closed {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.btn-approve:hover:not(:disabled) {
  background: rgba(52, 211, 153, 0.25);
}

.btn-close {
  background: rgba(242, 139, 130, 0.15);
  color: #f28b82;
}

.btn-close:hover:not(:disabled) {
  background: rgba(242, 139, 130, 0.25);
}

.text-muted {
  color: #5f6368;
  font-size: 12px;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

.page-btn {
  padding: 8px 16px;
  border-radius: 6px;
  background: #1a1a1c;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #e8eaed;
  font-size: 13px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
}

.page-info {
  font-size: 14px;
  color: #9aa0a6;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #9aa0a6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
}

.btn-primary {
  background: #60a5fa;
  color: #0a0a0a;
}

.btn-primary:hover:not(:disabled) {
  background: #93c5fd;
}

.btn-danger {
  background: #f28b82;
  color: #0a0a0a;
}

.btn-danger:hover:not(:disabled) {
  background: #f5a9a3;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #1a1a1c;
  border-radius: 12px;
  width: 420px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #e8eaed;
}

.dialog-close {
  background: none;
  border: none;
  color: #9aa0a6;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.dialog-close:hover {
  color: #e8eaed;
}

.dialog-body {
  padding: 24px;
}

.warning-text {
  color: #f28b82;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: #9aa0a6;
}

.textarea {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e8eaed;
  font-family: inherit;
  resize: vertical;
}

.textarea:focus {
  outline: none;
  border-color: #60a5fa;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
