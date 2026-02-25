package com.smartmall.interfaces.dto.user;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户优惠券响应 DTO（MVP）
 */
@Data
public class UserCouponDTO {

    private String couponId;

    private String couponName;

    private String discountType;

    private BigDecimal discountValue;

    private String status;

    private LocalDateTime expiresAt;

    private LocalDateTime usedAt;
}
