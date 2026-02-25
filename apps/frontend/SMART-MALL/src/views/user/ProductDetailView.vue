<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DashboardLayout, InlinePagination, MessageAlert, NativeSelectField } from '@/components'
import { productApi, reviewApi } from '@/api'
import type { ProductDTO } from '@/api/product.api'
import type { ProductReviewDTO, ProductReviewPageResponse } from '@/api/review.api'
import { useUserStore } from '@/stores'
import { useMessage } from '@/composables'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { message, showMessage, clearMessage } = useMessage()

const loading = ref(false)
const reviewLoading = ref(false)
const submittingReview = ref(false)
const product = ref<ProductDTO | null>(null)
const reviewPage = ref<ProductReviewPageResponse | null>(null)

const pagination = reactive({
  page: 1,
  size: 10,
})

const reviewForm = reactive({
  rating: 5,
  content: '',
})

const replyDrafts = reactive<Record<string, string>>({})
const submittingReplyIds = ref<string[]>([])

const productId = computed(() => String(route.params.productId || ''))
const reviews = computed(() => reviewPage.value?.records || [])
const ratingSummary = computed(() => reviewPage.value?.summary)
const canReview = computed(() => userStore.isUser)
const canReply = computed(() => userStore.isMerchant)

const myReview = computed(() =>
  reviews.value.find(item => item.userId === userStore.userId)
)

const imageList = computed(() => {
  if (!product.value) return []
  if (product.value.images && product.value.images.length > 0) return product.value.images
  if (product.value.image) return [product.value.image]
  return []
})

async function loadProduct() {
  if (!productId.value) return
  loading.value = true
  try {
    product.value = await productApi.getPublicProduct(productId.value)
  } catch (error: any) {
    showMessage('error', error?.message || '加载商品详情失败')
  } finally {
    loading.value = false
  }
}

async function loadReviews() {
  if (!productId.value) return
  reviewLoading.value = true
  try {
    reviewPage.value = await reviewApi.getProductReviews(productId.value, pagination.page, pagination.size)
    if (myReview.value) {
      reviewForm.rating = myReview.value.rating
      reviewForm.content = myReview.value.content
    } else {
      reviewForm.rating = 5
      reviewForm.content = ''
    }
  } catch (error: any) {
    showMessage('error', error?.message || '加载评价失败')
  } finally {
    reviewLoading.value = false
  }
}

async function submitReview() {
  if (!canReview.value) return
  if (!reviewForm.content.trim()) {
    showMessage('error', '请填写评价内容')
    return
  }

  submittingReview.value = true
  try {
    await reviewApi.upsertProductReview(productId.value, {
      rating: reviewForm.rating,
      content: reviewForm.content.trim(),
    })
    showMessage('success', myReview.value ? '评价已更新' : '评价已提交')
    await Promise.all([loadProduct(), loadReviews()])
  } catch (error: any) {
    showMessage('error', error?.message || '提交评价失败')
  } finally {
    submittingReview.value = false
  }
}

async function deleteMyReview() {
  if (!canReview.value) return
  if (!confirm('确定要删除这条评价吗？')) return

  try {
    await reviewApi.deleteProductReview(productId.value)
    showMessage('success', '评价已删除')
    await Promise.all([loadProduct(), loadReviews()])
  } catch (error: any) {
    showMessage('error', error?.message || '删除评价失败')
  }
}

function isReplySubmitting(reviewId: string) {
  return submittingReplyIds.value.includes(reviewId)
}

async function submitReply(review: ProductReviewDTO) {
  if (!canReply.value) return
  const content = (replyDrafts[review.reviewId] || '').trim()
  if (!content) {
    showMessage('error', '请填写回复内容')
    return
  }

  submittingReplyIds.value = [...submittingReplyIds.value, review.reviewId]
  try {
    await reviewApi.upsertReviewReply(review.reviewId, { content })
    showMessage('success', review.merchantReply ? '回复已更新' : '回复已提交')
    replyDrafts[review.reviewId] = ''
    await loadReviews()
  } catch (error: any) {
    showMessage('error', error?.message || '回复失败')
  } finally {
    submittingReplyIds.value = submittingReplyIds.value.filter(id => id !== review.reviewId)
  }
}

async function deleteReply(review: ProductReviewDTO) {
  if (!canReply.value || !review.merchantReply) return
  if (!confirm('确定删除该回复吗？')) return

  submittingReplyIds.value = [...submittingReplyIds.value, review.reviewId]
  try {
    await reviewApi.deleteReviewReply(review.reviewId)
    showMessage('success', '回复已删除')
    await loadReviews()
  } catch (error: any) {
    showMessage('error', error?.message || '删除回复失败')
  } finally {
    submittingReplyIds.value = submittingReplyIds.value.filter(id => id !== review.reviewId)
  }
}

async function loadAll() {
  await Promise.all([loadProduct(), loadReviews()])
}

function handleReviewPageChange(page: number) {
  if (!reviewPage.value) return
  if (page < 1 || page > reviewPage.value.pages || page === pagination.page) return
  pagination.page = page
  loadReviews()
}

watch(productId, () => {
  pagination.page = 1
  loadAll()
})

onMounted(() => {
  loadAll()
})
</script>

