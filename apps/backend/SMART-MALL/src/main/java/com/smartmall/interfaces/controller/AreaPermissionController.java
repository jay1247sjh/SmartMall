package com.smartmall.interfaces.controller;

import com.smartmall.application.service.AreaPermissionService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.permission.AreaPermissionDTO;
import com.smartmall.interfaces.dto.permission.RevokeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 区域权限控制器
 */
@RestController
@RequiredArgsConstructor
public class AreaPermissionController {
    
    private final AreaPermissionService areaPermissionService;
    
    /**
     * 查询我的权限列表
     */
    @GetMapping("/area/permission/my")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<List<AreaPermissionDTO>> getMyPermissions(Authentication authentication) {
        String merchantId = authentication.getName();
        List<AreaPermissionDTO> permissions = areaPermissionService.getMerchantPermissions(merchantId);
        return ApiResponse.success(permissions);
    }
    
    /**
     * 撤销权限（管理员）
     */
    @PostMapping("/admin/area/permission/{permissionId}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> revokePermission(
            @PathVariable String permissionId,
            @Valid @RequestBody RevokeRequest request,
            Authentication authentication) {
        String adminId = authentication.getName();
        areaPermissionService.revokePermission(permissionId, adminId, request.getReason());
        return ApiResponse.success(null);
    }
}
