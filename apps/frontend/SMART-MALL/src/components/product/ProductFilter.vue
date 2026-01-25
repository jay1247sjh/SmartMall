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

// ============================================================================
// Methods
// ============================================================================

function handleCreate() {
  emit('create')
}

function getStoreLabel(store: StoreDTO): string {
  return `${store.name} (${store.status === 'ACTIVE' ? '营业中' : '未营业'})`
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <!-- 店铺选择 -->
      <select v-model="selectedStoreId" class="select store-select">
        <option value="">选择店铺</option>
        <option 
          v-for="store in stores" 
          :key="store.storeId" 
          :value="store.storeId"
        >
          {{ getStoreLabel(store) }}
        </option>
      </select>
      
      <!-- 状态筛选 -->
      <select v-model="selectedStatus" class="select">
        <option 
          v-for="option in statusOptions" 
          :key="option.value" 
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <!-- 添加商品按钮 -->
    <button 
      v-if="canCreate"
      class="btn btn-primary" 
      @click="handleCreate"
    >
      + 添加商品
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 工具栏
.toolbar {
  @include flex-between;
  gap: $space-4;

  .toolbar-left {
    @include flex-center-y;
    gap: $space-3;
  }

  .store-select {
    min-width: 200px;
  }
}

// 表单控件
.select {
  @include form-control;
}

// 按钮
.btn {
  @include btn-base;
}

.btn-primary {
  @include btn-primary;
}
</style>
