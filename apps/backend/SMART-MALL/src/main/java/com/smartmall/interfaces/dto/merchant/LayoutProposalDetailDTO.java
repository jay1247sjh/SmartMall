package com.smartmall.interfaces.dto.merchant;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 建模提案详情
 */
@Data
public class LayoutProposalDetailDTO {

    private String proposalId;

    private String areaId;

    private String areaName;

    private String floorId;

    private String floorName;

    private String merchantId;

    private String merchantName;

    private String status;

    private String submitNote;

    private String rejectReason;

    private Object areaBoundaries;

    private StoreLayoutResponse.StoreLayoutData layoutData;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime reviewedAt;
}

