package com.smartmall.interfaces.controller;

import com.smartmall.application.service.navigation.NavigationDynamicEventService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.navigation.CreateNavigationDynamicEventRequest;
import com.smartmall.interfaces.dto.navigation.NavigationDynamicEventDTO;
import com.smartmall.interfaces.dto.navigation.UpdateNavigationDynamicEventRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "导航动态事件", description = "管理端动态路况事件（封闭/拥堵）")
@RestController
@RequestMapping("/mall/navigation/dynamic-events")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class NavigationDynamicEventController {

    private final NavigationDynamicEventService navigationDynamicEventService;

    @Operation(summary = "创建动态事件")
    @PostMapping
    public ApiResponse<NavigationDynamicEventDTO> create(
            @Valid @RequestBody CreateNavigationDynamicEventRequest request,
            Authentication authentication
    ) {
        String operatorId = authentication.getName();
        return ApiResponse.success(navigationDynamicEventService.create(request, operatorId));
    }

    @Operation(summary = "更新动态事件")
    @PutMapping("/{eventId}")
    public ApiResponse<NavigationDynamicEventDTO> update(
            @PathVariable String eventId,
            @Valid @RequestBody UpdateNavigationDynamicEventRequest request
    ) {
        return ApiResponse.success(navigationDynamicEventService.update(eventId, request));
    }

    @Operation(summary = "失效动态事件")
    @DeleteMapping("/{eventId}")
    public ApiResponse<Void> deactivate(@PathVariable String eventId) {
        navigationDynamicEventService.deactivate(eventId);
        return ApiResponse.success();
    }

    @Operation(summary = "查询动态事件列表")
    @GetMapping
    public ApiResponse<List<NavigationDynamicEventDTO>> list(
            @RequestParam(required = false) String projectId
    ) {
        return ApiResponse.success(navigationDynamicEventService.listByProject(projectId));
    }
}

