<script setup lang="ts">
/**
 * 店铺配置页面
 * 商家管理店铺信息
 */
import { ref, computed, onMounted } from 'vue'
import { Modal } from '@/components'
import { merchantApi } from '@/api'
import type { Store, UpdateStoreRequest } from '@/api/merchant.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stores = ref<Store[]>([])
const selectedStore = ref<Store | null>(null)

// 编辑状态
const isEditing = ref(false)
const editForm = ref<UpdateStoreRequest>({
  name: '',
  description: '',
  category: '',
  businessHours: '',
})

// 操作状态
const isProcessing = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const categories = ['餐饮', '零售', '服装', '娱乐', '服务', '其他']

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    stores.value = await merchantApi.getMyStores()
    if (stores.value.length > 0 && !selectedStore.value) {
      selectStore(stores.value[0])
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    isLoading.value = false
  }
}

function selectStore(store: Store) {
  selectedStore.value = store
  isEditing.value = false
  editForm.value = {
    name: store.name,
    description: store.description,
    category: store.category,
    businessHours: store.businessHours,
  }
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
    description: selectedStore.value.description,
    category: selectedStore.value.category,
    businessHours: selectedStore.value.businessHours,
  }
}

async function saveStore() {
  if (!selectedStore.value) return
  
  isProcessing.value = true
  message.value = null

  try {
    const updated = await merchantApi.updateStore(selectedStore.value.id, editForm.value)
    
    // 更新本地状态
    const index = stores.value.findIndex(s => s.id === selectedStore.value!.id)
    if (index !== -1) {
      stores.value[index] = { ...stores.value[index], ...editForm.value }
      selectedStore.value = stores.value[index]
    }
    
    isEditing.value = false
    message.value = { type: 'success', text: '店铺信息保存成功' }
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '保存失败' }
  } finally {
    isProcessing.value = false
  }
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'status-active',
    INACTIVE: 'status-inactive',
    PENDING: 'status-pending',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: '营业中',
    INACTIVE: '已关闭',
    PENDING: '待审核',
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
            <span class="store-count">{{ stores.length }} 家</span>
          </div>

          <div v-if="isLoading" class="loading">加载中...</div>

          <div v-else-if="stores.length === 0" class="empty">
            暂无店铺
          </div>

          <div v-else class="store-list">
            <div
              v-for="store in stores"
              :key="store.id"
              :class="['store-item', { active: selectedStore?.id === store.id }]"
              @click="selectStore(store)"
            >
              <div class="store-avatar">
                {{ store.name.charAt(0) }}
              </div>
              <div class="store-info">
                <span class="store-name">{{ store.name }}</span>
                <span class="store-location">{{ store.floorName }} · {{ store.areaName }}</span>
              </div>
              <span :class="['status-dot', getStatusClass(store.status)]"></span>
            </div>
          </div>
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
                  <span v-else class="value">{{ selectedStore.businessHours }}</span>
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
                  <button class="btn btn-primary" @click="startEdit">
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
  </div>
</template>


<style scoped>
.store-config-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
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

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

/* Store List Panel */
.store-list-panel {
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0;
}

.store-count {
  font-size: 13px;
  color: #9aa0a6;
}

.loading,
.empty {
  padding: 40px 20px;
  text-align: center;
  color: #5f6368;
  font-size: 14px;
}

.store-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.store-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.store-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.store-item.active {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.3);
}

.store-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.store-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.store-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-location {
  font-size: 12px;
  color: #9aa0a6;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.status-active {
  background: #34d399;
}

.status-dot.status-inactive {
  background: #9ca3af;
}

.status-dot.status-pending {
  background: #fbbf24;
}

/* Store Detail Panel */
.store-detail-panel {
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
  font-size: 14px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.store-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  color: white;
}

.header-info h2 {
  font-size: 20px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0 0 6px 0;
}

.header-info .location {
  font-size: 14px;
  color: #9aa0a6;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.status-active {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-badge.status-inactive {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.status-badge.status-pending {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

/* Detail Form */
.detail-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: #9aa0a6;
}

.form-item .value {
  font-size: 15px;
  color: #e8eaed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.input,
.select,
.textarea {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e8eaed;
  font-family: inherit;
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: #60a5fa;
}

.input::placeholder,
.textarea::placeholder {
  color: #5f6368;
}

.textarea {
  resize: vertical;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
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
