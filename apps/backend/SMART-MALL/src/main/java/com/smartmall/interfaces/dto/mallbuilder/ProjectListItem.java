package com.smartmall.interfaces.dto.mallbuilder;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 项目列表项
 */
@Data
public class ProjectListItem {
    
    private String projectId;
    
    private String name;
    
    private String description;
    
    private Integer floorCount;
    
    private Integer areaCount;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
