package com.smartmall.interfaces.controller;

import com.smartmall.application.service.DashboardService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.dashboard.AdminStatsDTO;
import com.smartmall.interfaces.dto.dashboard.MerchantStatsDTO;
import com.smartmall.interfaces.dto.dashboard.NoticeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 仪表盘控制器
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * 获取管理员统计数据
     */
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminStatsDTO> getAdminStats() {
        return ApiResponse.success(dashboardService.getAdminStats());
    }

    /**
     * 获取商家统计数据
     */
    @GetMapping("/merchant/stats")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<MerchantStatsDTO> getMerchantStats(Authentication authentication) {
        String merchantId = authentication.getName();
        return ApiResponse.success(dashboardService.getMerchantStats(merchantId));
    }

    /**
     * 获取系统公告列表
     */
    @GetMapping("/notices")
    public ApiResponse<List<NoticeDTO>> getNotices(@RequestParam(value = "limit", defaultValue = "5") int limit) {
        return ApiResponse.success(dashboardService.getNotices(limit));
    }
}
