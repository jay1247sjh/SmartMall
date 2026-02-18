package com.smartmall.interfaces.dto.dashboard;

import lombok.Data;

/**
 * 商家统计数据 DTO
 */
@Data
public class MerchantStatsDTO {

    /**
     * 店铺数量
     */
    private long storeCount;

    /**
     * 商品总数
     */
    private long productCount;

    /**
     * 待处理申请数
     */
    private long pendingApplications;
}
