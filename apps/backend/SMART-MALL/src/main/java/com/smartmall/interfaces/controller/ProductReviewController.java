package com.smartmall.interfaces.controller;

import com.smartmall.application.service.ProductReviewService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.product.ProductReviewDTO;
import com.smartmall.interfaces.dto.product.ReviewReplyDTO;
import com.smartmall.interfaces.dto.product.UpsertProductReviewRequest;
import com.smartmall.interfaces.dto.product.UpsertReviewReplyRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商品评价控制器（用户与商家）
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/product")
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    /**
     * 用户创建或更新评价
     */
    @PostMapping("/{productId}/review")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<ProductReviewDTO> upsertReview(
            @PathVariable String productId,
            @Valid @RequestBody UpsertProductReviewRequest request,
            Authentication authentication) {
        String userId = authentication.getName();
        ProductReviewDTO result = productReviewService.upsertReview(userId, productId, request);
        return ApiResponse.success(result);
    }

    /**
     * 用户删除自己的评价
     */
    @DeleteMapping("/{productId}/review")
    @PreAuthorize("hasRole('USER')")
    public ApiResponse<Void> deleteReview(
            @PathVariable String productId,
            Authentication authentication) {
        String userId = authentication.getName();
        productReviewService.deleteReview(userId, productId);
        return ApiResponse.success(null);
    }

    /**
     * 商家创建或更新回复
     */
    @PostMapping("/review/{reviewId}/reply")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<ReviewReplyDTO> upsertReply(
            @PathVariable String reviewId,
            @Valid @RequestBody UpsertReviewReplyRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        ReviewReplyDTO result = productReviewService.upsertReply(merchantId, reviewId, request);
        return ApiResponse.success(result);
    }

    /**
     * 商家删除回复
     */
    @DeleteMapping("/review/{reviewId}/reply")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<Void> deleteReply(
            @PathVariable String reviewId,
            Authentication authentication) {
        String merchantId = authentication.getName();
        productReviewService.deleteReply(merchantId, reviewId);
        return ApiResponse.success(null);
    }
}

