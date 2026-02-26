package com.smartmall.interfaces.dto.mallbuilder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 更新项目请求
 */
@Data
public class UpdateProjectRequest {
    
    @NotBlank(message = "项目名称不能为空")
    private String name;
    
    private String description;
    
    @NotNull(message = "商城轮廓不能为空")
    @Valid
    private OutlineDTO outline;
    
    @Valid
    private SettingsDTO settings;
    
    @Valid
    private List<FloorDTO> floors;

    /**
     * 项目元数据（扩展字段）
     * 可用于存储导航等附加信息，如:
     * metadata.navigation.verticalConnections
     */
    private Map<String, Object> metadata;
    
    /**
     * 当前版本号（用于乐观锁）
     */
    private Integer version;
}
