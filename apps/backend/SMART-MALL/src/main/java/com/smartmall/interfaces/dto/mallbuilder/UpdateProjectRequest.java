package com.smartmall.interfaces.dto.mallbuilder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

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
     * 当前版本号（用于乐观锁）
     */
    private Integer version;
}
