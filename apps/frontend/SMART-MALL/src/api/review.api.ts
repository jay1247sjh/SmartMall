import http from './http'

export interface ReviewReplyDTO {
  replyId: string
  reviewId: string
  merchantId: string
  merchantName: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ProductReviewDTO {
  reviewId: string
  productId: string
  userId: string
  userName: string
  rating: number
  content: string
  createdAt: string
  updatedAt: string
  merchantReply?: ReviewReplyDTO | null
}

export interface ProductRatingSummaryDTO {
  ratingAvg: number
  ratingCount: number
  ratingBreakdown: Record<number, number>
}

export interface ProductReviewPageResponse {
  records: ProductReviewDTO[]
  page: number
  size: number
  total: number
  pages: number
  summary: ProductRatingSummaryDTO
}

export interface UpsertProductReviewRequest {
  rating: number
  content: string
}

export interface UpsertReviewReplyRequest {
  content: string
}

export async function getProductReviews(
  productId: string,
  page = 1,
  size = 10
): Promise<ProductReviewPageResponse> {
  return http.get<ProductReviewPageResponse>(`/public/product/${productId}/reviews`, {
    params: { page, size },
  })
}

export async function upsertProductReview(
  productId: string,
  request: UpsertProductReviewRequest
): Promise<ProductReviewDTO> {
  return http.post<ProductReviewDTO>(`/product/${productId}/review`, request)
}

export async function deleteProductReview(productId: string): Promise<void> {
  return http.delete<void>(`/product/${productId}/review`)
}

export async function upsertReviewReply(
  reviewId: string,
  request: UpsertReviewReplyRequest
): Promise<ReviewReplyDTO> {
  return http.post<ReviewReplyDTO>(`/product/review/${reviewId}/reply`, request)
}

export async function deleteReviewReply(reviewId: string): Promise<void> {
  return http.delete<void>(`/product/review/${reviewId}/reply`)
}

export const reviewApi = {
  getProductReviews,
  upsertProductReview,
  deleteProductReview,
  upsertReviewReply,
  deleteReviewReply,
}

export default reviewApi

