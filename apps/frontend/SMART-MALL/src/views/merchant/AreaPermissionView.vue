<script setup lang="ts">
/**
 * 商家区域权限视图
 *
 * 商家查看自己已获得的区域权限。
 *
 * 业务职责：
 * - 展示商家已获得的区域权限列表
 * - 显示权限详情（区域名称、楼层、授权时间）
 * - 显示权限状态
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可访问
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable } from '@/components'
import { areaPermissionApi } from '@/api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const permissions = ref<AreaPermissionDTO[]>([])
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const columns = [
  { key: 'floorName', title: '楼层', minWidth: '100' },
  { key: 'areaName', title: '区域编号', minWidth: '120' },
  { key: 'status', title: '状态', minWidth: '100' },
  { key: 'grantedAt', title: '授权时间', minWidth: '150' },
]

const activePermissions = computed(() => 
  permissions.value.filter(p => p.status === 'ACTIVE')
)

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
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

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="permission-page">
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', message.type]">
      <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
      {{ message.text }}
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value">{{ activePermissions.length }}</span>
        <span class="stat-label">有效权限</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ permissions.length }}</span>
        <span class="stat-label">总权限数</span>
      </div>
    </div>

    <!-- 权限列表 -->
    <div class="table-card">
      <div class="card-header">
        <h3>我的区域权限</h3>
      </div>
      <DataTable
        :columns="columns"
        :data="permissions"
        :loading="isLoading"
        empty-text="暂无区域权限"
      >
        <template #status="{ value }">
          <span :class="['status-badge', getStatusClass(value)]">
            {{ getStatusText(value) }}
          </span>
        </template>
        <template #grantedAt="{ value }">
          {{ formatDate(value) }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.permission-page {
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

/* Table Card */
.table-card {
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #e8eaed;
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
</style>
