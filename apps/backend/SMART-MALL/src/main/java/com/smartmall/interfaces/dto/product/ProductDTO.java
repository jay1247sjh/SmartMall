package com.smartmall.interfaces.dto.product;

import com.smartmall.domain.enums.ProductStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 商品 DTO
 */
@Data
public class ProductDTO {
    
    /**
     * 商品ID
     */
    private String productId;
    
    /**
     * 店铺ID
     */
    private String storeId;
    
    /**
     * 店铺名称
     */
    private String storeName;
    
    /**
     * 商品名称
     */
    private String name;
    
    /**
     * 商品描述
     */
    private String description;
    
    /**
     * 价格
     */
    private BigDecimal price;
    
    /**
     * 原价
     */
    private BigDecimal originalPrice;
    
    /**
     * 库存
     */
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
     * 商品状态
     */
    private ProductStatus status;
    
    /**
     * 排序
     */
    private Integer sortOrder;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
