<script setup lang="ts">
/**
 * 管理员区域权限管理视图
 * 管理员查看和管理所有区域权限
 */
import { ref, computed, onMounted } from 'vue'
import { 
  DataTable, Modal, CustomSelect, FilterBar, 
  MessageAlert, StatusBadge, ActionButton, ConfirmModal 
} from '@/components'
import { useMessage, useFormatters, useStatusConfig } from '@/composables'
import { areaPermissionApi } from '@/api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'

// ============================================================================
// Composables
// ============================================================================

const { message, success, error } = useMessage()
const { formatDateTime } = useFormatters()
const { getStatusText, getStatusClass } = useStatusConfig('permission')

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const permissions = ref<AreaPermissionDTO[]>([])
const filter = ref({ status: 'ALL' })

// 撤销弹窗
const showRevokeModal = ref(false)
const selectedPermission = ref<AreaPermissionDTO | null>(null)
const isProcessing = ref(false)

// ============================================================================
// Computed
// ============================================================================

const filteredPermissions = computed(() => {
  if (filter.value.status === 'ALL') return permissions.value
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
    permissions.value = await areaPermissionApi.getMyPermissions()
  } catch (e: any) {
    error(e.message || '加载数据失败')
  } finally {
    isLoading.value = false
  }
}

function openRevokeModal(permission: AreaPermissionDTO) {
  selectedPermission.value = permission
  showRevokeModal.value = true
}

async function handleRevoke(reason: string) {
  if (!selectedPermission.value) return
  
  isProcessing.value = true
  try {
    await areaPermissionApi.revokePermission(selectedPermission.value.permissionId, reason)
    
    const index = permissions.value.findIndex(p => p.permissionId === selectedPermission.value!.permissionId)
    if (index !== -1) permissions.value[index].status = 'REVOKED'
    
    showRevokeModal.value = false
    success('权限已撤销')
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
  <main class="permission-manage-page">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" />

    <FilterBar :total="filteredPermissions.length">
      <label>状态筛选</label>
      <CustomSelect v-model="filter.status" :options="statusOptions" />
    </FilterBar>

    <section class="table-card">
      <DataTable
        :columns="columns"
        :data="filteredPermissions"
        :loading="isLoading"
        empty-text="暂无权限记录"
      >
        <template #status="{ value }">
          <StatusBadge :status="value" domain="permission" />
        </template>
        <template #grantedAt="{ value }">
          <time :datetime="value">{{ formatDateTime(value) }}</time>
        </template>
        <template #actions="{ row }">
          <nav class="action-btns">
            <ActionButton 
              v-if="row.status === 'ACTIVE'" 
              variant="reject" 
              @click="openRevokeModal(row)"
            >撤销</ActionButton>
            <span v-else class="text-muted">-</span>
          </nav>
        </template>
      </DataTable>
    </section>

    <ConfirmModal
      v-model:visible="showRevokeModal"
      title="撤销权限"
      confirm-text="确认撤销"
      confirm-variant="danger"
      require-reason
      reason-label="撤销理由"
      reason-placeholder="请输入撤销理由..."
      :processing="isProcessing"
      @confirm="handleRevoke"
    >
      <div v-if="selectedPermission" class="permission-info">
        <div class="info-row">
          <label>区域</label>
          <span>{{ selectedPermission.floorName }} · {{ selectedPermission.areaName }}</span>
        </div>
      </div>
    </ConfirmModal>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.permission-manage-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.table-card {
  @include card-base;
  overflow: hidden;
}

.action-btns {
  @include action-btns;
}

.text-muted {
  @include text-muted;
}

.permission-info {
  background: $color-bg-hover;
  border-radius: $radius-md + 2;
  padding: $space-4;

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
</style>
