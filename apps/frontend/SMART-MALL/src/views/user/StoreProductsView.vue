<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DashboardLayout } from '@/components'
import { productApi, userApi } from '@/api'
import type { UserStoreBrief } from '@/api/user.api'
import type { ProductDTO } from '@/api/product.api'
import type { PageResponse } from '@/types/api'
import {
  ElCard,
  ElCol,
  ElRow,
  ElInput,
  ElButton,
  ElSkeleton,
  ElEmpty,
  ElPagination,
  ElTag,
  ElMessage,
} from 'element-plus'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const { t } = useI18n()

const storesLoading = ref(false)
const productsLoading = ref(false)
const stores = ref<UserStoreBrief[]>([])
const products = ref<ProductDTO[]>([])
const selectedStoreId = ref('')
const storeKeyword = ref('')
const productPage = ref<PageResponse<ProductDTO> | null>(null)

const pagination = reactive({
  page: 1,
  size: 12,
})

const filteredStores = computed(() => {
  const keyword = storeKeyword.value.trim().toLowerCase()
  if (!keyword) return stores.value
  return stores.value.filter((store) => {
    const name = store.name?.toLowerCase() || ''
    const category = store.category?.toLowerCase() || ''
    return name.includes(keyword) || category.includes(keyword)
  })
})

const selectedStore = computed(() =>
  stores.value.find(store => store.storeId === selectedStoreId.value) || null
)

async function loadStores() {
  storesLoading.value = true
  try {
    const data = await userApi.getActiveStores(100)
    stores.value = data
    const firstStore = data[0]
    if ((!selectedStoreId.value || !data.some(store => store.storeId === selectedStoreId.value)) && firstStore) {
      selectedStoreId.value = firstStore.storeId
    }
  } catch (error) {
    console.error('Failed to load stores:', error)
    ElMessage.error(t('storeCatalog.loadStoresFailed'))
  } finally {
    storesLoading.value = false
  }
}

async function loadProducts() {
  if (!selectedStoreId.value) {
    products.value = []
    productPage.value = null
    return
  }

  productsLoading.value = true
  try {
    const response = await productApi.getPublicStoreProducts(
      selectedStoreId.value,
      pagination.page,
      pagination.size,
    )
    productPage.value = response
    products.value = response.records || []
  } catch (error) {
    console.error('Failed to load products:', error)
    ElMessage.error(t('storeCatalog.loadProductsFailed'))
  } finally {
    productsLoading.value = false
  }
}

async function selectStore(storeId: string) {
  if (selectedStoreId.value === storeId) return
  selectedStoreId.value = storeId
  pagination.page = 1
  await loadProducts()
}

async function handlePageChange(page: number) {
  pagination.page = page
  await loadProducts()
}

