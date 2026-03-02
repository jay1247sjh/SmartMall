package com.smartmall.interfaces.dto.dashboard;

import lombok.Data;

import java.time.LocalDate;

/**
 * 用户趋势点位 DTO
 */
@Data
public class UserTrendPointDTO {

    /**
     * 日期
     */
    private LocalDate date;

    /**
     * 浏览数
     */
    private long browseCount;

    /**
     * 订单数
     */
    private long orderCount;

    /**
     * 收藏数
     */
    private long favoriteCount;
}
