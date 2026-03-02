package com.smartmall.interfaces.dto.dashboard;

import lombok.Data;

import java.util.List;

/**
 * 用户趋势统计 DTO
 */
@Data
public class UserTrendStatsDTO {

    /**
     * 统计天数
     */
    private int days;

    /**
     * 趋势点位列表（按日期升序）
     */
    private List<UserTrendPointDTO> points;
}
