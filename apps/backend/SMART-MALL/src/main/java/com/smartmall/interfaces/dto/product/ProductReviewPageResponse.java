package com.smartmall.interfaces.dto.product;

import lombok.Data;

import java.util.List;

/**
 * 商品评价分页响应
 */
@Data
public class ProductReviewPageResponse {

    /**
     * 评价列表
     */
    private List<ProductReviewDTO> records;

    /**
     * 当前页
     */
    private long page;

    /**
     * 每页大小
     */
    private long size;

    /**
     * 总记录数
     */
    private long total;

    /**
     * 总页数
     */
    private long pages;

    /**
     * 评分汇总
     */
    private ProductRatingSummaryDTO summary;
}