<template>
  <DashboardLayout :page-title="product?.name || '商品详情'">
    <div class="product-detail-page">
      <MessageAlert
        v-if="message"
        :type="message.type"
        :text="message.text"
        closable-on-click
        @close="clearMessage"
      />

      <div class="top-actions">
        <button class="btn btn-secondary" @click="router.back()">返回</button>
      </div>

      <section v-if="loading" class="card">加载中...</section>

      <section v-else-if="product" class="card product-card">
        <div class="product-main">
          <div class="gallery" v-if="imageList.length > 0">
            <img :src="imageList[0]" alt="商品主图" class="main-image" />
            <div class="thumb-list" v-if="imageList.length > 1">
              <img v-for="(url, idx) in imageList.slice(1)" :key="`${url}-${idx}`" :src="url" alt="商品图片" class="thumb" />
            </div>
          </div>
          <div class="info">
            <h2>{{ product.name }}</h2>
            <p class="desc">{{ product.description || '暂无描述' }}</p>
            <p class="meta">店铺：{{ product.storeName }}</p>
            <p class="meta">分类：{{ product.category || '未分类' }}</p>
            <p class="price">¥{{ product.price }}</p>
            <p class="rating">
              综合评分：{{ Number(product.ratingAvg || 0).toFixed(1) }} / 5（{{ product.ratingCount || 0 }} 条）
            </p>
          </div>
        </div>
      </section>

      <section class="card">
        <h3>评价与回复</h3>

        <div v-if="canReview" class="review-editor">
          <label>你的评分</label>
          <NativeSelectField
            :model-value="String(reviewForm.rating)"
            class="rating-select"
            @update:model-value="reviewForm.rating = Number($event)"
          >
            <option v-for="n in 5" :key="n" :value="n">{{ n }} 分</option>
          </NativeSelectField>
          <label>你的评价</label>
          <textarea v-model="reviewForm.content" class="textarea" rows="3" placeholder="说说你的真实体验"></textarea>
          <div class="actions">
            <button class="btn btn-primary" :disabled="submittingReview" @click="submitReview">
              {{ submittingReview ? '提交中...' : (myReview ? '更新评价' : '提交评价') }}
            </button>
            <button v-if="myReview" class="btn btn-secondary" :disabled="submittingReview" @click="deleteMyReview">
              删除评价
            </button>
          </div>
        </div>

        <div v-if="ratingSummary" class="summary">
          <p>平均分：{{ Number(ratingSummary.ratingAvg || 0).toFixed(1) }} / 5</p>
          <p>总评价：{{ ratingSummary.ratingCount || 0 }}</p>
        </div>

        <div v-if="reviewLoading" class="empty">加载评价中...</div>
        <div v-else-if="reviews.length === 0" class="empty">暂无评价</div>
        <div v-else class="review-list">
          <article v-for="review in reviews" :key="review.reviewId" class="review-item">
            <header class="review-header">
              <strong>{{ review.userName || review.userId }}</strong>
              <span class="score">{{ review.rating }} / 5</span>
              <span class="time">{{ review.updatedAt || review.createdAt }}</span>
            </header>
            <p class="review-content">{{ review.content }}</p>

            <div v-if="review.merchantReply" class="reply-box">
              <p class="reply-title">商家回复（{{ review.merchantReply.merchantName || review.merchantReply.merchantId }}）</p>
              <p>{{ review.merchantReply.content }}</p>
              <button
                v-if="canReply"
                class="btn-link danger"
                :disabled="isReplySubmitting(review.reviewId)"
                @click="deleteReply(review)"
              >
                删除回复
              </button>
            </div>

            <div v-if="canReply" class="reply-editor">
              <textarea
                v-model="replyDrafts[review.reviewId]"
                class="textarea"
                rows="2"
                :placeholder="review.merchantReply ? '修改回复内容' : '回复该评价'"
              ></textarea>
              <button
                class="btn btn-secondary"
                :disabled="isReplySubmitting(review.reviewId)"
                @click="submitReply(review)"
              >
                {{ isReplySubmitting(review.reviewId) ? '提交中...' : (review.merchantReply ? '更新回复' : '提交回复') }}
              </button>
            </div>
          </article>
        </div>

        <InlinePagination
          v-if="reviewPage && reviewPage.pages > 1"
          :current-page="pagination.page"
          :total-pages="reviewPage.pages"
          :disabled="reviewLoading"
          @change="handleReviewPageChange"
        />
      </section>
    </div>
  </DashboardLayout>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.product-detail-page {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.card {
  @include panel-base;
  padding: $space-5;
}

.top-actions {
  display: flex;
  justify-content: flex-start;
}

.product-main {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: $space-5;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.main-image {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: $radius-md;
}

.thumb-list {
  display: flex;
  gap: $space-2;
}

.thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: $radius-sm;
}

.desc {
  color: var(--text-secondary);
}

.meta {
  margin: $space-1 0;
  color: var(--text-secondary);
}

.price {
  color: var(--accent-primary);
  font-size: 24px;
  font-weight: 600;
}

.rating {
  color: var(--text-primary);
}

.review-editor,
.reply-editor {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;
}

.textarea {
  @include form-control;
}

.rating-select {
  width: 160px;
}

.actions {
  display: flex;
  gap: $space-2;
}

.summary {
  display: flex;
  gap: $space-5;
  margin-bottom: $space-4;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.review-item {
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  padding: $space-3;
}

.review-header {
  display: flex;
  gap: $space-2;
  align-items: center;
  flex-wrap: wrap;
}

.score {
  color: var(--accent-primary);
}

.time {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.review-content {
  margin: $space-2 0;
}

.reply-box {
  border-left: 3px solid var(--accent-primary);
  padding-left: $space-3;
  margin: $space-2 0;
}

.reply-title {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.empty {
  color: var(--text-secondary);
}

.btn {
  @include btn-base;
}

.btn-primary {
  @include btn-primary;
}

.btn-secondary {
  @include btn-secondary;
}

.btn-link {
  border: none;
  background: transparent;
  color: var(--accent-primary);
  cursor: pointer;
  padding: 0;

  &.danger {
    color: var(--danger, #dc2626);
  }
}
</style>
