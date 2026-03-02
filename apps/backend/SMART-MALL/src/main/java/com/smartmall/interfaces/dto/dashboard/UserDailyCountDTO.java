package com.smartmall.interfaces.dto.dashboard;

import lombok.Data;

import java.time.LocalDate;

/**
 * 用户每日计数 DTO（内部聚合结果）
 */
@Data
public class UserDailyCountDTO {

    /**
     * 统计日期
     */
    private LocalDate day;

    /**
     * 统计总数
     */
    private long total;
}
