<script setup lang="ts">
/**
 * ProductTable 子组件
 * 
 * 商品列表显示和分页组件
 * 
 * 业务职责：
 * - 显示商品列表（商品信息、价格、库存、状态）
 * - 支持分页
 * - 触发编辑、删除、状态切换事件
 * - 使用 v-memo 优化渲染性能
 * 
 * Requirements: 3.1, 25.1
 */
import { computed } from 'vue'
import type { ProductDTO, ProductStatus } from '@/api/product.api'
import { useFormatters } from '@/composables'

// ============================================================================
// Types
// ============================================================================

export interface ProductTableProps {
  /** 商品列表数据 */
  products: ProductDTO[]
  /** 是否正在加载 */
  loading: boolean
  /** 总记录数 */
  total: number
  /** 当前页码 */
  currentPage: number
  /** 每页数量 */
  pageSize: number
}

export interface ProductTableEmits {
  (e: 'edit', product: ProductDTO): void
  (e: 'delete', product: ProductDTO): void
  (e: 'toggleStatus', product: ProductDTO): void
  (e: 'updateStock', product: ProductDTO): void
  (e: 'pageChange', page: number): void
  (e: 'sizeChange', size: number): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<ProductTableProps>(), {
  products: () => [],
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 10,
})

const emit = defineEmits<ProductTableEmits>()

// ============================================================================
// Composables
// ============================================================================

const { formatCurrency } = useFormatters()

// ============================================================================
// Status Config
// ============================================================================

function getProductStatusConfig(status: ProductStatus) {
  const config: Record<ProductStatus, { label: string; class: string }> = {
    ON_SALE: { label: '在售', class: 'status-on-sale' },
    OFF_SALE: { label: '下架', class: 'status-off-sale' },
    SOLD_OUT: { label: '售罄', class: 'status-sold-out' },
  }
  return config[status] || { label: status, class: '' }
}

// ============================================================================
// Methods
// ============================================================================

function handleEdit(product: ProductDTO) {
  emit('edit', product)
}

function handleDelete(product: ProductDTO) {
  emit('delete', product)
}

function handleToggleStatus(product: ProductDTO) {
  emit('toggleStatus', product)
}

function handleUpdateStock(product: ProductDTO) {
  emit('updateStock', product)
}

function handlePageChange(direction: 'prev' | 'next') {
  if (direction === 'prev' && props.currentPage > 1) {
    emit('pageChange', props.currentPage - 1)
  } else if (direction === 'next' && props.currentPage < Math.ceil(props.total / props.pageSize)) {
    emit('pageChange', props.currentPage + 1)
  }
}

// ============================================================================
// Computed
// ============================================================================

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))
const hasPrev = computed(() => props.currentPage > 1)
const hasNext = computed(() => props.currentPage < totalPages.value)
</script>

<template>
  <div class="product-table-wrapper">
    <!-- 表格容器 -->
    <div class="product-table-container">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">加载中...</div>
      
      <!-- 空状态 -->
      <div v-else-if="products.length === 0" class="empty">暂无商品</div>
      
      <!-- 商品表格 - 使用 v-memo 优化渲染 -->
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
          <tr 
            v-for="product in products" 
            :key="product.productId"
            v-memo="[product.productId, product.name, product.price, product.originalPrice, product.stock, product.status, product.category]"
          >
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
                <span class="current-price">{{ formatCurrency(product.price) }}</span>
                <span v-if="product.originalPrice" class="original-price">
                  {{ formatCurrency(product.originalPrice) }}
                </span>
              </div>
            </td>
            <td>
              <span 
                class="stock-value" 
                :class="{ 'stock-low': product.stock <= 10 }"
                @click="handleUpdateStock(product)"
              >
                {{ product.stock }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', getProductStatusConfig(product.status).class]">
                {{ getProductStatusConfig(product.status).label }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button 
                  v-if="product.status !== 'SOLD_OUT'"
                  class="btn-action"
                  @click="handleToggleStatus(product)"
                >
                  {{ product.status === 'ON_SALE' ? '下架' : '上架' }}
                </button>
                <button class="btn-action" @click="handleEdit(product)">编辑</button>
                <button class="btn-action btn-danger" @click="handleDelete(product)">删除</button>
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
        :disabled="!hasPrev"
        @click="handlePageChange('prev')"
      >上一页</button>
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      <button 
        class="btn-page" 
        :disabled="!hasNext"
        @click="handlePageChange('next')"
      >下一页</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.product-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

// 表格
.product-table-container {
  @include table-container;
}

.loading,
.empty {
  @include table-empty-state;
}

.product-table {
  @include table-base;
}

// 商品信息
.product-info {
  @include flex-center-y;
  gap: $space-3;

  .product-avatar {
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: $gradient-admin;
    @include flex-center;
    font-size: $font-size-xl - 2;
    font-weight: $font-weight-semibold;
    color: white;
    flex-shrink: 0;
  }

  .product-detail {
    @include flex-column;
    gap: $space-1;

    .product-name {
      font-weight: $font-weight-medium;
    }

    .product-category {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }
  }
}

// 价格
.price-info {
  @include flex-column;
  gap: 2px;

  .current-price {
    font-weight: $font-weight-medium;
    color: $color-error;
  }

  .original-price {
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-decoration: line-through;
  }
}

// 库存
.stock-value {
  padding: $space-1 $space-2;
  border-radius: $radius-sm;
  @include clickable;
  @include hover-highlight;

  &.stock-low {
    color: $color-warning;
  }
}

// 状态徽章
.status-badge {
  @include status-badge;

  &.status-on-sale {
    @include status-variant($color-success-muted, $color-success);
  }

  &.status-off-sale {
    @include status-variant(rgba($color-gray-muted, 0.15), $color-gray-muted);
  }

  &.status-sold-out {
    @include status-variant($color-warning-muted, $color-warning);
  }
}

// 操作按钮
.actions {
  @include action-btns;
}

.btn-action {
  @include btn-action;

  &.btn-danger {
    &:hover {
      background: rgba($color-error, 0.2);
      color: $color-error;
    }
  }
}

// 分页
.pagination {
  @include pagination;

  .btn-page {
    @include pagination-btn;
  }

  .page-info {
    @include pagination-info;
  }
}
</style>
