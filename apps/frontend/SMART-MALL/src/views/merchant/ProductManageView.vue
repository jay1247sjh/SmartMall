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
 */
import { ref, computed, onMounted, watch } from 'vue'
import { storeApi, productApi } from '@/api'
import type { StoreDTO } from '@/api/store.api'
import type { ProductDTO, CreateProductRequest, UpdateProductRequest, ProductStatus } from '@/api/product.api'

// ============================================================================
// State
// ============================================================================

const isLoading = ref(true)
const stores = ref<StoreDTO[]>([])
const selectedStoreId = ref<string>('')
const products = ref<ProductDTO[]>([])
const statusFilter = ref<ProductStatus | ''>('')

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showStockDialog = ref(false)
const editingProduct = ref<ProductDTO | null>(null)

// 表单
const createForm = ref<CreateProductRequest>({
  storeId: '',
  name: '',
  description: '',
  price: 0,
  originalPrice: undefined,
  stock: 0,
  category: '',
  image: '',
})

const editForm = ref<UpdateProductRequest>({})
const stockForm = ref({ stock: 0 })

// 操作状态
const isProcessing = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// ============================================================================
// Computed
// ============================================================================

const categories = ['食品', '饮品', '服装', '配饰', '电子', '日用', '其他']

const selectedStore = computed(() => 
  stores.value.find(s => s.storeId === selectedStoreId.value)
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
      selectedStoreId.value = activeStore.storeId
    } else if (stores.value.length > 0) {
      selectedStoreId.value = stores.value[0].storeId
    }
  } catch (e) {
    console.error('加载店铺失败:', e)
    showMessage('error', '加载店铺失败')
  }
}

async function loadProducts() {
  if (!selectedStoreId.value) {
    products.value = []
    return
  }
  
  isLoading.value = true
  try {
    const result = await productApi.getStoreProducts(selectedStoreId.value, {
      page: currentPage.value,
      size: pageSize.value,
      status: statusFilter.value || undefined,
    })
    products.value = result.records
    total.value = result.total
  } catch (e) {
    console.error('加载商品失败:', e)
    showMessage('error', '加载商品失败')
  } finally {
    isLoading.value = false
  }
}

function openCreateDialog() {
  createForm.value = {
    storeId: selectedStoreId.value,
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    stock: 0,
    category: '',
    image: '',
  }
  showCreateDialog.value = true
}

async function createProduct() {
  if (!createForm.value.name || createForm.value.price < 0 || createForm.value.stock < 0) {
    showMessage('error', '请正确填写商品信息')
    return
  }
  
  isProcessing.value = true
  try {
    await productApi.createProduct(createForm.value)
    showCreateDialog.value = false
    showMessage('success', '商品创建成功')
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || '创建失败')
  } finally {
    isProcessing.value = false
  }
}

function openEditDialog(product: ProductDTO) {
  editingProduct.value = product
  editForm.value = {
    name: product.name,
    description: product.description || '',
    price: product.price,
    originalPrice: product.originalPrice || undefined,
    stock: product.stock,
    category: product.category || '',
    image: product.image || '',
    sortOrder: product.sortOrder,
  }
  showEditDialog.value = true
}

async function updateProduct() {
  if (!editingProduct.value) return
  
  isProcessing.value = true
  try {
    await productApi.updateProduct(editingProduct.value.productId, editForm.value)
    showEditDialog.value = false
    showMessage('success', '商品更新成功')
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || '更新失败')
  } finally {
    isProcessing.value = false
  }
}

async function deleteProduct(product: ProductDTO) {
  if (!confirm(`确定要删除商品"${product.name}"吗？`)) return
  
  try {
    await productApi.deleteProduct(product.productId)
    showMessage('success', '商品已删除')
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || '删除失败')
  }
}

async function toggleStatus(product: ProductDTO) {
  const newStatus: ProductStatus = product.status === 'ON_SALE' ? 'OFF_SALE' : 'ON_SALE'
  try {
    await productApi.updateProductStatus(product.productId, newStatus)
    showMessage('success', newStatus === 'ON_SALE' ? '商品已上架' : '商品已下架')
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || '操作失败')
  }
}

function openStockDialog(product: ProductDTO) {
  editingProduct.value = product
  stockForm.value = { stock: product.stock }
  showStockDialog.value = true
}

