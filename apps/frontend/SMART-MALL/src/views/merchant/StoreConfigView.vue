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
import { ref, computed, onMounted } from 'vue'
import { storeApi, areaPermissionApi } from '@/api'
import type { StoreDTO, UpdateStoreRequest } from '@/api/store.api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'
import { StoreList, StoreForm } from '@/components/store'
import type { StoreFormData } from '@/components/store/StoreForm.vue'

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
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const categories = ['餐饮', '零售', '服装', '娱乐', '服务', '其他']

// 可用于创建店铺的区域（有权限但还没有店铺的区域）
const availableAreasForCreate = computed(() => {
  const storeAreaIds = stores.value.map(s => s.areaId)
  return permissions.value.filter(p => 
    p.status === 'ACTIVE' && !storeAreaIds.includes(p.areaId)
  )
})

// 当前选中店铺的ID
const selectedStoreId = computed(() => selectedStore.value?.storeId ?? null)

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
    
    if (stores.value.length > 0 && !selectedStore.value) {
      selectStore(stores.value[0])
    }
  } catch (e) {
    console.error('加载数据失败:', e)
    showMessage('error', '加载数据失败')
  } finally {
    isLoading.value = false
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

function startEdit() {
  if (!selectedStore.value) return
  isEditing.value = true
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
}

async function saveStore() {
  if (!selectedStore.value) return
  
  isProcessing.value = true
  message.value = null

  try {
    const updated = await storeApi.updateStore(selectedStore.value.storeId, editForm.value)
    
    // 更新本地状态
    const index = stores.value.findIndex(s => s.storeId === selectedStore.value!.storeId)
    if (index !== -1) {
      stores.value[index] = updated
      selectedStore.value = updated
    }
    
    isEditing.value = false
    showMessage('success', '店铺信息保存成功')
  } catch (e: any) {
    showMessage('error', e.message || '保存失败')
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
    showMessage('error', '请填写必填项')
    return
  }
  
  isProcessing.value = true
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
    showMessage('success', '店铺创建成功，等待管理员审批')
  } catch (e: any) {
    showMessage('error', e.message || '创建失败')
  } finally {
    isProcessing.value = false
  }
}

async function toggleStoreStatus() {
  if (!selectedStore.value) return
  
  const store = selectedStore.value
  if (store.status !== 'ACTIVE' && store.status !== 'INACTIVE') {
    showMessage('error', '当前状态不支持此操作')
    return
  }
  
  isProcessing.value = true
  try {
    if (store.status === 'ACTIVE') {
      await storeApi.deactivateStore(store.storeId)
      store.status = 'INACTIVE'
      showMessage('success', '店铺已暂停营业')
    } else {
      await storeApi.activateStore(store.storeId)
      store.status = 'ACTIVE'
      showMessage('success', '店铺已恢复营业')
    }
  } catch (e: any) {
    showMessage('error', e.message || '操作失败')
  } finally {
    isProcessing.value = false
  }
}

function showMessage(type: 'success' | 'error', text: string) {
  message.value = { type, text }
  setTimeout(() => { message.value = null }, 3000)
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
    ACTIVE: '营业中',
    INACTIVE: '暂停营业',
    PENDING: '待审批',
    CLOSED: '已关闭',
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
    <div v-if="message" :class="['message', message.type]">
      <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
      {{ message.text }}
    </div>

    <div class="content-grid">
      <!-- 左侧：店铺列表 -->
      <div class="store-list-panel">
        <div class="panel-header">
          <h3>我的店铺</h3>
          <div class="header-actions">
            <span class="store-count">{{ stores.length }} 家</span>
            <button 
              v-if="availableAreasForCreate.length > 0"
              class="btn-add" 
              @click="openCreateDialog"
              title="创建新店铺"
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
            >创建店铺</button>
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
              <label>店铺名称</label>
              <input
                v-if="isEditing"
                v-model="editForm.name"
                type="text"
                class="input"
                placeholder="请输入店铺名称"
              />
              <span v-else class="value">{{ selectedStore.name }}</span>
            </div>

            <div class="form-item">
              <label>店铺描述</label>
              <textarea
                v-if="isEditing"
                v-model="editForm.description"
                class="textarea"
                rows="3"
                placeholder="请输入店铺描述"
              ></textarea>
              <span v-else class="value">{{ selectedStore.description || '-' }}</span>
            </div>

            <div class="form-row">
              <div class="form-item">
                <label>店铺分类</label>
                <select
                  v-if="isEditing"
                  v-model="editForm.category"
                  class="select"
                >
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
                <span v-else class="value">{{ selectedStore.category }}</span>
              </div>

              <div class="form-item">
                <label>营业时间</label>
                <input
                  v-if="isEditing"
                  v-model="editForm.businessHours"
                  type="text"
                  class="input"
                  placeholder="如：08:00-22:00"
                />
                <span v-else class="value">{{ selectedStore.businessHours || '-' }}</span>
              </div>
            </div>

            <div class="form-actions">
              <template v-if="isEditing">
                <button class="btn btn-secondary" @click="cancelEdit">
                  取消
                </button>
                <button
                  class="btn btn-primary"
                  :disabled="isProcessing"
                  @click="saveStore"
                >
                  {{ isProcessing ? '保存中...' : '保存' }}
                </button>
              </template>
              <template v-else>
                <button 
                  v-if="selectedStore.status === 'ACTIVE' || selectedStore.status === 'INACTIVE'"
                  class="btn btn-secondary" 
                  :disabled="isProcessing"
                  @click="toggleStoreStatus"
                >
                  {{ selectedStore.status === 'ACTIVE' ? '暂停营业' : '恢复营业' }}
                </button>
                <button 
                  v-if="selectedStore.status !== 'CLOSED'"
                  class="btn btn-primary" 
                  @click="startEdit"
                >
                  编辑信息
                </button>
              </template>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          <p>请从左侧选择一个店铺</p>
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

// 消息提示
.message {
  @include message-alert;
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
  color: $color-text-secondary;
}

.btn-add {
  width: 28px;
  height: 28px;
  border-radius: $radius-sm;
  background: $color-primary;
  color: white;
  border: none;
  font-size: $font-size-xl;
  @include flex-center;
  @include clickable;

  &:hover {
    background: $color-primary-hover;
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
  color: $color-text-muted;
  font-size: $font-size-base;
}

.detail-header {
  @include flex-between;
  padding-bottom: $space-6;
  border-bottom: 1px solid $color-border-subtle;
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
  background: $gradient-admin;
  @include flex-center;
  font-size: 26px;
  font-weight: $font-weight-semibold;
  color: white;
}

.header-info {
  h2 {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    margin: 0 0 $space-1 + 2 0;
  }

  .location {
    font-size: $font-size-base;
    color: $color-text-secondary;
  }
}

// 状态徽章
.status-badge {
  @include status-badge;
  padding: $space-1 + 2 $space-3 + 2;

  &.status-active {
    @include status-variant($color-success-muted, $color-success);
  }

  &.status-inactive {
    @include status-variant($color-warning-muted, $color-warning);
  }

  &.status-pending {
    @include status-variant($color-primary-muted, $color-primary);
  }

  &.status-closed {
    @include status-variant(rgba($color-text-muted, 0.15), $color-text-muted);
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
    color: $color-text-primary;
  }
}

.form-row {
  @include form-row;
  gap: $space-5;
}

.input,
.select,
.textarea {
  @include form-control;
}

.textarea {
  resize: vertical;
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
