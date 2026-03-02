package com.smartmall.interfaces.dto.navigation;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class UpdateNavigationDynamicEventRequest {

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

    @DecimalMin(value = "1.0", message = "costMultiplier 不能小于 1.0")
    private BigDecimal costMultiplier;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    /**
     * ACTIVE | INACTIVE | EXPIRED
     */
    private String status;

    private String reason;
}

