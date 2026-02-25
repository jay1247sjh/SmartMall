package com.smartmall.interfaces.dto.product;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

/**
 * 商品评分汇总 DTO
 */
@Data
public class ProductRatingSummaryDTO {

    /**
     * 平均分（5分制）
     */
    private BigDecimal ratingAvg;

    /**
     * 评分总数
     */
    private Integer ratingCount;

    /**
     * 评分分布（key: 1~5分）
     */
    private Map<Integer, Long> ratingBreakdown;
}

