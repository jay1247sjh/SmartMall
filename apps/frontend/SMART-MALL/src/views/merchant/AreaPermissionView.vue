<script setup lang="ts">
/**
 * 商家区域权限视图
 *
 * 商家查看自己已获得的区域权限。
 *
 * 业务职责：
 * - 展示商家已获得的区域权限列表
 * - 显示权限详情（区域名称、楼层、授权时间）
 * - 显示权限状态
 *
 * 用户角色：
 * - 仅商家（MERCHANT）可访问
 */
import { ref, computed, onMounted } from 'vue'
import { DataTable, MessageAlert, StatusBadge } from '@/components'
import { areaPermissionApi } from '@/api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'
import { useMessage, useFormatters, useStatusConfig } from '@/composables'

// Composables
const { message, showMessage, clearMessage } = useMessage()
const { formatDate } = useFormatters()
const { getStatusConfig } = useStatusConfig()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const permissions = ref<AreaPermissionDTO[]>([])

// ============================================================================
// Computed
// ============================================================================

const columns = [
  { key: 'floorName', title: '楼层', minWidth: '100' },
  { key: 'areaName', title: '区域编号', minWidth: '120' },
  { key: 'status', title: '状态', minWidth: '100' },
  { key: 'grantedAt', title: '授权时间', minWidth: '150' },
]

const activePermissions = computed(() => 
  permissions.value.filter(p => p.status === 'ACTIVE')
)

// ============================================================================
// Methods
// ============================================================================

async function loadData() {
  isLoading.value = true
  try {
    permissions.value = await areaPermissionApi.getMyPermissions()
  } catch (e: any) {
    console.error('加载数据失败:', e)
    showMessage('error', e.message || '加载数据失败')
  } finally {
    isLoading.value = false
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
  <div class="permission-page">
    <!-- 消息提示 -->
    <MessageAlert v-if="message" :type="message.type" :text="message.text" @close="clearMessage" />

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value">{{ activePermissions.length }}</span>
        <span class="stat-label">有效权限</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ permissions.length }}</span>
        <span class="stat-label">总权限数</span>
      </div>
    </div>

    <!-- 权限列表 -->
    <div class="table-card">
      <div class="card-header">
        <h3>我的区域权限</h3>
      </div>
      <DataTable
        :columns="columns"
        :data="permissions"
        :loading="isLoading"
        empty-text="暂无区域权限"
      >
        <template #status="{ value }">
          <StatusBadge :status="value" domain="permission" />
        </template>
        <template #grantedAt="{ value }">
          {{ formatDate(value, 'full') }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.permission-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

// 统计行
.stats-row {
  @include stats-row;

  .stat-item {
    @include stat-item;

    .stat-value {
      @include stat-value;
    }

    .stat-label {
      @include stat-label;
    }
  }
}

// 表格卡片
.table-card {
  @include card-base;
  overflow: hidden;

  .card-header {
    @include card-header;

    h3 {
      font-size: $font-size-xl - 2;
      font-weight: $font-weight-medium;
    }
  }
}
</style>
