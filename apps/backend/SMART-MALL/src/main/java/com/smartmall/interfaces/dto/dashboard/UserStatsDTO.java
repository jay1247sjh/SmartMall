package com.smartmall.interfaces.dto.dashboard;

import lombok.Data;

/**
 * 普通用户仪表盘统计 DTO
 */
@Data
public class UserStatsDTO {

    /**
     * 收藏店铺数
     */
    private long favoriteStoreCount;

    /**
     * 浏览记录数
     */
    private long browseHistoryCount;

    /**
     * 订单总数
     */
    private long orderCount;

    /**
     * 可用优惠券数
     */
    private long availableCouponCount;
}
