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
import { DataTable, Modal, MessageAlert, StatusBadge } from '@/components'
import { areaPermissionApi } from '@/api'
import type { AvailableAreaDTO, AreaApplyDTO } from '@/api/area-permission.api'
import { useMessage, useFormatters } from '@/composables'

// Composables
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

const availableColumns = [
  { key: 'floorName', title: '楼层', minWidth: '80' },
  { key: 'name', title: '区域编号', minWidth: '100' },
  { key: 'type', title: '类型', minWidth: '80' },
  { key: 'status', title: '状态', minWidth: '80' },
  { key: 'actions', title: '操作', minWidth: '100' },
]

const historyColumns = [
  { key: 'floorName', title: '楼层', minWidth: '80' },
  { key: 'areaName', title: '区域编号', minWidth: '100' },
  { key: 'applyReason', title: '申请理由', minWidth: '150' },
  { key: 'status', title: '状态', minWidth: '80' },
  { key: 'createdAt', title: '申请时间', minWidth: '120' },
]

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
    showMessage('error', e.message || '加载数据失败')
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
    AVAILABLE: '可申请',
    OCCUPIED: '已入驻',
    LOCKED: '已锁定',
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
    PENDING: '待审批',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
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
      availableAreas.value[areaIndex].status = 'LOCKED'
    }
    
    showApplyModal.value = false
    showMessage('success', '申请提交成功，请等待审批')
  } catch (e: any) {
    showMessage('error', e.message || '申请失败')
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
          <span class="stat-label">可申请区域</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ myApplications.filter(a => a.status === 'PENDING').length }}</span>
          <span class="stat-label">待审批</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ myApplications.filter(a => a.status === 'APPROVED').length }}</span>
          <span class="stat-label">已通过</span>
        </div>
      </div>

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <button
          :class="['tab-btn', { active: activeTab === 'available' }]"
          @click="activeTab = 'available'"
        >
          可申请区域
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'history' }]"
          @click="activeTab = 'history'"
        >
          我的申请
        </button>
      </div>

      <!-- 可申请区域列表 -->
      <div v-if="activeTab === 'available'" class="table-card">
        <DataTable
          :columns="availableColumns"
          :data="availableAreas"
          :loading="isLoading"
          empty-text="暂无可申请区域"
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
              申请
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
          empty-text="暂无申请记录"
        >
          <template #status="{ value, row }">
            <div class="status-cell">
              <span :class="['status-badge', getAppStatusClass(value)]">
                {{ getAppStatusText(value) }}
              </span>
              <span v-if="row.rejectReason" class="reject-hint" :title="row.rejectReason">
                查看原因
              </span>
            </div>
          </template>
          <template #applyReason="{ value }">
            <span class="reason-text">{{ value || '-' }}</span>
          </template>
          <template #createdAt="{ value }">
            {{ formatDate(value, 'datetime') }}
          </template>
        </DataTable>
      </div>

      <!-- 申请弹窗 -->
      <Modal
        v-model:visible="showApplyModal"
        title="申请区域"
        width="450px"
      >
        <div v-if="selectedArea" class="apply-form">
          <div class="area-info">
            <div class="info-row">
              <label>区域位置</label>
              <span>{{ selectedArea.floorName }} · {{ selectedArea.name }}</span>
            </div>
            <div class="info-row">
              <label>区域类型</label>
              <span>{{ selectedArea.type || '-' }}</span>
            </div>
          </div>
          
          <div class="form-item">
            <label>申请理由</label>
            <textarea
              v-model="applyReason"
              class="textarea"
              rows="4"
              placeholder="请说明您申请该区域的理由（可选）..."
            ></textarea>
          </div>
        </div>

        <template #footer>
          <button class="btn btn-secondary" @click="showApplyModal = false">
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="isProcessing"
            @click="submitApplication"
          >
            {{ isProcessing ? '提交中...' : '提交申请' }}
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
}

// 状态徽章
.status-badge {
  @include status-badge;
}

.status-available {
  @include status-variant($color-primary-muted, $color-primary);
}

.status-locked {
  @include status-variant($color-warning-muted, $color-warning);
}

.status-occupied {
  @include status-variant(rgba($color-gray-muted, 0.15), $color-gray-muted);
}

.status-pending {
  @include status-variant($color-warning-muted, $color-warning);
}

.status-approved {
  @include status-variant($color-success-muted, $color-success);
}

.status-rejected {
  @include status-variant($color-error-muted, $color-error);
}

.status-cell {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.reject-hint {
  font-size: $font-size-xs + 1;
  color: $color-error;
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
    background: rgba($color-primary, 0.2);
    color: $color-primary;
  }
}

// 申请表单
.apply-form {
  display: flex;
  flex-direction: column;
  gap: $space-5;

  .area-info {
    background: $color-bg-hover;
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
        color: $color-text-secondary;
      }

      span {
        font-size: $font-size-base;
        color: $color-text-primary;
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
