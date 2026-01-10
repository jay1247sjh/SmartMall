package com.smartmall.interfaces.dto.product;

import com.smartmall.domain.enums.ProductStatus;
import lombok.Data;

/**
 * 商品查询请求
 */
@Data
public class ProductQueryRequest {
    
    /**
     * 状态筛选
     */
    private ProductStatus status;
    
    /**
     * 分类筛选
     */
    private String category;
    
    /**
     * 页码（从1开始）
     */
    private Integer page = 1;
    
    /**
     * 每页数量
     */
    private Integer size = 10;
}
