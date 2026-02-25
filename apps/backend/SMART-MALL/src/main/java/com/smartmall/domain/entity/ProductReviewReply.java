package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商品评价回复实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("product_review_reply")
public class ProductReviewReply extends BaseEntity {

    /**
     * 回复ID
     */
    @TableId
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
     * 回复内容
     */
    private String content;
}

