package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 商品评价实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("product_review")
public class ProductReview extends BaseEntity {

    /**
     * 评价ID
     */
    @TableId
    private String reviewId;

    /**
     * 商品ID
     */
    private String productId;

    /**
     * 店铺ID
     */
    private String storeId;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 评分（1-5）
     */
    private Integer rating;

    /**
     * 评价内容
     */
    private String content;
}

