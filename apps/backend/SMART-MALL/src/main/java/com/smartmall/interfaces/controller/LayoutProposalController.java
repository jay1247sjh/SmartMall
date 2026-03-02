package com.smartmall.interfaces.controller;

import com.smartmall.application.service.LayoutProposalService;
import com.smartmall.common.response.ApiResponse;
import com.smartmall.interfaces.dto.merchant.LayoutProposalDetailDTO;
import com.smartmall.interfaces.dto.merchant.LayoutProposalListItemDTO;
import com.smartmall.interfaces.dto.merchant.RejectLayoutProposalRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 建模提案审核控制器（管理员）
 */
@Tag(name = "建模提案审核", description = "管理员审核商家区域建模提案")
@RestController
@RequestMapping("/admin/layout-proposals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LayoutProposalController {

    private final LayoutProposalService layoutProposalService;

    @Operation(summary = "获取待审核提案列表")
    @GetMapping("/pending")
    public ApiResponse<List<LayoutProposalListItemDTO>> getPendingProposals() {
        return ApiResponse.success(layoutProposalService.getPendingProposals());
    }

    @Operation(summary = "获取提案详情")
    @GetMapping("/{proposalId}")
    public ApiResponse<LayoutProposalDetailDTO> getProposalDetail(@PathVariable String proposalId) {
        return ApiResponse.success(layoutProposalService.getProposalDetail(proposalId));
    }

    @Operation(summary = "审核通过提案")
    @PostMapping("/{proposalId}/approve")
    public ApiResponse<Void> approveProposal(
            @PathVariable String proposalId,
            Authentication authentication) {
        String adminId = authentication.getName();
        layoutProposalService.approveProposal(proposalId, adminId);
        return ApiResponse.success();
    }

    @Operation(summary = "审核驳回提案")
    @PostMapping("/{proposalId}/reject")
    public ApiResponse<Void> rejectProposal(
            @PathVariable String proposalId,
            @Valid @RequestBody RejectLayoutProposalRequest request,
            Authentication authentication) {
        String adminId = authentication.getName();
        layoutProposalService.rejectProposal(proposalId, request.getReason(), adminId);
        return ApiResponse.success();
    }
}

