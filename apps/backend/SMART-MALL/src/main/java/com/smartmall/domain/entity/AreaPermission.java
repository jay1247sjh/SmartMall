package com.smartmall.domain.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.smartmall.domain.enums.PermissionStatus;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 区域权限实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("area_permission")
public class AreaPermission extends BaseEntity {
    
    /**
     * 权限ID
     */
    @TableId
    private String permissionId;
    
    /**
     * 区域ID
     */
    private String areaId;
    
    /**
     * 商家ID
     */
    private String merchantId;
    
    /**
     * 权限状态
     */
    private PermissionStatus status;
    
    /**
     * 授权时间
     */
    private LocalDateTime grantedAt;
    
    /**
     * 撤销时间
     */
    private LocalDateTime revokedAt;
    
    /**
     * 撤销人ID
     */
    private String revokedBy;
    
    /**
     * 撤销理由
     */
    private String revokeReason;
}
