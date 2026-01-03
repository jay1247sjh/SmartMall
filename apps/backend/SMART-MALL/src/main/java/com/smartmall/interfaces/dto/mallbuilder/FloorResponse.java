package com.smartmall.interfaces.dto.mallbuilder;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 楼层响应
 */
@Data
public class FloorResponse {
    
    private String floorId;
    
    private String name;
    
    private Integer level;
    
    private BigDecimal height;
    
    private OutlineDTO shape;
    
    private Boolean inheritOutline;
    
    private String color;
    
    private Boolean visible;
    
    private Boolean locked;
    
    private Integer sortOrder;
    
    private List<AreaResponse> areas;
}
