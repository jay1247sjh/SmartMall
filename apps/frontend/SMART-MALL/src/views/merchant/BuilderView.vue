<script setup lang="ts">
/**
 * 商家建模工具页（提案版）
 *
 * 目标：商家在已授权区域内维护对象布局草稿，并提交管理员审核。
 */
import { computed, onMounted, ref } from 'vue'
import { MessageAlert } from '@/components'
import { areaPermissionApi, merchantApi } from '@/api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'
import type { StoreLayoutData, StoreObject } from '@/api/merchant.api'
import AILayoutDialog from './AILayoutDialog.vue'

const isLoadingAreas = ref(true)
const isLoadingLayout = ref(false)
const isSavingDraft = ref(false)
const isSubmitting = ref(false)
const showAIDialog = ref(false)

const permissions = ref<AreaPermissionDTO[]>([])
const selectedAreaId = ref('')
const submitNote = ref('')

const layout = ref<StoreLayoutData>({
  theme: '',
  areaId: '',
  objects: [],
})

const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const editablePermissions = computed(() =>
  permissions.value.filter(
    item => item.status === 'ACTIVE' && (item.areaStatus === 'AUTHORIZED' || item.areaStatus === 'OCCUPIED'),
  ),
)

const selectedPermission = computed(
  () => editablePermissions.value.find(item => item.areaId === selectedAreaId.value) ?? null,
)

const objectCountText = computed(() => `对象数量：${layout.value.objects.length}`)

function setMessage(type: 'success' | 'error', text: string) {
  message.value = { type, text }
}

function clearMessage() {
  message.value = null
}

function createDefaultObject(): StoreObject {
  return {
    name: '新对象',
    materialId: 'common',
    position: { x: 0, y: 0, z: 0 },
    rotation: { y: 0 },
    scale: { x: 1, y: 1, z: 1 },
  }
}

function resetLayout(areaId: string) {
  layout.value = {
    theme: '',
    areaId,
    objects: [],
  }
}

async function loadPermissions() {
  isLoadingAreas.value = true
  try {
    permissions.value = await areaPermissionApi.getMyPermissions()
    const first = editablePermissions.value[0]
    if (first) {
      selectedAreaId.value = first.areaId
      await loadAreaLayout(first.areaId)
    }
  } catch (error: any) {
    setMessage('error', error.message || '加载可编辑区域失败')
  } finally {
    isLoadingAreas.value = false
  }
}

async function loadAreaLayout(areaId: string) {
  isLoadingLayout.value = true
  clearMessage()
  try {
    const response = await merchantApi.getAreaLayout(areaId)
    if (response.layoutData) {
      layout.value = {
        theme: response.layoutData.theme || '',
        areaId: response.layoutData.areaId || areaId,
        objects: response.layoutData.objects ? structuredClone(response.layoutData.objects) : [],
      }
    } else {
      resetLayout(areaId)
    }
  } catch (error: any) {
    resetLayout(areaId)
    setMessage('error', error.message || '加载区域布局失败')
  } finally {
    isLoadingLayout.value = false
  }
}

async function handleAreaSwitch(areaId: string) {
  selectedAreaId.value = areaId
  await loadAreaLayout(areaId)
}

function addObject() {
  layout.value.objects.push(createDefaultObject())
}

function removeObject(index: number) {
  layout.value.objects.splice(index, 1)
}

function applyGeneratedLayout(generated: StoreLayoutData) {
  layout.value = {
    theme: generated.theme,
    areaId: selectedAreaId.value,
    objects: generated.objects ? structuredClone(generated.objects) : [],
  }
  setMessage('success', 'AI 草稿已加载，可继续手动编辑')
}

