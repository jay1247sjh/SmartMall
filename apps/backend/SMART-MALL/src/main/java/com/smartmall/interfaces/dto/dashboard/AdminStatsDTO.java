package com.smartmall.interfaces.dto.dashboard;

import lombok.Data;

/**
 * 管理员统计数据 DTO
 */
@Data
public class AdminStatsDTO {

    /**
     * 商家总数
     */
    private long merchantCount;

    /**
     * 店铺总数
     */
    private long storeCount;

    /**
     * 待审批数
     */
    private long pendingApprovals;

    /**
     * 今日活跃用户数
     */
    private long todayActiveUsers;
}
