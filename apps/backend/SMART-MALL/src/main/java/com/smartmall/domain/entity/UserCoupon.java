package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.domain.enums.CouponDiscountType;
import com.smartmall.domain.enums.UserCouponStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 用户优惠券实体（MVP）
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user_coupon")
public class UserCoupon extends BaseEntity {

    /**
     * 优惠券ID
     */
    @TableId
    private String couponId;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 优惠券名称
     */
    private String couponName;

    /**
     * 折扣类型
     */
    @TableField("discount_type")
    private CouponDiscountType discountType;

    /**
     * 折扣值
     */
    @TableField("discount_value")
    private BigDecimal discountValue;

    /**
     * 优惠券状态
     */
    private UserCouponStatus status;

    /**
     * 过期时间
     */
    @TableField("expires_at")
    private LocalDateTime expiresAt;

    /**
     * 使用时间
     */
    @TableField("used_at")
    private LocalDateTime usedAt;
}
