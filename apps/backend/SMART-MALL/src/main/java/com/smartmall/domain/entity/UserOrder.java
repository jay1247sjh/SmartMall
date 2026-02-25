package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.domain.enums.UserOrderStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 用户订单实体（MVP）
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("user_order")
public class UserOrder extends BaseEntity {

    /**
     * 订单ID
     */
    @TableId
    private String orderId;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 店铺ID（MVP 可为空）
     */
    private String storeId;

    /**
     * 订单状态
     */
    private UserOrderStatus status;

    /**
     * 订单金额
     */
    @TableField("total_amount")
    private BigDecimal totalAmount;
}
