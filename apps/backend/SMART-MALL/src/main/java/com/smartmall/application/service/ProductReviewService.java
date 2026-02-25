package com.smartmall.application.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.smartmall.common.exception.BusinessException;
import com.smartmall.common.response.ResultCode;
import com.smartmall.common.util.IdGenerator;
import com.smartmall.common.util.ValidationUtils;
import com.smartmall.domain.entity.Product;
import com.smartmall.domain.entity.ProductReview;
import com.smartmall.domain.entity.ProductReviewReply;
import com.smartmall.domain.entity.Store;
import com.smartmall.domain.entity.User;
import com.smartmall.domain.enums.ProductStatus;
import com.smartmall.domain.enums.StoreStatus;
import com.smartmall.infrastructure.mapper.ProductMapper;
import com.smartmall.infrastructure.mapper.ProductReviewMapper;
import com.smartmall.infrastructure.mapper.ProductReviewReplyMapper;
import com.smartmall.infrastructure.mapper.StoreMapper;
import com.smartmall.infrastructure.mapper.UserMapper;
import com.smartmall.infrastructure.service.RagSyncEventPublisher;
import com.smartmall.interfaces.dto.product.ProductRatingAggregateRow;
import com.smartmall.interfaces.dto.product.ProductRatingSummaryDTO;
import com.smartmall.interfaces.dto.product.ProductReviewDTO;
import com.smartmall.interfaces.dto.product.ProductReviewPageResponse;
import com.smartmall.interfaces.dto.product.ProductReviewQueryRow;
import com.smartmall.interfaces.dto.product.ReviewReplyDTO;
import com.smartmall.interfaces.dto.product.UpsertProductReviewRequest;
import com.smartmall.interfaces.dto.product.UpsertReviewReplyRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 商品评价服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductMapper productMapper;
    private final ProductReviewMapper productReviewMapper;
    private final ProductReviewReplyMapper productReviewReplyMapper;
    private final StoreMapper storeMapper;
    private final UserMapper userMapper;
    private final RagSyncEventPublisher ragSyncEventPublisher;

    /**
     * 用户创建或更新评价（一人一商品一条）
     */
    @Transactional
    public ProductReviewDTO upsertReview(String userId, String productId, UpsertProductReviewRequest request) {
        Product product = requireReviewableProduct(productId);
        ProductReview review = productReviewMapper.selectByProductIdAndUserId(productId, userId);
        boolean created = false;

        if (review == null) {
            created = true;
            review = new ProductReview();
            review.setReviewId(IdGenerator.nextId());
            review.setProductId(product.getProductId());
            review.setStoreId(product.getStoreId());
            review.setUserId(userId);
            review.setRating(request.getRating());
            review.setContent(request.getContent());
            productReviewMapper.insert(review);
        } else {
            review.setRating(request.getRating());
            review.setContent(request.getContent());
            productReviewMapper.updateById(review);
        }

        ProductReviewReply reply = productReviewReplyMapper.selectByReviewId(review.getReviewId());
        ProductRatingSummaryDTO summary = refreshProductRatingSummary(productId);
        publishReviewUpsertEvent(product, review, reply, created ? "create" : "update");
        publishProductUpsertEvent(product, summary);

        User user = userMapper.selectById(userId);
        ProductReviewDTO dto = buildReviewDTO(review);
        dto.setUserName(user != null ? user.getUsername() : userId);
        if (reply != null) {
            dto.setMerchantReply(buildReplyDTO(reply));
        }
        return dto;
    }

    /**
     * 用户删除自己的评价
     */
    @Transactional
    public void deleteReview(String userId, String productId) {
        Product product = requireReviewableProduct(productId);
        ProductReview review = productReviewMapper.selectByProductIdAndUserId(productId, userId);
        if (review == null) {
            throw new BusinessException(ResultCode.PRODUCT_REVIEW_NOT_FOUND);
        }

        ProductReviewReply reply = productReviewReplyMapper.selectByReviewId(review.getReviewId());
        if (reply != null) {
            productReviewReplyMapper.deleteById(reply.getReplyId());
        }
        productReviewMapper.deleteById(review.getReviewId());

        ProductRatingSummaryDTO summary = refreshProductRatingSummary(productId);
        publishReviewDeleteEvent(review);
        publishProductUpsertEvent(product, summary);
    }

    /**
     * 商家创建或更新回复（一条评价仅一条回复）
     */
    @Transactional
    public ReviewReplyDTO upsertReply(String merchantId, String reviewId, UpsertReviewReplyRequest request) {
        ProductReview review = requireReview(reviewId);
        Store store = storeMapper.selectById(review.getStoreId());
        ValidationUtils.validateStoreOwnership(store, merchantId);

        ProductReviewReply reply = productReviewReplyMapper.selectByReviewId(reviewId);
        if (reply == null) {
            reply = new ProductReviewReply();
            reply.setReplyId(IdGenerator.nextId());
            reply.setReviewId(reviewId);
            reply.setMerchantId(merchantId);
            reply.setContent(request.getContent());
            productReviewReplyMapper.insert(reply);
        } else {
            if (!merchantId.equals(reply.getMerchantId())) {
                throw new BusinessException(ResultCode.PRODUCT_REVIEW_REPLY_NOT_OWNER);
            }
            reply.setContent(request.getContent());
            productReviewReplyMapper.updateById(reply);
        }

        Product product = productMapper.selectById(review.getProductId());
        publishReviewUpsertEvent(product, review, reply, "update");
        return buildReplyDTO(reply);
    }

    /**
     * 商家删除回复
     */
    @Transactional
    public void deleteReply(String merchantId, String reviewId) {
        ProductReview review = requireReview(reviewId);
        Store store = storeMapper.selectById(review.getStoreId());
        ValidationUtils.validateStoreOwnership(store, merchantId);

        ProductReviewReply reply = productReviewReplyMapper.selectByReviewId(reviewId);
        if (reply == null) {
            throw new BusinessException(ResultCode.PRODUCT_REVIEW_REPLY_NOT_FOUND);
        }
        if (!merchantId.equals(reply.getMerchantId())) {
            throw new BusinessException(ResultCode.PRODUCT_REVIEW_REPLY_NOT_OWNER);
        }

        productReviewReplyMapper.deleteById(reply.getReplyId());
        Product product = productMapper.selectById(review.getProductId());
        publishReviewUpsertEvent(product, review, null, "update");
    }

    /**
     * 查询商品评价（公开端）
     */
    public ProductReviewPageResponse getProductReviews(String productId, int page, int size) {
        requireReviewableProduct(productId);

        Page<ProductReviewQueryRow> pageParam = new Page<>(page, size);
        IPage<ProductReviewQueryRow> rowPage = productReviewMapper.selectPageByProductId(pageParam, productId);

        ProductReviewPageResponse response = new ProductReviewPageResponse();
        response.setRecords(rowPage.getRecords().stream().map(this::buildReviewDTO).toList());
        response.setPage(rowPage.getCurrent());
        response.setSize(rowPage.getSize());
        response.setTotal(rowPage.getTotal());
        response.setPages(rowPage.getPages());
        response.setSummary(getProductRatingSummary(productId));
        return response;
    }

    private Product requireReviewableProduct(String productId) {
        Product product = productMapper.selectById(productId);
        product = ValidationUtils.requireProductExists(product);
        if (product.getStatus() == ProductStatus.OFF_SALE) {
            throw new BusinessException(ResultCode.PRODUCT_REVIEW_NOT_ALLOWED);
        }
        Store store = storeMapper.selectById(product.getStoreId());
        if (store == null || store.getStatus() != StoreStatus.ACTIVE) {
            throw new BusinessException(ResultCode.PRODUCT_REVIEW_NOT_ALLOWED);
        }
        return product;
    }

    private ProductReview requireReview(String reviewId) {
        ProductReview review = productReviewMapper.selectById(reviewId);
        if (review == null || Boolean.TRUE.equals(review.getIsDeleted())) {
            throw new BusinessException(ResultCode.PRODUCT_REVIEW_NOT_FOUND);
        }
        return review;
    }

    private ProductRatingSummaryDTO refreshProductRatingSummary(String productId) {
        ProductRatingSummaryDTO summary = getProductRatingSummary(productId);
        productMapper.updateRatingSummary(productId, summary.getRatingAvg(), summary.getRatingCount());
        return summary;
    }

    private ProductRatingSummaryDTO getProductRatingSummary(String productId) {
        ProductRatingAggregateRow aggregate = productReviewMapper.getRatingAggregate(productId);
        ProductRatingSummaryDTO summary = new ProductRatingSummaryDTO();
        summary.setRatingAvg(aggregate != null && aggregate.getRatingAvg() != null ? aggregate.getRatingAvg() : BigDecimal.ZERO);
        summary.setRatingCount(aggregate != null && aggregate.getRatingCount() != null ? aggregate.getRatingCount() : 0);

        Map<Integer, Long> breakdown = new LinkedHashMap<>();
        for (int rating = 5; rating >= 1; rating--) {
            breakdown.put(rating, productReviewMapper.countByProductIdAndRating(productId, rating));
        }
        summary.setRatingBreakdown(breakdown);
        return summary;
    }

    private ProductReviewDTO buildReviewDTO(ProductReview review) {
        ProductReviewDTO dto = new ProductReviewDTO();
        dto.setReviewId(review.getReviewId());
        dto.setProductId(review.getProductId());
        dto.setUserId(review.getUserId());
        dto.setRating(review.getRating());
        dto.setContent(review.getContent());
        dto.setCreatedAt(review.getCreateTime());
        dto.setUpdatedAt(review.getUpdateTime());
        return dto;
    }

    private ProductReviewDTO buildReviewDTO(ProductReviewQueryRow row) {
        ProductReviewDTO dto = new ProductReviewDTO();
        dto.setReviewId(row.getReviewId());
        dto.setProductId(row.getProductId());
        dto.setUserId(row.getUserId());
        dto.setUserName(row.getUserName() != null ? row.getUserName() : row.getUserId());
        dto.setRating(row.getRating());
        dto.setContent(row.getContent());
        dto.setCreatedAt(row.getReviewCreatedAt());
        dto.setUpdatedAt(row.getReviewUpdatedAt());

        if (row.getReplyId() != null) {
            ReviewReplyDTO replyDTO = new ReviewReplyDTO();
            replyDTO.setReplyId(row.getReplyId());
            replyDTO.setReviewId(row.getReviewId());
            replyDTO.setMerchantId(row.getMerchantId());
            replyDTO.setMerchantName(row.getMerchantName() != null ? row.getMerchantName() : row.getMerchantId());
            replyDTO.setContent(row.getReplyContent());
            replyDTO.setCreatedAt(row.getReplyCreatedAt());
            replyDTO.setUpdatedAt(row.getReplyUpdatedAt());
            dto.setMerchantReply(replyDTO);
        }
        return dto;
    }

    private ReviewReplyDTO buildReplyDTO(ProductReviewReply reply) {
        User merchant = userMapper.selectById(reply.getMerchantId());
        ReviewReplyDTO dto = new ReviewReplyDTO();
        dto.setReplyId(reply.getReplyId());
        dto.setReviewId(reply.getReviewId());
        dto.setMerchantId(reply.getMerchantId());
        dto.setMerchantName(merchant != null ? merchant.getUsername() : reply.getMerchantId());
        dto.setContent(reply.getContent());
        dto.setCreatedAt(reply.getCreateTime());
        dto.setUpdatedAt(reply.getUpdateTime());
        return dto;
    }

    private void publishReviewUpsertEvent(Product product, ProductReview review, ProductReviewReply reply, String operation) {
        if (product == null) {
            return;
        }
        Store store = storeMapper.selectById(product.getStoreId());
        Map<String, Object> payload = new HashMap<>();
        payload.put("review_id", review.getReviewId());
        payload.put("product_id", product.getProductId());
        payload.put("product_name", product.getName());
        payload.put("store_id", product.getStoreId());
        payload.put("store_name", store != null ? store.getName() : "");
        payload.put("rating", review.getRating());
        payload.put("content", review.getContent());
        payload.put("reply_content", reply != null ? reply.getContent() : "");
        payload.put("updated_at", Instant.now().getEpochSecond());
        ragSyncEventPublisher.publishAsync("review", operation, review.getReviewId(), payload);
    }

    private void publishReviewDeleteEvent(ProductReview review) {
        ragSyncEventPublisher.publishAsync("review", "delete", review.getReviewId(), Map.of());
    }

    private void publishProductUpsertEvent(Product product, ProductRatingSummaryDTO summary) {
        Product refreshed = productMapper.selectById(product.getProductId());
        if (refreshed == null) {
            return;
        }
        Store store = storeMapper.selectById(refreshed.getStoreId());

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", refreshed.getProductId());
        payload.put("name", refreshed.getName());
        payload.put("description", refreshed.getDescription() == null ? "" : refreshed.getDescription());
        payload.put("category", refreshed.getCategory() == null ? "" : refreshed.getCategory());
        payload.put("brand", "");
        payload.put("price", refreshed.getPrice() == null ? 0 : refreshed.getPrice().doubleValue());
        payload.put("store_id", refreshed.getStoreId());
        payload.put("store_name", store != null ? store.getName() : "");
        payload.put("image_url", refreshed.getImage() == null ? "" : refreshed.getImage());
        payload.put("rating", summary.getRatingAvg() == null ? 0 : summary.getRatingAvg().doubleValue());
        payload.put("stock", refreshed.getStock() == null ? 0 : refreshed.getStock());
        payload.put("tags", "[]");
        payload.put("updated_at", Instant.now().getEpochSecond());
        ragSyncEventPublisher.publishAsync("product", "update", refreshed.getProductId(), payload);
    }
}
