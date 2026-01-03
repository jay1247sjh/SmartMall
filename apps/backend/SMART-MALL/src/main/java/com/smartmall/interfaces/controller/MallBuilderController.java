package com.smartmall.interfaces.controller;

import com.smartmall.application.service.MallBuilderService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.mallbuilder.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 商城建模器接口
 */
@Tag(name = "商城建模器", description = "商城项目的创建、查询、更新、删除")
@RestController
@RequestMapping("/mall-builder/projects")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class MallBuilderController {
    
    private final MallBuilderService mallBuilderService;
    
    @Operation(summary = "创建项目")
    @PostMapping
    public ApiResponse<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        String userId = getCurrentUserId();
        ProjectResponse response = mallBuilderService.createProject(request, userId);
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "获取项目列表")
    @GetMapping
    public ApiResponse<List<ProjectListItem>> getProjectList() {
        String userId = getCurrentUserId();
        List<ProjectListItem> list = mallBuilderService.getProjectList(userId);
        return ApiResponse.success(list);
    }
    
    @Operation(summary = "获取项目详情")
    @GetMapping("/{projectId}")
    public ApiResponse<ProjectResponse> getProject(@PathVariable String projectId) {
        ProjectResponse response = mallBuilderService.getProjectById(projectId);
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "更新项目")
    @PutMapping("/{projectId}")
    public ApiResponse<ProjectResponse> updateProject(
            @PathVariable String projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        String userId = getCurrentUserId();
        ProjectResponse response = mallBuilderService.updateProject(projectId, request, userId);
        return ApiResponse.success(response);
    }
    
    @Operation(summary = "删除项目")
    @DeleteMapping("/{projectId}")
    public ApiResponse<Void> deleteProject(@PathVariable String projectId) {
        String userId = getCurrentUserId();
        mallBuilderService.deleteProject(projectId, userId);
        return ApiResponse.success();
    }
    
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
