package com.smartmall.interfaces.controller;

import com.smartmall.application.service.MallBuilderService;
import com.smartmall.application.service.navigation.NavigationDynamicEventService;
import com.smartmall.application.service.navigation.PublishedNavigationService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.common.response.ResultCode;
import com.smartmall.interfaces.dto.mallbuilder.ProjectResponse;
import com.smartmall.interfaces.dto.navigation.NavigationDynamicVersionResponse;
import com.smartmall.interfaces.dto.navigation.NavigationPlanRequest;
import com.smartmall.interfaces.dto.navigation.NavigationPlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商城公开接口（无需认证）
 */
@Tag(name = "商城公开接口", description = "面向所有用户的商城数据查询")
@RestController
@RequestMapping("/public/mall")
@RequiredArgsConstructor
public class PublicMallController {

    private final MallBuilderService mallBuilderService;
    private final PublishedNavigationService publishedNavigationService;
    private final NavigationDynamicEventService navigationDynamicEventService;

    @Operation(summary = "获取已发布的商城项目")
    @GetMapping("/published")
    public ApiResponse<ProjectResponse> getPublishedMall() {
        ProjectResponse response = mallBuilderService.getPublishedMall();
        if (response == null) {
            return ApiResponse.error(ResultCode.PROJECT_NOT_FOUND, "暂无已发布的商城数据");
        }
        return ApiResponse.success(response);
    }

    @Operation(summary = "已发布商城路径规划")
    @PostMapping("/navigation/plan")
    public ApiResponse<NavigationPlanResponse> planNavigation(
            @Valid @RequestBody NavigationPlanRequest request
    ) {
        NavigationPlanResponse response = publishedNavigationService.plan(request);
        return ApiResponse.success(response);
    }

    @Operation(summary = "获取动态路况版本")
    @GetMapping("/navigation/dynamic-version")
    public ApiResponse<NavigationDynamicVersionResponse> getDynamicVersion(
            @RequestParam(required = false) String projectId
    ) {
        return ApiResponse.success(navigationDynamicEventService.getDynamicVersion(projectId));
    }
}