function buildPayload(): StoreLayoutData {
  return {
    theme: layout.value.theme || '自定义方案',
    areaId: selectedAreaId.value,
    objects: layout.value.objects.map(item => ({
      name: item.name?.trim() || '未命名对象',
      materialId: item.materialId?.trim() || 'common',
      position: {
        x: Number(item.position.x) || 0,
        y: Number(item.position.y) || 0,
        z: Number(item.position.z) || 0,
      },
      rotation: {
        y: Number(item.rotation.y) || 0,
      },
      scale: {
        x: Math.max(Number(item.scale.x) || 1, 0.01),
        y: Math.max(Number(item.scale.y) || 1, 0.01),
        z: Math.max(Number(item.scale.z) || 1, 0.01),
      },
    })),
  }
}

async function saveDraft() {
  if (!selectedAreaId.value) return
  isSavingDraft.value = true
  clearMessage()
  try {
    await merchantApi.saveLayoutDraft(selectedAreaId.value, buildPayload())
    setMessage('success', '草稿已保存')
  } catch (error: any) {
    setMessage('error', error.message || '保存草稿失败')
  } finally {
    isSavingDraft.value = false
  }
}

async function submitProposal() {
  if (!selectedAreaId.value) return
  isSubmitting.value = true
  clearMessage()
  try {
    await merchantApi.submitLayoutProposal(selectedAreaId.value, buildPayload(), submitNote.value.trim())
    setMessage('success', '提案已提交，等待管理员审核')
  } catch (error: any) {
    setMessage('error', error.message || '提交提案失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadPermissions()
})
</script>

<template>
  <article class="builder-view">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" @close="clearMessage" />

    <header class="builder-header">
      <h2>建模工具</h2>
      <p>仅可编辑已授权区域，提交后由管理员审核生效。</p>
    </header>

    <div class="builder-grid">
      <section class="area-card">
        <h3>可编辑区域</h3>
        <div v-if="isLoadingAreas" class="empty-text">加载中...</div>
        <div v-else-if="editablePermissions.length === 0" class="empty-text">暂无可编辑区域，请先申请并通过授权。</div>
        <ul v-else class="area-list">
          <li
            v-for="item in editablePermissions"
            :key="item.areaId"
            :class="['area-item', { active: selectedAreaId === item.areaId }]"
            @click="handleAreaSwitch(item.areaId)"
          >
            <div class="area-name">{{ item.areaName }}</div>
            <div class="area-meta">{{ item.floorName }} · {{ item.areaStatus }}</div>
          </li>
        </ul>
      </section>

      <section class="editor-card">
        <div v-if="!selectedPermission" class="empty-text">请选择左侧区域开始建模。</div>

        <template v-else>
          <div class="editor-head">
            <div>
              <h3>{{ selectedPermission.areaName }}（{{ selectedPermission.floorName }}）</h3>
              <p>{{ objectCountText }}</p>
            </div>
            <div class="head-actions">
              <button class="btn btn-secondary" :disabled="isLoadingLayout" @click="showAIDialog = true">AI 生成草稿</button>
              <button class="btn btn-secondary" :disabled="isSavingDraft || isLoadingLayout" @click="saveDraft">
                {{ isSavingDraft ? '保存中...' : '保存草稿' }}
              </button>
              <button class="btn btn-primary" :disabled="isSubmitting || isLoadingLayout" @click="submitProposal">
                {{ isSubmitting ? '提交中...' : '提交审核' }}
              </button>
            </div>
          </div>

          <div class="theme-row">
            <label>主题</label>
            <input v-model="layout.theme" type="text" placeholder="例如：轻奢咖啡店" />
          </div>

          <div class="objects-section">
            <div class="objects-head">
              <h4>对象列表</h4>
              <button class="btn btn-secondary btn-sm" @click="addObject">新增对象</button>
            </div>

            <div v-if="isLoadingLayout" class="empty-text">加载布局中...</div>
            <div v-else-if="layout.objects.length === 0" class="empty-text">暂无对象，点击“新增对象”或使用 AI 草稿。</div>
            <div v-else class="objects-table-wrap">
              <table class="objects-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>材质ID</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Z</th>
                    <th>旋转Y</th>
                    <th>缩放X</th>
                    <th>缩放Y</th>
                    <th>缩放Z</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in layout.objects" :key="`${index}-${item.name}`">
                    <td><input v-model="item.name" type="text" /></td>
                    <td><input v-model="item.materialId" type="text" /></td>
                    <td><input v-model.number="item.position.x" type="number" step="0.1" /></td>
                    <td><input v-model.number="item.position.y" type="number" step="0.1" /></td>
                    <td><input v-model.number="item.position.z" type="number" step="0.1" /></td>
                    <td><input v-model.number="item.rotation.y" type="number" step="0.1" /></td>
                    <td><input v-model.number="item.scale.x" type="number" step="0.1" min="0.01" /></td>
                    <td><input v-model.number="item.scale.y" type="number" step="0.1" min="0.01" /></td>
                    <td><input v-model.number="item.scale.z" type="number" step="0.1" min="0.01" /></td>
                    <td>
                      <button class="btn btn-danger btn-xs" @click="removeObject(index)">删除</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="submit-row">
            <label>提交说明（可选）</label>
            <textarea v-model="submitNote" rows="3" placeholder="本次改动重点，例如：新增收银区与等候区"></textarea>
          </div>
        </template>
      </section>
    </div>

    <AILayoutDialog
      v-model:visible="showAIDialog"
      :area-id="selectedAreaId"
      :has-existing-content="layout.objects.length > 0"
      @layout-generated="applyGeneratedLayout"
      @close="showAIDialog = false"
    />
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.builder-view {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-5;
}

.builder-header {
  h2 {
    margin: 0;
    font-size: $font-size-2xl;
    color: var(--text-primary);
  }

  p {
    margin: $space-2 0 0 0;
    color: var(--text-muted);
    font-size: $font-size-sm;
  }
}

.builder-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: $space-4;
  min-height: 560px;
}

