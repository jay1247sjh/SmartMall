<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { layoutProposalApi } from '@/api'
import type { LayoutProposalListItem, LayoutProposalDetail } from '@/api/layout-proposal.api'
import { MessageAlert } from '@/components'
import { useFormatters } from '@/composables'

const isLoading = ref(true)
const isDetailLoading = ref(false)
const isProcessing = ref(false)
const proposals = ref<LayoutProposalListItem[]>([])
const selected = ref<LayoutProposalListItem | null>(null)
const detail = ref<LayoutProposalDetail | null>(null)
const rejectReason = ref('')

const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const { formatDateTime } = useFormatters()

function setMessage(type: 'success' | 'error', text: string) {
  message.value = { type, text }
}

function clearMessage() {
  message.value = null
}

async function loadPendingList() {
  isLoading.value = true
  try {
    proposals.value = await layoutProposalApi.getPendingLayoutProposals()
    if (proposals.value.length > 0 && !selected.value) {
      await selectProposal(proposals.value[0]!)
    }
  } catch (error: any) {
    setMessage('error', error.message || '加载审核列表失败')
  } finally {
    isLoading.value = false
  }
}

async function selectProposal(item: LayoutProposalListItem) {
  selected.value = item
  isDetailLoading.value = true
  clearMessage()
  try {
    detail.value = await layoutProposalApi.getLayoutProposalDetail(item.proposalId)
    rejectReason.value = ''
  } catch (error: any) {
    setMessage('error', error.message || '加载提案详情失败')
  } finally {
    isDetailLoading.value = false
  }
}

async function approveSelected() {
  if (!selected.value) return
  isProcessing.value = true
  clearMessage()
  try {
    await layoutProposalApi.approveLayoutProposal(selected.value.proposalId)
    setMessage('success', '审核通过成功，布局已生效')
    await refreshAfterProcess()
  } catch (error: any) {
    setMessage('error', error.message || '审核通过失败')
  } finally {
    isProcessing.value = false
  }
}

async function rejectSelected() {
  if (!selected.value) return
  if (!rejectReason.value.trim()) {
    setMessage('error', '请先填写驳回理由')
    return
  }
  isProcessing.value = true
  clearMessage()
  try {
    await layoutProposalApi.rejectLayoutProposal(selected.value.proposalId, rejectReason.value.trim())
    setMessage('success', '提案已驳回')
    await refreshAfterProcess()
  } catch (error: any) {
    setMessage('error', error.message || '驳回失败')
  } finally {
    isProcessing.value = false
  }
}

async function refreshAfterProcess() {
  const currentId = selected.value?.proposalId
  await loadPendingList()
  if (!currentId) {
    detail.value = null
    return
  }
  const next = proposals.value.find(item => item.proposalId !== currentId)
  if (next) {
    await selectProposal(next)
  } else {
    selected.value = null
    detail.value = null
  }
}

onMounted(() => {
  loadPendingList()
})
</script>

<template>
  <div class="layout-review-page">
    <MessageAlert v-if="message" :type="message.type" :text="message.text" @close="clearMessage" />

    <div class="header-row">
      <h2>建模提案审核</h2>
      <button class="btn btn-secondary" :disabled="isLoading" @click="loadPendingList">刷新</button>
    </div>

    <div class="content-grid">
      <section class="list-card">
        <div class="card-title">待审核提案（{{ proposals.length }}）</div>
        <div v-if="isLoading" class="empty-text">加载中...</div>
        <div v-else-if="proposals.length === 0" class="empty-text">暂无待审核提案</div>
        <ul v-else class="proposal-list">
          <li
            v-for="item in proposals"
            :key="item.proposalId"
            :class="['proposal-item', { active: selected?.proposalId === item.proposalId }]"
            @click="selectProposal(item)"
          >
            <div class="item-main">
              <div class="item-title">{{ item.areaName || item.areaId }}</div>
              <div class="item-meta">
                {{ item.merchantName || item.merchantId }} · 对象 {{ item.objectCount ?? 0 }} 个
              </div>
            </div>
            <div class="item-time">{{ formatDateTime(item.updatedAt) }}</div>
          </li>
        </ul>
      </section>

      <section class="detail-card">
        <div class="card-title">提案详情</div>
        <div v-if="isDetailLoading" class="empty-text">加载详情中...</div>
        <div v-else-if="!detail" class="empty-text">请选择左侧提案</div>
        <div v-else class="detail-body">
          <div class="detail-row">
            <span>区域：</span>
            <strong>{{ detail.areaName || detail.areaId }}</strong>
          </div>
          <div class="detail-row">
            <span>楼层：</span>
            <strong>{{ detail.floorName || '-' }}</strong>
          </div>
          <div class="detail-row">
            <span>商家：</span>
            <strong>{{ detail.merchantName || detail.merchantId }}</strong>
          </div>
          <div class="detail-row">
            <span>主题：</span>
            <strong>{{ detail.layoutData?.theme || '-' }}</strong>
          </div>
          <div class="detail-row">
            <span>对象数量：</span>
            <strong>{{ detail.layoutData?.objects?.length ?? 0 }}</strong>
          </div>
          <div class="detail-row">
            <span>提交说明：</span>
            <strong>{{ detail.submitNote || '-' }}</strong>
          </div>

          <div class="objects-card">
            <div class="sub-title">对象清单</div>
            <div v-if="!detail.layoutData?.objects?.length" class="empty-text">暂无对象</div>
            <table v-else class="objects-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>材质</th>
                  <th>X</th>
                  <th>Z</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(obj, idx) in detail.layoutData.objects" :key="`${obj.name}-${idx}`">
                  <td>{{ obj.name }}</td>
                  <td>{{ obj.materialId }}</td>
                  <td>{{ obj.position.x }}</td>
                  <td>{{ obj.position.z }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="review-actions">
            <textarea
              v-model="rejectReason"
              class="reject-input"
              rows="3"
              placeholder="驳回理由（驳回时必填）"
            />
            <div class="btn-row">
              <button class="btn btn-danger" :disabled="isProcessing" @click="rejectSelected">
                驳回
              </button>
              <button class="btn btn-primary" :disabled="isProcessing" @click="approveSelected">
                通过并生效
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.layout-review-page {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-5;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: $font-size-2xl;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: $space-4;
  min-height: 540px;
}

.list-card,
.detail-card {
  @include card-base;
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.card-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: var(--text-primary);
}

.proposal-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.proposal-item {
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: $space-3;
  display: flex;
  justify-content: space-between;
  gap: $space-2;
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

.item-title {
  font-weight: $font-weight-medium;
  color: var(--text-primary);
}

.item-meta,
.item-time,
.empty-text {
  color: var(--text-muted);
  font-size: $font-size-sm;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.detail-row {
  display: flex;
  gap: $space-2;
  font-size: $font-size-sm;

  span {
    color: var(--text-muted);
    width: 88px;
    flex-shrink: 0;
  }

  strong {
    color: var(--text-primary);
  }
}

.objects-card {
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.sub-title {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--text-secondary);
}

.objects-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;

  th,
  td {
    text-align: left;
    border-bottom: 1px solid var(--border-subtle);
    padding: $space-2;
  }

  th {
    color: var(--text-muted);
    font-weight: $font-weight-medium;
  }

  td {
    color: var(--text-primary);
  }
}

.review-actions {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.reject-input {
  width: 100%;
  border-radius: $radius-md;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: $space-2;
  resize: vertical;
}

.btn-row {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>

