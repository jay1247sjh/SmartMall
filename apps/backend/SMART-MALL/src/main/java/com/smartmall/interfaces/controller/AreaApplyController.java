package com.smartmall.interfaces.controller;

import com.smartmall.application.service.AreaApplyService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.permission.AreaApplyDTO;
import com.smartmall.interfaces.dto.permission.AreaApplyRequest;
import com.smartmall.interfaces.dto.permission.AvailableAreaDTO;
import com.smartmall.interfaces.dto.permission.RejectRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 区域权限申请控制器
 */
@RestController
@RequiredArgsConstructor
public class AreaApplyController {
    
    private final AreaApplyService areaApplyService;
    
    /**
     * 获取可申请的区域列表
     */
    @GetMapping("/area/available")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<List<AvailableAreaDTO>> getAvailableAreas(
            @RequestParam(required = false) String floorId) {
        List<AvailableAreaDTO> areas = areaApplyService.getAvailableAreas(floorId);
        return ApiResponse.success(areas);
    }
    
    /**
     * 提交区域权限申请
     */
    @PostMapping("/area/apply")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<AreaApplyDTO> submitApplication(
            @Valid @RequestBody AreaApplyRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        AreaApplyDTO result = areaApplyService.submitApplication(request, merchantId);
        return ApiResponse.success(result);
    }
    
    /**
     * 查询我的申请列表
     */
    @GetMapping("/area/apply/my")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<List<AreaApplyDTO>> getMyApplications(Authentication authentication) {
        String merchantId = authentication.getName();
        List<AreaApplyDTO> applies = areaApplyService.getMerchantApplications(merchantId);
        return ApiResponse.success(applies);
    }
    
    /**
     * 获取待审批申请列表（管理员）
     */
    @GetMapping("/admin/area/apply/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<AreaApplyDTO>> getPendingApplications() {
        List<AreaApplyDTO> applies = areaApplyService.getPendingApplications();
        return ApiResponse.success(applies);
    }
    
    /**
     * 审批通过（管理员）
     */
    @PostMapping("/admin/area/apply/{applyId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> approveApplication(
            @PathVariable String applyId,
            Authentication authentication) {
        String adminId = authentication.getName();
        areaApplyService.approveApplication(applyId, adminId);
        return ApiResponse.success(null);
    }
    
    /**
     * 审批驳回（管理员）
     */
    @PostMapping("/admin/area/apply/{applyId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> rejectApplication(
            @PathVariable String applyId,
            @Valid @RequestBody RejectRequest request,
            Authentication authentication) {
        String adminId = authentication.getName();
        areaApplyService.rejectApplication(applyId, adminId, request.getReason());
        return ApiResponse.success(null);
    }
}
