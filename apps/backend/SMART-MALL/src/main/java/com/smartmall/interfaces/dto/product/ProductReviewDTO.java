package com.smartmall.interfaces.dto.product;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品评价 DTO
 */
@Data
public class ProductReviewDTO {

    /**
     * 评价ID
     */
    private String reviewId;

    /**
     * 商品ID
     */
    private String productId;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 用户名
     */
    private String userName;

    /**
     * 评分（1-5）
     */
    private Integer rating;

    /**
     * 评价内容
     */
    private String content;

    /**
     * 评价创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 评价更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 商家回复
     */
    private ReviewReplyDTO merchantReply;
}

