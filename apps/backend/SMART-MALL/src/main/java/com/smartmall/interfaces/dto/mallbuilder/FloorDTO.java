package com.smartmall.interfaces.dto.mallbuilder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 楼层 DTO
 */
@Data
public class FloorDTO {
    
    private String floorId;
    
    @NotBlank(message = "楼层名称不能为空")
    private String name;
    
    @NotNull(message = "楼层编号不能为空")
    private Integer level;
    
    private BigDecimal height = new BigDecimal("4");
    
    private OutlineDTO shape;
    
    private Boolean inheritOutline = true;
    
    private String color;
    
    private Boolean visible = true;
    
    private Boolean locked = false;
    
    private Integer sortOrder = 0;
    
    @Valid
    private List<AreaDTO> areas;
}
