<script setup lang="ts">
/**
 * 管理员区域权限管理视图
 *
 * 管理员查看和管理所有区域权限。
 *
 * 业务职责：
 * - 展示所有区域权限列表
 * - 支持撤销权限操作（需填写撤销理由）
 * - 显示权限详情
 *
 * 用户角色：
 * - 仅管理员（ADMIN）可访问
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable, Modal, CustomSelect } from '@/components'
import { areaPermissionApi } from '@/api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const permissions = ref<AreaPermissionDTO[]>([])
const filter = ref({ status: 'ALL' })

// 撤销弹窗
const showRevokeModal = ref(false)
const selectedPermission = ref<AreaPermissionDTO | null>(null)
const revokeReason = ref('')
const isProcessing = ref(false)

// 操作结果
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const filteredPermissions = computed(() => {
  if (filter.value.status === 'ALL') {
    return permissions.value
  }
  return permissions.value.filter(item => item.status === filter.value.status)
})

const statusOptions = [
  { value: 'ALL', label: '全部' },
  { value: 'ACTIVE', label: '有效' },
  { value: 'REVOKED', label: '已撤销' },
]

const columns = [
  { key: 'floorName', title: '楼层', minWidth: '80' },
  { key: 'areaName', title: '区域编号', minWidth: '100' },
  { key: 'status', title: '状态', minWidth: '80' },
  { key: 'grantedAt', title: '授权时间', minWidth: '140' },
  { key: 'actions', title: '操作', minWidth: '100' },
]

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    // 注意：后端目前没有获取所有权限的接口，这里暂时使用商家权限接口
    // 实际应该有一个管理员专用的接口
    permissions.value = await areaPermissionApi.getMyPermissions()
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
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'status-active',
    REVOKED: 'status-revoked',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: '有效',
    REVOKED: '已撤销',
  }
  return map[status] || status
}

function openRevokeModal(permission: AreaPermissionDTO) {
  selectedPermission.value = permission
  revokeReason.value = ''
  showRevokeModal.value = true
}

async function handleRevoke() {
  if (!selectedPermission.value || !revokeReason.value.trim()) return
  
  isProcessing.value = true
  message.value = null
  
  try {
    await areaPermissionApi.revokePermission(selectedPermission.value.permissionId, revokeReason.value)
    
    // 更新本地状态
    const index = permissions.value.findIndex(p => p.permissionId === selectedPermission.value!.permissionId)
    if (index !== -1) {
      permissions.value[index].status = 'REVOKED'
    }
    
    showRevokeModal.value = false
    message.value = { type: 'success', text: '权限已撤销' }
    
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
  <div class="permission-manage-page">
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
        共 {{ filteredPermissions.length }} 条记录
      </div>
    </div>

    <!-- 权限列表 -->
    <div class="table-card">
      <DataTable
        :columns="columns"
        :data="filteredPermissions"
        :loading="isLoading"
        empty-text="暂无权限记录"
      >
        <template #status="{ value }">
          <span :class="['status-badge', getStatusClass(value)]">
            {{ getStatusText(value) }}
          </span>
        </template>
        <template #grantedAt="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #actions="{ row }">
          <div class="action-btns">
            <button
              v-if="row.status === 'ACTIVE'"
              class="action-btn revoke"
              @click="openRevokeModal(row)"
            >
              撤销
            </button>
            <span v-else class="text-muted">-</span>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- 撤销弹窗 -->
    <Modal
      v-model:visible="showRevokeModal"
      title="撤销权限"
      width="400px"
    >
      <div v-if="selectedPermission" class="revoke-form">
        <div class="permission-info">
          <div class="info-row">
            <label>区域</label>
            <span>{{ selectedPermission.floorName }} · {{ selectedPermission.areaName }}</span>
          </div>
        </div>
        
        <div class="form-item">
          <label>撤销理由 <span class="required">*</span></label>
          <textarea
            v-model="revokeReason"
            class="textarea"
            rows="4"
            placeholder="请输入撤销理由..."
          ></textarea>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="showRevokeModal = false">
          取消
        </button>
        <button
          class="btn btn-danger"
          :disabled="!revokeReason.trim() || isProcessing"
          @click="handleRevoke"
        >
          {{ isProcessing ? '处理中...' : '确认撤销' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.permission-manage-page {
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

.status-active {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-revoked {
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

.action-btn.revoke {
  background: rgba(242, 139, 130, 0.2);
  color: #f28b82;
}

.text-muted {
  color: #5f6368;
}

/* Revoke Form */
.revoke-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.permission-info {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  padding: 16px;
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

.btn-danger {
  background: #f28b82;
  color: #0a0a0a;
}

.btn-danger:hover:not(:disabled) {
  background: #fca5a5;
}
</style>
