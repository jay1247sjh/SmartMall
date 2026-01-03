<script setup lang="ts">
/**
 * DataTable - 数据表格组件
 * 用于展示列表数据
 */
import { computed } from 'vue'

interface Column {
  key: string
  title: string
  width?: string
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: '暂无数据',
})

const emit = defineEmits<{
  rowClick: [row: any, index: number]
}>()

const hasData = computed(() => props.data.length > 0)

function handleRowClick(row: any, index: number) {
  emit('rowClick', row, index)
}
</script>

<template>
  <div class="data-table">
    <!-- 表头 -->
    <div class="table-header">
      <div
        v-for="col in columns"
        :key="col.key"
        class="table-cell"
        :style="{ width: col.width }"
      >
        {{ col.title }}
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="table-loading">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!hasData" class="table-empty">
      <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 10h18" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 14h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <p>{{ emptyText }}</p>
    </div>

    <!-- 数据行 -->
    <div v-else class="table-body">
      <div
        v-for="(row, index) in data"
        :key="index"
        class="table-row"
        @click="handleRowClick(row, index)"
      >
        <div
          v-for="col in columns"
          :key="col.key"
          class="table-cell"
          :style="{ width: col.width }"
        >
          <slot :name="col.key" :row="row" :value="row[col.key]">
            {{ row[col.key] }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: flex;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.table-header .table-cell {
  font-size: 13px;
  font-weight: 500;
  color: #9aa0a6;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: flex;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.table-cell {
  flex: 1;
  font-size: 14px;
  color: #e8eaed;
  display: flex;
  align-items: center;
}

.table-loading,
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #9aa0a6;
}

.table-loading .spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #8ab4f8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-empty svg {
  color: #5f6368;
  margin-bottom: 12px;
}

.table-empty p {
  margin: 0;
  font-size: 14px;
}
</style>
