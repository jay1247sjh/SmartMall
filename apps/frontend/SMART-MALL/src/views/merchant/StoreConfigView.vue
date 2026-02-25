<script setup lang="ts">
/**
 * 店铺配置视图
 *
 * 商家管理自己店铺信息的页面。
 *
 * 业务职责：
 * - 展示商家的所有店铺列表
 * - 查看和编辑店铺详细信息（名称、描述、分类、营业时间）
 * - 显示店铺状态和位置信息
 * - 创建新店铺（需要先有区域权限）
 * - 激活/暂停店铺营业
 * 
 * Requirements: 2.4, 2.5
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { MessageAlert } from '@/components'
import { storeApi, areaPermissionApi } from '@/api'
import type { StoreDTO, UpdateStoreRequest } from '@/api/store.api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'
import { StoreList, StoreForm } from '@/components/store'
import { useMessage } from '@/composables'
import type { StoreFormData } from '@/components/store/StoreForm.vue'
import {
  FULL_DAY_BUSINESS_HOURS,
  buildBusinessHoursFromPicker,
  isAllDayBusinessHours,
  isValidBusinessHours,
  toDisplayBusinessHours,
  toPickerRange,
  type BusinessHoursRange,
} from '@/utils/business-hours'

const { t } = useI18n()
const router = useRouter()
const { message, showMessage, clearMessage } = useMessage()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stores = ref<StoreDTO[]>([])
const selectedStore = ref<StoreDTO | null>(null)
const permissions = ref<AreaPermissionDTO[]>([])

// 编辑状态
const isEditing = ref(false)
const editForm = ref<UpdateStoreRequest>({
  name: '',
  description: '',
  category: '',
  businessHours: '',
})

// 创建店铺对话框
const showCreateDialog = ref(false)

// 操作状态
const isProcessing = ref(false)
const businessHoursRange = ref<BusinessHoursRange | null>(null)
const allDayBusiness = ref(false)
const showLegacyHint = ref(false)
const businessHoursTouched = ref(false)
const businessHoursError = ref('')

// ============================================================================
// Computed
// ============================================================================

const categories = computed(() => [
  t('merchant.catCatering'),
  t('merchant.catRetail'),
  t('merchant.catClothing'),
  t('merchant.catEntertainment'),
  t('merchant.catService'),
  t('merchant.catOther'),
])

// 可用于创建店铺的区域（有权限但还没有店铺的区域）
const availableAreasForCreate = computed(() => {
  const storeAreaIds = stores.value.map(s => s.areaId)
  return permissions.value.filter(p => 
    p.status === 'ACTIVE' && !storeAreaIds.includes(p.areaId)
  )
})

// 当前选中店铺的ID
const selectedStoreId = computed(() => selectedStore.value?.storeId ?? null)

const displayBusinessHours = computed(() => {
  if (!selectedStore.value?.businessHours) {
    return '-'
  }
  return (
    toDisplayBusinessHours(selectedStore.value.businessHours, {
      allDayText: t('store.open24Hours'),
      nextDayPrefix: t('store.nextDayPrefix'),
    }) || '-'
  )
})

const canToggleStoreStatus = computed(() => {
  if (!selectedStore.value) {
    return false
  }
  return selectedStore.value.status === 'ACTIVE' || selectedStore.value.status === 'INACTIVE'
})

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    const [storeList, permissionList] = await Promise.all([
      storeApi.getMyStores(),
      areaPermissionApi.getMyPermissions()
    ])
    stores.value = storeList
    permissions.value = permissionList
    
    const firstStore = stores.value[0]
    if (firstStore && !selectedStore.value) {
      selectStore(firstStore)
    }
  } catch (e) {
    console.error('加载数据失败:', e)
    showMessage('error', t('merchant.loadDataFailed'))
  } finally {
    isLoading.value = false
  }
}

function syncBusinessHoursState(raw: string | null | undefined) {
  allDayBusiness.value = isAllDayBusinessHours(raw)
  businessHoursRange.value = toPickerRange(raw)
  showLegacyHint.value = Boolean(raw && !allDayBusiness.value && !businessHoursRange.value)
  businessHoursTouched.value = false
  businessHoursError.value = ''
}

function handleBusinessHoursChange(value: string[] | null) {
  businessHoursTouched.value = true
  businessHoursError.value = ''
  showLegacyHint.value = false

  if (!value || value.length !== 2) {
    businessHoursRange.value = null
    editForm.value.businessHours = ''
    return
  }

  const [start, end] = value
  if (!start || !end) {
    businessHoursRange.value = null
    editForm.value.businessHours = ''
    return
  }

  const nextRange: BusinessHoursRange = [start, end]
  if (nextRange[0] === nextRange[1]) {
    businessHoursError.value = t('store.businessHoursEqualHint')
    return
  }

  businessHoursRange.value = nextRange
  editForm.value.businessHours = buildBusinessHoursFromPicker(nextRange, false)
}

function handleAllDayChange(value: boolean) {
  businessHoursTouched.value = true
  allDayBusiness.value = value
  businessHoursError.value = ''
  showLegacyHint.value = false

  if (value) {
    businessHoursRange.value = null
    editForm.value.businessHours = FULL_DAY_BUSINESS_HOURS
  } else if (editForm.value.businessHours === FULL_DAY_BUSINESS_HOURS) {
    editForm.value.businessHours = ''
  }
}

function selectStore(store: StoreDTO) {
  selectedStore.value = store
  isEditing.value = false
  editForm.value = {
    name: store.name,
    description: store.description || '',
    category: store.category,
    businessHours: store.businessHours || '',
  }
  syncBusinessHoursState(store.businessHours)
}

function handleStoreSelect(store: StoreDTO) {
  selectStore(store)
}

function handleStoreEdit(store: StoreDTO) {
  selectStore(store)
  startEdit()
}

function handleStoreDelete(store: StoreDTO) {
  // 删除功能预留
  console.log('Delete store:', store.storeId)
}

function goToProductManage() {
  if (!selectedStore.value) return
  router.push({
    path: '/merchant/product',
    query: { storeId: selectedStore.value.storeId },
  })
}

function startEdit() {
  if (!selectedStore.value) return
  isEditing.value = true
  syncBusinessHoursState(editForm.value.businessHours)
}

function cancelEdit() {
  if (!selectedStore.value) return
  isEditing.value = false
  editForm.value = {
    name: selectedStore.value.name,
    description: selectedStore.value.description || '',
    category: selectedStore.value.category,
    businessHours: selectedStore.value.businessHours || '',
  }
  syncBusinessHoursState(selectedStore.value.businessHours)
}

async function saveStore() {
  if (!selectedStore.value) return

  const payload: UpdateStoreRequest = {
    ...editForm.value,
  }

  if (businessHoursTouched.value) {
    if (allDayBusiness.value) {
      payload.businessHours = FULL_DAY_BUSINESS_HOURS
    } else if (businessHoursRange.value) {
      if (businessHoursRange.value[0] === businessHoursRange.value[1]) {
        businessHoursError.value = t('store.businessHoursEqualHint')
        return
      }
      payload.businessHours = buildBusinessHoursFromPicker(businessHoursRange.value, false)
    } else {
      payload.businessHours = ''
    }

    if (payload.businessHours && !isValidBusinessHours(payload.businessHours)) {
      businessHoursError.value = t('store.businessHoursInvalidHint')
      return
    }
  } else {
    delete payload.businessHours
  }

  isProcessing.value = true
  clearMessage()

  try {
    const updated = await storeApi.updateStore(selectedStore.value.storeId, payload)
    
    // 更新本地状态
    const index = stores.value.findIndex(s => s.storeId === selectedStore.value!.storeId)
    if (index !== -1) {
      stores.value[index] = updated
      selectedStore.value = updated
    }
    
    isEditing.value = false
    syncBusinessHoursState(updated.businessHours)
    showMessage('success', t('merchant.storeSaved'))
  } catch (e: any) {
    showMessage('error', e.message || t('merchant.saveFailed'))
  } finally {
    isProcessing.value = false
  }
}

function openCreateDialog() {
  showCreateDialog.value = true
}

function handleCreateDialogClose() {
  showCreateDialog.value = false
}

async function handleCreateSubmit(formData: StoreFormData) {
  if (!formData.areaId || !formData.name || !formData.category) {
    showMessage('error', t('merchant.fillRequired'))
    return
  }
  
  isProcessing.value = true
  clearMessage()
  try {
    const newStore = await storeApi.createStore({
      areaId: formData.areaId,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      businessHours: formData.businessHours || undefined,
    })
    stores.value.unshift(newStore)
    selectStore(newStore)
    showCreateDialog.value = false
    showMessage('success', t('merchant.storeCreated'))
  } catch (e: any) {
    showMessage('error', e.message || t('merchant.createFailed'))
  } finally {
    isProcessing.value = false
  }
}

async function toggleStoreStatus() {
  if (!selectedStore.value) return

  const store = selectedStore.value
  if (!canToggleStoreStatus.value) {
    showMessage('error', t('merchant.statusNotSupported'))
    return
  }
  isProcessing.value = true
  clearMessage()

  try {
    if (store.status === 'ACTIVE') {
      await storeApi.deactivateStore(store.storeId)
      store.status = 'INACTIVE'
      showMessage('success', t('merchant.storePaused'))
    } else {
      await storeApi.activateStore(store.storeId)
      store.status = 'ACTIVE'
      showMessage('success', t('merchant.storeResumed'))
    }
  } catch (e: any) {
    showMessage('error', e.message || t('merchant.operationFailed'))
  } finally {
    isProcessing.value = false
  }
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'status-active',
    INACTIVE: 'status-inactive',
    PENDING: 'status-pending',
    CLOSED: 'status-closed',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: t('merchant.statusActive'),
    INACTIVE: t('merchant.statusInactiveFull'),
    PENDING: t('merchant.statusPending'),
    CLOSED: t('merchant.statusClosed'),
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
  <div class="store-config-page">
    <!-- 消息提示 -->
    <MessageAlert v-if="message" :type="message.type" :text="message.text" closable-on-click @close="clearMessage" />

    <div class="content-grid">
      <!-- 左侧：店铺列表 -->
      <div class="store-list-panel">
        <div class="panel-header">
          <h3>{{ t('merchant.myStores') }}</h3>
          <div class="header-actions">
            <span class="store-count">{{ t('merchant.storeCount', { count: stores.length }) }}</span>
            <button 
              v-if="availableAreasForCreate.length > 0"
              class="btn-add" 
              @click="openCreateDialog"
              :title="t('merchant.createNewStore')"
            >+</button>
          </div>
        </div>

        <!-- 使用 StoreList 子组件 -->
        <StoreList
          :stores="stores"
          :selected-id="selectedStoreId"
          :loading="isLoading"
          @select="handleStoreSelect"
          @edit="handleStoreEdit"
          @delete="handleStoreDelete"
        >
          <template #empty-action>
            <button 
              v-if="availableAreasForCreate.length > 0"
              class="btn btn-primary btn-sm"
              @click="openCreateDialog"
            >{{ t('merchant.createStore') }}</button>
          </template>
        </StoreList>
      </div>

      <!-- 右侧：店铺详情 -->
      <div class="store-detail-panel">
        <template v-if="selectedStore">
          <div class="detail-header">
            <div class="header-left">
              <div class="store-avatar-large">
                {{ selectedStore.name.charAt(0) }}
              </div>
              <div class="header-info">
                <h2>{{ selectedStore.name }}</h2>
                <span class="location">{{ selectedStore.floorName }} · {{ selectedStore.areaName }}</span>
              </div>
            </div>
            <span :class="['status-badge', getStatusClass(selectedStore.status)]">
              {{ getStatusText(selectedStore.status) }}
            </span>
          </div>

          <div class="detail-form">
            <div class="form-item">
              <label>{{ t('merchant.storeName') }}</label>
              <input
                v-if="isEditing"
                v-model="editForm.name"
                type="text"
                class="input"
                :placeholder="t('merchant.storeNamePlaceholder')"
              />
              <span v-else class="value">{{ selectedStore.name }}</span>
            </div>

            <div class="form-item">
              <label>{{ t('merchant.storeDesc') }}</label>
              <textarea
                v-if="isEditing"
                v-model="editForm.description"
                class="textarea"
                rows="3"
                :placeholder="t('merchant.storeDescPlaceholder')"
              ></textarea>
              <span v-else class="value">{{ selectedStore.description || '-' }}</span>
            </div>

            <div class="form-row">
              <div class="form-item">
                <label>{{ t('merchant.storeCategory') }}</label>
                <ElSelect
                  v-if="isEditing"
                  v-model="editForm.category"
                  class="store-themed-select"
                  popper-class="store-themed-select-dropdown"
                >
                  <ElOption
                    v-for="cat in categories"
                    :key="cat"
                    :value="cat"
                    :label="cat"
                  />
                </ElSelect>
                <span v-else class="value">{{ selectedStore.category }}</span>
              </div>

              <div class="form-item">
                <label>{{ t('merchant.businessHours') }}</label>
                <div
                  v-if="isEditing"
                  class="business-hours-editor"
                >
                  <ElTimePicker
                    v-model="businessHoursRange"
                    class="store-themed-time"
                    popper-class="store-themed-time-dropdown"
                    is-range
                    format="HH:mm"
                    value-format="HH:mm"
                    :disabled="allDayBusiness"
                    :clearable="!allDayBusiness"
                    :start-placeholder="t('store.businessHoursRangeStart')"
                    :end-placeholder="t('store.businessHoursRangeEnd')"
                    @change="handleBusinessHoursChange"
                  />
                  <div class="all-day-row">
                    <ElSwitch :model-value="allDayBusiness" @change="handleAllDayChange" />
                    <span class="all-day-label">{{ t('store.open24Hours') }}</span>
                  </div>
                  <p v-if="showLegacyHint" class="field-hint warning">{{ t('store.businessHoursInvalidHint') }}</p>
                  <p v-if="businessHoursError" class="field-hint error">{{ businessHoursError }}</p>
                </div>
                <span v-else class="value">{{ displayBusinessHours }}</span>
              </div>
            </div>

            <div class="form-actions">
              <template v-if="isEditing">
                <button class="btn btn-secondary" @click="cancelEdit">
                  {{ t('common.cancel') }}
                </button>
                <button
                  class="btn btn-primary"
                  :disabled="isProcessing"
                  @click="saveStore"
                >
                  {{ isProcessing ? t('merchant.saving') : t('common.save') }}
                </button>
              </template>
              <template v-else>
                <button
                  class="btn btn-secondary"
                  @click="goToProductManage"
                >
                  {{ t('ai.quick.productManage') }}
                </button>
                <button 
                  v-if="canToggleStoreStatus"
                  class="btn btn-secondary" 
                  :disabled="isProcessing"
                  @click="toggleStoreStatus"
                >
                  {{ selectedStore.status === 'ACTIVE' ? t('merchant.pauseBusiness') : t('merchant.resumeBusiness') }}
                </button>
                <button 
                  v-if="selectedStore.status !== 'CLOSED'"
                  class="btn btn-primary" 
                  @click="startEdit"
                >
                  {{ t('merchant.editInfo') }}
                </button>
              </template>
            </div>

          </div>
        </template>

        <div v-else class="empty-state">
          <p>{{ t('merchant.selectStoreHint') }}</p>
        </div>
      </div>
    </div>

    <!-- 创建店铺对话框 - 使用 StoreForm 子组件 -->
    <StoreForm
      :visible="showCreateDialog"
      :store="null"
      mode="create"
      :available-areas="availableAreasForCreate"
      :processing="isProcessing"
      @update:visible="handleCreateDialogClose"
      @submit="handleCreateSubmit"
      @cancel="handleCreateDialogClose"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.store-config-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  height: 100%;
}

// 内容网格
.content-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: $space-5;
  flex: 1;
  min-height: 0;
}

// 店铺列表面板
.store-list-panel {
  @include card-base;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  @include card-header;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.store-count {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.btn-add {
  width: 28px;
  height: 28px;
  border-radius: $radius-sm;
  background: var(--accent-primary);
  color: white;
  border: none;
  font-size: $font-size-xl;
  @include flex-center;
  @include clickable;

  &:hover {
    background: var(--accent-hover);
  }
}

// 店铺详情面板
.store-detail-panel {
  @include card-base;
  padding: $space-6;
  @include flex-column;
}

.empty-state {
  flex: 1;
  @include flex-center;
  color: var(--text-muted);
  font-size: $font-size-base;
}

.detail-header {
  @include flex-between;
  padding-bottom: $space-6;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: $space-6;
}

.header-left {
  @include flex-center-y;
  gap: $space-4;
}

.store-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: $radius-lg + 2;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
  @include flex-center;
  font-size: 26px;
  font-weight: $font-weight-semibold;
  color: white;
}

.header-info {
  h2 {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    margin: 0 0 $space-1 + 2 0;
  }

  .location {
    font-size: $font-size-base;
    color: var(--text-secondary);
  }
}

// 状态徽章
.status-badge {
  @include status-badge;
  padding: $space-1 + 2 $space-3 + 2;

  &.status-active {
    background: var(--success-muted);
    color: var(--success);
  }

  &.status-inactive {
    background: var(--warning-muted);
    color: var(--warning);
  }

  &.status-pending {
    background: rgba(var(--accent-primary-rgb), 0.15);
    color: var(--accent-primary);
  }

  &.status-closed {
    background: rgba(var(--text-muted-rgb), 0.15);
    color: var(--text-muted);
  }
}

// 详情表单
.detail-form {
  @include flex-column;
  gap: $space-5;
}

.form-item {
  @include form-item;

  .value {
    font-size: $font-size-lg;
    color: var(--text-primary);
  }
}

.form-row {
  @include form-row;
  gap: $space-5;
}

.input,
.textarea {
  @include form-control;
  background: var(--bg-elevated);
  border-color: rgba(var(--accent-primary-rgb), 0.24);
  transition:
    border-color $duration-normal $ease-default,
    box-shadow $duration-normal $ease-default,
    background-color $duration-normal $ease-default;

  &:hover {
    border-color: rgba(var(--accent-primary-rgb), 0.5);
  }

  &:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.18);
  }
}

.textarea {
  resize: vertical;
}

.business-hours-editor {
  @include flex-column;
  gap: $space-2;
}

.all-day-row {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.all-day-label {
  color: var(--text-secondary);
  font-size: $font-size-sm + 1;
}

.field-hint {
  margin: 0;
  font-size: $font-size-sm + 1;
  line-height: 1.4;

  &.warning {
    color: var(--warning);
  }

  &.error {
    color: var(--error);
  }
}

// 表单操作
.form-actions {
  display: flex;
  gap: $space-3;
  margin-top: $space-3;
}

// 按钮
.btn {
  @include btn-base;

  &-sm {
    @include btn-sm;
  }

  &-secondary {
    @include btn-secondary;
  }

  &-primary {
    @include btn-primary;
  }
}
</style>
