package com.smartmall.interfaces.dto.product;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 商品评分聚合查询结果
 */
@Data
public class ProductRatingAggregateRow {

    private BigDecimal ratingAvg;
    private Integer ratingCount;
}

