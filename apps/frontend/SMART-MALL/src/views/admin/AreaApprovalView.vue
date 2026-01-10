<script setup lang="ts">
/**
 * 区域审批页面
 * 管理员审批商家的区域申请
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable, Modal, CustomSelect } from '@/components'
import { areaPermissionApi } from '@/api'
import type { AreaApplyDTO } from '@/api/area-permission.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const approvals = ref<AreaApplyDTO[]>([])
const filter = ref({ status: 'ALL' })

// 详情弹窗
const showDetailModal = ref(false)
const selectedApproval = ref<AreaApplyDTO | null>(null)

// 拒绝弹窗
const showRejectModal = ref(false)
const rejectReason = ref('')
const isProcessing = ref(false)

// 操作结果
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const filteredApprovals = computed(() => {
  if (filter.value.status === 'ALL') {
    return approvals.value
  }
  return approvals.value.filter(item => item.status === filter.value.status)
})

const statusOptions = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待审批' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
]

const columns = [
  { key: 'merchantName', title: '商家', minWidth: '100' },
  { key: 'areaName', title: '区域', minWidth: '80' },
  { key: 'floorName', title: '楼层', minWidth: '80' },
  { key: 'applyReason', title: '申请理由', minWidth: '150' },
  { key: 'status', title: '状态', minWidth: '80' },
  { key: 'createdAt', title: '申请时间', minWidth: '120' },
  { key: 'actions', title: '操作', minWidth: '100' },
]

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  
  try {
    approvals.value = await areaPermissionApi.getPendingApplications()
  } catch (e: any) {
    console.error('加载数据失败:', e)
    message.value = { type: 'error', text: e.message || '加载数据失败' }
    setTimeout(() => { message.value = null }, 3000)
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    REJECTED: 'status-rejected',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }
  return map[status] || status
}

function viewDetail(row: AreaApplyDTO) {
  selectedApproval.value = row
  showDetailModal.value = true
}

async function handleApprove(approval: AreaApplyDTO) {
  isProcessing.value = true
  message.value = null
  
  try {
    await areaPermissionApi.approveApplication(approval.applyId)
    
    // 更新本地状态
    const index = approvals.value.findIndex(a => a.applyId === approval.applyId)
    if (index !== -1) {
      approvals.value[index].status = 'APPROVED'
    }
    
    showDetailModal.value = false
    message.value = { type: 'success', text: '审批通过成功' }
    
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '操作失败' }
  } finally {
    isProcessing.value = false
  }
}

function openRejectModal(approval: AreaApplyDTO) {
  selectedApproval.value = approval
  rejectReason.value = ''
  showRejectModal.value = true
}

async function handleReject() {
  if (!selectedApproval.value || !rejectReason.value.trim()) return
  
  isProcessing.value = true
  message.value = null
  
  try {
    await areaPermissionApi.rejectApplication(selectedApproval.value.applyId, rejectReason.value)
    
    // 更新本地状态
    const index = approvals.value.findIndex(a => a.applyId === selectedApproval.value!.applyId)
    if (index !== -1) {
      approvals.value[index].status = 'REJECTED'
      approvals.value[index].rejectReason = rejectReason.value
    }
    
    showRejectModal.value = false
    showDetailModal.value = false
    message.value = { type: 'success', text: '已拒绝该申请' }
    
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '操作失败' }
  } finally {
    isProcessing.value = false
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="approval-page">
      <!-- 消息提示 -->
      <div v-if="message" :class="['message', message.type]">
        <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
        {{ message.text }}
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>状态筛选</label>
          <CustomSelect
            v-model="filter.status"
            :options="statusOptions"
          />
        </div>
        <div class="filter-stats">
          共 {{ filteredApprovals.length }} 条记录
        </div>
      </div>

      <!-- 数据表格 -->
      <DataTable
        :columns="columns"
        :data="filteredApprovals"
        :loading="isLoading"
        empty-text="暂无审批记录"
        @row-click="viewDetail"
      >
        <template #status="{ value }">
          <span :class="['status-badge', getStatusClass(value)]">
            {{ getStatusText(value) }}
          </span>
        </template>
        <template #createdAt="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #applyReason="{ value }">
          <span class="reason-text">{{ value || '-' }}</span>
        </template>
        <template #actions="{ row }">
          <div class="action-btns" @click.stop>
            <button
              v-if="row.status === 'PENDING'"
              class="action-btn approve"
              @click="handleApprove(row)"
            >
              通过
            </button>
            <button
              v-if="row.status === 'PENDING'"
              class="action-btn reject"
              @click="openRejectModal(row)"
            >
              拒绝
            </button>
            <button
              v-if="row.status !== 'PENDING'"
              class="action-btn view"
              @click="viewDetail(row)"
            >
              查看
            </button>
          </div>
        </template>
      </DataTable>

      <!-- 详情弹窗 -->
      <Modal
        v-model:visible="showDetailModal"
        title="申请详情"
        width="500px"
      >
        <div v-if="selectedApproval" class="detail-content">
          <div class="detail-item">
            <label>商家名称</label>
            <span>{{ selectedApproval.merchantName }}</span>
          </div>
          <div class="detail-item">
            <label>申请区域</label>
            <span>{{ selectedApproval.floorName }} - {{ selectedApproval.areaName }}</span>
          </div>
          <div class="detail-item">
            <label>申请理由</label>
            <p class="reason-full">{{ selectedApproval.applyReason || '无' }}</p>
          </div>
          <div class="detail-item">
            <label>申请时间</label>
            <span>{{ formatDate(selectedApproval.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <label>当前状态</label>
            <span :class="['status-badge', getStatusClass(selectedApproval.status)]">
              {{ getStatusText(selectedApproval.status) }}
            </span>
          </div>
          <div v-if="selectedApproval.rejectReason" class="detail-item">
            <label>拒绝理由</label>
            <p class="reason-full reject-reason">{{ selectedApproval.rejectReason }}</p>
          </div>
        </div>

        <template #footer>
          <template v-if="selectedApproval?.status === 'PENDING'">
            <button
              class="btn btn-reject"
              :disabled="isProcessing"
              @click="openRejectModal(selectedApproval!)"
            >
              拒绝
            </button>
            <button
              class="btn btn-approve"
              :disabled="isProcessing"
              @click="handleApprove(selectedApproval!)"
            >
              {{ isProcessing ? '处理中...' : '通过' }}
            </button>
          </template>
          <button v-else class="btn btn-secondary" @click="showDetailModal = false">
            关闭
          </button>
        </template>
      </Modal>

      <!-- 拒绝理由弹窗 -->
      <Modal
        v-model:visible="showRejectModal"
        title="拒绝申请"
        width="400px"
      >
        <div class="reject-form">
          <label>请填写拒绝理由</label>
          <textarea
            v-model="rejectReason"
            class="textarea"
            rows="4"
            placeholder="请输入拒绝理由..."
          ></textarea>
        </div>

        <template #footer>
          <button class="btn btn-secondary" @click="showRejectModal = false">
            取消
          </button>
          <button
            class="btn btn-reject"
            :disabled="!rejectReason.trim() || isProcessing"
            @click="handleReject"
          >
            {{ isProcessing ? '处理中...' : '确认拒绝' }}
          </button>
        </template>
      </Modal>
  </div>
</template>


<style scoped>
.approval-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-size: 14px;
  color: #9aa0a6;
}

.filter-stats {
  font-size: 13px;
  color: #9aa0a6;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.status-approved {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-rejected {
  background: rgba(242, 139, 130, 0.15);
  color: #f28b82;
}

/* Action Buttons */
.action-btns {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.action-btn:hover {
  opacity: 0.8;
}

.action-btn.approve {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.action-btn.reject {
  background: rgba(242, 139, 130, 0.2);
  color: #f28b82;
}

.action-btn.view {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.reason-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Detail Content */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item label {
  font-size: 13px;
  color: #9aa0a6;
}

.detail-item span {
  font-size: 15px;
  color: #e8eaed;
}

.reason-full {
  font-size: 14px;
  color: #e8eaed;
  margin: 0;
  line-height: 1.6;
}

.reject-reason {
  color: #f28b82;
}

/* Reject Form */
.reject-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reject-form label {
  font-size: 14px;
  color: #9aa0a6;
}

.textarea {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e8eaed;
  resize: vertical;
  font-family: inherit;
}

.textarea:focus {
  outline: none;
  border-color: #60a5fa;
}

.textarea::placeholder {
  color: #5f6368;
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

.btn-approve {
  background: #34d399;
  color: #0a0a0a;
}

.btn-approve:hover:not(:disabled) {
  background: #2dd4bf;
}

.btn-reject {
  background: #f28b82;
  color: #0a0a0a;
}

.btn-reject:hover:not(:disabled) {
  background: #fca5a5;
}
</style>
