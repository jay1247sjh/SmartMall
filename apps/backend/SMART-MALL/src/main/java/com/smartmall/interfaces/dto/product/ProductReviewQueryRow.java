package com.smartmall.interfaces.dto.product;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品评价查询行（Mapper 投影）
 */
@Data
public class ProductReviewQueryRow {

    private String reviewId;
    private String productId;
    private String storeId;
    private String userId;
    private String userName;
    private Integer rating;
    private String content;
    private LocalDateTime reviewCreatedAt;
    private LocalDateTime reviewUpdatedAt;

    private String replyId;
    private String merchantId;
    private String merchantName;
    private String replyContent;
    private LocalDateTime replyCreatedAt;
    private LocalDateTime replyUpdatedAt;
}

