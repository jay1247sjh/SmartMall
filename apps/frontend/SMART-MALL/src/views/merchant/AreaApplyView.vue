<script setup lang="ts">
/**
 * 区域申请视图
 *
 * 商家申请商城区域的页面。
 *
 * 业务职责：
 * - 展示可申请的区域列表（状态为 LOCKED 的区域）
 * - 提交区域申请（填写申请理由）
 * - 查看自己的申请历史和状态
 * - 统计可申请区域数、待审批数、已通过数
 *
 * 设计原则：
 * - Tab 切换：可申请区域 / 我的申请
 * - 使用 DataTable 组件展示列表
 * - 模态框提交申请
 * - 状态标签区分不同状态
 *
 * 数据流：
 * - 页面加载时获取可申请区域和申请历史
 * - 提交申请后更新区域状态和申请列表
 * - 申请状态由管理员审批后更新
 *
 * 区域状态说明：
 * - LOCKED：可申请（蓝色）
 * - PENDING：审批中（黄色）
 * - AUTHORIZED：已授权（紫色）
 * - OCCUPIED：已入驻（灰色）
 *
 * 申请状态说明：
 * - PENDING：待审批（黄色）
 * - APPROVED：已通过（绿色）
 * - REJECTED：已拒绝（红色）
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可访问
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable, Modal } from '@/components'
import { merchantApi } from '@/api'
import type { AvailableArea, AreaApplication } from '@/api/merchant.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const availableAreas = ref<AvailableArea[]>([])
const myApplications = ref<AreaApplication[]>([])
const activeTab = ref<'available' | 'history'>('available')

// 申请弹窗
const showApplyModal = ref(false)
const selectedArea = ref<AvailableArea | null>(null)
const applyReason = ref('')

// 操作状态
const isProcessing = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const availableColumns = [
  { key: 'floorName', title: '楼层', width: '12%' },
  { key: 'name', title: '区域编号', width: '15%' },
  { key: 'size', title: '面积(㎡)', width: '12%' },
  { key: 'status', title: '状态', width: '15%' },
  { key: 'actions', title: '操作', width: '15%' },
]

const historyColumns = [
  { key: 'floorName', title: '楼层', width: '12%' },
  { key: 'areaName', title: '区域编号', width: '15%' },
  { key: 'reason', title: '申请理由', width: '25%' },
  { key: 'status', title: '状态', width: '15%' },
  { key: 'createdAt', title: '申请时间', width: '18%' },
]

const applyableAreas = computed(() => 
  availableAreas.value.filter(a => a.status === 'LOCKED')
)

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    const [areas, apps] = await Promise.all([
      merchantApi.getAvailableAreas(),
      merchantApi.getMyApplications(),
    ])
    availableAreas.value = areas
    myApplications.value = apps
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getAreaStatusClass(status: string): string {
  const map: Record<string, string> = {
    LOCKED: 'status-locked',
    PENDING: 'status-pending',
    AUTHORIZED: 'status-authorized',
    OCCUPIED: 'status-occupied',
  }
  return map[status] || ''
}

function getAreaStatusText(status: string): string {
  const map: Record<string, string> = {
    LOCKED: '可申请',
    PENDING: '审批中',
    AUTHORIZED: '已授权',
    OCCUPIED: '已入驻',
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

function openApplyModal(area: AvailableArea) {
  selectedArea.value = area
  applyReason.value = ''
  showApplyModal.value = true
}

async function submitApplication() {
  if (!selectedArea.value || !applyReason.value.trim()) return
  
  isProcessing.value = true
  message.value = null

  try {
    const newApp = await merchantApi.applyForArea(selectedArea.value.id, applyReason.value)
    myApplications.value.unshift(newApp)
    
    // 更新区域状态
    const areaIndex = availableAreas.value.findIndex(a => a.id === selectedArea.value!.id)
    if (areaIndex !== -1) {
      availableAreas.value[areaIndex].status = 'PENDING'
    }
    
    showApplyModal.value = false
    message.value = { type: 'success', text: '申请提交成功，请等待审批' }
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '申请失败' }
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
      <div v-if="message" :class="['message', message.type]">
        <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
        {{ message.text }}
      </div>

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
              v-if="row.status === 'LOCKED'"
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
          <template #reason="{ value }">
            <span class="reason-text">{{ value }}</span>
          </template>
          <template #createdAt="{ value }">
            {{ formatDate(value) }}
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
              <label>区域面积</label>
              <span>{{ selectedArea.size }} ㎡</span>
            </div>
          </div>
          
          <div class="form-item">
            <label>申请理由 <span class="required">*</span></label>
            <textarea
              v-model="applyReason"
              class="textarea"
              rows="4"
              placeholder="请说明您申请该区域的理由..."
            ></textarea>
          </div>
        </div>

        <template #footer>
          <button class="btn btn-secondary" @click="showApplyModal = false">
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="!applyReason.trim() || isProcessing"
            @click="submitApplication"
          >
            {{ isProcessing ? '提交中...' : '提交申请' }}
          </button>
        </template>
      </Modal>
  </div>
</template>


<style scoped>
.area-apply-page {
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

/* Stats Row */
.stats-row {
  display: flex;
  gap: 16px;
}

.stat-item {
  flex: 1;
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #e8eaed;
}

.stat-label {
  font-size: 13px;
  color: #9aa0a6;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: #111113;
  border-radius: 10px;
  width: fit-content;
}

.tab-btn {
  padding: 10px 20px;
  border-radius: 8px;
  background: transparent;
  color: #9aa0a6;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: #e8eaed;
}

.tab-btn.active {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

/* Table Card */
.table-card {
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-locked {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.status-pending {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.status-authorized {
  background: rgba(167, 139, 250, 0.15);
  color: #a78bfa;
}

.status-occupied {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.status-approved {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-rejected {
  background: rgba(242, 139, 130, 0.15);
  color: #f28b82;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reject-hint {
  font-size: 11px;
  color: #f28b82;
  cursor: pointer;
  text-decoration: underline;
}

.text-muted {
  color: #5f6368;
}

.reason-text {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Action Button */
.action-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}

.action-btn:hover {
  opacity: 0.8;
}

.action-btn.apply {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

/* Apply Form */
.apply-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.area-info {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row label {
  font-size: 13px;
  color: #9aa0a6;
}

.info-row span {
  font-size: 14px;
  color: #e8eaed;
  font-weight: 500;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 14px;
  color: #9aa0a6;
}

.required {
  color: #f28b82;
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

.btn-primary {
  background: #60a5fa;
  color: #0a0a0a;
}

.btn-primary:hover:not(:disabled) {
  background: #93c5fd;
}
</style>
