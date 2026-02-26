package com.smartmall.interfaces.dto.mallbuilder;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 项目详情响应
 */
@Data
public class ProjectResponse {
    
    private String projectId;
    
    private String name;
    
    private String description;
    
    private OutlineDTO outline;
    
    private SettingsDTO settings;

    /**
     * 项目元数据（扩展字段）
     */
    private Map<String, Object> metadata;
    
    private List<FloorResponse> floors;
    
    private Integer version;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
