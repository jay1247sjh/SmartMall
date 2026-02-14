package com.smartmall.interfaces.controller;

import com.smartmall.application.service.MallBuilderService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.mallbuilder.ProjectResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @Operation(summary = "获取已发布的商城项目")
    @GetMapping("/published")
    public ApiResponse<ProjectResponse> getPublishedMall() {
        ProjectResponse response = mallBuilderService.getPublishedMall();
        return ApiResponse.success(response);
    }
}
