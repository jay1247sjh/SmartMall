package com.smartmall.interfaces.dto.permission;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 区域权限 DTO
 */
@Data
public class AreaPermissionDTO {
    
    /**
     * 权限ID
     */
    private String permissionId;
    
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
     * 区域边界（JSONB shape 数据）
     */
    private Object areaBoundaries;
    
    /**
     * 权限状态
     */
    private String status;
    
    /**
     * 区域状态（AVAILABLE, PENDING, AUTHORIZED, OCCUPIED 等）
     */
    private String areaStatus;
    
    /**
     * 授权时间
     */
    private LocalDateTime grantedAt;
}
