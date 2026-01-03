package com.smartmall.interfaces.dto.mallbuilder;

import lombok.Data;

import java.util.Map;

/**
 * 项目设置 DTO
 */
@Data
public class SettingsDTO {
    
    private Double gridSize = 1.0;
    
    private Boolean snapToGrid = true;
    
    private Double defaultFloorHeight = 4.0;
    
    private String unit = "meters";
    
    private Map<String, Object> display;
}
