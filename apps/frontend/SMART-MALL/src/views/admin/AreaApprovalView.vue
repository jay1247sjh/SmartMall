<script setup lang="ts">
/**
 * 区域审批页面
 * 管理员审批商家的区域申请
 */
import { ref, computed, onMounted } from 'vue'
import { 
  DataTable, Modal, CustomSelect, FilterBar, 
  MessageAlert, StatusBadge, ActionButton, ConfirmModal 
} from '@/components'
import { useMessage, useFormatters, useStatusConfig } from '@/composables'
import { areaPermissionApi } from '@/api'
import type { AreaApplyDTO } from '@/api/area-permission.api'

// ============================================================================
// Composables
// ============================================================================

const { message, success, error } = useMessage()
const { formatShortDateTime } = useFormatters()
const { getStatusText, getStatusClass } = useStatusConfig('approval')

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
const isProcessing = ref(false)

// ============================================================================
// Computed
// ============================================================================

const filteredApprovals = computed(() => {
  if (filter.value.status === 'ALL') return approvals.value
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
    error(e.message || '加载数据失败')
  } finally {
    isLoading.value = false
  }
}

function viewDetail(row: AreaApplyDTO) {
  selectedApproval.value = row
  showDetailModal.value = true
}

async function handleApprove(approval: AreaApplyDTO) {
  isProcessing.value = true
  try {
    await areaPermissionApi.approveApplication(approval.applyId)
    
    const index = approvals.value.findIndex(a => a.applyId === approval.applyId)
    if (index !== -1) approvals.value[index].status = 'APPROVED'
    
    showDetailModal.value = false
    success('审批通过成功')
  } catch (e: any) {
    error(e.message || '操作失败')
  } finally {
    isProcessing.value = false
  }
}

function openRejectModal(approval: AreaApplyDTO) {
  selectedApproval.value = approval
  showRejectModal.value = true
}

async function handleReject(reason: string) {
  if (!selectedApproval.value) return
  
  isProcessing.value = true
  try {
    await areaPermissionApi.rejectApplication(selectedApproval.value.applyId, reason)
    
    const index = approvals.value.findIndex(a => a.applyId === selectedApproval.value!.applyId)
    if (index !== -1) {
      approvals.value[index].status = 'REJECTED'
      approvals.value[index].rejectReason = reason
    }
    
    showRejectModal.value = false
    showDetailModal.value = false
    success('已拒绝该申请')
  } catch (e: any) {
    error(e.message || '操作失败')
  } finally {
    isProcessing.value = false
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(loadData)
</script>

<template>
  <main class="approval-page">
    <!-- 消息提示 -->
    <MessageAlert v-if="message" :type="message.type" :text="message.text" />

    <!-- 筛选栏 -->
    <FilterBar :total="filteredApprovals.length">
      <label>状态筛选</label>
      <CustomSelect v-model="filter.status" :options="statusOptions" />
    </FilterBar>

    <!-- 数据表格 -->
    <DataTable
      :columns="columns"
      :data="filteredApprovals"
      :loading="isLoading"
      empty-text="暂无审批记录"
      @row-click="viewDetail"
    >
      <template #status="{ value }">
        <StatusBadge :status="value" domain="approval" />
      </template>
      <template #createdAt="{ value }">
        <time :datetime="value">{{ formatShortDateTime(value) }}</time>
      </template>
      <template #applyReason="{ value }">
        <span class="reason-text">{{ value || '-' }}</span>
      </template>
      <template #actions="{ row }">
        <nav class="action-btns" @click.stop>
          <ActionButton v-if="row.status === 'PENDING'" variant="approve" @click="handleApprove(row)">
            通过
          </ActionButton>
          <ActionButton v-if="row.status === 'PENDING'" variant="reject" @click="openRejectModal(row)">
            拒绝
          </ActionButton>
          <ActionButton v-if="row.status !== 'PENDING'" variant="view" @click="viewDetail(row)">
            查看
          </ActionButton>
        </nav>
      </template>
    </DataTable>

    <!-- 详情弹窗 -->
    <Modal v-model:visible="showDetailModal" title="申请详情" width="500px">
      <dl v-if="selectedApproval" class="detail-content">
        <div class="detail-item">
          <dt>商家名称</dt>
          <dd>{{ selectedApproval.merchantName }}</dd>
        </div>
        <div class="detail-item">
          <dt>申请区域</dt>
          <dd>{{ selectedApproval.floorName }} - {{ selectedApproval.areaName }}</dd>
        </div>
        <div class="detail-item">
          <dt>申请理由</dt>
          <dd class="reason-full">{{ selectedApproval.applyReason || '无' }}</dd>
        </div>
        <div class="detail-item">
          <dt>申请时间</dt>
          <dd>{{ formatShortDateTime(selectedApproval.createdAt) }}</dd>
        </div>
        <div class="detail-item">
          <dt>当前状态</dt>
          <dd><StatusBadge :status="selectedApproval.status" domain="approval" /></dd>
        </div>
        <div v-if="selectedApproval.rejectReason" class="detail-item">
          <dt>拒绝理由</dt>
          <dd class="reject-reason">{{ selectedApproval.rejectReason }}</dd>
        </div>
      </dl>

      <template #footer>
        <template v-if="selectedApproval?.status === 'PENDING'">
          <button class="btn btn-reject" :disabled="isProcessing" @click="openRejectModal(selectedApproval!)">
            拒绝
          </button>
          <button class="btn btn-approve" :disabled="isProcessing" @click="handleApprove(selectedApproval!)">
            {{ isProcessing ? '处理中...' : '通过' }}
          </button>
        </template>
        <button v-else class="btn btn-secondary" @click="showDetailModal = false">关闭</button>
      </template>
    </Modal>

    <!-- 拒绝理由弹窗 -->
    <ConfirmModal
      v-model:visible="showRejectModal"
      title="拒绝申请"
      confirm-text="确认拒绝"
      confirm-variant="danger"
      require-reason
      reason-label="请填写拒绝理由"
      reason-placeholder="请输入拒绝理由..."
      :processing="isProcessing"
      @confirm="handleReject"
    />
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.approval-page {
  @include flex-column;
  gap: $space-5;
}

.action-btns {
  @include action-btns;
}

.reason-text {
  @include line-clamp(1);
}

.detail-content {
  @include flex-column;
  gap: $space-5;
  margin: 0;

  .detail-item {
    @include form-item;

    dt {
      font-size: $font-size-sm + 1;
      color: $color-text-secondary;
    }

    dd {
      font-size: $font-size-lg;
      color: $color-text-primary;
      margin: 0;
      line-height: 1.6;
    }
  }

  .reason-full {
    white-space: pre-wrap;
  }

  .reject-reason {
    color: $color-error;
  }
}

.btn {
  @include btn-base;
  padding: $space-2 + 2 $space-5;

  &-secondary {
    @include btn-secondary;
  }

  &-approve {
    @include btn-success;
  }

  &-reject {
    @include btn-danger;
  }
}
</style>
