package com.smartmall.domain.enums;

/**
 * 用户订单状态（MVP）
 */
public enum UserOrderStatus {
    /**
     * 已创建
     */
    CREATED,
    /**
     * 已支付
     */
    PAID,
    /**
     * 已取消
     */
    CANCELLED,
    /**
     * 已完成
     */
    COMPLETED
}
