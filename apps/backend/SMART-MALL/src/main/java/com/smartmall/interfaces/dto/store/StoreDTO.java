package com.smartmall.interfaces.dto.store;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 店铺响应 DTO
 */
@Data
public class StoreDTO {
    
    /**
     * 店铺ID
     */
    private String storeId;
    
    /**
     * 区域ID
     */
    private String areaId;
    
    /**
     * 区域名称
     */
    private String areaName;
    
    /**
     * 楼层ID
     */
    private String floorId;
    
    /**
     * 楼层名称
     */
    private String floorName;
    
    /**
     * 商家ID
     */
    private String merchantId;
    
    /**
     * 商家名称
     */
    private String merchantName;
    
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
    private String status;
    
    /**
     * 关闭原因
     */
    private String closeReason;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 审批时间
     */
    private LocalDateTime approvedAt;
}
