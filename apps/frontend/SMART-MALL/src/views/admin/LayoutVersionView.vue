<script setup lang="ts">
/**
 * 布局版本管理页面
 * 管理商城布局的版本激活、恢复、删除和描述编辑
 * 版本列表按大版本号分组展示
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DataTable, Modal, ConfirmModal, MessageAlert, StatusBadge, ActionButton } from '@/components'
import { useMessage, useFormatters } from '@/composables'
import {
  getVersions,
  activateVersion,
  restoreVersion,
  deleteVersion,
  updateVersionDescription,
} from '@/api/mall-manage.api'
import type { LayoutVersionItem } from '@/api/mall-manage.api'

// ============================================================================
// Types
// ============================================================================

interface VersionGroup {
  majorVersion: string
  label: string
  versions: LayoutVersionItem[]
  collapsed: boolean
}

type ConfirmAction = 'activate' | 'restore' | 'delete'

// ============================================================================
// Composables
// ============================================================================

const router = useRouter()
const { t } = useI18n()
const { message, success, error } = useMessage()
const { formatDateTime } = useFormatters()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const versions = ref<LayoutVersionItem[]>([])
const isProcessing = ref(false)

// Detail modal
const showDetailModal = ref(false)
const selectedVersion = ref<LayoutVersionItem | null>(null)
const editingDescription = ref('')
const isSavingDescription = ref(false)

// Confirm modal
const showConfirmModal = ref(false)
const confirmAction = ref<ConfirmAction>('activate')
const confirmTarget = ref<LayoutVersionItem | null>(null)

// Restore success navigation
const showRestoreSuccess = ref(false)

// ============================================================================
// Computed
// ============================================================================

const activeVersion = computed(() => versions.value.find(v => v.status === 'ACTIVE'))
const archivedCount = computed(() => versions.value.filter(v => v.status === 'ARCHIVED').length)

const columns = computed(() => [
  { key: 'versionNumber', title: t('admin.versionNumber'), minWidth: '100' },
  { key: 'status', title: t('admin.status'), minWidth: '100' },
  { key: 'description', title: t('admin.description'), minWidth: '160' },
  { key: 'changeCount', title: t('admin.changeCount'), minWidth: '80' },
  { key: 'creatorId', title: t('admin.creator'), minWidth: '100' },
  { key: 'createdAt', title: t('admin.createdAt'), minWidth: '150' },
  { key: 'actions', title: t('admin.actions'), minWidth: '260' },
])

const groupedVersions = computed<VersionGroup[]>(() => {
  const groups = new Map<string, LayoutVersionItem[]>()
  for (const v of versions.value) {
    const major = v.versionNumber.match(/^v(\d+)\./)?.[1] || '0'
    if (!groups.has(major)) groups.set(major, [])
    groups.get(major)!.push(v)
  }
  return Array.from(groups.entries())
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([major, items]) => ({
      majorVersion: major,
      label: `v${major}.x`,
      versions: items,
      collapsed: false,
    }))
})

const confirmMessages = computed<Record<ConfirmAction, (v: LayoutVersionItem) => string>>(() => ({
  activate: (v) => t('admin.confirmActivate', { version: v.versionNumber }),
  restore: (v) => t('admin.confirmRestore', { version: v.versionNumber }),
  delete: (v) => t('admin.confirmDelete', { version: v.versionNumber }),
}))

const confirmTitles = computed<Record<ConfirmAction, string>>(() => ({
  activate: t('admin.activateVersion'),
  restore: t('admin.restoreVersion'),
  delete: t('admin.deleteVersion'),
}))

const confirmVariants: Record<ConfirmAction, 'primary' | 'danger' | 'warning'> = {
  activate: 'primary',
  restore: 'warning',
  delete: 'danger',
}

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    versions.value = await getVersions()
  } catch (e: any) {
    error(e.message || t('admin.loadVersionsFailed'))
  } finally {
    isLoading.value = false
  }
}

// --- Preview ---
function handlePreview(version: LayoutVersionItem) {
  router.push({ path: '/admin/mall-builder/preview', query: { versionId: version.versionId, versionNumber: version.versionNumber } })
}

// --- Confirm actions ---
function requestConfirm(action: ConfirmAction, version: LayoutVersionItem) {
  confirmAction.value = action
  confirmTarget.value = version
  showConfirmModal.value = true
}

async function handleConfirm() {
  const version = confirmTarget.value
  if (!version) return

  showConfirmModal.value = false
  isProcessing.value = true

  try {
    switch (confirmAction.value) {
      case 'activate':
        await handleActivate(version)
        break
      case 'restore':
        await handleRestore(version)
        break
      case 'delete':
        await handleDelete(version)
        break
    }
  } finally {
    isProcessing.value = false
  }
}

async function handleActivate(version: LayoutVersionItem) {
  try {
    const updated = await activateVersion(version.versionId)
    // Update local state: old ACTIVE → ARCHIVED, target → ACTIVE
    versions.value = versions.value.map(v => {
      if (v.versionId === updated.versionId) return updated
      if (v.status === 'ACTIVE') return { ...v, status: 'ARCHIVED' as const }
      return v
    })
    success(t('admin.versionActivated', { version: version.versionNumber }))
  } catch (e: any) {
    error(e.message || t('admin.activateFailed'))
  }
}

async function handleRestore(version: LayoutVersionItem) {
  try {
    await restoreVersion(version.versionId)
    success(t('admin.versionRestored', { version: version.versionNumber }))
    showRestoreSuccess.value = true
  } catch (e: any) {
    error(e.message || t('admin.restoreFailed'))
  }
}

async function handleDelete(version: LayoutVersionItem) {
  try {
    await deleteVersion(version.versionId)
    versions.value = versions.value.filter(v => v.versionId !== version.versionId)
    success(t('admin.versionDeleted', { version: version.versionNumber }))
  } catch (e: any) {
    error(e.message || t('admin.deleteFailed'))
  }
}

function goToBuilder() {
  showRestoreSuccess.value = false
  router.push('/admin/mall-builder')
}

// --- Detail modal ---
function openDetail(version: LayoutVersionItem) {
  selectedVersion.value = version
  editingDescription.value = version.description || ''
  showDetailModal.value = true
}

async function saveDescription() {
  if (!selectedVersion.value) return
  isSavingDescription.value = true
  const originalDesc = selectedVersion.value.description
  try {
    const updated = await updateVersionDescription(selectedVersion.value.versionId, editingDescription.value)
    // Update in list
    const idx = versions.value.findIndex(v => v.versionId === updated.versionId)
    if (idx !== -1) versions.value[idx] = updated
    selectedVersion.value = updated
    success(t('admin.descriptionUpdated'))
  } catch (e: any) {
    editingDescription.value = originalDesc
    error(e.message || t('admin.descriptionUpdateFailed'))
  } finally {
    isSavingDescription.value = false
  }
}

function canActivate(v: LayoutVersionItem) {
  return v.status === 'PUBLISHED' || v.status === 'ARCHIVED'
}

function canRestore(v: LayoutVersionItem) {
  return v.status === 'PUBLISHED' || v.status === 'ARCHIVED'
}

function canDelete(v: LayoutVersionItem) {
  return v.status !== 'ACTIVE'
}

function toggleGroup(group: VersionGroup) {
  group.collapsed = !group.collapsed
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(loadData)
</script>

<template>
  <main class="version-page">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" />

    <!-- Restore success banner -->
    <aside v-if="showRestoreSuccess" class="restore-banner" role="status">
      <span class="restore-text">{{ t('admin.draftCreated') }}</span>
      <button class="btn btn-nav" @click="goToBuilder">{{ t('admin.goToBuilderEdit') }}</button>
      <button class="btn-dismiss" :aria-label="t('common.close')" @click="showRestoreSuccess = false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </aside>

    <!-- 版本概览 -->
    <section class="overview-cards" :aria-label="t('admin.versionOverview')">
      <article class="overview-card">
        <div class="card-indicator indicator-active"></div>
        <div class="card-content">
          <span class="card-label">{{ t('admin.currentVersion') }}</span>
          <strong class="card-value">{{ activeVersion?.versionNumber || '-' }}</strong>
        </div>
      </article>
      <article class="overview-card">
        <div class="card-indicator indicator-total"></div>
        <div class="card-content">
          <span class="card-label">{{ t('admin.totalVersions') }}</span>
          <strong class="card-value">{{ versions.length }}</strong>
        </div>
      </article>
      <article class="overview-card">
        <div class="card-indicator indicator-archived"></div>
        <div class="card-content">
          <span class="card-label">{{ t('admin.archived') }}</span>
          <strong class="card-value">{{ archivedCount }}</strong>
        </div>
      </article>
    </section>

    <!-- 版本列表（按大版本号分组） -->
    <section class="version-groups" :aria-label="t('admin.versionList')">
      <div v-if="isLoading" class="loading-state">{{ t('common.loading') }}</div>
      <div v-else-if="groupedVersions.length === 0" class="empty-state">{{ t('admin.noVersionRecords') }}</div>

      <div v-for="group in groupedVersions" :key="group.majorVersion" class="version-group">
        <button class="group-header" @click="toggleGroup(group)">
          <svg
            class="chevron-icon"
            :class="{ collapsed: group.collapsed }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="16"
            height="16"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          <span class="group-label">{{ group.label }}</span>
          <span class="group-count">{{ t('admin.versionCount', { count: group.versions.length }) }}</span>
        </button>

        <div v-show="!group.collapsed" class="group-content">
          <DataTable
            :columns="columns"
            :data="group.versions"
            :loading="false"
            :empty-text="t('admin.noVersions')"
          >
            <template #versionNumber="{ value, row }">
              <div class="version-cell">
                <span class="version-text">{{ value }}</span>
                <mark v-if="row.status === 'ACTIVE'" class="current-tag">{{ t('admin.current') }}</mark>
              </div>
            </template>
            <template #status="{ value }">
              <StatusBadge :status="value" domain="version" />
            </template>
            <template #description="{ value }">
              <span class="desc-text">{{ value || '-' }}</span>
            </template>
            <template #createdAt="{ value }">
              <time :datetime="value">{{ formatDateTime(value) }}</time>
            </template>
            <template #actions="{ row }">
              <nav class="action-btns" @click.stop>
                <ActionButton variant="view" @click="handlePreview(row)">{{ t('admin.preview') }}</ActionButton>
                <ActionButton
                  v-if="canActivate(row)"
                  variant="publish"
                  :disabled="isProcessing"
                  @click="requestConfirm('activate', row)"
                >{{ t('admin.activate') }}</ActionButton>
                <ActionButton
                  v-if="canRestore(row)"
                  variant="rollback"
                  :disabled="isProcessing"
                  @click="requestConfirm('restore', row)"
                >{{ t('admin.restore') }}</ActionButton>
                <ActionButton
                  variant="delete"
                  :disabled="!canDelete(row) || isProcessing"
                  @click="requestConfirm('delete', row)"
                >{{ t('admin.delete') }}</ActionButton>
                <ActionButton variant="view" @click="openDetail(row)">{{ t('admin.detail') }}</ActionButton>
              </nav>
            </template>
          </DataTable>
        </div>
      </div>
    </section>

    <!-- 详情弹窗（可编辑描述） -->
    <Modal v-model:visible="showDetailModal" :title="t('admin.versionDetail')" width="520px">
      <dl v-if="selectedVersion" class="detail-content">
        <div class="detail-item">
          <dt>{{ t('admin.versionNumber') }}</dt>
          <dd class="version-value">{{ selectedVersion.versionNumber }}</dd>
        </div>
        <div class="detail-item">
          <dt>{{ t('admin.status') }}</dt>
          <dd><StatusBadge :status="selectedVersion.status" domain="version" /></dd>
        </div>
        <div class="detail-item">
          <dt>{{ t('admin.description') }}</dt>
          <dd>
            <textarea
              v-model="editingDescription"
              class="desc-textarea"
              rows="3"
              :placeholder="t('admin.descriptionPlaceholder')"
            />
          </dd>
        </div>
        <div class="detail-item">
          <dt>{{ t('admin.changeCount') }}</dt>
          <dd>{{ t('admin.changes', { count: selectedVersion.changeCount }) }}</dd>
        </div>
        <div class="detail-item">
          <dt>{{ t('admin.creator') }}</dt>
          <dd>{{ selectedVersion.creatorId }}</dd>
        </div>
        <div class="detail-item">
          <dt>{{ t('admin.createdAt') }}</dt>
          <dd>{{ formatDateTime(selectedVersion.createdAt) }}</dd>
        </div>
      </dl>

      <template #footer>
        <button
          class="btn btn-primary"
          :disabled="isSavingDescription"
          @click="saveDescription"
        >{{ isSavingDescription ? t('admin.saving') : t('admin.saveDescription') }}</button>
        <button class="btn btn-secondary" @click="showDetailModal = false">{{ t('common.close') }}</button>
      </template>
    </Modal>

    <!-- 二次确认弹窗 -->
    <ConfirmModal
      v-model:visible="showConfirmModal"
      :title="confirmTitles[confirmAction]"
      :confirm-text="confirmTitles[confirmAction]"
      :confirm-variant="confirmVariants[confirmAction]"
      :processing="isProcessing"
      @confirm="handleConfirm"
    >
      <p v-if="confirmTarget" class="confirm-message">
        {{ confirmMessages[confirmAction](confirmTarget) }}
      </p>
    </ConfirmModal>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// Page Layout
// ============================================================================

.version-page {
  @include flex-column;
  gap: $space-5;
}

// ============================================================================
// Restore Success Banner
// ============================================================================

.restore-banner {
  @include flex-center-y;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: rgba(var(--success-rgb), 0.15);
  border: 1px solid rgba(var(--success-rgb), 0.2);
  border-radius: $radius-md;
  color: var(--success);

  .restore-text {
    flex: 1;
    font-size: $font-size-base;
  }

  .btn-nav {
    padding: $space-1 + 2 $space-3;
    font-size: $font-size-sm;
    background: rgba(var(--success-rgb), 0.2);
    color: var(--success);
    border: none;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background $duration-normal;

    &:hover {
      background: rgba(var(--success-rgb), 0.3);
    }
  }

  .btn-dismiss {
    background: none;
    border: none;
    color: var(--success);
    cursor: pointer;
    padding: $space-1;
    line-height: 1;
    opacity: 0.7;
    transition: opacity $duration-normal;

    &:hover {
      opacity: 1;
    }
  }
}

// ============================================================================
// Overview Cards
// ============================================================================

.overview-cards {
  @include stats-row;
}

.overview-card {
  @include stat-item;
  flex-direction: row;
  align-items: center;
  gap: $space-4;

  .card-indicator {
    width: 4px;
    height: 36px;
    border-radius: 2px;

    &.indicator-active {
      background: var(--success);
    }

    &.indicator-total {
      background: var(--accent-primary);
    }

    &.indicator-archived {
      background: var(--text-muted);
    }
  }

  .card-content {
    @include flex-column;
    gap: $space-1;

    .card-label {
      @include stat-label;
    }

    .card-value {
      @include stat-value;
      font-size: 22px;
    }
  }
}

// ============================================================================
// Version Groups
// ============================================================================

.version-groups {
  @include flex-column;
  gap: $space-4;
}

.loading-state,
.empty-state {
  @include flex-center;
  padding: $space-10;
  color: var(--text-muted);
  font-size: $font-size-base;
}

.version-group {
  @include card-base;
  overflow: hidden;
}

.group-header {
  @include flex-center-y;
  gap: $space-3;
  width: 100%;
  padding: $space-4 $space-5;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: background $duration-normal;

  &:hover {
    background: rgba(var(--text-primary-rgb), 0.04);
  }

  .chevron-icon {
    color: var(--text-secondary);
    transition: transform $duration-normal;
    flex-shrink: 0;

    &.collapsed {
      transform: rotate(-90deg);
    }
  }

  .group-label {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
  }

  .group-count {
    font-size: $font-size-sm;
    color: var(--text-muted);
    margin-left: auto;
  }
}

.group-content {
  // DataTable inside group — remove extra border/radius
  :deep(.data-table-wrapper) {
    .data-table {
      border: none;
      border-radius: 0;
    }
  }
}

// ============================================================================
// Version Table Cells
// ============================================================================

.version-cell {
  @include flex-center-y;
  gap: $space-2;

  .version-text {
    font-weight: $font-weight-medium;
    color: var(--text-primary);
  }

  .current-tag {
    @include status-badge;
    @include status-variant(rgba(var(--success-rgb), 0.15), var(--success));
    font-size: $font-size-xs;
  }
}

.desc-text {
  @include line-clamp(1);
  color: var(--text-secondary);
}

.action-btns {
  @include action-btns;
  flex-wrap: wrap;
}

// ============================================================================
// Detail Modal
// ============================================================================

.detail-content {
  @include flex-column;
  gap: $space-5;
  margin: 0;

  .detail-item {
    @include form-item;

    dt {
      font-size: $font-size-sm;
      color: var(--text-secondary);
    }

    dd {
      font-size: $font-size-base;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.6;

      &.version-value {
        font-weight: $font-weight-semibold;
        font-size: $font-size-xl;
      }
    }
  }
}

.desc-textarea {
  @include form-textarea;
  min-height: 72px;
}

// ============================================================================
// Confirm Modal
// ============================================================================

.confirm-message {
  margin: 0;
  font-size: $font-size-base;
  color: var(--text-primary);
  line-height: 1.6;
}

// ============================================================================
// Buttons
// ============================================================================

.btn {
  @include btn-base;
  padding: $space-2 + 2 $space-5;

  &-primary {
    @include btn-primary;
  }

  &-secondary {
    @include btn-secondary;
  }
}
</style>
