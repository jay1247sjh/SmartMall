package com.smartmall.interfaces.controller;

import com.smartmall.application.service.LayoutVersionService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.mallbuilder.ProjectResponse;
import com.smartmall.interfaces.dto.version.LayoutVersionListItem;
import com.smartmall.interfaces.dto.version.UpdateVersionRequest;
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
 * 布局版本管理接口
 */
@Tag(name = "布局版本管理", description = "商城布局版本的查询、激活、恢复、删除")
@RestController
@RequestMapping("/mall/versions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LayoutVersionController {

    private final LayoutVersionService layoutVersionService;

    @Operation(summary = "获取版本列表")
    @GetMapping
    public ApiResponse<List<LayoutVersionListItem>> getVersionList() {
        return ApiResponse.success(layoutVersionService.getVersionList());
    }

    @Operation(summary = "获取版本快照")
    @GetMapping("/{versionId}/snapshot")
    public ApiResponse<ProjectResponse> getVersionSnapshot(@PathVariable String versionId) {
        return ApiResponse.success(layoutVersionService.getVersionSnapshot(versionId));
    }

    @Operation(summary = "更新版本描述")
    @PutMapping("/{versionId}")
    public ApiResponse<LayoutVersionListItem> updateVersion(
            @PathVariable String versionId,
            @Valid @RequestBody UpdateVersionRequest request) {
        return ApiResponse.success(layoutVersionService.updateDescription(versionId, request.getDescription()));
    }

    @Operation(summary = "激活版本")
    @PostMapping("/{versionId}/activate")
    public ApiResponse<LayoutVersionListItem> activateVersion(@PathVariable String versionId) {
        return ApiResponse.success(layoutVersionService.activateVersion(versionId));
    }

    @Operation(summary = "恢复为新草稿")
    @PostMapping("/{versionId}/restore")
    public ApiResponse<ProjectResponse> restoreVersion(@PathVariable String versionId) {
        String userId = getCurrentUserId();
        return ApiResponse.success(layoutVersionService.restoreAsDraft(versionId, userId));
    }

    @Operation(summary = "删除版本")
    @DeleteMapping("/{versionId}")
    public ApiResponse<Void> deleteVersion(@PathVariable String versionId) {
        layoutVersionService.deleteVersion(versionId);
        return ApiResponse.success();
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