async function updateStock() {
  if (!editingProduct.value || stockForm.value.stock < 0) return
  
  isProcessing.value = true
  try {
    await productApi.updateProductStock(editingProduct.value.productId, stockForm.value.stock)
    showStockDialog.value = false
    showMessage('success', '库存已更新')
    loadProducts()
  } catch (e: any) {
    showMessage('error', e.message || '更新失败')
  } finally {
    isProcessing.value = false
  }
}

function showMessage(type: 'success' | 'error', text: string) {
  message.value = { type, text }
  setTimeout(() => { message.value = null }, 3000)
}

function getStatusClass(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    ON_SALE: 'status-on-sale',
    OFF_SALE: 'status-off-sale',
    SOLD_OUT: 'status-sold-out',
  }
  return map[status] || ''
}

function getStatusText(status: ProductStatus): string {
  const map: Record<ProductStatus, string> = {
    ON_SALE: '在售',
    OFF_SALE: '下架',
    SOLD_OUT: '售罄',
  }
  return map[status] || status
}

function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

// ============================================================================
// Watchers
// ============================================================================

watch(selectedStoreId, () => {
  currentPage.value = 1
  loadProducts()
})

watch([statusFilter, currentPage], () => {
  loadProducts()
})

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(async () => {
  await loadStores()
  if (selectedStoreId.value) {
    await loadProducts()
  }
  isLoading.value = false
})
</script>


