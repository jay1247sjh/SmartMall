package com.smartmall.interfaces.controller;

import com.smartmall.application.service.MerchantAreaService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.merchant.AILayoutRequest;
import com.smartmall.interfaces.dto.merchant.ApplyLayoutRequest;
import com.smartmall.interfaces.dto.merchant.StoreLayoutResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 商家区域 AI 布局控制器
 *
 * 提供 AI 生成店铺布局和应用布局的端点
 */
@Slf4j
@Tag(name = "商家区域管理", description = "商家 AI 布局生成与应用")
@RestController
@RequestMapping("/merchant/area")
@RequiredArgsConstructor
public class MerchantAreaController {

    private final MerchantAreaService merchantAreaService;

    /**
     * AI 生成店铺布局
     *
     * 校验商家权限 → 获取区域边界 → 调用 Intelligence Service → 返回布局结果
     */
    @Operation(summary = "AI 生成店铺布局")
    @PostMapping("/{areaId}/ai-layout")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<StoreLayoutResponse> generateAILayout(
            @PathVariable String areaId,
            @Valid @RequestBody AILayoutRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        log.info("商家请求 AI 生成布局: merchantId={}, areaId={}, theme={}",
                merchantId, areaId, request.getTheme());

        StoreLayoutResponse response = merchantAreaService.generateAILayout(
                areaId, request.getTheme(), merchantId);
        return ApiResponse.success(response);
    }

    /**
     * 应用 AI 生成的布局
     *
     * 校验商家权限 → 持久化布局数据 → 更新区域状态为 OCCUPIED
     */
    @Operation(summary = "应用 AI 生成的布局")
    @PostMapping("/{areaId}/apply-layout")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<Void> applyLayout(
            @PathVariable String areaId,
            @Valid @RequestBody ApplyLayoutRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        log.info("商家应用布局: merchantId={}, areaId={}", merchantId, areaId);

        merchantAreaService.applyLayout(areaId, request.getLayoutData(), merchantId);
        return ApiResponse.success(null);
    }
}
