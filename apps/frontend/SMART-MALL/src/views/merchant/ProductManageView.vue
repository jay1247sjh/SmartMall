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
import { storeApi, productApi } from '@/api'
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

// ============================================================================
// Computed
// ============================================================================

const selectedStore = computed(() => 
  stores.value.find(s => s.storeId === filterParams.value.storeId)
)

const canCreateProduct = computed(() => 
  selectedStore.value?.status === 'ACTIVE'
)

// ============================================================================
// Methods
// ============================================================================

async function loadStores() {
  try {
    stores.value = await storeApi.getMyStores()
    // 默认选择第一个激活的店铺
    const activeStore = stores.value.find(s => s.status === 'ACTIVE')
    if (activeStore) {
      filterParams.value.storeId = activeStore.storeId
    } else if (stores.value.length > 0) {
      filterParams.value.storeId = stores.value[0].storeId
    }
  } catch (e) {
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
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', message.type]" @click="clearMessage">
      <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
      {{ message.text }}
    </div>

    <!-- 顶部工具栏 -->
    <ProductFilter
      v-model="filterParams"
      :stores="stores"
      :can-create="canCreateProduct"
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

// 消息提示
.message {
  @include message-alert;
  cursor: pointer;
}

// 空状态
.empty-state {
  @include table-container;
}

.empty {
  @include table-empty-state;
}
</style>
