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

    /**
     * 请求模式：INITIAL | REROUTE
     */
    private String requestMode;

    /**
     * 改道原因：OFF_ROUTE | BLOCKED_AHEAD | EVENT_UPDATE | MANUAL_REFRESH
     */
    private String rerouteReason;

    /**
     * 当前路线 ID（用于 changed 判定）
     */
    private String currentRouteId;

    /**
     * 当前路线版本
     */
    private Integer currentRouteVersion;

    /**
     * 客户端已知动态版本
     */
    private String dynamicVersion;

    @Data
    public static class Position {
        private Double x;
        private Double y;
        private Double z;
    }
}
