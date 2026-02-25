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
import { productApi } from '@/api'
import type { ProductDTO } from '@/api/product.api'
import type { StoreDTO } from '@/api/store.api'
import FormDialogShell from '@/components/shared/FormDialogShell.vue'
import NativeSelectField from '@/components/shared/NativeSelectField.vue'

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
  images?: string[]
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
const MAX_IMAGES = 10

const formData = ref<ProductFormData>({
  storeId: '',
  name: '',
  description: '',
  price: 0,
  originalPrice: undefined,
  stock: 0,
  category: '',
  image: '',
  images: [],
})

const stockFormData = ref<StockFormData>({
  stock: 0,
})

const imageUrlInput = ref('')
const isUploading = ref(false)
const uploadError = ref('')

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
  if (isUploading.value) {
    return '上传中...'
  }
  if (props.processing) {
    return props.mode === 'create' ? '创建中...' : '保存中...'
  }
  return props.mode === 'create' ? '创建' : '保存'
})

const dialogWidth = computed(() => {
  return props.mode === 'stock' ? '360px' : '520px'
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
        const images = props.product.images && props.product.images.length > 0
          ? [...props.product.images]
          : (props.product.image ? [props.product.image] : [])
        formData.value = {
          name: props.product.name,
          description: props.product.description || '',
          price: props.product.price,
          originalPrice: props.product.originalPrice || undefined,
          stock: props.product.stock,
          category: props.product.category || '',
          image: props.product.image || '',
          images,
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
          images: [],
        }
      }
      imageUrlInput.value = ''
      uploadError.value = ''
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
    normalizeImageFields()
    emit('submit', { ...formData.value })
  }
}

function normalizeImageFields() {
  const cleaned = (formData.value.images || [])
    .map(item => (item || '').trim())
    .filter(Boolean)

  formData.value.images = Array.from(new Set(cleaned)).slice(0, MAX_IMAGES)
  formData.value.image = formData.value.images[0] || formData.value.image || ''
}

function addImageUrl() {
  const url = imageUrlInput.value.trim()
  if (!url) return

  const images = formData.value.images || []
  if (images.includes(url)) {
    imageUrlInput.value = ''
    return
  }

  if (images.length >= MAX_IMAGES) {
    uploadError.value = `最多上传 ${MAX_IMAGES} 张图片`
    return
  }

  images.push(url)
  formData.value.images = images
  formData.value.image = images[0]
  imageUrlInput.value = ''
  uploadError.value = ''
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length === 0) return

  const current = formData.value.images || []
  if (current.length >= MAX_IMAGES) {
    uploadError.value = `最多上传 ${MAX_IMAGES} 张图片`
    input.value = ''
    return
  }

  const available = MAX_IMAGES - current.length
  const selected = files.slice(0, available)

  isUploading.value = true
  uploadError.value = ''
  try {
    const result = await productApi.uploadProductImages(selected)
    const merged = [...current]
    for (const url of result.urls) {
      if (!merged.includes(url)) {
        merged.push(url)
      }
    }
    formData.value.images = merged
    formData.value.image = merged[0] || ''
  } catch (error: any) {
    uploadError.value = error?.message || '上传失败，请稍后重试'
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

function removeImage(index: number) {
  const images = [...(formData.value.images || [])]
  images.splice(index, 1)
  formData.value.images = images
  formData.value.image = images[0] || ''
}

function setPrimaryImage(index: number) {
  const images = [...(formData.value.images || [])]
  if (index < 0 || index >= images.length) return
  const target = images[index]
  if (!target) return
  images.splice(index, 1)
  images.unshift(target)
  formData.value.images = images
  formData.value.image = images[0] || ''
}
</script>

<template>
  <FormDialogShell
    :visible="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    @close="handleClose"
  >
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
          <NativeSelectField v-model="formData.category" class="select">
            <option value="">请选择</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </NativeSelectField>
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

      <!-- 商品图片 -->
      <div class="form-item">
        <label>商品图片（支持 URL 和本地上传）</label>
        <div class="image-input-row">
          <input
            v-model="imageUrlInput"
            type="text"
            class="input"
            placeholder="输入图片 URL 后点击添加"
          />
          <button type="button" class="btn btn-secondary" @click="addImageUrl">添加 URL</button>
        </div>
        <div class="upload-row">
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            multiple
            :disabled="isUploading"
            @change="handleFileUpload"
          />
          <span class="upload-hint">最多 {{ MAX_IMAGES }} 张，单张不超过 5MB</span>
        </div>
        <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>
        <div v-if="formData.images && formData.images.length > 0" class="image-list">
          <div v-for="(url, index) in formData.images" :key="`${url}-${index}`" class="image-item">
            <img :src="url" alt="商品图片" class="image-preview" />
            <div class="image-meta">
              <span v-if="index === 0" class="primary-badge">主图</span>
              <div class="image-actions">
                <button type="button" class="btn-link" :disabled="index === 0" @click="setPrimaryImage(index)">
                  设为主图
                </button>
                <button type="button" class="btn-link danger" @click="removeImage(index)">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <button class="btn btn-secondary" @click="handleClose">取消</button>
      <button 
        class="btn btn-primary" 
        :disabled="processing || isUploading" 
        @click="handleSubmit"
      >
        {{ submitButtonText }}
      </button>
    </template>
  </FormDialogShell>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 表单
.form-item {
  @include form-item;
}

.form-row {
  @include form-row;
}

.input,
.textarea {
  @include form-control;
}

.select {
  width: 100%;
}

.textarea {
  resize: vertical;
}

.image-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: $space-3;
  align-items: center;
}

.upload-row {
  margin-top: $space-3;
  display: flex;
  align-items: center;
  gap: $space-3;
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.upload-hint {
  color: var(--text-secondary);
}

.upload-error {
  margin-top: $space-2;
  color: var(--danger, #dc2626);
  font-size: $font-size-sm;
}

.image-list {
  margin-top: $space-3;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-3;
}

.image-item {
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  overflow: hidden;
  background: var(--bg-secondary);
}

.image-preview {
  display: block;
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.image-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-2 $space-3;
}

.primary-badge {
  color: var(--accent-primary);
  font-size: $font-size-xs;
}

.image-actions {
  display: flex;
  gap: $space-2;
}

.btn-link {
  border: none;
  background: transparent;
  color: var(--accent-primary);
  font-size: $font-size-xs;
  cursor: pointer;

  &:disabled {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  &.danger {
    color: var(--danger, #dc2626);
  }
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
