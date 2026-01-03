<script setup lang="ts">
/**
 * 商城管理页面
 * 管理楼层和区域结构
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable, Modal } from '@/components'
import { mallManageApi } from '@/api'
import type { Floor, Area, CreateFloorRequest, CreateAreaRequest } from '@/api/mall-manage.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const floors = ref<Floor[]>([])
const selectedFloor = ref<Floor | null>(null)

// 楼层弹窗
const showFloorModal = ref(false)
const floorForm = ref<CreateFloorRequest>({ name: '', level: 1, description: '' })
const editingFloorId = ref<number | null>(null)

// 区域弹窗
const showAreaModal = ref(false)
const areaForm = ref<CreateAreaRequest>({ name: '', type: '餐饮', bounds: { x: 0, y: 0, width: 100, height: 80 } })
const editingAreaId = ref<number | null>(null)

// 操作状态
const isProcessing = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const areaColumns = [
  { key: 'name', title: '区域编号', width: '15%' },
  { key: 'type', title: '类型', width: '12%' },
  { key: 'status', title: '状态', width: '15%' },
  { key: 'merchantName', title: '授权商家', width: '20%' },
  { key: 'bounds', title: '尺寸', width: '18%' },
  { key: 'actions', title: '操作', width: '20%' },
]

const areaTypes = ['餐饮', '零售', '服装', '娱乐', '服务', '其他']

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    floors.value = await mallManageApi.getFloors()
    if (floors.value.length > 0 && !selectedFloor.value) {
      selectedFloor.value = floors.value[0]
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    isLoading.value = false
  }
}

function selectFloor(floor: Floor) {
  selectedFloor.value = floor
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    LOCKED: 'status-locked',
    PENDING: 'status-pending',
    AUTHORIZED: 'status-authorized',
    OCCUPIED: 'status-occupied',
  }
  return map[status] || ''
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    LOCKED: '锁定',
    PENDING: '待审批',
    AUTHORIZED: '已授权',
    OCCUPIED: '已入驻',
  }
  return map[status] || status
}

function formatBounds(bounds: Area['bounds']): string {
  return `${bounds.width} × ${bounds.height}`
}

// 楼层操作
function openAddFloorModal() {
  editingFloorId.value = null
  floorForm.value = { name: '', level: floors.value.length + 1, description: '' }
  showFloorModal.value = true
}

function openEditFloorModal(floor: Floor) {
  editingFloorId.value = floor.id
  floorForm.value = { name: floor.name, level: floor.level, description: floor.description || '' }
  showFloorModal.value = true
}

async function saveFloor() {
  if (!floorForm.value.name.trim()) return
  isProcessing.value = true
  message.value = null

  try {
    if (editingFloorId.value) {
      await mallManageApi.updateFloor(editingFloorId.value, floorForm.value)
      const index = floors.value.findIndex(f => f.id === editingFloorId.value)
      if (index !== -1) {
        floors.value[index] = { ...floors.value[index], ...floorForm.value }
      }
      message.value = { type: 'success', text: '楼层更新成功' }
    } else {
      const newFloor = await mallManageApi.createFloor(floorForm.value)
      floors.value.push(newFloor)
      message.value = { type: 'success', text: '楼层创建成功' }
    }
    showFloorModal.value = false
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '操作失败' }
  } finally {
    isProcessing.value = false
  }
}

async function deleteFloor(floor: Floor) {
  if (!confirm(`确定删除楼层 "${floor.name}" 吗？`)) return
  isProcessing.value = true

  try {
    await mallManageApi.deleteFloor(floor.id)
    floors.value = floors.value.filter(f => f.id !== floor.id)
    if (selectedFloor.value?.id === floor.id) {
      selectedFloor.value = floors.value[0] || null
    }
    message.value = { type: 'success', text: '楼层删除成功' }
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '删除失败' }
  } finally {
    isProcessing.value = false
  }
}

// 区域操作
function openAddAreaModal() {
  if (!selectedFloor.value) return
  editingAreaId.value = null
  areaForm.value = { name: '', type: '餐饮', bounds: { x: 0, y: 0, width: 100, height: 80 } }
  showAreaModal.value = true
}

function openEditAreaModal(area: Area) {
  editingAreaId.value = area.id
  areaForm.value = { name: area.name, type: area.type, bounds: { ...area.bounds } }
  showAreaModal.value = true
}

async function saveArea() {
  if (!areaForm.value.name.trim() || !selectedFloor.value) return
  isProcessing.value = true
  message.value = null

  try {
    if (editingAreaId.value) {
      await mallManageApi.updateArea(editingAreaId.value, areaForm.value)
      const areaIndex = selectedFloor.value.areas.findIndex(a => a.id === editingAreaId.value)
      if (areaIndex !== -1) {
        selectedFloor.value.areas[areaIndex] = { ...selectedFloor.value.areas[areaIndex], ...areaForm.value }
      }
      message.value = { type: 'success', text: '区域更新成功' }
    } else {
      const newArea = await mallManageApi.createArea(selectedFloor.value.id, areaForm.value)
      selectedFloor.value.areas.push(newArea)
      message.value = { type: 'success', text: '区域创建成功' }
    }
    showAreaModal.value = false
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '操作失败' }
  } finally {
    isProcessing.value = false
  }
}

async function deleteArea(area: Area) {
  if (!confirm(`确定删除区域 "${area.name}" 吗？`) || !selectedFloor.value) return
  isProcessing.value = true

  try {
    await mallManageApi.deleteArea(area.id)
    selectedFloor.value.areas = selectedFloor.value.areas.filter(a => a.id !== area.id)
    message.value = { type: 'success', text: '区域删除成功' }
    setTimeout(() => { message.value = null }, 3000)
  } catch (e: any) {
    message.value = { type: 'error', text: e.message || '删除失败' }
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
  <div class="mall-manage-page">
      <!-- 消息提示 -->
      <div v-if="message" :class="['message', message.type]">
        <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
        {{ message.text }}
      </div>

      <div class="content-grid">
        <!-- 左侧：楼层列表 -->
        <div class="floor-panel">
          <div class="panel-header">
            <h3>楼层结构</h3>
            <button class="btn-icon" @click="openAddFloorModal" title="添加楼层">
              <span>+</span>
            </button>
          </div>

          <div v-if="isLoading" class="loading">加载中...</div>

          <div v-else class="floor-list">
            <div
              v-for="floor in floors"
              :key="floor.id"
              :class="['floor-item', { active: selectedFloor?.id === floor.id }]"
              @click="selectFloor(floor)"
            >
              <div class="floor-info">
                <span class="floor-name">{{ floor.name }}</span>
                <span class="floor-desc">{{ floor.description }}</span>
                <span class="floor-count">{{ floor.areas.length }} 个区域</span>
              </div>
              <div class="floor-actions" @click.stop>
                <button class="action-btn edit" @click="openEditFloorModal(floor)">编辑</button>
                <button class="action-btn delete" @click="deleteFloor(floor)">删除</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：区域列表 -->
        <div class="area-panel">
          <div class="panel-header">
            <h3>{{ selectedFloor ? `${selectedFloor.name} - 区域列表` : '请选择楼层' }}</h3>
            <button
              v-if="selectedFloor"
              class="btn-add"
              @click="openAddAreaModal"
            >
              + 添加区域
            </button>
          </div>

          <DataTable
            v-if="selectedFloor"
            :columns="areaColumns"
            :data="selectedFloor.areas"
            :loading="isLoading"
            empty-text="暂无区域"
          >
            <template #status="{ value }">
              <span :class="['status-badge', getStatusClass(value)]">
                {{ getStatusText(value) }}
              </span>
            </template>
            <template #merchantName="{ value }">
              <span v-if="value">{{ value }}</span>
              <span v-else class="text-muted">-</span>
            </template>
            <template #bounds="{ value }">
              {{ formatBounds(value) }}
            </template>
            <template #actions="{ row }">
              <div class="action-btns">
                <button class="action-btn edit" @click="openEditAreaModal(row)">编辑</button>
                <button class="action-btn delete" @click="deleteArea(row)">删除</button>
              </div>
            </template>
          </DataTable>

          <div v-else class="empty-state">
            <p>请从左侧选择一个楼层查看区域</p>
          </div>
        </div>
      </div>

      <!-- 楼层弹窗 -->
      <Modal
        v-model:visible="showFloorModal"
        :title="editingFloorId ? '编辑楼层' : '添加楼层'"
        width="400px"
      >
        <div class="form">
          <div class="form-item">
            <label>楼层名称</label>
            <input v-model="floorForm.name" type="text" class="input" placeholder="如：1F" />
          </div>
          <div class="form-item">
            <label>楼层序号</label>
            <input v-model.number="floorForm.level" type="number" class="input" min="1" />
          </div>
          <div class="form-item">
            <label>描述</label>
            <input v-model="floorForm.description" type="text" class="input" placeholder="如：一楼 - 餐饮美食" />
          </div>
        </div>

        <template #footer>
          <button class="btn btn-secondary" @click="showFloorModal = false">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!floorForm.name.trim() || isProcessing"
            @click="saveFloor"
          >
            {{ isProcessing ? '保存中...' : '保存' }}
          </button>
        </template>
      </Modal>

      <!-- 区域弹窗 -->
      <Modal
        v-model:visible="showAreaModal"
        :title="editingAreaId ? '编辑区域' : '添加区域'"
        width="450px"
      >
        <div class="form">
          <div class="form-item">
            <label>区域编号</label>
            <input v-model="areaForm.name" type="text" class="input" placeholder="如：A-101" />
          </div>
          <div class="form-item">
            <label>区域类型</label>
            <select v-model="areaForm.type" class="select">
              <option v-for="t in areaTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>宽度</label>
              <input v-model.number="areaForm.bounds.width" type="number" class="input" min="1" />
            </div>
            <div class="form-item">
              <label>高度</label>
              <input v-model.number="areaForm.bounds.height" type="number" class="input" min="1" />
            </div>
          </div>
        </div>

        <template #footer>
          <button class="btn btn-secondary" @click="showAreaModal = false">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!areaForm.name.trim() || isProcessing"
            @click="saveArea"
          >
            {{ isProcessing ? '保存中...' : '保存' }}
          </button>
        </template>
      </Modal>
  </div>
</template>


<style scoped>
.mall-manage-page {
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
  grid-template-columns: 280px 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;
}

/* Floor Panel */
.floor-panel {
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

.btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border: none;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.btn-icon:hover {
  background: rgba(96, 165, 250, 0.25);
}

.loading {
  padding: 40px 20px;
  text-align: center;
  color: #9aa0a6;
  font-size: 14px;
}

.floor-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.floor-item {
  padding: 14px 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.floor-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.floor-item.active {
  background: rgba(96, 165, 250, 0.1);
  border-color: rgba(96, 165, 250, 0.3);
}

.floor-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.floor-name {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaed;
}

.floor-desc {
  font-size: 13px;
  color: #9aa0a6;
}

.floor-count {
  font-size: 12px;
  color: #5f6368;
  margin-top: 4px;
}

.floor-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

/* Area Panel */
.area-panel {
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.btn-add {
  padding: 8px 14px;
  border-radius: 6px;
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border: none;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.btn-add:hover {
  background: rgba(96, 165, 250, 0.25);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f6368;
  font-size: 14px;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-locked {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.status-pending {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.status-authorized {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.status-occupied {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.text-muted {
  color: #5f6368;
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

.action-btn.edit {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.action-btn.delete {
  background: rgba(242, 139, 130, 0.2);
  color: #f28b82;
}

/* Form */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.input,
.select {
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: #e8eaed;
}

.input:focus,
.select:focus {
  outline: none;
  border-color: #60a5fa;
}

.input::placeholder {
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

.btn-primary {
  background: #60a5fa;
  color: #0a0a0a;
}

.btn-primary:hover:not(:disabled) {
  background: #93c5fd;
}
</style>
