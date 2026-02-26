package com.smartmall.interfaces.dto.navigation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 导航规划请求
 */
@Data
public class NavigationPlanRequest {

    /**
     * 目标类型：store | area | facility
     */
    @NotBlank(message = "targetType 不能为空")
    private String targetType;

    /**
     * 目标关键词（店铺名/区域名）
     */
    @NotBlank(message = "targetKeyword 不能为空")
    private String targetKeyword;

    /**
     * 起点楼层 ID（可选）
     */
    private String sourceFloorId;

    /**
     * 起点坐标（可选）
     */
    @Valid
    private Position sourcePosition;

    @Data
    public static class Position {
        private Double x;
        private Double y;
        private Double z;
    }
}
