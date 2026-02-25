package com.smartmall.interfaces.dto.user;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户订单响应 DTO（MVP）
 */
@Data
public class UserOrderDTO {

    private String orderId;

    private String storeId;

    private String status;

    private BigDecimal totalAmount;

    private LocalDateTime createdAt;
}
