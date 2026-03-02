package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 导航动态事件（封闭/拥堵）
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("navigation_dynamic_event")
public class NavigationDynamicEvent extends BaseEntity {

    @TableId
    private String eventId;

    private String projectId;

    /**
     * BLOCK | CONGESTION
     */
    private String eventType;

    /**
     * AREA | CONNECTION
     */
    private String scopeType;

    private String scopeId;

    /**
     * LOW | MEDIUM | HIGH
     */
    private String severity;

    private BigDecimal costMultiplier;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    /**
     * ACTIVE | INACTIVE | EXPIRED
     */
    private String status;

    private String reason;

    private String createdBy;
}