function openProductDetail(productId: string) {
  router.push(`/mall/product/${productId}`)
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

onMounted(async () => {
  await loadStores()
  await loadProducts()
})
</script>

<template>
  <DashboardLayout :page-title="t('storeCatalog.title')">
    <section class="store-catalog-page">
      <ElRow :gutter="16">
        <ElCol :xs="24" :lg="8">
          <ElCard class="store-list-card" shadow="hover">
            <template #header>
              <div class="section-header">
                <h3>{{ t('storeCatalog.storeListTitle') }}</h3>
              </div>
            </template>

            <ElInput
              v-model="storeKeyword"
              :placeholder="t('storeCatalog.storeSearchPlaceholder')"
              :prefix-icon="Search"
              clearable
            />

            <ElSkeleton v-if="storesLoading" animated :rows="4" class="mt-4" />

            <ElEmpty
              v-else-if="filteredStores.length === 0"
              :description="t('storeCatalog.noStores')"
              :image-size="68"
              class="mt-4"
            />

            <div v-else class="store-list mt-4">
              <button
                v-for="store in filteredStores"
                :key="store.storeId"
                class="store-item"
                :class="{ active: store.storeId === selectedStoreId }"
                @click="selectStore(store.storeId)"
              >
                <div class="store-main">{{ store.name }}</div>
                <div class="store-sub">{{ store.category || t('storeCatalog.uncategorized') }}</div>
              </button>
            </div>
          </ElCard>
        </ElCol>

        <ElCol :xs="24" :lg="16">
          <ElCard class="product-list-card" shadow="hover">
            <template #header>
              <div class="section-header section-header--split">
                <h3>{{ selectedStore?.name || t('storeCatalog.selectStore') }}</h3>
                <ElTag type="info" effect="plain">
                  {{ t('storeCatalog.productCount', { count: productPage?.total || 0 }) }}
                </ElTag>
              </div>
            </template>

            <ElSkeleton v-if="productsLoading" animated :rows="5" />

            <ElEmpty
              v-else-if="products.length === 0"
              :description="t('storeCatalog.noProducts')"
              :image-size="80"
            />

            <ElRow v-else :gutter="12" class="product-grid">
              <ElCol v-for="product in products" :key="product.productId" :xs="24" :sm="12" :xl="8">
                <article class="product-item">
                  <img
                    v-if="product.image"
                    :src="product.image"
                    :alt="product.name"
                    class="product-cover"
                  />
                  <div v-else class="product-cover product-cover--placeholder">{{ t('storeCatalog.noImage') }}</div>

                  <div class="product-info">
                    <h4 class="product-name">{{ product.name }}</h4>
                    <p class="product-category">{{ product.category || t('storeCatalog.uncategorized') }}</p>
                    <p class="product-price">¥{{ formatPrice(product.price) }}</p>
                    <p class="product-rating">
                      {{ t('storeCatalog.productRating', { score: Number(product.ratingAvg || 0).toFixed(1), count: product.ratingCount || 0 }) }}
                    </p>
                    <ElButton type="primary" link @click="openProductDetail(product.productId)">
                      {{ t('storeCatalog.viewDetail') }}
                    </ElButton>
                  </div>
                </article>
              </ElCol>
            </ElRow>

            <div v-if="productPage && productPage.pages > 1" class="pagination-wrap">
              <ElPagination
                layout="prev, pager, next"
                :page-size="pagination.size"
                :current-page="pagination.page"
                :total="productPage.total"
                @current-change="handlePageChange"
              />
            </div>
          </ElCard>
        </ElCol>
      </ElRow>
    </section>
  </DashboardLayout>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;

.store-catalog-page {
  .store-list-card,
  .product-list-card {
    border-radius: $radius-lg;
    border: 1px solid var(--border-subtle);
    background: rgba(var(--bg-secondary-rgb), 0.88);
  }

  .section-header {
    h3 {
      margin: 0;
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      color: var(--text-primary);
    }
  }

  .section-header--split {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
  }

  .mt-4 {
    margin-top: $space-4;
  }

  .store-list {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    max-height: 540px;
    overflow-y: auto;
  }

  .store-item {
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    background: rgba(var(--bg-primary-rgb), 0.65);
    text-align: left;
    padding: $space-3;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: rgba(var(--accent-primary-rgb), 0.35);
      transform: translateY(-1px);
    }

    &.active {
      border-color: rgba(var(--accent-primary-rgb), 0.55);
      background: rgba(var(--accent-primary-rgb), 0.08);
    }

    .store-main {
      font-size: $font-size-base;
      color: var(--text-primary);
      font-weight: $font-weight-medium;
    }

    .store-sub {
      margin-top: $space-1;
      font-size: $font-size-sm;
      color: var(--text-secondary);
    }
  }

  .product-grid {
    row-gap: $space-3;
  }

  .product-item {
    height: 100%;
    border: 1px solid var(--border-subtle);
    border-radius: $radius-md;
    overflow: hidden;
    background: rgba(var(--bg-primary-rgb), 0.7);
    display: flex;
    flex-direction: column;
  }

  .product-cover {
    width: 100%;
    height: 150px;
    object-fit: cover;
    background: rgba(var(--bg-tertiary-rgb), 0.8);
  }

  .product-cover--placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: $font-size-sm;
  }

  .product-info {
    padding: $space-3;
  }

  .product-name {
    margin: 0;
    font-size: $font-size-base;
    color: var(--text-primary);
  }

  .product-category {
    margin: $space-1 0 0;
    color: var(--text-secondary);
    font-size: $font-size-sm;
  }

  .product-price {
    margin: $space-2 0 0;
    color: var(--accent-primary);
    font-weight: $font-weight-medium;
    font-size: $font-size-lg;
  }

  .product-rating {
    margin: $space-1 0 $space-2;
    color: var(--text-secondary);
    font-size: $font-size-sm;
  }

  .pagination-wrap {
    margin-top: $space-4;
    display: flex;
    justify-content: center;
  }
}
</style>
