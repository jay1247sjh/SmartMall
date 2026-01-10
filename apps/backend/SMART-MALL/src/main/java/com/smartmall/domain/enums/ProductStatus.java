package com.smartmall.domain.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;

/**
 * 商品状态枚举
 */
@Getter
public enum ProductStatus {
    
    /**
     * 在售
     */
    ON_SALE("ON_SALE", "在售"),
    
    /**
     * 下架
     */
    OFF_SALE("OFF_SALE", "下架"),
    
    /**
     * 售罄
     */
    SOLD_OUT("SOLD_OUT", "售罄");
    
    @EnumValue
    private final String code;
    private final String description;
    
    ProductStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }
}
