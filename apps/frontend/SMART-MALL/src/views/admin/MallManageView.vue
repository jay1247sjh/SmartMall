<script setup lang="ts">
/**
 * 商城管理页面
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref, onMounted } from 'vue'
import {
  ElRow,
  ElCol,
  ElCard,
  ElButton,
  ElIcon,
  ElTable,
  ElTableColumn,
  ElEmpty,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElMessage,
  ElMessageBox,
  ElSkeleton,
  ElSpace,
} from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { mallManageApi } from '@/api'
import type { Floor, Area, CreateFloorRequest, CreateAreaRequest } from '@/api/mall-manage.api'

const isLoading = ref(true)
const floors = ref<Floor[]>([])
const selectedFloor = ref<Floor | null>(null)

const showFloorModal = ref(false)
const floorForm = ref<CreateFloorRequest>({ name: '', level: 1, description: '' })
const editingFloorId = ref<number | null>(null)

const showAreaModal = ref(false)
const areaForm = ref<CreateAreaRequest>({ name: '', type: '餐饮', bounds: { x: 0, y: 0, width: 100, height: 80 } })
const editingAreaId = ref<number | null>(null)

const isProcessing = ref(false)

const areaTypes = ['餐饮', '零售', '服装', '娱乐', '服务', '其他']

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

function getStatusType(status: string) {
  const map: Record<string, 'info' | 'warning' | 'primary' | 'success'> = {
    LOCKED: 'info',
    PENDING: 'warning',
    AUTHORIZED: 'primary',
    OCCUPIED: 'success',
  }
  return map[status] || 'info'
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

  try {
    if (editingFloorId.value) {
      await mallManageApi.updateFloor(editingFloorId.value, floorForm.value)
      const index = floors.value.findIndex(f => f.id === editingFloorId.value)
      if (index !== -1) {
        floors.value[index] = { ...floors.value[index], ...floorForm.value }
      }
      ElMessage.success('楼层更新成功')
    } else {
      const newFloor = await mallManageApi.createFloor(floorForm.value)
      floors.value.push(newFloor)
      ElMessage.success('楼层创建成功')
    }
    showFloorModal.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    isProcessing.value = false
  }
}

async function deleteFloor(floor: Floor) {
  try {
    await ElMessageBox.confirm(`确定删除楼层 "${floor.name}" 吗？`, '确认删除', {
      type: 'warning',
    })
    isProcessing.value = true
    await mallManageApi.deleteFloor(floor.id)
    floors.value = floors.value.filter(f => f.id !== floor.id)
    if (selectedFloor.value?.id === floor.id) {
      selectedFloor.value = floors.value[0] || null
    }
    ElMessage.success('楼层删除成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  } finally {
    isProcessing.value = false
  }
}

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

  try {
    if (editingAreaId.value) {
      await mallManageApi.updateArea(editingAreaId.value, areaForm.value)
      const areaIndex = selectedFloor.value.areas.findIndex(a => a.id === editingAreaId.value)
      if (areaIndex !== -1) {
        selectedFloor.value.areas[areaIndex] = { ...selectedFloor.value.areas[areaIndex], ...areaForm.value }
      }
      ElMessage.success('区域更新成功')
    } else {
      const newArea = await mallManageApi.createArea(selectedFloor.value.id, areaForm.value)
      selectedFloor.value.areas.push(newArea)
      ElMessage.success('区域创建成功')
    }
    showAreaModal.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    isProcessing.value = false
  }
}

async function deleteArea(area: Area) {
  if (!selectedFloor.value) return
  try {
    await ElMessageBox.confirm(`确定删除区域 "${area.name}" 吗？`, '确认删除', {
      type: 'warning',
    })
    isProcessing.value = true
    await mallManageApi.deleteArea(area.id)
    selectedFloor.value.areas = selectedFloor.value.areas.filter(a => a.id !== area.id)
    ElMessage.success('区域删除成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <article class="mall-manage-page">
    <ElRow :gutter="20" class="content-grid">
      <!-- 左侧：楼层列表 -->
      <ElCol :span="6">
        <ElCard shadow="never" class="floor-panel">
          <template #header>
            <header class="panel-header">
              <h3>楼层结构</h3>
              <ElButton type="primary" circle size="small" @click="openAddFloorModal">
                <ElIcon><Plus /></ElIcon>
              </ElButton>
            </header>
          </template>

          <ElSkeleton v-if="isLoading" :rows="5" animated />

          <nav v-else class="floor-list">
            <article
              v-for="floor in floors"
              :key="floor.id"
              :class="['floor-item', { active: selectedFloor?.id === floor.id }]"
              @click="selectFloor(floor)"
            >
              <hgroup class="floor-info">
                <h4 class="floor-name">{{ floor.name }}</h4>
                <p class="floor-desc">{{ floor.description }}</p>
                <small class="floor-count">{{ floor.areas.length }} 个区域</small>
              </hgroup>
              <ElSpace class="floor-actions" @click.stop>
                <ElButton text size="small" type="primary" @click="openEditFloorModal(floor)">
                  <ElIcon><Edit /></ElIcon>
                </ElButton>
                <ElButton text size="small" type="danger" @click="deleteFloor(floor)">
                  <ElIcon><Delete /></ElIcon>
                </ElButton>
              </ElSpace>
            </article>
          </nav>
        </ElCard>
      </ElCol>

      <!-- 右侧：区域列表 -->
      <ElCol :span="18">
        <ElCard shadow="never" class="area-panel">
          <template #header>
            <header class="panel-header">
              <h3>{{ selectedFloor ? `${selectedFloor.name} - 区域列表` : '请选择楼层' }}</h3>
              <ElButton v-if="selectedFloor" type="primary" @click="openAddAreaModal">
                <ElIcon class="mr-1"><Plus /></ElIcon>
                添加区域
              </ElButton>
            </header>
          </template>

          <ElTable
            v-if="selectedFloor"
            :data="selectedFloor.areas"
            v-loading="isLoading"
            stripe
            class="area-table"
          >
            <ElTableColumn prop="name" label="区域编号" width="120" />
            <ElTableColumn prop="type" label="类型" width="100" />
            <ElTableColumn prop="status" label="状态" width="100">
              <template #default="{ row }">
                <ElTag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="merchantName" label="授权商家">
              <template #default="{ row }">
                <span v-if="row.merchantName">{{ row.merchantName }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="bounds" label="尺寸" width="100">
              <template #default="{ row }">
                {{ formatBounds(row.bounds) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <ElSpace>
                  <ElButton text size="small" type="primary" @click="openEditAreaModal(row)">
                    编辑
                  </ElButton>
                  <ElButton text size="small" type="danger" @click="deleteArea(row)">
                    删除
                  </ElButton>
                </ElSpace>
              </template>
            </ElTableColumn>

            <template #empty>
              <ElEmpty description="暂无区域" />
            </template>
          </ElTable>

          <ElEmpty v-else description="请从左侧选择一个楼层查看区域" />
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 楼层弹窗 -->
    <ElDialog
      v-model="showFloorModal"
      :title="editingFloorId ? '编辑楼层' : '添加楼层'"
      width="400px"
      destroy-on-close
    >
      <ElForm label-position="top">
        <ElFormItem label="楼层名称">
          <ElInput v-model="floorForm.name" placeholder="如：1F" />
        </ElFormItem>
        <ElFormItem label="楼层序号">
          <ElInputNumber v-model="floorForm.level" :min="1" style="width: 100%" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="floorForm.description" placeholder="如：一楼 - 餐饮美食" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElSpace>
          <ElButton @click="showFloorModal = false">取消</ElButton>
          <ElButton
            type="primary"
            :disabled="!floorForm.name.trim()"
            :loading="isProcessing"
            @click="saveFloor"
          >
            保存
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>

    <!-- 区域弹窗 -->
    <ElDialog
      v-model="showAreaModal"
      :title="editingAreaId ? '编辑区域' : '添加区域'"
      width="450px"
      destroy-on-close
    >
      <ElForm label-position="top">
        <ElFormItem label="区域编号">
          <ElInput v-model="areaForm.name" placeholder="如：A-101" />
        </ElFormItem>
        <ElFormItem label="区域类型">
          <ElSelect v-model="areaForm.type" style="width: 100%">
            <ElOption v-for="t in areaTypes" :key="t" :label="t" :value="t" />
          </ElSelect>
        </ElFormItem>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="宽度">
              <ElInputNumber v-model="areaForm.bounds.width" :min="1" style="width: 100%" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="高度">
              <ElInputNumber v-model="areaForm.bounds.height" :min="1" style="width: 100%" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>

      <template #footer>
        <ElSpace>
          <ElButton @click="showAreaModal = false">取消</ElButton>
          <ElButton
            type="primary"
            :disabled="!areaForm.name.trim()"
            :loading="isProcessing"
            @click="saveArea"
          >
            保存
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </article>
</template>

<style scoped lang="scss">
.mall-manage-page {
  height: 100%;

  .content-grid {
    height: 100%;
  }

  .floor-panel {
    height: 100%;

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        font-size: 15px;
        font-weight: 600;
        margin: 0;
      }
    }

    .floor-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .floor-item {
        padding: 14px 16px;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.15s;

        &:hover {
          background: var(--el-fill-color-light);
        }

        &.active {
          background: var(--el-color-primary-light-9);
          border-color: var(--el-color-primary-light-5);
        }

        .floor-info {
          .floor-name {
            font-size: 15px;
            font-weight: 600;
            margin: 0 0 4px 0;
          }

          .floor-desc {
            font-size: 13px;
            color: var(--el-text-color-secondary);
            margin: 0 0 4px 0;
          }

          .floor-count {
            font-size: 12px;
            color: var(--el-text-color-placeholder);
          }
        }

        .floor-actions {
          margin-top: 10px;
        }
      }
    }
  }

  .area-panel {
    height: 100%;

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        font-size: 15px;
        font-weight: 600;
        margin: 0;
      }

      .mr-1 {
        margin-right: 4px;
      }
    }

    .area-table {
      border-radius: 8px;

      .text-muted {
        color: var(--el-text-color-placeholder);
      }
    }
  }
}
</style>
