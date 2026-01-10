package com.smartmall.interfaces.dto.product;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 更新商品请求
 */
@Data
public class UpdateProductRequest {
    
    /**
     * 商品名称
     */
    @Size(max = 100, message = "商品名称不能超过100个字符")
    private String name;
    
    /**
     * 商品描述
     */
    private String description;
    
    /**
     * 价格
     */
    @DecimalMin(value = "0", message = "价格不能为负数")
    private BigDecimal price;
    
    /**
     * 原价
     */
    @DecimalMin(value = "0", message = "原价不能为负数")
    private BigDecimal originalPrice;
    
    /**
     * 库存
     */
    @Min(value = 0, message = "库存不能为负数")
    private Integer stock;
    
    /**
     * 分类
     */
    private String category;
    
    /**
     * 主图URL
     */
    private String image;
    
    /**
     * 图片列表
     */
    private List<String> images;
    
    /**
     * 排序
     */
    private Integer sortOrder;
}
