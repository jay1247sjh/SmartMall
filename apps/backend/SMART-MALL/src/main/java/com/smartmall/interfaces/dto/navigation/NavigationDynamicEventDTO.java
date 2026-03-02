package com.smartmall.interfaces.dto.navigation;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class NavigationDynamicEventDTO {

    private String eventId;
    private String projectId;
    private String eventType;
    private String scopeType;
    private String scopeId;
    private String severity;
    private BigDecimal costMultiplier;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private String status;
    private String reason;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

