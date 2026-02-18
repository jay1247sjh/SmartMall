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
 * - 在区域状态为 AUTHORIZED 时显示「AI 生成布局」按钮
 * - 集成 AILayoutDialog 进行 AI 布局生成
 * - 生成成功后调用 applyLayout 并更新区域状态
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可访问
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DataTable, MessageAlert, StatusBadge } from '@/components'
import { areaPermissionApi } from '@/api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'
import { merchantApi } from '@/api/merchant.api'
import type { StoreLayoutData } from '@/api/merchant.api'
import { useMessage, useFormatters, useStatusConfig } from '@/composables'
import AILayoutDialog from './AILayoutDialog.vue'

// i18n
const { t } = useI18n()

// Composables
const { message, showMessage, clearMessage } = useMessage()
const { formatDate } = useFormatters()
const { getStatusConfig } = useStatusConfig()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const permissions = ref<AreaPermissionDTO[]>([])

// AI 布局对话框状态
const showAIDialog = ref(false)
const selectedPermission = ref<AreaPermissionDTO | null>(null)
const isApplying = ref(false)
const pendingLayout = ref<StoreLayoutData | null>(null)
const showConfirmApply = ref(false)

// ============================================================================
// Computed
// ============================================================================

const columns = computed(() => [
  { key: 'floorName', title: t('merchant.areaPermission.colFloor'), minWidth: '100' },
  { key: 'areaName', title: t('merchant.areaPermission.colAreaCode'), minWidth: '120' },
  { key: 'status', title: t('merchant.areaPermission.colPermissionStatus'), minWidth: '100' },
  { key: 'areaStatus', title: t('merchant.areaPermission.colAreaStatus'), minWidth: '100' },
  { key: 'grantedAt', title: t('merchant.areaPermission.colGrantedAt'), minWidth: '150' },
  { key: 'actions', title: t('merchant.areaPermission.colActions'), minWidth: '140' },
])

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
    console.error('Load data failed:', e)
    showMessage('error', e.message || t('merchant.areaPermission.loadDataFailed'))
  } finally {
    isLoading.value = false
  }
}

/**
 * 判断区域是否可以使用 AI 生成布局
 * 仅当权限为 ACTIVE 且区域状态为 AUTHORIZED 时可用
 */
function canGenerateLayout(row: AreaPermissionDTO): boolean {
  return row.status === 'ACTIVE' && row.areaStatus === 'AUTHORIZED'
}

function getAreaStatusText(status: string | null): string {
  const map: Record<string, string> = {
    AVAILABLE: t('merchant.areaPermission.statusAvailable'),
    PENDING: t('merchant.areaPermission.statusPending'),
    AUTHORIZED: t('merchant.areaPermission.statusAuthorized'),
    OCCUPIED: t('merchant.areaPermission.statusOccupied'),
  }
  return (status && map[status]) || status || '-'
}

function getAreaStatusClass(status: string | null): string {
  const map: Record<string, string> = {
    AVAILABLE: 'status-available',
    PENDING: 'status-pending',
    AUTHORIZED: 'status-authorized',
    OCCUPIED: 'status-occupied',
  }
  return (status && map[status]) || ''
}

/**
 * 打开 AI 布局生成对话框
 */
function openAIDialog(row: AreaPermissionDTO) {
  selectedPermission.value = row
  showAIDialog.value = true
}

/**
 * 处理 AI 布局生成成功
 * 暂存布局数据，显示确认应用提示
 */
function handleLayoutGenerated(data: StoreLayoutData) {
  pendingLayout.value = data
  showConfirmApply.value = true
}

/**
 * 确认应用布局
 * 调用 applyLayout 持久化并更新区域状态为 OCCUPIED
 */
async function confirmApplyLayout() {
  if (!selectedPermission.value || !pendingLayout.value) return

  isApplying.value = true
  clearMessage()

  try {
    await merchantApi.applyLayout(selectedPermission.value.areaId, pendingLayout.value)

    // 更新本地区域状态
    const idx = permissions.value.findIndex(
      p => p.permissionId === selectedPermission.value!.permissionId,
    )
    if (idx !== -1) {
      permissions.value[idx].areaStatus = 'OCCUPIED'
    }

    showMessage('success', t('merchant.areaPermission.layoutApplied'))
  } catch (e: any) {
    if (e.response?.status === 403) {
      showMessage('error', t('merchant.areaPermission.noPermission'))
    } else if (e.response?.status === 503) {
      showMessage('error', t('merchant.areaPermission.aiUnavailable'))
    } else {
      showMessage('error', e.message || t('merchant.areaPermission.applyLayoutFailed'))
    }
  } finally {
    isApplying.value = false
    showConfirmApply.value = false
    pendingLayout.value = null
    selectedPermission.value = null
  }
}

