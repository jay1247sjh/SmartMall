package com.smartmall.interfaces.dto.mallbuilder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 创建项目请求
 */
@Data
public class CreateProjectRequest {
    
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
}
