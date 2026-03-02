package com.smartmall.interfaces.dto.navigation;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateNavigationDynamicEventRequest {

    @NotBlank(message = "projectId 不能为空")
    private String projectId;

    /**
     * BLOCK | CONGESTION
     */
    @NotBlank(message = "eventType 不能为空")
    private String eventType;

    /**
     * AREA | CONNECTION
     */
    @NotBlank(message = "scopeType 不能为空")
    private String scopeType;

    @NotBlank(message = "scopeId 不能为空")
    private String scopeId;

    /**
     * LOW | MEDIUM | HIGH
     */
    private String severity;

    @DecimalMin(value = "1.0", message = "costMultiplier 不能小于 1.0")
    private BigDecimal costMultiplier;

    @NotNull(message = "startsAt 不能为空")
    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    private String reason;
}

