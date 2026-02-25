package com.smartmall.interfaces.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 创建用户订单请求（MVP）
 */
@Data
public class CreateUserOrderRequest {

    @Schema(description = "店铺ID，可为空（MVP支持）", example = "123456789")
    private String storeId;

    @Schema(description = "订单金额，可为空，默认 99", example = "99.00")
    @DecimalMin(value = "0.01", message = "订单金额必须大于0")
    private BigDecimal totalAmount;
}
