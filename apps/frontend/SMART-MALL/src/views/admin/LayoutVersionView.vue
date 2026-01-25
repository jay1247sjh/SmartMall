<script setup lang="ts">
/**
 * 布局版本管理页面
 * 管理商城布局的版本发布和回滚
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable, Modal, MessageAlert, StatusBadge, ActionButton } from '@/components'
import { useMessage, useFormatters, useStatusConfig } from '@/composables'
import { mallManageApi } from '@/api'
import type { LayoutVersion } from '@/api/mall-manage.api'

// ============================================================================
// Types & Constants
// ============================================================================

interface OverviewCard {
  key: string
  icon: string
  label: string
  getValue: () => string | number
}

// ============================================================================
// Composables
// ============================================================================

const { message, success, error } = useMessage()
const { formatDateTime } = useFormatters()
const { getStatusText, getStatusClass } = useStatusConfig('version')

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const versions = ref<LayoutVersion[]>([])
const showDetailModal = ref(false)
const selectedVersion = ref<LayoutVersion | null>(null)
const isProcessing = ref(false)

// ============================================================================
// Computed
// ============================================================================

const activeVersion = computed(() => versions.value.find(v => v.status === 'ACTIVE'))
const draftVersion = computed(() => versions.value.find(v => v.status === 'DRAFT'))

const overviewCards = computed<OverviewCard[]>(() => [
  { key: 'active', icon: '🟢', label: '当前版本', getValue: () => activeVersion.value?.version || '-' },
  { key: 'draft', icon: '📝', label: '草稿版本', getValue: () => draftVersion.value?.version || '-' },
  { key: 'total', icon: '📦', label: '版本总数', getValue: () => versions.value.length },
])

const columns = [
  { key: 'version', title: '版本号', minWidth: '100' },
  { key: 'status', title: '状态', minWidth: '80' },
  { key: 'description', title: '描述', minWidth: '150' },
  { key: 'changeCount', title: '变更数', minWidth: '80' },
  { key: 'createdBy', title: '创建者', minWidth: '100' },
  { key: 'createdAt', title: '创建时间', minWidth: '140' },
  { key: 'actions', title: '操作', minWidth: '120' },
]

const detailFields = computed(() => [
  { key: 'version', label: '版本号', isTitle: true },
  { key: 'description', label: '描述' },
  { key: 'changeCount', label: '变更数量', format: (v: number) => `${v} 项变更` },
  { key: 'createdBy', label: '创建者' },
  { key: 'createdAt', label: '创建时间', format: formatDateTime },
])

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

function viewDetail(version: LayoutVersion) {
  selectedVersion.value = version
  showDetailModal.value = true
}

async function updateVersionStatus(version: LayoutVersion, action: 'publish' | 'rollback') {
  const actionText = action === 'publish' ? '发布' : '回滚到'
  const confirmMsg = action === 'publish' 
    ? `确定发布版本 "${version.version}" 吗？发布后将成为当前生效版本。`
    : `确定回滚到版本 "${version.version}" 吗？当前版本将被归档。`
  
  if (!confirm(confirmMsg)) return
  
  isProcessing.value = true
  try {
    action === 'publish' 
      ? await mallManageApi.publishVersion(version.id)
      : await mallManageApi.rollbackVersion(version.id)
    
    versions.value.forEach(v => { if (v.status === 'ACTIVE') v.status = 'ARCHIVED' })
    const target = versions.value.find(v => v.id === version.id)
    if (target) target.status = 'ACTIVE'
    
    success(`${actionText}版本 ${version.version} 成功`)
  } catch (e: any) {
    error(e.message || `${actionText}失败`)
  } finally {
    isProcessing.value = false
  }
}

const publishVersion = (v: LayoutVersion) => updateVersionStatus(v, 'publish')
const rollbackVersion = (v: LayoutVersion) => updateVersionStatus(v, 'rollback')

function getFieldValue(field: any): string {
  if (!selectedVersion.value) return ''
  const value = selectedVersion.value[field.key as keyof LayoutVersion]
  return field.format ? field.format(value) : String(value ?? '')
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(loadData)
</script>

<template>
  <main class="version-page">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" />

    <!-- 版本概览 -->
    <section class="overview-cards" aria-label="版本概览">
      <article v-for="card in overviewCards" :key="card.key" class="overview-card">
        <span class="card-icon" aria-hidden="true">{{ card.icon }}</span>
        <div class="card-content">
          <span class="card-label">{{ card.label }}</span>
          <strong class="card-value">{{ card.getValue() }}</strong>
        </div>
      </article>
    </section>

    <!-- 版本列表 -->
    <section class="version-table" aria-label="版本列表">
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
            <mark v-if="row.status === 'ACTIVE'" class="current-tag">当前</mark>
          </div>
        </template>
        <template #status="{ value }">
          <StatusBadge :status="value" domain="version" />
        </template>
        <template #createdAt="{ value }">
          <time :datetime="value">{{ formatDateTime(value) }}</time>
        </template>
        <template #actions="{ row }">
          <nav class="action-btns" @click.stop>
            <ActionButton v-if="row.status === 'DRAFT'" variant="publish" :disabled="isProcessing" @click="publishVersion(row)">
              发布
            </ActionButton>
            <ActionButton v-if="row.status === 'ARCHIVED'" variant="rollback" :disabled="isProcessing" @click="rollbackVersion(row)">
              回滚
            </ActionButton>
            <ActionButton variant="view" @click="viewDetail(row)">详情</ActionButton>
          </nav>
        </template>
      </DataTable>
    </section>

    <!-- 详情弹窗 -->
    <Modal v-model:visible="showDetailModal" title="版本详情" width="500px">
      <dl v-if="selectedVersion" class="detail-content">
        <div class="detail-item">
          <dt>状态</dt>
          <dd><StatusBadge :status="selectedVersion.status" domain="version" /></dd>
        </div>
        <div v-for="field in detailFields" :key="field.key" class="detail-item">
          <dt>{{ field.label }}</dt>
          <dd :class="{ 'version-value': field.isTitle }">{{ getFieldValue(field) }}</dd>
        </div>
      </dl>

      <template #footer>
        <footer class="modal-actions">
          <button
            v-if="selectedVersion?.status === 'DRAFT'"
            class="btn btn-publish"
            :disabled="isProcessing"
            @click="selectedVersion && publishVersion(selectedVersion)"
          >发布此版本</button>
          <button
            v-if="selectedVersion?.status === 'ARCHIVED'"
            class="btn btn-rollback"
            :disabled="isProcessing"
            @click="selectedVersion && rollbackVersion(selectedVersion)"
          >回滚到此版本</button>
          <button class="btn btn-secondary" @click="showDetailModal = false">关闭</button>
        </footer>
      </template>
    </Modal>
  </main>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.version-page {
  @include flex-column;
  gap: $space-5;
}

// Overview Cards - 使用 stats-row mixin
.overview-cards {
  @include stats-row;
}

.overview-card {
  @include stat-item;
  flex-direction: row;
  align-items: center;
  gap: $space-4;

  .card-icon {
    font-size: 28px;
  }

  .card-content {
    @include flex-column;
    gap: $space-1;

    .card-label {
      @include stat-label;
    }

    .card-value {
      @include stat-value;
    }
  }
}

// Version Table - 使用 table-container mixin
.version-table {
  @include table-container;
}

.version-cell {
  @include flex-center-y;
  gap: $space-2;

  .version-text {
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  .current-tag {
    @include status-badge;
    @include status-variant($color-success-muted, $color-success);
  }
}

.action-btns {
  @include action-btns;
}

// Detail Modal
.detail-content {
  @include flex-column;
  gap: $space-5;
  margin: 0;

  .detail-item {
    @include form-item;

    dt {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }

    dd {
      font-size: $font-size-lg;
      color: $color-text-primary;
      margin: 0;
      line-height: 1.6;

      &.version-value {
        font-weight: $font-weight-semibold;
        font-size: $font-size-xl;
      }
    }
  }
}

.modal-actions {
  @include dialog-footer;
  padding: 0;
  border-top: none;
}

// Buttons - 使用 btn mixins
.btn {
  @include btn-base;
  padding: $space-2 + 2 $space-5;

  &-secondary {
    @include btn-secondary;
  }

  &-publish {
    @include btn-success;
  }

  &-rollback {
    background: $color-warning;
    color: $color-bg-primary;

    &:hover:not(:disabled) {
      background: $color-warning-hover;
    }
  }
}
</style>
