package com.smartmall.domain.enums;

/**
 * 建模提案状态
 */
public enum LayoutProposalStatus {
    DRAFT("DRAFT"),
    PENDING_REVIEW("PENDING_REVIEW"),
    APPROVED("APPROVED"),
    REJECTED("REJECTED");

    private final String value;

    LayoutProposalStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}

