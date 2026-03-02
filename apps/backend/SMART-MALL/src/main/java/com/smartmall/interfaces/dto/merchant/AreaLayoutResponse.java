package com.smartmall.interfaces.dto.merchant;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商家区域布局查询响应
 */
@Data
public class AreaLayoutResponse {

    /**
     * 数据来源：
     * PROPOSAL - 提案草稿/待审数据
     * AREA - 区域已生效数据
     * EMPTY - 无数据
     */
    private String source;

    private String proposalId;

    private String proposalStatus;

    private String rejectReason;

    private LocalDateTime updatedAt;

    private StoreLayoutResponse.StoreLayoutData layoutData;
}

