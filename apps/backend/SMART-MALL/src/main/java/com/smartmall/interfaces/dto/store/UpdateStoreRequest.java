package com.smartmall.interfaces.dto.store;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新店铺请求
 */
@Data
public class UpdateStoreRequest {
    
    /**
     * 店铺名称
     */
    @Size(max = 100, message = "店铺名称不能超过100个字符")
    private String name;
    
    /**
     * 店铺描述
     */
    private String description;
    
    /**
     * 店铺分类
     */
    private String category;
    
    /**
     * 营业时间
     */
    private String businessHours;
    
    /**
     * Logo URL
     */
    private String logo;
    
    /**
     * 封面图 URL
     */
    private String cover;
}
