package com.smartmall.interfaces.dto.permission;

import lombok.Data;

/**
 * 可申请区域 DTO
 */
@Data
public class AvailableAreaDTO {
    
    /**
     * 区域ID
     */
    private String areaId;
    
    /**
     * 区域名称
     */
    private String name;
    
    /**
     * 区域类型
     */
    private String type;
    
    /**
     * 楼层ID
     */
    private String floorId;
    
    /**
     * 楼层名称
     */
    private String floorName;
    
    /**
     * 区域状态
     */
    private String status;
    
    /**
     * 区域边界
     */
    private Object shape;
    
    /**
     * 区域属性
     */
    private Object properties;
}
