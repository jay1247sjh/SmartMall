package com.smartmall.interfaces.dto.navigation;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * 导航规划响应
 */
@Data
public class NavigationPlanResponse {

    /**
     * 业务是否成功
     */
    private boolean success;

    /**
     * 业务码：
     * OK | PUBLISHED_NOT_FOUND | TARGET_NOT_FOUND | ROUTE_NOT_FOUND | INVALID_REQUEST
     */
    private String code;

    /**
     * 业务描述
     */
    private String message;

    /**
     * 路径结果（成功时返回）
     */
    private RouteData route;

    /**
     * 命中目标信息
     */
    private TargetData target;

    /**
     * 警告信息（非致命）
     */
    private List<String> warnings = new ArrayList<>();

    public static NavigationPlanResponse ok(RouteData route, TargetData target, List<String> warnings) {
        NavigationPlanResponse response = new NavigationPlanResponse();
        response.setSuccess(true);
        response.setCode("OK");
        response.setMessage("路径规划成功");
        response.setRoute(route);
        response.setTarget(target);
        if (warnings != null) {
            response.setWarnings(warnings);
        }
        return response;
    }

    public static NavigationPlanResponse fail(String code, String message) {
        NavigationPlanResponse response = new NavigationPlanResponse();
        response.setSuccess(false);
        response.setCode(code);
        response.setMessage(message);
        response.setWarnings(new ArrayList<>());
        return response;
    }

    @Data
    public static class RouteData {
        private String routeId;
        private Integer routeVersion;
        private String dynamicVersion;
        private Boolean replanned;
        private String replanReason;
        private Boolean changed;
        private List<String> appliedEventIds = new ArrayList<>();
        private List<RouteSegment> segments = new ArrayList<>();
        private List<RouteTransition> transitions = new ArrayList<>();
        private List<String> steps = new ArrayList<>();
        private Double distance;
        private Double eta;
    }

    @Data
    public static class RouteSegment {
        private String floorId;
        private String floorName;
        private List<RoutePoint> points = new ArrayList<>();
    }

    @Data
    public static class RouteTransition {
        private String fromFloorId;
        private String fromFloorName;
        private String toFloorId;
        private String toFloorName;
        private String type;
        private String connectionAreaId;
        private String connectionId;
        private RoutePoint position;
    }

    @Data
    public static class RoutePoint {
        private String floorId;
        private Double x;
        private Double y;
        private Double z;
    }

    @Data
    public static class TargetData {
        private String targetType;
        private String targetId;
        private String targetName;
        private String floorId;
        private String floorName;
        private RoutePoint position;
        private String areaId;
    }
}
