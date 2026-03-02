package com.smartmall.interfaces.controller;

import com.smartmall.application.service.MerchantAreaService;
import com.smartmall.application.service.LayoutProposalService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.merchant.AILayoutRequest;
import com.smartmall.interfaces.dto.merchant.AreaLayoutResponse;
import com.smartmall.interfaces.dto.merchant.LayoutProposalListItemDTO;
import com.smartmall.interfaces.dto.merchant.SaveLayoutDraftRequest;
import com.smartmall.interfaces.dto.merchant.StoreLayoutResponse;
import com.smartmall.interfaces.dto.merchant.SubmitLayoutProposalRequest;
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
    private final LayoutProposalService layoutProposalService;

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

    @Operation(summary = "获取商家区域布局（草稿优先）")
    @GetMapping("/{areaId}/layout")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<AreaLayoutResponse> getAreaLayout(
            @PathVariable String areaId,
            Authentication authentication) {
        String merchantId = authentication.getName();
        AreaLayoutResponse response = layoutProposalService.getAreaLayout(areaId, merchantId);
        return ApiResponse.success(response);
    }

    @Operation(summary = "保存商家建模草稿")
    @PutMapping("/{areaId}/layout/draft")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<LayoutProposalListItemDTO> saveLayoutDraft(
            @PathVariable String areaId,
            @Valid @RequestBody SaveLayoutDraftRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        LayoutProposalListItemDTO response = layoutProposalService.saveDraft(
                areaId, request.getLayoutData(), merchantId
        );
        return ApiResponse.success(response);
    }

    @Operation(summary = "提交商家建模提案")
    @PostMapping("/{areaId}/layout/submit")
    @PreAuthorize("hasRole('MERCHANT')")
    public ApiResponse<LayoutProposalListItemDTO> submitLayoutProposal(
            @PathVariable String areaId,
            @Valid @RequestBody SubmitLayoutProposalRequest request,
            Authentication authentication) {
        String merchantId = authentication.getName();
        LayoutProposalListItemDTO response = layoutProposalService.submitProposal(
                areaId, request.getLayoutData(), request.getSubmitNote(), merchantId
        );
        return ApiResponse.success(response);
    }
}
