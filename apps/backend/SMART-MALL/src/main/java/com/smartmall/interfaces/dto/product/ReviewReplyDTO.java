package com.smartmall.interfaces.dto.product;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品评价回复 DTO
 */
@Data
public class ReviewReplyDTO {

    /**
     * 回复ID
     */
    private String replyId;

    /**
     * 评价ID
     */
    private String reviewId;

    /**
     * 商家ID
     */
    private String merchantId;

    /**
     * 商家用户名
     */
    private String merchantName;

    /**
     * 回复内容
     */
    private String content;

    /**
     * 回复创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 回复更新时间
     */
    private LocalDateTime updatedAt;
}

