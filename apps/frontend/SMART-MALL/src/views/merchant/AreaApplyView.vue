<script setup lang="ts">
/**
 * 区域申请视图
 *
 * 商家申请商城区域的页面。
 *
 * 业务职责：
 * - 展示可申请的区域列表（状态为 AVAILABLE 的区域）
 * - 提交区域申请（填写申请理由）
 * - 查看自己的申请历史和状态
 * - 统计可申请区域数、待审批数、已通过数
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可访问
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataTable, Modal, MessageAlert } from '@/components'
import { areaPermissionApi } from '@/api'
import type { AvailableAreaDTO, AreaApplyDTO } from '@/api/area-permission.api'
import { useMessage, useFormatters } from '@/composables'

// Composables
const { t } = useI18n()
const { message, showMessage, clearMessage } = useMessage()
const { formatDate } = useFormatters()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const availableAreas = ref<AvailableAreaDTO[]>([])
const myApplications = ref<AreaApplyDTO[]>([])
const activeTab = ref<'available' | 'history'>('available')

// 申请弹窗
const showApplyModal = ref(false)
const selectedArea = ref<AvailableAreaDTO | null>(null)
const applyReason = ref('')

// 操作状态
const isProcessing = ref(false)

// ============================================================================
// Computed
// ============================================================================

const availableColumns = computed(() => [
  { key: 'floorName', title: t('merchant.areaApply.colFloor'), minWidth: '80' },
  { key: 'name', title: t('merchant.areaApply.colAreaCode'), minWidth: '100' },
  { key: 'type', title: t('merchant.areaApply.colType'), minWidth: '80' },
  { key: 'status', title: t('merchant.areaApply.colStatus'), minWidth: '80' },
  { key: 'actions', title: t('merchant.areaApply.colActions'), minWidth: '100' },
])

const historyColumns = computed(() => [
  { key: 'floorName', title: t('merchant.areaApply.colFloor'), minWidth: '80' },
  { key: 'areaName', title: t('merchant.areaApply.colAreaCode'), minWidth: '100' },
  { key: 'applyReason', title: t('merchant.areaApply.applyReason'), minWidth: '150' },
  { key: 'status', title: t('merchant.areaApply.colStatus'), minWidth: '80' },
  { key: 'createdAt', title: t('merchant.areaApply.colApplyTime'), minWidth: '120' },
])

const applyableAreas = computed(() => 
  availableAreas.value.filter(a => a.status === 'AVAILABLE')
)

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    const [areas, apps] = await Promise.all([
      areaPermissionApi.getAvailableAreas(),
      areaPermissionApi.getMyApplications(),
    ])
    availableAreas.value = areas
    myApplications.value = apps
  } catch (e: any) {
    console.error('加载数据失败:', e)
    showMessage('error', e.message || t('merchant.areaApply.loadDataFailed'))
  } finally {
    isLoading.value = false
  }
}

function getAreaStatusClass(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: 'status-available',
    OCCUPIED: 'status-occupied',
    LOCKED: 'status-locked',
  }
  return map[status] || ''
}

function getAreaStatusText(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: t('merchant.areaApply.statusAvailable'),
    OCCUPIED: t('merchant.areaApply.statusOccupied'),
    LOCKED: t('merchant.areaApply.statusLocked'),
  }
  return map[status] || status
}

function getAppStatusClass(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'status-pending',
    APPROVED: 'status-approved',
    REJECTED: 'status-rejected',
  }
  return map[status] || ''
}

function getAppStatusText(status: string): string {
  const map: Record<string, string> = {
    PENDING: t('merchant.areaApply.statusPending'),
    APPROVED: t('merchant.areaApply.statusApproved'),
    REJECTED: t('merchant.areaApply.statusRejected'),
  }
  return map[status] || status
}

function openApplyModal(area: AvailableAreaDTO) {
  selectedArea.value = area
  applyReason.value = ''
  showApplyModal.value = true
}

async function submitApplication() {
  if (!selectedArea.value) return
  
  isProcessing.value = true
  clearMessage()

  try {
    const newApp = await areaPermissionApi.submitApplication({
      areaId: selectedArea.value.areaId,
      applyReason: applyReason.value || undefined,
    })
    myApplications.value.unshift(newApp)
    
    // 更新区域状态
    const areaIndex = availableAreas.value.findIndex(a => a.areaId === selectedArea.value!.areaId)
    if (areaIndex !== -1) {
      const targetArea = availableAreas.value[areaIndex]
      if (targetArea) {
        targetArea.status = 'LOCKED'
      }
    }
    
    showApplyModal.value = false
    showMessage('success', t('merchant.areaApply.submitSuccess'))
  } catch (e: any) {
    showMessage('error', e.message || t('merchant.areaApply.submitFailed'))
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
  <div class="area-apply-page">
      <!-- 消息提示 -->
      <MessageAlert v-if="message" :type="message.type" :text="message.text" @close="clearMessage" />

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value">{{ applyableAreas.length }}</span>
          <span class="stat-label">{{ t('merchant.areaApply.applyableAreas') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ myApplications.filter(a => a.status === 'PENDING').length }}</span>
          <span class="stat-label">{{ t('merchant.areaApply.statusPending') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ myApplications.filter(a => a.status === 'APPROVED').length }}</span>
          <span class="stat-label">{{ t('merchant.areaApply.statusApproved') }}</span>
        </div>
      </div>

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button
          :class="['tab-btn', { active: activeTab === 'available' }]"
          @click="activeTab = 'available'"
        >
          {{ t('merchant.areaApply.availableAreas') }}
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'history' }]"
          @click="activeTab = 'history'"
        >
          {{ t('merchant.areaApply.myApplications') }}
        </button>
      </div>

      <!-- 可申请区域列表 -->
      <div v-if="activeTab === 'available'" class="table-card">
        <DataTable
          :columns="availableColumns"
          :data="availableAreas"
          :loading="isLoading"
          :empty-text="t('merchant.areaApply.noAvailableAreas')"
        >
          <template #status="{ value }">
            <span :class="['status-badge', getAreaStatusClass(value)]">
              {{ getAreaStatusText(value) }}
            </span>
          </template>
          <template #actions="{ row }">
            <button
              v-if="row.status === 'AVAILABLE'"
              class="action-btn apply"
              @click="openApplyModal(row)"
            >
              {{ t('merchant.areaApply.apply') }}
            </button>
            <span v-else class="text-muted">-</span>
          </template>
        </DataTable>
      </div>

      <!-- 我的申请列表 -->
      <div v-if="activeTab === 'history'" class="table-card">
        <DataTable
          :columns="historyColumns"
          :data="myApplications"
          :loading="isLoading"
          :empty-text="t('merchant.areaApply.noApplications')"
        >
          <template #status="{ value, row }">
            <div class="status-cell">
              <span :class="['status-badge', getAppStatusClass(value)]">
                {{ getAppStatusText(value) }}
              </span>
              <span v-if="row.rejectReason" class="reject-hint" :title="row.rejectReason">
                {{ t('merchant.areaApply.viewReason') }}
              </span>
            </div>
          </template>
          <template #applyReason="{ value }">
            <span class="reason-text">{{ value || '-' }}</span>
          </template>
          <template #createdAt="{ value }">
            {{ formatDate(value) }}
          </template>
        </DataTable>
      </div>

      <!-- 申请弹窗 -->
      <Modal
        v-model:visible="showApplyModal"
        :title="t('merchant.areaApply.applyArea')"
        width="450px"
      >
        <div v-if="selectedArea" class="apply-form">
          <div class="area-info">
            <div class="info-row">
              <label>{{ t('merchant.areaApply.areaLocation') }}</label>
              <span>{{ selectedArea.floorName }} · {{ selectedArea.name }}</span>
            </div>
            <div class="info-row">
              <label>{{ t('merchant.areaApply.areaType') }}</label>
              <span>{{ selectedArea.type || '-' }}</span>
            </div>
          </div>
          
          <div class="form-item">
            <label>{{ t('merchant.areaApply.applyReason') }}</label>
            <textarea
              v-model="applyReason"
              class="textarea"
              rows="4"
              :placeholder="t('merchant.areaApply.applyReasonPlaceholder')"
            ></textarea>
          </div>
        </div>

        <template #footer>
          <button class="btn btn-secondary" @click="showApplyModal = false">
            {{ t('common.cancel') }}
          </button>
          <button
            class="btn btn-primary"
            :disabled="isProcessing"
            @click="submitApplication"
          >
            {{ isProcessing ? t('merchant.areaApply.submitting') : t('merchant.areaApply.submitApply') }}
          </button>
        </template>
      </Modal>
  </div>
</template>


<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.area-apply-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

// 统计行
.stats-row {
  @include stats-row;

  .stat-item {
    @include stat-item;

    .stat-value {
      @include stat-value;
    }

    .stat-label {
      @include stat-label;
    }
  }
}

// Tab 切换
.tab-bar {
  @include tab-bar;

  .tab-btn {
    @include tab-btn;
  }
}

// 表格卡片
.table-card {
  @include card-base;
  overflow: hidden;

  :deep(.data-table) {
    --el-table-bg-color: rgba(var(--bg-secondary-rgb), 0.9);
    --el-table-tr-bg-color: rgba(var(--bg-secondary-rgb), 0.74);
    --el-table-header-bg-color: rgba(var(--bg-secondary-rgb), 0.95);
    --el-table-text-color: var(--text-primary);
    --el-table-header-text-color: var(--text-secondary);
    --el-table-border-color: var(--border-subtle);
    --el-table-row-hover-bg-color: rgba(var(--accent-primary-rgb), 0.1);
    --el-table-current-row-bg-color: rgba(var(--accent-primary-rgb), 0.12);
    --el-table-striped-bg-color: rgba(var(--bg-tertiary-rgb), 0.82);
    --el-fill-color-light: rgba(var(--bg-tertiary-rgb), 0.66);
    --el-fill-color-lighter: rgba(var(--accent-primary-rgb), 0.1);
  }

  :deep(.data-table .el-table__header-wrapper th.el-table__cell) {
    border-bottom-color: var(--border-subtle);
  }

  :deep(.data-table .el-table__body tr.el-table__row td.el-table__cell) {
    border-bottom-color: var(--border-subtle);
    transition: background-color $duration-normal;
  }

  :deep(.data-table .el-table__body tr.el-table__row:hover td.el-table__cell) {
    background: rgba(var(--accent-primary-rgb), 0.1);
  }
}

// 状态徽章
.status-badge {
  @include status-badge;
  border: 1px solid transparent;
  letter-spacing: 0.01em;
}

.status-available {
  @include status-variant(rgba(var(--accent-primary-rgb), 0.18), var(--accent-primary));
  border-color: rgba(var(--accent-primary-rgb), 0.36);
}

.status-locked {
  @include status-variant(rgba(var(--warning-rgb), 0.18), var(--warning));
  border-color: rgba(var(--warning-rgb), 0.34);
}

.status-occupied {
  @include status-variant(rgba(var(--text-muted-rgb), 0.16), var(--text-secondary));
  border-color: rgba(var(--text-muted-rgb), 0.32);
}

.status-pending {
  @include status-variant(rgba(var(--warning-rgb), 0.18), var(--warning));
  border-color: rgba(var(--warning-rgb), 0.34);
}

.status-approved {
  @include status-variant(rgba(var(--success-rgb), 0.18), var(--success));
  border-color: rgba(var(--success-rgb), 0.34);
}

.status-rejected {
  @include status-variant(rgba(var(--error-rgb), 0.18), var(--error));
  border-color: rgba(var(--error-rgb), 0.34);
}

.status-cell {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.reject-hint {
  font-size: $font-size-xs + 1;
  color: var(--error);
  cursor: pointer;
  text-decoration: underline;
}

.text-muted {
  @include text-muted;
}

.reason-text {
  @include line-clamp(1);
}

// 操作按钮
.action-btn {
  @include btn-action;

  &.apply {
    background: rgba(var(--accent-primary-rgb), 0.16);
    border: 1px solid rgba(var(--accent-primary-rgb), 0.32);
    color: var(--accent-primary);

    &:hover {
      background: rgba(var(--accent-primary-rgb), 0.24);
      border-color: rgba(var(--accent-primary-rgb), 0.44);
      color: var(--accent-primary);
    }
  }
}

// 申请表单
.apply-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  .area-info {
    background: rgba(var(--text-primary-rgb), 0.04);
    border-radius: $radius-md + 2;
    padding: $space-4;
    display: flex;
    flex-direction: column;
    gap: $space-3;

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      label {
        font-size: $font-size-sm + 1;
        color: var(--text-secondary);
      }

      span {
        font-size: $font-size-base;
        color: var(--text-primary);
        font-weight: $font-weight-medium;
      }
    }
  }

  .form-item {
    @include form-item;
  }
}

.textarea {
  @include form-textarea;
}

// 按钮
.btn {
  @include btn-base;
  padding: $space-2 + 2 $space-5;
}

.btn-secondary {
  @include btn-secondary;
}

.btn-primary {
  @include btn-primary;
}
</style>