.area-card,
.editor-card {
  @include card-base;
  padding: $space-4;
}

.area-card h3,
.editor-card h3 {
  margin: 0 0 $space-3 0;
  font-size: $font-size-lg;
}

.area-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.area-item {
  padding: $space-3;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  transition: border-color $duration-fast $ease-default, background $duration-fast $ease-default;

  &:hover {
    border-color: var(--border-muted);
    background: rgba(var(--accent-primary-rgb), 0.04);
  }

  &.active {
    border-color: var(--accent-primary);
    background: var(--accent-muted);
  }
}

.area-name {
  font-weight: $font-weight-medium;
  color: var(--text-primary);
}

.area-meta,
.empty-text {
  font-size: $font-size-sm;
  color: var(--text-muted);
}

.editor-card {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.editor-head {
  display: flex;
  justify-content: space-between;
  gap: $space-3;
  align-items: flex-start;

  p {
    margin: $space-1 0 0 0;
    color: var(--text-muted);
    font-size: $font-size-sm;
  }
}

.head-actions {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.theme-row,
.submit-row {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  label {
    font-size: $font-size-sm;
    color: var(--text-secondary);
  }

  input,
  textarea {
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: $space-2;
  }
}

.objects-section {
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.objects-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h4 {
    margin: 0;
    font-size: $font-size-base;
  }
}

.objects-table-wrap {
  overflow: auto;
}

.objects-table {
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;

  th,
  td {
    border-bottom: 1px solid var(--border-subtle);
    padding: $space-2;
    text-align: left;
  }

  th {
    font-size: $font-size-xs;
    color: var(--text-muted);
    font-weight: $font-weight-medium;
    white-space: nowrap;
  }

  input {
    width: 100%;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-sm;
    background: var(--bg-secondary);
    color: var(--text-primary);
    padding: 6px 8px;
  }
}

@media (max-width: 1200px) {
  .builder-grid {
    grid-template-columns: 1fr;
  }
}
</style>

