package com.smartmall.interfaces.dto.mallbuilder;

import lombok.Data;

import java.util.Map;

/**
 * 区域响应
 */
@Data
public class AreaResponse {
    
    private String areaId;
    
    private String name;
    
    private String type;
    
    private OutlineDTO shape;
    
    private String color;
    
    private Map<String, Object> properties;
    
    private String merchantId;
    
    private Map<String, Object> rental;
    
    private Boolean visible;
    
    private Boolean locked;
}
