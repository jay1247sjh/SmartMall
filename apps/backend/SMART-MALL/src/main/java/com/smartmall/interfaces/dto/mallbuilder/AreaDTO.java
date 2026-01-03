package com.smartmall.interfaces.dto.mallbuilder;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

/**
 * 区域 DTO
 */
@Data
public class AreaDTO {
    
    private String areaId;
    
    @NotBlank(message = "区域名称不能为空")
    private String name;
    
    @NotBlank(message = "区域类型不能为空")
    private String type;
    
    @NotNull(message = "区域形状不能为空")
    private OutlineDTO shape;
    
    private String color;
    
    private Map<String, Object> properties;
    
    private String merchantId;
    
    private Map<String, Object> rental;
    
    private Boolean visible = true;
    
    private Boolean locked = false;
}
