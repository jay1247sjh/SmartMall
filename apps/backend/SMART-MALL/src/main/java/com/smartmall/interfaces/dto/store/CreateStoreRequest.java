package com.smartmall.interfaces.dto.store;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建店铺请求
 */
@Data
public class CreateStoreRequest {
    
    /**
     * 区域ID
     */
    @NotBlank(message = "区域ID不能为空")
    private String areaId;
    
    /**
     * 店铺名称
     */
    @NotBlank(message = "店铺名称不能为空")
    @Size(max = 100, message = "店铺名称不能超过100个字符")
    private String name;
    
    /**
     * 店铺描述
     */
    private String description;
    
    /**
     * 店铺分类
     */
    @NotBlank(message = "店铺分类不能为空")
    private String category;
    
    /**
     * 营业时间
     */
    private String businessHours;
}
