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
import { CustomSelect } from '@/components'
import FormDialogShell from '@/components/shared/FormDialogShell.vue'

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
const IMAGE_FALLBACK_TEXT = '图片暂不可用'

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
const failedImageMap = ref<Record<string, boolean>>({})

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

const dialogSubtitle = computed(() => {
  switch (props.mode) {
    case 'create':
      return '完善基础信息后即可快速上架，建议上传清晰主图提升转化。'
    case 'edit':
      return '更新商品信息会实时同步到商品列表与详情页展示。'
    case 'stock':
      return '修改库存后立即生效，请确保数量准确。'
    default:
      return ''
  }
})

const activeStoreName = computed(() => {
  if (props.mode !== 'create') return ''
  const targetStoreId = formData.value.storeId || props.selectedStoreId
  if (!targetStoreId) return ''
  const store = props.stores.find(item => item.storeId === targetStoreId)
  return store?.name || ''
})

const categoryOptions = computed(() =>
  [{ label: '请选择', value: '' }, ...categories.map(cat => ({ label: cat, value: cat }))]
)

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
  return props.mode === 'stock' ? '400px' : '680px'
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
      resetFailedImageMap()
    }
  },
  { immediate: true }
)

// ============================================================================
// Methods
// ============================================================================

function normalizeImageUrl(url: string): string {
  const value = (url || '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }
  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`
  }
  return value.startsWith('/') ? value : `/${value}`
}

function resetFailedImageMap() {
  failedImageMap.value = {}
}

function renderImageUrl(url: string): string {
  return normalizeImageUrl(url)
}

function hasImageLoadError(url: string): boolean {
  return !!failedImageMap.value[url]
}

function markImageLoadError(url: string) {
  if (!url) return
  failedImageMap.value = {
    ...failedImageMap.value,
    [url]: true,
  }
}

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
    .map(item => normalizeImageUrl((item || '').trim()))
    .filter(Boolean)

  formData.value.images = Array.from(new Set(cleaned)).slice(0, MAX_IMAGES)
  formData.value.image = formData.value.images[0] || formData.value.image || ''
}

function addImageUrl() {
  const url = normalizeImageUrl(imageUrlInput.value)
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
      const normalizedUrl = normalizeImageUrl(url)
      if (!normalizedUrl) continue
      if (!merged.includes(normalizedUrl)) {
        merged.push(normalizedUrl)
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
    transition-name="dialog-fade"
    overlay-class="product-form-overlay"
    box-class="product-form-shell"
    @close="handleClose"
  >
    <!-- 库存修改表单 -->
    <template v-if="mode === 'stock'">
      <div class="form-intro form-intro-compact">
        <p class="intro-main">{{ dialogSubtitle }}</p>
      </div>

      <section class="form-section">
        <div class="section-head">
          <h4>库存信息</h4>
          <p>请填写新的可售库存数量</p>
        </div>
        <div class="field-grid field-grid-single">
          <div class="form-item">
            <label><span class="required-mark">*</span>库存数量</label>
            <input
              v-model.number="stockFormData.stock"
              type="number"
              min="0"
              class="input input-strong"
              placeholder="请输入库存数量"
            />
          </div>
        </div>
      </section>
    </template>

    <!-- 创建/编辑表单 -->
    <template v-else>
      <div class="form-intro">
        <p class="intro-main">{{ dialogSubtitle }}</p>
        <div class="intro-meta">
          <span class="meta-chip"><span class="required-mark">*</span> 必填项</span>
          <span class="meta-chip">最多 {{ MAX_IMAGES }} 张图片</span>
          <span v-if="activeStoreName" class="meta-chip meta-chip-accent">
            店铺：{{ activeStoreName }}
          </span>
        </div>
      </div>

      <section class="form-section">
        <div class="section-head">
          <h4>基础信息</h4>
          <p>用于商品主卡片展示</p>
        </div>
        <div class="field-grid">
          <div class="form-item form-item-wide">
            <label><span class="required-mark">*</span>商品名称</label>
            <input
              v-model="formData.name"
              type="text"
              class="input input-strong"
              placeholder="请输入商品名称"
            />
          </div>
          <div class="form-item">
            <label>商品分类</label>
            <CustomSelect
              v-model="formData.category"
              class="select-control"
              :options="categoryOptions"
              placeholder="请选择"
            />
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <h4>销售信息</h4>
          <p>价格与库存将影响销售状态</p>
        </div>
        <div class="field-grid field-grid-triple">
          <div class="form-item">
            <label><span class="required-mark">*</span>价格</label>
            <input
              v-model.number="formData.price"
              type="number"
              min="0"
              step="0.01"
              class="input"
              placeholder="如 29.90"
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
              placeholder="选填，展示划线价"
            />
          </div>
          <div class="form-item">
            <label><span class="required-mark">*</span>库存</label>
            <input
              v-model.number="formData.stock"
              type="number"
              min="0"
              class="input"
              placeholder="请输入可售数量"
            />
          </div>
        </div>
      </section>

      <section class="form-section">
        <div class="section-head">
          <h4>内容与媒体</h4>
          <p>建议上传 1:1 或 4:3 清晰图片作为主图</p>
        </div>
        <div class="field-grid field-grid-single">
          <div class="form-item">
            <label>商品描述</label>
            <textarea
              v-model="formData.description"
              class="textarea"
              rows="3"
              placeholder="请输入商品描述"
            ></textarea>
          </div>
        </div>

        <div class="media-panel">
          <label class="media-label">商品图片（支持 URL 和本地上传）</label>
          <div class="image-input-row">
            <input
              v-model="imageUrlInput"
              type="text"
              class="input"
              placeholder="输入图片 URL 后点击添加"
            />
            <button type="button" class="btn btn-secondary btn-url" @click="addImageUrl">添加 URL</button>
          </div>

          <div class="upload-row">
            <label class="upload-btn" :class="{ disabled: isUploading }">
              选择本地图片
              <input
                type="file"
                class="file-input"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                multiple
                :disabled="isUploading"
                @change="handleFileUpload"
              />
            </label>
            <span class="upload-hint">最多 {{ MAX_IMAGES }} 张，单张不超过 5MB</span>
          </div>

          <p v-if="uploadError" class="upload-error">{{ uploadError }}</p>

          <div v-if="formData.images && formData.images.length > 0" class="image-list">
            <div
              v-for="(url, index) in formData.images"
              :key="`${url}-${index}`"
              class="image-item"
              :class="{ primary: index === 0 }"
            >
              <img
                v-if="!hasImageLoadError(url)"
                :src="renderImageUrl(url)"
                alt="商品图片"
                class="image-preview"
                @error="markImageLoadError(url)"
              />
              <div v-else class="image-fallback">{{ IMAGE_FALLBACK_TEXT }}</div>
              <div class="image-overlay">
                <span v-if="index === 0" class="primary-badge">主图</span>
                <span v-else class="index-badge">#{{ index + 1 }}</span>
                <div class="thumb-actions">
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

          <div v-else class="image-empty">
            <p>还没有商品图片，添加后将用于商品展示。</p>
          </div>
        </div>
      </section>
    </template>

    <template #footer>
      <div class="footer-actions">
        <button class="btn btn-secondary" @click="handleClose">取消</button>
        <button
          class="btn btn-primary"
          :disabled="processing || isUploading"
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </template>
  </FormDialogShell>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

:global(.dialog-fade-enter-active),
:global(.dialog-fade-leave-active) {
  transition: opacity $duration-normal $ease-in-out, transform $duration-normal $ease-in-out;
}

:global(.dialog-fade-enter-from),
:global(.dialog-fade-leave-to) {
  opacity: 0;
  transform: translateY(8px);
}

:global(.product-form-overlay) {
  background: rgba(35, 30, 27, 0.44);
  backdrop-filter: blur(8px);
}

:global(.product-form-shell) {
  border: 1px solid rgba(var(--accent-primary-rgb), 0.2);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(51, 37, 30, 0.2), 0 8px 24px rgba(20, 12, 10, 0.15);
  background:
    linear-gradient(
      155deg,
      rgba(var(--white-rgb), 0.9) 0%,
      rgba(var(--white-rgb), 0.78) 20%,
      var(--bg-elevated) 100%
    );
}

:global(.product-form-shell .dialog-header) {
  padding: 22px 26px 18px;
  border-bottom: 1px solid rgba(var(--accent-primary-rgb), 0.15);
  background: linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.09) 0%, rgba(var(--accent-primary-rgb), 0.02) 100%);
}

:global(.product-form-shell .dialog-header h3) {
  font-size: 24px;
  font-weight: $font-weight-semibold;
}

:global(.product-form-shell .dialog-close) {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(var(--accent-primary-rgb), 0.08);
  border: 1px solid rgba(var(--accent-primary-rgb), 0.18);
}

:global(.product-form-shell .dialog-close:hover) {
  background: rgba(var(--accent-primary-rgb), 0.14);
}

:global(.product-form-shell .dialog-body) {
  padding: 18px 24px;
  max-height: min(75vh, 760px);
  gap: $space-4;
}

:global(.product-form-shell .dialog-footer) {
  position: sticky;
  bottom: 0;
  padding: 14px 24px 18px;
  border-top: 1px solid rgba(var(--accent-primary-rgb), 0.13);
  background: rgba(var(--white-rgb), 0.88);
  backdrop-filter: blur(2px);
}

.form-intro {
  padding: $space-4 $space-4 $space-3;
  border-radius: 12px;
  border: 1px solid rgba(var(--accent-primary-rgb), 0.15);
  background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.12) 0%, rgba(var(--white-rgb), 0.86) 100%);
}

.form-intro-compact {
  margin-bottom: $space-2;
}

.intro-main {
  margin: 0;
  color: var(--text-primary);
  font-size: $font-size-sm + 1;
  line-height: 1.55;
}

.intro-meta {
  margin-top: $space-3;
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: $radius-pill;
  font-size: $font-size-sm;
  color: var(--text-secondary);
  background: rgba(var(--white-rgb), 0.9);
  border: 1px solid rgba(var(--border-subtle-rgb), 0.9);
}

.meta-chip-accent {
  color: var(--accent-primary);
  border-color: rgba(var(--accent-primary-rgb), 0.28);
  background: rgba(var(--accent-primary-rgb), 0.08);
}

.form-section {
  border-radius: 14px;
  border: 1px solid rgba(var(--border-subtle-rgb), 0.92);
  background: rgba(var(--white-rgb), 0.78);
  padding: $space-4;
}

.section-head {
  margin-bottom: $space-4;

  h4 {
    margin: 0;
    font-size: $font-size-lg + 1;
    color: var(--text-primary);
  }

  p {
    margin: $space-1 0 0;
    font-size: $font-size-sm;
    color: var(--text-muted);
  }
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-4;
}

.field-grid-triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field-grid-single {
  grid-template-columns: 1fr;
}

.form-item {
  @include form-item;
}

.form-item-wide {
  grid-column: 1 / -1;
}

.required-mark {
  color: var(--accent-primary);
  font-weight: $font-weight-semibold;
}

.input,
.textarea {
  @include form-control;
  border-radius: 10px;
  border-color: rgba(var(--border-subtle-rgb), 0.95);
  min-height: 42px;
}

.input:focus,
.textarea:focus {
  border-color: rgba(var(--accent-primary-rgb), 0.55);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.16);
}

.input-strong {
  font-weight: $font-weight-medium;
}

.textarea {
  resize: vertical;
  min-height: 96px;
}

:deep(.select-control.custom-select) {
  width: 100%;
  min-width: 0;
}

:deep(.select-control .el-select__wrapper) {
  min-height: 42px;
  border-radius: 10px;
  border-color: rgba(var(--border-subtle-rgb), 0.95);
  background: rgba(var(--white-rgb), 0.84);
}

:deep(.select-control .el-select__wrapper.is-focused) {
  border-color: rgba(var(--accent-primary-rgb), 0.55);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.16);
}

:deep(.select-control .el-select__selected-item),
:deep(.select-control .el-select__placeholder) {
  font-size: $font-size-base;
  color: var(--text-primary);
}

:deep(.select-control .el-select__placeholder) {
  color: var(--text-secondary);
}

.media-panel {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.media-label {
  font-size: $font-size-sm + 1;
  color: var(--text-secondary);
}

.image-input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: $space-3;
  align-items: center;
}

.btn-url {
  min-width: 104px;
}

.upload-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $space-3;
}

.upload-btn {
  @include btn-secondary;
  position: relative;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(var(--white-rgb), 0.85);
  border-color: rgba(var(--border-subtle-rgb), 0.95);

  &.disabled {
    opacity: 0.65;
    pointer-events: none;
  }
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-hint {
  color: var(--text-muted);
  font-size: $font-size-sm;
}

.upload-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(var(--error-rgb), 0.25);
  background: var(--error-muted);
  color: var(--error);
  font-size: $font-size-sm;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-3;
}

.image-item {
  position: relative;
  border: 1px solid rgba(var(--border-subtle-rgb), 0.95);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--white-rgb), 0.82);
  transition: border-color $duration-normal, box-shadow $duration-normal, transform $duration-normal;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--accent-primary-rgb), 0.34);
    box-shadow: 0 10px 18px rgba(25, 14, 10, 0.12);
  }

  &.primary {
    border-color: rgba(var(--accent-primary-rgb), 0.45);
    box-shadow: 0 10px 22px rgba(var(--accent-primary-rgb), 0.18);
  }
}

.image-preview {
  display: block;
  width: 100%;
  height: 118px;
  object-fit: cover;
}

.image-fallback {
  width: 100%;
  height: 118px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-sm;
  color: var(--text-muted);
  background: linear-gradient(145deg, rgba(var(--border-subtle-rgb), 0.45) 0%, rgba(var(--white-rgb), 0.78) 100%);
}

.image-overlay {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: 8px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(14, 12, 11, 0.78) 100%);
}

.primary-badge {
  padding: 2px 8px;
  border-radius: $radius-pill;
  background: rgba(var(--accent-primary-rgb), 0.92);
  color: rgba(var(--white-rgb), 0.96);
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
}

.index-badge {
  padding: 2px 8px;
  border-radius: $radius-pill;
  background: rgba(var(--white-rgb), 0.25);
  color: rgba(var(--white-rgb), 0.94);
  font-size: $font-size-xs;
}

.thumb-actions {
  display: flex;
  gap: $space-1;
}

.btn-link {
  border: none;
  background: rgba(var(--white-rgb), 0.18);
  color: rgba(var(--white-rgb), 0.95);
  border-radius: 8px;
  padding: 3px 8px;
  font-size: $font-size-xs;
  cursor: pointer;
  transition: background $duration-fast, color $duration-fast;

  &:hover:not(:disabled) {
    background: rgba(var(--white-rgb), 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.danger {
    color: #ffd2c9;
  }

  &.danger:hover {
    background: rgba(var(--error-rgb), 0.45);
  }
}

.image-empty {
  border-radius: 12px;
  border: 1px dashed rgba(var(--accent-primary-rgb), 0.28);
  background: rgba(var(--accent-primary-rgb), 0.05);
  padding: $space-5;
  text-align: center;

  p {
    margin: 0;
    color: var(--text-muted);
    font-size: $font-size-sm + 1;
  }
}

// 按钮
.btn {
  @include btn-base;
  border-radius: 10px;
  min-height: 42px;
  min-width: 96px;
}

.btn-secondary {
  @include btn-secondary;
  background: rgba(var(--white-rgb), 0.9);
  border-color: rgba(var(--border-subtle-rgb), 0.95);
}

.btn-primary {
  @include btn-primary;
  box-shadow: 0 8px 18px rgba(var(--accent-primary-rgb), 0.2);
}

.footer-actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
}

@media (max-width: 1024px) {
  .image-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-grid-triple {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  :global(.product-form-shell .dialog-header) {
    padding: 16px 18px 14px;
  }

  :global(.product-form-shell .dialog-header h3) {
    font-size: 20px;
  }

  :global(.product-form-shell .dialog-body) {
    padding: 14px 14px 12px;
  }

  :global(.product-form-shell .dialog-footer) {
    padding: 12px 14px 14px;
  }

  .field-grid,
  .field-grid-triple {
    grid-template-columns: 1fr;
  }

  .image-list {
    grid-template-columns: 1fr;
  }

  .image-input-row {
    grid-template-columns: 1fr;
  }

  .btn-url {
    width: 100%;
  }

  .footer-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .btn {
    width: 100%;
  }
}
</style>
