package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.infrastructure.config.PostgresJsonbListTypeHandler;
import com.smartmall.domain.enums.ProductStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

/**
 * 商品实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName(value = "product", autoResultMap = true)
public class Product extends BaseEntity {
    
    /**
     * 商品ID
     */
    @TableId
    private String productId;
    
    /**
     * 店铺ID
     */
    private String storeId;
    
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
     * 图片列表(JSON)
     */
    @TableField(typeHandler = PostgresJsonbListTypeHandler.class)
    private List<String> images;
    
    /**
     * 商品状态
     */
    private ProductStatus status;
    
    /**
     * 排序
     */
    private Integer sortOrder;
}
