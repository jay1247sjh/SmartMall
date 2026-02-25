<script setup lang="ts">
/**
 * 商品管理视图
 *
 * 商家管理店铺商品的页面。
 *
 * 业务职责：
 * - 展示店铺商品列表
 * - 创建、编辑、删除商品
 * - 上架/下架商品
 * - 库存管理
 * 
 * Requirements: 3.4, 3.5
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { HttpError, storeApi, productApi } from '@/api'
import { MessageAlert } from '@/components'
import type { StoreDTO } from '@/api/store.api'
import type { ProductDTO, ProductStatus } from '@/api/product.api'
import { useMessage } from '@/composables'

// 子组件
import ProductTable from '@/components/product/ProductTable.vue'
import ProductForm from '@/components/product/ProductForm.vue'
import ProductFilter from '@/components/product/ProductFilter.vue'
import type { ProductFormData, StockFormData } from '@/components/product/ProductForm.vue'
import type { ProductFilterParams } from '@/components/product/ProductFilter.vue'

// Composables
const { t } = useI18n()
const route = useRoute()
const { message, showMessage, clearMessage } = useMessage()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stores = ref<StoreDTO[]>([])
const products = ref<ProductDTO[]>([])

// 筛选参数
const filterParams = ref<ProductFilterParams>({
  storeId: '',
  status: '',
})

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框状态
const showFormDialog = ref(false)
const formMode = ref<'create' | 'edit' | 'stock'>('create')
const editingProduct = ref<ProductDTO | null>(null)

// 操作状态
const isProcessing = ref(false)

function isCancelledError(error: unknown): boolean {
  return error instanceof HttpError && error.code === 'CANCELLED'
}

function getRouteStoreId(): string | null {
  const raw = route.query.storeId
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim()
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) {
    return raw[0].trim()
  }
  return null
}

// ============================================================================
// Computed
// ============================================================================

const selectedStore = computed(() => 
  stores.value.find(s => s.storeId === filterParams.value.storeId)
)

const canCreateProduct = computed(() => 
  selectedStore.value?.status === 'ACTIVE'
)

const selectedStoreSummary = computed(() => {
  if (!selectedStore.value) {
    return '请选择店铺后管理商品'
  }
  return `${selectedStore.value.name} · ${selectedStore.value.floorName} · ${selectedStore.value.areaName}`
})

// ============================================================================
// Methods
// ============================================================================

async function loadStores() {
  try {
    stores.value = await storeApi.getMyStores()
    const routeStoreId = getRouteStoreId()
    if (routeStoreId) {
      const targetStore = stores.value.find(s => s.storeId === routeStoreId)
      if (targetStore) {
        filterParams.value.storeId = targetStore.storeId
        return
      }
    }
    // 默认选择第一个激活的店铺
    const activeStore = stores.value.find(s => s.status === 'ACTIVE')
    if (activeStore) {
      filterParams.value.storeId = activeStore.storeId
    } else {
      const firstStore = stores.value[0]
      if (firstStore) {
        filterParams.value.storeId = firstStore.storeId
      }
    }
  } catch (e) {
    if (isCancelledError(e)) return
    console.error('加载店铺失败:', e)
    showMessage('error', t('merchant.product.loadStoresFailed'))
  }
}

async function loadProducts() {
  if (!filterParams.value.storeId) {
    products.value = []
    return
  }
  
  isLoading.value = true
  try {
    const result = await productApi.getStoreProducts(filterParams.value.storeId, {
      page: currentPage.value,
      size: pageSize.value,
      status: filterParams.value.status || undefined,
    })
    products.value = result.records
    total.value = result.total
  } catch (e) {
    if (isCancelledError(e)) return
    console.error('加载商品失败:', e)
    showMessage('error', t('merchant.product.loadProductsFailed'))
  } finally {
    isLoading.value = false
  }
}

// 表单操作
function openCreateDialog() {
  editingProduct.value = null
  formMode.value = 'create'
  showFormDialog.value = true
}

function openEditDialog(product: ProductDTO) {
  editingProduct.value = product
  formMode.value = 'edit'
  showFormDialog.value = true
}

function openStockDialog(product: ProductDTO) {
  editingProduct.value = product
  formMode.value = 'stock'
  showFormDialog.value = true
}

function handleFormCancel() {
  showFormDialog.value = false
  editingProduct.value = null
}

async function handleFormSubmit(data: ProductFormData | StockFormData) {
  isProcessing.value = true
  try {
    if (formMode.value === 'create') {
      const formData = data as ProductFormData
      await productApi.createProduct({
        storeId: filterParams.value.storeId,
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        originalPrice: formData.originalPrice,
        stock: formData.stock,
        category: formData.category || undefined,
        image: formData.image || undefined,
        images: formData.images || undefined,
      })
      showMessage('success', t('merchant.product.createSuccess'))
    } else if (formMode.value === 'edit' && editingProduct.value) {
      const formData = data as ProductFormData
      await productApi.updateProduct(editingProduct.value.productId, {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        originalPrice: formData.originalPrice,
        stock: formData.stock,
        category: formData.category || undefined,
        image: formData.image || undefined,
        images: formData.images || undefined,
        sortOrder: formData.sortOrder,
      })
      showMessage('success', t('merchant.product.updateSuccess'))
    } else if (formMode.value === 'stock' && editingProduct.value) {
      const stockData = data as StockFormData
      await productApi.updateProductStock(editingProduct.value.productId, stockData.stock)
      showMessage('success', t('merchant.product.stockUpdated'))
    }
    
    showFormDialog.value = false
    editingProduct.value = null
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || t('merchant.product.operationFailed'))
  } finally {
    isProcessing.value = false
  }
}

// 商品操作
async function handleDeleteProduct(product: ProductDTO) {
  if (!confirm(t('merchant.product.confirmDelete', { name: product.name }))) return
  
  try {
    await productApi.deleteProduct(product.productId)
    showMessage('success', t('merchant.product.deleted'))
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || t('merchant.product.deleteFailed'))
  }
}

async function handleToggleStatus(product: ProductDTO) {
  const newStatus: ProductStatus = product.status === 'ON_SALE' ? 'OFF_SALE' : 'ON_SALE'
  try {
    await productApi.updateProductStatus(product.productId, newStatus)
    showMessage('success', newStatus === 'ON_SALE' ? t('merchant.product.onSale') : t('merchant.product.offSale'))
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || t('merchant.product.operationFailed'))
  }
}

// 分页操作
function handlePageChange(page: number) {
  currentPage.value = page
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

// ============================================================================
// Watchers
// ============================================================================

watch(() => filterParams.value.storeId, () => {
  currentPage.value = 1
  loadProducts()
})

watch(() => filterParams.value.status, () => {
  currentPage.value = 1
  loadProducts()
})

watch(currentPage, () => {
  loadProducts()
})

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
  await loadStores()
  if (filterParams.value.storeId) {
    await loadProducts()
  }
  isLoading.value = false
})
</script>

<template>
  <div class="product-manage-page">
    <MessageAlert
      v-if="message"
      :type="message.type"
      :text="message.text"
      closable-on-click
      @close="clearMessage"
    />

    <section class="page-hero">
      <div class="hero-content">
        <h2>商品管理</h2>
        <p>{{ selectedStoreSummary }}</p>
      </div>
      <div class="hero-stats">
        <span class="stats-value">{{ total }}</span>
        <span class="stats-label">件商品</span>
      </div>
    </section>

    <!-- 顶部工具栏 -->
    <ProductFilter
      v-model="filterParams"
      :stores="stores"
      :can-create="canCreateProduct"
      :total="total"
      @create="openCreateDialog"
    />

    <!-- 商品列表 -->
    <div v-if="!filterParams.storeId" class="empty-state">
      <div class="empty">{{ t('merchant.product.selectStore') }}</div>
    </div>
    <ProductTable
      v-else
      :products="products"
      :loading="isLoading"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @edit="openEditDialog"
      @delete="handleDeleteProduct"
      @toggle-status="handleToggleStatus"
      @update-stock="openStockDialog"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 商品表单对话框 -->
    <ProductForm
      :visible="showFormDialog"
      :product="editingProduct"
      :mode="formMode"
      :stores="stores"
      :selected-store-id="filterParams.storeId"
      :processing="isProcessing"
      @update:visible="showFormDialog = $event"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.product-manage-page {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  height: 100%;
}

.page-hero {
  @include card-base;
  @include flex-between;
  gap: $space-4;
  padding: $space-5;
  border: none;
  background:
    linear-gradient(120deg, rgba(var(--accent-primary-rgb), 0.13) 0%, rgba(var(--accent-primary-rgb), 0.02) 45%, transparent 100%),
    var(--bg-secondary);

  .hero-content {
    @include flex-column;
    gap: $space-1;

    h2 {
      margin: 0;
      font-size: $font-size-2xl;
      font-weight: $font-weight-semibold;
      color: var(--text-primary);
    }

    p {
      margin: 0;
      font-size: $font-size-base;
      color: var(--text-secondary);
    }
  }

  .hero-stats {
    @include flex-column;
    align-items: flex-end;
    min-width: 112px;

    .stats-value {
      font-size: 30px;
      line-height: 1.1;
      font-weight: $font-weight-semibold;
      color: var(--accent-primary);
    }

    .stats-label {
      font-size: $font-size-sm + 1;
      color: var(--text-secondary);
    }
  }
}

// 空状态
.empty-state {
  @include table-container;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty {
  @include table-empty-state;
  font-size: $font-size-base + 1;
}
</style>