<template>
  <div class="product-manage-page">
    <!-- 消息提示 -->
    <div v-if="message" :class="['message', message.type]">
      <span>{{ message.type === 'success' ? '✅' : '❌' }}</span>
      {{ message.text }}
    </div>

    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <select v-model="selectedStoreId" class="select store-select">
          <option value="">选择店铺</option>
          <option v-for="store in stores" :key="store.storeId" :value="store.storeId">
            {{ store.name }} ({{ store.status === 'ACTIVE' ? '营业中' : '未营业' }})
          </option>
        </select>
        <select v-model="statusFilter" class="select">
          <option value="">全部状态</option>
          <option value="ON_SALE">在售</option>
          <option value="OFF_SALE">下架</option>
          <option value="SOLD_OUT">售罄</option>
        </select>
      </div>
      <button 
        v-if="canCreateProduct"
        class="btn btn-primary" 
        @click="openCreateDialog"
      >
        + 添加商品
      </button>
    </div>

    <!-- 商品列表 -->
    <div class="product-table-container">
      <div v-if="isLoading" class="loading">加载中...</div>
      <div v-else-if="!selectedStoreId" class="empty">请先选择店铺</div>
      <div v-else-if="products.length === 0" class="empty">暂无商品</div>
      <table v-else class="product-table">
        <thead>
          <tr>
            <th>商品信息</th>
            <th>价格</th>
            <th>库存</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.productId">
            <td>
              <div class="product-info">
                <div class="product-avatar">{{ product.name.charAt(0) }}</div>
                <div class="product-detail">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-category">{{ product.category || '未分类' }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="price-info">
                <span class="current-price">{{ formatPrice(product.price) }}</span>
                <span v-if="product.originalPrice" class="original-price">
                  {{ formatPrice(product.originalPrice) }}
                </span>
              </div>
            </td>
            <td>
              <span 
                class="stock-value" 
                :class="{ 'stock-low': product.stock <= 10 }"
                @click="openStockDialog(product)"
              >
                {{ product.stock }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(product.status)]">
                {{ getStatusText(product.status) }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button 
                  v-if="product.status !== 'SOLD_OUT'"
                  class="btn-action"
                  @click="toggleStatus(product)"
                >
                  {{ product.status === 'ON_SALE' ? '下架' : '上架' }}
                </button>
                <button class="btn-action" @click="openEditDialog(product)">编辑</button>
                <button class="btn-action btn-danger" @click="deleteProduct(product)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <button 
        class="btn-page" 
        :disabled="currentPage <= 1"
        @click="currentPage--"
      >上一页</button>
      <span class="page-info">{{ currentPage }} / {{ Math.ceil(total / pageSize) }}</span>
      <button 
        class="btn-page" 
        :disabled="currentPage >= Math.ceil(total / pageSize)"
        @click="currentPage++"
      >下一页</button>
    </div>


    <!-- 创建商品对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>添加商品</h3>
          <button class="dialog-close" @click="showCreateDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label>商品名称 *</label>
            <input v-model="createForm.name" type="text" class="input" placeholder="请输入商品名称" />
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>价格 *</label>
              <input v-model.number="createForm.price" type="number" min="0" step="0.01" class="input" />
            </div>
            <div class="form-item">
              <label>原价</label>
              <input v-model.number="createForm.originalPrice" type="number" min="0" step="0.01" class="input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>库存 *</label>
              <input v-model.number="createForm.stock" type="number" min="0" class="input" />
            </div>
            <div class="form-item">
              <label>分类</label>
              <select v-model="createForm.category" class="select">
                <option value="">请选择</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
          <div class="form-item">
            <label>商品描述</label>
            <textarea v-model="createForm.description" class="textarea" rows="3" placeholder="请输入商品描述"></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn btn-primary" :disabled="isProcessing" @click="createProduct">
            {{ isProcessing ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑商品对话框 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click.self="showEditDialog = false">
      <div class="dialog">
        <div class="dialog-header">
          <h3>编辑商品</h3>
          <button class="dialog-close" @click="showEditDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label>商品名称</label>
            <input v-model="editForm.name" type="text" class="input" />
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>价格</label>
              <input v-model.number="editForm.price" type="number" min="0" step="0.01" class="input" />
            </div>
            <div class="form-item">
              <label>原价</label>
              <input v-model.number="editForm.originalPrice" type="number" min="0" step="0.01" class="input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>库存</label>
              <input v-model.number="editForm.stock" type="number" min="0" class="input" />
            </div>
            <div class="form-item">
              <label>分类</label>
              <select v-model="editForm.category" class="select">
                <option value="">请选择</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
          <div class="form-item">
            <label>商品描述</label>
            <textarea v-model="editForm.description" class="textarea" rows="3"></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showEditDialog = false">取消</button>
          <button class="btn btn-primary" :disabled="isProcessing" @click="updateProduct">
            {{ isProcessing ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 库存编辑对话框 -->
    <div v-if="showStockDialog" class="dialog-overlay" @click.self="showStockDialog = false">
      <div class="dialog dialog-sm">
        <div class="dialog-header">
          <h3>修改库存</h3>
          <button class="dialog-close" @click="showStockDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label>库存数量</label>
            <input v-model.number="stockForm.stock" type="number" min="0" class="input" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showStockDialog = false">取消</button>
          <button class="btn btn-primary" :disabled="isProcessing" @click="updateStock">
            {{ isProcessing ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.product-manage-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

/* Message */
.message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.message.success {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.2);
}

.message.error {
  background: rgba(242, 139, 130, 0.1);
  color: #f28b82;
  border: 1px solid rgba(242, 139, 130, 0.2);
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.store-select {
  min-width: 200px;
}

/* Table */
.product-table-container {
  flex: 1;
  background: #111113;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #5f6368;
  font-size: 14px;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
}

.product-table th,
.product-table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.product-table th {
  font-size: 13px;
  font-weight: 500;
  color: #9aa0a6;
  background: rgba(255, 255, 255, 0.02);
}

.product-table td {
  font-size: 14px;
  color: #e8eaed;
}

.product-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Product Info */
.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.product-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  font-weight: 500;
}

.product-category {
  font-size: 12px;
  color: #9aa0a6;
}

/* Price */
.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.current-price {
  font-weight: 500;
  color: #f28b82;
}

.original-price {
  font-size: 12px;
  color: #5f6368;
  text-decoration: line-through;
}

/* Stock */
.stock-value {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

.stock-value:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stock-value.stock-low {
  color: #fbbf24;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-on-sale {
  background: rgba(52, 211, 153, 0.15);
  color: #34d399;
}

.status-badge.status-off-sale {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
}

.status-badge.status-sold-out {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

/* Actions */
.actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #9aa0a6;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e8eaed;
}

.btn-action.btn-danger:hover {
  background: rgba(242, 139, 130, 0.2);
  color: #f28b82;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.btn-page {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  color: #9aa0a6;
  border: none;
  cursor: pointer;
}

.btn-page:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #e8eaed;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #9aa0a6;
}

/* Form Elements */
.input,
.select,
.textarea {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: #e8eaed;
  font-family: inherit;
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: #60a5fa;
}

.textarea {
  resize: vertical;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: #9aa0a6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
}

.btn-primary {
  background: #60a5fa;
  color: #0a0a0a;
}

.btn-primary:hover:not(:disabled) {
  background: #93c5fd;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #1a1a1c;
  border-radius: 12px;
  width: 520px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog.dialog-sm {
  width: 360px;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #e8eaed;
}

.dialog-close {
  background: none;
  border: none;
  color: #9aa0a6;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.dialog-close:hover {
  color: #e8eaed;
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: #9aa0a6;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
</style>
