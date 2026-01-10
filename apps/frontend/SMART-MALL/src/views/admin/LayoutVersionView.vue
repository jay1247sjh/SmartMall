<script setup lang="ts">
/**
 * 布局版本管理页面
 * 管理商城布局的版本发布和回滚
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable, Modal } from '@/components'
import { mallManageApi } from '@/api'
import type { LayoutVersion } from '@/api/mall-manage.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const versions = ref<LayoutVersion[]>([])

// 详情弹窗
const showDetailModal = ref(false)
const selectedVersion = ref<LayoutVersion | null>(null)

// 操作状态
const isProcessing = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const columns = [
  { key: 'version', title: '版本号', minWidth: '100' },
  { key: 'status', title: '状态', minWidth: '80' },
  { key: 'description', title: '描述', minWidth: '150' },
  { key: 'changeCount', title: '变更数', minWidth: '80' },
  { key: 'createdBy', title: '创建者', minWidth: '100' },
  { key: 'createdAt', title: '创建时间', minWidth: '140' },
  { key: 'actions', title: '操作', minWidth: '120' },
]

const activeVersion = computed(() => versions.value.find(v => v.status === 'ACTIVE'))
const draftVersion = computed(() => versions.value.find(v => v.status === 'DRAFT'))

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    versions.value = await mallManageApi.getVersions()
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr: string): string {
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
    DRAFT: 'status-draft',
    ACTIVE: 'status-active',
    ARCHIVED: 'status-archived',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    ACTIVE: '当前版本',
    ARCHIVED: '已归档',
  }
  return map[status] || status
}

function viewDetail(version: LayoutVersion) {
  selectedVersion.value = version
  showDetailModal.value = true
}

async function publishVersion(version: LayoutVersion) {
  if (!confirm(`确定发布版本 "${version.version}" 吗？发布后将成为当前生效版本。`)) return
  
  isProcessing.value = true
  message.value = null

  try {
    await mallManageApi.publishVersion(version.id)
    
    // 更新本地状态
    versions.value.forEach(v => {
      if (v.status === 'ACTIVE') v.status = 'ARCHIVED'
    })
    const index = versions.value.findIndex(v => v.id === version.id)
    if (index !== -1) {
      versions.value[index].status = 'ACTIVE'
    }
    
    message.value = { type: 'success', text: `版本 ${version.version} 发布成功` }
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '发布失败' }
  } finally {
    isProcessing.value = false
  }
}

async function rollbackVersion(version: LayoutVersion) {
  if (!confirm(`确定回滚到版本 "${version.version}" 吗？当前版本将被归档。`)) return
  
  isProcessing.value = true
  message.value = null

  try {
    await mallManageApi.rollbackVersion(version.id)
    
    // 更新本地状态
    versions.value.forEach(v => {
      if (v.status === 'ACTIVE') v.status = 'ARCHIVED'
    })
    const index = versions.value.findIndex(v => v.id === version.id)
    if (index !== -1) {
      versions.value[index].status = 'ACTIVE'
    }
    
    message.value = { type: 'success', text: `已回滚到版本 ${version.version}` }
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '回滚失败' }
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
  <div class="version-page">
      <!-- 消息提示 -->
      <div v-if="message" :class="['message', message.type]">
        <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
        {{ message.text }}
      </div>

      <!-- 版本概览 -->
      <div class="overview-cards">
        <div class="overview-card active">
          <div class="card-icon">🟢</div>
          <div class="card-content">
            <span class="card-label">当前版本</span>
            <span class="card-value">{{ activeVersion?.version || '-' }}</span>
          </div>
        </div>
        <div class="overview-card draft">
          <div class="card-icon">📝</div>
          <div class="card-content">
            <span class="card-label">草稿版本</span>
            <span class="card-value">{{ draftVersion?.version || '-' }}</span>
          </div>
        </div>
        <div class="overview-card total">
          <div class="card-icon">📦</div>
          <div class="card-content">
            <span class="card-label">版本总数</span>
            <span class="card-value">{{ versions.length }}</span>
          </div>
        </div>
      </div>

      <!-- 版本列表 -->
      <div class="version-table">
        <DataTable
          :columns="columns"
          :data="versions"
          :loading="isLoading"
          empty-text="暂无版本记录"
          @row-click="viewDetail"
        >
          <template #version="{ value, row }">
            <div class="version-cell">
              <span class="version-text">{{ value }}</span>
              <span v-if="row.status === 'ACTIVE'" class="current-tag">当前</span>
            </div>
          </template>
          <template #status="{ value }">
            <span :class="['status-badge', getStatusClass(value)]">
              {{ getStatusText(value) }}
            </span>
          </template>
          <template #createdAt="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #actions="{ row }">
            <div class="action-btns" @click.stop>
              <button
                v-if="row.status === 'DRAFT'"
                class="action-btn publish"
                :disabled="isProcessing"
                @click="publishVersion(row)"
              >
                发布
              </button>
              <button
                v-if="row.status === 'ARCHIVED'"
                class="action-btn rollback"
                :disabled="isProcessing"
                @click="rollbackVersion(row)"
              >
                回滚
              </button>
              <button
                class="action-btn view"
                @click="viewDetail(row)"
              >
                详情
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- 详情弹窗 -->
      <Modal
        v-model:visible="showDetailModal"
        title="版本详情"
        width="500px"
      >
        <div v-if="selectedVersion" class="detail-content">
          <div class="detail-item">
            <label>版本号</label>
            <span class="version-value">{{ selectedVersion.version }}</span>
          </div>
          <div class="detail-item">
            <label>状态</label>
            <span :class="['status-badge', getStatusClass(selectedVersion.status)]">
              {{ getStatusText(selectedVersion.status) }}
            </span>
          </div>
          <div class="detail-item">
            <label>描述</label>
            <p class="desc-text">{{ selectedVersion.description }}</p>
          </div>
          <div class="detail-item">
            <label>变更数量</label>
            <span>{{ selectedVersion.changeCount }} 项变更</span>
          </div>
          <div class="detail-item">
            <label>创建者</label>
            <span>{{ selectedVersion.createdBy }}</span>
          </div>
          <div class="detail-item">
            <label>创建时间</label>
            <span>{{ formatDate(selectedVersion.createdAt) }}</span>
          </div>
        </div>

        <template #footer>
          <button
            v-if="selectedVersion?.status === 'DRAFT'"
            class="btn btn-publish"
            :disabled="isProcessing"
            @click="publishVersion(selectedVersion!)"
          >
            发布此版本
          </button>
          <button
            v-if="selectedVersion?.status === 'ARCHIVED'"
            class="btn btn-rollback"
            :disabled="isProcessing"
            @click="rollbackVersion(selectedVersion!)"
          >
            回滚到此版本
          </button>
          <button class="btn btn-secondary" @click="showDetailModal = false">
            关闭
          </button>
        </template>
      </Modal>
  </div>
</template>


<style scoped>
.version-page {
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

/* Overview Cards */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.overview-card {
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  font-size: 28px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 13px;
  color: #9aa0a6;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
  color: #e8eaed;
}

/* Version Table */
.version-table {
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

.version-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-text {
  font-weight: 500;
  color: #e8eaed;
}

.current-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-draft {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.status-active {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-archived {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
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

.action-btn:hover:not(:disabled) {
  opacity: 0.8;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.publish {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
}

.action-btn.rollback {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.action-btn.view {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
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

.version-value {
  font-weight: 600;
  font-size: 18px !important;
}

.desc-text {
  font-size: 14px;
  color: #e8eaed;
  margin: 0;
  line-height: 1.6;
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

.btn-publish {
  background: #34d399;
  color: #0a0a0a;
}

.btn-publish:hover:not(:disabled) {
  background: #2dd4bf;
}

.btn-rollback {
  background: #fbbf24;
  color: #0a0a0a;
}

.btn-rollback:hover:not(:disabled) {
  background: #fcd34d;
}
</style>