function cancelApplyLayout() {
  showConfirmApply.value = false
  pendingLayout.value = null
  selectedPermission.value = null
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
    <MessageAlert v-if="message" :type="message.type" :text="message.text" @close="clearMessage" />

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value">{{ activePermissions.length }}</span>
        <span class="stat-label">{{ t('merchant.areaPermission.activePermissions') }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ permissions.length }}</span>
        <span class="stat-label">{{ t('merchant.areaPermission.totalPermissions') }}</span>
      </div>
    </div>

    <!-- 权限列表 -->
    <div class="table-card">
      <div class="card-header">
        <h3>{{ t('merchant.areaPermission.myPermissions') }}</h3>
      </div>
      <DataTable
        :columns="columns"
        :data="permissions"
        :loading="isLoading"
        :empty-text="t('merchant.areaPermission.noPermissions')"
      >
        <template #status="{ value }">
          <StatusBadge :status="value" domain="permission" />
        </template>
        <template #areaStatus="{ value }">
          <span :class="['area-status-badge', getAreaStatusClass(value)]">
            {{ getAreaStatusText(value) }}
          </span>
        </template>
        <template #grantedAt="{ value }">
          {{ formatDate(value, 'full') }}
        </template>
        <template #actions="{ row }">
          <button
            v-if="canGenerateLayout(row)"
            class="action-btn ai-generate"
            @click="openAIDialog(row)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
            {{ t('merchant.areaPermission.aiGenerateLayout') }}
          </button>
          <span v-else class="text-muted">-</span>
        </template>
      </DataTable>
    </div>

    <!-- AI 布局生成对话框 -->
    <AILayoutDialog
      v-model:visible="showAIDialog"
      :area-id="selectedPermission?.areaId ?? ''"
      :has-existing-content="false"
      @layout-generated="handleLayoutGenerated"
      @close="showAIDialog = false"
    />

    <!-- 应用布局确认提示 -->
    <div v-if="showConfirmApply" class="confirm-overlay">
      <div class="confirm-card">
        <h4 class="confirm-title">{{ t('merchant.areaPermission.confirmApplyTitle') }}</h4>
        <p class="confirm-text">
          {{ t('merchant.areaPermission.confirmApplyText', { areaName: selectedPermission?.areaName }) }}
        </p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" :disabled="isApplying" @click="cancelApplyLayout">
            {{ t('common.cancel') }}
          </button>
          <button class="btn btn-primary" :disabled="isApplying" @click="confirmApplyLayout">
            {{ isApplying ? t('merchant.areaPermission.applying') : t('merchant.areaPermission.confirmApply') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.permission-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

// ============================================================================
// Stats Row
// ============================================================================

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

// ============================================================================
// Table Card
// ============================================================================

.table-card {
  @include card-base;
  overflow: hidden;

  .card-header {
    @include card-header;

    h3 {
      font-size: $font-size-xl - 2;
      font-weight: $font-weight-medium;
    }
  }
}

// ============================================================================
// Area Status Badge
// ============================================================================

.area-status-badge {
  @include status-badge;
}

.status-available {
  @include status-variant(var(--accent-muted), var(--accent-primary));
}

.status-pending {
  @include status-variant(rgba(var(--warning-rgb), 0.15), var(--warning));
}

.status-authorized {
  @include status-variant(rgba(var(--info-rgb), 0.15), var(--info));
}

.status-occupied {
  @include status-variant(rgba(var(--success-rgb), 0.15), var(--success));
}

.text-muted {
  @include text-muted;
}

// ============================================================================
// Action Button
// ============================================================================

.action-btn {
  @include btn-action;
  display: inline-flex;
  align-items: center;
  gap: $space-1 + 2;

  &.ai-generate {
    background: rgba(var(--accent-primary-rgb), 0.2);
    color: var(--accent-primary);

    &:hover {
      background: rgba(var(--accent-primary-rgb), 0.3);
    }
  }
}

.action-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

// ============================================================================
// Confirm Overlay
// ============================================================================

.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.confirm-card {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  width: 420px;
  padding: $space-6;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-xl;
}

.confirm-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: var(--text-primary);
}

.confirm-text {
  font-size: $font-size-base;
  color: var(--text-secondary);
  line-height: 1.6;

  strong {
    color: var(--text-primary);
    font-weight: $font-weight-medium;
  }
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
}

// ============================================================================
// Buttons
// ============================================================================

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
