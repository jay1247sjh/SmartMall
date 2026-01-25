<script setup lang="ts">
/**
 * ProductForm 子组件
 * 
 * 商品创建和编辑表单组件
 * 
 * 业务职责：
 * - 创建新商品表单
 * - 编辑现有商品表单
 * - 库存修改表单
 * - 表单验证和提交
 * 
 * Requirements: 3.2
 */
import { ref, watch, computed } from 'vue'
import type { ProductDTO, CreateProductRequest, UpdateProductRequest } from '@/api/product.api'
import type { StoreDTO } from '@/api/store.api'

// ============================================================================
// Types
// ============================================================================

export interface ProductFormData {
  storeId?: string
  name: string
  description: string
  price: number
  originalPrice?: number
  stock: number
  category: string
  image?: string
  sortOrder?: number
}

export interface StockFormData {
  stock: number
}

// ============================================================================
// Props & Emits
// ============================================================================

interface ProductFormProps {
  /** 对话框是否可见 */
  visible: boolean
  /** 商品数据（编辑模式） */
  product: ProductDTO | null
  /** 表单模式 */
  mode: 'create' | 'edit' | 'stock'
  /** 可用店铺列表（创建模式） */
  stores?: StoreDTO[]
  /** 当前选中的店铺ID（创建模式） */
  selectedStoreId?: string
  /** 是否正在处理 */
  processing?: boolean
}

interface ProductFormEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: ProductFormData | StockFormData): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<ProductFormProps>(), {
  stores: () => [],
  selectedStoreId: '',
  processing: false,
})
const emit = defineEmits<ProductFormEmits>()

// ============================================================================
// State
// ============================================================================

const categories = ['食品', '饮品', '服装', '配饰', '电子', '日用', '其他']

const formData = ref<ProductFormData>({
  storeId: '',
  name: '',
  description: '',
  price: 0,
  originalPrice: undefined,
  stock: 0,
  category: '',
  image: '',
})

const stockFormData = ref<StockFormData>({
  stock: 0,
})

// ============================================================================
// Computed
// ============================================================================

const dialogTitle = computed(() => {
  switch (props.mode) {
    case 'create':
      return '添加商品'
    case 'edit':
      return '编辑商品'
    case 'stock':
      return '修改库存'
    default:
      return '商品表单'
  }
})

const submitButtonText = computed(() => {
  if (props.processing) {
    return props.mode === 'create' ? '创建中...' : '保存中...'
  }
  return props.mode === 'create' ? '创建' : '保存'
})

const dialogSize = computed(() => {
  return props.mode === 'stock' ? 'dialog-sm' : ''
})

// ============================================================================
// Watchers
// ============================================================================

// 当对话框打开或商品数据变化时，重置表单
watch(
  () => [props.visible, props.product, props.mode, props.selectedStoreId],
  () => {
    if (props.visible) {
      if (props.mode === 'stock' && props.product) {
        stockFormData.value = {
          stock: props.product.stock,
        }
      } else if (props.mode === 'edit' && props.product) {
        formData.value = {
          name: props.product.name,
          description: props.product.description || '',
          price: props.product.price,
          originalPrice: props.product.originalPrice || undefined,
          stock: props.product.stock,
          category: props.product.category || '',
          image: props.product.image || '',
          sortOrder: props.product.sortOrder,
        }
      } else {
        formData.value = {
          storeId: props.selectedStoreId,
          name: '',
          description: '',
          price: 0,
          originalPrice: undefined,
          stock: 0,
          category: '',
          image: '',
        }
      }
    }
  },
  { immediate: true }
)

// ============================================================================
// Methods
// ============================================================================

function handleClose() {
  emit('update:visible', false)
  emit('cancel')
}

function handleSubmit() {
  if (props.mode === 'stock') {
    if (stockFormData.value.stock < 0) {
      return
    }
    emit('submit', { ...stockFormData.value })
  } else {
    // 基本验证
    if (!formData.value.name || formData.value.price < 0 || formData.value.stock < 0) {
      return
    }
    emit('submit', { ...formData.value })
  }
}
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div :class="['dialog', dialogSize]">
      <div class="dialog-header">
        <h3>{{ dialogTitle }}</h3>
        <button class="dialog-close" @click="handleClose">×</button>
      </div>
      <div class="dialog-body">
        <!-- 库存修改表单 -->
        <template v-if="mode === 'stock'">
          <div class="form-item">
            <label>库存数量</label>
            <input 
              v-model.number="stockFormData.stock" 
              type="number" 
              min="0" 
              class="input" 
            />
          </div>
        </template>

        <!-- 创建/编辑表单 -->
        <template v-else>
          <!-- 商品名称 -->
          <div class="form-item">
            <label>商品名称 *</label>
            <input 
              v-model="formData.name" 
              type="text" 
              class="input" 
              placeholder="请输入商品名称" 
            />
          </div>
          
          <!-- 价格行 -->
          <div class="form-row">
            <div class="form-item">
              <label>价格 *</label>
              <input 
                v-model.number="formData.price" 
                type="number" 
                min="0" 
                step="0.01" 
                class="input" 
              />
            </div>
            <div class="form-item">
              <label>原价</label>
              <input 
                v-model.number="formData.originalPrice" 
                type="number" 
                min="0" 
                step="0.01" 
                class="input" 
              />
            </div>
          </div>
          
          <!-- 库存和分类行 -->
          <div class="form-row">
            <div class="form-item">
              <label>库存 *</label>
              <input 
                v-model.number="formData.stock" 
                type="number" 
                min="0" 
                class="input" 
              />
            </div>
            <div class="form-item">
              <label>分类</label>
              <select v-model="formData.category" class="select">
                <option value="">请选择</option>
                <option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- 商品描述 -->
          <div class="form-item">
            <label>商品描述</label>
            <textarea 
              v-model="formData.description" 
              class="textarea" 
              rows="3" 
              placeholder="请输入商品描述"
            ></textarea>
          </div>
        </template>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button 
          class="btn btn-primary" 
          :disabled="processing" 
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 对话框
.dialog-overlay {
  @include dialog-overlay;
}

.dialog {
  @include dialog-box(520px);

  &.dialog-sm {
    width: 360px;
  }
}

.dialog-header {
  @include dialog-header;
}

.dialog-close {
  @include dialog-close;
}

.dialog-body {
  @include dialog-body;
}

.dialog-footer {
  @include dialog-footer;
}

// 表单
.form-item {
  @include form-item;
}

.form-row {
  @include form-row;
}

.input,
.select,
.textarea {
  @include form-control;
}

.textarea {
  resize: vertical;
}

// 按钮
.btn {
  @include btn-base;
}

.btn-secondary {
  @include btn-secondary;
}

.btn-primary {
  @include btn-primary;
}
</style>
