<script setup lang="ts">
/**
 * DataTable - 数据表格组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ElTable, ElTableColumn, ElEmpty, ElIcon } from 'element-plus'
import { Document } from '@element-plus/icons-vue'

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

function handleRowClick(row: any) {
  const index = props.data.indexOf(row)
  emit('rowClick', row, index)
}
</script>

<template>
  <section class="data-table-wrapper">
    <ElTable
      v-loading="loading"
      :data="data"
      stripe
      highlight-current-row
      class="data-table"
      @row-click="handleRowClick"
    >
      <ElTableColumn
        v-for="col in columns"
        :key="col.key"
        :prop="col.key"
        :label="col.title"
        :width="col.width"
      >
        <template #default="{ row }">
          <slot :name="col.key" :row="row" :value="row[col.key]">
            {{ row[col.key] }}
          </slot>
        </template>
      </ElTableColumn>

      <template #empty>
        <ElEmpty :description="emptyText">
          <template #image>
            <ElIcon :size="48" color="var(--el-text-color-placeholder)">
              <Document />
            </ElIcon>
          </template>
        </ElEmpty>
      </template>
    </ElTable>
  </section>
</template>

<style scoped lang="scss">
.data-table-wrapper {
  .data-table {
    border-radius: 12px;
    overflow: hidden;

    :deep(.el-table__header) {
      th {
        background-color: var(--el-fill-color-light);
        font-weight: 500;
      }
    }

    :deep(.el-table__row) {
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover > td {
        background-color: var(--el-fill-color-lighter);
      }
    }

    :deep(.el-table__empty-block) {
      min-height: 200px;
    }
  }
}
</style>
