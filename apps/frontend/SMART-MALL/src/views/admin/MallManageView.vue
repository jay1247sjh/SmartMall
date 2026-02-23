<script setup lang="ts">
/**
 * 商城管理视图（只读展示）
 *
 * 展示建模器已发布的商城结构数据，包括楼层和区域信息。
 * 所有编辑操作在建模器中完成，本页面仅用于运营查看。
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElRow,
  ElCol,
  ElCard,
  ElTable,
  ElTableColumn,
  ElEmpty,
  ElTag,
  ElButton,
  ElSkeleton,
  ElMessage,
} from 'element-plus'
import { useRouter } from 'vue-router'
import { mallManageApi } from '@/api'
import type { ProjectResponse, FloorResponse, AreaResponse } from '@/api/mall-builder.api'

const router = useRouter()
const { t } = useI18n()

const isLoading = ref(true)
const projectData = ref<ProjectResponse | null>(null)
const selectedFloorId = ref<string | null>(null)

const floors = computed<FloorResponse[]>(() => projectData.value?.floors ?? [])

const selectedFloor = computed<FloorResponse | null>(() => {
  if (!selectedFloorId.value) return null
  return floors.value.find(f => f.floorId === selectedFloorId.value) ?? null
})

const currentAreas = computed<AreaResponse[]>(() => selectedFloor.value?.areas ?? [])

function getStatusTagType(status?: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (status) {
    case 'OCCUPIED': return 'success'
    case 'PENDING': return 'warning'
    case 'LOCKED': return 'info'
    case 'AUTHORIZED': return ''
    default: return 'info'
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case 'AVAILABLE': return t('admin.statusAvailable')
    case 'LOCKED': return t('admin.statusLocked')
    case 'PENDING': return t('admin.statusPending')
    case 'AUTHORIZED': return t('admin.statusAuthorized')
    case 'OCCUPIED': return t('admin.statusOccupied')
    default: return status || t('admin.statusUnknown')
  }
}

function selectFloor(floor: FloorResponse) {
  selectedFloorId.value = floor.floorId
}

function goToBuilder() {
  router.push('/admin/builder')
}

async function loadData() {
  isLoading.value = true
  try {
    projectData.value = await mallManageApi.getPublishedMallData()
    if (floors.value.length > 0) {
      selectedFloorId.value = floors.value[0].floorId
    }
  } catch (e: any) {
    if (e.code === 'A4002') {
      projectData.value = null
    } else {
      console.error('Failed to load mall data:', e)
      ElMessage.error(t('admin.loadMallDataFailed'))
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <article class="mall-manage-page">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <ElSkeleton :rows="8" animated />
    </div>

    <!-- 空状态：无已发布数据 -->
    <div v-else-if="!projectData" class="empty-state">
      <ElEmpty :description="t('admin.noPublishedData')">
        <ElButton type="primary" @click="goToBuilder">
          {{ t('admin.goToBuilder') }}
        </ElButton>
      </ElEmpty>
    </div>

    <!-- 数据展示 -->
    <ElRow v-else :gutter="20" class="content-grid">
      <!-- 左侧：楼层列表 -->
      <ElCol :span="6">
        <ElCard shadow="never" class="floor-panel">
          <template #header>
            <header class="panel-header">
              <h3>{{ t('admin.floorStructure') }}</h3>
              <span class="floor-count">{{ t('admin.floorCount', { count: floors.length }) }}</span>
            </header>
          </template>

          <nav class="floor-list">
            <article
              v-for="floor in floors"
              :key="floor.floorId"
              :class="['floor-item', { active: selectedFloorId === floor.floorId }]"
              @click="selectFloor(floor)"
            >
              <hgroup class="floor-info">
                <h4 class="floor-name">{{ floor.name }}</h4>
                <small class="floor-area-count">{{ t('admin.areaCount', { count: (floor.areas ?? []).length }) }}</small>
              </hgroup>
            </article>
          </nav>
        </ElCard>
      </ElCol>

      <!-- 右侧：区域列表 -->
      <ElCol :span="18">
        <ElCard shadow="never" class="area-panel">
          <template #header>
            <header class="panel-header">
              <h3>{{ selectedFloor ? `${selectedFloor.name} - ${t('admin.areaList')}` : t('admin.selectFloor') }}</h3>
            </header>
          </template>

          <ElTable
            v-if="selectedFloor"
            :data="currentAreas"
            stripe
            class="area-table"
          >
            <ElTableColumn prop="name" :label="t('admin.areaName')" min-width="120" />
            <ElTableColumn prop="type" :label="t('admin.areaType')" width="100" />
            <ElTableColumn :label="t('admin.status')" width="100">
              <template #default="{ row }">
                <ElTag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn :label="t('admin.merchantId')" min-width="140">
              <template #default="{ row }">
                <span v-if="row.merchantId">{{ row.merchantId }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </ElTableColumn>

            <template #empty>
              <ElEmpty :description="t('admin.noAreasInFloor')" />
            </template>
          </ElTable>

          <ElEmpty v-else :description="t('admin.selectFloorToView')" />
        </ElCard>
      </ElCol>
    </ElRow>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.mall-manage-page {
  height: 100%;

  .loading-state,
  .empty-state {
    @include flex-column-center;
    height: 100%;
    padding: $space-8;
  }

  .content-grid {
    height: 100%;
  }

  .floor-panel,
  .area-panel {
    height: 100%;
    @include card-base;

    .panel-header {
      @include card-header;
      padding: 0;
      border-bottom: none;

      .floor-count {
        font-size: $font-size-sm;
        color: var(--text-muted);
      }
    }
  }

  .floor-panel .floor-list {
    display: flex;
    flex-direction: column;
    gap: $space-2;

    .floor-item {
      padding: $space-3 $space-4;
      border-radius: $radius-md;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all $duration-normal;

      &:hover {
        background: rgba(var(--text-primary-rgb), 0.04);
      }

      &.active {
        background: rgba(var(--accent-primary-rgb), 0.1);
        border-color: rgba(var(--accent-primary-rgb), 0.3);
      }

      .floor-info {
        .floor-name {
          font-size: $font-size-lg;
          font-weight: $font-weight-semibold;
          margin: 0 0 $space-1 0;
          color: var(--text-primary);
        }

        .floor-area-count {
          font-size: $font-size-sm;
          color: var(--text-disabled);
        }
      }
    }
  }

  .area-panel {
    .area-table {
      border-radius: $radius-md;

      .text-muted {
        @include text-muted;
      }
    }
  }
}
</style>
