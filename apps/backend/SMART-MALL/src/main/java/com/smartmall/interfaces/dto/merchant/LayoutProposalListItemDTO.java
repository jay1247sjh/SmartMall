package com.smartmall.interfaces.dto.merchant;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 建模提案列表项
 */
@Data
public class LayoutProposalListItemDTO {

    private String proposalId;

    private String areaId;

    private String areaName;

    private String floorName;

    private String merchantId;

    private String merchantName;

    private String status;

    private String submitNote;

    private String rejectReason;

    private Integer objectCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime reviewedAt;
}

