package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.domain.enums.StoreStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 店铺实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("store")
public class Store extends BaseEntity {
    
    /**
     * 店铺ID
     */
    @TableId
    private String storeId;
    
    /**
     * 区域ID
     */
    private String areaId;
    
    /**
     * 商家ID
     */
    private String merchantId;
    
    /**
     * 店铺名称
     */
    private String name;
    
    /**
     * 店铺描述
     */
    private String description;
    
    /**
     * 店铺分类
     */
    private String category;
    
    /**
     * 营业时间
     */
    private String businessHours;
    
    /**
     * Logo URL
     */
    private String logo;
    
    /**
     * 封面图 URL
     */
    private String cover;
    
    /**
     * 店铺状态
     */
    private StoreStatus status;
    
    /**
     * 关闭原因
     */
    private String closeReason;
    
    /**
     * 审批时间
     */
    private LocalDateTime approvedAt;
    
    /**
     * 审批人ID
     */
    private String approvedBy;
}
