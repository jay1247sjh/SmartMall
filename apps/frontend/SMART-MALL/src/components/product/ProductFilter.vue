<script setup lang="ts">
/**
 * ProductFilter 子组件
 * 
 * 商品筛选功能组件
 * 
 * 业务职责：
 * - 店铺选择筛选
 * - 商品状态筛选
 * - 添加商品按钮
 * 
 * Requirements: 3.3
 */
import { computed } from 'vue'
import type { StoreDTO } from '@/api/store.api'
import type { ProductStatus } from '@/api/product.api'
import { CustomSelect, FilterBar } from '@/components'

// ============================================================================
// Types
// ============================================================================

export interface ProductFilterParams {
  storeId: string
  status: ProductStatus | ''
}

export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
}

// ============================================================================
// Props & Emits
// ============================================================================

interface ProductFilterProps {
  /** 筛选参数 */
  modelValue: ProductFilterParams
  /** 店铺列表 */
  stores: StoreDTO[]
  /** 状态选项 */
  statusOptions?: SelectOption<ProductStatus | ''>[]
  /** 是否可以创建商品 */
  canCreate?: boolean
  /** 商品总数 */
  total?: number
}

interface ProductFilterEmits {
  (e: 'update:modelValue', value: ProductFilterParams): void
  (e: 'create'): void
}

const props = withDefaults(defineProps<ProductFilterProps>(), {
  statusOptions: () => [
    { label: '全部状态', value: '' },
    { label: '在售', value: 'ON_SALE' },
    { label: '下架', value: 'OFF_SALE' },
    { label: '售罄', value: 'SOLD_OUT' },
  ],
  canCreate: false,
})

const emit = defineEmits<ProductFilterEmits>()

// ============================================================================
// Computed
// ============================================================================

const selectedStoreId = computed({
  get: () => props.modelValue.storeId,
  set: (value: string) => {
    emit('update:modelValue', {
      ...props.modelValue,
      storeId: value,
    })
  },
})

const selectedStatus = computed({
  get: () => props.modelValue.status,
  set: (value: ProductStatus | '') => {
    emit('update:modelValue', {
      ...props.modelValue,
      status: value,
    })
  },
})

const storeOptions = computed<SelectOption[]>(() => {
  return [
    { label: '选择店铺', value: '' },
    ...props.stores.map(store => ({
      label: getStoreLabel(store),
      value: store.storeId,
    })),
  ]
})

const statusSelectOptions = computed<SelectOption[]>(() =>
  props.statusOptions.map(option => ({
    label: option.label,
    value: option.value,
  })),
)

// ============================================================================
// Methods
// ============================================================================

function handleCreate() {
  if (!props.canCreate) {
    return
  }
  emit('create')
}

function getStoreLabel(store: StoreDTO): string {
  return `${store.name} (${store.status === 'ACTIVE' ? '营业中' : '未营业'})`
}
</script>

<template>
  <FilterBar class="toolbar" :total="total" total-label="件商品">
    <CustomSelect
      v-model="selectedStoreId"
      :options="storeOptions"
      placeholder="选择店铺"
    />
    <CustomSelect
      v-model="selectedStatus"
      :options="statusSelectOptions"
      placeholder="全部状态"
    />

    <template #actions>
      <button
        class="btn btn-primary create-btn"
        :disabled="!canCreate"
        :title="canCreate ? '添加商品' : '仅营业中的店铺可新增商品'"
        @click="handleCreate"
      >
        + 添加商品
      </button>
    </template>
  </FilterBar>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 工具栏
.toolbar {
  :deep(.filter-group) {
    width: 100%;
    gap: $space-3 + 1;
  }

  :deep(.filter-right) {
    gap: $space-4;
  }

  :deep(.custom-select) {
    min-width: 170px;
  }
}

// 按钮
.btn {
  @include btn-base;

  min-width: 98px;
  height: 34px;
  padding: $space-1 + 2 $space-3 + 2;
  font-size: $font-size-sm + 1;
  white-space: nowrap;
  box-shadow: 0 6px 14px rgba(var(--accent-primary-rgb), 0.22);

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }
}

.btn-primary {
  background: $gradient-merchant;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(var(--accent-primary-rgb), 0.3);
  }
}

.create-btn {
  margin: 0 $space-2;
}
</style>
