package com.smartmall.interfaces.dto.product;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 创建商品请求
 */
@Data
public class CreateProductRequest {
    
    /**
     * 店铺ID
     */
    @NotBlank(message = "店铺ID不能为空")
    private String storeId;
    
    /**
     * 商品名称
     */
    @NotBlank(message = "商品名称不能为空")
    @Size(max = 100, message = "商品名称不能超过100个字符")
    private String name;
    
    /**
     * 商品描述
     */
    private String description;
    
    /**
     * 价格
     */
    @NotNull(message = "价格不能为空")
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
    @NotNull(message = "库存不能为空")
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
